import React from 'react'
import ReactDOM from 'react-dom/client'
import { AccountGate } from './components/AccountGate'
import './styles.css'
import './death.css'
import './progression.css'
import './world.css'
import './playerSprites.css'
import './roAssets.css'
import './catalog.css'
import './gameChrome.css'
import './authenticMaps.css'
import './pronteraSafeZone.css'
import './pronteraTileBot02.css'
import './pronteraTileBot05.css'
import './pronteraTileBot07.css'
import './pronteraTileG01.css'
import './pronteraTiles.css'
import './party.css'
import './quickInventoryTrim.css'
import './partyPolish.css'
import './onboarding.css'
import './onboardingNovice.css'

const root=ReactDOM.createRoot(document.getElementById('root')!)
root.render(<div className="catalog-loading" role="status">Carregando Ragnarok Idle…</div>)
Promise.all([import('./App'),import('./components/PronteraSafeZone'),import('./game/monsterSprites'),import('./game/playerSprites'),import('./game/worldMovement'),import('./game/partyWorld')]).then(([{App},{PronteraSafeZone},monsters,players,world,partyWorld])=>{
  root.render(<React.StrictMode><AccountGate><App/><PronteraSafeZone/></AccountGate></React.StrictMode>)
  monsters.installMonsterSpriteWatcher()
  players.installPlayerSpriteWatcher()
  world.installWorldMovement()
  partyWorld.installPartyWorld()
}).catch(error=>root.render(<div className="catalog-loading" role="alert"><p>{error instanceof Error?error.message:'Falha ao carregar o jogo.'}</p><button onClick={()=>window.location.reload()}>Tentar novamente</button></div>))
