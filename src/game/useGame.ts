import { useEffect, useMemo, useState } from 'react'
import { classes, items, maps, skills, startingInventory, type StatKey } from './data'

export type SaveState={
  baseLevel:number;jobLevel:number;baseExp:number;jobExp:number;zeny:number;kills:number;hp:number;maxHp:number;sp:number;maxSp:number;
  attack:number;defense:number;mapId:string;inventory:Record<string,number>;equipped:{weapon?:string;armor?:string;shield?:string};
  lastSeen:number;running:boolean;classId:string;statPoints:number;jobPoints:number;stats:Record<StatKey,number>;skillLevels:Record<string,number>;
  firstJobChosen:boolean;unlockedClasses:string[];
}

const KEY='ragnarok-idle-save-v1'
const base:SaveState={
  baseLevel:1,jobLevel:1,baseExp:0,jobExp:0,zeny:500,kills:0,hp:900,maxHp:900,sp:250,maxSp:250,attack:210,defense:38,
  mapId:'prontera-field',inventory:startingInventory,equipped:{weapon:'noviceSword',armor:'adventurerArmor'},lastSeen:Date.now(),running:true,
  classId:'novice',statPoints:6,jobPoints:1,stats:{str:10,agi:10,vit:10,int:10,dex:10,luk:10},skillLevels:{basicSkill:1,firstAid:1},
  firstJobChosen:false,unlockedClasses:['novice']
}

function expNeed(level:number){return 10000+level*450}
function jobNeed(level:number){return 7000+level*300}
function roll(rate:number){return Math.random()*10000<rate}

function migrate(raw:Partial<SaveState>):SaveState{
  const merged={...base,...raw} as SaveState
  const oldClass=raw.classId||'novice'
  const chosen=typeof raw.firstJobChosen==='boolean'?raw.firstJobChosen:oldClass!=='novice'
  const unlocked=Array.isArray(raw.unlockedClasses)&&raw.unlockedClasses.length?raw.unlockedClasses:chosen?['novice',oldClass]:['novice']
  return {...merged,classId:oldClass,firstJobChosen:chosen,unlockedClasses:Array.from(new Set(unlocked)),stats:{...base.stats,...(raw.stats||{})},skillLevels:{...base.skillLevels,...(raw.skillLevels||{})},inventory:{...startingInventory,...(raw.inventory||{})},lastSeen:Date.now()}
}

function derive(s:SaveState){
  const eq=Object.values(s.equipped).filter(Boolean).map(id=>items[id as string]).filter(Boolean)
  const cls=classes.find(c=>c.id===s.classId)??classes[0]
  const str=s.stats.str+(cls.bonuses.str||0),vit=s.stats.vit+(cls.bonuses.vit||0),int=s.stats.int+(cls.bonuses.int||0),dex=s.stats.dex+(cls.bonuses.dex||0)
  const attack=180+str*6+dex*2+eq.reduce((a,i)=>a+(i.attack||0),0)
  const defense=20+Math.floor(vit*1.8)+eq.reduce((a,i)=>a+(i.defense||0),0)
  const maxHp=700+vit*24+eq.reduce((a,i)=>a+(i.hp||0),0)
  const maxSp=220+int*18+eq.reduce((a,i)=>a+(i.sp||0),0)
  return {attack,defense,maxHp,maxSp}
}

