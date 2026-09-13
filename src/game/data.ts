import starterAssets from './ro-assets.json'
import { items as starterItems, maps as starterMaps, shopItems as starterShopItems } from './starterData'
import { expandCatalog, type FullDatabase } from './catalog'
export * from './starterData'

const response=await fetch('/ro/full/database.json')
if(!response.ok)throw new Error('Não foi possível carregar o catálogo de Ragnarok. Recarregue a página.')
const database=await response.json() as FullDatabase
export const databaseMetadata=database.metadata
export const {items,catalogItems,maps,monsterCatalog}=expandCatalog(database,starterItems,starterMaps,starterAssets.items)
export const shopItems=starterShopItems
