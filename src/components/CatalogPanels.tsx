import { useMemo, useState } from 'react'
import { catalogItems, databaseMetadata, items, maps, monsterCatalog, shopItems, type ItemDef, type MapDef } from '../game/data'
import { equipmentSlots, equipmentReason, cardReason, canConsume } from '../game/equipment'
import { mapAsset, monsterAssets, playerPortrait } from '../game/assets'
import type { useGame } from '../game/useGame'
import { ItemIcon } from './ItemIcon'

type Game=ReturnType<typeof useGame>
const fold=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const number=(n:number)=>n.toLocaleString('pt-BR')
const pageSize=24
const itemSearch=new Map(catalogItems.map(item=>[item.id,fold(`${item.name} ${item.englishName||''} ${item.aegisName||''} ${item.aegisId||''}`)]))
const monsterSearch=new Map(maps.map(map=>[map.id,fold(`${map.name} ${map.monster} ${map.aegisName||''} ${map.monsterId}`)]))
const categoryLabels:Record<string,string>={Weapon:'Armas',Armor:'Armaduras',ShadowGear:'Equipamentos sombrios',Ammo:'Munição',Card:'Cartas',Healing:'Cura',Usable:'Consumíveis',DelayConsume:'Consumíveis especiais',Cash:'Itens especiais',PetEgg:'Ovos de mascote',PetArmor:'Acessórios de mascote',Etc:'Materiais'}

function Pagination({count,page,setPage}:{count:number;page:number;setPage:(n:number)=>void}){
  const pages=Math.max(1,Math.ceil(count/pageSize))
  return <nav className="catalog-pagination" aria-label="Paginação"><span>{number(count)} resultados · página {page+1}/{pages}</span><button disabled={page===0} onClick={()=>setPage(page-1)}>Anterior</button><button disabled={page+1>=pages} onClick={()=>setPage(page+1)}>Próxima</button></nav>
}

function ItemDetails({item}:{item:ItemDef}){
  return <div className="catalog-item-stats"><small>#{item.aegisId??item.id} · {categoryLabels[item.category||'']||item.type}{item.subtype?` · ${item.subtype}`:''}</small>{item.type==='equipment'&&<span>ATK {item.attack||0} · MATK {item.magicAttack||0} · DEF {item.defense||0} · Base {item.equipLevel||1}+</span>}{item.cardSlots!==undefined&&item.type==='equipment'&&<small>{item.cardSlots} encaixes no original · até 1 carta ativa no idle</small>}{item.unsupportedEffects&&<small className="catalog-note">Efeitos especiais ainda não implementados; atributos básicos disponíveis.</small>}{item.description&&<details><summary>Descrição original</summary><p>{item.description}</p></details>}</div>
}

export function Catalog({g}:{g:Game}){
  const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[page,setPage]=useState(0),[owned,setOwned]=useState(false)
  const rows=useMemo(()=>catalogItems.filter(item=>(!category||item.category===category)&&(!owned||(g.save.inventory[item.id]||0)>0)&&(itemSearch.get(item.id)||'').includes(fold(query))),[query,category,owned,g.save.inventory])
  const current=Math.min(page,Math.max(0,Math.ceil(rows.length/pageSize)-1))
  return <div className="catalog-panel"><p className="catalog-summary">Renewal · {number(databaseMetadata.itemCount)} itens · {number(databaseMetadata.weaponCount)} armas</p><div className="catalog-toolbar"><input aria-label="Buscar item" placeholder="Nome em português, inglês ou ID…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/><select aria-label="Categoria de item" value={category} onChange={e=>{setCategory(e.target.value);setPage(0)}}><option value="">Todos os itens</option>{Object.entries(categoryLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><label><input type="checkbox" checked={owned} onChange={e=>{setOwned(e.target.checked);setPage(0)}}/>No inventário</label></div><p>Mercado do idle: itens liberados pelo nível. Preços em Zeny próprios deste modo; não são preços de NPCs do Ragnarok.</p><Pagination count={rows.length} page={current} setPage={setPage}/><div className="catalog-item-grid">{rows.slice(current*pageSize,(current+1)*pageSize).map(item=><article className="catalog-item" key={item.id}><ItemIcon id={item.id}/><strong>{item.name}{item.cardSlots?` [${item.cardSlots}]`:''}</strong><ItemDetails item={item}/><span>Na mochila: {number(g.save.inventory[item.id]||0)}</span><button className="catalog-buy" disabled={g.save.zeny<(item.marketPrice||Infinity)||g.save.baseLevel<(item.equipLevel||1)} onClick={()=>g.buyCatalogItem(item.id)}>{g.save.baseLevel<(item.equipLevel||1)?`Requer Base ${item.equipLevel}`:`Comprar · ${number(item.marketPrice||0)}z`}</button>{item.type==='equipment'&&(g.save.inventory[item.id]||0)>0&&<button title={equipmentReason(g.save,item)} disabled={!!equipmentReason(g.save,item)} onClick={()=>g.equip(item.id)}>Equipar</button>}</article>)}</div>{!rows.length&&<p role="status">Nenhum item encontrado.</p>}<Pagination count={rows.length} page={current} setPage={setPage}/></div>
}

