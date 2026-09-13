import type { ItemDef, MapDef } from './starterData'

export type FullDatabase={metadata:{mode:string;commit:string;itemCount:number;weaponCount:number;monsterCount:number;importedAt:string};items:ItemDef[];maps:MapDef[]}

export function expandCatalog(database:FullDatabase, starterItems:Record<string,ItemDef>, starterMaps:MapDef[], icons:Record<string,{id:number}>) {
  const legacyById=new Map<number,string>()
  for(const item of Object.values(starterItems)) if(item.source==='rAthena'&&icons[item.id]) legacyById.set(icons[item.id].id,item.id)
  const items:Record<string,ItemDef>={...starterItems}
  const catalogItems=database.items.map(imported=>{
    const legacyId=legacyById.get(imported.aegisId!)
    // Keep existing inventory/equipment keys and the starter area's established balance.
    const item:ItemDef=legacyId?{...imported,...starterItems[legacyId],sprite:imported.sprite}: {...imported}
    const power=(item.attack||0)+(item.magicAttack||0)+(item.defense||0)*10
    // The idle exchange is an explicit acquisition route for event/craft-only items too.
    // Its prices are idle balancing, separate from original NPC buy/sell prices.
    item.marketPrice=Math.max(item.buy||0,(item.sell||0)*4,100+(item.equipLevel||1)*50+power*100+(item.type==='card'?25000:0))
    items[imported.id]=item
    items[item.id]=item
    return item
  })
  const starterIds=new Set(starterMaps.map(map=>map.monsterId))
  const importedMaps=database.maps.map(map=>({...map,spriteKey:map.id,bestiaryKey:map.id,drops:map.drops.map(drop=>({...drop,itemId:items[drop.itemId].id}))}))
  const maps=[...starterMaps,...importedMaps.filter(map=>!starterIds.has(map.monsterId))]
  const monsterCatalog=importedMaps.map(map=>starterMaps.find(starter=>starter.monsterId===map.monsterId)??map)
  return {items,catalogItems,maps,monsterCatalog}
}
