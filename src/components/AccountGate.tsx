import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CloudUpload, Crown, LogIn, ShieldCheck, Sparkles, UserPlus, UserRound, X } from 'lucide-react'
import { classes as starterClasses } from '../game/starterData'
import { downloadSave, login, register, uploadSave } from '../game/api'

type AccountMode='guest'|'account'
type CharacterProfile={id:string;name:string;classId:string;primary:boolean;createdAt:number}
type LocalProfile={version:1;mode:AccountMode;username?:string;completed:boolean;primaryCharacterId?:string;characters:CharacterProfile[]}
type Stage='auth'|'character'|'ready'
type AuthView='welcome'|'register'|'login'

const PROFILE_KEY='ragnarok-idle-account-v1'
const SAVE_KEY='ragnarok-idle-save-v1'
const initialClassIds=new Set(['novice','swordsman','mage','archer','acolyte','thief'])

function readProfile():LocalProfile|null{
  try{
    const raw=localStorage.getItem(PROFILE_KEY)
    if(!raw)return null
    const parsed=JSON.parse(raw) as Partial<LocalProfile>
    return {version:1,mode:parsed.mode==='account'?'account':'guest',username:parsed.username,completed:!!parsed.completed,primaryCharacterId:parsed.primaryCharacterId,characters:Array.isArray(parsed.characters)?parsed.characters:[]}
  }catch{return null}
}
function writeProfile(profile:LocalProfile){localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))}
function readSave(){try{const raw=localStorage.getItem(SAVE_KEY);return raw?JSON.parse(raw):null}catch{return null}}
function primaryName(profile:LocalProfile|null){return profile?.characters.find(c=>c.id===profile.primaryCharacterId)?.name||profile?.characters[0]?.name||readSave()?.characterName||'Knock'}
function makeId(){return `char-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}

function buildInitialSave(name:string,classId:string){
  const firstJob=classId!=='novice'
  return {
    version:5,characterName:name,baseLevel:1,jobLevel:1,baseExp:0,jobExp:0,zeny:500,kills:0,
    hp:940,maxHp:940,sp:400,maxSp:400,attack:218,defense:38,mapId:'prontera-field',inventory:{},
    equipped:{weapon:'noviceSword',armor:'adventurerArmor'},socketedCards:{},refinements:{},lastSeen:Date.now(),running:false,
    classId,statPoints:6,jobPoints:1,stats:{str:10,agi:10,vit:10,int:10,dex:10,luk:10},skillLevels:{basicSkill:1,firstAid:1},
    firstJobChosen:firstJob,unlockedClasses:firstJob?['novice',classId]:['novice'],bestiary:{},claimedQuests:[],
    auto:{enabledSkills:[],healPct:35,useConsumables:true,autoSellCommon:false},rebirths:0,rebirthPoints:0,
    partySlots:1,partyMembers:[],partyRemainderExp:0,partyRemainderJob:0,
  }
}

function installNameSync(getName:()=>string){
  const apply=()=>{
    const name=getName()
    const set=(selector:string)=>{document.querySelectorAll<HTMLElement>(selector).forEach(el=>{if(el.textContent!==name)el.textContent=name})}
    set('.hud-copy>strong')
    set('.party-dock .ro-party-member.leader .ro-party-name strong')
    set('.party-manager-ro .party-roster-row.leader b')
    set('.prontera-player>b')
    const title=document.querySelector<HTMLElement>('.character-panel h3')
    if(title){const className=title.textContent?.split('·').slice(1).join('·').trim();const next=className?`${name} · ${className}`:name;if(title.textContent!==next)title.textContent=next}
  }
  apply()
  const observer=new MutationObserver(apply)
  observer.observe(document.body,{childList:true,subtree:true})
  return()=>observer.disconnect()
}

export function AccountGate({children}:{children:ReactNode}){
  const [profile,setProfile]=useState<LocalProfile|null>(()=>readProfile())
  const [stage,setStage]=useState<Stage>(()=>{const p=readProfile();return p?.completed?'ready':p?'character':'auth'})
  const [authView,setAuthView]=useState<AuthView>('welcome')
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [claimOpen,setClaimOpen]=useState(false)
  const starterOptions=useMemo(()=>starterClasses.filter(c=>initialClassIds.has(c.id)),[])
  const hasLocalProgress=!!readSave()

  useEffect(()=>stage==='ready'?installNameSync(()=>primaryName(readProfile())):undefined,[stage])

  const beginGuest=()=>{
    const next:LocalProfile={version:1,mode:'guest',completed:false,characters:[]}
    writeProfile(next);setProfile(next);setStage('character');setError('')
  }
  const continueLocal=()=>{
    const save=readSave()||{}
    const character:CharacterProfile={id:makeId(),name:save.characterName||'Knock',classId:save.classId||'novice',primary:true,createdAt:Date.now()}
    const next:LocalProfile={version:1,mode:'guest',completed:true,primaryCharacterId:character.id,characters:[character]}
    writeProfile(next);setProfile(next);setStage('ready');setError('')
  }
  const submitRegister=async()=>{
    setBusy(true);setError('')
    try{
      const result=await register(username.trim(),password)
      const next:LocalProfile={version:1,mode:'account',username:result.username||username.trim(),completed:false,characters:[]}
      writeProfile(next);setProfile(next);setStage('character')
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível criar a conta.')}
    finally{setBusy(false)}
  }
  const submitLogin=async()=>{
    setBusy(true);setError('')
    try{
      const result=await login(username.trim(),password)
      const remote=await downloadSave() as {save?:Record<string,unknown>|null}
      if(remote.save){
        localStorage.setItem(SAVE_KEY,JSON.stringify(remote.save))
        const name=typeof remote.save.characterName==='string'?remote.save.characterName:'Aventureiro'
        const classId=typeof remote.save.classId==='string'?remote.save.classId:'novice'
        const character:CharacterProfile={id:makeId(),name,classId,primary:true,createdAt:Date.now()}
        const next:LocalProfile={version:1,mode:'account',username:result.username||username.trim(),completed:true,primaryCharacterId:character.id,characters:[character]}
        writeProfile(next);setProfile(next);setStage('ready')
      }else{
        const next:LocalProfile={version:1,mode:'account',username:result.username||username.trim(),completed:false,characters:[]}
        writeProfile(next);setProfile(next);setStage('character')
      }
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível entrar.')}
    finally{setBusy(false)}
  }
  const createCharacter=async(name:string,classId:string)=>{
    const clean=name.trim()
    if(clean.length<2)return setError('O nome precisa ter pelo menos 2 caracteres.')
    const chosen=starterOptions.find(c=>c.id===classId)
    if(!chosen)return setError('Escolha uma classe inicial válida.')
    setBusy(true);setError('')
    const save=buildInitialSave(clean,classId)
    localStorage.setItem(SAVE_KEY,JSON.stringify(save))
    const character:CharacterProfile={id:makeId(),name:clean,classId,primary:true,createdAt:Date.now()}
    const base=profile||{version:1 as const,mode:'guest' as const,completed:false,characters:[]}
    const next:LocalProfile={...base,completed:true,primaryCharacterId:character.id,characters:[character]}
    writeProfile(next);setProfile(next)
    if(next.mode==='account'){
      try{await uploadSave(save)}catch{/* O save local continua válido e pode ser sincronizado depois. */}
    }
    setBusy(false);setStage('ready')
  }

  if(stage==='auth')return <section className="account-gate">
    <div className="account-gate-scenery"><i/><b/><span/></div>
    <div className="account-auth-card">
      <div className="account-logo"><Crown size={34}/><div><strong>RAGNAROK</strong><span>IDLE</span></div></div>
      {authView==='welcome'?<>
        <h1>Comece sua aventura</h1><p>Crie uma conta para salvar seu progresso na nuvem ou jogue agora como convidado e reivindique a conta depois.</p>
        <div className="account-welcome-actions"><button className="account-primary" onClick={()=>setAuthView('register')}><UserPlus/> CRIAR CONTA</button><button onClick={()=>setAuthView('login')}><LogIn/> ENTRAR</button><button className="account-guest" onClick={beginGuest}><UserRound/> JOGAR SEM CADASTRO</button>{hasLocalProgress&&<button className="account-local" onClick={continueLocal}>Continuar progresso local existente</button>}</div>
        <div className="account-benefits"><span><ShieldCheck/> Primeiro personagem = principal</span><span><CloudUpload/> Convidado pode reivindicar depois</span></div>
      </>:<>
        <button className="account-back" onClick={()=>{setAuthView('welcome');setError('')}}>← Voltar</button>
        <h1>{authView==='register'?'Criar conta':'Entrar na conta'}</h1><p>{authView==='register'?'Seu primeiro personagem será criado logo depois.':'Entre para carregar seu progresso salvo.'}</p>
        <form className="account-form" onSubmit={e=>{e.preventDefault();authView==='register'?submitRegister():submitLogin()}}><label>Usuário<input autoFocus value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={24} autoComplete="username" placeholder="Seu usuário"/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} autoComplete={authView==='register'?'new-password':'current-password'} placeholder="Mínimo 6 caracteres"/></label>{error&&<div className="account-error">{error}</div>}<button className="account-primary" disabled={busy||username.trim().length<3||password.length<6}>{busy?'AGUARDE...':authView==='register'?'CRIAR E CONTINUAR':'ENTRAR'}</button></form>
      </>}
    </div>
  </section>

  if(stage==='character')return <CharacterCreator classes={starterOptions} accountLabel={profile?.mode==='account'?`Conta: ${profile.username}`:'Modo convidado'} busy={busy} error={error} onCreate={createCharacter}/>

  return <>{children}{profile?.mode==='guest'&&<><button className="guest-claim-chip" onClick={()=>setClaimOpen(true)}><Sparkles size={14}/> Conta convidado · Reivindicar</button>{claimOpen&&<ClaimGuest profile={profile} onClose={()=>setClaimOpen(false)} onClaim={next=>{writeProfile(next);setProfile(next);setClaimOpen(false)}}/>}</>}</>
}

function CharacterCreator({classes,accountLabel,busy,error,onCreate}:{classes:typeof starterClasses;accountLabel:string;busy:boolean;error:string;onCreate:(name:string,classId:string)=>void}){
  const defaultClass=classes.find(c=>c.id==='swordsman')?.id||classes[0]?.id||'novice'
  const [name,setName]=useState('')
  const [classId,setClassId]=useState(defaultClass)
  const selected=classes.find(c=>c.id===classId)
  return <section className="character-create-screen">
    <div className="character-create-header"><div className="account-logo"><Crown size={30}/><div><strong>RAGNAROK</strong><span>IDLE</span></div></div><small>{accountLabel}</small></div>
    <div className="character-create-card"><div className="character-create-copy"><span>ETAPA 2 DE 2</span><h1>Crie seu primeiro personagem</h1><p>O primeiro personagem desta conta será automaticamente o <b>personagem principal e líder da Party</b>. Essa escolha não precisa ser feita manualmente.</p></div>
      <label className="character-name-field">Nome do personagem<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={20} placeholder="Ex.: Knock" autoFocus/><small>2 a 20 caracteres</small></label>
      <div className="starter-class-title"><div><h2>Escolha a classe inicial</h2><p>Apenas classes iniciais estão disponíveis nesta criação.</p></div><span>{selected?.icon} {selected?.name}</span></div>
      <div className="starter-class-grid">{classes.map(cls=><button key={cls.id} className={classId===cls.id?'selected':''} onClick={()=>setClassId(cls.id)}><i>{cls.icon}</i><strong>{cls.name}</strong><span>{cls.description}</span><em>{cls.id==='novice'?'Caminho clássico':'Começa diretamente nesta classe'}</em></button>)}</div>
      {error&&<div className="account-error">{error}</div>}
      <div className="character-create-footer"><div><ShieldCheck/><span><b>{name.trim()||'Seu personagem'}</b><small>{selected?.name} · Personagem Principal</small></span></div><button className="account-primary" disabled={busy||name.trim().length<2} onClick={()=>onCreate(name,classId)}>{busy?'CRIANDO...':'CRIAR PERSONAGEM E JOGAR'}</button></div>
    </div>
  </section>
}

function ClaimGuest({profile,onClose,onClaim}:{profile:LocalProfile;onClose:()=>void;onClaim:(profile:LocalProfile)=>void}){
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const submit=async()=>{
    setBusy(true);setError('')
    try{
      const result=await register(username.trim(),password)
      const save=readSave()
      let cloudError=false
      if(save){try{await uploadSave(save)}catch{cloudError=true}}
      onClaim({...profile,mode:'account',username:result.username||username.trim()})
      if(cloudError)console.warn('Conta reivindicada; a sincronização do save poderá ser repetida no menu Conta.')
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível reivindicar a conta.')}
    finally{setBusy(false)}
  }
  return <div className="claim-backdrop" onMouseDown={onClose}><section className="claim-card" onMouseDown={e=>e.stopPropagation()}><button className="claim-close" onClick={onClose}><X size={18}/></button><Sparkles size={28}/><h2>Reivindicar conta de convidado</h2><p>Transforme este progresso local em uma conta permanente. Seu personagem principal, itens, níveis e Party continuam iguais.</p><form onSubmit={e=>{e.preventDefault();submit()}}><label>Usuário<input value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={24}/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6}/></label>{error&&<div className="account-error">{error}</div>}<button className="account-primary" disabled={busy||username.trim().length<3||password.length<6}>{busy?'SALVANDO...':'CRIAR CONTA E REIVINDICAR'}</button></form></section></div>
}
