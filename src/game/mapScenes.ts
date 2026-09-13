import type { MapDef } from './starterData'
import { mapAsset } from './assets'

export type MapScene={
  code:string
  primary:string
  fallback:string
  ground:string
  path:string
}

// Starter hunts mapped to real Renewal field maps where the same monster actually spawns in rAthena.
// Existing local previews are preferred. Missing previews use the same Divine Pride endpoint already
// used by tools/sync-ro-assets.mjs, with the biome preview kept underneath as a fallback layer.
const starterMapCodes:Record<string,string>={
  'prontera-field':'prt_fild08',
  'south-prontera':'pay_fild04',
  'lunatic-meadow':'prt_fild01',
  'pupa-grove':'pay_fild03',
  'chonchon-road':'gef_fild00',
  'geffen-plains':'gef_fild00',
  'payon-forest':'pay_fild01',
  'mandragora-field':'gef_fild04',
  'rocker-hill':'prt_fild07',
  'spore-woods':'pay_fild08',
  'creamy-garden':'gef_fild05',
  'muka-desert':'moc_fild01',
  'peco-savanna':'moc_fild01',
  'smokie-woods':'gef_fild05',
  'poporing-marsh':'prt_fild03',
  'elder-grove':'prt_fild10',
  'yoyo-jungle':'prt_fild03',
  'wolf-den':'moc_fild03',
  'steel-canyon':'moc_fild13',
  'golem-quarry':'cmd_fild06',
  'sandman-dunes':'moc_fild16',
  'hode-cavern':'moc_fild17',
  'argiope-nest':'mjolnir_05',
}

const localPreviews=new Set(['prt_fild08','gef_fild00','pay_fild01','moc_fild01','prt_fild03'])

const remotePreview=(code:string)=>`https://www.divine-pride.net/img/map/original/${code}`

export function mapScene(map:MapDef):MapScene{
  const base=mapAsset(map.bg)
  const code=starterMapCodes[map.id]??base.map
  const primary=localPreviews.has(code)?`/ro/maps/${code}.png`:remotePreview(code)
  return {code,primary,fallback:base.preview,ground:base.ground,path:base.path}
}
