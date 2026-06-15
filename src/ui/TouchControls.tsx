import { useEffect, useState } from 'react'
import { useGame, type InputKey } from '../store/useGame'

const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768

export function TouchControls() {
  const setInput = useGame((s) => s.setInput)
  const openPanel = useGame((s) => s.openPanel)
  const activeObjectId = useGame((s) => s.activeObjectId)
  const panelId = useGame((s) => s.panelId)
  const [touch, setTouch] = useState(isTouch())
  useEffect(() => { const h = () => setTouch(isTouch()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])

  const live = !!activeObjectId && !panelId
  const hold = (k: InputKey) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); setInput(k, true) },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); setInput(k, false) },
    onPointerLeave: () => setInput(k, false),
    onPointerCancel: () => setInput(k, false),
  })

  return (
    <div id="touch" className={touch ? 'show' : ''}>
      <div className="pad">
        <div className="btn" data-k="left" {...hold('left')}>◀</div>
        <div className="btn" data-k="right" {...hold('right')}>▶</div>
      </div>
      <div className="pad">
        <div className="btn jump" data-k="jump" {...hold('jump')}>▲</div>
        <div className={'btn interact' + (live ? ' live' : '')} id="t-interact" data-k="interact"
          onPointerDown={(e) => { e.preventDefault(); if (activeObjectId && !panelId) openPanel(activeObjectId) }}>E</div>
      </div>
    </div>
  )
}
