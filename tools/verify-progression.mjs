import { readFile } from 'node:fs/promises'

const root=new URL('../',import.meta.url)
const db=JSON.parse(await readFile(new URL('public/ro/full/database.json',root),'utf8'))
const maps=db.maps
const checkpoints=[1,10,20,30,40,50,60,70,80,90,99]
const fail=message=>{throw new Error(message)}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n))
const baseNeed=level=>Math.round((350+level*115)*(1+Math.max(0,level-80)*.018))
const targetKills=level=>14+Math.floor(Math.min(99,Math.max(1,level))/15)*4
const signal=value=>clamp(Math.log10(Math.max(10,value+10))/3,.72,1.22)
const reward=map=>{
  const level=Math.max(1,map.monsterLevel||map.minLevel||1),boss=!!map.boss,kills=targetKills(level)
  const exp=Math.max(3,Math.round(baseNeed(level)/kills*signal(map.exp)*(boss?4.5:1)))
  const jobBase=Math.round((250+Math.min(level,50)*90)*(1+Math.max(0,Math.min(level,50)-35)*.012))
  const job=Math.max(2,Math.round(jobBase/kills*signal(map.jobExp)*(boss?4.2:1)))
  const zeny=Math.max(5,Math.round((8+level*2.8)*(boss?8:1)))
  return {exp,job,zeny}
}

for(const level of checkpoints){
  const candidates=maps.filter(map=>!map.boss&&map.Level!==0&&(map.monsterLevel??map.Level??1)>=Math.max(1,level-12)&&(map.monsterLevel??map.Level??1)<=level+4)
  if(!candidates.length)fail(`Sem caçadas normais próximas do Base ${level}.`)
}

for(const map of maps){
  const r=reward({monsterLevel:map.monsterLevel??map.Level??1,minLevel:map.minLevel??map.Level??1,boss:map.boss??map.Class==='Boss',exp:map.exp??map.BaseExp??0,jobExp:map.jobExp??map.JobExp??0})
  if(r.exp<=0||r.job<=0||r.zeny<=0)fail(`Recompensa inválida no monstro ${map.monsterId??map.Id}.`)
}

const bosses=maps.filter(map=>map.boss??map.Class==='Boss')
if(!bosses.some(map=>(map.monsterLevel??map.Level??999)<=99))fail('Nenhum MVP/chefe disponível até o Base 99.')

console.log(`Progressão 1-99 OK: ${maps.length.toLocaleString('pt-BR')} monstros, ${bosses.length.toLocaleString('pt-BR')} chefes/MVPs e ${checkpoints.length} checkpoints cobertos.`)
