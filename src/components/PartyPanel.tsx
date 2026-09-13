import { useMemo, useState } from 'react'
import { Backpack, HeartPulse, LockKeyhole, Settings2, Shield, Swords, UserPlus, Users, X } from 'lucide-react'
import { classes, items, type EquipSlot, type StatKey } from '../game/data'
import { playerPortrait } from '../game/assets'
import { ItemIcon } from './ItemIcon'
import type { useGame } from '../game/useGame'

type Game=ReturnType<typeof useGame>
type OpenPanel=(name:'Inventário'|'Equipamentos'|'Party')=>void
const miniSlots:ReadonlyArray<readonly [EquipSlot,string]>=[['headTop','Topo'],['weapon','Arma'],['armor','Armadura'],['shield','Escudo'],['garment','Capa'],['shoes','Botas'],['accessoryLeft','A1'],['accessoryRight','A2']]
const stats:ReadonlyArray<readonly [StatKey,string]>=[['str','STR'],['agi','AGI'],['vit','VIT'],['int','INT'],['dex','DEX'],['luk','LUK']]

function roleFor(classId:string){
  const name=(classes.find(c=>c.id===classId)?.name||classId).toLowerCase()
  if(/acolyte|priest|monk|bishop|sura/.test(name))return {id:'sup',label:'SUP'}
  if(/sword|knight|crusader|lord|paladin|rune|royal/.test(name))return {id:'tank',label:'TANK'}
  return {id:'dps',label:'DPS'}
}
function pct(value:number,max:number){return Math.max(0,Math.min(100,max>0?value/max*100:0))}

function EquipmentMini({equipped}:{equipped:Partial<Record<EquipSlot,string>>}){
  return <div className="party-mini-equipment">{miniSlots.map(([slot,label])=>{const id=equipped[slot];return <span key={slot} title={id?items[id]?.name:label} className={id?'filled':''}>{id?<ItemIcon id={id}/>:<small>{label}</small>}</span>})}</div>
}

function MemberCard({g,memberId,onOpen}:{g:Game;memberId:'leader'|string;onOpen:OpenPanel}){
  const leader=memberId==='leader'
  const member=leader?null:g.save.partyMembers.find(m=>m.id===memberId)
  if(!leader&&!member)return null
  const name=leader?'Knock':member!.name,classId=leader?g.save.classId:member!.classId
  const baseLevel=leader?g.save.baseLevel:member!.baseLevel,jobLevel=leader?g.save.jobLevel:member!.jobLevel
  const hp=leader?g.save.hp:member!.hp,maxHp=leader?g.save.maxHp:member!.maxHp,sp=leader?g.save.sp:member!.sp,maxSp=leader?g.save.maxSp:member!.maxSp
  const baseExp=leader?g.save.baseExp:member!.baseExp,need=leader?g.baseNeed:g.partyBaseNeed(baseLevel)
  const equipped=leader?g.save.equipped:member!.equipped,role=roleFor(classId),className=classes.find(c=>c.id===classId)?.name||classId
  const active=leader?g.save.running:!!member!.active,eligible=leader||g.partyLevelEligible(g.save.baseLevel,baseLevel)
  return <article className={`ro-party-member ${leader?'leader':''} ${active?'active':''} ${!eligible?'out-range':''}`}>
    <div className="ro-party-main">
      <div className="ro-party-portrait"><img src={playerPortrait(classId)} alt={className}/><i className={active?'online':''}/></div>
      <div className="ro-party-info">
        <div className="ro-party-name"><span className={`party-role ${role.id}`}>{role.label}</span><strong>{name}</strong>{leader&&<em>Líder</em>}</div>
        <small>{className} · Base {baseLevel} · Job {jobLevel}</small>
        <div className="ro-party-bar hp"><span>♥</span><i><b style={{width:`${pct(hp,maxHp)}%`}}/><em>{Math.round(hp)}/{maxHp}</em></i></div>
        <div className="ro-party-bar sp"><span>♦</span><i><b style={{width:`${pct(sp,maxSp)}%`}}/><em>{Math.round(sp)}/{maxSp}</em></i></div>
        <div className="ro-party-bar xp"><span>XP</span><i><b style={{width:`${pct(baseExp,need)}%`}}/><em>{pct(baseExp,need).toFixed(0)}%</em></i></div>
      </div>
      <EquipmentMini equipped={equipped}/>
    </div>
    <div className="ro-party-actions">
      <button onClick={()=>onOpen(leader?'Inventário':'Party')}><Backpack size={13}/> Itens</button>
      <button onClick={()=>onOpen(leader?'Equipamentos':'Party')}><Shield size={13}/> Equip.</button>
      {!leader&&<button className={member!.active?'party-stop':'party-go'} onClick={()=>g.togglePartyMember(member!.id)}><Swords size={13}/> {member!.active?'Sair':'Entrar'}</button>}
    </div>
    {!leader&&!eligible&&<p className="party-warning">Fora da faixa de XP compartilhado: precisa estar entre 2/3 e 3/2 do nível do líder.</p>}
  </article>
}

