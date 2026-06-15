# Soulforge

A personal life-RPG habit tracker, built as a 2D side-scrolling game.

**Architecture (locked):** Phaser 3 owns the game world, React owns the DOM/UI
layer (creation screen, conversation drawers, HUD), Zustand bridges the two.
Supabase for data, Vercel for deploy.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Phaser 3** — the game world (`src/game`)
- **Zustand** — shared state / the React↔Phaser bridge (`src/store`)
- **Supabase** — backend, idle until a slice needs persistence (`src/lib/supabase.ts`)

## Run

```bash
npm install
npm run dev        # Vite dev server with HMR
npm run build      # typecheck + production build
npm run typecheck  # types only
```

## Layout

```
public/assets/     Sunny Land (CC0) + LPC (CC-BY-SA) art
reference/         soulforge-slice1.html — the standalone prototype being ported
src/
  game/            Phaser: PhaserGame.tsx mounts the game; scenes/ holds scenes
  store/           Zustand stores (useGame = character + creation state)
  lib/             supabase client
```

## Supabase

Copy `.env.example` to `.env.local` and fill in your **project URL** and the
**anon (public) key** from Project Settings → API. Never put the `service_role`
secret key in the frontend. The app runs fine with these blank — the client
stays idle and state lives in Zustand.

## Credits

- World art: **Sunny Land** by Ansimuz (CC0)
- Character: **Liberated Pixel Cup (LPC)** modular sprites (CC-BY-SA 3.0 / GPL)
