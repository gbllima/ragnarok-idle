export type MonsterAnimState='idle'|'walk'|'attack'|'hit'|'death'
type MonsterSpriteAsset={src:string;width:number;height:number;base:string}

const monsterSprites:Record<string,MonsterSpriteAsset>={
  Poring:{src:'/generated/monsters/poring.gif',width:49,height:47,base:'poring'},
  Drops:{src:'/generated/monsters/drops.gif',width:49,height:47,base:'drops'},
  Lunatic:{src:'/generated/monsters/lunatic.gif',width:43,height:37,base:'lunatic'},
  Pupa:{src:'/generated/monsters/pupa.gif',width:41,height:50,base:'pupa'},
  Fabre:{src:'/generated/monsters/fabre.gif',width:44,height:37,base:'fabre'},
  Willow:{src:'/generated/monsters/wilow.gif',width:79,height:85,base:'wilow'},
  Mandragora:{src:'/generated/monsters/mandragora.gif',width:103,height:80,base:'mandragora'},
  Rocker:{src:'/generated/monsters/rocker.gif',width:71,height:127,base:'rocker'},
  Spore:{src:'/generated/monsters/spore.gif',width:63,height:65,base:'spore'},
  Creamy:{src:'/generated/monsters/creamy.gif',width:62,height:64,base:'creamy'},
  Muka:{src:'/generated/monsters/muka.gif',width:50,height:75,base:'muka'},
  'Peco Peco':{src:'/generated/monsters/pecopeco.gif',width:74,height:101,base:'pecopeco'},
  Smokie:{src:'/generated/monsters/smokie.gif',width:52,height:59,base:'smokie'},
  Poporing:{src:'/generated/monsters/poporing.gif',width:49,height:47,base:'poporing'},
  Yoyo:{src:'/generated/monsters/yoyo.gif',width:44,height:47,base:'yoyo'},
  Wolf:{src:'/generated/monsters/wolf.gif',width:88,height:74,base:'wolf'},
  Golem:{src:'/generated/monsters/golem.gif',width:90,height:123,base:'golem'},
  Hode:{src:'/generated/monsters/hode.gif',width:64,height:41,base:'hode'},
  Argiope:{src:'/generated/monsters/argiope.gif',width:79,height:59,base:'argiope'},
}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const fallback='/sprites/poring.svg'

export function getMonsterAsset(name:string){return monsterSprites[name]}
export function getMonsterAnimation(name:string,state:MonsterAnimState,dir:number){
  const asset=monsterSprites[name]
  if(!asset)return fallback
  const d=((Math.round(dir)%8)+8)%8
  return `/generated/monsters-actions/${asset.base}/${state}-${d}.gif`
}

export function setMonsterImage(img:HTMLImageElement,name:string,state:MonsterAnimState='idle',dir=4){
  const asset=monsterSprites[name]
  if(!asset){img.onerror=null;img.src=fallback;return}
  const stateSrc=getMonsterAnimation(name,state,dir)
  const baseSrc=asset.src
  if(img.dataset.roSrc===stateSrc)return
  img.dataset.roSrc=stateSrc
  img.onerror=()=>{
    if(img.src.endsWith(baseSrc)){
      img.onerror=null
      img.src=fallback
      return
    }
    img.dataset.roSrc=baseSrc
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

function applyMonsterSprite(){
  const nameEl=document.querySelector<HTMLElement>('.main-mob .mob-name')
  if(!nameEl)return
  const name=(nameEl.textContent||'').split('·')[0].trim()
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
