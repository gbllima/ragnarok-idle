import { playerAssets, playerPortrait, spriteDirection } from './assets'
export type PlayerAnimState='idle'|'walk'|'attack'|'hit'|'death'

const fallback='/sprites/swordsman.svg'

function direction8(dx:number,dy:number){
  const angle=Math.atan2(dy,dx)
  return ((Math.round((angle+Math.PI)/(Math.PI/4))+2)%8+8)%8
}

export function getPlayerAnimation(state:PlayerAnimState,direction:number,classId='novice'){
  return (playerAssets[classId] ?? playerAssets.novice).animations[state][spriteDirection(direction)]
}

function setPlayerImage(img:HTMLImageElement,state:PlayerAnimState,direction:number,classId:string){
  const src=getPlayerAnimation(state,direction,classId)
  if(img.dataset.roPlayerSrc===src)return
  img.dataset.roPlayerSrc=src
  img.dataset.roPlayerAnimated='1'
  img.onerror=()=>{
    img.onerror=()=>{img.onerror=null;img.src=fallback}
    img.src=playerPortrait(classId)
  }
  img.src=src
}

export function installPlayerSpriteWatcher(){
  if(typeof document==='undefined')return()=>{}

  let raf=0
  let lastX:number|null=null,lastY:number|null=null
  let lastDir=0

  const tick=(now:number)=>{
    const player=document.querySelector<HTMLElement>('.player-sprite')
    const target=document.querySelector<HTMLElement>('.main-mob')
    const img=player?.querySelector<HTMLImageElement>('img')

    if(player&&img){
      const x=parseFloat(player.style.left||'0')
      const y=parseFloat(player.style.top||'0')
      const tx=target?parseFloat(target.style.left||'0'):x
      const ty=target?parseFloat(target.style.top||'0'):y+1
      const moving=player.dataset.roCombatState==='walk'
      const dead=player.classList.contains('dead')

      let dir=lastDir
      if(moving&&lastX!==null&&lastY!==null){
        const dx=x-lastX,dy=y-lastY
        if(Math.hypot(dx,dy)>.2)dir=direction8(dx,dy)
      }else if(target){
        const dx=tx-x,dy=ty-y
        if(Math.hypot(dx,dy)>1)dir=direction8(dx,dy)
      }
      lastDir=dir

      let state:PlayerAnimState='idle'
      if(dead)state='death'
      else if(player.dataset.roCombatState==='walk')state='walk'
      else if(player.dataset.roCombatState==='attack')state='attack'

      // Cosmetic hit reaction when the target is in its attack clip.
      if(!dead&&state!=='walk'&&target?.dataset.roState==='attack'&&now%1200>930)state='hit'

      player.dataset.roPlayerState=state
      player.dataset.roPlayerDir=String(dir)
      setPlayerImage(img,state,dir,player.dataset.classId || 'novice')
      lastX=x;lastY=y
    }

    raf=requestAnimationFrame(tick)
  }

  raf=requestAnimationFrame(tick)
  return()=>cancelAnimationFrame(raf)
}
