import type { ItemDef } from './starterData'
import { jobMeta } from './progression'

export function classLineage(classId:string){
  const lineage:string[]=[]
  let id:string|undefined=classId
  while(id&&!lineage.includes(id)){
    lineage.push(id)
    id=jobMeta[id]?.parent
  }
  if(!lineage.includes('novice'))lineage.push('novice')
  return lineage
}

export function canUseClassSkill(classId:string,skillClassId:string){
  return skillClassId==='novice'||classLineage(classId).includes(skillClassId)
}

export function marketUnlockLevel(item:ItemDef){
  if(item.type==='equipment'){
    const base=item.equipLevel||1
    const weapon=(item.weaponLevel||0)*4
    const rarity=item.rarity==='epic'?20:item.rarity==='rare'?10:item.rarity==='uncommon'?4:0
    return Math.max(base,Math.min(175,base+weapon+rarity))
  }
  if(item.type==='card')return item.rarity==='rare'?30:15
  if(item.category==='Cash'||item.category==='PetEgg')return 40
  return 1
}

export function marketReason(item:ItemDef,baseLevel:number){
  const level=marketUnlockLevel(item)
  if(baseLevel<level)return `Mercado libera no Base Lv. ${level}.`
  return ''
}

export function isMagicClass(classId:string){
  const root=jobMeta[classId]?.root||classId
  return root==='mage'||root==='acolyte'
}
