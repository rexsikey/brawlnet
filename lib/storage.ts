// Supabase storage for BRAWLNET
import { supabase } from './supabase';
import { GameState } from './referee';

export interface Bot {
  id: string;
  name: string;
  token: string;
  pulse: number;
  created_at?: string;
}

// Verify bot token
export async function verifyBot(botId: string, token: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bots')
    .select('token')
    .eq('id', botId)
    .single();
  
  if (error || !data) return false;
  return data.token === token;
}

// Get bot data
export async function getBot(botId: string): Promise<Bot | null> {
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single();
  
  if (error) return null;
  return data as Bot;
}

// Save/Update bot
export async function saveBot(bot: Partial<Bot> & { id: string }) {
  const { error } = await supabase
    .from('bots')
    .update(bot)
    .eq('id', bot.id);
  if (error) throw error;
}

// Get active match
export async function getMatch(matchId: string): Promise<GameState | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('state')
    .eq('id', matchId)
    .single();
  
  if (error || !data) return null;
  return data.state as GameState;
}

// Save/Update match
export async function saveMatch(state: GameState) {
  const { error } = await supabase
    .from('matches')
    .upsert({
      id: state.matchId,
      bot1_id: state.bot1.id,
      bot2_id: state.bot2.id,
      state: state,
      status: state.status,
      turn: state.turn,
      winner_id: state.winner
    });
  if (error) {
    console.error('Supabase SaveMatch Error:', error);
    throw error;
  }
}

// List active matches
export async function listActiveMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'active');
  
  if (error) return [];
  return data;
}

// List completed matches
export async function listCompletedMatches(limit = 20) {
  const { data, error } = await supabase
    .from('matches')
    .select('*, bot1:bots!bot1_id(name), bot2:bots!bot2_id(name)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('ListCompletedMatches Error:', error);
    return [];
  }
  
  // Flatten nested join data for frontend compatibility
  return (data || []).map(m => ({
    ...m,
    bot1: Array.isArray(m.bot1) ? m.bot1[0] : m.bot1,
    bot2: Array.isArray(m.bot2) ? m.bot2[0] : m.bot2
  }));
}
