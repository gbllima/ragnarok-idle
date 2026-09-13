type MonsterSpriteAsset={src:string;width:number;height:number}

const monsterSprites:Record<string,MonsterSpriteAsset>={
  Poring:{src:'/generated/monsters/poring.gif',width:49,height:47},
  Drops:{src:'/generated/monsters/drops.gif',width:49,height:47},
  Lunatic:{src:'/generated/monsters/lunatic.gif',width:43,height:37},
  Pupa:{src:'/generated/monsters/pupa.gif',width:41,height:50},
  Fabre:{src:'/generated/monsters/fabre.gif',width:44,height:37},
  Willow:{src:'/generated/monsters/wilow.gif',width:79,height:85},
  Mandragora:{src:'/generated/monsters/mandragora.gif',width:103,height:80},
  Rocker:{src:'/generated/monsters/rocker.gif',width:71,height:127},
  Spore:{src:'/generated/monsters/spore.gif',width:63,height:65},
  Creamy:{src:'/generated/monsters/creamy.gif',width:62,height:64},
  Muka:{src:'/generated/monsters/muka.gif',width:50,height:75},
  'Peco Peco':{src:'/generated/monsters/pecopeco.gif',width:74,height:101},
  Smokie:{src:'/generated/monsters/smokie.gif',width:52,height:59},
  Poporing:{src:'/generated/monsters/poporing.gif',width:49,height:47},
  Yoyo:{src:'/generated/monsters/yoyo.gif',width:44,height:47},
  Wolf:{src:'/generated/monsters/wolf.gif',width:88,height:74},
  Golem:{src:'/generated/monsters/golem.gif',width:90,height:123},
  Hode:{src:'/generated/monsters/hode.gif',width:64,height:41},
  Argiope:{src:'/generated/monsters/argiope.gif',width:79,height:59},
}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))

function setSprite(el:HTMLElement,asset:MonsterSpriteAsset,name:string,scale:number,minW:number,maxW:number,minH:number,maxH:number){
  const img=el.querySelector<HTMLImageElement>('img')
  if(img&&img.dataset.roSrc!==asset.src){
    img.dataset.roSrc=asset.src
    img.onerror=()=>{img.onerror=null;img.src='/sprites/poring.svg'}
    img.src=asset.src
  }
  el.style.width=`${clamp(Math.round(asset.width*scale),minW,maxW)}px`
  el.style.height=`${clamp(Math.round(asset.height*scale),minH,maxH)}px`
  el.dataset.roMonster=name
}

function applyMonsterSprite(){
  const nameEl=document.querySelector<HTMLElement>('.main-mob .mob-name')
  if(!nameEl)return
  const name=(nameEl.textContent||'').split('·')[0].trim()
  const asset=monsterSprites[name]
  if(!asset)return

  const main=document.querySelector<HTMLElement>('.main-mob')
  if(main)setSprite(main,asset,name,1.35,72,132,66,150)
  document.querySelectorAll<HTMLElement>('.mob-2,.mob-3').forEach(el=>setSprite(el,asset,name,.9,58,100,52,112))
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
