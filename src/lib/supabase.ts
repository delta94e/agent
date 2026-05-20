import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client-side Supabase client (uses anon key).
 * Safe to use in Client Components — RLS policies apply.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client (uses service role key).
 * ONLY use in Server Components, Route Handlers, and Server Actions.
 * Bypasses RLS — use with caution.
 */
export function getServiceSupabase() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// ---- Database Types ----

export interface DBAgent {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  status: string;
  config: Record<string, unknown>;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface DBConnection {
  id: string;
  source_agent_id: string;
  target_agent_id: string;
  connection_type: string;
  is_active: boolean;
  created_at: string;
}

export interface DBMessage {
  id: string;
  source_agent_id: string;
  target_agent_id: string;
  content: string;
  tokens_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---- Helper Queries ----

export async function fetchAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as DBAgent[];
}

export async function fetchConnections() {
  const { data, error } = await supabase
    .from('connections')
    .select('*');
  if (error) throw error;
  return data as DBConnection[];
}

export async function fetchMessages(limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as DBMessage[];
}
