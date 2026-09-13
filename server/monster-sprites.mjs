import { readFile, mkdir, writeFile, rename } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
const root = new URL('../public/',import.meta.url)
const database=JSON.parse(await readFile(new URL('../public/ro/full/database.json',import.meta.url)))
const monsterIds=new Set(database.maps.map(map=>map.monsterId))
const offsets={idle:0,walk:8,attack:16,hit:24,death:32}
const active=new Map(),retryAfter=new Map()
let running=0
const waiting=[]
async function limited(task){
  if(running>=2)await new Promise(resolve=>waiting.push(resolve))
  else running++
  try{return await task()}finally{const next=waiting.shift();if(next)next();else running--}
}
export async function serveMonsterSprite(req,res,pathname){
  const match=pathname.match(/^\/ro\/monster-actions\/(\d+)\/(idle|walk|attack|hit|death)-([0-7])\.png$/)
  if(!match||!['GET','HEAD'].includes(req.method)||!monsterIds.has(Number(match[1])))return false
  const [,id,state,direction]=match
  const path=new URL(`ro/monster-actions/${id}/${state}-${direction}.png`,root)
  let bytes
  try{bytes=await readFile(path)}catch(error){if(error.code!=='ENOENT')throw error}
  if(!bytes&&req.method==='GET'&&Date.now()>(retryAfter.get(pathname)||0)){
    if(!active.has(pathname))active.set(pathname,limited(async()=>{
      try{
        const response=await fetch(`https://assets.latam-tools.com.br/image?job=${id}&action=${offsets[state]+Number(direction)}&enableShadow=false`,{signal:AbortSignal.timeout(8000)})
        if(!response.ok)throw new Error(`HTTP ${response.status}`)
        const png=Buffer.from(await response.arrayBuffer())
        if(png.length>5_000_000||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.readUInt32BE(16)<2||png.readUInt32BE(20)<2)throw new Error('Invalid sprite')
        await mkdir(new URL('./',path),{recursive:true})
        const temp=new URL(`${path.href}.${randomUUID()}.tmp`)
        await writeFile(temp,png);await rename(temp,path)
        return png
      }catch{retryAfter.set(pathname,Date.now()+15*60*1000);return null}
    }).finally(()=>active.delete(pathname)))
    bytes=await active.get(pathname)
  }
  let mime='image/png'
  if(!bytes){try{bytes=await readFile(new URL(`ro/full/monsters/${id}.png`,root))}catch{bytes=await readFile(new URL('sprites/missing-monster.svg',root));mime='image/svg+xml'}}
  res.writeHead(200,{'Content-Type':mime,'Content-Length':bytes.length,'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'})
  res.end(req.method==='HEAD'?undefined:bytes)
  return true
}
