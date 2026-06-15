// @ts-nocheck
// The Phaser world scene — ported from the prototype. Same world/character/camera
// logic; the only change is it reads & writes the Zustand store (useGame) instead
// of the old global `SF`, and pushes character frames to the store for the React UI.
import Phaser from 'phaser'
import { useGame } from '../store/useGame'
import {
  CREATE, OBJECTS_META, rankColor,
  WORLD, GROUND_TOP, SPAWN, S, PLATFORMS, INTERACTABLES, TILE,
} from './data'
import { leoTex, dotTex, star4Tex, haloTex, shadowTex } from './textures'
import { composeCharacter } from './character'

export class WorldScene extends Phaser.Scene {
  constructor() { super('world') }

  preload() {
    this.load.image('sky', 'assets/sunny/env/sky.png')
    this.load.image('forest', 'assets/sunny/env/forest.png')
    this.load.image('tiles', 'assets/sunny/env/tileset.png')
    this.load.atlas('ents', 'assets/sunny/atlas/entities.png', 'assets/sunny/atlas/entities.json')
    this.load.atlas('props', 'assets/sunny/atlas/props.png', 'assets/sunny/atlas/props.json')
    // bespoke Soulforge landmark art (cave / campfire / noticeboard / archive)
    this.load.image('sf_cave', 'assets/sf/cave.png')
    this.load.image('sf_board', 'assets/sf/board.png')
    this.load.image('sf_archive', 'assets/sf/archive.png')
    this.load.spritesheet('sf_campfire', 'assets/sf/campfire.png', { frameWidth: 34, frameHeight: 34 })
    // LPC modular character options (64x64 walk sheets). Art: Liberated Pixel Cup (CC-BY-SA 3.0 / GPL).
    this.load.image('o_body_male', 'assets/lpc/body/male.png'); this.load.image('o_body_female', 'assets/lpc/body/female.png')
    this.load.image('o_head_male', 'assets/lpc/head/male.png'); this.load.image('o_head_female', 'assets/lpc/head/female.png')
    ;['male', 'female'].forEach(b => ['top', 'bottom', 'feet'].forEach(p => this.load.image('o_fit_' + b + '_' + p, 'assets/lpc/outfit/' + b + '/' + p + '.png')))
    ;[...new Set([...CREATE.hairMale, ...CREATE.hairFemale])].forEach(h => this.load.image('o_hair_' + h, 'assets/lpc/hair/' + h + '.png'))
    CREATE.eyes.forEach(e => this.load.image('o_eyes_' + e, 'assets/lpc/eyes/' + e + '.png'))
    CREATE.weapon.filter(w => w !== 'none').forEach(w => this.load.image('o_weapon_' + w, 'assets/lpc/weapon/' + w + '.png'))
    const cv = (key, w, h, fn) => { const t = this.textures.createCanvas(key, w, h); fn(t.getContext(), w, h); t.refresh() }
    cv('leo_idle', 48, 40, (c, w, h) => leoTex(c, w, h, 0)); cv('leo_walk0', 48, 40, (c, w, h) => leoTex(c, w, h, 1)); cv('leo_walk1', 48, 40, (c, w, h) => leoTex(c, w, h, 2))
    cv('dot', 8, 8, (c) => dotTex(c)); cv('star4', 16, 16, star4Tex); cv('halo', 128, 128, haloTex); cv('shadow', 80, 26, shadowTex)
  }

