import { getMonsterAsset, setMonsterImage, type MonsterAnimState } from './monsterSprites'

type Point={x:number;y:number}
type MobActor={el:HTMLElement;pos:Point;goal:Point;speed:number;dir:number}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
const spawnNorm:Point[]=[
  {x:.38,y:.42},{x:.53,y:.38},{x:.67,y:.43},{x:.79,y:.52},
  {x:.72,y:.67},{x:.58,y:.72},{x:.42,y:.64},{x:.84,y:.36},
  {x:.49,y:.52},{x:.65,y:.57},{x:.34,y:.55},{x:.78,y:.73},
]

function monsterName(){
  const label=document.querySelector<HTMLElement>('.main-mob .mob-name')
  return label?.closest<HTMLElement>('.main-mob')?.dataset.monster || (label?.textContent||'Poring').split('·')[0].trim()
}

function direction8(dx:number,dy:number){
  // ACT directions are stored in eight consecutive clips. This maps screen vectors to 0..7.
  const angle=Math.atan2(dy,dx)
  return ((Math.round((angle+Math.PI)/(Math.PI/4))+2)%8+8)%8
}

function randomGoal(worldW:number,worldH:number,current:Point){
  const base=spawnNorm[Math.floor(Math.random()*spawnNorm.length)]
  const p={x:base.x*worldW,y:base.y*worldH}
  if(dist(p,current)<150)return {x:clamp(p.x+180,260,worldW-110),y:clamp(p.y+90,worldH*.30,worldH-90)}
  return p
}

function createVisualMob(zone:HTMLElement,index:number,name:string):HTMLElement{
  const el=document.createElement('div')
  el.className='sprite mob ro-world-mob'
  el.dataset.roWorldMob=String(index)
  el.innerHTML='<div class="sprite-shadow"></div><img alt=""><div class="ro-mob-label"></div>'
  const label=el.querySelector<HTMLElement>('.ro-mob-label')!
  label.textContent=name
  zone.appendChild(el)
  return el
}

function setActorState(actor:MobActor,name:string,state:MonsterAnimState,dir:number){
  const img=actor.el.querySelector<HTMLImageElement>('img')
  if(!img)return
  actor.el.dataset.roAnimated='1'
  actor.el.dataset.roState=state
  actor.el.dataset.roDir=String(dir)
  setMonsterImage(img,name,state,dir)
}

function sizeMob(el:HTMLElement,name:string,main=false){
  const asset=getMonsterAsset(name)
  if(!asset)return
  const scale=main?1.35:.98
  el.style.width=`${clamp(Math.round(asset.width*scale),main?72:58,main?140:112)}px`
  el.style.height=`${clamp(Math.round(asset.height*scale),main?66:54,main?158:130)}px`
}

