export type MapDef = { id:string; name:string; minLevel:number; monster:string; monsterHp:number; monsterAtk:number; exp:number; jobExp:number; zeny:number; dropRate:number; bg:string }
export type ItemDef = { id:string; name:string; type:'material'|'consumable'|'card'|'equipment'; icon:string; rarity:'common'|'uncommon'|'rare'|'epic'; attack?:number; defense?:number; hp?:number }
export type StatKey='str'|'agi'|'vit'|'int'|'dex'|'luk'
export type ClassDef={id:string;name:string;icon:string;description:string;minJob:number;bonuses:Partial<Record<StatKey,number>>}
export type SkillDef={id:string;name:string;icon:string;description:string;maxLevel:number;spCost:number;cooldown:number;jobPointCost:number;classId:string;kind:'damage'|'heal'|'buff';power:number}

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

export const classes:ClassDef[]=[
  {id:'novice',name:'Novice',icon:'✦',description:'Classe inicial equilibrada.',minJob:1,bonuses:{}},
  {id:'swordsman',name:'Swordsman',icon:'⚔',description:'Especialista em combate corpo a corpo e resistência.',minJob:10,bonuses:{str:3,vit:3}},
  {id:'mage',name:'Mage',icon:'✹',description:'Alto dano mágico e foco em INT/DEX.',minJob:10,bonuses:{int:4,dex:2}},
  {id:'archer',name:'Archer',icon:'➹',description:'Ataques rápidos e precisos à distância.',minJob:10,bonuses:{dex:4,agi:2}},
  {id:'acolyte',name:'Acolyte',icon:'✚',description:'Suporte, cura e resistência espiritual.',minJob:10,bonuses:{int:2,vit:2,luk:2}},
  {id:'thief',name:'Thief',icon:'☽',description:'Velocidade, esquiva e golpes críticos.',minJob:10,bonuses:{agi:4,luk:2}},
]

export const skills:SkillDef[]=[
  {id:'bash',name:'Bash',icon:'💥',description:'Golpe forte que causa dano adicional.',maxLevel:10,spCost:8,cooldown:3,jobPointCost:1,classId:'swordsman',kind:'damage',power:1.65},
  {id:'provoke',name:'Provoke',icon:'❗',description:'Aumenta temporariamente o dano causado.',maxLevel:10,spCost:10,cooldown:8,jobPointCost:1,classId:'swordsman',kind:'buff',power:1.2},
  {id:'firstAid',name:'First Aid',icon:'✚',description:'Recupera parte do HP.',maxLevel:5,spCost:6,cooldown:6,jobPointCost:1,classId:'novice',kind:'heal',power:.18},
]

export const startingInventory: Record<string, number> = { jellopy:42, apple:7, poringCard:1, noviceSword:1, adventurerArmor:1, ironShield:1 }
