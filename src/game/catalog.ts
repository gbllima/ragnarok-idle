import type { ItemDef, MapDef } from './starterData'

export type FullDatabase={metadata:{mode:string;commit:string;itemCount:number;weaponCount:number;monsterCount:number;importedAt:string};items:ItemDef[];maps:MapDef[]}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const baseNeed=(level:number)=>Math.round((350+level*115)*(1+Math.max(0,level-80)*.018))
const targetKills=(level:number)=>14+Math.floor(Math.min(99,Math.max(1,level))/15)*4
const sourceSignal=(value:number)=>clamp(Math.log10(Math.max(10,value+10))/3,.72,1.22)

function balanceMap(map:MapDef):MapDef{
  const level=Math.max(1,map.monsterLevel||map.minLevel||1)
  const boss=!!map.boss
  const kills=targetKills(level)
  const exp=Math.max(3,Math.round(baseNeed(level)/kills*sourceSignal(map.exp)*(boss?4.5:1)))
  const jobBase=Math.round((250+Math.min(level,50)*90)*(1+Math.max(0,Math.min(level,50)-35)*.012))
  const jobExp=Math.max(2,Math.round(jobBase/kills*sourceSignal(map.jobExp)*(boss?4.2:1)))
  const zeny=Math.max(5,Math.round((8+level*2.8)*(boss?8:1)))
  const minLevel=Math.min(map.minLevel,Math.max(1,level-(boss?2:4)))
  const normalHpCap=120+level*level*3
  const monsterHp=Math.round(clamp(map.monsterHp,Math.max(25,level*6),boss?normalHpCap*10:normalHpCap))
  const monsterAtk=Math.round(clamp(map.monsterAtk,Math.max(1,level*.35),boss?(20+level*5)*2.5:20+level*5))
  const monsterDef=Math.round(clamp(map.monsterDef,0,boss?(10+level*3)*2:10+level*3))
  return {...map,minLevel,exp,jobExp,zeny,monsterHp,monsterAtk,monsterDef}
}

export function expandCatalog(database:FullDatabase, starterItems:Record<string,ItemDef>, starterMaps:MapDef[], icons:Record<string,{id:number}>) {
  const legacyById=new Map<number,string>()
  for(const item of Object.values(starterItems)) if(item.source==='rAthena'&&icons[item.id]) legacyById.set(icons[item.id].id,item.id)
  const items:Record<string,ItemDef>={...starterItems}
  const catalogItems=database.items.map(imported=>{
    const legacyId=legacyById.get(imported.aegisId!)
    const item:ItemDef=legacyId?{...imported,...starterItems[legacyId],sprite:imported.sprite}: {...imported}
    const power=(item.attack||0)+(item.magicAttack||0)+(item.defense||0)*10
    item.marketPrice=Math.max(item.buy||0,(item.sell||0)*4,100+(item.equipLevel||1)*50+power*100+(item.type==='card'?25000:0))
    items[imported.id]=item
    items[item.id]=item
    return item
  })
  const starterIds=new Set(starterMaps.map(map=>map.monsterId))
  const importedMaps=database.maps.map(map=>balanceMap({...map,spriteKey:map.id,bestiaryKey:map.id,drops:map.drops.map(drop=>({...drop,itemId:items[drop.itemId].id}))}))
  const balancedStarter=starterMaps.map(balanceMap)
  const maps=[...balancedStarter,...importedMaps.filter(map=>!starterIds.has(map.monsterId))]
  const monsterCatalog=importedMaps.map(map=>balancedStarter.find(starter=>starter.monsterId===map.monsterId)??map)
  return {items,catalogItems,maps,monsterCatalog}
}
