import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { parseDocument, isMap, isSeq } from 'yaml'

const root = new URL('../', import.meta.url)
const assetOrigin = 'https://assets.latam-tools.com.br'
const fetchBytes = async url => {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`${res.status}: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}
const commit = process.argv.find(arg=>arg.startsWith('--commit='))?.split('=')[1] ?? JSON.parse((await fetchBytes('https://api.github.com/repos/rathena/rathena/commits/master')).toString()).sha
if(!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid rAthena commit SHA')
const source = `https://raw.githubusercontent.com/rathena/rathena/${commit}/db/re/`
const sources = []
async function table(file) {
  const bytes = await fetchBytes(source + file)
  sources.push({ url: source + file, sha256: createHash('sha256').update(bytes).digest('hex') })
  const document = parseDocument(bytes.toString(), { uniqueKeys:false })
  if (document.errors.length) throw document.errors[0]
  // Some upstream items repeat mapping blocks (e.g. Trade). Preserve both blocks.
  function mergeMappings(node) {
    if (isMap(node)) {
      const keys = new Map()
      node.items = node.items.filter(pair => {
        const key = String(pair.key)
        const previous = keys.get(key)
        if (!previous) { keys.set(key,pair); return true }
        if (isMap(previous.value) && isMap(pair.value)) { previous.value.items.push(...pair.value.items); return false }
        if (String(previous.value) === String(pair.value)) return false
        throw new Error(`Conflicting duplicate YAML key: ${key} in ${file}`)
      })
      node.items.forEach(pair => mergeMappings(pair.value))
    } else if (isSeq(node)) node.items.forEach(mergeMappings)
  }
  mergeMappings(document.contents)
  const doc = document.toJS({maxAliasCount:0})
  if (!Array.isArray(doc.Body)) throw new Error(`Missing Body: ${file}`)
  return doc.Body
}
const rawItems = [...await table('item_db_usable.yml'), ...await table('item_db_equip.yml'), ...await table('item_db_etc.yml')]
const rawMonsters = await table('mob_db.yml')
const clientBytes = await fetchBytes(`${assetOrigin}/raw/items.json`)
sources.push({ url: `${assetOrigin}/raw/items.json`, sha256: createHash('sha256').update(clientBytes).digest('hex') })
const client = new Map(JSON.parse(clientBytes).map(row => [row.id, row]))
const locationSlots = { Right_Hand:'weapon', Left_Hand:'shield', Armor:'armor', Head_Top:'headTop', Head_Mid:'headMid', Head_Low:'headBottom', Garment:'garment', Shoes:'shoes', Right_Accessory:'accessoryRight', Left_Accessory:'accessoryLeft', Ammo:'ammo', Costume_Head_Top:'costumeTop', Costume_Head_Mid:'costumeMid', Costume_Head_Low:'costumeBottom', Costume_Garment:'costumeGarment', Shadow_Weapon:'shadowWeapon', Shadow_Armor:'shadowArmor', Shadow_Shield:'shadowShield', Shadow_Shoes:'shadowShoes', Shadow_Right_Accessory:'shadowAccessoryRight', Shadow_Left_Accessory:'shadowAccessoryLeft' }
const statBonuses = { bStr:'str', bAgi:'agi', bVit:'vit', bInt:'int', bDex:'dex', bLuk:'luk', bBaseAtk:'attack', bAtk:'attack', bDef:'defense', bMaxHP:'hp', bMaxSP:'sp', bMatk:'magicAttack' }

// Parse only whole, unconditional scripts from a small allowlist. Never execute rAthena code.
function effects(script = '') {
  const text = script.replace(/\/\/[^\n]*/g, '').trim()
  if (!text) return { supported: true }
  const parts = text.split(';').map(s => s.trim()).filter(Boolean)
  const bonuses = {}
  const heal = {}
  for (const part of parts) {
    let m = part.match(/^bonus\s+(b\w+)\s*,\s*(-?\d+)$/)
    if (m && statBonuses[m[1]]) { const key = statBonuses[m[1]]; bonuses[key] = (bonuses[key] || 0) + Number(m[2]); continue }
    m = part.match(/^(itemheal|percentheal)\s+(rand\(\s*\d+\s*,\s*\d+\s*\)|\d+)\s*,\s*(rand\(\s*\d+\s*,\s*\d+\s*\)|\d+)$/)
    if (m) {
      const range = value => value.startsWith('rand') ? value.match(/\d+/g).map(Number) : [Number(value), Number(value)]
      heal[m[1] === 'percentheal' ? 'hpPercent' : 'hp'] = range(m[2])
      heal[m[1] === 'percentheal' ? 'spPercent' : 'sp'] = range(m[3])
      continue
    }
    return { supported: false }
  }
  return { supported: true, bonuses, heal: Object.keys(heal).length ? heal : undefined }
}
const itemByAegis = new Map(rawItems.map(row => [row.AegisName, row.Id]))
const items = rawItems.map(row => {
  const info = client.get(row.Id)
  const locations = Object.entries(row.Locations ?? {}).filter(([, v]) => v).map(([k]) => k)
  const slots = locations.flatMap(k => k==='Both_Hand'?['weapon','shield']:k==='Both_Accessory'?['accessoryLeft','accessoryRight']:locationSlots[k]?[locationSlots[k]]:[])
  const category = ({weapon:'Weapon',armor:'Armor',shadowgear:'ShadowGear',ammo:'Ammo',card:'Card',healing:'Healing',usable:'Usable',delayconsume:'DelayConsume',cash:'Cash',petegg:'PetEgg',petarmor:'PetArmor',etc:'Etc'})[(row.Type??'Etc').toLowerCase()]
  if(!category) throw new Error(`Unknown item type: ${row.Type}`)
  const type = ['Weapon','Armor','ShadowGear','Ammo'].includes(category) ? 'equipment' : category === 'Card' ? 'card' : ['Healing','Usable','DelayConsume','Cash'].includes(category) ? 'consumable' : 'material'
  const effect = effects(row.Script)
  const bonus = effect.bonuses ?? {}
  const buy = row.Buy ?? (row.Sell !== undefined ? row.Sell * 2 : 0)
  const sell = row.Sell ?? Math.floor(buy / 2)
  const jobs = row.Jobs ?? { All: true }
  return {
    id:`ro:${row.Id}`, aegisId:row.Id, aegisName:row.AegisName, name: info?.name || row.Name, englishName:row.Name,
    type, category, subtype:row.SubType, icon:type === 'equipment' ? '⚔' : type === 'card' ? '▣' : '◆',
    rarity:type === 'card' ? 'rare' : (row.WeaponLevel ?? row.ArmorLevel ?? 0) >= 4 ? 'epic' : type === 'equipment' ? 'uncommon' : 'common',
    buy:buy || undefined, sell:row.Trade?.NoSell ? 0 : sell, noSell:!!row.Trade?.NoSell, weight:(row.Weight ?? 0)/10,
    attack:(row.Attack ?? 0) + (bonus.attack ?? 0), magicAttack:(row.MagicAttack ?? 0) + (bonus.magicAttack ?? 0), defense:(row.Defense ?? 0) + (bonus.defense ?? 0),
    hp:bonus.hp, sp:bonus.sp, statBonus:Object.fromEntries(Object.entries(bonus).filter(([key]) => ['str','agi','vit','int','dex','luk'].includes(key))),
    slot:slots[0], equipSlots:slots, equipLevel:Math.max(1,row.EquipLevelMin ?? 1), equipLevelMax:row.EquipLevelMax,
    cardSlots:row.Slots ?? 0, jobs, classRestrictions:row.Classes, locations, weaponLevel:row.WeaponLevel, heal:effect.heal,
    cardBonus:type === 'card' && effect.supported ? { attack:bonus.attack, defense:bonus.defense, hp:bonus.hp, sp:bonus.sp } : undefined,
    description:info?.description?.replace(/\^[0-9a-fA-F]{6}/g, '').trim(), unsupportedEffects:!effect.supported || !!row.EquipScript || !!row.UnEquipScript,
    source:'rAthena', sprite:`/ro/full/items/${row.Id}.png`,
  }
}).sort((a,b) => a.aegisId-b.aegisId)
const unresolved = []
function drops(rows = [], mvp = false) {
  return rows.filter(row => row.Item).map(row => {
    const id = itemByAegis.get(row.Item)
    if (!id) unresolved.push(row.Item)
    return { itemId:`ro:${id}`, rate:Math.max(0,Math.min(10000,row.Rate ?? 1)), ...(mvp ? { mvp:true } : {}) }
  })
}
const maps = rawMonsters.map(row => {
  const boss = row.Class === 'Boss' || row.Modes?.Mvp || (row.MvpDrops?.length ?? 0) > 0
  const bg = row.Element === 'Fire' ? 'desert' : ['Poison','Dark','Undead'].includes(row.Element) ? 'swamp' : ['Insect','Plant','Brute'].includes(row.Race) ? 'forest' : row.Element === 'Wind' ? 'plains' : 'meadow'
  return {
    id:`ro-mob:${row.Id}`, name:`${row.Name} · #${row.Id}`, minLevel:Math.max(1,row.Level ?? 1), monsterId:row.Id, monster:row.Name, aegisName:row.AegisName,
    monsterLevel:row.Level ?? 1, monsterHp:Math.max(1,row.Hp ?? 1), monsterAtk:row.Attack ?? 0, monsterDef:row.Defense ?? 0,
    race:row.Race ?? 'Formless', element:`${row.Element ?? 'Neutral'} ${row.ElementLevel ?? 1}`, exp:row.BaseExp ?? 0, jobExp:row.JobExp ?? 0,
    zeny:0, bg, boss, drops:[...drops(row.Drops), ...drops(row.MvpDrops,true)], imported:true,
    sprite:`/ro/full/monsters/${row.Id}.png`,
  }
}).sort((a,b) => a.minLevel-b.minLevel || a.monsterId-b.monsterId)
if (unresolved.length) throw new Error(`Unresolved drops: ${[...new Set(unresolved)].join(', ')}`)
if (new Set(items.map(row=>row.id)).size !== items.length || new Set(maps.map(row=>row.id)).size !== maps.length) throw new Error('Duplicate database IDs')
const metadata = { mode:'Renewal', commit, importedAt:new Date().toISOString(), sources, itemCount:items.length, weaponCount:items.filter(row=>row.category==='Weapon').length, monsterCount:maps.length }
await mkdir(new URL('public/ro/full/', root), {recursive:true})
await writeFile(new URL('public/ro/full/database.json', root), JSON.stringify({ metadata, items, maps }))
await writeFile(new URL('public/ro/full/database.json.gz', root), gzipSync(JSON.stringify({metadata,items,maps})))
await writeFile(new URL('public/ro/full/database-source.json', root), JSON.stringify(metadata,null,2)+'\n')
console.log(metadata)
