import { useEffect, useMemo, useState } from 'react'
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

type Monster = { id: number; x: number; y: number; hp: number; maxHp: number; alive: boolean; respawnAt: number; variant: number }

const initialMonsters: Monster[] = [
  { id: 1, x: 61, y: 51, hp: 620, maxHp: 620, alive: true, respawnAt: 0, variant: 0 },
  { id: 2, x: 72, y: 43, hp: 620, maxHp: 620, alive: true, respawnAt: 0, variant: 1 },
  { id: 3, x: 77, y: 59, hp: 620, maxHp: 620, alive: true, respawnAt: 0, variant: 2 },
  { id: 4, x: 66, y: 66, hp: 620, maxHp: 620, alive: true, respawnAt: 0, variant: 3 },
]

export function App() {
  const [monsters, setMonsters] = useState(initialMonsters)
  const [targetId, setTargetId] = useState(1)
  const [hit, setHit] = useState(0)
  const [damage, setDamage] = useState(325)
  const [kills, setKills] = useState(1284)
  const [zeny, setZeny] = useState(258450)
  const [running, setRunning] = useState(true)
  const [log, setLog] = useState(['[10:14] Você causou 325 de dano em Poring.', '[10:14] +125 EXP obtida.', '[10:14] +42 Zeny obtido.', '[10:15] Poring derrotado!'])

  const target = useMemo(() => monsters.find(m => m.id === targetId) ?? monsters[0], [monsters, targetId])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      const now = Date.now()
      setMonsters(current => current.map(m => !m.alive && now >= m.respawnAt ? { ...m, alive: true, hp: m.maxHp } : m))
    }, 400)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setMonsters(current => {
        const living = current.filter(m => m.alive)
        if (!living.length) return current
        const active = current.find(m => m.id === targetId && m.alive) ?? living[0]
        if (active.id !== targetId) setTargetId(active.id)
        const dealt = 285 + Math.floor(Math.random() * 95)
        setDamage(dealt)
        setHit(v => v + 1)
        let killed = false
        const next = current.map(m => {
          if (m.id !== active.id || !m.alive) return m
          const nextHp = m.hp - dealt
          if (nextHp <= 0) {
            killed = true
            return { ...m, hp: 0, alive: false, respawnAt: Date.now() + 2600 }
          }
          return { ...m, hp: nextHp }
        })
        setLog(items => [`[Agora] Você causou ${dealt} de dano em Poring.`, ...items].slice(0, 6))
        if (killed) {
          setKills(v => v + 1)
          setZeny(v => v + 42)
          setLog(items => ['[Agora] Poring derrotado! +125 EXP · +42 Zeny', ...items].slice(0, 6))
          const nextTarget = next.find(m => m.alive)
          if (nextTarget) setTargetId(nextTarget.id)
        }
        return next
      })
    }, 1200)
    return () => window.clearInterval(timer)
  }, [running, targetId])

  return (
    <main className="game-shell">
      <section className="hud card">
        <div className="portrait"><div className="portrait-head"/><div className="portrait-body"/></div>
        <div className="hud-copy">
          <strong>Knock</strong><span>Swordsman</span>
          <div className="levels"><span>Base Lv. 42</span><span>Job Lv. 31</span></div>
          <div className="meter hp"><i style={{ width: '84%' }} /></div>
          <div className="meter sp"><i style={{ width: '72%' }} /></div>
        </div>
      </section>

      <section className="topbar">
        <div className="currency">🪙 <b>{zeny.toLocaleString('pt-BR')}</b> Zeny</div>
        <div className="currency"><Gem size={18}/> 1.250</div>
        <button className="icon-btn">✉</button><button className="icon-btn"><Settings size={20}/></button>
      </section>

      <aside className="side-menu card">{menu.map(([Icon, label]) => <button key={label}><Icon size={20}/><span>{label}</span></button>)}</aside>

      <section className="hunt-zone">
        <div className="sky"/><div className="cloud c1"/><div className="cloud c2"/>
        <div className="castle"><i/><i/><i/><span/></div>
        <div className="far-trees"/><div className="field"/><div className="path"/>
        <div className="tree tree-a"><i/><b/></div><div className="tree tree-b"><i/><b/></div>
        <div className="fence fence-a"/><div className="fence fence-b"/>
        <div className="signpost"><b>Prontera</b></div>
        <div className="flowers f1">✿ ✾ ✿</div><div className="flowers f2">✾ ✿</div>

        <div className={`swordsman ${running ? 'attacking' : ''}`} key={hit}>
          <div className="shadow"/><div className="boots"/><div className="body"/><div className="head"><i/></div><div className="arm"/><div className="sword"/>
          <div className="slash"/>
        </div>

        {monsters.map(monster => (
          <div key={monster.id} className={`poring p${monster.id} ${monster.alive ? '' : 'dead'} ${target?.id === monster.id ? 'targeted' : ''}`} style={{ left: `${monster.x}%`, top: `${monster.y}%` }}>
            <div className="poring-shadow"/><div className="poring-body"><i className="eye e1"/><i className="eye e2"/><i className="mouth"/></div>
            <div className="mob-hp"><i style={{ width: `${Math.max(0, monster.hp / monster.maxHp * 100)}%` }}/></div>
            {target?.id === monster.id && monster.alive && <div className="damage-number" key={hit}>{damage}</div>}
          </div>
        ))}

        <div className="loot-bag">◒</div><div className="loot-apple">●</div><div className="loot-jellopy">◆</div>
        <div className="battle-popups" key={`popup-${kills}`}><strong>+125 EXP</strong><strong>+42 Zeny</strong><span>Jellopy obtido</span></div>
        <div className="world-label">Prontera Field <small>X: 156 &nbsp; Y: 203</small></div>
      </section>

      <aside className="auto-hunt card">
        <div className="panel-title"><Swords size={20}/> AUTO HUNT</div>
        <div className="stats"><p><span>Mapa:</span><b>Prontera Field</b></p><p><span>Tempo de Caçada:</span><b>02:37:42</b></p><p><span>EXP/h:</span><b>148.520</b></p><p><span>Job EXP/h:</span><b>61.300</b></p><p><span>Zeny/h:</span><b>24.840</b></p><p><span>Monstros derrotados:</span><b>{kills.toLocaleString('pt-BR')}</b></p></div>
        <div className="drops"><h3>Drops Obtidos</h3><div><span>💧 Jellopy</span><b>x42</b></div><div><span>🍎 Apple</span><b>x7</b></div><div className="rare"><span>🃏 Poring Card</span><b>x1 · RARO</b></div></div>
        <button className={`stop-btn ${!running ? 'paused' : ''}`} onClick={() => setRunning(v => !v)}>{running ? 'PARAR CAÇADA' : 'INICIAR CAÇADA'}</button>
      </aside>

      <section className="skillbar card">{['⚔️','💥','✚','🛡️','+','+','+','+'].map((item,i) => <button key={i}>{item}</button>)}</section>
      <section className="expbar card"><div className="exp-copy"><span>Base EXP</span><b>64.2%</b></div><div className="meter exp"><i style={{ width:'64.2%' }}/></div></section>
      <section className="chat card"><div className="chat-tabs"><b>Geral</b><span>Sistema</span><span>Batalha</span></div>{log.map((item,i)=><p key={`${item}-${i}`}>{item}</p>)}</section>
      <div className="brand"><Crown size={24}/> RAGNAROK <span>IDLE</span></div>
    </main>
  )
}
