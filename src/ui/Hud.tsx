import { useEffect, useState } from 'react'
import { useGame } from '../store/useGame'
import { amsNow } from '../game/data'

const SEASON_ICON: Record<string, string> = { winter: '❄', spring: '🌸', summer: '☀', autumn: '🍂' }
const TOD_ICON: Record<string, string> = { dawn: '🌅', day: '☀', dusk: '🌆', night: '🌙' }
const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768

export function Hud() {
  const theme = useGame((s) => s.theme)
  const [now, setNow] = useState(amsNow())
  const [faded, setFaded] = useState(false)
  const [touch, setTouch] = useState(isTouch())

  useEffect(() => { const id = setInterval(() => setNow(amsNow()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { const r = requestAnimationFrame(() => setFaded(true)); return () => cancelAnimationFrame(r) }, [])
  useEffect(() => { const h = () => setTouch(isTouch()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])

  const season = theme.season.charAt(0).toUpperCase() + theme.season.slice(1)
  return (
    <div id="hud">
      <div id="clock">
        <div className="t" id="clk-time">{TOD_ICON[theme.tod]} {now.hh}:{now.minute}</div>
        <div className="sub" id="clk-day">{now.weekday} · {SEASON_ICON[theme.season]} <span>{season}</span></div>
        <div className="lab">Soulforge time · Amsterdam</div>
      </div>
      {!touch && (
        <div id="hint"><b>← →</b> / <b>A D</b> move &nbsp;·&nbsp; <b>Space / ↑</b> jump &nbsp;·&nbsp; <b>E</b> interact</div>
      )}
      <div id="title-toast" style={{ opacity: faded ? 0 : 1 }}>
        <div className="a">SOULFORGE</div>
        <div className="b">Slice 1 — the world wakes up. Find the glowing places.</div>
      </div>
    </div>
  )
}
