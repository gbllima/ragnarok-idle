import { useEffect, useState } from 'react'
import { Backpack, Castle, Home, MapPin, Shield, ShoppingBag, Swords } from 'lucide-react'

const HUNT_ACTION=/Caçar aqui|Caçada atual|Melhor caçada agora|MVP recomendado/i

function clickMenu(title:string){
  const button=document.querySelector<HTMLButtonElement>(`.side-menu button[title="${title}"]`)
  button?.click()
}

function stopHunt(){
  const button=document.querySelector<HTMLButtonElement>('.stop-btn')
  if(button&&!button.classList.contains('paused'))button.click()
}

function startHunt(){
  const button=document.querySelector<HTMLButtonElement>('.stop-btn')
  if(button&&button.classList.contains('paused'))button.click()
}

export function PronteraSafeZone(){
  // This state is intentionally session-only: every fresh entry/reload starts in Prontera.
  const [active,setActive]=useState(true)
  const [portrait,setPortrait]=useState('')

  useEffect(()=>{
    const shell=document.querySelector<HTMLElement>('.game-shell')
    shell?.classList.toggle('safe-zone-active',active)
    if(active)window.setTimeout(stopHunt,0)
    return()=>shell?.classList.remove('safe-zone-active')
  },[active])

  useEffect(()=>{
    const syncPortrait=()=>{
      const src=document.querySelector<HTMLImageElement>('.portrait-img')?.src
      if(src)setPortrait(src)
    }
    syncPortrait()
    const timer=window.setInterval(syncPortrait,1000)
    return()=>window.clearInterval(timer)
  },[])

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      if(!active)return
      const button=(event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button')
      if(!button||!button.closest('.game-modal')||!HUNT_ACTION.test(button.textContent||''))return
      // Let the existing React handler change the map first, then leave the lobby and start Auto Hunt.
      window.setTimeout(()=>{
        setActive(false)
        window.setTimeout(startHunt,80)
      },0)
    }
    document.addEventListener('click',onClick)
    return()=>document.removeEventListener('click',onClick)
  },[active])

  const open=(title:string)=>clickMenu(title)
  const returnToProntera=()=>{
    stopHunt()
    setActive(true)
  }

  return <>
    {active&&<section className="prontera-safe-zone" aria-label="Prontera Safe Zone">
      <div className="prontera-map"/>
      <div className="prontera-vignette"/>
      <div className="prontera-city-title"><Castle size={22}/><div><strong>PRONTERA</strong><span>SAFE ZONE · CAPITAL DE RUNE-MIDGARD</span></div></div>

      <div className="prontera-player" aria-label="Seu personagem em Prontera">
        <div className="prontera-player-shadow"/>
        {portrait&&<img src={portrait} alt="Personagem"/>}
        <b>Knock</b>
        <small>Área Segura</small>
      </div>

      <div className="prontera-landmark landmark-kafra"><span>✦</span><b>Kafra</b><small>Armazém e serviços</small></div>
      <div className="prontera-landmark landmark-market"><span>⚖</span><b>Mercado</b><small>Itens e equipamentos</small></div>
      <div className="prontera-landmark landmark-gate"><span>⚔</span><b>Portão de Caçadas</b><small>Escolha sua área de batalha</small></div>

      <aside className="prontera-lobby-card card">
        <header><MapPin size={18}/><div><b>Prontera · Safe Zone</b><small>Ponto inicial e de retorno do personagem</small></div></header>
        <p>Combate e Auto Hunt ficam desativados dentro da cidade. Use Prontera como lobby para organizar equipamentos, inventário e escolher sua próxima caçada.</p>
        <button className="prontera-primary" onClick={()=>open('Mapas')}><Swords size={17}/> ESCOLHER CAÇADA</button>
        <div className="prontera-actions">
          <button onClick={()=>open('Loja')}><ShoppingBag size={16}/> Loja</button>
          <button onClick={()=>open('Equipamentos')}><Shield size={16}/> Equipamentos</button>
          <button onClick={()=>open('Inventário')}><Backpack size={16}/> Inventário</button>
        </div>
        <footer><span>🛡 PvE desativado</span><span>♥ Ponto de respawn</span></footer>
      </aside>
    </section>}

    {!active&&<button className="return-prontera-btn" onClick={returnToProntera} title="Voltar para Prontera Safe Zone"><Home size={16}/> Prontera</button>}
  </>
}
