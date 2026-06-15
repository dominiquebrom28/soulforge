import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'

// Mounts a single Phaser.Game into a host div and tears it down on unmount.
// Survives React 18/19 StrictMode's mount→unmount→mount by destroying cleanly.
export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current || !hostRef.current) return
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      backgroundColor: '#0b0a14',
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1700 } } },
      scene: [BootScene],
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={hostRef} style={{ position: 'fixed', inset: 0 }} />
}
