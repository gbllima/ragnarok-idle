import type { ClassDef, ItemDef, MapDef, SkillDef } from './starterData'

export type JobTier='novice'|'first'|'second'|'trans'|'third'
export type JobMeta={parent?:string;tier:JobTier;root:string;minBase:number;minJob:number;rebirths?:number;rathena:string}

export const advancedClasses:ClassDef[]=[
  {id:'merchant',name:'Merchant',icon:'💰',description:'Comércio, força e utilidade.',minBase:10,minJob:10,bonuses:{str:2,vit:2,luk:2}},
  {id:'knight',name:'Knight',icon:'🐎',description:'Evolução do Swordsman focada em dano físico e resistência.',minBase:40,minJob:40,bonuses:{str:6,vit:5,agi:2}},
  {id:'crusader',name:'Crusader',icon:'🛡',description:'Defesa, Holy e proteção.',minBase:40,minJob:40,bonuses:{vit:6,str:3,int:2}},
  {id:'wizard',name:'Wizard',icon:'🔮',description:'Magias elementais de alto dano.',minBase:40,minJob:40,bonuses:{int:7,dex:4}},
  {id:'sage',name:'Sage',icon:'📘',description:'Controle elemental e magia híbrida.',minBase:40,minJob:40,bonuses:{int:5,dex:4,agi:2}},
  {id:'hunter',name:'Hunter',icon:'🏹',description:'Dano à distância, falcão e precisão.',minBase:40,minJob:40,bonuses:{dex:7,agi:5,luk:2}},
  {id:'bard',name:'Bard',icon:'🎵',description:'Suporte musical masculino e dano à distância.',minBase:40,minJob:40,bonuses:{dex:5,agi:3,int:2}},
  {id:'dancer',name:'Dancer',icon:'💃',description:'Suporte musical feminino e dano à distância.',minBase:40,minJob:40,bonuses:{dex:5,agi:3,int:2}},
  {id:'priest',name:'Priest',icon:'✝',description:'Cura, buffs e dano Holy.',minBase:40,minJob:40,bonuses:{int:6,vit:4,dex:3}},
  {id:'monk',name:'Monk',icon:'👊',description:'Combate espiritual e golpes explosivos.',minBase:40,minJob:40,bonuses:{str:5,agi:3,int:2}},
  {id:'assassin',name:'Assassin',icon:'🗡',description:'Críticos, veneno e alta velocidade.',minBase:40,minJob:40,bonuses:{agi:7,luk:4,str:3}},
  {id:'rogue',name:'Rogue',icon:'🎭',description:'Ataques oportunistas e utilidade.',minBase:40,minJob:40,bonuses:{agi:5,dex:4,str:2}},
  {id:'blacksmith',name:'Blacksmith',icon:'🔨',description:'Forja e dano físico com armas.',minBase:40,minJob:40,bonuses:{str:6,dex:4,vit:2}},
  {id:'alchemist',name:'Alchemist',icon:'⚗',description:'Poções e combate químico.',minBase:40,minJob:40,bonuses:{int:4,dex:4,vit:3}},
  {id:'lordKnight',name:'Lord Knight',icon:'🐉',description:'Classe transcendente do Knight.',minBase:70,minJob:50,bonuses:{str:9,vit:7,agi:4}},
  {id:'paladin',name:'Paladin',icon:'🛡',description:'Classe transcendente do Crusader.',minBase:70,minJob:50,bonuses:{vit:9,str:5,int:4}},
  {id:'highWizard',name:'High Wizard',icon:'✨',description:'Classe transcendente do Wizard.',minBase:70,minJob:50,bonuses:{int:10,dex:6}},
  {id:'professor',name:'Professor',icon:'📚',description:'Classe transcendente do Sage.',minBase:70,minJob:50,bonuses:{int:8,dex:6,agi:3}},
  {id:'sniper',name:'Sniper',icon:'🎯',description:'Classe transcendente do Hunter.',minBase:70,minJob:50,bonuses:{dex:10,agi:7,luk:3}},
  {id:'clown',name:'Minstrel Trans',icon:'🎶',description:'Classe transcendente do Bard.',minBase:70,minJob:50,bonuses:{dex:8,agi:5,int:4}},
  {id:'gypsy',name:'Gypsy',icon:'🎼',description:'Classe transcendente do Dancer.',minBase:70,minJob:50,bonuses:{dex:8,agi:5,int:4}},
  {id:'highPriest',name:'High Priest',icon:'☀',description:'Classe transcendente do Priest.',minBase:70,minJob:50,bonuses:{int:9,vit:6,dex:5}},
  {id:'champion',name:'Champion',icon:'🥋',description:'Classe transcendente do Monk.',minBase:70,minJob:50,bonuses:{str:8,agi:5,int:4}},
  {id:'assassinCross',name:'Assassin Cross',icon:'☠',description:'Classe transcendente do Assassin.',minBase:70,minJob:50,bonuses:{agi:10,luk:6,str:5}},
  {id:'stalker',name:'Stalker',icon:'🕶',description:'Classe transcendente do Rogue.',minBase:70,minJob:50,bonuses:{agi:8,dex:6,str:4}},
  {id:'whitesmith',name:'Whitesmith',icon:'⚒',description:'Classe transcendente do Blacksmith.',minBase:70,minJob:50,bonuses:{str:9,dex:6,vit:4}},
  {id:'creator',name:'Creator',icon:'🧪',description:'Classe transcendente do Alchemist.',minBase:70,minJob:50,bonuses:{int:7,dex:7,vit:5}},
  {id:'runeKnight',name:'Rune Knight',icon:'🐲',description:'Terceira classe da linha Knight.',minBase:99,minJob:50,bonuses:{str:12,vit:10,agi:6}},
  {id:'royalGuard',name:'Royal Guard',icon:'🏰',description:'Terceira classe da linha Crusader.',minBase:99,minJob:50,bonuses:{vit:12,str:7,int:5}},
  {id:'warlock',name:'Warlock',icon:'🌌',description:'Terceira classe da linha Wizard.',minBase:99,minJob:50,bonuses:{int:13,dex:8}},
  {id:'sorcerer',name:'Sorcerer',icon:'🌀',description:'Terceira classe da linha Sage.',minBase:99,minJob:50,bonuses:{int:11,dex:7,agi:5}},
  {id:'ranger',name:'Ranger',icon:'🦅',description:'Terceira classe da linha Hunter.',minBase:99,minJob:50,bonuses:{dex:13,agi:9,luk:5}},
  {id:'minstrel',name:'Minstrel',icon:'🎻',description:'Terceira classe da linha Bard.',minBase:99,minJob:50,bonuses:{dex:10,agi:7,int:6}},
  {id:'wanderer',name:'Wanderer',icon:'🎤',description:'Terceira classe da linha Dancer.',minBase:99,minJob:50,bonuses:{dex:10,agi:7,int:6}},
  {id:'archBishop',name:'Arch Bishop',icon:'⛪',description:'Terceira classe da linha Priest.',minBase:99,minJob:50,bonuses:{int:12,vit:8,dex:7}},
  {id:'sura',name:'Sura',icon:'🧘',description:'Terceira classe da linha Monk.',minBase:99,minJob:50,bonuses:{str:11,agi:7,int:6}},
  {id:'guillotineCross',name:'Guillotine Cross',icon:'🦂',description:'Terceira classe da linha Assassin.',minBase:99,minJob:50,bonuses:{agi:13,luk:8,str:7}},
  {id:'shadowChaser',name:'Shadow Chaser',icon:'🎩',description:'Terceira classe da linha Rogue.',minBase:99,minJob:50,bonuses:{agi:11,dex:8,str:5}},
  {id:'mechanic',name:'Mechanic',icon:'⚙',description:'Terceira classe da linha Blacksmith.',minBase:99,minJob:50,bonuses:{str:12,dex:8,vit:6}},
  {id:'genetic',name:'Genetic',icon:'🧬',description:'Terceira classe da linha Alchemist.',minBase:99,minJob:50,bonuses:{int:10,dex:9,vit:7}},
]

