import { useEffect, useRef, useState } from 'react'
import { Backpack, Castle, Home, MapPin, Shield, ShoppingBag, Swords } from 'lucide-react'
import { getPlayerAnimation } from '../game/playerSprites'
import { playerPortrait } from '../game/assets'

const HUNT_ACTION=/Caçar aqui|Caçada atual|Melhor caçada agora|MVP recomendado/i
const WORLD_W=2200
const WORLD_H=1600
const SPEED=285
const START={x:1110,y:930}

type Point={x:number;y:number}

function clickMenu(title:string){
  document.querySelector<HTMLButtonElement>(`.side-menu button[title="${title}"]`)?.click()
}

function stopHunt(){
  const button=document.querySelector<HTMLButtonElement>('.stop-btn')
  if(button&&!button.classList.contains('paused'))button.click()
}

function startHunt(){
  const button=document.querySelector<HTMLButtonElement>('.stop-btn')
  if(button&&button.classList.contains('paused'))button.click()
}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))
function direction8(dx:number,dy:number){
  const angle=Math.atan2(dy,dx)
  return ((Math.round((angle+Math.PI)/(Math.PI/4))+2)%8+8)%8
}

export function PronteraSafeZone(){
  const [active,setActive]=useState(true)
  const [classId,setClassId]=useState('novice')
  const [player,setPlayer]=useState<Point>(START)
  const [camera,setCamera]=useState<Point>({x:0,y:0})
  const [walking,setWalking]=useState(false)
  const [direction,setDirection]=useState(0)
  const playerRef=useRef<Point>(START)
  const targetRef=useRef<Point>(START)
  const cameraRef=useRef<Point>({x:0,y:0})
  const keys=useRef(new Set<string>())
  const viewportRef=useRef<HTMLElement>(null)

  useEffect(()=>{
    const shell=document.querySelector<HTMLElement>('.game-shell')
    shell?.classList.toggle('safe-zone-active',active)
    if(active)window.setTimeout(stopHunt,0)
    return()=>shell?.classList.remove('safe-zone-active')
  },[active])

  useEffect(()=>{
    const syncClass=()=>{
      const id=document.querySelector<HTMLElement>('.player-sprite')?.dataset.classId
      if(id)setClassId(id)
    }
    syncClass()
    const timer=window.setInterval(syncClass,600)
    return()=>window.clearInterval(timer)
  },[])

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      if(!active)return
      const button=(event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button')
      if(!button||!button.closest('.game-modal')||!HUNT_ACTION.test(button.textContent||''))return
      window.setTimeout(()=>{
        setActive(false)
        window.setTimeout(startHunt,80)
      },0)
    }
    document.addEventListener('click',onClick)
    return()=>document.removeEventListener('click',onClick)
  },[active])

  useEffect(()=>{
    if(!active)return
    const ignored=(target:EventTarget|null)=>{
      const el=target as HTMLElement|null
      return !!el?.closest('input,textarea,select,button,.game-modal')
    }
    const down=(event:KeyboardEvent)=>{
      if(ignored(event.target))return
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(event.key)){
        keys.current.add(event.key.toLowerCase())
        event.preventDefault()
      }
    }
    const up=(event:KeyboardEvent)=>keys.current.delete(event.key.toLowerCase())
    window.addEventListener('keydown',down,{passive:false})
    window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}
  },[active])

  useEffect(()=>{
    if(!active)return
    let raf=0,last=performance.now()
    const frame=(now:number)=>{
      const dt=Math.min(.04,(now-last)/1000);last=now
      const k=keys.current
      let dx=0,dy=0
      if(k.has('arrowleft')||k.has('a'))dx-=1
      if(k.has('arrowright')||k.has('d'))dx+=1
      if(k.has('arrowup')||k.has('w'))dy-=1
      if(k.has('arrowdown')||k.has('s'))dy+=1
      const p=playerRef.current
      const target=targetRef.current
      if(dx||dy){
        targetRef.current={...p}
      }else{
        const tx=target.x-p.x,ty=target.y-p.y,d=Math.hypot(tx,ty)
        if(d>5){dx=tx/d;dy=ty/d}
      }
      const moving=!!(dx||dy)
      if(moving){
        const len=Math.hypot(dx,dy)||1
        dx/=len;dy/=len
        const next={x:clamp(p.x+dx*SPEED*dt,90,WORLD_W-90),y:clamp(p.y+dy*SPEED*dt,90,WORLD_H-90)}
        playerRef.current=next
        setPlayer(next)
        setDirection(direction8(dx,dy))
        if(Math.hypot(target.x-next.x,target.y-next.y)<9)targetRef.current={...next}
      }
      setWalking(moving)

      const viewport=viewportRef.current
      if(viewport){
        const w=viewport.clientWidth,h=viewport.clientHeight
        const desired={x:clamp(playerRef.current.x-w*.5,0,Math.max(0,WORLD_W-w)),y:clamp(playerRef.current.y-h*.52,0,Math.max(0,WORLD_H-h))}
        const c=cameraRef.current
        const nextCam={x:c.x+(desired.x-c.x)*Math.min(1,dt*8),y:c.y+(desired.y-c.y)*Math.min(1,dt*8)}
        cameraRef.current=nextCam
        setCamera(nextCam)
      }
      raf=requestAnimationFrame(frame)
    }
    raf=requestAnimationFrame(frame)
    return()=>cancelAnimationFrame(raf)
  },[active])

  const moveTo=(event:React.PointerEvent<HTMLElement>)=>{
    if((event.target as HTMLElement).closest('button,.prontera-screen-ui'))return
    const rect=viewportRef.current?.getBoundingClientRect();if(!rect)return
    const x=clamp(event.clientX-rect.left+cameraRef.current.x,90,WORLD_W-90)
    const y=clamp(event.clientY-rect.top+cameraRef.current.y,90,WORLD_H-90)
    const p=playerRef.current
    targetRef.current={x,y}
    setDirection(direction8(x-p.x,y-p.y))
  }

  const padDown=(key:string)=>(event:React.PointerEvent)=>{event.preventDefault();event.stopPropagation();keys.current.add(key)}
  const padUp=(key:string)=>(event:React.PointerEvent)=>{event.preventDefault();event.stopPropagation();keys.current.delete(key)}
  const open=(title:string)=>clickMenu(title)
  const returnToProntera=()=>{stopHunt();playerRef.current=START;targetRef.current=START;setPlayer(START);setDirection(0);setActive(true)}

  const spriteSrc=getPlayerAnimation(walking?'walk':'idle',direction,classId)
  const fallback=playerPortrait(classId)

  return <>
    {active&&<section ref={viewportRef} className="prontera-safe-zone" aria-label="Prontera Safe Zone" onPointerDown={moveTo}>
      <div className="prontera-world" style={{transform:`translate3d(${-camera.x}px,${-camera.y}px,0)`,width:WORLD_W,height:WORLD_H}}>
        <div className="prontera-map"/>
        <div className="prontera-plaza"/>
        <div className="prontera-road prontera-road-ns"/>
        <div className="prontera-road prontera-road-ew"/>
        <div className="prontera-plaza-ring ring-1"/>
        <div className="prontera-plaza-ring ring-2"/>
        <div className="prontera-fountain"><i/><b/><span>PRONTERA</span></div>
        <div className="prontera-garden garden-a"/><div className="prontera-garden garden-b"/><div className="prontera-garden garden-c"/><div className="prontera-garden garden-d"/>
        <div className="prontera-vignette"/>

        <div className="prontera-landmark landmark-gate"><span>⚔</span><b>Portão de Caçadas</b><small>Escolha sua próxima área</small></div>
        <div className="prontera-landmark landmark-fountain"><span>◈</span><b>Praça Central</b><small>Safe Zone de Prontera</small></div>

        <div className={`prontera-player ${walking?'walking':''}`} style={{left:player.x,top:player.y}} aria-label="Seu personagem em Prontera">
          <div className="prontera-player-shadow"/>
          <img src={spriteSrc} alt="Personagem" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=fallback}}/>
          <b>Knock</b>
          <small>Área Segura</small>
        </div>
      </div>

      <div className="prontera-screen-ui prontera-city-title"><Castle size={22}/><div><strong>PRONTERA</strong><span>SAFE ZONE · PRAÇA CENTRAL</span></div></div>
      <div className="prontera-screen-ui prontera-move-tip"><MapPin size={14}/><span><b>Explore Prontera</b><small>WASD / setas · clique ou toque no chão para andar</small></span></div>

      <aside className="prontera-screen-ui prontera-lobby-card card">
        <header><MapPin size={18}/><div><b>Prontera · Safe Zone</b><small>Lobby explorável e ponto de retorno</small></div></header>
        <p>Use a praça para organizar seu personagem e escolher a próxima caçada. Não existe combate dentro da cidade.</p>
        <button className="prontera-primary" onClick={()=>open('Mapas')}><Swords size={17}/> ESCOLHER CAÇADA</button>
        <div className="prontera-actions">
          <button onClick={()=>open('Loja')}><ShoppingBag size={16}/> Loja</button>
          <button onClick={()=>open('Equipamentos')}><Shield size={16}/> Equipamentos</button>
          <button onClick={()=>open('Inventário')}><Backpack size={16}/> Inventário</button>
        </div>
        <footer><span>🛡 PvE desativado</span><span>♥ Ponto de respawn</span></footer>
      </aside>

      <div className="prontera-screen-ui prontera-mobile-pad" aria-label="Controle de movimento">
        <button className="pad-up" onPointerDown={padDown('arrowup')} onPointerUp={padUp('arrowup')} onPointerCancel={padUp('arrowup')} onPointerLeave={padUp('arrowup')}>▲</button>
        <button className="pad-left" onPointerDown={padDown('arrowleft')} onPointerUp={padUp('arrowleft')} onPointerCancel={padUp('arrowleft')} onPointerLeave={padUp('arrowleft')}>◀</button>
        <button className="pad-right" onPointerDown={padDown('arrowright')} onPointerUp={padUp('arrowright')} onPointerCancel={padUp('arrowright')} onPointerLeave={padUp('arrowright')}>▶</button>
        <button className="pad-down" onPointerDown={padDown('arrowdown')} onPointerUp={padUp('arrowdown')} onPointerCancel={padUp('arrowdown')} onPointerLeave={padUp('arrowdown')}>▼</button>
      </div>
    </section>}

    {!active&&<button className="return-prontera-btn" onClick={returnToProntera} title="Voltar para Prontera Safe Zone"><Home size={16}/> Prontera</button>}
  </>
}