  create() {
    this.THEME = useGame.getState().theme
    this.physics.world.setBounds(0, 0, WORLD.w, WORLD.h); this.solids = []
    this.composeChar()
    this.buildBackground(); this.buildGround(); this.buildPlatforms(); this.buildProps(); this.buildInteractables()
    this.buildPlayer(); this.buildLeo(); this.buildPrompt(); this.buildParticles(); this.bindInput()
    const cam = this.cameras.main; cam.setBounds(0, 0, WORLD.w, WORLD.h); cam.startFollow(this.player, true, 0.09, 0.09); cam.setDeadzone(150, 200); cam.setBackgroundColor('rgba(0,0,0,0)')
    const gf = (p, a, b) => this.anims.generateFrameNames('ents', { prefix: p, start: a, end: b })
    this.anims.create({ key: 'p_idle', frames: [{ key: 'char_walk', frame: 27 }], frameRate: 1, repeat: -1 })
    this.anims.create({ key: 'p_run', frames: [28, 29, 30, 31, 32, 33, 34, 35].map(f => ({ key: 'char_walk', frame: f })), frameRate: 11, repeat: -1 })
    this.anims.create({ key: 'p_jump', frames: [{ key: 'char_walk', frame: 31 }], frameRate: 1, repeat: -1 })
    this.anims.create({ key: 'op_walk', frames: gf('opossum/opossum-', 1, 6), frameRate: 8, repeat: -1 })
    this.anims.create({ key: 'l_idle', frames: [{ key: 'leo_idle' }], frameRate: 1, repeat: -1 })
    this.anims.create({ key: 'l_walk', frames: [{ key: 'leo_walk0' }, { key: 'leo_walk1' }], frameRate: 9, repeat: -1 })
    this.anims.create({ key: 'fire_flicker', frames: [{ key: 'sf_campfire', frame: 0 }, { key: 'sf_campfire', frame: 1 }, { key: 'sf_campfire', frame: 2 }], frameRate: 8, repeat: -1 })
    this.player.play('p_idle'); this._wasAir = false
    if (import.meta.env.DEV) window.__scene = this
    // re-compose the sprite + refresh the name/rank tags whenever the creation UI edits the character
    this._lastChar = useGame.getState().character
    this._unsub = useGame.subscribe((s) => { if (s.character !== this._lastChar) { this._lastChar = s.character; this.composeChar(); this.syncNameTag() } })
    this.events.once('shutdown', () => { if (this._unsub) this._unsub() })
  }

  syncNameTag() {
    const C = useGame.getState().character
    if (this.nameTag) this.nameTag.setText(C.name)
    if (this.rankTag) { this.rankTag.setText(C.rank.toUpperCase()); this.rankTag.setColor(rankColor(C.rank)) }
  }

  /* ---- composite the selected LPC layers into one walk sheet (live, re-runnable) ---- */
  composeChar() {
    useGame.getState().setCharFrames(composeCharacter(this, useGame.getState().character))
  }

  /* ---- parallax sky + forest (Sunny Land) ---- */
  buildBackground() {
    this.add.tileSprite(0, 0, WORLD.w, GROUND_TOP + 260, 'sky').setOrigin(0, 0).setScrollFactor(0.1, 0.3).setDepth(0).setTileScale(S, S).setTint(this.THEME.bg)
    this.add.tileSprite(0, GROUND_TOP + 40, WORLD.w, 360, 'forest').setOrigin(0, 1).setScrollFactor(0.35, 1).setDepth(2).setTileScale(S * 0.9, S * 0.9).setAlpha(0.5).setTint(this.THEME.bg)
    this.add.tileSprite(0, GROUND_TOP + 30, WORLD.w, 420, 'forest').setOrigin(0, 1).setScrollFactor(0.55, 1).setDepth(3).setTileScale(S, S).setTint(this.THEME.bg)
  }