export const jobMeta:Record<string,JobMeta>={
  novice:{tier:'novice',root:'novice',minBase:1,minJob:1,rathena:'Novice'},
  swordsman:{parent:'novice',tier:'first',root:'swordsman',minBase:10,minJob:10,rathena:'Swordman'}, mage:{parent:'novice',tier:'first',root:'mage',minBase:10,minJob:10,rathena:'Mage'}, archer:{parent:'novice',tier:'first',root:'archer',minBase:10,minJob:10,rathena:'Archer'}, acolyte:{parent:'novice',tier:'first',root:'acolyte',minBase:10,minJob:10,rathena:'Acolyte'}, thief:{parent:'novice',tier:'first',root:'thief',minBase:10,minJob:10,rathena:'Thief'}, merchant:{parent:'novice',tier:'first',root:'merchant',minBase:10,minJob:10,rathena:'Merchant'},
  knight:{parent:'swordsman',tier:'second',root:'swordsman',minBase:40,minJob:40,rathena:'Knight'},crusader:{parent:'swordsman',tier:'second',root:'swordsman',minBase:40,minJob:40,rathena:'Crusader'},wizard:{parent:'mage',tier:'second',root:'mage',minBase:40,minJob:40,rathena:'Wizard'},sage:{parent:'mage',tier:'second',root:'mage',minBase:40,minJob:40,rathena:'Sage'},hunter:{parent:'archer',tier:'second',root:'archer',minBase:40,minJob:40,rathena:'Hunter'},bard:{parent:'archer',tier:'second',root:'archer',minBase:40,minJob:40,rathena:'Bard'},dancer:{parent:'archer',tier:'second',root:'archer',minBase:40,minJob:40,rathena:'Dancer'},priest:{parent:'acolyte',tier:'second',root:'acolyte',minBase:40,minJob:40,rathena:'Priest'},monk:{parent:'acolyte',tier:'second',root:'acolyte',minBase:40,minJob:40,rathena:'Monk'},assassin:{parent:'thief',tier:'second',root:'thief',minBase:40,minJob:40,rathena:'Assassin'},rogue:{parent:'thief',tier:'second',root:'thief',minBase:40,minJob:40,rathena:'Rogue'},blacksmith:{parent:'merchant',tier:'second',root:'merchant',minBase:40,minJob:40,rathena:'Blacksmith'},alchemist:{parent:'merchant',tier:'second',root:'merchant',minBase:40,minJob:40,rathena:'Alchemist'},
  lordKnight:{parent:'knight',tier:'trans',root:'swordsman',minBase:70,minJob:50,rebirths:1,rathena:'Lord_Knight'},paladin:{parent:'crusader',tier:'trans',root:'swordsman',minBase:70,minJob:50,rebirths:1,rathena:'Paladin'},highWizard:{parent:'wizard',tier:'trans',root:'mage',minBase:70,minJob:50,rebirths:1,rathena:'High_Wizard'},professor:{parent:'sage',tier:'trans',root:'mage',minBase:70,minJob:50,rebirths:1,rathena:'Professor'},sniper:{parent:'hunter',tier:'trans',root:'archer',minBase:70,minJob:50,rebirths:1,rathena:'Sniper'},clown:{parent:'bard',tier:'trans',root:'archer',minBase:70,minJob:50,rebirths:1,rathena:'Clown'},gypsy:{parent:'dancer',tier:'trans',root:'archer',minBase:70,minJob:50,rebirths:1,rathena:'Gypsy'},highPriest:{parent:'priest',tier:'trans',root:'acolyte',minBase:70,minJob:50,rebirths:1,rathena:'High_Priest'},champion:{parent:'monk',tier:'trans',root:'acolyte',minBase:70,minJob:50,rebirths:1,rathena:'Champion'},assassinCross:{parent:'assassin',tier:'trans',root:'thief',minBase:70,minJob:50,rebirths:1,rathena:'Assassin_Cross'},stalker:{parent:'rogue',tier:'trans',root:'thief',minBase:70,minJob:50,rebirths:1,rathena:'Stalker'},whitesmith:{parent:'blacksmith',tier:'trans',root:'merchant',minBase:70,minJob:50,rebirths:1,rathena:'Whitesmith'},creator:{parent:'alchemist',tier:'trans',root:'merchant',minBase:70,minJob:50,rebirths:1,rathena:'Creator'},
  runeKnight:{parent:'lordKnight',tier:'third',root:'swordsman',minBase:99,minJob:50,rebirths:1,rathena:'Rune_Knight'},royalGuard:{parent:'paladin',tier:'third',root:'swordsman',minBase:99,minJob:50,rebirths:1,rathena:'Royal_Guard'},warlock:{parent:'highWizard',tier:'third',root:'mage',minBase:99,minJob:50,rebirths:1,rathena:'Warlock'},sorcerer:{parent:'professor',tier:'third',root:'mage',minBase:99,minJob:50,rebirths:1,rathena:'Sorcerer'},ranger:{parent:'sniper',tier:'third',root:'archer',minBase:99,minJob:50,rebirths:1,rathena:'Ranger'},minstrel:{parent:'clown',tier:'third',root:'archer',minBase:99,minJob:50,rebirths:1,rathena:'Minstrel'},wanderer:{parent:'gypsy',tier:'third',root:'archer',minBase:99,minJob:50,rebirths:1,rathena:'Wanderer'},archBishop:{parent:'highPriest',tier:'third',root:'acolyte',minBase:99,minJob:50,rebirths:1,rathena:'Arch_Bishop'},sura:{parent:'champion',tier:'third',root:'acolyte',minBase:99,minJob:50,rebirths:1,rathena:'Sura'},guillotineCross:{parent:'assassinCross',tier:'third',root:'thief',minBase:99,minJob:50,rebirths:1,rathena:'Guillotine_Cross'},shadowChaser:{parent:'stalker',tier:'third',root:'thief',minBase:99,minJob:50,rebirths:1,rathena:'Shadow_Chaser'},mechanic:{parent:'whitesmith',tier:'third',root:'merchant',minBase:99,minJob:50,rebirths:1,rathena:'Mechanic'},genetic:{parent:'creator',tier:'third',root:'merchant',minBase:99,minJob:50,rebirths:1,rathena:'Genetic'},
}

