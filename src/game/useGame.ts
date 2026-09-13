import { useEffect, useMemo, useRef, useState } from 'react'
import { classes, items, maps, quests, skills, startingInventory, type StatKey, type EquipSlot } from './data'
import { equipOwned, equipmentReason, equipmentStats, cardReason, canConsume, healingAmount } from './equipment'
import { elementMultiplier, hubDefs, huntHub, jobMeta, jobOptions, levelRewardMultiplier, mvpRespawnMs, mvpRewardMultiplier, recommendedHunts, refineChance, refineCost, refineMaterial } from './progression'
import { canUseClassSkill, isMagicClass, marketReason } from './advancedSystems'

export type AutoConfig={enabledSkills:string[];healPct:number;useConsumables:boolean;autoSellCommon:boolean}
export type PartyMemberState={
  id:string;name:string;classId:string;baseLevel:number;jobLevel:number;baseExp:number;jobExp:number;kills:number;
  hp:number;maxHp:number;sp:number;maxSp:number;attack:number;defense:number;active:boolean;rebirths:number;
  statPoints:number;jobPoints:number;stats:Record<StatKey,number>;skillLevels:Record<string,number>;
  inventory:Record<string,number>;equipped:Partial<Record<EquipSlot,string>>;socketedCards:Partial<Record<EquipSlot,string>>;refinements:Record<string,number>;
}
export type SaveState={
  version:number;baseLevel:number;jobLevel:number;baseExp:number;jobExp:number;zeny:number;kills:number;hp:number;maxHp:number;sp:number;maxSp:number;
  attack:number;defense:number;mapId:string;inventory:Record<string,number>;equipped:Partial<Record<EquipSlot,string>>;socketedCards:Partial<Record<EquipSlot,string>>;
  refinements:Record<string,number>;
  lastSeen:number;running:boolean;classId:string;statPoints:number;jobPoints:number;stats:Record<StatKey,number>;skillLevels:Record<string,number>;
  firstJobChosen:boolean;unlockedClasses:string[];bestiary:Record<string,number>;claimedQuests:string[];auto:AutoConfig;rebirths:number;rebirthPoints:number;
  partySlots:number;partyMembers:PartyMemberState[];partyRemainderExp:number;partyRemainderJob:number;
}

const KEY='ragnarok-idle-save-v1'
const PARTY_SLOT_COSTS=[0,25_000,150_000] as const
const freshBase:SaveState={
  version:5,baseLevel:1,jobLevel:1,baseExp:0,jobExp:0,zeny:500,kills:0,hp:940,maxHp:940,sp:400,maxSp:400,attack:218,defense:38,
  mapId:'prontera-field',inventory:startingInventory,equipped:{weapon:'noviceSword',armor:'adventurerArmor'},socketedCards:{},refinements:{},lastSeen:Date.now(),running:true,
  classId:'novice',statPoints:6,jobPoints:1,stats:{str:10,agi:10,vit:10,int:10,dex:10,luk:10},skillLevels:{basicSkill:1,firstAid:1},firstJobChosen:false,unlockedClasses:['novice'],
  bestiary:{},claimedQuests:[],auto:{enabledSkills:[],healPct:35,useConsumables:true,autoSellCommon:false},rebirths:0,rebirthPoints:0,
  partySlots:1,partyMembers:[],partyRemainderExp:0,partyRemainderJob:0
}

function expNeed(level:number){return Math.round((350+level*115)*(1+Math.max(0,level-80)*.018))}
function jobNeed(level:number){return Math.round((250+level*90)*(1+Math.max(0,level-50)*.02))}
function roll(rate:number){return Math.random()*10000<rate}
function sellValue(id:string){const it=items[id];return it?.sell??Math.max(1,Math.floor((it?.buy||10)*.4))}
function partyLevelEligible(leaderLevel:number,memberLevel:number){return memberLevel>=Math.ceil(leaderLevel*2/3)&&memberLevel<=Math.floor(leaderLevel*3/2)}

