// Shared config + helpers used by BOTH the Phaser scene and the React UI.
// Values lifted verbatim from the prototype so nothing about the design changes.

export type Character = {
  name: string
  rank: string
  body: 'male' | 'female'
  hair: string
  haircolor: string
  eyes: string
  weapon: string
}

export type Theme = {
  season: 'winter' | 'spring' | 'summer' | 'autumn'
  tod: 'dawn' | 'day' | 'dusk' | 'night'
  grade: string
  bg: number
  fg: number
  weather: 'snow' | 'fireflies' | 'petals' | 'pollen'
}

// creation options (hairstyles are gender-connected)
export const CREATE = {
  hairMale: ['plain', 'buzzcut', 'flat_top_fade', 'bedhead', 'curly_short', 'afro'],
  hairFemale: ['long', 'bob', 'bangslong', 'bangs', 'plain', 'afro'],
  haircolor: ['brown', 'black', 'blonde', 'auburn', 'silver', 'blue'],
  eyes: ['brown', 'blue', 'green', 'gray'],
  weapon: ['none', 'sword', 'dagger', 'rapier', 'saber', 'axe', 'mace', 'scythe', 'halberd'],
}

// hair recolour ramps (luminance gradient-map: [shadow, mid, highlight])
export const HAIR_RAMP: Record<string, number[][]> = {
  brown: [[58, 38, 20], [122, 82, 40], [182, 132, 76]], black: [[16, 16, 22], [40, 40, 50], [88, 88, 102]],
  blonde: [[120, 86, 30], [214, 170, 72], [250, 230, 156]], auburn: [[78, 24, 16], [166, 54, 30], [216, 112, 72]],
  silver: [[110, 114, 128], [178, 182, 196], [242, 244, 252]], blue: [[22, 42, 92], [50, 96, 178], [130, 178, 238]],
}
export const HAIRSW: Record<string, string> = { brown: '#a8783e', black: '#2a2a32', blonde: '#e6cf86', auburn: '#a8442a', silver: '#c2c6d2', blue: '#3a6ad0' }
export const EYECOL: Record<string, string> = { brown: '#6b4a2a', blue: '#3b6fd0', green: '#3a8a45', gray: '#8a99a8' }
export const SWATCH: Record<string, Record<string, string>> = { eyes: EYECOL, haircolor: HAIRSW }
export const LBL: Record<string, Record<string, string>> = {
  body: { male: 'Male', female: 'Female' },
  hair: { plain: 'Plain', bangs: 'Bangs', bangslong: 'Fringe', long: 'Long', curly_short: 'Curly', bob: 'Bob', afro: 'Afro', buzzcut: 'Buzz', flat_top_fade: 'Fade', bedhead: 'Messy' },
  weapon: { none: 'None', sword: 'Sword', dagger: 'Dagger', rapier: 'Rapier', saber: 'Saber', axe: 'Axe', mace: 'Mace', scythe: 'Scythe', halberd: 'Halberd' },
}
// rank tiers (tied to levels/XP later); each gets its own accent colour. Wanderer = starting tier.
export const RANKS: Record<string, string> = { Wanderer: '#9fb2c9', Apprentice: '#7fd6a8', Seeker: '#6fb4f2', Master: '#c79cf2', Ascendant: '#f6c44a' }
export const rankColor = (r: string) => RANKS[r] || '#9fb2c9'
export function rampColor(L: number, ramp: number[][]) {
  const lo = L < 128 ? ramp[0] : ramp[1], hi = L < 128 ? ramp[1] : ramp[2], t = L < 128 ? L / 128 : (L - 128) / 127
  return [lo[0] + (hi[0] - lo[0]) * t | 0, lo[1] + (hi[1] - lo[1]) * t | 0, lo[2] + (hi[2] - lo[2]) * t | 0]
}