const skill=(id:string,name:string,classId:string,kind:SkillDef['kind'],power:number,icon:string,element?:string):SkillDef=>({id,name,classId,kind,power,icon,element,maxLevel:10,spCost:kind==='passive'?0:kind==='buff'?18:kind==='heal'?24:20,cooldown:kind==='passive'?0:kind==='buff'?10:3,jobPointCost:1,description:`${name} adaptada do Ragnarok para combate idle.`,source:'rAthena'})
export const advancedSkills:SkillDef[]=[
  skill('mammonite','Mammonite','merchant','damage',2.2,'💰'),skill('overcharge','Overcharge','merchant','passive',1.025,'🪙'),
  skill('bowlingBash','Bowling Bash','knight','damage',2.8,'⚔'),skill('twoHandQuicken','Two-Hand Quicken','knight','buff',1.28,'💨'),
  skill('holyCross','Holy Cross','crusader','damage',2.5,'✝','Holy'),skill('guard','Guard','crusader','buff',1.20,'🛡'),
  skill('stormGust','Storm Gust','wizard','damage',3.0,'❄','Water'),skill('meteorStorm','Meteor Storm','wizard','damage',3.2,'☄','Fire'),
  skill('heavenDrive','Heaven Drive','sage','damage',2.7,'🪨','Earth'),skill('endow','Elemental Endow','sage','buff',1.24,'🌀'),
  skill('blitzBeat','Blitz Beat','hunter','damage',2.6,'🦅','Neutral'),skill('attentionConcentrate','Attention Concentrate','hunter','buff',1.25,'🎯'),
  skill('musicalStrike','Musical Strike','bard','damage',2.3,'🎵'),skill('dissonance','Dissonance','bard','buff',1.20,'🎶'),
  skill('throwArrow','Throw Arrow','dancer','damage',2.3,'💃'),skill('serviceForYou','Service For You','dancer','buff',1.20,'🎼'),
  skill('heal','Heal','priest','heal',.35,'✚','Holy'),skill('holyLight','Holy Light','priest','damage',2.5,'☀','Holy'),
  skill('occultImpaction','Occult Impaction','monk','damage',2.8,'👊'),skill('fury','Fury','monk','buff',1.30,'🔥'),
  skill('sonicBlow','Sonic Blow','assassin','damage',3.0,'🗡'),skill('enchantPoison','Enchant Poison','assassin','buff',1.25,'☠','Poison'),
  skill('backStab','Back Stab','rogue','damage',2.7,'🎭'),skill('swordMastery','Sword Mastery','rogue','passive',1.025,'⚔'),
  skill('cartRevolution','Cart Revolution','blacksmith','damage',2.8,'🛒'),skill('powerThrust','Power Thrust','blacksmith','buff',1.30,'🔨'),
  skill('acidTerror','Acid Terror','alchemist','damage',2.8,'⚗','Poison'),skill('potionPitcher','Potion Pitcher','alchemist','heal',.30,'🧪'),
  skill('spiralPierce','Spiral Pierce','lordKnight','damage',3.4,'🐉'),skill('sacrifice','Sacrifice','paladin','damage',3.3,'🩸','Holy'),
  skill('napalmVulcan','Napalm Vulcan','highWizard','damage',3.5,'✨','Ghost'),skill('doubleCasting','Double Casting','professor','buff',1.36,'📚'),
  skill('sharpShooting','Sharp Shooting','sniper','damage',3.4,'🎯'),skill('arrowVulcan','Arrow Vulcan','clown','damage',3.3,'🎶'),skill('arrowVulcanGypsy','Arrow Vulcan','gypsy','damage',3.3,'🎼'),
  skill('assumptio','Assumptio','highPriest','buff',1.34,'☀'),skill('asuraStrike','Asura Strike','champion','damage',4.2,'💥'),
  skill('soulDestroyer','Soul Destroyer','assassinCross','damage',3.6,'☠'),skill('fullStrip','Full Strip','stalker','buff',1.30,'🎩'),
  skill('cartTermination','Cart Termination','whitesmith','damage',3.6,'⚒'),skill('acidBomb','Acid Demonstration','creator','damage',3.8,'🧪','Neutral'),
  skill('ignitionBreak','Ignition Break','runeKnight','damage',4.0,'🔥','Fire'),skill('overbrand','Overbrand','royalGuard','damage',3.9,'🏰'),
  skill('crimsonRock','Crimson Rock','warlock','damage',4.1,'🌋','Fire'),skill('psychicWave','Psychic Wave','sorcerer','damage',4.0,'🌀','Ghost'),
  skill('arrowStorm','Arrow Storm','ranger','damage',4.0,'🏹'),skill('severeRainstorm','Severe Rainstorm','minstrel','damage',3.9,'🎻','Water'),skill('severeRainstormW','Severe Rainstorm','wanderer','damage',3.9,'🎤','Water'),
  skill('adoramus','Adoramus','archBishop','damage',4.0,'⛪','Holy'),skill('tigerCannon','Tiger Cannon','sura','damage',4.1,'🐯'),
  skill('crossRipper','Cross Ripper Slasher','guillotineCross','damage',4.2,'🦂'),skill('triangleShot','Triangle Shot','shadowChaser','damage',3.8,'🎩'),
  skill('axeTornado','Axe Tornado','mechanic','damage',4.0,'⚙','Wind'),skill('cartCannon','Cart Cannon','genetic','damage',4.0,'🧬'),
]