function partyDerived(member:PartyMemberState){
  const {gear:eq,cards:socketCards,stats:bonus,refineAttack,refineDefense}=equipmentStats(member,items)
  const cls=classes.find(c=>c.id===member.classId)??classes[0]
  const str=member.stats.str+(cls.bonuses.str||0)+bonus.str,vit=member.stats.vit+(cls.bonuses.vit||0)+bonus.vit,int=member.stats.int+(cls.bonuses.int||0)+bonus.int,dex=member.stats.dex+(cls.bonuses.dex||0)+bonus.dex
  const rb=1+member.rebirths*.08
  const cardAttack=socketCards.reduce((a,i)=>a+(i.cardBonus?.attack||0),0),cardDefense=socketCards.reduce((a,i)=>a+(i.cardBonus?.defense||0),0)
  const cardHp=socketCards.reduce((a,i)=>a+(i.cardBonus?.hp||0),0),cardSp=socketCards.reduce((a,i)=>a+(i.cardBonus?.sp||0),0)
  const magic=isMagicClass(member.classId)
  return {
    attack:Math.round((180+(magic?int:str)*6+dex*2+eq.reduce((a,i)=>a+(magic?Math.max(i.magicAttack||0,i.attack||0):(i.attack||0)),0)+cardAttack+refineAttack)*rb),
    defense:Math.round((20+Math.floor(vit*1.8)+eq.reduce((a,i)=>a+(i.defense||0),0)+cardDefense+refineDefense)*rb),
    maxHp:Math.round((700+vit*24+eq.reduce((a,i)=>a+(i.hp||0),0)+cardHp)*rb),
    maxSp:Math.round((220+int*18+eq.reduce((a,i)=>a+(i.sp||0),0)+cardSp)*(1+member.rebirths*.04))
  }
}
function syncPartyMember(member:PartyMemberState){const d=partyDerived(member);return {...member,...d,hp:Math.min(member.hp||d.maxHp,d.maxHp),sp:Math.min(member.sp||d.maxSp,d.maxSp)}}
function createPartyMember(name:string,classId:string):PartyMemberState{
  const cls=classes.find(c=>c.id===classId)??classes[0]
  const baseLevel=classId==='novice'?1:Math.max(10,cls.minBase||1)
  const member:PartyMemberState={id:`party-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:name.trim()||'Aventureiro',classId:cls.id,baseLevel,jobLevel:1,baseExp:0,jobExp:0,kills:0,hp:1,maxHp:1,sp:1,maxSp:1,attack:1,defense:1,active:false,rebirths:0,statPoints:6,jobPoints:1,stats:{str:10,agi:10,vit:10,int:10,dex:10,luk:10},skillLevels:{basicSkill:1,firstAid:1},inventory:{...startingInventory},equipped:{weapon:'noviceSword',armor:'adventurerArmor'},socketedCards:{},refinements:{}}
  const d=partyDerived(member);return {...member,...d,hp:d.maxHp,sp:d.maxSp}
}
function migratePartyMember(raw:Partial<PartyMemberState>):PartyMemberState{
  const base=createPartyMember(raw.name||'Aventureiro',raw.classId||'novice')
  return syncPartyMember({...base,...raw,id:raw.id||base.id,name:raw.name||base.name,classId:raw.classId||base.classId,stats:{...base.stats,...(raw.stats||{})},skillLevels:{...base.skillLevels,...(raw.skillLevels||{})},inventory:{...base.inventory,...(raw.inventory||{})},equipped:{...(raw.equipped||base.equipped)},socketedCards:{...(raw.socketedCards||{})},refinements:{...(raw.refinements||{})}} as PartyMemberState)
}

function migrate(raw:Partial<SaveState>):SaveState{
  const merged={...freshBase,...raw} as SaveState
  const oldClass=raw.classId||'novice'
  const chosen=typeof raw.firstJobChosen==='boolean'?raw.firstJobChosen:oldClass!=='novice'
  const unlocked=Array.isArray(raw.unlockedClasses)&&raw.unlockedClasses.length?raw.unlockedClasses:chosen?['novice',oldClass]:['novice']
  return {...merged,version:5,classId:oldClass,firstJobChosen:chosen,unlockedClasses:Array.from(new Set(unlocked)),stats:{...freshBase.stats,...(raw.stats||{})},skillLevels:{...freshBase.skillLevels,...(raw.skillLevels||{})},inventory:{...startingInventory,...(raw.inventory||{})},socketedCards:{...(raw.socketedCards||{})},refinements:{...(raw.refinements||{})},bestiary:{...(raw.bestiary||{})},claimedQuests:[...(raw.claimedQuests||[])],auto:{...freshBase.auto,...(raw.auto||{})},partySlots:Math.max(1,Math.min(3,raw.partySlots||1)),partyMembers:Array.isArray(raw.partyMembers)?raw.partyMembers.slice(0,2).map(migratePartyMember):[],partyRemainderExp:raw.partyRemainderExp||0,partyRemainderJob:raw.partyRemainderJob||0,lastSeen:Date.now()}
}

function derived(s:SaveState){
  const {gear:eq,cards:socketCards,stats:bonus,refineAttack,refineDefense}=equipmentStats(s,items)
  const cls=classes.find(c=>c.id===s.classId)??classes[0]
  const str=s.stats.str+(cls.bonuses.str||0)+bonus.str,vit=s.stats.vit+(cls.bonuses.vit||0)+bonus.vit,int=s.stats.int+(cls.bonuses.int||0)+bonus.int,dex=s.stats.dex+(cls.bonuses.dex||0)+bonus.dex
  const rb=1+s.rebirths*.08
  const cardAttack=socketCards.reduce((a,i)=>a+(i.cardBonus?.attack||0),0),cardDefense=socketCards.reduce((a,i)=>a+(i.cardBonus?.defense||0),0)
  const cardHp=socketCards.reduce((a,i)=>a+(i.cardBonus?.hp||0),0),cardSp=socketCards.reduce((a,i)=>a+(i.cardBonus?.sp||0),0)
  const magic=isMagicClass(s.classId)
  const attack=Math.round((180+(magic?int:str)*6+dex*2+eq.reduce((a,i)=>a+(magic?Math.max(i.magicAttack||0,i.attack||0):(i.attack||0)),0)+cardAttack+refineAttack)*rb)
  const defense=Math.round((20+Math.floor(vit*1.8)+eq.reduce((a,i)=>a+(i.defense||0),0)+cardDefense+refineDefense)*rb)
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
function grantPartyMemberProgress(member:PartyMemberState,baseGain:number,jobGain:number){
  let baseExp=member.baseExp+baseGain,jobExp=member.jobExp+jobGain,baseLevel=member.baseLevel,jobLevel=member.jobLevel,statPoints=member.statPoints,jobPoints=member.jobPoints
  while(baseExp>=expNeed(baseLevel)){baseExp-=expNeed(baseLevel);baseLevel++;statPoints+=3}
  while(jobExp>=jobNeed(jobLevel)){jobExp-=jobNeed(jobLevel);jobLevel++;jobPoints++}
  return syncPartyMember({...member,baseExp,jobExp,baseLevel,jobLevel,statPoints,jobPoints})
}
function eligibleMembers(s:SaveState){return s.partyMembers.filter(m=>m.active&&m.hp>0&&partyLevelEligible(s.baseLevel,m.baseLevel)).slice(0,Math.max(0,s.partySlots-1))}
function partyAttackTotal(s:SaveState){return eligibleMembers(s).reduce((sum,m)=>sum+m.attack,0)}
function grantSharedPartyProgress(s:SaveState,baseReward:number,jobReward:number){
  const eligibleIds=new Set(eligibleMembers(s).map(m=>m.id)),size=1+eligibleIds.size
  if(size<=1)return grantProgress(s,baseReward,jobReward)
  const bonus=1+Math.min(.6,size*.1)
  const pooledBase=Math.max(1,Math.floor(baseReward*bonus))+s.partyRemainderExp,pooledJob=Math.max(1,Math.floor(jobReward*bonus))+s.partyRemainderJob
  const baseShare=Math.floor(pooledBase/size),jobShare=Math.floor(pooledJob/size)
  let next=grantProgress(s,baseShare,jobShare)
  next={...next,partyRemainderExp:pooledBase%size,partyRemainderJob:pooledJob%size,partyMembers:next.partyMembers.map(m=>eligibleIds.has(m.id)?grantPartyMemberProgress({...m,kills:m.kills+1},baseShare,jobShare):m)}
  return next
}

export function useGame(){
  const [save,setSave]=useState<SaveState>(()=>{try{const raw=localStorage.getItem(KEY);return raw?migrate(JSON.parse(raw)):freshBase}catch{return freshBase}})
  const map=useMemo(()=>maps.find(m=>m.id===save.mapId)??maps[0],[save.mapId])
  const classDef=useMemo(()=>classes.find(c=>c.id===save.classId)??classes[0],[save.classId])
  const [monsterHp,setMonsterHp]=useState(map.monsterHp)
  const [monsterAlive,setMonsterAlive]=useState(true)
  const monsterHpRef=useRef(map.monsterHp),aliveRef=useRef(true),respawnTimer=useRef<number|undefined>(undefined)
  const [playerDead,setPlayerDead]=useState(false)
  const [hit,setHit]=useState(0)
  const [damage,setDamage]=useState(0)
  const [log,setLog]=useState<string[]>(['Sistemas carregados. Auto Hunt pronto.'])
  const [offline,setOffline]=useState<{seconds:number;exp:number;job:number;zeny:number;kills:number;drops:Record<string,number>}|null>(null)
  const [cooldowns,setCooldowns]=useState<Record<string,number>>({})
  const [activeBuff,setActiveBuff]=useState<{name:string;multiplier:number;until:number}|null>(null)

  const derivedStats=useMemo(()=>derived(save),[save.classId,save.stats,save.equipped,save.socketedCards,save.refinements,save.rebirths])
  const inheritedSkills=useMemo(()=>skills.filter(sk=>canUseClassSkill(save.classId,sk.classId)),[save.classId])
  const passiveMultiplier=useMemo(()=>inheritedSkills.filter(sk=>sk.kind==='passive').reduce((mult,sk)=>mult*(1+(sk.power-1)*(save.skillLevels[sk.id]||0)),1),[inheritedSkills,save.skillLevels])
  const buffMultiplier=activeBuff&&activeBuff.until>Date.now()?activeBuff.multiplier:1
  const partyAttack=useMemo(()=>partyAttackTotal(save),[save.partyMembers,save.partySlots,save.baseLevel])
  const effectiveAttack=Math.round((save.attack+partyAttack)*passiveMultiplier*buffMultiplier)
  const activeSkills=useMemo(()=>inheritedSkills.filter(sk=>sk.kind!=='passive'),[inheritedSkills])
  const jobChoices=useMemo(()=>jobOptions(save.classId,save.baseLevel,save.jobLevel,save.rebirths),[save.classId,save.baseLevel,save.jobLevel,save.rebirths])
  const huntRecommendations=useMemo(()=>recommendedHunts(maps,save.baseLevel,effectiveAttack,save.defense,12),[save.baseLevel,effectiveAttack,save.defense])
  const currentHub=hubDefs.find(h=>h.id===huntHub(map))??hubDefs[0]
  const partyEligibleCount=eligibleMembers(save).length

  useEffect(()=>{setSave(s=>{const d=derived(s);if(s.attack===d.attack&&s.defense===d.defense&&s.maxHp===d.maxHp&&s.maxSp===d.maxSp)return s;return {...s,attack:d.attack,defense:d.defense,maxHp:d.maxHp,maxSp:d.maxSp,hp:Math.min(s.hp,d.maxHp),sp:Math.min(s.sp,d.maxSp)}})},[derivedStats.attack,derivedStats.defense,derivedStats.maxHp,derivedStats.maxSp])

  useEffect(()=>{
    try{
      const rawText=localStorage.getItem(KEY);if(!rawText)return
      const parsed=JSON.parse(rawText);const prev=migrate(parsed);if(!prev.running)return
      const seconds=Math.max(0,Math.min(8*3600,Math.floor((Date.now()-(parsed.lastSeen||Date.now()))/1000)));if(seconds<30)return
      const m=maps.find(x=>x.id===prev.mapId)??maps[0];if(m.boss)return
      const ds=derived(prev),partyAtk=partyAttackTotal(prev);const elemental=elementMultiplier('Neutral',m.element);const hitDamage=Math.max(1,(ds.attack+partyAtk-m.monsterDef)*elemental);const hits=Math.max(1,Math.ceil(m.monsterHp/hitDamage));const cycle=1.2*hits;const incoming=Math.max(1,m.monsterAtk-ds.defense/5)/(1+eligibleMembers(prev).length)
      if(m.imported&&incoming*hits>=ds.maxHp)return
      const kills=Math.floor(seconds/cycle);if(kills<=0)return
      const rewardScale=levelRewardMultiplier(prev.baseLevel,m.monsterLevel)
      const exp=Math.floor(kills*m.exp*rewardScale),job=Math.floor(kills*m.jobExp*rewardScale),zeny=Math.floor(kills*m.zeny*rewardScale),drops:Record<string,number>={}
      for(const dr of m.drops){const qty=Math.floor(kills*Math.min(10000,dr.rate*(1+ds.dropBonus/100))/10000);if(qty>0)drops[dr.itemId]=(drops[dr.itemId]||0)+qty}
      setSave(s=>{let next=grantSharedPartyProgress(s,exp,job);const inv={...next.inventory};let extraZeny=0;for(const [id,qty] of Object.entries(drops)){const it=items[id];if(next.auto.autoSellCommon&&it?.rarity==='common'&&it.type==='material'&&!it.noSell)extraZeny+=sellValue(id)*qty;else inv[id]=(inv[id]||0)+qty}return {...next,inventory:inv,zeny:next.zeny+zeny+extraZeny,kills:next.kills+kills,bestiary:{...next.bestiary,[m.bestiaryKey||m.monster]:(next.bestiary[m.bestiaryKey||m.monster]||0)+kills}}})
      setOffline({seconds,exp,job,zeny,kills,drops})
    }catch{}
  },[])

  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify({...save,lastSeen:Date.now()}))},[save])
  useEffect(()=>{window.clearTimeout(respawnTimer.current);monsterHpRef.current=map.monsterHp;aliveRef.current=true;setMonsterHp(map.monsterHp);setMonsterAlive(true);return()=>window.clearTimeout(respawnTimer.current)},[map.id,map.monsterHp])
  useEffect(()=>{const t=window.setInterval(()=>{setCooldowns(c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.max(0,v-1)])));setActiveBuff(b=>b&&b.until<=Date.now()?null:b)},1000);return()=>window.clearInterval(t)},[])
  const deadPartySignature=save.partyMembers.filter(m=>m.active&&m.hp<=0).map(m=>m.id).join('|')
  useEffect(()=>{if(!deadPartySignature)return;const ids=new Set(deadPartySignature.split('|'));const timer=window.setTimeout(()=>setSave(s=>({...s,partyMembers:s.partyMembers.map(m=>ids.has(m.id)?{...m,hp:m.maxHp,sp:m.maxSp}:m)})),3000);return()=>window.clearTimeout(timer)},[deadPartySignature])

  const rewardKill=()=>{
    if(!aliveRef.current)return
    aliveRef.current=false
    setMonsterAlive(false)
    const ds=derived(save),rewardScale=levelRewardMultiplier(save.baseLevel,map.monsterLevel)*mvpRewardMultiplier(map)
    const dropBoost=1+ds.dropBonus/100
    const rolled=map.drops.filter(dr=>roll(Math.min(10000,dr.rate*dropBoost)))
    const dropped=rolled.map(dr=>items[dr.itemId]?.name||dr.itemId)
    const expReward=Math.max(1,Math.floor(map.exp*rewardScale)),jobReward=Math.max(1,Math.floor(map.jobExp*rewardScale)),zenyReward=Math.max(1,Math.floor(map.zeny*rewardScale))
    const groupSize=1+eligibleMembers(save).length
    setSave(s=>{
      let next=grantSharedPartyProgress(s,expReward,jobReward);const inv={...next.inventory};let bonusZeny=0
      for(const dr of rolled){const it=items[dr.itemId];if(next.auto.autoSellCommon&&it?.rarity==='common'&&it.type==='material'&&!it.noSell)bonusZeny+=sellValue(dr.itemId);else inv[dr.itemId]=(inv[dr.itemId]||0)+1}
      return {...next,inventory:inv,zeny:next.zeny+zenyReward+bonusZeny,kills:next.kills+1,bestiary:{...next.bestiary,[map.bestiaryKey||map.monster]:(next.bestiary[map.bestiaryKey||map.monster]||0)+1},hp:Math.min(next.maxHp,next.hp+(map.boss?25:8)),sp:Math.min(next.maxSp,next.sp+(map.boss?12:3))}
    })
    setLog(l=>[`${map.boss?'MVP ':' '}${map.monster} derrotado! +${expReward} EXP · +${jobReward} Job EXP${groupSize>1?` · XP dividido entre ${groupSize}`:''} · +${zenyReward} Zeny${dropped.length?` · Drop: ${dropped.join(', ')}`:''}`,...l].slice(0,7))
    respawnTimer.current=window.setTimeout(()=>{monsterHpRef.current=map.monsterHp;aliveRef.current=true;setMonsterHp(map.monsterHp);setMonsterAlive(true)},mvpRespawnMs(map))
  }

  useEffect(()=>{
    if(!save.running||!monsterAlive||playerDead)return
    const speed=Math.max(520,1200-save.stats.agi*8)
    const timer=window.setInterval(()=>{
      const variance=Math.floor(Math.random()*21)-10;const critChance=Math.min(45,5+save.stats.luk*.35);const crit=Math.random()*100<critChance
      const element=elementMultiplier('Neutral',map.element)
      const dealt=Math.max(1,Math.round((effectiveAttack-map.monsterDef+variance)*(crit?1.6:1)*element));setDamage(dealt);setHit(v=>v+1)
      const dodge=Math.min(.5,save.stats.agi*.004);const rawIncoming=Math.random()<dodge?0:Math.max(1,Math.round(map.monsterAtk-save.defense/5));const participantCount=1+partyEligibleCount;const incoming=Math.ceil(rawIncoming/participantCount)
      setSave(s=>{const nextHp=Math.max(0,s.hp-incoming);const eligibleIds=new Set(eligibleMembers(s).map(m=>m.id));const partyMembers=s.partyMembers.map(m=>eligibleIds.has(m.id)?{...m,hp:Math.max(0,m.hp-incoming)}:m);if(nextHp===0){setPlayerDead(true);setLog(l=>['Você foi derrotado. Respawn em 3 segundos.',...l].slice(0,7));window.setTimeout(()=>{setSave(current=>({...current,hp:current.maxHp,sp:current.maxSp}));setPlayerDead(false)},3000)}return {...s,hp:nextHp,partyMembers}})
      const next=Math.max(0,monsterHpRef.current-dealt);monsterHpRef.current=next;setMonsterHp(next);setLog(l=>[`${dealt} de dano${partyEligibleCount?` (${partyEligibleCount+1} membros)`:''}${element!==1?` · ${Math.round(element*100)}% elemental`:''} em ${map.monster}.`,...l].slice(0,7));if(next===0)rewardKill()
    },speed)
    return()=>window.clearInterval(timer)
  },[save.running,save.defense,save.stats.agi,save.stats.luk,save.partyMembers,save.partySlots,map,monsterAlive,playerDead,effectiveAttack,partyEligibleCount])

  const useSkill=(id:string)=>{
    const sk=skills.find(x=>x.id===id);const lvl=save.skillLevels[id]||0;if(!sk||sk.kind==='passive'||lvl<=0||(cooldowns[id]||0)>0||save.sp<sk.spCost||playerDead)return
    if(!canUseClassSkill(save.classId,sk.classId))return
    setSave(s=>({...s,sp:s.sp-sk.spCost}));setCooldowns(c=>({...c,[id]:sk.cooldown}))
    if(sk.kind==='heal'){const amount=Math.round(save.maxHp*(sk.power+.03*lvl));setSave(s=>({...s,hp:Math.min(s.maxHp,s.hp+amount)}));setLog(l=>[`${sk.name} recuperou ${amount} HP.`,...l].slice(0,7));return}
    if(sk.kind==='buff'){setActiveBuff({name:sk.name,multiplier:sk.power+.02*lvl,until:Date.now()+6000});setLog(l=>[`${sk.name} ativado por 6 segundos.`,...l].slice(0,7));return}
    const element=elementMultiplier(sk.element,map.element)
    const dealt=Math.max(1,Math.round((effectiveAttack*(sk.power+.06*lvl)-map.monsterDef)*element));setDamage(dealt);setHit(v=>v+1);(()=>{if(!aliveRef.current)return;const next=Math.max(0,monsterHpRef.current-dealt);monsterHpRef.current=next;setMonsterHp(next);if(next===0)rewardKill()})();setLog(l=>[`${sk.name}${sk.element?` [${sk.element}]`:''} causou ${dealt} de dano${element!==1?` · afinidade ${Math.round(element*100)}%`:''}.`,...l].slice(0,7))
  }

  useEffect(()=>{
    if(!save.running||playerDead)return
    const timer=window.setInterval(()=>{
      const hpPct=save.hp/save.maxHp*100
      if(hpPct<=save.auto.healPct){const heal=activeSkills.find(sk=>sk.kind==='heal'&&(save.skillLevels[sk.id]||0)>0&&(cooldowns[sk.id]||0)<=0&&save.sp>=sk.spCost);if(heal){useSkill(heal.id);return}if(save.auto.useConsumables){const food=Object.keys(save.inventory).find(id=>save.inventory[id]>0&&items[id]&&canConsume(items[id])&&((items[id].hp||0)>0||(items[id].heal?.hp?.[1]||0)>0||(items[id].heal?.hpPercent?.[1]||0)>0));if(food){consumeItem(food);return}}}
      const attackSkill=activeSkills.find(sk=>save.auto.enabledSkills.includes(sk.id)&&sk.kind!=='heal'&&(save.skillLevels[sk.id]||0)>0&&(cooldowns[sk.id]||0)<=0&&save.sp>=sk.spCost);if(attackSkill)useSkill(attackSkill.id)
    },1400)
    return()=>window.clearInterval(timer)
  },[save.running,save.hp,save.maxHp,save.sp,save.inventory,save.auto,save.skillLevels,cooldowns,playerDead,activeSkills])

  const equip=(id:string)=>{const item=items[id];if(!item)return;const reason=equipmentReason(save,item);if(reason){setLog(l=>[reason,...l].slice(0,7));return}setSave(s=>equipOwned(s,item))}
  const unequip=(slot:EquipSlot)=>setSave(s=>{const id=s.equipped[slot];if(!id)return s;const equipped={...s.equipped},socketedCards={...s.socketedCards},inventory={...s.inventory};for(const [key,value] of Object.entries(equipped) as [EquipSlot,string][]){if(value!==id)continue;delete equipped[key];const card=socketedCards[key];if(card){inventory[card]=(inventory[card]||0)+1;delete socketedCards[key]}}return {...s,equipped,socketedCards,inventory}})
  const socketCard=(slot:EquipSlot,cardId:string)=>{const c=items[cardId];if(!c)return;const reason=cardReason(save,slot,c,items);if(reason){setLog(l=>[reason,...l].slice(0,7));return};setSave(s=>{const inv={...s.inventory,[cardId]:(s.inventory[cardId]||0)-1};const old=s.socketedCards[slot];if(old)inv[old]=(inv[old]||0)+1;return {...s,inventory:inv,socketedCards:{...s.socketedCards,[slot]:cardId}}})}
  const removeCard=(slot:EquipSlot)=>setSave(s=>{const old=s.socketedCards[slot];if(!old)return s;return {...s,inventory:{...s.inventory,[old]:(s.inventory[old]||0)+1},socketedCards:{...s.socketedCards,[slot]:undefined}}})
  const consumeItem=(id:string)=>{const it=items[id];if(!it||!canConsume(it))return;setSave(s=>{if((s.inventory[id]||0)<=0)return s;const heal=healingAmount(it,s.maxHp,s.maxSp);return {...s,inventory:{...s.inventory,[id]:s.inventory[id]-1},hp:Math.min(s.maxHp,s.hp+heal.hp),sp:Math.min(s.maxSp,s.sp+heal.sp)}})}
  const buyCatalogItem=(id:string)=>{const it=items[id];if(!it?.marketPrice)return;const reason=marketReason(it,save.baseLevel);if(reason){setLog(l=>[reason,...l].slice(0,7));return}setSave(s=>s.zeny<it.marketPrice!?s:{...s,zeny:s.zeny-it.marketPrice!,inventory:{...s.inventory,[it.id]:(s.inventory[it.id]||0)+1}})}
  const buyItem=(id:string)=>{const it=items[id];if(!it?.buy||save.zeny<it.buy)return;setSave(s=>s.zeny<it.buy!?s:{...s,zeny:s.zeny-it.buy!,inventory:{...s.inventory,[id]:(s.inventory[id]||0)+1}})}
  const sellItem=(id:string,qty=1)=>{if(!Number.isInteger(qty)||qty<=0||items[id]?.noSell||(save.inventory[id]||0)<qty)return;const equipped=Object.values(save.equipped).includes(id);if(equipped&&save.inventory[id]<=1)return;setSave(s=>({...s,zeny:s.zeny+sellValue(id)*qty,inventory:{...s.inventory,[id]:Math.max(0,(s.inventory[id]||0)-qty)}}))}
  const changeMap=(id:string)=>{const next=maps.find(m=>m.id===id);if(!next||save.baseLevel<next.minLevel)return;setSave(s=>({...s,mapId:id}))}
  const toggle=()=>setSave(s=>({...s,running:!s.running}))
  const heal=()=>setSave(s=>({...s,hp:s.maxHp,sp:s.maxSp,partyMembers:s.partyMembers.map(m=>({...m,hp:m.maxHp,sp:m.maxSp}))}))
  const addStat=(key:StatKey)=>setSave(s=>s.statPoints<=0?s:{...s,statPoints:s.statPoints-1,stats:{...s.stats,[key]:s.stats[key]+1}})
  const chooseFirstJob=(id:string)=>{const c=classes.find(x=>x.id===id),meta=jobMeta[id];if(!c||!meta||meta.tier!=='first'||meta.parent!=='novice'||save.firstJobChosen||save.classId!=='novice'||save.baseLevel<meta.minBase||save.jobLevel<meta.minJob)return;setSave(s=>({...s,classId:id,firstJobChosen:true,unlockedClasses:Array.from(new Set([...s.unlockedClasses,id])),jobLevel:1,jobExp:0,jobPoints:1}));setLog(l=>[`Mudança de classe: ${c.name}!`,...l].slice(0,7))}
  const promoteJob=(id:string)=>{const choice=jobChoices.find(c=>c.id===id);if(!choice)return;setSave(s=>({...s,classId:id,unlockedClasses:Array.from(new Set([...s.unlockedClasses,id])),jobLevel:1,jobExp:0,jobPoints:1}));setLog(l=>[`Evolução de classe: ${choice.name}!`,...l].slice(0,7))}
  const learnSkill=(id:string)=>{const sk=skills.find(x=>x.id===id);if(!sk)return;setSave(s=>{if(!canUseClassSkill(s.classId,sk.classId))return s;const lvl=s.skillLevels[id]||0;const prereqOk=!sk.requires||(s.skillLevels[sk.requires.skillId]||0)>=sk.requires.level;if(!prereqOk||lvl>=sk.maxLevel||s.jobPoints<sk.jobPointCost)return s;return {...s,jobPoints:s.jobPoints-sk.jobPointCost,skillLevels:{...s.skillLevels,[id]:lvl+1}}})}
  const refine=(slot:EquipSlot)=>{
    const id=save.equipped[slot];if(!id)return
    const it=items[id];if(!it||it.type!=='equipment')return
    const current=save.refinements[id]||0;if(current>=10){setLog(l=>[`${it.name} já está no refino máximo +10.`,...l].slice(0,7));return}
    const material=refineMaterial(it),cost=refineCost(it,current),chance=refineChance(it,current)
    if((save.inventory[material]||0)<1){setLog(l=>[`Refino requer ${items[material]?.name||material}.`,...l].slice(0,7));return}
    if(save.zeny<cost){setLog(l=>[`Refino requer ${cost.toLocaleString('pt-BR')} Zeny.`,...l].slice(0,7));return}
    const success=Math.random()<chance
    setSave(s=>({...s,zeny:s.zeny-cost,inventory:{...s.inventory,[material]:Math.max(0,(s.inventory[material]||0)-1)},refinements:{...s.refinements,[id]:success?current+1:Math.max(0,current-1)}}))
    setLog(l=>[success?`Refino bem-sucedido: ${it.name} +${current+1}!`:`Refino falhou: ${it.name} voltou para +${Math.max(0,current-1)}.`,...l].slice(0,7))
  }
  const toggleAutoSkill=(id:string)=>setSave(s=>({...s,auto:{...s.auto,enabledSkills:s.auto.enabledSkills.includes(id)?s.auto.enabledSkills.filter(x=>x!==id):[...s.auto.enabledSkills,id]}}))
  const setAutoOption=<K extends keyof AutoConfig>(key:K,value:AutoConfig[K])=>setSave(s=>({...s,auto:{...s.auto,[key]:value}}))

  const unlockPartySlot=()=>setSave(s=>{if(s.partySlots>=3)return s;const cost=PARTY_SLOT_COSTS[s.partySlots]||150_000;if(s.zeny<cost){setLog(l=>[`São necessários ${cost.toLocaleString('pt-BR')} Zeny para desbloquear o próximo slot da Party.`,...l].slice(0,7));return s}setLog(l=>[`Novo slot da Party desbloqueado por ${cost.toLocaleString('pt-BR')} Zeny.`,...l].slice(0,7));return {...s,zeny:s.zeny-cost,partySlots:s.partySlots+1}})
  const addPartyMember=(name:string,classId:string)=>setSave(s=>s.partyMembers.length>=Math.max(0,s.partySlots-1)?s:{...s,partyMembers:[...s.partyMembers,createPartyMember(name,classId)]})
  const removePartyMember=(id:string)=>setSave(s=>({...s,partyMembers:s.partyMembers.filter(m=>m.id!==id)}))
  const togglePartyMember=(id:string)=>setSave(s=>({...s,partyMembers:s.partyMembers.map(m=>m.id===id?{...m,active:!m.active}:m)}))
  const healPartyMember=(id:string)=>setSave(s=>({...s,partyMembers:s.partyMembers.map(m=>m.id===id?{...m,hp:m.maxHp,sp:m.maxSp}:m)}))
  const addPartyStat=(id:string,key:StatKey)=>setSave(s=>({...s,partyMembers:s.partyMembers.map(m=>{if(m.id!==id||m.statPoints<=0)return m;return syncPartyMember({...m,statPoints:m.statPoints-1,stats:{...m.stats,[key]:m.stats[key]+1}})})}))
  const equipPartyMember=(memberId:string,itemId:string)=>{const item=items[itemId];if(!item)return;setSave(s=>({...s,partyMembers:s.partyMembers.map(m=>{if(m.id!==memberId)return m;const reason=equipmentReason(m,item);if(reason){setLog(l=>[`${m.name}: ${reason}`,...l].slice(0,7));return m}return syncPartyMember(equipOwned(m,item))})}))}
  const unequipPartyMember=(memberId:string,slot:EquipSlot)=>setSave(s=>({...s,partyMembers:s.partyMembers.map(m=>{if(m.id!==memberId||!m.equipped[slot])return m;const equipped={...m.equipped};delete equipped[slot];return syncPartyMember({...m,equipped})})}))
  const givePartyItem=(memberId:string,itemId:string)=>setSave(s=>{if((s.inventory[itemId]||0)<=0)return s;return {...s,inventory:{...s.inventory,[itemId]:s.inventory[itemId]-1},partyMembers:s.partyMembers.map(m=>m.id===memberId?{...m,inventory:{...m.inventory,[itemId]:(m.inventory[itemId]||0)+1}}:m)}})
  const takePartyItem=(memberId:string,itemId:string)=>setSave(s=>{const member=s.partyMembers.find(m=>m.id===memberId);if(!member||(member.inventory[itemId]||0)<=0||Object.values(member.equipped).includes(itemId))return s;return {...s,inventory:{...s.inventory,[itemId]:(s.inventory[itemId]||0)+1},partyMembers:s.partyMembers.map(m=>m.id===memberId?{...m,inventory:{...m.inventory,[itemId]:m.inventory[itemId]-1}}:m)}})

  const questProgress=(id:string)=>{const q=quests.find(x=>x.id===id);if(!q)return 0;return q.type==='kill'?(save.bestiary[q.target]||0):(save.inventory[q.target]||0)}
  const claimQuest=(id:string)=>{const q=quests.find(x=>x.id===id);if(!q||save.claimedQuests.includes(id)||questProgress(id)<q.amount)return;setSave(s=>{let next=grantProgress(s,q.reward.exp||0,q.reward.job||0);const inv={...next.inventory};if(q.reward.itemId)inv[q.reward.itemId]=(inv[q.reward.itemId]||0)+(q.reward.itemQty||1);return {...next,inventory:inv,zeny:next.zeny+(q.reward.zeny||0),claimedQuests:[...next.claimedQuests,id]}})}

  const canRebirth=save.baseLevel>=99&&save.classId!=='novice'
  const rebirth=()=>{if(!canRebirth)return;const rb=save.rebirths+1;setSave({...freshBase,partySlots:save.partySlots,partyMembers:save.partyMembers,rebirths:rb,rebirthPoints:save.rebirthPoints+1,zeny:Math.max(5000,Math.floor(save.zeny*.1)),lastSeen:Date.now()});setLog([`Rebirth ${rb} concluído! Linhas transcendentes foram liberadas para esta jornada.`])}
  const resetSave=()=>{localStorage.removeItem(KEY);setSave({...freshBase,lastSeen:Date.now()});setLog(['Novo jogo iniciado.'])}

  const availableSkills=inheritedSkills
  const canChangeJob=save.classId==='novice'&&!save.firstJobChosen&&save.baseLevel>=10&&save.jobLevel>=10
  return {save,map,classDef,monsterHp,monsterAlive,playerDead,hit,damage,log,offline,setOffline,equip,unequip,buyCatalogItem,socketCard,removeCard,consumeItem,buyItem,sellItem,changeMap,toggle,heal,addStat,chooseFirstJob,promoteJob,jobChoices,learnSkill,useSkill,cooldowns,availableSkills,activeSkills,activeBuff,effectiveAttack,partyAttack,partyEligibleCount,passiveMultiplier,canChangeJob,baseNeed:expNeed(save.baseLevel),jobNeed:jobNeed(save.jobLevel),partyBaseNeed:expNeed,partyJobNeed:jobNeed,toggleAutoSkill,setAutoOption,questProgress,claimQuest,canRebirth,rebirth,resetSave,refine,huntRecommendations,currentHub,unlockPartySlot,addPartyMember,removePartyMember,togglePartyMember,healPartyMember,addPartyStat,equipPartyMember,unequipPartyMember,givePartyItem,takePartyItem,partySlotCost:save.partySlots>=3?0:(PARTY_SLOT_COSTS[save.partySlots]||150_000),partyLevelEligible}
}