  /* ---- ground: Sunny Land tilemap (visual) + invisible physics bodies ---- */
  addSolid(cx, topY, w, h) { const b = this.physics.add.staticImage(cx, topY + h / 2, 'dot').setVisible(false).setDisplaySize(w, h); b.refreshBody(); this.solids.push(b); return b }
  shadowAt(x, y, sx, depth, alpha) { this.add.image(x, y, 'shadow').setOrigin(0.5, 0.5).setDepth(depth || 9).setScale(sx, sx * 0.5).setAlpha(alpha == null ? 0.24 : alpha) }
  buildGround() {
    const gcols = Math.ceil(WORLD.w / (16 * S)) + 1, grows = Math.ceil((WORLD.h - GROUND_TOP) / (16 * S)) + 2
    const map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: gcols, height: grows })
    const tset = map.addTilesetImage('tiles', 'tiles', 16, 16)
    const layer = map.createBlankLayer('ground', tset, 0, GROUND_TOP).setScale(S).setDepth(10)
    if (this.THEME.fg !== 0xffffff) layer.setTint(this.THEME.fg)
    for (let x = 0; x < gcols; x++) { layer.putTileAt(TILE.grass, x, 0); for (let y = 1; y < grows; y++) layer.putTileAt(TILE.dirt, x, y) }
    this.addSolid(WORLD.w / 2, GROUND_TOP, WORLD.w, 200)
  }

  /* ---- floating platforms from the 'platform-long' prop ---- */
  buildPlatforms() {
    for (const p of PLATFORMS) {
      this.shadowAt(p.x, p.y + 26, p.w / 95, 9.5, 0.16)
      const pieceW = 32 * S, n = Math.ceil(p.w / pieceW), left = p.x - p.w / 2
      for (let i = 0; i < n; i++) this.add.image(Math.min(left + pieceW / 2 + i * pieceW, p.x + p.w / 2 - pieceW / 2), p.y, 'props', 'platform-long').setOrigin(0.5, 0).setScale(S).setDepth(11).setTint(this.THEME.fg)
      this.addSolid(p.x, p.y, p.w, 22)
    }
  }

  /* ---- scenery props (thinned, size-varied) ---- */
  prop(x, frame, scale, depth, flip) { const im = this.add.image(x, GROUND_TOP + 2, 'props', frame).setOrigin(0.5, 1).setScale(scale * S).setDepth(depth || 12).setTint(this.THEME.fg); if (flip) im.setFlipX(true); return im }
  buildProps() {
    this.shadowAt(150, GROUND_TOP + 6, 1.5, 9.6, 0.18); this.prop(150, 'tree', 1.5, 9)
    this.shadowAt(2640, GROUND_TOP + 6, 1.2, 9.6, 0.18); this.prop(2640, 'tree', 1.2, 9, true)
    this.prop(1700, 'tree', 0.9, 9)
    this.prop(600, 'bush', 1.0); this.prop(2430, 'bush', 0.8, 12, true)
    this.prop(300, 'rock', 1.0); this.prop(2560, 'rock', 0.7)
    this.prop(1255, 'shrooms', 1.1); this.prop(1080, 'shrooms', 0.8)
    this.prop(860, 'bush', 0.7, 8)
    this.shadowAt(660, GROUND_TOP + 6, 0.9, 12.5, 0.2)
    const op = this.add.sprite(660, GROUND_TOP + 2, 'ents', 'opossum/opossum-1').setOrigin(0.5, 1).setScale(S).setDepth(13).setTint(this.THEME.fg); op.play('op_walk')
    this.tweens.add({ targets: op, x: 740, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => op.setFlipX(true), onRepeat: () => op.setFlipX(false) })
  }

  /* ---- interactables: house/sign/door stand-ins + glow + sparkles ---- */
  buildInteractables() {
    const C = {
      journal: { src: { tex: 'sf_cave' }, sc: 2.2, glowY: -66, gs: 1.5, label: 'Journal Cave' },
      leo: { src: { tex: 'sf_campfire', anim: 'fire_flicker' }, sc: 2.4, glowY: -40, gs: 1.0, label: 'Leo’s Campfire' },
      todo: { src: { tex: 'sf_board' }, sc: 2.0, glowY: -62, gs: 1.0, label: 'Todo Board' },
      shrine: { src: { atlas: 'props', frame: 'house' }, sc: 1.7, glowY: -92, gs: 1.7, label: 'Habit Shrine' },
      monument: { src: { atlas: 'props', frame: 'door' }, sc: 2.4, glowY: -78, gs: 1.6, label: 'Monument' },
      quest: { src: { atlas: 'props', frame: 'sign' }, sc: 3.0, glowY: -58, gs: 1.3, label: 'Quest Board' },
      archive: { src: { tex: 'sf_archive' }, sc: 1.9, glowY: -96, gs: 1.6, label: 'Level Archive' },
    }
    this.interactables = []
    for (const data of INTERACTABLES) {
      const meta = OBJECTS_META[data.id], cfg = C[data.id], col = Phaser.Display.Color.HexStringToColor(meta.color).color
      let sprite
      if (cfg.src.anim) sprite = this.add.sprite(0, 0, cfg.src.tex).play(cfg.src.anim)
      else if (cfg.src.tex) sprite = this.add.image(0, 0, cfg.src.tex)
      else sprite = this.add.image(0, 0, cfg.src.atlas, cfg.src.frame)
      sprite.setOrigin(0.5, 1).setScale(cfg.sc).setTint(this.THEME.fg)
      const h = sprite.displayHeight
      this.shadowAt(data.wx, data.wy + 5, h / 150, 19, 0.22)
      const cont = this.add.container(data.wx, data.wy).setDepth(20)
      const halo = this.add.image(0, cfg.glowY, 'halo').setTint(col).setScale(cfg.gs).setAlpha(.7); cont.add(halo)
      this.tweens.add({ targets: halo, scale: cfg.gs * 1.12, alpha: 1, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
      cont.add(sprite)
      const label = this.add.text(0, -h - 8, cfg.label, { fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#ffffff', stroke: '#1a1230', strokeThickness: 5, align: 'center' }).setOrigin(0.5, 1); cont.add(label)
      this.tweens.add({ targets: label, y: label.y - 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
      this.add.particles(data.wx, data.wy + cfg.glowY, 'star4', { x: { min: -40, max: 40 }, y: { min: -44, max: 44 }, lifespan: 1300, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, tint: col, frequency: 240, quantity: 1, rotate: { min: 0, max: 90 } }).setDepth(21)
      data.topY = data.wy - h - 10; cont.data = { ...data, halo }; this.interactables.push(cont)
    }
  }

  /* ---- player ---- */
  buildPlayer() {
    this.pShadow = this.add.image(SPAWN.x, GROUND_TOP, 'shadow').setAlpha(.28).setDepth(48).setScale(0.85)
    const p = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'char_walk', 27).setDepth(50).setScale(S).setTint(this.THEME.fg)
    p.body.setSize(16, 30).setOffset(24, 32)
    p.setCollideWorldBounds(true).setMaxVelocity(360, 1100); this.physics.add.collider(p, this.solids); this.player = p
    const C = useGame.getState().character
    this.nameTag = this.add.text(SPAWN.x, SPAWN.y - 54, C.name, { fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#fff', stroke: '#1a1230', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(60)
    this.rankTag = this.add.text(SPAWN.x, SPAWN.y - 67, C.rank.toUpperCase(), { fontFamily: '"Press Start 2P"', fontSize: '7px', color: rankColor(C.rank), stroke: '#1a1230', strokeThickness: 4, letterSpacing: 2 }).setOrigin(0.5, 1).setDepth(60)
  }
  buildLeo() {
    this.lShadow = this.add.image(SPAWN.x - 90, GROUND_TOP, 'shadow').setAlpha(.26).setDepth(47).setScale(0.7)
    const l = this.physics.add.sprite(SPAWN.x - 90, SPAWN.y, 'leo_idle').setDepth(49).setScale(1.25).setTint(this.THEME.fg); l.body.setSize(30, 18).setOffset(8, 20)
    l.setCollideWorldBounds(true).setMaxVelocity(420, 1100); this.physics.add.collider(l, this.solids); this.leo = l
    this.leoTag = this.add.text(SPAWN.x - 90, SPAWN.y - 30, 'Leo', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffd479', stroke: '#1a1230', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(60)
  }
  buildPrompt() {
    const c = this.add.container(0, 0).setDepth(70).setVisible(false); const inner = this.add.container(0, 0); const bg = this.add.graphics()
    bg.fillStyle(0x1a1230, .92); bg.fillRoundedRect(-16, -16, 32, 32, 7); bg.lineStyle(2, 0xf59e0b, 1); bg.strokeRoundedRect(-16, -16, 32, 32, 7)
    const key = this.add.text(0, 1, 'E', { fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffe27a' }).setOrigin(0.5); inner.add([bg, key]); c.add(inner)
    this.tweens.add({ targets: inner, y: -8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); this.prompt = c
  }

  buildParticles() {
    this.dust = this.add.particles(0, 0, 'dot', { speed: { min: 30, max: 110 }, angle: { min: 200, max: 340 }, lifespan: 360, scale: { start: 1.6, end: 0 }, alpha: { start: .55, end: 0 }, tint: 0xeae0c8, gravityY: 300, emitting: false }).setDepth(45)
    const W = this.THEME.weather
    if (W === 'snow') this.add.particles(0, 0, 'dot', { x: { min: 0, max: 1900 }, y: -20, lifespan: 16000, speedY: { min: 25, max: 70 }, speedX: { min: -22, max: 22 }, scale: { min: .6, max: 1.6 }, alpha: { min: .5, max: .9 }, tint: 0xffffff, frequency: 90, quantity: 1 }).setScrollFactor(0).setDepth(80)
    else if (W === 'fireflies') this.add.particles(0, 0, 'star4', { x: { min: 0, max: WORLD.w }, y: { min: GROUND_TOP - 340, max: GROUND_TOP - 10 }, lifespan: 2600, speedX: { min: -10, max: 10 }, speedY: { min: -10, max: 5 }, scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, tint: 0xffe24a, frequency: 130, quantity: 1, rotate: { min: 0, max: 90 } }).setDepth(46)
    else if (W === 'petals') this.add.particles(0, 0, 'dot', { x: { min: 0, max: 1900 }, y: -20, lifespan: 14000, speedY: { min: 18, max: 46 }, speedX: { min: -26, max: 26 }, scale: { min: .8, max: 1.5 }, alpha: { min: .6, max: .95 }, tint: [0xffb6d5, 0xffd6e6], frequency: 150, quantity: 1, rotate: { min: 0, max: 360 } }).setScrollFactor(0).setDepth(80)
    else this.add.particles(0, 0, 'star4', { x: { min: 0, max: WORLD.w }, y: { min: GROUND_TOP - 300, max: GROUND_TOP - 20 }, lifespan: 5200, speedY: { min: -14, max: -2 }, speedX: { min: -8, max: 8 }, scale: { start: 0.4, end: 0 }, alpha: { start: .8, end: 0 }, tint: 0xfff0a0, frequency: 240, quantity: 1 }).setDepth(15)
  }

  bindInput() {
    this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT,W,A,D')
    this.keys = this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', a: 'A', d: 'D', w: 'W', space: 'SPACE', e: 'E' })
    this._jumpPrev = false; this._interactPrev = false
  }

  update() {
    const p = this.player, l = this.leo, k = this.keys, st = useGame.getState()
    if (st.creating) { p.setVelocityX(0); l.setVelocityX(0); p.play('p_idle', true); l.play('l_idle', true); this.syncFollowers(); return }
    const left = k.left.isDown || k.a.isDown || st.input.left, right = k.right.isDown || k.d.isDown || st.input.right, jumpHeld = k.up.isDown || k.w.isDown || k.space.isDown || st.input.jump, interactHeld = k.e.isDown || st.input.interact
    const jumpEdge = jumpHeld && !this._jumpPrev, interactEdge = interactHeld && !this._interactPrev; this._jumpPrev = jumpHeld; this._interactPrev = interactHeld
    if (st.panelId) { p.setVelocityX(0); p.play('p_idle', true); l.setVelocityX(0); l.play('l_idle', true); this.prompt.setVisible(false); this.syncFollowers(); return }
    const SPEED = 240; let vx = 0; if (left && !right) vx = -SPEED; else if (right && !left) vx = SPEED; p.setVelocityX(vx); if (vx !== 0) p.setFlipX(vx < 0)
    const onFloor = p.body.onFloor() || p.body.blocked.down
    if (jumpEdge && onFloor) { p.setVelocityY(-780); this.dust.explode(8, p.x, p.y + p.body.halfHeight) }
    if (!jumpHeld && p.body.velocity.y < -260) p.setVelocityY(-260)
    if (this._wasAir && onFloor) this.dust.explode(9, p.x, p.y + p.body.halfHeight); this._wasAir = !onFloor
    if (!onFloor) p.play('p_jump', true); else if (vx !== 0) p.play('p_run', true); else p.play('p_idle', true)
    const facing = p.flipX ? -1 : 1, targetX = p.x - facing * 92, dx = targetX - l.x, dist = Math.abs(dx); let lvx = 0; if (dist > 14) { lvx = Phaser.Math.Clamp(dx * 5, -300, 300); if (dist > 240) lvx = Math.sign(dx) * 380 }
    l.setVelocityX(lvx); if (Math.abs(lvx) > 8) l.setFlipX(lvx < 0); const leoFloor = l.body.onFloor() || l.body.blocked.down; if (leoFloor && (p.y < l.y - 70) && dist < 170) l.setVelocityY(-720)
    if (Math.abs(lvx) > 30) l.play('l_walk', true); else l.play('l_idle', true)
    this.syncFollowers()
    let near = null, best = 140; for (const o of this.interactables) { const ddx = Math.abs(o.data.wx - p.x), ddy = Math.abs(o.data.wy - p.y); if (ddx < best && ddy < 210) { best = ddx; near = o } }
    const newId = near ? near.data.id : null; if (newId !== st.activeObjectId) st.setActiveObject(newId)
    if (near) { this.prompt.setVisible(true); this.prompt.x = near.data.wx; this.prompt.y = near.data.topY - 30 } else this.prompt.setVisible(false)
    if (interactEdge && near) st.openPanel(near.data.id)
  }

  syncFollowers() {
    const p = this.player, l = this.leo
    this.pShadow.setPosition(p.x, p.y + p.body.halfHeight + 2); this.lShadow.setPosition(l.x, l.y + l.body.halfHeight + 1)
    this.nameTag.setPosition(p.x, p.y - p.body.halfHeight - 6); this.rankTag.setPosition(p.x, p.y - p.body.halfHeight - 19); this.leoTag.setPosition(l.x, l.y - l.body.halfHeight - 4)
  }
}
