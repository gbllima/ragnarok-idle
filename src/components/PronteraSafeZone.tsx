import { useEffect, useRef, useState } from 'react'
import { Backpack, Castle, Home, MapPin, Shield, ShoppingBag, Swords, UserRoundCog } from 'lucide-react'
import { getPlayerAnimation } from '../game/playerSprites'
import { playerPortrait } from '../game/assets'

const HUNT_ACTION=/Caçar aqui|Caçada atual|Melhor caçada agora|MVP recomendado/i
const WORLD_W=2200
const WORLD_H=1600
const SPEED=285
const START={x:1100,y:1015}

type Point={x:number;y:number}
type MenuTarget='Inventário'|'Equipamentos'|'Loja'|'Personagem'|'Mapas'
type Interaction={id:string;x:number;y:number;label:string;detail:string;action:MenuTarget}

const interactions:Interaction[]=[
  {id:'kafra',x:825,y:690,label:'Kafra',detail:'Armazém e inventário',action:'Inventário'},
  {id:'shop',x:1380,y:690,label:'Loja de Prontera',detail:'Comprar e vender itens',action:'Loja'},
  {id:'jobs',x:825,y:935,label:'Guia de Classes',detail:'Atributos e evolução',action:'Personagem'},
  {id:'gate',x:1100,y:1390,label:'Portal de Caçadas',detail:'Escolher área de batalha',action:'Mapas'},
]

const gardenCollisions=[
  {x:245,y:215,w:390,h:300},
  {x:1565,y:215,w:390,h:300},
  {x:245,y:1085,w:390,h:285},
  {x:1565,y:1085,w:390,h:285},
]

const lamps=[
  [730,570],[1470,570],[730,1030],[1470,1030],[935,455],[1265,455],[935,1140],[1265,1140],
]
const benches=[[690,800,'v'],[1480,800,'v'],[930,1230,'h'],[1270,1230,'h']]

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)
function direction8(dx:number,dy:number){
  const angle=Math.atan2(dy,dx)
  return ((Math.round((angle+Math.PI)/(Math.PI/4))+2)%8+8)%8
}
function clickMenu(title:string){document.querySelector<HTMLButtonElement>(`.side-menu button[title="${title}"]`)?.click()}
function stopHunt(){const button=document.querySelector<HTMLButtonElement>('.stop-btn');if(button&&!button.classList.contains('paused'))button.click()}
function startHunt(){const button=document.querySelector<HTMLButtonElement>('.stop-btn');if(button&&button.classList.contains('paused'))button.click()}

function canStand(x:number,y:number){
  if(Math.hypot(x-1100,y-800)<118)return false
  if(gardenCollisions.some(g=>x>g.x+18&&x<g.x+g.w-18&&y>g.y+18&&y<g.y+g.h-18))return false
  return true
}