export const hubDefs=[
  {id:'prontera',name:'Prontera',biomes:['meadow','plains'],min:1,max:35},
  {id:'payon',name:'Payon',biomes:['forest'],min:15,max:65},
  {id:'morroc',name:'Morroc',biomes:['desert'],min:25,max:90},
  {id:'geffen',name:'Geffen',biomes:['swamp','meadow'],min:45,max:120},
  {id:'aldebaran',name:'Al De Baran',biomes:['plains','forest'],min:70,max:150},
  {id:'endgame',name:'Campos Avançados',biomes:['meadow','forest','plains','desert','swamp'],min:100,max:999},
]

export function jobOptions(classId:string,baseLevel:number,jobLevel:number,rebirths:number){
  return advancedClasses.filter(cls=>{const meta=jobMeta[cls.id];return meta?.parent===classId&&baseLevel>=meta.minBase&&jobLevel>=meta.minJob&&rebirths>=(meta.rebirths||0)})
}
export function jobRoot(classId:string){return jobMeta[classId]?.root||classId}
export function rathenaJobNames(classId:string){
  const names=new Set<string>(['All'])
  let id:string|undefined=classId
  while(id){const meta=jobMeta[id];if(!meta)break;names.add(meta.rathena);id=meta.parent}
  return names
}

