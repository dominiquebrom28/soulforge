import { useGame } from '../store/useGame'
import { CREATE, SWATCH, LBL } from '../game/data'

const genderHair = (body: string) => (body === 'female' ? CREATE.hairFemale : CREATE.hairMale)

function Row({ axis, values }: { axis: string; values: string[] }) {
  const character = useGame((s) => s.character)
  const setCharacter = useGame((s) => s.setCharacter)
  const cur = (character as Record<string, string>)[axis]
  const sw = SWATCH[axis]
  return (
    <div className="cr-row" id={'cr-' + axis}>
      {values.map((v) => {
        const cls = 'cr-chip' + (cur === v ? ' on' : '') + (sw ? ' sw' : '')
        const onClick = () => {
          const patch: Record<string, string> = { [axis]: v }
          if (axis === 'body') { const gh = genderHair(v); if (!gh.includes(character.hair)) patch.hair = gh[0] } // gender-connected hair
          setCharacter(patch)
        }
        if (sw) return <button key={v} className={cls} style={{ ['--sw']: sw[v] || '#888' } as React.CSSProperties} title={v} onClick={onClick} />
        return <button key={v} className={cls} onClick={onClick}>{(LBL[axis] && LBL[axis][v]) || v}</button>
      })}
    </div>
  )
}

export function CreationScreen() {
  const creating = useGame((s) => s.creating)
  const guest = useGame((s) => s.mode === 'visitor')
  const character = useGame((s) => s.character)
  const frames = useGame((s) => s.charFrames)
  const setCharacter = useGame((s) => s.setCharacter)
  const enterWorld = useGame((s) => s.enterWorld)

  return (
    <div id="create" className={creating ? 'show' : ''}>
      <div className="cr-panel">
        <div className="cr-stage">
          <div className="cr-title" id="cr-title">{guest ? 'CREATE YOUR GUEST' : 'CREATE YOUR CHARACTER'}</div>
          <div className="cr-sub" id="cr-sub">{guest ? 'A look just for this visit — not saved.' : 'This is you — the soul you’ll forge.'}</div>
          <div className="cr-rank" id="cr-rank">RANK · {character.rank.toUpperCase()}</div>
          <div className="cr-pedestal"><img id="cr-preview" alt="Your character" src={frames[0] || undefined} /></div>
        </div>
        <div className="cr-form">
          <label className="cr-l">Name</label>
          <input id="cr-name" className="cr-name" maxLength={16} value={character.name}
            onChange={(e) => setCharacter({ name: e.target.value })} />
          <label className="cr-l">Body</label><Row axis="body" values={['male', 'female']} />
          <label className="cr-l">Hairstyle</label><Row axis="hair" values={genderHair(character.body)} />
          <label className="cr-l">Hair colour</label><Row axis="haircolor" values={CREATE.haircolor} />
          <label className="cr-l">Eyes</label><Row axis="eyes" values={CREATE.eyes} />
          <label className="cr-l">Weapon <span className="cr-hint">(cosmetic)</span></label><Row axis="weapon" values={CREATE.weapon} />
          <button id="cr-begin" className="cr-begin" onClick={() => {
            const name = (character.name || 'Soul').trim() || 'Soul'
            if (name !== character.name) setCharacter({ name })
            enterWorld()
          }}>Enter the World ▸</button>
        </div>
      </div>
    </div>
  )
}
