import catalog from './ro-assets.json'

export type AnimationState = 'idle' | 'walk' | 'attack' | 'hit' | 'death'
type Sprite = { src: string; animations: Record<AnimationState, string[]> }
type MonsterSprite = Sprite & { id: number; width: number; height: number }
type MapAsset = { map: string; preview: string; ground: string; path: string }

export const monsterAssets: Record<string, MonsterSprite> = catalog.monsters
export const playerAssets: Record<string, Sprite> = catalog.players
export const itemAssets: Record<string, { id: number; src: string }> = catalog.items
export const mapAssets: Record<string, MapAsset> = catalog.maps
export const spriteDirection = (dir: number) => ((Math.round(dir) % 8) + 8) % 8
export const playerPortrait = (classId: string) => (playerAssets[classId] ?? playerAssets.novice).src
export const mapAsset = (biome: string) => mapAssets[biome] ?? mapAssets.meadow
