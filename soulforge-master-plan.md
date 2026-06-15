# Soulforge — Master Plan & Architecture

> Single source of truth for the Soulforge 2D life-RPG rebuild. We work the layout and architecture here, then build in slices.

---

## CONTEXT: What is Soulforge?

Soulforge is a personal life-RPG habit tracker. The player IS the main character — their real-life habits, journaling, and completed quests directly level up their in-game stats. It is not fiction; it mirrors the user's actual psychological and lifestyle progress.

The user now wants to rebuild this as a **2D sidescrolling game** where:

- The player physically moves their character left/right through a world
- Leo (their real-life dog) follows as an AI companion
- The world contains interactive objects that map to the game mechanics described below
- Everything that was a "dashboard widget" becomes a **place or object in the world**

---

## ACCESS MODES (Owner vs Visitor)

The app supports two roles, controlled by a single `mode` flag (`'owner' | 'visitor'`) that flows through the entire app. **There is exactly one world — the owner's.** Every interactive element is built once; its panel simply swaps editing affordances on/off based on mode. No parallel apps to maintain. (This reuses the role-gating muscle already built for MensDag's Admin/Member system, just simpler.)

### Owner (the user)
Full control — completes habits, rolls/completes quests, writes journals, edits todos, customizes habits/quests, creates their character once. All actions persist to the backend.

### Visitor
A view-only window into the owner's world. A visitor:
- Creates an **ephemeral cosmetic character** (name + basic look) at session start
- Walks/jumps around the same world and opens the same interactive elements
- Sees the owner's current state — but every editing affordance is hidden/disabled
- Never writes to the owner's data

### Visitor character — ephemeral, client-only (v1)
- Created via the same character-creation flow (name + basic look options)
- Lives in client memory only; **never persisted, never touches the database**
- Purely cosmetic — no stats, no XP, no realm progress, no Leo bond
- Gone on reload / browser close

### World data for visitors — snapshot, not live (v1)
- Visitor loads a **read-only snapshot** of the owner's world as it currently stands
- Visitors walk around alone — they do not see each other or the owner moving in real time
- **Future (out of scope for v1):** live presence — visitors and owner visible to each other, moving in real time. Revisit only if the site gets real traction.

### Per-element privacy toggle
Every interactive element has a `visibleToVisitors` setting the owner controls — decided element-by-element, not one blanket rule. Sensible defaults (owner can override):

| Element | What a visitor sees | Default |
| --- | --- | --- |
| Monument (Stats + Realms views) | Full stat levels, shape & realm progress | Visible |
| Leo Bond Circle | Bond level & title | Visible |
| Habit Shrine | Habit list + today's completion (no checkboxes) | Visible, read-only |
| Quest Board | Active quests + completion state (no roll/complete) | Visible, read-only |
| Level Archive | Full reference (static) | Visible |
| Todo Board | — | **Hidden** (personal) |
| Journal Cave | Cave exists; reflection text hidden | **Text owner-only** |

### How mode is determined
- **Owner** = the authenticated user (Dom).
- **Visitor** = everyone else. v1 uses **anonymous share-link visitors**: open a link, make a character, look around, no signup.

---

## THE PLAYER CHARACTER

