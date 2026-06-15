import { create } from 'zustand'
import { type Character, type Theme, computeTheme } from '../game/data'
import { loadLocalCharacter } from '../lib/profile'

export type InputKey = 'left' | 'right' | 'jump' | 'interact'

// The bridge between React (UI) and Phaser (world). React reads/writes via the
// hook; the Phaser scene reads/writes via useGame.getState() / .subscribe().
export type GameState = {
  creating: boolean
  mode: 'owner' | 'visitor'
  character: Character
  panelId: string | null // open conversation drawer, null = closed
  activeObjectId: string | null // nearby interactable (drives the E prompt / touch button)
  input: Record<InputKey, boolean> // touch/virtual input the scene polls
  charFrames: string[] // South-row data URLs from composeChar (preview + portrait)
  theme: Theme
  setCharacter: (patch: Partial<Character>) => void
  enterWorld: () => void
  openPanel: (id: string) => void
  closePanel: () => void
  setInput: (k: InputKey, v: boolean) => void
  setActiveObject: (id: string | null) => void
  setCharFrames: (f: string[]) => void
}

const isGuest = /[?&](guest|visitor)/i.test(location.search)

const DEFAULT_CHARACTER: Character = { name: 'Soul', rank: 'Wanderer', body: 'male', hair: 'plain', haircolor: 'brown', eyes: 'brown', weapon: 'none' }
// owners hydrate from the local cache instantly; guests always start fresh (ephemeral)
const initialCharacter: Character = { ...DEFAULT_CHARACTER, ...(isGuest ? {} : loadLocalCharacter() || {}) }

export const useGame = create<GameState>((set) => ({
  creating: true,
  mode: isGuest ? 'visitor' : 'owner',
  character: initialCharacter,
  panelId: null,
  activeObjectId: null,
  input: { left: false, right: false, jump: false, interact: false },
  charFrames: [],
  theme: computeTheme(),
  setCharacter: (patch) => set((s) => ({ character: { ...s.character, ...patch } })),
  enterWorld: () => set({ creating: false }),
  openPanel: (id) => set({ panelId: id }),
  closePanel: () => set({ panelId: null, input: { left: false, right: false, jump: false, interact: false } }),
  setInput: (k, v) => set((s) => ({ input: { ...s.input, [k]: v } })),
  setActiveObject: (id) => set({ activeObjectId: id }),
  setCharFrames: (f) => set({ charFrames: f }),
}))

// dev-only: expose the store for debugging from the browser console
if (import.meta.env.DEV) (window as unknown as { __g: typeof useGame }).__g = useGame