export function useGame(){
  const [save,setSave]=useState<SaveState>(()=>{try{const raw=localStorage.getItem(KEY);return raw?migrate(JSON.parse(raw)):base}catch{return base}})
  const map=useMemo(()=>maps.find(m=>m.id===save.mapId)??maps[0],[save.mapId])
  const classDef=useMemo(()=>classes.find(c=>c.id===save.classId)??classes[0],[save.classId])
  const [monsterHp,setMonsterHp]=useState(map.monsterHp)
  const [monsterAlive,setMonsterAlive]=useState(true)
  const [playerDead,setPlayerDead]=useState(false)
  const [hit,setHit]=useState(0)
  const [damage,setDamage]=useState(0)
  const [log,setLog]=useState<string[]>(['Banco rAthena carregado. A caçada automática está ativa.'])
  const [offline,setOffline]=useState<{seconds:number;exp:number;job:number;zeny:number;kills:number}|null>(null)
  const [cooldowns,setCooldowns]=useState<Record<string,number>>({})
  const [activeBuff,setActiveBuff]=useState<{name:string;multiplier:number;until:number}|null>(null)

  const passiveMultiplier=useMemo(()=>skills.filter(sk=>sk.kind==='passive'&&(sk.classId==='novice'||sk.classId===save.classId)).reduce((mult,sk)=>{
    const lvl=save.skillLevels[sk.id]||0
    return mult*(1+(sk.power-1)*lvl)
  },1),[save.classId,save.skillLevels])
  const buffMultiplier=activeBuff&&activeBuff.until>Date.now()?activeBuff.multiplier:1
  const effectiveAttack=Math.round(save.attack*passiveMultiplier*buffMultiplier)
  const activeSkills=useMemo(()=>skills.filter(sk=>(sk.classId===save.classId||sk.classId==='novice')&&sk.kind!=='passive'),[save.classId])

  useEffect(()=>{setSave(s=>{const d=derive(s);return {...s,...d,hp:Math.min(s.hp,d.maxHp),sp:Math.min(s.sp,d.maxSp)}})},[save.classId,save.stats.str,save.stats.vit,save.stats.int,save.stats.dex,save.equipped.weapon,save.equipped.armor,save.equipped.shield])

  useEffect(()=>{
    try{
      const rawText=localStorage.getItem(KEY);if(!rawText)return
      const parsed=JSON.parse(rawText);const prev=migrate(parsed)
      const seconds=Math.max(0,Math.min(8*3600,Math.floor((Date.now()-(parsed.lastSeen||Date.now()))/1000)))
      if(seconds<30||!prev.running)return
      const m=maps.find(x=>x.id===prev.mapId)??maps[0]
      const cycle=1.2*Math.max(1,Math.ceil(m.monsterHp/Math.max(1,prev.attack-m.monsterDef)))
      const kills=Math.floor(seconds/cycle);if(kills<=0)return
      const exp=kills*m.exp,job=kills*m.jobExp,zeny=kills*m.zeny
      setSave(s=>{
        const inv={...s.inventory}
        for(const d of m.drops){const qty=Math.floor(kills*d.rate/10000);if(qty>0)inv[d.itemId]=(inv[d.itemId]||0)+qty}
        return {...s,inventory:inv,baseExp:s.baseExp+exp,jobExp:s.jobExp+job,zeny:s.zeny+zeny,kills:s.kills+kills}
      })
      setOffline({seconds,exp,job,zeny,kills})
    }catch{}
  },[])

  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify({...save,lastSeen:Date.now()}))},[save])
  useEffect(()=>{setMonsterHp(map.monsterHp);setMonsterAlive(true)},[map.id,map.monsterHp])
  useEffect(()=>{const t=window.setInterval(()=>{setCooldowns(c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.max(0,v-1)])));setActiveBuff(b=>b&&b.until<=Date.now()?null:b)},1000);return()=>window.clearInterval(t)},[])

  const rewardKill=()=>{
    setMonsterAlive(false)
    const dropped:string[]=[]
    setSave(s=>{
      const inv={...s.inventory}
      for(const d of map.drops){if(roll(d.rate)){inv[d.itemId]=(inv[d.itemId]||0)+1;dropped.push(items[d.itemId]?.name||d.itemId)}}
      let baseExp=s.baseExp+map.exp,jobExp=s.jobExp+map.jobExp,baseLevel=s.baseLevel,jobLevel=s.jobLevel,statPoints=s.statPoints,jobPoints=s.jobPoints
      while(baseExp>=expNeed(baseLevel)){baseExp-=expNeed(baseLevel);baseLevel++;statPoints+=3}
      while(jobExp>=jobNeed(jobLevel)){jobExp-=jobNeed(jobLevel);jobLevel++;jobPoints+=1}
      return {...s,inventory:inv,baseExp,jobExp,baseLevel,jobLevel,statPoints,jobPoints,zeny:s.zeny+map.zeny,kills:s.kills+1,hp:Math.min(s.maxHp,s.hp+18)}
    })
    const loot=dropped.length?` · Drop: ${dropped.join(', ')}`:''
    setLog(l=>[`${map.monster} derrotado! +${map.exp} EXP · +${map.jobExp} Job EXP · +${map.zeny} Zeny${loot}`,...l].slice(0,6))
    window.setTimeout(()=>{setMonsterHp(map.monsterHp);setMonsterAlive(true)},1200)
  }

  useEffect(()=>{
    if(!save.running||!monsterAlive||playerDead)return
    const timer=window.setInterval(()=>{
      const variance=Math.floor(Math.random()*21)-10
      const dealt=Math.max(1,effectiveAttack-map.monsterDef+variance)
      setDamage(dealt);setHit(v=>v+1)
      const incoming=Math.max(1,Math.round(map.monsterAtk-save.defense/5))
      setSave(s=>{
        const nextHp=Math.max(0,s.hp-incoming)
        if(nextHp===0){setPlayerDead(true);setLog(l=>['Você foi derrotado. Respawn em Prontera em 3 segundos.',...l].slice(0,6));window.setTimeout(()=>{setSave(current=>({...current,hp:current.maxHp,sp:current.maxSp}));setPlayerDead(false);setLog(l=>['Você renasceu com HP e SP restaurados.',...l].slice(0,6))},3000)}
        return {...s,hp:nextHp}
      })
      setMonsterHp(hp=>{const next=hp-dealt;setLog(l=>[`Você causou ${dealt} de dano em ${map.monster}.`,...l].slice(0,6));if(next>0)return next;rewardKill();return 0})
    },1200)
    return()=>window.clearInterval(timer)
  },[save.running,save.defense,map,monsterAlive,playerDead,effectiveAttack])

  const equip=(id:string)=>{
    const item=items[id];if(!item||item.type!=='equipment'||!item.slot)return
    if(item.equipLevel&&save.baseLevel<item.equipLevel){setLog(l=>[`Você precisa do Base Lv. ${item.equipLevel} para equipar ${item.name}.`,...l].slice(0,6));return}
    setSave(s=>({...s,equipped:{...s.equipped,[item.slot!]:id}}))
  }
  const changeMap=(id:string)=>{const next=maps.find(m=>m.id===id);if(!next||save.baseLevel<next.minLevel)return;setSave(s=>({...s,mapId:id}))}
  const toggle=()=>setSave(s=>({...s,running:!s.running}))
  const heal=()=>setSave(s=>({...s,hp:s.maxHp,sp:s.maxSp}))
  const addStat=(key:StatKey)=>setSave(s=>s.statPoints<=0?s:{...s,statPoints:s.statPoints-1,stats:{...s.stats,[key]:s.stats[key]+1}})

  const chooseFirstJob=(id:string)=>{const c=classes.find(x=>x.id===id);if(!c||c.id==='novice'||save.firstJobChosen||save.classId!=='novice'||save.baseLevel<c.minBase||save.jobLevel<c.minJob)return;setSave(s=>({...s,classId:id,firstJobChosen:true,unlockedClasses:Array.from(new Set([...s.unlockedClasses,id])),jobLevel:1,jobExp:0,jobPoints:0}));setLog(l=>[`Mudança de classe concluída: ${c.name}! Seu Job Level foi reiniciado para 1.`,...l].slice(0,6))}

  const learnSkill=(id:string)=>{const sk=skills.find(x=>x.id===id);if(!sk)return;setSave(s=>{if(sk.classId!=='novice'&&sk.classId!==s.classId)return s;const lvl=s.skillLevels[id]||0;const prereqOk=!sk.requires||(s.skillLevels[sk.requires.skillId]||0)>=sk.requires.level;if(!prereqOk||lvl>=sk.maxLevel||s.jobPoints<sk.jobPointCost)return s;return {...s,jobPoints:s.jobPoints-sk.jobPointCost,skillLevels:{...s.skillLevels,[id]:lvl+1}}})}

  const useSkill=(id:string)=>{
    const sk=skills.find(x=>x.id===id);const lvl=save.skillLevels[id]||0
    if(!sk||sk.kind==='passive'||lvl<=0||(cooldowns[id]||0)>0||save.sp<sk.spCost||playerDead)return
    if(sk.classId!=='novice'&&sk.classId!==save.classId)return
    setSave(s=>({...s,sp:s.sp-sk.spCost}));setCooldowns(c=>({...c,[id]:sk.cooldown}))
    if(sk.kind==='heal'){const amount=Math.round(save.maxHp*(sk.power+.03*lvl));setSave(s=>({...s,hp:Math.min(s.maxHp,s.hp+amount)}));setLog(l=>[`${sk.name} recuperou ${amount} HP.`,...l].slice(0,6));return}
    if(sk.kind==='buff'){const multiplier=sk.power+.02*lvl;setActiveBuff({name:sk.name,multiplier,until:Date.now()+6000});setLog(l=>[`${sk.name} ativado por 6 segundos.`,...l].slice(0,6));return}
    const dealt=Math.max(1,Math.round(effectiveAttack*(sk.power+.06*lvl))-map.monsterDef);setDamage(dealt);setHit(v=>v+1);setMonsterHp(h=>{const next=h-dealt;if(next<=0&&monsterAlive){rewardKill();return 0}return Math.max(0,next)});setLog(l=>[`${sk.name}${sk.element?` [${sk.element}]`:''} causou ${dealt} de dano.`,...l].slice(0,6))
  }

  const availableSkills=skills.filter(s=>s.classId===save.classId||s.classId==='novice')
  const canChangeJob=save.classId==='novice'&&!save.firstJobChosen&&save.baseLevel>=10&&save.jobLevel>=10
  return {save,map,classDef,monsterHp,monsterAlive,playerDead,hit,damage,log,offline,setOffline,equip,changeMap,toggle,heal,addStat,chooseFirstJob,learnSkill,useSkill,cooldowns,availableSkills,activeSkills,activeBuff,effectiveAttack,passiveMultiplier,canChangeJob,baseNeed:expNeed(save.baseLevel),jobNeed:jobNeed(save.jobLevel)}
}
