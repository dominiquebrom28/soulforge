import { useEffect, useState } from 'react'
import { useGame } from '../store/useGame'
import { OBJECTS_META, rankColor } from '../game/data'

export function ConversationPanel() {
  const panelId = useGame((s) => s.panelId)
  const closePanel = useGame((s) => s.closePanel)
  const character = useGame((s) => s.character)
  const frames = useGame((s) => s.charFrames)
  // keep the last opened element's content during the slide-out animation
  const [shown, setShown] = useState<string | null>(null)
  useEffect(() => { if (panelId) setShown(panelId) }, [panelId])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [closePanel])

  const open = panelId !== null
  const m = shown ? OBJECTS_META[shown] : null
  return (
    <>
      <div id="dim" className={open ? 'show' : ''} onClick={closePanel} />
      <div id="panel" role="dialog" aria-modal="true"
        className={(shown ? 'theme-' + shown : '') + (open ? ' show' : '')}
        style={{ ['--accent']: m?.color } as React.CSSProperties}>
        <button className="x" id="p-close" title="Close (Esc)" onClick={closePanel}>✕</button>
        <div className="scene">
          <div className="actors">
            <div className="actor player">
              <div className="stand"><img id="p-portrait" alt="Your character" src={frames[0] || undefined} /></div>
              <div className="nm pn">
                <span className="rk" id="p-prank" style={{ color: rankColor(character.rank) }}>{character.rank.toUpperCase()}</span>
                <span id="p-pname">{character.name}</span>
              </div>
            </div>
            <div className="actor element">
              <div className="stand"><img id="p-elart" alt="" src={m ? 'assets/' + m.art : undefined} /></div>
              <div className="nm"><span className="ic" id="p-icon">{m?.icon}</span><span id="p-title">{m?.title}</span></div>
            </div>
          </div>
          <div className="bubble">
            <span className="tag">PLACEHOLDER</span>
            <p id="p-desc" dangerouslySetInnerHTML={{ __html: m?.desc || '—' }} />
            <p className="meta" id="p-meta" dangerouslySetInnerHTML={{ __html: m?.meta || '—' }} />
            <div className="soon" id="p-soon">🚧 The real panel arrives in a later slice.</div>
          </div>
        </div>
      </div>
    </>
  )
}
