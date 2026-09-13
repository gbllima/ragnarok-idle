import { readFile, access } from 'node:fs/promises'

const root=new URL('../',import.meta.url)
const db=JSON.parse(await readFile(new URL('public/ro/full/database.json',root),'utf8'))
const {metadata,items,maps}=db

const fail=message=>{throw new Error(message)}
const assert=(condition,message)=>{if(!condition)fail(message)}

assert(metadata?.mode==='Renewal','Catálogo não está marcado como Renewal.')
assert(Array.isArray(items)&&Array.isArray(maps),'database.json inválido: items/maps ausentes.')
assert(metadata.itemCount===items.length,`itemCount divergente: ${metadata.itemCount} != ${items.length}`)
assert(metadata.monsterCount===maps.length,`monsterCount divergente: ${metadata.monsterCount} != ${maps.length}`)
const weaponCount=items.filter(item=>item.category==='Weapon').length
assert(metadata.weaponCount===weaponCount,`weaponCount divergente: ${metadata.weaponCount} != ${weaponCount}`)

const itemIds=new Set()
const aegisIds=new Set()
for(const item of items){
  assert(typeof item.id==='string'&&item.id.length>0,'Item sem id interno.')
  assert(Number.isInteger(item.aegisId),'Item sem Aegis ID válido: '+item.id)
  assert(!itemIds.has(item.id),'Item duplicado: '+item.id)
  assert(!aegisIds.has(item.aegisId),'Aegis ID de item duplicado: '+item.aegisId)
  itemIds.add(item.id);aegisIds.add(item.aegisId)
  if(item.type==='equipment')assert(Array.isArray(item.equipSlots),'Equipamento sem equipSlots: '+item.id)
}

const mapIds=new Set()
const monsterIds=new Set()
let dropCount=0
for(const map of maps){
  assert(typeof map.id==='string'&&map.id.length>0,'Monstro sem id de caça.')
  assert(Number.isInteger(map.monsterId),'Monstro sem ID válido: '+map.id)
  assert(!mapIds.has(map.id),'Caçada duplicada: '+map.id)
  assert(!monsterIds.has(map.monsterId),'Monster ID duplicado: '+map.monsterId)
  mapIds.add(map.id);monsterIds.add(map.monsterId)
  assert(map.monsterHp>0,'Monstro com HP inválido: '+map.monsterId)
  assert(Array.isArray(map.drops),'Monstro sem tabela de drops: '+map.monsterId)
  for(const drop of map.drops){
    dropCount++
    assert(itemIds.has(drop.itemId),`Drop aponta para item inexistente: mob ${map.monsterId} -> ${drop.itemId}`)
    assert(Number.isFinite(drop.rate)&&drop.rate>=0&&drop.rate<=10000,`Drop rate inválido: mob ${map.monsterId} -> ${drop.itemId}`)
  }
}

let status='não gerado'
try{
  await access(new URL('public/ro/full/sprites.json',root))
  const sprites=JSON.parse(await readFile(new URL('public/ro/full/sprites.json',root),'utf8'))
  const itemAvailable=Object.values(sprites.items??{}).filter(row=>row?.available).length
  const monsterAvailable=Object.values(sprites.monsters??{}).filter(row=>row?.available).length
  status=`${itemAvailable}/${items.length} itens, ${monsterAvailable}/${maps.length} monstros`
}catch{}

console.log(`Catálogo Renewal OK: ${items.length.toLocaleString('pt-BR')} itens, ${weaponCount.toLocaleString('pt-BR')} armas, ${maps.length.toLocaleString('pt-BR')} monstros, ${dropCount.toLocaleString('pt-BR')} drops.`)
console.log(`Sprites locais: ${status}.`)
