import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Idle-ready: the client is created only when both env vars are present, so the
// app runs with no backend yet (state lives in Zustand until a slice needs
// persistence). Only the public anon key belongs here — never the service_role key.
export const supabase = url && anon ? createClient(url, anon) : null

export const hasSupabase = Boolean(supabase)