**Name**: The player (no fixed name — it's the user themselves) — character is created **one time** via a simple creation screen.

**Character creation options** (kept deliberately simple; the same flow is reused for the visitor's ephemeral character):
- **Name** (text entry)
- **Body**: male / female
- **Hairstyle**: 3 premade options
- **Face**: 3 premade options
- **Weapon of choice**: cosmetic only — picked "for the vibes," never used in gameplay (no combat)
- **Starting clothes**: everyone begins in the basic Tier 1 "Wanderer" outfit; better gear is earned afterward (see Equipment & Gear below)

**Visual**: Pixel art warrior, isometric-style. There are **5 visual tiers** that act as the baseline "rank" look, gated by average stat level. Reaching a tier's avg-level threshold **unlocks** that tier's armor set — it is not forced; the player equips what they've unlocked (see Equipment & Gear).

- **Tier 1 — Wanderer** (avg level 1–2): Brown/tan linen tunic, cloth pants, worn leather boots, wooden walking staff. Messy dark hair.
- **Tier 2 — Apprentice** (avg level 3–4): Leather cap with brim, harness with brass buckles, cross-strap, leather boots. Iron shortsword at side.
- **Tier 3 — Seeker** (avg level 5–6): Chain coif (ring-texture rows), blue gambeson with chainmail, riveted pauldrons. Longsword with blue gem in pommel.
- **Tier 4 — Master** (avg level 7–8): Full plate helm with purple glowing visor, gold trim, dark purple cape. Elaborate pauldrons, greatsword with glowing gems.
- **Tier 5 — Ascendant** (avg level 9–10): Gold helm with purple crystal visor + plume, starfield cape, gold+purple plate with arcane rune lines, legendary gold sword with purple rune line on blade. Entire character emits a purple aura glow.

### EQUIPMENT & GEAR (upgradeable appearance)

Gear is **earned and equippable**, not just an automatic whole-body tier swap. This is the long-term "reward loop" that makes leveling and quests feel visible on the character.

- **Gear slots**: Head, Body (armor), Weapon (cosmetic), Back (cape), Boots. The creation-screen choices (body type, hair, face) are fixed cosmetics under the gear.
- **Two unlock sources**:
  1. **Leveling** — reaching a tier's avg-level threshold unlocks that tier's full **armor set** (the 5 tiers above).
  2. **Quests** — specific quests reward **individual standout pieces or variants** (e.g. a unique cape, a glowing weapon skin, a realm-themed helm). This is what lets gear progress feel earned rather than purely automatic.
- **Equipping**: the owner opens a **Wardrobe / Equipment panel** (accessed from the character menu; could also live as a small armory near home base) and equips any unlocked piece per slot — mix-and-match across sets is allowed. Visitors see the owner's *currently equipped* look, view-only.
- **Realm-themed variants** (nice-to-have): pieces tinted/styled to a realm's color, unlocked by hitting that realm's milestones.
- The character's on-screen sprite is composed from the equipped pieces over the base body, so adding new gear later = adding new piece art, not rewriting the character. (Keeps it iterable.)

**Walk animation**: 4-frame cycle at ~175ms per frame (target 6–8 frames in the MapleStory style; see Visual Design). Left/right leg alternate (opposite to arms), body bobs slightly on frames 1 and 3. Shadow ellipse under feet.

**Stats** (6 total — these level up from real-life habits/quests):

| Stat | Color | Icon | What it represents |
| --- | --- | --- | --- |
| Vitality | #10b981 (green) | ❤ | Physical health, body presence |
| Presence | #3b82f6 (blue) | 👁 | Mental clarity, attention quality |
| Courage | #ef4444 (red) | ⚔ | Risk-taking, authenticity |
| Connection | #06b6d4 (cyan) | 🔗 | Relationships, empathy |
| Creation | #f97316 (orange) | ✨ | Output, making things |
| Peace | #a78bfa (purple) | ☯ | Calm, inner stillness |

**XP & Leveling**:

- XP thresholds: `[0, 21, 41, 61, 81, 101, 131, 161, 201, 250]`
- Level titles (per-stat, 10): Wanderer → Apprentice → Seeker → Creator → Alchemist → Guardian → Mystic → Master → Sage → Ascendant
- **Note:** the per-stat level titles (10 names) are distinct from the 5 character *visual tiers* (Wanderer / Apprentice / Seeker / Master / Ascendant). Two separate systems that happen to share some names.
- Each stat levels independently (1–10)
- "Average level" = sum of all stat levels / 6 → determines character tier
- "Total Power" = sum of all stat levels (max 60)

---

## LEO — THE COMPANION

Leo is the player's real-life black Labrador. He follows the player as a companion in the game world.

**Visual**: Pixel dog (black lab), animated with 4-frame diagonal-pair gait:

- Back-left and front-right legs move together (one diagonal pair)
- Back-right and front-left legs move opposite
- Tail wags side-to-side (4-frame oscillation)
- Body bobs slightly every other frame
- Shadow ellipse under body

**Bond Level system** (separate from player stats, based on Connection stat XP):

- Level 0–3: Gray collar, dim eye
- Level 4–6: Gold collar, faint glow on eye/tag
- Level 7–9: Gold collar, strong glow
- Level 10 (LEGENDARY): Gold aura surrounding Leo, glowing eye, maximum glow on collar

**Bond titles by level**: 0: Distant | 1–2: Acquainted | 3–4: Companions | 5–6: Bonded | 7–8: Soul Bond | 9–10: LEGENDARY

**Leo's XP** increases through: calm walks, play sessions, training, patience-based interactions

**Max Bond perk** ("Mirror of Calm"): Every time Leo stays calm during triggers → +1 Presence XP to the player

**Leo's behavior** mirrors the player's nervous system state — treat him as an emotional mirror in the game.

---

## THE 4 REALMS (a lens over your stats — NOT separate zones)

The realms are **not places in the world.** Each realm is a *lens* over the 6 stats: a pairing of 2 core stats + a psychological loop + a master trait. They are a way of grouping and interpreting your progress, surfaced inside the **Monument's "Realms" view** (see Interactive Elements). The world is a single cozy world; the realms live in the data and in the world's *mood* (see Focus-Realm Theming below), not as four corners you walk to.

> Note: Courage and Connection each appear in two realms (Momentum/Authenticity and Serenity/Authenticity). This overlap is intentional.

### Realm of Embodiment 🔥
- **Color**: #3b82f6 (blue) · **Icon**: Flame
- **Loop**: "Insight Trap" — over-analyzing instead of feeling
- **Core stats**: Presence + Vitality · **Goal**: "Feel > analyze"
- **Master trait (Lv 10)**: "Still Mind, Wild Heart" — emotions no longer control action
- **Mood/flavor** (when in focus): nature light, body-focused energy, warm vitality glow

### Realm of Serenity 🌊
- **Color**: #a78bfa (purple) · **Icon**: Wave
- **Loop**: "Emotional Hero Complex" — taking on everyone else's burdens
- **Core stats**: Peace + Connection · **Goal**: "Peace > chaos"
- **Master trait (Lv 10)**: "Calm is My Power"
- **Mood/flavor** (when in focus): soft lighting, flowing water tones, calm haze

### Realm of Momentum ⚔
- **Color**: #ef4444 (red) · **Icon**: Sword
- **Loop**: "Potential Prison" — endless planning instead of action
- **Core stats**: Creation + Courage · **Goal**: "Act > plan"
- **Master trait (Lv 10)**: "Creator in Motion" — ideas instantly turn into movement
- **Mood/flavor** (when in focus): red embers, forge-glow, charged/active air

### Realm of Authenticity 🎭
- **Color**: #06b6d4 (cyan) · **Icon**: Mask
- **Loop**: "Validation Mirage" — performing for others instead of being real
- **Core stats**: Courage + Connection · **Goal**: "Truth > performance"
- **Master trait (Lv 10)**: "Nothing to Prove"
- **Mood/flavor** (when in focus): cool cyan light, mirror-sheen, stage-like glow

**Realm leveling**: A realm's level = average XP of its 2 core stats, mapped through the same XP threshold table. Each realm levels 1–10 independently. (Stats remain the engine; realms are a derived view.)

### Focus-Realm Theming (how the world feels)
The single world visually **leans into whichever realm is currently "in focus"** — the same world, re-dressed: color-tint layers + a swapped particle emitter + lighting shift matching that realm's mood above. This is the literal payoff of the whole concept: the world *feels* like what you're working on right now.

- **Focus is driven by your active quest** — the quest's mapped realm sets the world's mood. Quests = intention ("this is what I'm working on now"), so this stays responsive and intuitive.
- **Manual override**: the owner can also set the focus realm by hand (e.g. from the Monument's Realms view), independent of the active quest.
- **Why not stats-driven**: stats shift too slowly day-to-day to drive a *mood*, and a "lowest realm = focus" rule risks the world feeling like it's nagging. Quest-driven + manual keeps it earned and in your control.
- **Cheap in Phaser**: tint overlays + particle/lighting swap, not separate maps.

---

## INTERACTIVE WORLD ELEMENTS

The "buildings"/objects the player walks up to and interacts with. Each maps to a dashboard section from the original app. **Each respects its `visibleToVisitors` setting and renders editing affordances only when `mode === 'owner'`** (see Access Modes).

### 1. THE HABIT SHRINE
Daily habit tracker → a shrine/altar visited every day.
- Lists the player's habits (11 defaults, user-customizable)
- Owner checks off each habit → grants XP to related stats. **Visitor**: read-only list + today's completion state, no checkboxes.
- Visual completion state changes appearance (lights up, glows)
- Habit types: Physical (green) / Emotional (purple) / Mental (blue) / Relational (cyan)
- Each habit links to 1–2 stats and grants 2–5 XP per completion

### 2. THE QUEST BOARD
Side-quest roller (3 tiers) → a board in the town square/crossroads.
- Three slots: Daily (purple), Weekly (cyan), Monthly/BOSS (red)
- Owner can "roll" (randomize) a quest from the pool; completing distributes XP equally to the realm's core stats. **Visitor**: sees active quests + completion, no roll/complete.
- XP rewards: Daily 3–5 | Weekly 10–20 | Monthly/BOSS 35–50 (corresponding stats get XP)
- Some quests (especially Weekly/BOSS) also reward a **gear piece or variant** that unlocks in the Wardrobe (see Equipment & Gear).

### 3. THE JOURNAL CAVE / REFLECTION POOL
Daily journal → a reflective cave/campfire/pool.
- Owner writes a free-text daily reflection + one memorable-moment field; shows today's completed habits alongside.
- **Past reflections are shown as a large book** the player can open and **flip through** page by page (one day per spread/page, in date order). The book is the in-world home for the journal archive, not just the writing box.
- Data stored per-day (YYYY-MM-DD). May feed future AI loop detection / XP suggestions.
- **Visitor (default)**: the cave is visible as a place, but reflection text is owner-only — i.e. the book is present but visitors can't read/flip its pages. As with every element, this follows the owner's `visibleToVisitors` toggle, so the owner can choose to make the reflections (and the flip-through book) public if they want.

### 4. THE MONUMENT (Stats + Realms — one landmark, two views)
A single central monument/obelisk at the heart of the world — *this is "you."* It has two tabbed views of the same underlying data (the 6 stats, and the 4 realm pairings of those stats):

**View 1 — Stats (the hexagon):**
- Hexagonal SVG radar, 6 vertices (one per stat), filled polygon of current level ratios
- Stat vertex dots glow in their color; axis labels VIT / PRE / COU / CON / CRE / PEA; grid rings at 20/40/60/80/100%

**View 2 — Realms (the detailed look):**
- The 4 realms shown together as four faces/arcs (replaces the old 4 separate corner towers)
- Each shows: realm name + icon, its circular progress ring, loop name, goal, master trait, and its 2 core stats
- At realm Lv 10 the face "ascends" visually and the master trait is marked unlocked

- **Visitor**: fully visible by default (both views).

> Why merged: the hexagon *is* you (6 stats); the realms are just those same stats grouped into pairs with a psychological lens over them. Same data, two resolutions — so it's one landmark, not two.

### 5. THE LEO BOND CIRCLE
Leo's bond ring → a special spot (dog bed / campfire) where Leo and player share a moment.
- Circular progress ring + 10 tick marks to current bond level; current title and XP-to-next; level number centered
- **Visitor**: fully visible by default.

### 6. THE TODO BOARD
"Today's Tasks" checklist → a small noticeboard / personal logbook.
- Owner adds/checks/edits/deletes daily tasks (freeform); shows completion count (e.g. 3/5); not connected to XP
- **Visitor (default)**: hidden (personal).

### 7. THE LEVEL ARCHIVE
LevelInfoDrawer → a library/archive building with a door you can enter.
- Full level table (Lv 1–10, XP ranges, unlocks); per-realm mastery cards (loop, goal, master trait, core-stat breakdown); Leo bond info
- **Visitor**: fully visible (static reference).

> **Element staging** (object-in-world vs room-you-enter) is a per-element choice independent of everything else. The Journal Cave leans toward being its own little *room/sub-area* you enter; the Monument, Shrine, Quest Board etc. are objects out in the main world. We finalize staging per element as we build.

---

## XP & PROGRESSION CONNECTIONS

```
Real-world action (OWNER only — visitors never write)
      ↓
Habit completion → stat_xp table (per-stat override) → stat.total_xp += XP
Quest completion → xp_reward / core_stats.length → each core stat += XP
Journal entry   → no direct XP (feeds AI loop detection)
Leo interaction → connection_stat.total_xp += XP (if habit-linked)
                                     ↓
                          stat.total_xp drives:
                            - stat level (getLevel)
                            - stat progress % (getLevelProgress)
                            - XP to next level (getXPToNextLevel)
                                     ↓
                    avg level across all stats → character visual tier (1–5)
                    sum of stat levels → "Total Power" display
                    realm core stat average → realm level (independent per realm)
                    connection stat → leo bond level
```

---

## TECH / RENDERING ARCHITECTURE

**Decision (Dom delegated the call): hybrid — Phaser 3 for the game world + React/DOM for all UI panels & HUD.**

Reasoning: this is a real 2D platformer that needs to *feel* good (smooth camera follow, gravity/jumping, parallax, sprite animation, particles, Leo's follow AI) and that Dom wants to **keep iterating on for a long time**, with Claude doing all the coding. A purpose-built 2D engine is the right tool for that job — building physics, collision, and a camera by hand in plain React/CSS would mean reinventing an engine and getting messier as the world grows. **Phaser 3** specifically: mature, extremely well-documented (so it's well-supported when Claude writes it), with built-in arcade physics, smooth cameras, tilemaps, animation, and particles.

The interaction panels (Habit Shrine, Quest Board, the flip-through journal book, Stat Hexagon SVG, Wardrobe, etc.) and the HUD are essentially rich web UI — those stay as **React/DOM/SVG overlaid on top of the Phaser canvas**. This is a standard, clean pattern: Phaser owns the world, React owns the windows. Best of both, and each half stays easy to iterate without touching the other.

**Stack**: React + Phaser 3 (game canvas) + DOM/SVG overlays, deployed on **Vercel**, data in **Supabase**. Zustand bridges game state and UI.

**The one tradeoff to be aware of** (this reverses my earlier lean toward plain React+CSS — the deciding factor there was "your comfort zone," which no longer applies since you're not hand-coding):
- For our **slice-by-slice prototyping here**, the world prototypes will run as **HTML artifacts** loading Phaser from a CDN, with the panels built as DOM overlays. That's a small departure from the React-artifact flow you used for MensDag, and there's a light **porting step** when we assemble the production React + Phaser app on Vercel. The prototype code is written to port cleanly, so this is minor — just worth knowing it's not a one-click copy from artifact to production.

---

## TIME & DAILY RESET

- **Timezone anchor: Europe/Amsterdam.** Everything time-based uses Amsterdam local time regardless of where a visitor is.
- **Daily reset at local midnight (Amsterdam).** At reset: habit checkmarks clear and the daily quest slot refreshes. **XP accumulates forever** — only the daily completion state resets. Weekly/monthly quests roll on their own cadence; todos are manual (no auto-reset).
- **Day/night sky** follows Amsterdam time (see Visual Design), as do **seasonal** sky changes.
- **In-game clock on the HUD**: show the current Amsterdam time + day/season indicator somewhere on screen, clearly labelled (e.g. "Soulforge time · Amsterdam"), so international visitors understand why it's night/winter in the world even if it's daytime where they are.

---



**Backend**: Supabase (PostgreSQL). **RLS enabled** (changed — see below).

**Roles**:
- **Owner**: authenticated user. Only the owner can write any world row.
- **Visitor**: anonymous. Read-only access to owner world rows flagged visible; **visitor characters never hit the database** (client memory only).

**RLS policy shape**:
- Public/anon **read** on owner world rows (respecting per-element `visibleToVisitors`)
- **Write** restricted to the authenticated owner

**User ID**: owner identified by auth (replaces the old hardcoded `'player'` single-user assumption).

**Tables**:
- `stats` — one row per stat (6 rows), `total_xp` accumulates forever
- `habits` — habit definitions with `related_stats[]` and `base_xp`
- `quests` — pool of quests with `type`, `xp_reward`, `realm_id`, `is_active`
- `daily_logs` — one row per day, `reflection` text, `completed_habits[]`
- `todos` — checklist items linked to `daily_log_id`
- `realms` — 4 static realm rows with `core_stats[]`, `loop_name`
- `leo_bond` — single row tracking `total_xp` for Leo
- `element_visibility` *(new)* — per-element `visibleToVisitors` flags, owner-controlled
- `character` *(new)* — owner's creation choices (body, hairstyle, face, weapon, name)
- `gear` *(new)* — catalog of gear pieces with `slot`, `unlock_source` (level/quest), `unlock_ref` (tier or quest id), realm tint
- `equipment` *(new)* — owner's unlocked pieces + currently equipped piece per slot

**Prototype note**: inside the artifact preview there is no Supabase/localStorage — the prototype runs on **in-memory state**. Persistence is wired up when moving to the real Vercel + Supabase deployment.

**State management**: Zustand store (`useGameStore`) — mirrors all DB tables in memory, optimistic updates on habit/quest actions, plus the `mode` flag and (ephemeral) visitor character.

---

## VISUAL DESIGN LANGUAGE

**Primary inspiration: MapleStory** — classic 2D sidescrolling MMORPG.

### MapleStory-inspired style
- **Bright, saturated colors** — vivid greens, blues, purples, warm yellows; alive and cheerful even in darker zones
- **Chibi-style characters** — larger head proportions, expressive, cute and characterful
- **Layered parallax backgrounds** — distant sky/clouds slowest, midground medium, foreground fastest
- **Rich environment tiles** — textured ground (grass tops, stone, planks), platforms with depth, decorative flowers/lanterns/particles/small animals
- **Soft ambient glow** — elements emit soft colored light; portals swirl; interactive objects pulse gently
- **Name tags / floating UI** — floating labels above interactive objects; player name floats above character
- **Smooth pixel animations** — idle (breathing/bob), separate walk/run, jump arc with squash-and-stretch on landing
- **UI panels** — MapleStory inventory/quest-window feel: rounded corners, soft gradients, decorative borders, tabs

### Color palette
- **Sky**: changes with real-time **season** (winter/summer/fall/spring) and **time** (day/night), anchored to **Amsterdam time** (see Time & Daily Reset)
- **Ground**: rich earthy tones, stone grays, pixel grass tops
- Stat/realm colors preserved (green, blue, red, cyan, orange, purple) and used in environment lighting, not just UI
- **Gold accent `#f59e0b`** — XP pickups, important UI, Leo's collar glow
- Each realm corner bleeds its color into the local environment (blue mist, red embers, etc.)

### Fonts
- **"Press Start 2P"** — game-world labels, level numbers, stat abbreviations
- **"VT323"** — retro terminal font for UI panel body text
- Optional rounded pixel font for names/tooltips

### Character art
- Player: chibi proportions (head ~40% of total height), enough detail to read gear/face
- Leo: proportional as a pet to the player
- Aim 6–8 walk frames + separate idle/jump/land; soft drop shadow

### Interactive element style
- Each looks like a MapleStory NPC/object: distinct silhouette, idle animation, glow when player is near
- A floating "!" or "E" prompt above the object when interactable
- Opening an interaction dims the world slightly and brings up a styled panel (full-screen modal on mobile)

---

## WHAT THE NEW PROJECT SHOULD DO

A **2D platformer-style game world** where:

1. **The player moves** left/right AND jumps between platforms (arrow keys / WASD + Space)
2. **Leo follows** automatically behind the player (companion AI mirroring movement with slight delay)
3. **World contains all 7 interactive elements** placed logically across the map
4. **Interaction system**: walk/jump near an element → press E → opens an overlay/panel (respecting mode + visibility)
5. **Character visually upgrades** as real stat levels increase (5 tiers) and via equipped gear
6. **Leo visually upgrades** as bond level increases (glow tiers)
7. **The world responds** to progress — it re-tints to the current focus realm's mood (driven by active quest / manual override)
8. **All owner XP/data persists** to Supabase (visitors never write)
9. **Same pixel art aesthetic** — retro, glowing, CRT feel, MapleStory-bright

Not a combat game — exploration and interaction. The "gameplay" is real-life habit tracking, journaling, and quests. The world is a visual metaphor for the player's inner life.

---

## WORLD MAP LAYOUT

A **single self-contained cozy map** — NOT an endless runner. A compact RPG village/landscape spanning a few screens, using vertical space + platforms so it feels rich without sprawling.

```
                       [THE MONUMENT]
                        ⬡ (central peak — Stats / Realms)
                     ~~~high platform~~~
                            |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  ← mid-level ground
  [JOURNAL CAVE]    [LEO SPOT]   [HABIT SHRINE]   [QUEST BOARD]
   🌑 room/below    🐾 (home)      🕯 (near mid)    📋 (town center)
      ↓ enter         |                              |
  (its own room)   [TODO BOARD]               [LEVEL ARCHIVE]
                    📝 (small)                  📚 (building)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  ← ground level

  ( whole world re-tinted to the FOCUS realm's mood — see Focus-Realm Theming )
```

### Placement logic
- **Center/high ground**: the Monument on the highest central platform — the world's "heart" (Stats + Realms in one), reached by jumping up. No more four corner towers — the realms live inside it.
- **Ground / town center**: Quest Board + Habit Shrine (most-visited daily); Leo's spot nearby = home base
- **Lower / room**: Journal Cave as its own little room/sub-area you enter (tunnel/cave mouth or doorway) — reflective, private
- **Small spots**: Todo Board near home base; Level Archive is a building with a door near town center

### World feel
- Cozy village/camp, not intimidating; stars/night sky in background
- The **whole world's color/atmosphere shifts to match the current focus realm** (not four fixed corners) — see Focus-Realm Theming
- Platforms = solid pixel blocks, floating stones, wooden walkways
- Fits within ~2–3 screen widths × ~2 screen heights; camera follows the player smoothly

---

## MOBILE / RESPONSIVE REQUIREMENTS

Must work on desktop and mobile.

**Desktop** (wide):
- Move: arrows / WASD · Jump: Space or Up · Interact: E when near an element
- Game viewport fills the window; camera follows the player

**Mobile** (≤768px):
- Layout splits vertically — **top**: game map fills most of the height (camera follows player); **bottom**: always-visible touch control bar
- Controls (standard mobile-game layout): **left** ← → move buttons; **left/center** ↑ jump; **right** ⬡/"!" interact (active when near an element)
- Buttons large (min 56×56px), semi-transparent, pixel-styled; fixed at bottom as the map scrolls
- All interaction panels open as **full-screen modals**
- Interactive elements show a tap indicator floating above when the player is near

**Breakpoint**: ≤768px = mobile touch controls; above = keyboard.

> HUD note: the in-game Amsterdam clock + day/season indicator (see Time & Daily Reset) lives in a corner of the HUD on both desktop and mobile.

---

## APPENDIX — DEFAULT CONTENT (seeded; owner-editable in-app)

These are sensible defaults so the world isn't empty. Since habits and quests are user-customizable in-app, Dom edits/replaces these freely later.

### Default habits (11)
XP rule: a habit's `base_xp` is **split across its linked stats** (rounded), unless a per-stat `stat_xp` override is set. Types → color: Physical (green) / Emotional (purple) / Mental (blue) / Relational (cyan).

| Habit | Type | Linked stat(s) | base_xp |
| --- | --- | --- | --- |
| Exercise / move body | Physical | Vitality | 4 |
| No phone in bedroom | Mental | Presence | 3 |
| Journal & self-reflect | Emotional | Peace, Presence | 4 |
| No alcohol | Physical | Vitality, Peace | 3 |
| Create something | Mental | Creation | 4 |
| Walk with Leo | Relational | Connection, Peace | 3 |
| Meditate / breathwork | Emotional | Peace | 3 |
| Reach out to someone | Relational | Connection | 3 |
| Cold shower / face discomfort | Physical | Courage, Vitality | 3 |
| Read / learn | Mental | Presence | 2 |
| Do one scary thing / speak up | Emotional | Courage | 4 |

(Touches all 6 stats; "Walk with Leo" also feeds Leo's bond XP.)

### Starter quest pool
Quest XP splits equally across the mapped realm's 2 core stats. Realm → core stats: Embodiment = Presence+Vitality · Serenity = Peace+Connection · Momentum = Creation+Courage · Authenticity = Courage+Connection.

**Daily (3–5 XP)**: Speak first in a group (Authenticity) · Move body 10 min (Embodiment) · Say no to a request (Authenticity) · Walk with Leo (Serenity) · Send something incomplete (Momentum) · 5 minutes of stillness (Serenity)

**Weekly (10–20 XP)**: Do one scary social thing (Authenticity) · Complete a long-delayed task (Momentum) · Have an honest conversation (Authenticity) · A phone-light day (Embodiment) — *may reward a gear piece*

**Monthly / BOSS (35–50 XP)**: Write your loop origin story (Serenity) · 7-day habit streak (Embodiment) · 30-day Leo walk challenge (Serenity) · Ship something imperfect & public (Momentum) — *rewards a standout gear piece/variant*

---

## BUILD ROADMAP (slices)

> Filled in as we go. Each slice should be independently playable/testable. Architecture is now locked (Phaser + React/DOM, Amsterdam time, gear system, access modes).

- **Slice 1 —** _(TBD with Dom)_
- **Slice 2 —** …
