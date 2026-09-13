import { readFile } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url))
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const mime = { '.png':'image/png', '.gif':'image/gif', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.html':'text/html; charset=utf-8', '.woff2':'font/woff2' }

export async function serveStatic(req, res, pathname) {
  if (!['GET', 'HEAD'].includes(req.method) || pathname.startsWith('/api/')) return false
  let decoded
  try { decoded = decodeURIComponent(pathname) } catch { return false }
  if (decoded.includes('\\') || decoded.includes('\0')) return false
  const root = decoded.startsWith('/ro/') || decoded.startsWith('/sprites/') ? publicRoot : distRoot
  const path = resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded))
  if (!path.startsWith(resolve(root) + sep)) return false
  try {
    const bytes = await readFile(path)
    res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control': decoded === '/' ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' })
    res.end(req.method === 'HEAD' ? undefined : bytes)
    return true
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR' || error.code === 'ENOTDIR') return false
    throw error
  }
}