export function installWorldMovement(){
  if(typeof document==='undefined')return()=>{}

  let raf=0,last=performance.now(),initialized=false
  let actors:MobActor[]=[]
  let playerPos:Point={x:0,y:0}
  let currentName=''
  let wasDead=false
  let retargetTimer=0
  let roamTimer=0
  let camera={x:0,y:0}

  const initialize=(zone:HTMLElement,player:HTMLElement,main:HTMLElement)=>{
    const zr=zone.getBoundingClientRect()
    const worldW=zr.width*1.72,worldH=zr.height*1.38
    playerPos={x:worldW*.46,y:worldH*.56}
    const mainPos={x:worldW*.61,y:worldH*.52}
    main.dataset.roAnimated='1'
    actors=[{el:main,pos:mainPos,goal:mainPos,speed:0,dir:4}]
    currentName=monsterName()
    sizeMob(main,currentName,true)
    for(let i=0;i<6;i++){
      const el=createVisualMob(zone,i,currentName)
      const p={x:spawnNorm[(i+1)%spawnNorm.length].x*worldW,y:spawnNorm[(i+1)%spawnNorm.length].y*worldH}
      const actor={el,pos:p,goal:randomGoal(worldW,worldH,p),speed:34+Math.random()*26,dir:4}
      actors.push(actor)
      sizeMob(el,currentName,false)
      setActorState(actor,currentName,'idle',4)
    }
    initialized=true
  }

  const syncMonsterName=(name:string)=>{
    if(name===currentName)return
    currentName=name
    actors.forEach((a,i)=>{
      sizeMob(a.el,name,i===0)
      const label=a.el.querySelector<HTMLElement>('.ro-mob-label')
      if(label)label.textContent=name
      setActorState(a,name,'idle',a.dir)
    })
  }

  const swapMainWith=(index:number)=>{
    if(index<=0||index>=actors.length)return
    const main=actors[0],other=actors[index]
    const p=main.pos;main.pos=other.pos;other.pos=p
    main.goal=main.pos
    other.goal=randomGoal(Number(main.el.dataset.worldW)||2000,Number(main.el.dataset.worldH)||1200,other.pos)
  }

  const tick=(now:number)=>{
    const dt=Math.min(.05,(now-last)/1000);last=now
    const zone=document.querySelector<HTMLElement>('.hunt-zone')
    const player=document.querySelector<HTMLElement>('.player-sprite')
    const main=document.querySelector<HTMLElement>('.main-mob')
    const startBtn=document.querySelector<HTMLButtonElement>('.stop-btn')

    if(zone&&player&&main&&startBtn){
      if(!initialized||actors[0]?.el!==main)initialize(zone,player,main)
      const zr=zone.getBoundingClientRect()
      const worldW=zr.width*1.72,worldH=zr.height*1.38
      actors[0].el.dataset.worldW=String(worldW);actors[0].el.dataset.worldH=String(worldH)
      syncMonsterName(monsterName())

      const running=!startBtn.classList.contains('paused')
      const dead=main.classList.contains('dead')

      // Background creatures roam independently, making the hunt field feel populated.
      roamTimer+=dt
      actors.slice(1).forEach((actor,i)=>{
        if(dist(actor.pos,actor.goal)<18||roamTimer>5+i*.35)actor.goal=randomGoal(worldW,worldH,actor.pos)
        const d=dist(actor.pos,actor.goal)
        if(d>3){
          const dx=actor.goal.x-actor.pos.x,dy=actor.goal.y-actor.pos.y
          actor.dir=direction8(dx,dy)
          actor.pos.x+=dx/d*actor.speed*dt
          actor.pos.y+=dy/d*actor.speed*dt
          setActorState(actor,currentName,'walk',actor.dir)
        }else setActorState(actor,currentName,'idle',actor.dir)
      })
      if(roamTimer>8)roamTimer=0

      // When the active monster respawns, put it elsewhere in the larger world.
      if(wasDead&&!dead){
        actors[0].pos=randomGoal(worldW,worldH,actors[0].pos)
        actors[0].goal=actors[0].pos
      }
      wasDead=dead

      // Select the nearest visible monster. We swap its world position with the real combat actor,
      // so the existing HP/EXP/drop engine remains authoritative while the world has many targets.
      retargetTimer+=dt
      if(running&&!dead&&retargetTimer>.45){
        retargetTimer=0
        let best=0,bestD=dist(playerPos,actors[0].pos)
        for(let i=1;i<actors.length;i++){
          const d=dist(playerPos,actors[i].pos)
          if(d<bestD){best=i;bestD=d}
        }
        if(best!==0&&bestD>115)swapMainWith(best)
      }

      const target=actors[0]
      const dx=target.pos.x-playerPos.x,dy=target.pos.y-playerPos.y
      const d=Math.max(1,Math.hypot(dx,dy))
      const attackRange=92
      const playerImg=player.querySelector<HTMLImageElement>('img')
      const slash=player.querySelector<HTMLElement>('.slash')

      if(running&&!dead&&d>attackRange){
        const speed=235
        playerPos.x=clamp(playerPos.x+dx/d*speed*dt,250,worldW-100)
        playerPos.y=clamp(playerPos.y+dy/d*speed*dt,worldH*.28,worldH-80)
        player.dataset.roWalking='1';player.dataset.roCombatState='walk'
        player.classList.remove('ro-attacking')
        if(playerImg)playerImg.style.transform=dx<0?'scaleX(-1)':'scaleX(1)'
        if(slash)slash.style.display='none'
        setActorState(target,currentName,'idle',direction8(-dx,-dy))
      }else if(running&&!dead){
        player.dataset.roWalking='0';player.dataset.roCombatState='attack';player.classList.add('ro-attacking')
        if(playerImg)playerImg.style.transform=dx<0?'scaleX(-1)':'scaleX(1)'
        if(slash)slash.style.display=''
        const hit=!!main.querySelector('.damage-number')
        const cycle=(now%1450)/1450
        const state:MonsterAnimState=hit?'hit':cycle>.72?'attack':'idle'
        setActorState(target,currentName,state,direction8(-dx,-dy))
      }else{
        player.dataset.roWalking='0';player.dataset.roCombatState=dead?'idle':'idle';player.classList.remove('ro-attacking')
        if(slash)slash.style.display='none'
        setActorState(target,currentName,dead?'death':'idle',target.dir)
      }

      if(dead)setActorState(target,currentName,'death',target.dir)

      // Camera follows the player through a world larger than the viewport.
      const desiredX=clamp(playerPos.x-zr.width*.52,0,Math.max(0,worldW-zr.width))
      const desiredY=clamp(playerPos.y-zr.height*.57,0,Math.max(0,worldH-zr.height))
      camera.x=lerp(camera.x,desiredX,Math.min(1,dt*4.5))
      camera.y=lerp(camera.y,desiredY,Math.min(1,dt*4.5))
      zone.style.setProperty('--ro-cam-x',`${-camera.x*.22}px`)
      zone.style.setProperty('--ro-cam-y',`${-camera.y*.12}px`)
      zone.style.setProperty('--ro-cam-far-x',`${-camera.x*.08}px`)
      zone.dataset.roCamera='1'

      player.style.left=`${playerPos.x-camera.x}px`
      player.style.top=`${playerPos.y-camera.y}px`
      actors.forEach((actor,i)=>{
        actor.el.style.left=`${actor.pos.x-camera.x}px`
        actor.el.style.top=`${actor.pos.y-camera.y}px`
        actor.el.style.zIndex=String(7+Math.round((actor.pos.y/worldH)*12))
        if(i>0)actor.el.style.opacity='1'
      })
    }

    raf=requestAnimationFrame(tick)
  }

  raf=requestAnimationFrame(tick)
  return()=>{
    cancelAnimationFrame(raf)
    actors.slice(1).forEach(a=>a.el.remove())
  }
}
