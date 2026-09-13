import type { EquipSlot, ItemDef, StatKey } from './starterData'
import { rathenaJobNames, refineBonus } from './progression'

export const equipmentSlots:ReadonlyArray<readonly [EquipSlot,string]>=[['weapon','Arma'],['shield','Escudo'],['armor','Armadura'],['headTop','Cabeça · topo'],['headMid','Cabeça · meio'],['headBottom','Cabeça · baixo'],['garment','Capa'],['shoes','Calçado'],['accessoryLeft','Acessório 1'],['accessoryRight','Acessório 2'],['ammo','Munição'],['costumeTop','Visual · topo'],['costumeMid','Visual · meio'],['costumeBottom','Visual · baixo'],['costumeGarment','Visual · capa'],['shadowWeapon','Arma sombria'],['shadowShield','Escudo sombrio'],['shadowArmor','Armadura sombria'],['shadowShoes','Calçado sombrio'],['shadowAccessoryLeft','Acessório sombrio 1'],['shadowAccessoryRight','Acessório sombrio 2']]
export type EquipmentState={baseLevel:number;classId:string;rebirths:number;inventory:Record<string,number>;equipped:Partial<Record<EquipSlot,string>>;socketedCards:Partial<Record<EquipSlot,string>>;refinements?:Record<string,number>}

export function equipmentReason(state:EquipmentState,item:ItemDef){
  if(item.type!=='equipment'||!item.slot)return 'Este item não é equipável.'
  if((state.inventory[item.id]||0)<1)return 'Você não possui este item.'
  if(state.baseLevel<(item.equipLevel||1))return `Requer Base Lv. ${item.equipLevel}.`
  if(item.equipLevelMax&&state.baseLevel>item.equipLevelMax)return `Permitido até Base Lv. ${item.equipLevelMax}.`
  if(item.source!=='game'&&item.jobs){const names=rathenaJobNames(state.classId);if(!Object.entries(item.jobs).some(([job,ok])=>ok&&names.has(job)))return 'Sua classe não pode equipar este item.'}
  if(item.classRestrictions&&!item.classRestrictions.All&&!item.classRestrictions.Normal&&state.rebirths<1)return 'Requer personagem avançado/transcendente.'
  return ''
}

export function equipOwned<T extends EquipmentState>(state:T,item:ItemDef):T {
  if(equipmentReason(state,item))return state
  let slots=item.equipSlots?.length?item.equipSlots:[item.slot!]
  if(item.locations?.includes('Both_Accessory'))slots=[!state.equipped.accessoryLeft?'accessoryLeft':!state.equipped.accessoryRight?'accessoryRight':'accessoryLeft']
  const replaced=new Set(slots.map(slot=>state.equipped[slot]).filter(Boolean))
  replaced.add(item.id)
  const equipped={...state.equipped},socketedCards={...state.socketedCards},inventory={...state.inventory}
  for(const [slot,id] of Object.entries(equipped) as [EquipSlot,string][]){
    if(!replaced.has(id))continue
    delete equipped[slot]
    const card=socketedCards[slot]
    if(card){inventory[card]=(inventory[card]||0)+1;delete socketedCards[slot]}
  }
  for(const slot of slots)equipped[slot]=item.id
  return {...state,equipped,socketedCards,inventory}
}

export function cardReason(state:EquipmentState,slot:EquipSlot,card:ItemDef,registry:Record<string,ItemDef>){
  const gear=registry[state.equipped[slot]||'']
  if(!gear||gear.slot!==slot)return 'Selecione o slot principal de um equipamento.'
  if(card.type!=='card'||(state.inventory[card.id]||0)<1)return 'Carta indisponível.'
  if(card.subtype?.toLowerCase()==='enchant')return 'Este item requer o sistema de encantamentos.'
  if(card.unsupportedEffects&&!card.cardBonus)return 'O efeito desta carta ainda não está implementado.'
  if(gear.cardSlots===0)return 'Este equipamento não possui encaixe para cartas.'
  if(card.equipSlots?.length&&!card.equipSlots.includes(slot))return 'Carta incompatível com este equipamento.'
  return ''
}

export function equipmentStats(state:EquipmentState,registry:Record<string,ItemDef>){
  const gear=[...new Set(Object.values(state.equipped))].map(id=>registry[id!]).filter(Boolean)
  const cards=Object.values(state.socketedCards).map(id=>registry[id!]).filter(Boolean)
  const stats:Record<StatKey,number>={str:0,agi:0,vit:0,int:0,dex:0,luk:0}
  for(const item of [...gear,...cards]) for(const key of Object.keys(stats) as StatKey[]) stats[key]+=item.statBonus?.[key]||0
  let refineAttack=0,refineDefense=0
  for(const item of gear){const level=state.refinements?.[item.id]||0;const bonus=refineBonus(item,level);refineAttack+=bonus.attack;refineDefense+=bonus.defense}
  return {gear,cards,stats,refineAttack,refineDefense}
}

export function canConsume(item:ItemDef){return item.type==='consumable'&&!!(item.heal||item.hp||item.sp)}
export function healingAmount(item:ItemDef,maxHp:number,maxSp:number,random=Math.random){
  const roll=(range?:[number,number])=>range?range[0]+Math.floor(random()*(range[1]-range[0]+1)):0
  return {hp:item.heal?roll(item.heal.hp)+Math.floor(maxHp*roll(item.heal.hpPercent)/100):(item.hp||0),sp:item.heal?roll(item.heal.sp)+Math.floor(maxSp*roll(item.heal.spPercent)/100):(item.sp||0)}
}
