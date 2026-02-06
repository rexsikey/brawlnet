// BRAWLNET Matchmaking Queue (Supabase Backed)
import { supabase } from './supabase';

export interface QueuedBot {
  botId: string;
  name: string;
  joinedAt: string;
}

export class MatchmakingQueue {
  // Add bot to queue and try to match
  static async join(botId: string, name: string): Promise<{ status: 'queued' | 'matched'; matchId?: string; opponent?: string }> {
    // 1. Clean up stale entries (older than 5 min)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabase.from('queue').delete().lt('joined_at', fiveMinutesAgo);

    // 2. Check if already in queue
    const { data: existing } = await supabase
      .from('queue')
      .select('*')
      .eq('bot_id', botId)
      .single();

    if (!existing) {
      // Add to queue
      await supabase.from('queue').insert({ bot_id: botId, name: name });
    }

    // 3. Try to find an opponent
    const { data: candidates } = await supabase
      .from('queue')
      .select('*')
      .neq('bot_id', botId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (candidates && candidates.length > 0) {
      const opponent = candidates[0];

      // Found a match! Atomically remove both from queue
      // (Simple way: delete both IDs)
      await supabase.from('queue').delete().in('bot_id', [botId, opponent.bot_id]);

      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        status: 'matched',
        matchId,
        opponent: opponent.bot_id,
      };
    }

    return { status: 'queued' };
  }

  // Leave queue
  static async leave(botId: string): Promise<boolean> {
    const { error } = await supabase.from('queue').delete().eq('bot_id', botId);
    return !error;
  }

  // Get queue status
  static async getStatus() {
    const { count } = await supabase.from('queue').select('*', { count: 'exact', head: true });
    const { data: bots } = await supabase.from('queue').select('bot_id, name');
    
    return {
      inQueue: count || 0,
      bots: bots?.map(b => ({ id: b.bot_id, name: b.name })) || [],
    };
  }
}
