import { PhaserGame } from './game/PhaserGame'

// React owns the DOM/UI layer; Phaser owns the world. UI overlays (creation
// screen, conversation drawers, HUD) will mount here on top of the canvas.
export default function App() {
  return <PhaserGame />
}