export function PartyDock({g,onOpen}:{g:Game;onOpen:OpenPanel}){
  const formed=1+g.save.partyMembers.length
  return <section className="party-dock card" aria-label="Party">
    <header><div><Users size={17}/><b>PARTY</b><span>{formed}/{g.save.partySlots}</span></div><button onClick={()=>onOpen('Party')}><Settings2 size={14}/> Config</button></header>
    <div className="party-dock-scroll"><MemberCard g={g} memberId="leader" onOpen={onOpen}/>{g.save.partyMembers.map(m=><MemberCard key={m.id} g={g} memberId={m.id} onOpen={onOpen}/>)}
      {formed<g.save.partySlots&&<button className="party-empty" onClick={()=>onOpen('Party')}><UserPlus size={15}/> Adicionar membro</button>}
      {g.save.partySlots<3&&<div className="party-locked"><span><LockKeyhole size={14}/> SLOT BLOQUEADO</span><button disabled={g.save.zeny<g.partySlotCost} onClick={g.unlockPartySlot}>Desbloquear — {g.partySlotCost.toLocaleString('pt-BR')} Zeny</button></div>}
    </div>
    <footer><span>ATK da Party <b>+{g.partyAttack}</b></span><span>XP ativo <b>{g.partyEligibleCount+1}x</b></span></footer>
  </section>
}