// art = relative path under /assets used for the conversation-drawer element image
export type ObjectMeta = { icon: string; color: string; art: string; title: string; desc: string; meta: string; enter?: boolean }
export const OBJECTS_META: Record<string, ObjectMeta> = {
  journal: { icon: '📖', color: '#7fb8d8', art: 'gandalf/sf/gh_tent.png', title: 'THE JOURNAL TENT', desc: 'Step inside and reflect — write today, then flip back through the pages you’ve lived.', meta: 'Daily reflection + a memorable moment; past entries live here as a book.', enter: true },
  leo: { icon: '🐾', color: '#f6b73c', art: 'gandalf/sf/gh_campfire_still.png', title: 'LEO’S CAMPFIRE', desc: 'Sit a while with Leo by the fire. Calm shared here deepens your bond.', meta: 'Bond level + title; calm moments raise it (→ Presence XP at max).' },
  shrine: { icon: '🕯', color: '#23d18b', art: 'gandalf/sf/gh_house.png', title: 'THE HABIT SHRINE', desc: 'Tend your daily habits at my altar, and a light kindles for each one kept.', meta: '11 starting habits → XP into their linked stats.' },
  monument: { icon: '⬡', color: '#a78bfa', art: 'gandalf/sf/gh_statue.png', title: 'THE MONUMENT', desc: 'Look closer — this monument is <b>you</b>. Everything you become is etched into its stone.', meta: 'Two views within: the 6-stat Hexagon and the 4 Realms.' },
  quest: { icon: '📋', color: '#ffb02e', art: 'sunny/ui/sign.png', title: 'THE QUEST BOARD', desc: 'Take a quest from the board, traveller — a Daily, a Weekly, or a Monthly BOSS.', meta: 'Quest XP splits across its realm’s 2 core stats.' },
  todo: { icon: '📝', color: '#9fb2c9', art: 'gandalf/sf/gh_bunting.png', title: 'TODAY’S TASKS', desc: 'Pin what must happen today. Cross them off as you go — no XP, just clarity.', meta: 'A freeform daily checklist; you reset it yourself.' },
  archive: { icon: '📚', color: '#c9a06a', art: 'sunny/ui/house.png', title: 'THE LEVEL ARCHIVE', desc: 'Enter the archive — every level, threshold, and realm mastery, catalogued.', meta: 'Full Lv 1–10 table, per-realm mastery, and Leo bond reference.', enter: true },
}

/* ---- time/season → sky tint + weather + clock (keeps the world matching reality) ---- */
export function amsNow() {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short', month: 'numeric' }).formatToParts(new Date())
    const g = (t: string) => p.find(x => x.type === t)?.value || ''
    return { hour: parseInt(g('hour'), 10), minute: g('minute'), hh: g('hour'), weekday: g('weekday'), month: parseInt(g('month'), 10) - 1 }
  } catch { return { hour: 12, minute: '00', hh: '12', weekday: '—', month: 5 } }
}
export function computeTheme(): Theme {
  const t = amsNow(), h = t.hour, m = t.month
  const season = (m <= 1 || m === 11) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn'
  const tod = (h >= 5 && h < 8) ? 'dawn' : (h >= 8 && h < 18) ? 'day' : (h >= 18 && h < 21) ? 'dusk' : 'night'
  const GRADE = {
    dawn: 'linear-gradient(180deg,rgba(255,180,150,.16),rgba(120,90,160,.10))',
    day: 'radial-gradient(140% 100% at 50% 22%, rgba(255,255,255,0) 74%, rgba(20,70,100,.10) 100%)',
    dusk: 'linear-gradient(180deg,rgba(255,170,90,.15),rgba(80,50,90,.14))',
    night: 'linear-gradient(180deg,rgba(24,36,86,.26),rgba(14,22,64,.34))',
  }[tod]
  const bg = { dawn: 0xffc6b4, day: 0xffffff, dusk: 0xffc890, night: 0x4f66a4 }[tod]
  const fg = { dawn: 0xffe2d6, day: 0xffffff, dusk: 0xffe6c6, night: 0xb6c4e8 }[tod]
  const weather = (season === 'winter') ? 'snow' : (tod === 'night' || tod === 'dusk') ? 'fireflies' : (season === 'spring' ? 'petals' : 'pollen')
  return { season, tod, grade: GRADE, bg, fg, weather } as Theme
}

/* ---- world geometry ---- full cozy village, all 7 elements placed logically ---- */
export const WORLD = { w: 3200, h: 1400 }
export const GROUND_TOP = 1200
export const SPAWN = { x: 700, y: 1130 } // home base, near Leo's campfire
export const S = 2 // pixel scale
// stepping platforms form a climbable staircase up-right to the Monument's high platform
export const PLATFORMS = [
  { x: 1600, y: 1055, w: 160 }, // step 1 (1520–1680)
  { x: 1810, y: 915, w: 160 },  // step 2 (1730–1890)
  { x: 2020, y: 790, w: 330 },  // Monument platform (1855–2185)
]
// left → right: Journal (secluded) · Leo campfire + Todo (home) · Shrine · climb · Monument (peak) · Quest · Archive
export const INTERACTABLES = [
  { id: 'journal', wx: 430, wy: GROUND_TOP },
  { id: 'leo', wx: 840, wy: GROUND_TOP },
  { id: 'todo', wx: 1100, wy: GROUND_TOP },
  { id: 'shrine', wx: 1500, wy: GROUND_TOP },
  { id: 'monument', wx: 2020, wy: 790 },
  { id: 'quest', wx: 2400, wy: GROUND_TOP },
  { id: 'archive', wx: 2820, wy: GROUND_TOP },
]
// Sunny Land tileset (16px, 25 cols): grass-top tiles 26/28/30, dirt fill 51
export const TILE = { grassL: 26, grass: 28, grassR: 30, dirt: 51 }
