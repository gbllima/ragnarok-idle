import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { installMonsterSpriteWatcher } from './game/monsterSprites'
import { installPlayerSpriteWatcher } from './game/playerSprites'
import { installWorldMovement } from './game/worldMovement'
import './styles.css'
import './death.css'
import './progression.css'
import './world.css'
import './playerSprites.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

installMonsterSpriteWatcher()
installPlayerSpriteWatcher()
installWorldMovement()
