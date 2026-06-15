import { create } from 'zustand'

// The character config — mirrors the prototype's SF.character. Name is the
// chosen name; rank ('Wanderer' = tier 1) is derived from levels/XP later.
export type Character = {
  name: string
  rank: string
  body: 'male' | 'female'
  hair: string
  haircolor: string
  eyes: string
  weapon: string
}

export type GameState = {
  creating: boolean
  mode: 'owner' | 'guest'
  character: Character
  setCharacter: (patch: Partial<Character>) => void
  setCreating: (v: boolean) => void
}

// Zustand is the bridge between React (UI) and Phaser (world): React writes
// here, the Phaser scene subscribes and re-composes the character live.
export const useGame = create<GameState>((set) => ({
  creating: true,
  mode: 'owner',
  character: {
    name: 'Soul',
    rank: 'Wanderer',
    body: 'male',
    hair: 'plain',
    haircolor: 'brown',
    eyes: 'brown',
    weapon: 'none',
  },
  setCharacter: (patch) => set((s) => ({ character: { ...s.character, ...patch } })),
  setCreating: (v) => set({ creating: v }),
}))
