import { useEffect, useMemo, useState } from 'react'
import { classes, items, maps, quests, skills, startingInventory, type StatKey } from './data'

export type AutoConfig={enabledSkills:string[];healPct:number;useConsumables:boolean;autoSellCommon:boolean}
export type SaveState={
  version:number;baseLevel:number;jobLevel:number;baseExp:number;jobExp:number;zeny:number;kills:number;hp:number;maxHp:number;sp:number;maxSp:number;
  attack:number;defense:number;mapId:string;inventory:Record<string,number>;equipped:{weapon?:string;armor?:string;shield?:string};socketedCards:{weapon?:string;armor?:string;shield?:string};
  lastSeen:number;running:boolean;classId:string;statPoints:number;jobPoints:number;stats:Record<StatKey,number>;skillLevels:Record<string,number>;
  firstJobChosen:boolean;unlockedClasses:string[];bestiary:Record<string,number>;claimedQuests:string[];auto:AutoConfig;rebirths:number;rebirthPoints:number;
}

const KEY='ragnarok-idle-save-v1'
const freshBase:SaveState={
  version:3,baseLevel:1,jobLevel:1,baseExp:0,jobExp:0,zeny:500,kills:0,hp:940,maxHp:940,sp:400,maxSp:400,attack:218,defense:38,
  mapId:'prontera-field',inventory:startingInventory,equipped:{weapon:'noviceSword',armor:'adventurerArmor'},socketedCards:{},lastSeen:Date.now(),running:true,
  classId:'novice',statPoints:6,jobPoints:1,stats:{str:10,agi:10,vit:10,int:10,dex:10,luk:10},skillLevels:{basicSkill:1,firstAid:1},firstJobChosen:false,unlockedClasses:['novice'],
  bestiary:{},claimedQuests:[],auto:{enabledSkills:[],healPct:35,useConsumables:true,autoSellCommon:false},rebirths:0,rebirthPoints:0
}

function expNeed(level:number){return 350+level*115}
function jobNeed(level:number){return 250+level*90}
function roll(rate:number){return Math.random()*10000<rate}
function sellValue(id:string){const it=items[id];return it?.sell??Math.max(1,Math.floor((it?.buy||10)*.4))}

function migrate(raw:Partial<SaveState>):SaveState{
  const merged={...freshBase,...raw} as SaveState
  const oldClass=raw.classId||'novice'
  const chosen=typeof raw.firstJobChosen==='boolean'?raw.firstJobChosen:oldClass!=='novice'
  const unlocked=Array.isArray(raw.unlockedClasses)&&raw.unlockedClasses.length?raw.unlockedClasses:chosen?['novice',oldClass]:['novice']
  return {...merged,version:3,classId:oldClass,firstJobChosen:chosen,unlockedClasses:Array.from(new Set(unlocked)),stats:{...freshBase.stats,...(raw.stats||{})},skillLevels:{...freshBase.skillLevels,...(raw.skillLevels||{})},inventory:{...startingInventory,...(raw.inventory||{})},socketedCards:{...(raw.socketedCards||{})},bestiary:{...(raw.bestiary||{})},claimedQuests:[...(raw.claimedQuests||[])],auto:{...freshBase.auto,...(raw.auto||{})},lastSeen:Date.now()}
}

function derived(s:SaveState){
  const eq=Object.values(s.equipped).filter(Boolean).map(id=>items[id as string]).filter(Boolean)
  const socketCards=Object.values(s.socketedCards).filter(Boolean).map(id=>items[id as string]).filter(Boolean)
  const cls=classes.find(c=>c.id===s.classId)??classes[0]
  const str=s.stats.str+(cls.bonuses.str||0),vit=s.stats.vit+(cls.bonuses.vit||0),int=s.stats.int+(cls.bonuses.int||0),dex=s.stats.dex+(cls.bonuses.dex||0)
  const rb=1+s.rebirths*.08
  const cardAttack=socketCards.reduce((a,i)=>a+(i.cardBonus?.attack||0),0),cardDefense=socketCards.reduce((a,i)=>a+(i.cardBonus?.defense||0),0)
  const cardHp=socketCards.reduce((a,i)=>a+(i.cardBonus?.hp||0),0),cardSp=socketCards.reduce((a,i)=>a+(i.cardBonus?.sp||0),0)
  const attack=Math.round((180+str*6+dex*2+eq.reduce((a,i)=>a+(i.attack||0),0)+cardAttack)*rb)
  const defense=Math.round((20+Math.floor(vit*1.8)+eq.reduce((a,i)=>a+(i.defense||0),0)+cardDefense)*rb)
  const maxHp=Math.round((700+vit*24+eq.reduce((a,i)=>a+(i.hp||0),0)+cardHp)*rb)
  const maxSp=Math.round((220+int*18+eq.reduce((a,i)=>a+(i.sp||0),0)+cardSp)*(1+s.rebirths*.04))
  const dropBonus=socketCards.reduce((a,i)=>a+(i.cardBonus?.drop||0),0)
  return {attack,defense,maxHp,maxSp,dropBonus}
}

