import { classes } from './data'
import { getPlayerAnimation, type PlayerAnimState } from './playerSprites'
import { playerPortrait } from './assets'

type Point={x:number;y:number}
type PartyVisual={el:HTMLElement;key:string;name:string;classId:string;portrait:string;pos:Point;dir:number;src:string}
type PartySnapshot={key:string;name:string;classId:string;portrait:string;hp:number;maxHp:number}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const direction8=(dx:number,dy:number)=>{
  const angle=Math.atan2(dy,dx)
  return ((Math.round((angle+Math.PI)/(Math.PI/4))+2)%8+8)%8
}

function parseNumber(value:string){
  const cleaned=value.replace(/[^0-9.-]/g,'')
  const number=Number(cleaned)
  return Number.isFinite(number)?number:0
}

function activeParty():PartySnapshot[]{
  const cards=[...document.querySelectorAll<HTMLElement>('.party-dock .ro-party-member.active:not(.leader)')].slice(0,2)
  return cards.map((card,index)=>{
    const name=card.querySelector<HTMLElement>('.ro-party-name strong')?.textContent?.trim()||`Membro ${index+1}`
    const detail=card.querySelector<HTMLElement>('.ro-party-info>small')?.textContent||''
    const className=detail.split('·')[0]?.trim()||'Novice'
    const classId=classes.find(entry=>entry.name.toLowerCase()===className.toLowerCase())?.id||'novice'
    const hpText=card.querySelector<HTMLElement>('.ro-party-bar.hp em')?.textContent||'0/1'
    const [hpRaw,maxRaw]=hpText.split('/')
    const portrait=card.querySelector<HTMLImageElement>('.ro-party-portrait img')?.src||playerPortrait(classId)
    return {key:`${index}:${name}`,name,classId,portrait,hp:parseNumber(hpRaw||'0'),maxHp:Math.max(1,parseNumber(maxRaw||'1'))}
  })
}

function createVisual(zone:HTMLElement,snapshot:PartySnapshot,leader:HTMLElement,index:number):PartyVisual{
  const lx=parseFloat(leader.style.left||String(zone.clientWidth*.46))
  const ly=parseFloat(leader.style.top||String(zone.clientHeight*.56))
  const el=document.createElement('div')
  el.className='party-world-member'
  el.dataset.partyWorld='1'
  el.dataset.partyIndex=String(index)
  el.innerHTML='<div class="party-world-shadow"></div><img alt=""><div class="party-world-name"></div><div class="party-world-hp"><i></i></div><span class="party-world-status"></span>'
  const img=el.querySelector<HTMLImageElement>('img')!
  img.src=snapshot.portrait
  img.alt=snapshot.name
  el.querySelector<HTMLElement>('.party-world-name')!.textContent=snapshot.name
  zone.appendChild(el)
  return {el,key:snapshot.key,name:snapshot.name,classId:snapshot.classId,portrait:snapshot.portrait,pos:{x:lx+(index?62:-62),y:ly+42},dir:0,src:''}
}

function setVisualImage(actor:PartyVisual,state:PlayerAnimState,dir:number){
  const img=actor.el.querySelector<HTMLImageElement>('img')
  if(!img)return
  let src=''
  try{src=getPlayerAnimation(state,dir,actor.classId)||actor.portrait}catch{src=actor.portrait}
  if(actor.src===src)return
  actor.src=src
  img.onerror=()=>{img.onerror=null;img.src=actor.portrait}
  img.src=src
}

export function installPartyWorld(){
  if(typeof document==='undefined')return()=>{}
  let raf=0
  const visuals=new Map<string,PartyVisual>()

  const clear=()=>{for(const actor of visuals.values())actor.el.remove();visuals.clear()}
  const tick=()=>{
    const safe=!!document.querySelector('.game-shell.safe-zone-active')
    const zone=document.querySelector<HTMLElement>('.hunt-zone')
    const leader=document.querySelector<HTMLElement>('.hunt-zone .player-sprite')
    const target=document.querySelector<HTMLElement>('.hunt-zone .main-mob')
    const startBtn=document.querySelector<HTMLButtonElement>('.stop-btn')

    if(safe||!zone||!leader||!target||!startBtn){
      if(visuals.size)clear()
      raf=requestAnimationFrame(tick);return
    }

    const roster=activeParty()
    const liveKeys=new Set(roster.map(member=>member.key))
    for(const [key,actor] of visuals)if(!liveKeys.has(key)){actor.el.remove();visuals.delete(key)}

    const lx=parseFloat(leader.style.left||String(zone.clientWidth*.46))
    const ly=parseFloat(leader.style.top||String(zone.clientHeight*.56))
    const tx=parseFloat(target.style.left||String(zone.clientWidth*.61))
    const ty=parseFloat(target.style.top||String(zone.clientHeight*.52))
    const running=!startBtn.classList.contains('paused')
    const leaderState=leader.dataset.roCombatState||'idle'

    roster.forEach((member,index)=>{
      let actor=visuals.get(member.key)
      if(!actor){actor=createVisual(zone,member,leader,index);visuals.set(member.key,actor)}
      actor.name=member.name;actor.classId=member.classId;actor.portrait=member.portrait

      const dead=member.hp<=0
      const attack=running&&!dead&&leaderState==='attack'
      const walking=running&&!dead&&leaderState==='walk'
      const formationX=index===0?-68:68
      const formationY=index===0?38:54
      let desiredX=lx+formationX,desiredY=ly+formationY

      if(attack){
        const vx=tx-lx,vy=ty-ly,len=Math.max(1,Math.hypot(vx,vy))
        const nx=vx/len,ny=vy/len,px=-ny,py=nx
        const side=index===0?-1:1
        desiredX=lx+nx*36+px*side*58
        desiredY=ly+ny*36+py*side*58
      }

      const speed=walking?.22:.16
      actor.pos.x+=(desiredX-actor.pos.x)*speed
      actor.pos.y+=(desiredY-actor.pos.y)*speed
      actor.pos.x=clamp(actor.pos.x,36,Math.max(36,zone.clientWidth-36))
      actor.pos.y=clamp(actor.pos.y,62,Math.max(62,zone.clientHeight-46))

      const dx=tx-actor.pos.x,dy=ty-actor.pos.y
      if(Math.hypot(dx,dy)>2)actor.dir=direction8(dx,dy)
      const state:PlayerAnimState=dead?'death':walking?'walk':attack?'attack':'idle'
      actor.el.dataset.state=state
      actor.el.dataset.classId=actor.classId
      actor.el.style.left=`${actor.pos.x}px`
      actor.el.style.top=`${actor.pos.y}px`
      actor.el.style.zIndex=String(12+Math.round(actor.pos.y/80))
      actor.el.querySelector<HTMLElement>('.party-world-name')!.textContent=member.name
      const hpPct=Math.max(0,Math.min(100,member.hp/member.maxHp*100))
      actor.el.querySelector<HTMLElement>('.party-world-hp i')!.style.width=`${hpPct}%`
      const status=actor.el.querySelector<HTMLElement>('.party-world-status')!
      status.textContent=dead?'CAÍDO':attack?'ATACANDO':walking?'SEGUINDO':'PARTY'
      setVisualImage(actor,state,actor.dir)
    })

    raf=requestAnimationFrame(tick)
  }

  raf=requestAnimationFrame(tick)
  return()=>{cancelAnimationFrame(raf);clear()}
}
