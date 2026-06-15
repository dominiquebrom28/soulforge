import { useEffect, useState } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { useGame } from './store/useGame'
import { loadProfile, saveProfile } from './lib/profile'
import { Hud } from './ui/Hud'
import { CreationScreen } from './ui/CreationScreen'
import { ConversationPanel } from './ui/ConversationPanel'
import { TouchControls } from './ui/TouchControls'
import './ui/overlays.css'

// React owns the DOM/UI layer (creation, HUD, conversation drawer, touch, grade);
// Phaser owns the world via <GameCanvas>. Zustand (useGame) bridges the two.
export default function App() {
  const theme = useGame((s) => s.theme)
  const [ready, setReady] = useState(false)

  // gate the Phaser boot on fonts (so Press Start 2P / VT323 render crisp), with a fallback
  useEffect(() => {
    let done = false
    const go = () => { if (!done) { done = true; setReady(true) } }
    const fonts = document.fonts?.load
      ? Promise.all([document.fonts.load('10px "Press Start 2P"'), document.fonts.load('20px "VT323"')]).catch(() => {})
      : Promise.resolve()
    fonts.finally(go)
    const t = setTimeout(go, 1800)
    return () => clearTimeout(t)
  }, [])

  // persistence (owner only): reconcile with Supabase on boot, then save edits (debounced)
  useEffect(() => {
    if (useGame.getState().mode !== 'owner') return
    loadProfile().then((remote) => { if (remote) useGame.getState().setCharacter(remote) })
    let t: ReturnType<typeof setTimeout>
    const unsub = useGame.subscribe((s, prev) => {
      if (s.character !== prev.character) { clearTimeout(t); t = setTimeout(() => saveProfile(s.character), 400) }
    })
    return () => { clearTimeout(t); unsub() }
  }, [])

  return (
    <>
      <GameCanvas active={ready} />
      <div id="grade" style={{ background: theme.grade }} />
      <Hud />
      <ConversationPanel />
      <TouchControls />
      <CreationScreen />
      {!ready && <div id="loading">LOADING SOULFORGE…</div>}
    </>
  )
}
