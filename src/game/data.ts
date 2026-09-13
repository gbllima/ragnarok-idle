export type MapDef = { id:string; name:string; minLevel:number; monster:string; monsterHp:number; monsterAtk:number; exp:number; jobExp:number; zeny:number; dropRate:number; bg:string }
export type ItemDef = { id:string; name:string; type:'material'|'consumable'|'card'|'equipment'; icon:string; rarity:'common'|'uncommon'|'rare'|'epic'; attack?:number; defense?:number; hp?:number }
export type StatKey='str'|'agi'|'vit'|'int'|'dex'|'luk'
export type ClassDef={id:string;name:string;icon:string;description:string;minBase:number;minJob:number;bonuses:Partial<Record<StatKey,number>>}
export type SkillDef={id:string;name:string;icon:string;description:string;maxLevel:number;spCost:number;cooldown:number;jobPointCost:number;classId:string;kind:'damage'|'heal'|'buff';power:number;requires?:{skillId:string;level:number}}

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
  {id:'novice',name:'Novice',icon:'✦',description:'Classe inicial. Alcance Base Lv. 10 e Job Lv. 10 para escolher sua primeira vocação.',minBase:1,minJob:1,bonuses:{}},
  {id:'swordsman',name:'Swordsman',icon:'⚔',description:'Especialista em combate corpo a corpo, força e resistência.',minBase:10,minJob:10,bonuses:{str:3,vit:3}},
  {id:'mage',name:'Mage',icon:'✹',description:'Especialista em magia ofensiva, INT e DEX.',minBase:10,minJob:10,bonuses:{int:4,dex:2}},
  {id:'archer',name:'Archer',icon:'➹',description:'Ataques à distância com alta precisão e velocidade.',minBase:10,minJob:10,bonuses:{dex:4,agi:2}},
  {id:'acolyte',name:'Acolyte',icon:'✚',description:'Cura, suporte e grande resistência espiritual.',minBase:10,minJob:10,bonuses:{int:2,vit:2,luk:2}},
  {id:'thief',name:'Thief',icon:'☽',description:'Velocidade, esquiva e golpes críticos.',minBase:10,minJob:10,bonuses:{agi:4,luk:2}},
]

export const skills:SkillDef[]=[
  {id:'basicSkill',name:'Basic Skill',icon:'✦',description:'Fundamentos de aventura. Aumenta levemente o dano do ataque básico.',maxLevel:9,spCost:0,cooldown:1,jobPointCost:1,classId:'novice',kind:'buff',power:1.03},
  {id:'firstAid',name:'First Aid',icon:'✚',description:'Recupera uma parte do HP máximo.',maxLevel:5,spCost:6,cooldown:6,jobPointCost:1,classId:'novice',kind:'heal',power:.18},

  {id:'bash',name:'Bash',icon:'💥',description:'Golpe físico poderoso com dano aumentado.',maxLevel:10,spCost:8,cooldown:3,jobPointCost:1,classId:'swordsman',kind:'damage',power:1.65},
  {id:'provoke',name:'Provoke',icon:'❗',description:'Aumenta temporariamente a pressão ofensiva.',maxLevel:10,spCost:10,cooldown:8,jobPointCost:1,classId:'swordsman',kind:'buff',power:1.2,requires:{skillId:'bash',level:3}},
  {id:'magnumBreak',name:'Magnum Break',icon:'🔥',description:'Explosão corpo a corpo que causa alto dano.',maxLevel:10,spCost:14,cooldown:5,jobPointCost:1,classId:'swordsman',kind:'damage',power:2.05,requires:{skillId:'bash',level:5}},

  {id:'fireBolt',name:'Fire Bolt',icon:'🔥',description:'Dispara uma sequência de projéteis de fogo.',maxLevel:10,spCost:12,cooldown:3,jobPointCost:1,classId:'mage',kind:'damage',power:1.75},
  {id:'coldBolt',name:'Cold Bolt',icon:'❄',description:'Rajada de gelo com alto dano mágico.',maxLevel:10,spCost:12,cooldown:3,jobPointCost:1,classId:'mage',kind:'damage',power:1.72},
  {id:'soulStrike',name:'Soul Strike',icon:'✹',description:'Ataque espiritual rápido e penetrante.',maxLevel:10,spCost:16,cooldown:5,jobPointCost:1,classId:'mage',kind:'damage',power:2.1,requires:{skillId:'fireBolt',level:3}},

  {id:'owlEye',name:'Owl Eye',icon:'◉',description:'Treinamento de precisão que melhora ataques à distância.',maxLevel:10,spCost:4,cooldown:5,jobPointCost:1,classId:'archer',kind:'buff',power:1.08},
  {id:'doubleStrafe',name:'Double Strafe',icon:'➹',description:'Dispara duas flechas em rápida sucessão.',maxLevel:10,spCost:10,cooldown:3,jobPointCost:1,classId:'archer',kind:'damage',power:1.8,requires:{skillId:'owlEye',level:3}},
  {id:'arrowShower',name:'Arrow Shower',icon:'☄',description:'Chuva de flechas concentrada no alvo.',maxLevel:10,spCost:16,cooldown:5,jobPointCost:1,classId:'archer',kind:'damage',power:2.0,requires:{skillId:'doubleStrafe',level:5}},

  {id:'heal',name:'Heal',icon:'✚',description:'Recupera grande quantidade de HP.',maxLevel:10,spCost:12,cooldown:4,jobPointCost:1,classId:'acolyte',kind:'heal',power:.25},
  {id:'blessing',name:'Blessing',icon:'✧',description:'Bênção que aumenta temporariamente o poder de combate.',maxLevel:10,spCost:14,cooldown:8,jobPointCost:1,classId:'acolyte',kind:'buff',power:1.18,requires:{skillId:'heal',level:3}},
  {id:'holyLight',name:'Holy Light',icon:'☀',description:'Luz sagrada concentrada que causa dano.',maxLevel:10,spCost:16,cooldown:5,jobPointCost:1,classId:'acolyte',kind:'damage',power:1.95,requires:{skillId:'heal',level:5}},

  {id:'doubleAttack',name:'Double Attack',icon:'☽',description:'Chance treinada de aplicar um golpe duplo.',maxLevel:10,spCost:6,cooldown:3,jobPointCost:1,classId:'thief',kind:'damage',power:1.7},
  {id:'improveDodge',name:'Improve Dodge',icon:'➤',description:'Aumenta mobilidade e eficiência ofensiva.',maxLevel:10,spCost:8,cooldown:7,jobPointCost:1,classId:'thief',kind:'buff',power:1.15},
  {id:'envenom',name:'Envenom',icon:'☠',description:'Ataque venenoso de alto dano.',maxLevel:10,spCost:12,cooldown:5,jobPointCost:1,classId:'thief',kind:'damage',power:2.0,requires:{skillId:'doubleAttack',level:5}},
]

export const startingInventory: Record<string, number> = { jellopy:42, apple:7, poringCard:1, noviceSword:1, adventurerArmor:1, ironShield:1 }