export function Inventory({g}:{g:Game}){
  const [query,setQuery]=useState(''),[page,setPage]=useState(0)
  const rows=Object.entries(g.save.inventory).filter(([id,qty])=>qty>0&&items[id]&&fold(`${items[id].name} ${items[id].aegisId||''}`).includes(fold(query)))
  const current=Math.min(page,Math.max(0,Math.ceil(rows.length/pageSize)-1))
  return <div><div className="catalog-toolbar"><input aria-label="Buscar no inventário" placeholder="Buscar na mochila…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></div><Pagination count={rows.length} page={current} setPage={setPage}/><div className="inventory-grid">{rows.slice(current*pageSize,(current+1)*pageSize).map(([id,qty])=>{const item=items[id];return <article className={`item-slot ${item.rarity}`} key={id}><ItemIcon id={id}/><b>{item.name}</b><em>x{qty}</em><ItemDetails item={item}/><div className="item-actions">{item.type==='equipment'&&<button disabled={!!equipmentReason(g.save,item)} title={equipmentReason(g.save,item)} onClick={()=>g.equip(id)}>Equipar</button>}{canConsume(item)&&<button onClick={()=>g.consumeItem(id)}>Usar</button>}<button disabled={item.noSell||(Object.values(g.save.equipped).includes(id)&&qty<=1)} onClick={()=>g.sellItem(id)}>Vender {item.sell??1}z</button></div></article>})}</div>{!rows.length&&<p>Nenhum item encontrado.</p>}</div>
}

export function Equipment({g}:{g:Game}){
  const [query,setQuery]=useState('')
  const cards=Object.entries(g.save.inventory).filter(([id,q])=>q>0&&items[id]?.type==='card'&&fold(items[id].name).includes(fold(query)))
  return <div className="equipment-layout"><div className="paperdoll"><img src={playerPortrait(g.save.classId)} alt={g.classDef.name}/><p>ATK {g.save.attack} · DEF {g.save.defense}</p><p>Os sprites de classe usam a aparência base. Equipamentos alteram os atributos.</p><input aria-label="Buscar carta" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filtrar cartas…"/></div><div className="equipment-slots">{equipmentSlots.map(([slot,label])=>{const id=g.save.equipped[slot],card=g.save.socketedCards[slot];return <div className="equip-row catalog-equip-row" key={slot}><span>{label}</span><b>{id&&<ItemIcon id={id}/>} {id?items[id]?.name:'Vazio'}</b>{id&&<button onClick={()=>g.unequip(slot)}>Remover</button>}{card&&<button onClick={()=>g.removeCard(slot)}>Remover carta: {items[card]?.name}</button>}{id&&<div className="card-picker">{cards.filter(([cardId])=>!cardReason(g.save,slot,items[cardId],items)).slice(0,12).map(([cardId])=><button key={cardId} onClick={()=>g.socketCard(slot,cardId)}><ItemIcon id={cardId}/> {items[cardId].name}</button>)}</div>}</div>})}</div></div>
}

function MonsterImage({map}:{map:MapDef}){
  return <img className="ro-bestiary-sprite" src={monsterAssets[map.spriteKey||map.monster]?.src||'/sprites/missing-monster.svg'} alt={map.monster} loading="lazy"/>
}

