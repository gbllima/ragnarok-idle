import { useState } from 'react'
import { itemAssets } from '../game/assets'
import { items } from '../game/data'

export function ItemIcon({ id }: { id: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  const src = itemAssets[id]?.src
  if (!src || failed === src) return <span className="ro-item-icon" aria-hidden="true">{items[id]?.icon ?? '◆'}</span>
  return <img className="ro-item-icon" src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
}