export function PartyPanel({g}:{g:Game}){
  const [name,setName]=useState('')
  const starterClasses=useMemo(()=>classes.filter(c=>c.id==='novice'||(c.minBase<=10&&c.minJob<=10)),[])
  const defaultClass=starterClasses.find(c=>c.id==='swordsman')?.id||starterClasses[0]?.id||'novice'
  const [classId,setClassId]=useState(defaultClass)
  const [selected,setSelected]=useState(g.save.partyMembers[0]?.id||'')
  const member=g.save.partyMembers.find(m=>m.id===selected)
  const availableLeaderItems=Object.entries(g.save.inventory).filter(([id,q])=>q>0&&items[id]?.type==='equipment').slice(0,40)
  const memberItems=member?Object.entries(member.inventory).filter(([id,q])=>q>0&&items[id]).slice(0,60):[]
  const canAdd=1+g.save.partyMembers.length<g.save.partySlots

  return <div className="party-manager-ro">
    <section className="party-manager-summary">
      <div><Users size={24}/><span><b>Formação da Party</b><small>Personagens da mesma conta · líder fixo · até 3 membros</small></span></div>
      <strong>{1+g.save.partyMembers.length}/{g.save.partySlots}</strong>
    </section>

    <div className="party-manager-grid">
      <section className="party-roster-box">
        <h3>Formação</h3>
        <button className="party-roster-row leader"><img src={playerPortrait(g.save.classId)}/><span><b>Knock</b><small>{g.classDef.name} · Base {g.save.baseLevel}</small></span><em>LÍDER</em></button>
        {g.save.partyMembers.map(m=><button key={m.id} className={`party-roster-row ${selected===m.id?'selected':''}`} onClick={()=>setSelected(m.id)}><img src={playerPortrait(m.classId)}/><span><b>{m.name}</b><small>{classes.find(c=>c.id===m.classId)?.name} · Base {m.baseLevel}</small></span><em className={m.active?'active':''}>{m.active?'ATIVO':'INATIVO'}</em></button>)}
        {canAdd&&<form className="party-create-ro" onSubmit={e=>{e.preventDefault();if(!name.trim())return;g.addPartyMember(name.trim(),classId);setName('')}}><h4>Novo membro</h4><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do personagem" minLength={2} maxLength={20}/><select value={classId} onChange={e=>setClassId(e.target.value)}>{starterClasses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="submit" disabled={!name.trim()}><UserPlus size={14}/> Adicionar</button></form>}
        {!canAdd&&g.save.partySlots<3&&<button className="party-unlock-big" disabled={g.save.zeny<g.partySlotCost} onClick={g.unlockPartySlot}><LockKeyhole size={16}/> Desbloquear próximo slot · {g.partySlotCost.toLocaleString('pt-BR')} Zeny</button>}
      </section>

      <section className="party-detail-box">
        {!member?<div className="party-detail-empty"><Users size={42}/><b>Selecione um membro</b><span>Configure status, atributos, equipamento e inventário individual.</span></div>:<>
          <header><div><img src={playerPortrait(member.classId)}/><span><h3>{member.name}</h3><p>{classes.find(c=>c.id===member.classId)?.name} · Base {member.baseLevel} · Job {member.jobLevel}</p></span></div><button className="party-remove" onClick={()=>{g.removePartyMember(member.id);setSelected('')}} title="Remover membro"><X size={16}/></button></header>
          <div className="party-member-kpis"><span>HP <b>{member.hp}/{member.maxHp}</b></span><span>SP <b>{member.sp}/{member.maxSp}</b></span><span>ATK <b>{member.attack}</b></span><span>DEF <b>{member.defense}</b></span><span>Kills <b>{member.kills}</b></span></div>
          <div className="party-member-controls"><button className={member.active?'danger':'primary-btn'} onClick={()=>g.togglePartyMember(member.id)}><Swords size={14}/>{member.active?'Sair da caçada':'Entrar na caçada'}</button><button onClick={()=>g.healPartyMember(member.id)}><HeartPulse size={14}/> Recuperar HP/SP</button></div>
          <div className="party-stat-strip">{stats.map(([key,label])=><button key={key} disabled={member.statPoints<=0} onClick={()=>g.addPartyStat(member.id,key)}><span>{label}</span><b>{member.stats[key]}</b><em>+</em></button>)}</div>

          <h4>Equipamentos</h4><div className="party-paperdoll">{miniSlots.map(([slot,label])=>{const id=member.equipped[slot];return <button key={slot} className={id?'filled':''} onClick={()=>id&&g.unequipPartyMember(member.id,slot)} title={id?`${items[id]?.name} · clique para remover`:label}>{id?<ItemIcon id={id}/>:<small>{label}</small>}</button>})}</div>
          <h4>Inventário de {member.name}</h4><div className="party-member-inventory">{memberItems.map(([id,q])=><button key={id} title={items[id]?.name} onClick={()=>items[id]?.type==='equipment'&&g.equipPartyMember(member.id,id)}><ItemIcon id={id}/><span>{items[id]?.name}</span><b>x{q}</b>{items[id]?.type==='equipment'&&<em>Equipar</em>}</button>)}</div>
          <h4>Enviar item do líder</h4><div className="party-transfer-grid">{availableLeaderItems.map(([id,q])=><button key={id} onClick={()=>g.givePartyItem(member.id,id)} title={`Enviar ${items[id]?.name}`}><ItemIcon id={id}/><span>{items[id]?.name}</span><b>x{q}</b></button>)}</div>
          <p className="party-rules-note">Somente membros <b>ativos</b>, vivos e dentro da faixa de nível compartilham EXP/Job EXP. O total recebe bônus de party e é dividido igualmente; restos fracionários ficam acumulados para a próxima kill. Zeny e drops seguem para o inventário do líder.</p>
        </>}
      </section>
    </div>
  </div>
}
