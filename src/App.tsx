import { Backpack, BookOpen, CircleUserRound, Crown, Gem, Map, PawPrint, Settings, Shield, Sparkles, Swords, Trophy } from 'lucide-react'

const menu = [
  [CircleUserRound, 'Personagem'],
  [Shield, 'Equipamentos'],
  [Backpack, 'Inventário'],
  [Sparkles, 'Skills'],
  [Map, 'Mapas'],
  [BookOpen, 'Quests'],
  [PawPrint, 'Pets'],
  [Trophy, 'Ranking'],
] as const

export function App() {
  return (
    <main className="game-shell">
      <section className="hud card">
        <div className="portrait">K</div>
        <div className="hud-copy">
          <strong>Knock</strong>
          <span>Swordsman</span>
          <div className="levels"><span>Base Lv. 42</span><span>Job Lv. 31</span></div>
          <div className="meter hp"><i style={{ width: '84%' }} /></div>
          <div className="meter sp"><i style={{ width: '72%' }} /></div>
        </div>
      </section>

      <section className="topbar">
        <div className="currency">🪙 <b>258.450</b> Zeny</div>
        <div className="currency"><Gem size={18}/> 1.250</div>
        <button className="icon-btn">✉</button>
        <button className="icon-btn"><Settings size={20}/></button>
      </section>

      <aside className="side-menu card">
        {menu.map(([Icon, label]) => (
          <button key={label}><Icon size={20}/><span>{label}</span></button>
        ))}
      </aside>

      <section className="hunt-zone">
        <div className="skyline" />
        <div className="terrain-glow" />
        <div className="player sprite-card">⚔️</div>
        <div className="monster m1">◉</div>
        <div className="monster m2">◉</div>
        <div className="monster m3">◉</div>
        <div className="damage d1">325</div>
        <div className="damage d2">298</div>
        <div className="battle-popups">
          <strong>+125 EXP</strong>
          <strong>+42 Zeny</strong>
          <span>Jellopy obtido</span>
        </div>
        <div className="drop drop1">🍎</div>
        <div className="drop drop2">💧</div>
        <div className="world-label">Prontera Field</div>
      </section>

      <aside className="auto-hunt card">
        <div className="panel-title"><Swords size={20}/> AUTO HUNT</div>
        <div className="stats">
          <p><span>Mapa:</span><b>Prontera Field</b></p>
          <p><span>Tempo de Caçada:</span><b>02:37:42</b></p>
          <p><span>EXP/h:</span><b>148.520</b></p>
          <p><span>Job EXP/h:</span><b>61.300</b></p>
          <p><span>Zeny/h:</span><b>24.840</b></p>
          <p><span>Monstros derrotados:</span><b>1.284</b></p>
        </div>
        <div className="drops">
          <h3>Drops</h3>
          <div><span>💧 Jellopy</span><b>x42</b></div>
          <div><span>🍎 Apple</span><b>x7</b></div>
          <div className="rare"><span>🃏 Poring Card</span><b>x1 · RARO</b></div>
        </div>
        <button className="stop-btn">PARAR CAÇADA</button>
      </aside>

      <section className="skillbar card">
        {["⚔️", "💥", "✚", "🛡️", "+", "+", "+", "+"].map((item, i) => <button key={i}>{item}</button>)}
      </section>

      <section className="expbar card">
        <div className="exp-copy"><span>Base EXP</span><b>64.2%</b></div>
        <div className="meter exp"><i style={{ width: '64.2%' }} /></div>
      </section>

      <section className="chat card">
        <div className="chat-tabs"><b>Geral</b><span>Sistema</span><span>Batalha</span></div>
        <p>[10:14] Você causou 325 de dano em Poring.</p>
        <p>[10:14] +125 EXP obtida.</p>
        <p>[10:14] +42 Zeny obtido.</p>
        <p>[10:15] Poring derrotado!</p>
      </section>

      <div className="brand"><Crown size={24}/> RAGNAROK <span>IDLE</span></div>
    </main>
  )
}
