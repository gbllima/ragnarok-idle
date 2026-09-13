export type DropDef={itemId:string;rate:number}
export type MapDef={id:string;name:string;minLevel:number;monsterId:number;monster:string;monsterLevel:number;monsterHp:number;monsterAtk:number;monsterDef:number;race:string;element:string;exp:number;jobExp:number;zeny:number;bg:string;drops:DropDef[]}
export type ItemDef={id:string;aegisId?:number;aegisName?:string;name:string;type:'material'|'consumable'|'card'|'equipment';icon:string;rarity:'common'|'uncommon'|'rare'|'epic';buy?:number;weight?:number;attack?:number;defense?:number;hp?:number;sp?:number;slot?:'weapon'|'armor'|'shield';equipLevel?:number;source?:'rAthena'|'game'}
export type StatKey='str'|'agi'|'vit'|'int'|'dex'|'luk'
export type ClassDef={id:string;name:string;icon:string;description:string;minBase:number;minJob:number;bonuses:Partial<Record<StatKey,number>>}
export type SkillDef={id:string;aegisId?:number;aegisName?:string;name:string;icon:string;description:string;maxLevel:number;spCost:number;cooldown:number;jobPointCost:number;classId:string;kind:'damage'|'heal'|'buff'|'passive';power:number;requires?:{skillId:string;level:number};element?:string;source?:'rAthena'|'game'}

// Dados de monstros, drops, itens e skills abaixo foram adaptados do banco Renewal do rAthena.
// Rate usa a escala original 0..10000 (7000 = 70%).
export const maps:MapDef[]=[
  {id:'prontera-field',name:'Prontera Field',minLevel:1,monsterId:1002,monster:'Poring',monsterLevel:1,monsterHp:55,monsterAtk:1,monsterDef:2,race:'Plant',element:'Water 1',exp:150,jobExp:40,zeny:8,bg:'meadow',drops:[
    {itemId:'jellopy',rate:7000},{itemId:'knife',rate:100},{itemId:'stickyMucus',rate:400},{itemId:'apple',rate:1000},{itemId:'flyWing',rate:500},{itemId:'unripeApple',rate:20},{itemId:'poringCard',rate:20}
  ]},
  {id:'payon-forest',name:'Payon Forest',minLevel:8,monsterId:1010,monster:'Willow',monsterLevel:8,monsterHp:78,monsterAtk:3,monsterDef:38,race:'Plant',element:'Earth 1',exp:160,jobExp:75,zeny:18,bg:'forest',drops:[
    {itemId:'treeRoot',rate:9000},{itemId:'woodenBlock',rate:100},{itemId:'resin',rate:2000},{itemId:'sweetPotato',rate:1000},{itemId:'willowCard',rate:10}
  ]},
  {id:'geffen-plains',name:'Geffen Plains',minLevel:6,monsterId:1007,monster:'Fabre',monsterLevel:6,monsterHp:59,monsterAtk:2,monsterDef:24,race:'Insect',element:'Earth 1',exp:158,jobExp:65,zeny:14,bg:'plains',drops:[
    {itemId:'fluff',rate:7000},{itemId:'feather',rate:1000},{itemId:'club',rate:80},{itemId:'flyWing',rate:500},{itemId:'greenHerb',rate:3000},{itemId:'clover',rate:1000},{itemId:'fabreCard',rate:20}
  ]},
]

