import { useEffect, useMemo, useState } from 'react'
import { itemAssets } from '../game/assets'
import { items } from '../game/data'

export function ItemIcon({ id }: { id: string }) {
  const item=items[id]
  const local=itemAssets[id]?.src
  const candidates=useMemo(()=>{
    const list:string[]=[]
    if(local)list.push(local)
    if(item?.aegisId){
      list.push(`https://assets.latam-tools.com.br/icons/item/${item.aegisId}.png`)
      list.push(`https://static.divine-pride.net/images/items/item/${item.aegisId}.png`)
    }
    return [...new Set(list)]
  },[local,item?.aegisId])
  const [attempt,setAttempt]=useState(0)
  useEffect(()=>setAttempt(0),[id,local])
  const src=candidates[attempt]
  if(!src)return <span className="ro-item-icon" aria-hidden="true">{item?.icon??'◆'}</span>
  return <img className="ro-item-icon" src={src} alt="" loading="lazy" onError={()=>setAttempt(n=>n+1)}/>
}
