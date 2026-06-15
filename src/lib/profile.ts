import { supabase } from './supabase'
import type { Character } from '../game/data'

// Character persistence. Prefers Supabase when a `profiles` table exists; otherwise
// (and as an instant local cache) uses localStorage. Owner mode only — guests are
// ephemeral. Real auth comes in a later slice; for now the owner is a generated id.

const LS_OWNER = 'sf_owner_id'
const LS_CHAR = 'sf_character'

export function getOwnerId(): string {
  let id = localStorage.getItem(LS_OWNER)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(LS_OWNER, id) }
  return id
}

// Synchronous local read — used to hydrate the store instantly on boot.
export function loadLocalCharacter(): Partial<Character> | null {
  try {
    const raw = localStorage.getItem(LS_CHAR)
    return raw ? (JSON.parse(raw) as Partial<Character>) : null
  } catch {
    return null
  }
}

// Async load: prefer Supabase (when the table exists), fall back to the local cache.
export async function loadProfile(): Promise<Partial<Character> | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('character').eq('id', getOwnerId()).maybeSingle()
      if (!error && data?.character) return data.character as Partial<Character>
    } catch {
      /* table missing / offline — fall through to local */
    }
  }
  return loadLocalCharacter()
}

// Save to localStorage immediately + best-effort Supabase upsert (no-op until the table exists).
export function saveProfile(character: Character): void {
  try { localStorage.setItem(LS_CHAR, JSON.stringify(character)) } catch { /* ignore quota */ }
  if (supabase) {
    void supabase
      .from('profiles')
      .upsert({ id: getOwnerId(), character, updated_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.debug('[profile] Supabase save skipped:', error.message) })
  }
}

/*
  To activate Supabase persistence (until then localStorage is used), run this once
  in the Supabase SQL editor. The policy is permissive because there is no auth yet —
  tighten it to `auth.uid()` when real accounts land:

    create table public.profiles (
      id uuid primary key,
      character jsonb not null,
      updated_at timestamptz default now()
    );
    alter table public.profiles enable row level security;
    create policy "anon all" on public.profiles
      for all to anon using (true) with check (true);
*/
