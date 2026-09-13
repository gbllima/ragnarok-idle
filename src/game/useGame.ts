import { useEffect, useMemo, useState } from 'react'
import { items, maps, startingInventory } from './data'

export type SaveState = {
  baseLevel:number; jobLevel:number; baseExp:number; jobExp:number; zeny:number; kills:number; hp:number; maxHp:number; sp:number; maxSp:number;
  attack:number; defense:number; mapId:string; inventory:Record<string,number>; equipped:{ weapon?:string; armor?:string; shield?:string };
  lastSeen:number; running:boolean;
}

const KEY='ragnarok-idle-save-v1'
const base:SaveState={baseLevel:42,jobLevel:31,baseExp:6420,jobExp:3180,zeny:258450,kills:1284,hp:840,maxHp:1000,sp:360,maxSp:500,attack:320,defense:55,mapId:'prontera-field',inventory:startingInventory,equipped:{weapon:'noviceSword',armor:'adventurerArmor',shield:'ironShield'},lastSeen:Date.now(),running:true}

function expNeed(level:number){ return 10000 + level*450 }
function jobNeed(level:number){ return 7000 + level*300 }

export function useGame(){
  const [save,setSave]=useState<SaveState>(()=>{
    try { const raw=localStorage.getItem(KEY); return raw ? {...base,...JSON.parse(raw),lastSeen:Date.now()} : base } catch { return base }
  })
  const map=useMemo(()=>maps.find(m=>m.id===save.mapId)??maps[0],[save.mapId])
  const [monsterHp,setMonsterHp]=useState(map.monsterHp)
  const [hit,setHit]=useState(0)
  const [damage,setDamage]=useState(0)
  const [log,setLog]=useState<string[]>(['Sistema pronto. A caçada automática está ativa.'])
  const [offline,setOffline]=useState<{seconds:number;exp:number;job:number;zeny:number;kills:number}|null>(null)

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(KEY)
      if(!raw) return
      const prev=JSON.parse(raw) as SaveState
      const seconds=Math.max(0,Math.min(8*3600,Math.floor((Date.now()-(prev.lastSeen||Date.now()))/1000)))
      if(seconds<30) return
      const m=maps.find(x=>x.id===prev.mapId)??maps[0]
      const cycle=1.2*Math.ceil(m.monsterHp/Math.max(1,prev.attack))
      const kills=Math.floor(seconds/cycle)
      if(kills<=0) return
      const exp=kills*m.exp, job=kills*m.jobExp, zeny=kills*m.zeny
      setSave(s=>({...s,baseExp:s.baseExp+exp,jobExp:s.jobExp+job,zeny:s.zeny+zeny,kills:s.kills+kills}))
      setOffline({seconds,exp,job,zeny,kills})
    }catch{}
  },[])

  useEffect(()=>{ localStorage.setItem(KEY,JSON.stringify({...save,lastSeen:Date.now()})) },[save])
  useEffect(()=>{ setMonsterHp(map.monsterHp) },[map.id,map.monsterHp])

  useEffect(()=>{
    if(!save.running) return
    const timer=window.setInterval(()=>{
      const variance=Math.floor(Math.random()*61)-30
      const dealt=Math.max(1,save.attack+variance)
      setDamage(dealt); setHit(v=>v+1)
      setMonsterHp(hp=>{
        const next=hp-dealt
        setSave(s=>({...s,hp:Math.max(1,s.hp-Math.max(1,map.monsterAtk-s.defense/4))}))
        setLog(l=>[`Você causou ${dealt} de dano em ${map.monster}.`,...l].slice(0,6))
        if(next>0) return next
        setSave(s=>{
          const inv={...s.inventory,jellopy:(s.inventory.jellopy||0)+1}
          if(Math.random()<.25) inv.apple=(inv.apple||0)+1
          if(Math.random()<.012) inv.poringCard=(inv.poringCard||0)+1
          let baseExp=s.baseExp+map.exp, jobExp=s.jobExp+map.jobExp, baseLevel=s.baseLevel, jobLevel=s.jobLevel
          while(baseExp>=expNeed(baseLevel)){baseExp-=expNeed(baseLevel);baseLevel++}
          while(jobExp>=jobNeed(jobLevel)){jobExp-=jobNeed(jobLevel);jobLevel++}
          return {...s,inventory:inv,baseExp,jobExp,baseLevel,jobLevel,zeny:s.zeny+map.zeny,kills:s.kills+1,hp:Math.min(s.maxHp,s.hp+18)}
        })
        setLog(l=>[`${map.monster} derrotado! +${map.exp} EXP · +${map.jobExp} Job EXP · +${map.zeny} Zeny`,...l].slice(0,6))
        return map.monsterHp
      })
    },1200)
    return()=>window.clearInterval(timer)
  },[save.running,save.attack,save.defense,map])

  const equip=(id:string)=>{
    const item=items[id]; if(!item||item.type!=='equipment') return
    setSave(s=>{
      const equipped={...s.equipped}
      if(id.toLowerCase().includes('sword')) equipped.weapon=id
      else if(id.toLowerCase().includes('shield')) equipped.shield=id
      else equipped.armor=id
      const defs=Object.values(equipped).filter(Boolean).map(x=>items[x as string])
      return {...s,equipped,attack:302+defs.reduce((a,i)=>a+(i.attack||0),0),defense:34+defs.reduce((a,i)=>a+(i.defense||0),0),maxHp:920+defs.reduce((a,i)=>a+(i.hp||0),0)}
    })
  }
  const changeMap=(id:string)=>setSave(s=>({...s,mapId:id}))
  const toggle=()=>setSave(s=>({...s,running:!s.running}))
  const heal=()=>setSave(s=>({...s,hp:s.maxHp,sp:s.maxSp}))

  return {save,map,monsterHp,hit,damage,log,offline,setOffline,equip,changeMap,toggle,heal,baseNeed:expNeed(save.baseLevel),jobNeed:jobNeed(save.jobLevel)}
}