function grantProgress(s:SaveState,baseGain:number,jobGain:number){
  let baseExp=s.baseExp+baseGain,jobExp=s.jobExp+jobGain,baseLevel=s.baseLevel,jobLevel=s.jobLevel,statPoints=s.statPoints,jobPoints=s.jobPoints
  while(baseExp>=expNeed(baseLevel)){baseExp-=expNeed(baseLevel);baseLevel++;statPoints+=3}
  while(jobExp>=jobNeed(jobLevel)){jobExp-=jobNeed(jobLevel);jobLevel++;jobPoints++}
  return {...s,baseExp,jobExp,baseLevel,jobLevel,statPoints,jobPoints}
}

export function useGame(){
  const [save,setSave]=useState<SaveState>(()=>{try{const raw=localStorage.getItem(KEY);return raw?migrate(JSON.parse(raw)):freshBase}catch{return freshBase}})
  const map=useMemo(()=>maps.find(m=>m.id===save.mapId)??maps[0],[save.mapId])
  const classDef=useMemo(()=>classes.find(c=>c.id===save.classId)??classes[0],[save.classId])
  const [monsterHp,setMonsterHp]=useState(map.monsterHp)
  const [monsterAlive,setMonsterAlive]=useState(true)
  const [playerDead,setPlayerDead]=useState(false)
  const [hit,setHit]=useState(0)
  const [damage,setDamage]=useState(0)
  const [log,setLog]=useState<string[]>(['Sistemas carregados. Auto Hunt pronto.'])
  const [offline,setOffline]=useState<{seconds:number;exp:number;job:number;zeny:number;kills:number;drops:Record<string,number>}|null>(null)
  const [cooldowns,setCooldowns]=useState<Record<string,number>>({})
  const [activeBuff,setActiveBuff]=useState<{name:string;multiplier:number;until:number}|null>(null)

  const derivedStats=useMemo(()=>derived(save),[save.classId,save.stats,save.equipped,save.socketedCards,save.rebirths])
  const passiveMultiplier=useMemo(()=>skills.filter(sk=>sk.kind==='passive'&&(sk.classId==='novice'||sk.classId===save.classId)).reduce((mult,sk)=>mult*(1+(sk.power-1)*(save.skillLevels[sk.id]||0)),1),[save.classId,save.skillLevels])
  const buffMultiplier=activeBuff&&activeBuff.until>Date.now()?activeBuff.multiplier:1
  const effectiveAttack=Math.round(save.attack*passiveMultiplier*buffMultiplier)
  const activeSkills=useMemo(()=>skills.filter(sk=>(sk.classId===save.classId||sk.classId==='novice')&&sk.kind!=='passive'),[save.classId])

  useEffect(()=>{setSave(s=>{const d=derived(s);if(s.attack===d.attack&&s.defense===d.defense&&s.maxHp===d.maxHp&&s.maxSp===d.maxSp)return s;return {...s,attack:d.attack,defense:d.defense,maxHp:d.maxHp,maxSp:d.maxSp,hp:Math.min(s.hp,d.maxHp),sp:Math.min(s.sp,d.maxSp)}})},[derivedStats.attack,derivedStats.defense,derivedStats.maxHp,derivedStats.maxSp])

  useEffect(()=>{
    try{
      const rawText=localStorage.getItem(KEY);if(!rawText)return
      const parsed=JSON.parse(rawText);const prev=migrate(parsed);if(!prev.running)return
      const seconds=Math.max(0,Math.min(8*3600,Math.floor((Date.now()-(parsed.lastSeen||Date.now()))/1000)));if(seconds<30)return
      const m=maps.find(x=>x.id===prev.mapId)??maps[0];const ds=derived(prev);const cycle=1.2*Math.max(1,Math.ceil(m.monsterHp/Math.max(1,ds.attack-m.monsterDef)));const kills=Math.floor(seconds/cycle);if(kills<=0)return
      const exp=kills*m.exp,job=kills*m.jobExp,zeny=kills*m.zeny,drops:Record<string,number>={}
      for(const dr of m.drops){const qty=Math.floor(kills*Math.min(10000,dr.rate*(1+ds.dropBonus/100))/10000);if(qty>0)drops[dr.itemId]=qty}
      setSave(s=>{let next=grantProgress(s,exp,job);const inv={...next.inventory};let extraZeny=0;for(const [id,qty] of Object.entries(drops)){const it=items[id];if(next.auto.autoSellCommon&&it?.rarity==='common'&&it.type==='material')extraZeny+=sellValue(id)*qty;else inv[id]=(inv[id]||0)+qty}return {...next,inventory:inv,zeny:next.zeny+zeny+extraZeny,kills:next.kills+kills,bestiary:{...next.bestiary,[m.monster]:(next.bestiary[m.monster]||0)+kills}}})
      setOffline({seconds,exp,job,zeny,kills,drops})
    }catch{}
  },[])

  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify({...save,lastSeen:Date.now()}))},[save])
  useEffect(()=>{setMonsterHp(map.monsterHp);setMonsterAlive(true)},[map.id,map.monsterHp])
  useEffect(()=>{const t=window.setInterval(()=>{setCooldowns(c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.max(0,v-1)])));setActiveBuff(b=>b&&b.until<=Date.now()?null:b)},1000);return()=>window.clearInterval(t)},[])

  const rewardKill=()=>{
    setMonsterAlive(false)
    const dropped:string[]=[]
    setSave(s=>{
      let next=grantProgress(s,map.exp,map.jobExp);const inv={...next.inventory};let bonusZeny=0
      const dropBoost=1+derived(next).dropBonus/100
      for(const dr of map.drops){if(roll(Math.min(10000,dr.rate*dropBoost))){const it=items[dr.itemId];if(next.auto.autoSellCommon&&it?.rarity==='common'&&it.type==='material')bonusZeny+=sellValue(dr.itemId);else{inv[dr.itemId]=(inv[dr.itemId]||0)+1;dropped.push(it?.name||dr.itemId)}}}
      return {...next,inventory:inv,zeny:next.zeny+map.zeny+bonusZeny,kills:next.kills+1,bestiary:{...next.bestiary,[map.monster]:(next.bestiary[map.monster]||0)+1},hp:Math.min(next.maxHp,next.hp+8),sp:Math.min(next.maxSp,next.sp+3)}
    })
    setLog(l=>[`${map.monster} derrotado! +${map.exp} EXP · +${map.jobExp} Job EXP · +${map.zeny} Zeny${dropped.length?` · Drop: ${dropped.join(', ')}`:''}`,...l].slice(0,7))
    window.setTimeout(()=>{setMonsterHp(map.monsterHp);setMonsterAlive(true)},850)
  }

  useEffect(()=>{
    if(!save.running||!monsterAlive||playerDead)return
    const speed=Math.max(650,1200-save.stats.agi*8)
    const timer=window.setInterval(()=>{
      const variance=Math.floor(Math.random()*21)-10;const critChance=Math.min(35,5+save.stats.luk*.35);const crit=Math.random()*100<critChance
      const dealt=Math.max(1,Math.round((effectiveAttack-map.monsterDef+variance)*(crit?1.6:1)));setDamage(dealt);setHit(v=>v+1)
      const dodge=Math.min(.45,save.stats.agi*.004);const incoming=Math.random()<dodge?0:Math.max(1,Math.round(map.monsterAtk-save.defense/5))
      setSave(s=>{const nextHp=Math.max(0,s.hp-incoming);if(nextHp===0){setPlayerDead(true);setLog(l=>['Você foi derrotado. Respawn em 3 segundos.',...l].slice(0,7));window.setTimeout(()=>{setSave(current=>({...current,hp:current.maxHp,sp:current.maxSp}));setPlayerDead(false)},3000)}return {...s,hp:nextHp}})
      setMonsterHp(hp=>{const next=hp-dealt;setLog(l=>[`${crit?'CRÍTICO! ':''}${dealt} de dano em ${map.monster}.`,...l].slice(0,7));if(next>0)return next;rewardKill();return 0})
    },speed)
    return()=>window.clearInterval(timer)
  },[save.running,save.defense,save.stats.agi,save.stats.luk,map,monsterAlive,playerDead,effectiveAttack])

  const useSkill=(id:string)=>{
    const sk=skills.find(x=>x.id===id);const lvl=save.skillLevels[id]||0;if(!sk||sk.kind==='passive'||lvl<=0||(cooldowns[id]||0)>0||save.sp<sk.spCost||playerDead)return
    if(sk.classId!=='novice'&&sk.classId!==save.classId)return
    setSave(s=>({...s,sp:s.sp-sk.spCost}));setCooldowns(c=>({...c,[id]:sk.cooldown}))
    if(sk.kind==='heal'){const amount=Math.round(save.maxHp*(sk.power+.03*lvl));setSave(s=>({...s,hp:Math.min(s.maxHp,s.hp+amount)}));setLog(l=>[`${sk.name} recuperou ${amount} HP.`,...l].slice(0,7));return}
    if(sk.kind==='buff'){setActiveBuff({name:sk.name,multiplier:sk.power+.02*lvl,until:Date.now()+6000});setLog(l=>[`${sk.name} ativado por 6 segundos.`,...l].slice(0,7));return}
    const dealt=Math.max(1,Math.round(effectiveAttack*(sk.power+.06*lvl))-map.monsterDef);setDamage(dealt);setHit(v=>v+1);setMonsterHp(h=>{const next=h-dealt;if(next<=0&&monsterAlive){rewardKill();return 0}return Math.max(0,next)});setLog(l=>[`${sk.name}${sk.element?` [${sk.element}]`:''} causou ${dealt} de dano.`,...l].slice(0,7))
  }

  useEffect(()=>{
    if(!save.running||playerDead)return
    const timer=window.setInterval(()=>{
      const hpPct=save.hp/save.maxHp*100
      if(hpPct<=save.auto.healPct){const heal=activeSkills.find(sk=>sk.kind==='heal'&&(save.skillLevels[sk.id]||0)>0&&(cooldowns[sk.id]||0)<=0&&save.sp>=sk.spCost);if(heal){useSkill(heal.id);return}if(save.auto.useConsumables){const food=['honey','redHerb','greenHerb','apple'].find(id=>(save.inventory[id]||0)>0);if(food){consumeItem(food);return}}}
      const attackSkill=activeSkills.find(sk=>save.auto.enabledSkills.includes(sk.id)&&sk.kind!=='heal'&&(save.skillLevels[sk.id]||0)>0&&(cooldowns[sk.id]||0)<=0&&save.sp>=sk.spCost);if(attackSkill)useSkill(attackSkill.id)
    },1400)
    return()=>window.clearInterval(timer)
  },[save.running,save.hp,save.maxHp,save.sp,save.inventory,save.auto,save.skillLevels,cooldowns,playerDead,activeSkills])

  const equip=(id:string)=>{const item=items[id];if(!item||item.type!=='equipment'||!item.slot)return;if(item.equipLevel&&save.baseLevel<item.equipLevel){setLog(l=>[`Requer Base Lv. ${item.equipLevel} para ${item.name}.`,...l].slice(0,7));return}setSave(s=>({...s,equipped:{...s.equipped,[item.slot!]:id}}))}
  const socketCard=(slot:'weapon'|'armor'|'shield',cardId:string)=>{const c=items[cardId];if(!c||c.type!=='card'||(save.inventory[cardId]||0)<=0||!save.equipped[slot])return;setSave(s=>{const inv={...s.inventory,[cardId]:(s.inventory[cardId]||0)-1};const old=s.socketedCards[slot];if(old)inv[old]=(inv[old]||0)+1;return {...s,inventory:inv,socketedCards:{...s.socketedCards,[slot]:cardId}}})}
  const removeCard=(slot:'weapon'|'armor'|'shield')=>setSave(s=>{const old=s.socketedCards[slot];if(!old)return s;return {...s,inventory:{...s.inventory,[old]:(s.inventory[old]||0)+1},socketedCards:{...s.socketedCards,[slot]:undefined}}})
  const consumeItem=(id:string)=>{const it=items[id];if(!it||it.type!=='consumable'||(save.inventory[id]||0)<=0)return;setSave(s=>({...s,inventory:{...s.inventory,[id]:Math.max(0,(s.inventory[id]||0)-1)},hp:Math.min(s.maxHp,s.hp+(it.hp||0)),sp:Math.min(s.maxSp,s.sp+(it.sp||0))}))}
  const buyItem=(id:string)=>{const it=items[id];if(!it?.buy||save.zeny<it.buy)return;setSave(s=>({...s,zeny:s.zeny-it.buy!,inventory:{...s.inventory,[id]:(s.inventory[id]||0)+1}}))}
  const sellItem=(id:string,qty=1)=>{if((save.inventory[id]||0)<qty)return;const equipped=Object.values(save.equipped).includes(id);if(equipped&&save.inventory[id]<=1)return;setSave(s=>({...s,zeny:s.zeny+sellValue(id)*qty,inventory:{...s.inventory,[id]:Math.max(0,(s.inventory[id]||0)-qty)}}))}
  const changeMap=(id:string)=>{const next=maps.find(m=>m.id===id);if(!next||save.baseLevel<next.minLevel)return;setSave(s=>({...s,mapId:id}))}
  const toggle=()=>setSave(s=>({...s,running:!s.running}))
  const heal=()=>setSave(s=>({...s,hp:s.maxHp,sp:s.maxSp}))
  const addStat=(key:StatKey)=>setSave(s=>s.statPoints<=0?s:{...s,statPoints:s.statPoints-1,stats:{...s.stats,[key]:s.stats[key]+1}})
  const chooseFirstJob=(id:string)=>{const c=classes.find(x=>x.id===id);if(!c||c.id==='novice'||save.firstJobChosen||save.classId!=='novice'||save.baseLevel<c.minBase||save.jobLevel<c.minJob)return;setSave(s=>({...s,classId:id,firstJobChosen:true,unlockedClasses:Array.from(new Set([...s.unlockedClasses,id])),jobLevel:1,jobExp:0,jobPoints:0}));setLog(l=>[`Mudança de classe: ${c.name}!`,...l].slice(0,7))}
  const learnSkill=(id:string)=>{const sk=skills.find(x=>x.id===id);if(!sk)return;setSave(s=>{if(sk.classId!=='novice'&&sk.classId!==s.classId)return s;const lvl=s.skillLevels[id]||0;const prereqOk=!sk.requires||(s.skillLevels[sk.requires.skillId]||0)>=sk.requires.level;if(!prereqOk||lvl>=sk.maxLevel||s.jobPoints<sk.jobPointCost)return s;return {...s,jobPoints:s.jobPoints-sk.jobPointCost,skillLevels:{...s.skillLevels,[id]:lvl+1}}})}
  const toggleAutoSkill=(id:string)=>setSave(s=>({...s,auto:{...s.auto,enabledSkills:s.auto.enabledSkills.includes(id)?s.auto.enabledSkills.filter(x=>x!==id):[...s.auto.enabledSkills,id]}}))
  const setAutoOption=<K extends keyof AutoConfig>(key:K,value:AutoConfig[K])=>setSave(s=>({...s,auto:{...s.auto,[key]:value}}))

  const questProgress=(id:string)=>{const q=quests.find(x=>x.id===id);if(!q)return 0;return q.type==='kill'?(save.bestiary[q.target]||0):(save.inventory[q.target]||0)}
  const claimQuest=(id:string)=>{const q=quests.find(x=>x.id===id);if(!q||save.claimedQuests.includes(id)||questProgress(id)<q.amount)return;setSave(s=>{let next=grantProgress(s,q.reward.exp||0,q.reward.job||0);const inv={...next.inventory};if(q.reward.itemId)inv[q.reward.itemId]=(inv[q.reward.itemId]||0)+(q.reward.itemQty||1);return {...next,inventory:inv,zeny:next.zeny+(q.reward.zeny||0),claimedQuests:[...next.claimedQuests,id]}})}

  const canRebirth=save.baseLevel>=75
  const rebirth=()=>{if(!canRebirth)return;const rb=save.rebirths+1;setSave({...freshBase,rebirths:rb,rebirthPoints:save.rebirthPoints+1,zeny:Math.max(5000,Math.floor(save.zeny*.1)),lastSeen:Date.now()});setLog([`Rebirth ${rb} concluído! Bônus permanente de combate aumentado.`])}
  const resetSave=()=>{localStorage.removeItem(KEY);setSave({...freshBase,lastSeen:Date.now()});setLog(['Novo jogo iniciado.'])}

  const availableSkills=skills.filter(s=>s.classId===save.classId||s.classId==='novice')
  const canChangeJob=save.classId==='novice'&&!save.firstJobChosen&&save.baseLevel>=10&&save.jobLevel>=10
  return {save,map,classDef,monsterHp,monsterAlive,playerDead,hit,damage,log,offline,setOffline,equip,socketCard,removeCard,consumeItem,buyItem,sellItem,changeMap,toggle,heal,addStat,chooseFirstJob,learnSkill,useSkill,cooldowns,availableSkills,activeSkills,activeBuff,effectiveAttack,passiveMultiplier,canChangeJob,baseNeed:expNeed(save.baseLevel),jobNeed:jobNeed(save.jobLevel),toggleAutoSkill,setAutoOption,questProgress,claimQuest,canRebirth,rebirth,resetSave}
}
