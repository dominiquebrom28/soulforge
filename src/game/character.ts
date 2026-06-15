import type Phaser from 'phaser'
import { HAIR_RAMP, rampColor, type Character } from './data'

// Character compositing, extracted from the scene. LPC layers are composited into
// one shared 'char_walk' canvas texture; we return the front-facing (South-row)
// frames as data URLs for the React preview/portrait.

const hairCache = new Map<string, HTMLCanvasElement>()

// LPC ships hair in one colour; recolour by luminance gradient-map (cached) so any colour works.
function recolorHair(scene: Phaser.Scene, style: string, colour: string): HTMLCanvasElement {
  const key = `${style}_${colour}`
  const hit = hairCache.get(key)
  if (hit) return hit
  const img = scene.textures.get('o_hair_' + style).getSourceImage() as CanvasImageSource
  const cv = document.createElement('canvas')
  cv.width = 576; cv.height = 256
  const cx = cv.getContext('2d')!
  cx.imageSmoothingEnabled = false
  cx.drawImage(img, 0, 0)
  const ramp = HAIR_RAMP[colour] || HAIR_RAMP.brown
  const id = cx.getImageData(0, 0, 576, 256), d = id.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 10) {
      const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const c = rampColor(L, ramp)
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]
    }
  }
  cx.putImageData(id, 0, 0)
  hairCache.set(key, cv)
  return cv
}

export function composeCharacter(scene: Phaser.Scene, C: Character): string[] {
  const b = C.body
  const exists = scene.textures.exists('char_walk')
  // Phaser's CanvasTexture is awkward to type across get()/createCanvas(); cast locally.
  const tex = (exists ? scene.textures.get('char_walk') : scene.textures.createCanvas('char_walk', 576, 256)) as unknown as {
    getContext: () => CanvasRenderingContext2D
    getSourceImage: () => CanvasImageSource
    refresh: () => void
    add: (i: number, src: number, x: number, y: number, w: number, h: number) => void
  }
  const ctx = tex.getContext()
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, 576, 256)
  const drawKey = (k: string) => { if (scene.textures.exists(k)) ctx.drawImage(scene.textures.get(k).getSourceImage() as CanvasImageSource, 0, 0) }
  drawKey('o_body_' + b); drawKey('o_head_' + b); drawKey('o_eyes_' + C.eyes)
  drawKey('o_fit_' + b + '_bottom'); drawKey('o_fit_' + b + '_feet'); drawKey('o_fit_' + b + '_top')
  ctx.drawImage(recolorHair(scene, C.hair, C.haircolor || 'brown'), 0, 0)
  if (C.weapon && C.weapon !== 'none') drawKey('o_weapon_' + C.weapon)
  tex.refresh()
  if (!exists) { let i = 0; for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { tex.add(i, 0, c * 64, r * 64, 64, 64); i++ } }
  const src = tex.getSourceImage()
  const frames: string[] = []
  for (let c = 0; c < 9; c++) {
    const fc = document.createElement('canvas')
    fc.width = 64; fc.height = 64
    const fx = fc.getContext('2d')!
    fx.imageSmoothingEnabled = false
    fx.drawImage(src, c * 64, 2 * 64, 64, 64, 0, 0, 64, 64)
    frames.push(fc.toDataURL())
  }
  return frames
}