export const items:Record<string,ItemDef>={
  jellopy:{id:'jellopy',aegisId:909,aegisName:'Jellopy',name:'Jellopy',type:'material',icon:'◆',rarity:'common',buy:6,weight:10,source:'rAthena'},
  stickyMucus:{id:'stickyMucus',aegisId:938,aegisName:'Sticky_Mucus',name:'Sticky Mucus',type:'material',icon:'◉',rarity:'common',buy:70,weight:10,source:'rAthena'},
  apple:{id:'apple',aegisId:512,aegisName:'Apple',name:'Apple',type:'consumable',icon:'●',rarity:'common',buy:15,weight:20,hp:19,source:'rAthena'},
  flyWing:{id:'flyWing',aegisId:601,aegisName:'Wing_Of_Fly',name:'Fly Wing',type:'consumable',icon:'➤',rarity:'uncommon',buy:250,weight:50,source:'rAthena'},
  unripeApple:{id:'unripeApple',name:'Unripe Apple',type:'material',icon:'●',rarity:'rare',source:'rAthena'},
  poringCard:{id:'poringCard',aegisId:4001,aegisName:'Poring_Card',name:'Poring Card',type:'card',icon:'▣',rarity:'rare',buy:20,weight:10,source:'rAthena'},
  treeRoot:{id:'treeRoot',aegisId:902,aegisName:'Tree_Root',name:'Tree Root',type:'material',icon:'⌁',rarity:'common',buy:12,weight:10,source:'rAthena'},
  woodenBlock:{id:'woodenBlock',name:'Wooden Block',type:'material',icon:'▰',rarity:'uncommon',source:'rAthena'},
  resin:{id:'resin',aegisId:907,aegisName:'Resin',name:'Resin',type:'material',icon:'⬢',rarity:'common',buy:120,weight:10,source:'rAthena'},
  sweetPotato:{id:'sweetPotato',aegisId:516,aegisName:'Sweet_Potato',name:'Potato',type:'consumable',icon:'●',rarity:'common',buy:15,weight:20,hp:19,source:'rAthena'},
  willowCard:{id:'willowCard',aegisId:4010,aegisName:'Wilow_Card',name:'Willow Card',type:'card',icon:'▣',rarity:'rare',buy:20,weight:10,sp:80,source:'rAthena'},
  fluff:{id:'fluff',aegisId:914,aegisName:'Fluff',name:'Fluff',type:'material',icon:'✦',rarity:'common',buy:8,weight:10,source:'rAthena'},
  feather:{id:'feather',aegisId:949,aegisName:'Feather',name:'Feather',type:'material',icon:'⌁',rarity:'common',buy:20,weight:10,source:'rAthena'},
  greenHerb:{id:'greenHerb',name:'Green Herb',type:'consumable',icon:'♣',rarity:'common',source:'rAthena'},
  clover:{id:'clover',aegisId:705,aegisName:'Clover',name:'Clover',type:'material',icon:'♣',rarity:'common',buy:10,weight:10,source:'rAthena'},
  fabreCard:{id:'fabreCard',aegisId:4002,aegisName:'Fabre_Card',name:'Fabre Card',type:'card',icon:'▣',rarity:'rare',buy:20,weight:10,hp:100,source:'rAthena'},
  knife:{id:'knife',aegisId:1202,aegisName:'Knife_',name:'Knife [4]',type:'equipment',icon:'🗡',rarity:'uncommon',buy:50,weight:400,attack:17,slot:'weapon',equipLevel:1,source:'rAthena'},
  club:{id:'club',aegisId:1502,aegisName:'Club_',name:'Club [4]',type:'equipment',icon:'⚒',rarity:'uncommon',buy:120,weight:700,attack:23,slot:'weapon',equipLevel:2,source:'rAthena'},
  adventurerArmor:{id:'adventurerArmor',aegisId:2305,aegisName:'Adventure_Suit',name:"Adventurer's Suit",type:'equipment',icon:'◈',rarity:'uncommon',buy:1000,weight:300,defense:20,slot:'armor',source:'rAthena'},
  noviceSword:{id:'noviceSword',name:'Novice Sword',type:'equipment',icon:'⚔',rarity:'common',attack:18,slot:'weapon',source:'game'},
  ironShield:{id:'ironShield',name:'Iron Shield',type:'equipment',icon:'⬟',rarity:'uncommon',defense:9,slot:'shield',source:'game'},
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
  {id:'basicSkill',aegisId:1,aegisName:'NV_BASIC',name:'Basic Skill',icon:'✦',description:'Fundamentos básicos do Novice.',maxLevel:9,spCost:0,cooldown:0,jobPointCost:1,classId:'novice',kind:'passive',power:1.02,source:'rAthena'},
  {id:'firstAid',aegisId:142,aegisName:'NV_FIRSTAID',name:'First Aid',icon:'✚',description:'Primeiros socorros. No rAthena custa 3 SP.',maxLevel:1,spCost:3,cooldown:5,jobPointCost:1,classId:'novice',kind:'heal',power:.12,source:'rAthena'},
  {id:'bash',aegisId:5,aegisName:'SM_BASH',name:'Bash',icon:'💥',description:'Golpe físico poderoso. SP inicial do rAthena: 8.',maxLevel:10,spCost:8,cooldown:2,jobPointCost:1,classId:'swordsman',kind:'damage',power:1.65,source:'rAthena'},
  {id:'provoke',aegisId:6,aegisName:'SM_PROVOKE',name:'Provoke',icon:'❗',description:'Provoca o alvo; adaptado como buff ofensivo no modo idle.',maxLevel:10,spCost:4,cooldown:8,jobPointCost:1,classId:'swordsman',kind:'buff',power:1.15,requires:{skillId:'bash',level:3},source:'rAthena'},
  {id:'magnumBreak',aegisId:7,aegisName:'SM_MAGNUM',name:'Magnum Break',icon:'🔥',description:'Ataque em área de elemento Fire. Custo original: 30 SP.',maxLevel:10,spCost:30,cooldown:2,jobPointCost:1,classId:'swordsman',kind:'damage',power:2.05,element:'Fire',requires:{skillId:'bash',level:5},source:'rAthena'},
  {id:'fireBolt',aegisId:19,aegisName:'MG_FIREBOLT',name:'Fire Bolt',icon:'🔥',description:'Bolt mágico de elemento Fire.',maxLevel:10,spCost:12,cooldown:3,jobPointCost:1,classId:'mage',kind:'damage',power:1.75,element:'Fire',source:'rAthena'},
  {id:'coldBolt',aegisId:14,aegisName:'MG_COLDBOLT',name:'Cold Bolt',icon:'❄',description:'Bolt mágico de elemento Water.',maxLevel:10,spCost:12,cooldown:3,jobPointCost:1,classId:'mage',kind:'damage',power:1.72,element:'Water',source:'rAthena'},
  {id:'soulStrike',aegisId:13,aegisName:'MG_SOULSTRIKE',name:'Soul Strike',icon:'✹',description:'Ataque mágico Ghost de múltiplos hits.',maxLevel:10,spCost:18,cooldown:2,jobPointCost:1,classId:'mage',kind:'damage',power:2.1,element:'Ghost',requires:{skillId:'fireBolt',level:3},source:'rAthena'},
  {id:'owlEye',aegisId:43,aegisName:'AC_OWL',name:"Owl's Eye",icon:'◉',description:'Skill passiva de precisão do Archer.',maxLevel:10,spCost:0,cooldown:0,jobPointCost:1,classId:'archer',kind:'passive',power:1.02,source:'rAthena'},
  {id:'doubleStrafe',aegisId:46,aegisName:'AC_DOUBLE',name:'Double Strafe',icon:'➹',description:'Dois disparos rápidos. Custo original: 12 SP.',maxLevel:10,spCost:12,cooldown:2,jobPointCost:1,classId:'archer',kind:'damage',power:1.8,requires:{skillId:'owlEye',level:3},source:'rAthena'},
  {id:'arrowShower',aegisId:47,aegisName:'AC_SHOWER',name:'Arrow Shower',icon:'☄',description:'Ataque em área com flechas. Custo original: 15 SP.',maxLevel:10,spCost:15,cooldown:3,jobPointCost:1,classId:'archer',kind:'damage',power:2,requires:{skillId:'doubleStrafe',level:5},source:'rAthena'},
  {id:'heal',aegisId:28,aegisName:'AL_HEAL',name:'Heal',icon:'✚',description:'Cura sagrada. Custo inicial original: 13 SP.',maxLevel:10,spCost:13,cooldown:2,jobPointCost:1,classId:'acolyte',kind:'heal',power:.25,source:'rAthena'},
  {id:'blessing',aegisId:34,aegisName:'AL_BLESSING',name:'Blessing',icon:'✧',description:'Bênção de suporte. Custo inicial original: 28 SP.',maxLevel:10,spCost:28,cooldown:8,jobPointCost:1,classId:'acolyte',kind:'buff',power:1.18,requires:{skillId:'heal',level:3},source:'rAthena'},
  {id:'holyLight',aegisId:156,aegisName:'AL_HOLYLIGHT',name:'Holy Light',icon:'☀',description:'Skill Holy de quest. Custo original: 15 SP.',maxLevel:1,spCost:15,cooldown:2,jobPointCost:1,classId:'acolyte',kind:'damage',power:1.95,element:'Holy',requires:{skillId:'heal',level:5},source:'rAthena'},
  {id:'doubleAttack',aegisId:48,aegisName:'TF_DOUBLE',name:'Double Attack',icon:'☽',description:'Skill passiva que aumenta o dano médio com golpes duplos.',maxLevel:10,spCost:0,cooldown:0,jobPointCost:1,classId:'thief',kind:'passive',power:1.025,source:'rAthena'},
  {id:'improveDodge',aegisId:49,aegisName:'TF_MISS',name:'Improve Dodge',icon:'➤',description:'Skill passiva de esquiva do Thief.',maxLevel:10,spCost:0,cooldown:0,jobPointCost:1,classId:'thief',kind:'passive',power:1.01,source:'rAthena'},
  {id:'envenom',aegisId:52,aegisName:'TF_POISON',name:'Envenom',icon:'☠',description:'Ataque Poison. Custo original: 12 SP.',maxLevel:10,spCost:12,cooldown:3,jobPointCost:1,classId:'thief',kind:'damage',power:2,element:'Poison',requires:{skillId:'doubleAttack',level:5},source:'rAthena'},
]

export const startingInventory:Record<string,number>={apple:3,noviceSword:1,adventurerArmor:1}
