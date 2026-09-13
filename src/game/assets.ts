import catalog from './ro-assets.json'
import rawSpriteStatus from './full-sprite-status.json?raw'
import { items, maps } from './data'

export type AnimationState = 'idle' | 'walk' | 'attack' | 'hit' | 'death'
type Sprite = { src: string; animations: Record<AnimationState, string[]> }
type MonsterSprite = Sprite & { id: number; width: number; height: number; label?:string }
type MapAsset = { map: string; preview: string; ground: string; path: string }

export const monsterAssets: Record<string, MonsterSprite> = catalog.monsters
export const playerAssets: Record<string, Sprite> = catalog.players
export const itemAssets: Record<string, { id: number; src: string }> = catalog.items
export const mapAssets: Record<string, MapAsset> = catalog.maps
export const spriteDirection = (dir: number) => ((Math.round(dir) % 8) + 8) % 8
export const playerPortrait = (classId: string) => (playerAssets[classId] ?? playerAssets.novice).src
export const mapAsset = (biome: string) => mapAssets[biome] ?? mapAssets.meadow

export const fullSpriteStatus=JSON.parse(rawSpriteStatus) as {items:Record<string,[number,number]|null>;monsters:Record<string,[number,number]|null>}
export const hasFullSprite=(kind:'items'|'monsters',id:number|string)=>!!fullSpriteStatus[kind]?.[String(id)]

// The full sprite download is intentionally resumable. Do not hide an asset just because
// the status index has not been regenerated yet: point at its deterministic local path and
// let the image components fall back gracefully when a particular PNG is still missing.
for(const item of Object.values(items)){
  if(!item.aegisId||itemAssets[item.id])continue
  itemAssets[item.id]={id:item.aegisId,src:item.sprite??`/ro/full/items/${item.aegisId}.png`}
}

for(const map of maps){
  if(!map.imported)continue
  const size=fullSpriteStatus.monsters[String(map.monsterId)]
  const src=map.sprite??`/ro/full/monsters/${map.monsterId}.png`
  const animations=Object.fromEntries((['idle','walk','attack','hit','death'] as const).map(state=>[
    state,
    Array.from({length:8},(_,dir)=>size?`/ro/monster-actions/${map.monsterId}/${state}-${dir}.png`:src),
  ])) as Record<AnimationState,string[]>
  monsterAssets[map.spriteKey!]={
    id:map.monsterId,
    label:map.monster,
    src,
    width:size?.[0]||64,
    height:size?.[1]||72,
    animations,
  }
}
