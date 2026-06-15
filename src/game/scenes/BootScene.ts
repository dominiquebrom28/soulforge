import Phaser from 'phaser'

// Static assets live in public/assets and are served at /assets/... .
const asset = (p: string) => `${import.meta.env.BASE_URL}assets/${p}`

// Minimal world skeleton in the new Vite build — proves the toolchain, the
// React↔Phaser bridge, and the asset pipeline (Sunny Land art) all work.
// The full slice-1 world/character/creation/panels port on top of this.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload() {
    this.load.image('sky', asset('sunny/env/sky.png'))
    this.load.image('forest', asset('sunny/env/forest.png'))
  }

  create() {
    const w = this.scale.width
    const h = this.scale.height

    // parallax-ready sky + forest backdrop (real Sunny Land assets)
    this.add.image(0, 0, 'sky').setOrigin(0).setDisplaySize(w, h).setScrollFactor(0)
    const forest = this.add.image(w / 2, h, 'forest').setOrigin(0.5, 1).setScrollFactor(0)
    forest.setScale(Math.max(w / forest.width, 1.1))

    // ground strip
    this.add.rectangle(0, h - 64, w, 128, 0x2c211b).setOrigin(0, 0)
    this.add.rectangle(0, h - 64, w, 8, 0x6aa84f).setOrigin(0, 0)

    // title card
    this.add
      .text(w / 2, h / 2 - 28, 'SOULFORGE', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '34px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#a78bfa', 20)
    this.add
      .text(w / 2, h / 2 + 22, 'Vite · React · Phaser · Zustand · Supabase', {
        fontFamily: '"VT323", monospace',
        fontSize: '24px',
        color: '#bcaef0',
      })
      .setOrigin(0.5)
  }
}
