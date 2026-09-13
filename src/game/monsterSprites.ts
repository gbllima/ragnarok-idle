import { monsterAssets, spriteDirection } from './assets'
export type MonsterAnimState='idle'|'walk'|'attack'|'hit'|'death'
type MonsterSpriteAsset=typeof monsterAssets[string]
const monsterSprites=monsterAssets

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const fallback='/sprites/poring.svg'

export function getMonsterAsset(name:string){return monsterSprites[name]}
export function getMonsterAnimation(name:string,state:MonsterAnimState,dir:number){
  const asset=monsterSprites[name]
  if(!asset)return fallback
  return asset.animations[state][spriteDirection(dir)]
}

export function setMonsterImage(img:HTMLImageElement,name:string,state:MonsterAnimState='idle',dir=4){
  const asset=monsterSprites[name]
  if(!asset){img.onerror=null;img.src=fallback;return}
  const stateSrc=getMonsterAnimation(name,state,dir)
  const baseSrc=asset.src
  if(img.dataset.roSrc===stateSrc)return
  img.dataset.roSrc=stateSrc
  delete img.dataset.roFallback
  img.onerror=()=>{
    if(img.dataset.roFallback==='1'){
      img.onerror=null
      img.src=fallback
      return
    }
    img.dataset.roFallback='1'
    img.src=baseSrc
  }
  img.src=stateSrc
}

function setSprite(el:HTMLElement,asset:MonsterSpriteAsset,name:string,scale:number,minW:number,maxW:number,minH:number,maxH:number){
  const img=el.querySelector<HTMLImageElement>('img')
  if(img&&!el.dataset.roAnimated)setMonsterImage(img,name,'idle',4)
  el.style.width=`${clamp(Math.round(asset.width*scale),minW,maxW)}px`
  el.style.height=`${clamp(Math.round(asset.height*scale),minH,maxH)}px`
  el.dataset.roMonster=name
}

function resetSprite(el:HTMLElement){
  const img=el.querySelector<HTMLImageElement>('img')
  if(img){img.onerror=null;img.dataset.roSrc='';img.src=fallback}
  el.style.removeProperty('width')
  el.style.removeProperty('height')
  delete el.dataset.roMonster
}

function mainName(label:HTMLElement){return label.closest<HTMLElement>('.main-mob')?.dataset.monster || (label.textContent||'').split('·')[0].trim()}

function applyMonsterSprite(){
  const nameEl=document.querySelector<HTMLElement>('.main-mob .mob-name')
  if(!nameEl)return
  const name=mainName(nameEl)
  const main=document.querySelector<HTMLElement>('.main-mob')
  const decorative=[...document.querySelectorAll<HTMLElement>('.mob-2,.mob-3')]
  const asset=monsterSprites[name]
  if(!asset){
    if(main)resetSprite(main)
    decorative.forEach(resetSprite)
    return
  }
  if(main)setSprite(main,asset,name,1.35,72,132,66,150)
  decorative.forEach(el=>setSprite(el,asset,name,.9,58,100,52,112))
}

export function installMonsterSpriteWatcher(){
  if(typeof document==='undefined')return()=>{}
  let queued=false
  const queue=()=>{
    if(queued)return
    queued=true
    requestAnimationFrame(()=>{queued=false;applyMonsterSprite()})
  }
  const observer=new MutationObserver(queue)
  const start=()=>{
    observer.observe(document.body,{subtree:true,childList:true,characterData:true})
    queue()
  }
  if(document.body)start();else window.addEventListener('DOMContentLoaded',start,{once:true})
  return()=>observer.disconnect()
}

export const convertedMonsterNames=Object.freeze(Object.keys(monsterSprites))