export function PronteraSafeZone(){
  const [active,setActive]=useState(true)
  const [classId,setClassId]=useState('novice')
  const [player,setPlayer]=useState<Point>(START)
  const [camera,setCamera]=useState<Point>({x:0,y:0})
  const [walking,setWalking]=useState(false)
  const [direction,setDirection]=useState(0)
  const [nearby,setNearby]=useState<Interaction|null>(null)
  const playerRef=useRef<Point>(START)
  const targetRef=useRef<Point>(START)
  const cameraRef=useRef<Point>({x:0,y:0})
  const nearbyRef=useRef<Interaction|null>(null)
  const keys=useRef(new Set<string>())
  const viewportRef=useRef<HTMLElement>(null)

  const open=(title:MenuTarget)=>clickMenu(title)
  const interact=()=>{const current=nearbyRef.current;if(current)open(current.action)}

  useEffect(()=>{
    const shell=document.querySelector<HTMLElement>('.game-shell')
    shell?.classList.toggle('safe-zone-active',active)
    if(active)window.setTimeout(stopHunt,0)
    return()=>shell?.classList.remove('safe-zone-active')
  },[active])

  useEffect(()=>{
    const syncClass=()=>{const id=document.querySelector<HTMLElement>('.player-sprite')?.dataset.classId;if(id)setClassId(id)}
    syncClass();const timer=window.setInterval(syncClass,600);return()=>window.clearInterval(timer)
  },[])

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      if(!active)return
      const button=(event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button')
      if(!button||!button.closest('.game-modal')||!HUNT_ACTION.test(button.textContent||''))return
      window.setTimeout(()=>{setActive(false);window.setTimeout(startHunt,80)},0)
    }
    document.addEventListener('click',onClick)
    return()=>document.removeEventListener('click',onClick)
  },[active])

  useEffect(()=>{
    if(!active)return
    const ignored=(target:EventTarget|null)=>!!(target as HTMLElement|null)?.closest('input,textarea,select,button,.game-modal')
    const down=(event:KeyboardEvent)=>{
      if(ignored(event.target))return
      if(event.key.toLowerCase()==='e'){interact();return}
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(event.key)){
        keys.current.add(event.key.toLowerCase());event.preventDefault()
      }
    }
    const up=(event:KeyboardEvent)=>keys.current.delete(event.key.toLowerCase())
    window.addEventListener('keydown',down,{passive:false});window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}
  },[active])

  useEffect(()=>{
    if(!active)return
    let raf=0,last=performance.now(),lastNearby=''
    const frame=(now:number)=>{
      const dt=Math.min(.04,(now-last)/1000);last=now
      const k=keys.current
      let dx=0,dy=0
      if(k.has('arrowleft')||k.has('a'))dx-=1
      if(k.has('arrowright')||k.has('d'))dx+=1
      if(k.has('arrowup')||k.has('w'))dy-=1
      if(k.has('arrowdown')||k.has('s'))dy+=1
      const p=playerRef.current,target=targetRef.current
      if(dx||dy)targetRef.current={...p}
      else{const tx=target.x-p.x,ty=target.y-p.y,d=Math.hypot(tx,ty);if(d>5){dx=tx/d;dy=ty/d}}

      let moving=!!(dx||dy)
      if(moving){
        const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len
        const requested={x:clamp(p.x+dx*SPEED*dt,70,WORLD_W-70),y:clamp(p.y+dy*SPEED*dt,70,WORLD_H-70)}
        let next={...p}
        if(canStand(requested.x,p.y))next.x=requested.x
        if(canStand(next.x,requested.y))next.y=requested.y
        if(next.x===p.x&&next.y===p.y){moving=false;targetRef.current={...p}}
        else{
          playerRef.current=next;setPlayer(next);setDirection(direction8(next.x-p.x,next.y-p.y))
          if(Math.hypot(target.x-next.x,target.y-next.y)<9)targetRef.current={...next}
        }
      }
      setWalking(moving)

      let candidate:Interaction|null=null,best=125
      for(const item of interactions){const d=dist(playerRef.current,item);if(d<best){best=d;candidate=item}}
      const candidateId=candidate?.id||''
      if(candidateId!==lastNearby){lastNearby=candidateId;nearbyRef.current=candidate;setNearby(candidate)}

      const viewport=viewportRef.current
      if(viewport){
        const w=viewport.clientWidth,h=viewport.clientHeight
        const desired={x:clamp(playerRef.current.x-w*.5,0,Math.max(0,WORLD_W-w)),y:clamp(playerRef.current.y-h*.52,0,Math.max(0,WORLD_H-h))}
        const c=cameraRef.current
        const nextCam={x:c.x+(desired.x-c.x)*Math.min(1,dt*8),y:c.y+(desired.y-c.y)*Math.min(1,dt*8)}
        cameraRef.current=nextCam;setCamera(nextCam)
      }
      raf=requestAnimationFrame(frame)
    }
    raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf)
  },[active])

  const moveTo=(event:React.PointerEvent<HTMLElement>)=>{
    if((event.target as HTMLElement).closest('button,.prontera-screen-ui,.prontera-npc'))return
    const rect=viewportRef.current?.getBoundingClientRect();if(!rect)return
    const x=clamp(event.clientX-rect.left+cameraRef.current.x,70,WORLD_W-70)
    const y=clamp(event.clientY-rect.top+cameraRef.current.y,70,WORLD_H-70)
    if(!canStand(x,y))return
    const p=playerRef.current;targetRef.current={x,y};setDirection(direction8(x-p.x,y-p.y))
  }

  const padDown=(key:string)=>(event:React.PointerEvent)=>{event.preventDefault();event.stopPropagation();keys.current.add(key)}
  const padUp=(key:string)=>(event:React.PointerEvent)=>{event.preventDefault();event.stopPropagation();keys.current.delete(key)}
  const returnToProntera=()=>{stopHunt();playerRef.current=START;targetRef.current=START;setPlayer(START);setDirection(0);setActive(true)}
  const spriteSrc=getPlayerAnimation(walking?'walk':'idle',direction,classId)
  const fallback=playerPortrait(classId)

  return <>
    {active&&<section ref={viewportRef} className="prontera-safe-zone" aria-label="Prontera Safe Zone" onPointerDown={moveTo}>
      <div className="prontera-world" style={{transform:`translate3d(${-camera.x}px,${-camera.y}px,0)`,width:WORLD_W,height:WORLD_H}}>
        <div className="prontera-map"/><div className="prontera-plaza"/><div className="prontera-road prontera-road-ns"/><div className="prontera-road prontera-road-ew"/><div className="prontera-plaza-ring ring-1"/><div className="prontera-plaza-ring ring-2"/>
        <div className="prontera-fountain"><i/><b/><span>PRONTERA</span></div>
        <div className="prontera-garden garden-a"/><div className="prontera-garden garden-b"/><div className="prontera-garden garden-c"/><div className="prontera-garden garden-d"/>
        {lamps.map(([x,y],i)=><span key={`lamp-${i}`} className="prontera-lamp" style={{left:x,top:y}}><i/><b/></span>)}
        {benches.map(([x,y,o],i)=><span key={`bench-${i}`} className={`prontera-bench ${o==='v'?'vertical':''}`} style={{left:x,top:y}}><i/><i/><b/></span>)}
        <div className="prontera-vignette"/>

        <button className="prontera-npc npc-kafra" style={{left:825,top:690}} onClick={()=>open('Inventário')}><span className="npc-doll kafra-doll"><i/><b/></span><strong>Kafra</strong><small>Armazém</small></button>
        <button className="prontera-npc npc-shop" style={{left:1380,top:690}} onClick={()=>open('Loja')}><span className="npc-doll shop-doll"><i/><b/></span><strong>Loja</strong><small>Itens</small></button>
        <button className="prontera-npc npc-job" style={{left:825,top:935}} onClick={()=>open('Personagem')}><span className="npc-doll job-doll"><i/><b/></span><strong>Guia de Classes</strong><small>Evolução</small></button>
        <button className="prontera-portal" style={{left:1100,top:1390}} onClick={()=>open('Mapas')}><i/><b/><span>CAÇADAS</span></button>

        <div className={`prontera-player ${walking?'walking':''}`} style={{left:player.x,top:player.y}} aria-label="Seu personagem em Prontera"><div className="prontera-player-shadow"/><img src={spriteSrc} alt="Personagem" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=fallback}}/><b>Knock</b><small>Área Segura</small></div>
      </div>

      <div className="prontera-screen-ui prontera-city-title"><Castle size={22}/><div><strong>PRONTERA</strong><span>SAFE ZONE · PRAÇA CENTRAL</span></div></div>
      <div className="prontera-screen-ui prontera-move-tip"><MapPin size={14}/><span><b>Explore Prontera</b><small>WASD / setas · clique ou toque no chão para andar</small></span></div>
      {nearby&&<button className="prontera-screen-ui prontera-interact" onClick={()=>open(nearby.action)}><b>{nearby.label}</b><span>{nearby.detail}</span><small>Pressione E ou toque para interagir</small></button>}

      <aside className="prontera-screen-ui prontera-lobby-card card"><header><MapPin size={18}/><div><b>Prontera · Safe Zone</b><small>Lobby explorável e ponto de retorno</small></div></header><p>Explore a praça, fale com NPCs e use o portal ao sul para escolher uma caçada. Não existe combate dentro da cidade.</p><button className="prontera-primary" onClick={()=>open('Mapas')}><Swords size={17}/> ESCOLHER CAÇADA</button><div className="prontera-actions"><button onClick={()=>open('Loja')}><ShoppingBag size={16}/> Loja</button><button onClick={()=>open('Equipamentos')}><Shield size={16}/> Equipamentos</button><button onClick={()=>open('Inventário')}><Backpack size={16}/> Inventário</button><button onClick={()=>open('Personagem')}><UserRoundCog size={16}/> Classe</button></div><footer><span>🛡 PvE desativado</span><span>♥ Ponto de respawn</span></footer></aside>

      <div className="prontera-screen-ui prontera-mobile-pad" aria-label="Controle de movimento"><button className="pad-up" onPointerDown={padDown('arrowup')} onPointerUp={padUp('arrowup')} onPointerCancel={padUp('arrowup')} onPointerLeave={padUp('arrowup')}>▲</button><button className="pad-left" onPointerDown={padDown('arrowleft')} onPointerUp={padUp('arrowleft')} onPointerCancel={padUp('arrowleft')} onPointerLeave={padUp('arrowleft')}>◀</button><button className="pad-right" onPointerDown={padDown('arrowright')} onPointerUp={padUp('arrowright')} onPointerCancel={padUp('arrowright')} onPointerLeave={padUp('arrowright')}>▶</button><button className="pad-down" onPointerDown={padDown('arrowdown')} onPointerUp={padUp('arrowdown')} onPointerCancel={padUp('arrowdown')} onPointerLeave={padUp('arrowdown')}>▼</button></div>
    </section>}
    {!active&&<button className="return-prontera-btn" onClick={returnToProntera} title="Voltar para Prontera Safe Zone"><Home size={16}/> Prontera</button>}
  </>
}
