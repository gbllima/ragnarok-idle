import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const db = JSON.parse(await readFile(new URL('public/ro/full/database.json', root)))
const output = new URL('public/ro/full/', root)
await mkdir(new URL('items/', output), {recursive:true})
await mkdir(new URL('monsters/', output), {recursive:true})
let old = {}
try { old = JSON.parse(await readFile(new URL('sprites.json', output))) } catch {
  try { old = JSON.parse(await readFile(new URL('sprites-progress.json', output))) } catch {}
}
const result = { items:{}, monsters:{} }
const jobs = [...db.items.map(row=>({kind:'items',id:row.aegisId})), ...db.maps.map(row=>({kind:'monsters',id:row.monsterId}))]
let completed = 0
async function download(url) {
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const res = await fetch(url, {signal:AbortSignal.timeout(15000)})
      if(res.status === 404 || res.status === 400) return null
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const b = Buffer.from(await res.arrayBuffer())
      return b.subarray(0,8).toString('hex')==='89504e470d0a1a0a' && b.readUInt32BE(16)>1 && b.readUInt32BE(20)>1 ? b : null
    } catch (error) {
      if(attempt===2) { console.warn(`Unavailable ${url}: ${error.message}`); return null }
      await new Promise(r=>setTimeout(r,1000*(attempt+1)))
    }
  }
}
const pngDimensions = bytes=>({width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)})
await Promise.all(Array.from({length:4},async()=>{
  while(jobs.length) {
    const {kind,id}=jobs.shift()
    const dest = new URL(`${kind}/${id}.png`,output)
    let bytes, source
    try { bytes=await readFile(dest);source=old[kind]?.[id]?.source; if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') bytes=null } catch {}
    if(!bytes) {
      const urls = kind==='items' ? [`https://assets.latam-tools.com.br/icons/item/${id}.png`,`https://static.divine-pride.net/images/items/item/${id}.png`] : [`https://assets.latam-tools.com.br/image?job=${id}&action=0&enableShadow=false`,`https://static.divine-pride.net/images/mobs/png/${id}.png`]
      for(const url of urls) {bytes=await download(url);if(bytes){source=url;break}}
      if(bytes) await writeFile(dest,bytes)
    }
    result[kind][id]=bytes ? {available:true,...pngDimensions(bytes),source,sha256:createHash('sha256').update(bytes).digest('hex')} : {available:false}
    if(++completed%1000===0) {console.log(`${completed}/${db.items.length+db.maps.length} previews checked`);await writeFile(new URL('sprites-progress.json',output),JSON.stringify(result))}
  }
}))
await writeFile(new URL('sprites.json',output),JSON.stringify(result))
// Small build-time lookup; provenance and hashes remain outside the JS bundle.
await writeFile(new URL('src/game/full-sprite-status.json',root),JSON.stringify(Object.fromEntries(Object.entries(result).map(([kind,rows])=>[kind,Object.fromEntries(Object.entries(rows).map(([id,row])=>[id,row.available ? [row.width,row.height] : null]))]))))
console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([kind,rows])=>[kind,{total:Object.keys(rows).length,available:Object.values(rows).filter(row=>row.available).length}]))))
