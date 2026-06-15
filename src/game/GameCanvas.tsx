import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { WorldScene } from './WorldScene'

// Mounts the Phaser world into the #game div once `active` (fonts loaded), and
// tears it down on unmount. StrictMode-safe via the gameRef guard.
export function GameCanvas({ active }: { active: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!active || gameRef.current || !hostRef.current) return
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      transparent: true,
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1600 }, debug: false } },
      scene: WorldScene,
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [active])

  return <div id="game" ref={hostRef} />
}
