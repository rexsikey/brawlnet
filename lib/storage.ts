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
    .upsert(bot);
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
