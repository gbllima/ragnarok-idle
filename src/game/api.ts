const API='http://localhost:8787/api'
const TOKEN_KEY='ragnarok-idle-token'

async function request(path:string,options:RequestInit={}){
  const token=localStorage.getItem(TOKEN_KEY)
  const res=await fetch(`${API}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}})
  const body=await res.json().catch(()=>({}))
  if(!res.ok)throw new Error(body.error||'Erro no servidor')
  return body
}
export function hasSession(){return !!localStorage.getItem(TOKEN_KEY)}
export function logout(){localStorage.removeItem(TOKEN_KEY)}
export async function register(username:string,password:string){const r=await request('/register',{method:'POST',body:JSON.stringify({username,password})});localStorage.setItem(TOKEN_KEY,r.token);return r}
export async function login(username:string,password:string){const r=await request('/login',{method:'POST',body:JSON.stringify({username,password})});localStorage.setItem(TOKEN_KEY,r.token);return r}
export async function uploadSave(save:unknown){return request('/save',{method:'PUT',body:JSON.stringify({save})})}
export async function downloadSave(){return request('/save')}
export async function fetchRanking(){return request('/ranking') as Promise<{ranking:Array<{username:string;baseLevel:number;rebirths:number;kills:number}>}>}
