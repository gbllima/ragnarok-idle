export type MapDef = { id:string; name:string; minLevel:number; monster:string; monsterHp:number; monsterAtk:number; exp:number; jobExp:number; zeny:number; dropRate:number; bg:string }
export type ItemDef = { id:string; name:string; type:'material'|'consumable'|'card'|'equipment'; icon:string; rarity:'common'|'uncommon'|'rare'|'epic'; attack?:number; defense?:number; hp?:number }

export const maps: MapDef[] = [
  { id:'prontera-field', name:'Prontera Field', minLevel:1, monster:'Poring', monsterHp:620, monsterAtk:18, exp:125, jobExp:52, zeny:42, dropRate:.72, bg:'meadow' },
  { id:'payon-forest', name:'Payon Forest', minLevel:10, monster:'Willow', monsterHp:920, monsterAtk:28, exp:185, jobExp:74, zeny:68, dropRate:.68, bg:'forest' },
  { id:'geffen-plains', name:'Geffen Plains', minLevel:20, monster:'Fabre', monsterHp:1350, monsterAtk:40, exp:260, jobExp:105, zeny:96, dropRate:.64, bg:'plains' },
]

export const items: Record<string, ItemDef> = {
  jellopy:{ id:'jellopy', name:'Jellopy', type:'material', icon:'◆', rarity:'common' },
  apple:{ id:'apple', name:'Apple', type:'consumable', icon:'●', rarity:'common', hp:35 },
  poringCard:{ id:'poringCard', name:'Poring Card', type:'card', icon:'▣', rarity:'rare', hp:100 },
  noviceSword:{ id:'noviceSword', name:'Novice Sword', type:'equipment', icon:'⚔', rarity:'common', attack:18 },
  adventurerArmor:{ id:'adventurerArmor', name:'Adventurer Armor', type:'equipment', icon:'◈', rarity:'uncommon', defense:12, hp:80 },
  ironShield:{ id:'ironShield', name:'Iron Shield', type:'equipment', icon:'⬟', rarity:'uncommon', defense:9 },
}

export const startingInventory: Record<string, number> = { jellopy:42, apple:7, poringCard:1, noviceSword:1, adventurerArmor:1, ironShield:1 }