export function HuntingMaps({g,close,bestiary=false}:{g:Game;close:()=>void;bestiary?:boolean}){
  const [query,setQuery]=useState(''),[page,setPage]=useState(0),[unlocked,setUnlocked]=useState(!bestiary),[boss,setBoss]=useState('')
  const rows=useMemo(()=>(bestiary?monsterCatalog:maps).filter(map=>(!unlocked||g.save.baseLevel>=map.minLevel)&&(!boss||(boss==='boss'?map.boss:!map.boss))&&(monsterSearch.get(map.id)||'').includes(fold(query))).sort((a,b)=>a.minLevel-b.minLevel||a.monsterId-b.monsterId),[query,unlocked,boss,g.save.baseLevel,bestiary])
  const current=Math.min(page,Math.max(0,Math.ceil(rows.length/pageSize)-1))
  return <div className="catalog-panel"><p className="catalog-summary">{number(databaseMetadata.monsterCount)} monstros Renewal · caçadas individuais com drops originais</p><div className="catalog-toolbar"><input aria-label="Buscar monstro" placeholder="Monstro, nome Aegis ou ID…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/><select aria-label="Tipo de monstro" value={boss} onChange={e=>{setBoss(e.target.value);setPage(0)}}><option value="">Todos os monstros</option><option value="boss">Chefes / MVP</option><option value="normal">Normais</option></select><label><input type="checkbox" checked={unlocked} onChange={e=>{setUnlocked(e.target.checked);setPage(0)}}/>Disponíveis no meu nível</label></div><Pagination count={rows.length} page={current} setPage={setPage}/><div className="catalog-monster-grid">{rows.slice(current*pageSize,(current+1)*pageSize).map(map=>{const kills=g.save.bestiary[map.bestiaryKey||map.monster]||0;return <article className={`catalog-monster ${g.map.id===map.id?'selected':''}`} key={map.id}><div className="catalog-monster-art" style={{backgroundImage:`url("${mapAsset(map.bg).ground}")`}}><MonsterImage map={map}/>{map.boss&&<b className="boss-badge">CHEFE / MVP</b>}</div><strong>{map.monster}</strong><small>#{map.monsterId} · Lv. {map.monsterLevel} · {map.race} · {map.element}</small><span>HP {number(map.monsterHp)} · ATK {number(map.monsterAtk)} · DEF {map.monsterDef}</span><span>{number(map.exp)} EXP · {number(map.jobExp)} Job</span><span>{number(kills)} derrotados</span><details><summary>Drops ({map.drops.length})</summary><ul className="catalog-drops">{map.drops.map((drop,index)=><li key={`${drop.itemId}-${index}`}><ItemIcon id={drop.itemId}/><span>{items[drop.itemId]?.name} {drop.mvp?'(MVP)':''}<small>{(drop.rate/100).toLocaleString('pt-BR')}%</small></span></li>)}</ul>{!map.drops.length&&<p>Sem drops cadastrados.</p>}</details><button disabled={g.save.baseLevel<map.minLevel} onClick={()=>{g.changeMap(map.id);close()}}>{g.save.baseLevel<map.minLevel?`Requer Base ${map.minLevel}`:g.map.id===map.id?'Caçada atual':'Caçar aqui'}</button></article>})}</div>{!rows.length&&<p role="status">Nenhum monstro encontrado. Tente remover os filtros.</p>}<Pagination count={rows.length} page={current} setPage={setPage}/></div>
}

export function Shop({g}:{g:Game}){
  const [full,setFull]=useState(false)
  return <div><div className="catalog-tabs"><button className={!full?'selected':''} onClick={()=>setFull(false)}>Loja inicial</button><button className={full?'selected':''} onClick={()=>setFull(true)}>Mercado completo</button><b>{number(g.save.zeny)} Zeny</b></div>{full?<Catalog g={g}/>:<div className="shop-grid">{shopItems.map(id=>{const item=items[id];return <article className="shop-card" key={id}><ItemIcon id={id}/><b>{item.name}</b><small>{item.buy}z</small><button disabled={!item.buy||g.save.zeny<item.buy} onClick={()=>g.buyItem(id)}>Comprar</button></article>})}</div>}</div>
}
