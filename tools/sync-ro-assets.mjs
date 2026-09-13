import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { maps, items, classes } from '../src/game/starterData.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const origin = 'https://assets.latam-tools.com.br'
const jobs = { novice: 0, swordsman: 1, mage: 2, archer: 3, acolyte: 4, thief: 6 }
const biomes = { meadow: 'prt_fild08', plains: 'gef_fild00', forest: 'pay_fild01', desert: 'moc_fild01', swamp: 'prt_fild03' }
const overrides = { woodenBlock: 1019, wolfClaw: 920, shortLeg: 1042, fineSand: 7049, noviceSword: 1101, ironShield: 2103, knife: 1202, club: 1502, guard: 2102 }
const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const catalog = { monsters: {}, players: {}, items: {}, maps: {} }
const records = []
const queue = []
const scheduled = new Set()
let previousSources = new Map()
try {
  const previous = JSON.parse(await readFile(resolve(root, 'public/ro/sources.json'), 'utf8'))
  previousSources = new Map(previous.assets.map(asset => [asset.path, asset]))
} catch (error) { if (error.code !== 'ENOENT') throw error }
const pngSignature = '89504e470d0a1a0a'

async function request(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (error) {
      if (attempt === 2) throw error
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

function asset(path, url) {
  if (scheduled.has(path)) return path
  scheduled.add(path)
  queue.push(async () => {
    const dest = resolve(root, 'public', path.slice(1))
    let bytes
    const previous = previousSources.get(path)
    try {
      bytes = await readFile(dest)
      if (previous?.url !== url || createHash('sha256').update(bytes).digest('hex') !== previous.sha256) bytes = await request(url)
    } catch { bytes = await request(url) }
    if (bytes.subarray(0, 8).toString('hex') !== pngSignature) throw new Error(`Invalid PNG: ${url}`)
    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, bytes)
    records.push({ path, url, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
  })
  return path
}

for (const map of maps) {
  const id = map.monsterId
  const animations = {}
  for (const [state, offset] of Object.entries({ idle: 0, walk: 8, attack: 16, hit: 24, death: 32 })) {
    animations[state] = Array.from({ length: 8 }, (_, dir) => asset(`/ro/monsters/${id}/${state}-${dir}.png`, `${origin}/image?job=${id}&action=${offset + dir}&enableShadow=false`))
  }
  catalog.monsters[map.monster] = { id, src: animations.idle[0], animations }
}
for (const cls of classes) {
  const animations = {}
  for (const [state, offset] of Object.entries({ idle: 0, walk: 8, attack: 40, hit: 48, death: 64 })) {
    animations[state] = Array.from({ length: 8 }, (_, dir) => asset(`/ro/players/${cls.id}/${state}-${dir}.png`, `${origin}/image?job=${jobs[cls.id]}&head=1&headdir=straight&action=${offset + dir}&enableShadow=false&canvas=128x128%2B64%2B108`))
  }
  catalog.players[cls.id] = { job: jobs[cls.id], src: animations.idle[0], animations }
}

// Resolve original item IDs from rAthena instead of guessing by icon/name.
const database = []
for (const type of ['etc', 'usable', 'equip']) {
  const yaml = (await request(`https://raw.githubusercontent.com/rathena/rathena/master/db/re/item_db_${type}.yml`)).toString()
  for (const block of yaml.split(/\n  - Id: /).slice(1)) {
    database.push({ id: Number(block.match(/^\d+/)?.[0]), name: block.match(/\n    Name: (.*)/)?.[1]?.trim(), aegis: block.match(/\n    AegisName: (.*)/)?.[1]?.trim() })
  }
}
for (const item of Object.values(items)) {
  const match = database.find(row => normalize(row.name || '') === normalize(item.name.replace(/ \[\d+\]$/, '')) || normalize(row.aegis || '') === normalize(item.name))
  const id = overrides[item.id] ?? match?.id
  if (!id) throw new Error(`Missing item mapping: ${item.id} (${item.name})`)
  catalog.items[item.id] = { id, src: asset(`/ro/items/${id}.png`, `${origin}/icons/item/${id}.png`) }
}
for (const [biome, map] of Object.entries(biomes)) {
  const manifest = JSON.parse((await request(`${origin}/maps/${map}/manifest.json`)).toString())
  // Visually checked flat tiles, avoiding cliff faces and road-edge atlases.
  const tiles = {
    meadow: ['prt_초원01.bmp', 'prt_흙02.bmp'],
    plains: ['게펜필드-04.bmp', '게펜필드-05.bmp'],
    forest: ['숲속바닥-01.bmp', '숲속바닥-06.bmp'],
    desert: ['moc_맨땅08.bmp', 'moc_맨땅08.bmp'],
    swamp: ['prt_초원06.bmp', 'prt_흙02.bmp'],
  }
  const entries = Object.entries(manifest.textures)
  const grass = entries.find(([name]) => name === `필드바닥/${tiles[biome][0]}`)
  const path = entries.find(([name]) => name === `필드바닥/${tiles[biome][1]}`)
  if (!grass || !path) throw new Error(`Missing ground textures: ${map}`)
  catalog.maps[biome] = {
    map,
    preview: asset(`/ro/maps/${map}.png`, `https://www.divine-pride.net/img/map/original/${map}`),
    ground: asset(`/ro/maps/${biome}-ground.png`, new URL(grass[1], `${origin}/maps/${map}/`).href),
    path: asset(`/ro/maps/${biome}-path.png`, new URL(path[1], `${origin}/maps/${map}/`).href),
  }
}

let completed = 0
const failures = []
// Respect the public hobby server: at most four downloads in flight; reruns reuse local files.
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const task = queue.shift()
    try { await task() } catch (error) { failures.push(error.message) }
    if (++completed % 100 === 0) console.log(`${completed} assets checked/downloaded`)
  }
}))
if (failures.length) throw new Error(failures.join('\n'))
for (const monster of Object.values(catalog.monsters)) {
  const bytes = await readFile(resolve(root, 'public', monster.src.slice(1)))
  monster.width = bytes.readUInt32BE(16)
  monster.height = bytes.readUInt32BE(20)
}
await writeFile(resolve(root, 'src/game/ro-assets.json'), JSON.stringify(catalog, null, 2) + '\n')
await writeFile(resolve(root, 'public/ro/sources.json'), JSON.stringify({ source: origin, credit: 'Ragnarok Online assets © Gravity. Rendered by ragassets; map previews from Divine Pride; item IDs from rAthena. Game-specific equipment reuses analogous RO icons. Map terrain is adapted for the 2D idle scene.', assets: records.sort((a, b) => a.path.localeCompare(b.path)) }, null, 2) + '\n')
console.log(`Done: ${Object.keys(catalog.monsters).length} monsters, ${Object.keys(catalog.players).length} classes, ${Object.keys(catalog.items).length} items, ${Object.keys(catalog.maps).length} map environments (${records.length} files).`)
