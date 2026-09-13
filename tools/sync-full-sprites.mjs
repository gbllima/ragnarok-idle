import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const root = new URL('../', import.meta.url)
const db = JSON.parse(await readFile(new URL('public/ro/full/database.json', root)))
const output = new URL('public/ro/full/', root)
const args = new Set(process.argv.slice(2))
const monstersOnly = args.has('--monsters-only')
const itemsOnly = args.has('--items-only')
if(monstersOnly && itemsOnly) throw new Error('Use apenas um de --monsters-only ou --items-only.')
const concurrencyArg = process.argv.find(arg=>arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(16, Number(concurrencyArg?.split('=')[1] || 6)))
const includeItems = !monstersOnly
const includeMonsters = !itemsOnly

await mkdir(new URL('items/', output), {recursive:true})
await mkdir(new URL('monsters/', output), {recursive:true})

let old = {items:{},monsters:{}}
try { old = JSON.parse(await readFile(new URL('sprites.json', output))) }
catch {
  try { old = JSON.parse(await readFile(new URL('sprites-progress.json', output))) } catch {}
}
const result = { items:{...(old.items||{})}, monsters:{...(old.monsters||{})} }
const jobs = [
  ...(includeItems ? db.items.map(row=>({kind:'items',id:row.aegisId})) : []),
  ...(includeMonsters ? db.maps.map(row=>({kind:'monsters',id:row.monsterId})) : []),
]
const total = jobs.length
let completed = 0

async function download(url) {
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const res = await fetch(url, {signal:AbortSignal.timeout(20000)})
      if(res.status === 404 || res.status === 400) return null
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const b = Buffer.from(await res.arrayBuffer())
      return isPng(b) ? b : null
    } catch (error) {
      if(attempt===2) { console.warn(`Unavailable ${url}: ${error.message}`); return null }
      await new Promise(r=>setTimeout(r,750*(attempt+1)))
    }
  }
}

const isPng = bytes => bytes?.length>24 && bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a' && bytes.readUInt32BE(16)>1 && bytes.readUInt32BE(20)>1
const pngDimensions = bytes=>({width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)})

function compactStatus(){
  return Object.fromEntries(Object.entries(result).map(([kind,rows])=>[
    kind,
    Object.fromEntries(Object.entries(rows).map(([id,row])=>[id,row.available ? [row.width,row.height] : null])),
  ]))
}

function availabilitySummary(){
  return Object.fromEntries(Object.entries(result).map(([kind,rows])=>[kind,{
    checked:Object.keys(rows).length,
    available:Object.values(rows).filter(row=>row.available).length,
    unavailable:Object.values(rows).filter(row=>row && !row.available).length,
  }]))
}

async function checkpoint(final=false){
  await writeFile(new URL(final?'sprites.json':'sprites-progress.json',output),JSON.stringify(result))
  // Keep the game aware of files already downloaded even if this process is stopped halfway.
  await writeFile(new URL('src/game/full-sprite-status.json',root),JSON.stringify(compactStatus()))
  console.log(JSON.stringify(availabilitySummary()))
}

async function processJob({kind,id}){
  const dest = new URL(`${kind}/${id}.png`,output)
  let bytes, source=result[kind]?.[id]?.source
  try {
    bytes=await readFile(dest)
    if(!isPng(bytes)) bytes=null
  } catch {}

  if(!bytes) {
    const urls = kind==='items'
      ? [`https://assets.latam-tools.com.br/icons/item/${id}.png`,`https://static.divine-pride.net/images/items/item/${id}.png`]
      : [`https://assets.latam-tools.com.br/image?job=${id}&action=0&enableShadow=false`,`https://static.divine-pride.net/images/mobs/png/${id}.png`]
    for(const url of urls){
      bytes=await download(url)
      if(bytes){source=url;break}
    }
    if(bytes) await writeFile(dest,bytes)
  }

  result[kind][id]=bytes
    ? {available:true,...pngDimensions(bytes),source:source||'local-cache',sha256:createHash('sha256').update(bytes).digest('hex')}
    : {available:false}

  completed++
  if(completed%100===0 || completed===total){
    console.log(`${completed}/${total} previews checked`)
    await checkpoint(false)
  }
}

const queue=[...jobs]
await Promise.all(Array.from({length:Math.min(concurrency,Math.max(1,queue.length))},async()=>{
  while(queue.length){
    const job=queue.shift()
    if(job) await processJob(job)
  }
}))

await checkpoint(true)
console.log('Sprite sync concluído.')
