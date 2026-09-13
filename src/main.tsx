import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import './death.css'
import './progression.css'
import './world.css'
import './playerSprites.css'
import './roAssets.css'
import './catalog.css'

const root=ReactDOM.createRoot(document.getElementById('root')!)
root.render(<div className="catalog-loading" role="status">Carregando Ragnarok Idle…</div>)
Promise.all([import('./App'),import('./game/monsterSprites'),import('./game/playerSprites'),import('./game/worldMovement')]).then(([{App},monsters,players,world])=>{
  root.render(<React.StrictMode><App/></React.StrictMode>)
  monsters.installMonsterSpriteWatcher()
  players.installPlayerSpriteWatcher()
  world.installWorldMovement()
}).catch(error=>root.render(<div className="catalog-loading" role="alert"><p>{error instanceof Error?error.message:'Falha ao carregar o jogo.'}</p><button onClick={()=>window.location.reload()}>Tentar novamente</button></div>))