const elementTable:Record<string,Partial<Record<string,number>>>={
  Fire:{Earth:1.5,Undead:1.25,Water:.5,Fire:.25},Water:{Fire:1.5,Earth:.5,Water:.25,Wind:.75},Wind:{Water:1.5,Earth:.75,Wind:.25},Earth:{Wind:1.5,Fire:.75,Earth:.25},Holy:{Dark:1.5,Undead:1.5,Holy:.25},Dark:{Holy:1.5,Dark:.25,Undead:.5},Ghost:{Ghost:1.25,Neutral:.75},Poison:{Plant:1.25,Poison:.25,Undead:.5},Neutral:{Ghost:.25}}
export function elementMultiplier(attackElement:string|undefined,target:string){
  const atk=(attackElement||'Neutral').split(' ')[0]
  const def=target.split(' ')[0]
  return elementTable[atk]?.[def]??1
}

export function huntHub(map:MapDef){
  const level=map.monsterLevel||map.minLevel
  return hubDefs.find(h=>level>=h.min&&level<=h.max&&h.biomes.includes(map.bg))?.id ?? (level>=100?'endgame':'prontera')
}
export function huntScore(map:MapDef,baseLevel:number,attack:number,defense:number){
  if(baseLevel<map.minLevel)return -Infinity
  const levelDelta=Math.abs(map.monsterLevel-baseLevel)
  const survivability=Math.max(0,100-(Math.max(0,map.monsterAtk-defense/5))*6)
  const speed=Math.min(100,(attack/Math.max(1,map.monsterHp))*900)
  const reward=Math.log10(10+map.exp+map.jobExp)*25
  return reward+survivability+speed-levelDelta*3-(map.boss?18:0)
}
export function recommendedHunts(maps:MapDef[],baseLevel:number,attack:number,defense:number,limit=12){return maps.filter(m=>baseLevel>=m.minLevel&&m.monsterLevel>=Math.max(1,baseLevel-20)&&m.monsterLevel<=baseLevel+8).sort((a,b)=>huntScore(b,baseLevel,attack,defense)-huntScore(a,baseLevel,attack,defense)).slice(0,limit)}

export function levelRewardMultiplier(playerLevel:number,monsterLevel:number){const d=monsterLevel-playerLevel;if(d>=0)return Math.min(1.35,1+d*.015);return Math.max(.15,1+Math.max(-60,d)*.025)}
export function mvpRespawnMs(map:MapDef){return map.boss?15000:850}
export function mvpRewardMultiplier(map:MapDef){return map.boss?2.5:1}

export function refineChance(item:ItemDef,current:number){
  const weaponLevel=item.weaponLevel||1
  const safe=weaponLevel<=1?7:weaponLevel===2?6:weaponLevel===3?5:4
  if(current<safe)return 1
  return Math.max(.15,.9-(current-safe)*.12)
}
export function refineCost(item:ItemDef,current:number){return Math.round(500+(item.equipLevel||1)*75+(current+1)**2*450+(item.weaponLevel||1)*350)}
export function refineMaterial(item:ItemDef){return (item.weaponLevel||0)>=3?'eluniumStone':'ironOre'}
export function refineBonus(item:ItemDef,level:number){return item.slot==='weapon'?{attack:Math.round(level*(3+(item.weaponLevel||1)*2)),defense:0}:{attack:0,defense:Math.round(level*(1+Math.max(1,(item.equipLevel||1)/40)))} }
