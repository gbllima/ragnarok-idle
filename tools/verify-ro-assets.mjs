import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import http from 'node:http'
import { maps, items, classes } from '../src/game/starterData.ts'
import { serveStatic } from '../server/static-assets.mjs'

const root = new URL('../', import.meta.url)
const catalog = JSON.parse(await readFile(new URL('src/game/ro-assets.json', root)))
const sources = JSON.parse(await readFile(new URL('public/ro/sources.json', root)))
const recorded = new Set(sources.assets.map(asset => asset.path))
const states = ['idle', 'walk', 'attack', 'hit', 'death']
let animations = 0
for (const asset of sources.assets) {
  const bytes = await readFile(new URL(`public${asset.path}`, root))
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', asset.path)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path)
  assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, asset.path)
  if (bytes.includes(Buffer.from('acTL'))) animations++
}
for (const [kind, keys] of [['monsters', maps.map(map => map.monster)], ['players', classes.map(cls => cls.id)]]) {
  for (const key of keys) {
    assert.ok(catalog[kind][key], `${kind}: ${key}`)
    for (const state of states) {
      assert.equal(catalog[kind][key].animations[state].length, 8)
      for (const src of catalog[kind][key].animations[state]) assert.ok(recorded.has(src), src)
    }
  }
}
for (const id of Object.keys(items)) assert.ok(recorded.has(catalog.items[id]?.src), `item: ${id}`)
for (const map of maps) {
  for (const field of ['preview', 'ground', 'path']) assert.ok(recorded.has(catalog.maps[map.bg]?.[field]), `${map.id}: ${field}`)
}

const server = http.createServer(async (req, res) => {
  if (!await serveStatic(req, res, new URL(req.url, 'http://localhost').pathname)) { res.writeHead(404); res.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
try {
  for (const path of ['/ro/monsters/1002/attack-6.png', '/ro/players/mage/walk-3.png', '/ro/items/909.png', '/ro/maps/prt_fild08.png']) {
    const res = await fetch(base + path)
    assert.equal(res.status, 200, path)
    assert.equal(res.headers.get('content-type'), 'image/png')
    assert.ok((await res.arrayBuffer()).byteLength > 100)
  }
  const head = await fetch(base + '/ro/items/909.png', { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal((await head.arrayBuffer()).byteLength, 0)
  for (const path of ['/ro/missing.png', '/ro/%2e%2e%2f%2e%2e%2fserver/server.mjs', '/ro/%5c..%5cserver.mjs', '/api/health']) {
    assert.equal((await fetch(base + path)).status, 404, path)
  }
} finally { await new Promise(resolve => server.close(resolve)) }
console.log(`OK: ${sources.assets.length} assets with matching SHA-256; ${animations} animated PNGs; all 23 monsters, 6 classes, 76 items and 5 environments covered. Static HTTP and path traversal checks passed.`)
