import http from 'node:http'
import { promises as fs } from 'node:fs'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from './static-assets.mjs'
import { serveMonsterSprite } from './monster-sprites.mjs'

const __dirname=dirname(fileURLToPath(import.meta.url))
const DB_PATH=join(__dirname,'data.json')
const PORT=Number(process.env.PORT||8787)
const sessions=new Map()

async function readDb(){try{return JSON.parse(await fs.readFile(DB_PATH,'utf8'))}catch{return {users:[]}}}
async function writeDb(db){await fs.writeFile(DB_PATH,JSON.stringify(db,null,2),'utf8')}
function send(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'http://localhost:5173','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'});res.end(JSON.stringify(body))}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1_000_000)throw new Error('Payload muito grande')}return raw?JSON.parse(raw):{}}
function hashPassword(password,salt=randomBytes(16).toString('hex')){return {salt,hash:scryptSync(password,salt,64).toString('hex')}}
function validPassword(password,user){const candidate=scryptSync(password,user.salt,64);return timingSafeEqual(candidate,Buffer.from(user.hash,'hex'))}
function auth(req){const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');return sessions.get(token)}
function tokenFor(username){const token=randomBytes(24).toString('hex');sessions.set(token,username);return token}

const server=http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){return send(res,204,{})}
  try{
    const url=new URL(req.url||'/',`http://${req.headers.host}`)
    if(await serveMonsterSprite(req,res,url.pathname))return
    if(await serveStatic(req,res,url.pathname))return
    if(url.pathname==='/api/health')return send(res,200,{ok:true})
    if(url.pathname==='/api/register'&&req.method==='POST'){
      const {username,password}=await body(req);if(!username||String(username).length<3||!password||String(password).length<6)return send(res,400,{error:'Usuário mínimo 3 caracteres e senha mínima 6.'})
      const db=await readDb();if(db.users.some(u=>u.username.toLowerCase()===String(username).toLowerCase()))return send(res,409,{error:'Usuário já existe.'})
      const {salt,hash}=hashPassword(String(password));db.users.push({username:String(username),salt,hash,save:null,createdAt:Date.now(),updatedAt:Date.now()});await writeDb(db);return send(res,201,{token:tokenFor(String(username)),username:String(username)})
    }
    if(url.pathname==='/api/login'&&req.method==='POST'){
      const {username,password}=await body(req);const db=await readDb();const user=db.users.find(u=>u.username.toLowerCase()===String(username||'').toLowerCase());if(!user||!validPassword(String(password||''),user))return send(res,401,{error:'Credenciais inválidas.'});return send(res,200,{token:tokenFor(user.username),username:user.username})
    }
    if(url.pathname==='/api/ranking'&&req.method==='GET'){
      const db=await readDb();const ranking=db.users.filter(u=>u.save).map(u=>({username:u.username,baseLevel:u.save.baseLevel||1,rebirths:u.save.rebirths||0,kills:u.save.kills||0})).sort((a,b)=>b.rebirths-a.rebirths||b.baseLevel-a.baseLevel||b.kills-a.kills).slice(0,50);return send(res,200,{ranking})
    }
    if(url.pathname==='/api/save'){
      const username=auth(req);if(!username)return send(res,401,{error:'Faça login primeiro.'});const db=await readDb();const user=db.users.find(u=>u.username===username);if(!user)return send(res,404,{error:'Conta não encontrada.'})
      if(req.method==='GET')return send(res,200,{save:user.save,updatedAt:user.updatedAt})
      if(req.method==='PUT'){const payload=await body(req);if(!payload.save||typeof payload.save!=='object')return send(res,400,{error:'Save inválido.'});user.save=payload.save;user.updatedAt=Date.now();await writeDb(db);return send(res,200,{ok:true,updatedAt:user.updatedAt})}
    }
    return send(res,404,{error:'Rota não encontrada.'})
  }catch(err){console.error(err);return send(res,500,{error:'Erro interno do servidor.'})}
})
server.listen(PORT,()=>console.log(`Ragnarok Idle API em http://localhost:${PORT}`))
