import starterAssets from './ro-assets.json'
import { items as starterItems, maps as starterMaps, shopItems as starterShopItems, classes as starterClasses, skills as starterSkills } from './starterData'
import { expandCatalog, type FullDatabase } from './catalog'
import { advancedClasses, advancedSkills } from './progression'
export * from './starterData'
export * from './progression'

const response=await fetch('/ro/full/database.json')
if(!response.ok)throw new Error('Não foi possível carregar o catálogo de Ragnarok. Recarregue a página.')
const database=await response.json() as FullDatabase
export const databaseMetadata=database.metadata
export const {items,catalogItems,maps,monsterCatalog}=expandCatalog(database,starterItems,starterMaps,starterAssets.items)
export const shopItems=starterShopItems
export const classes=[...starterClasses,...advancedClasses]
export const skills=[...starterSkills,...advancedSkills]
