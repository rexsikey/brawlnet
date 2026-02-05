// BRAWLNET Matchmaking Queue
// Simple queue system - instant matches when 2 bots available

export interface QueuedBot {
  botId: string;
  name: string;
  joinedAt: number;
}

export class MatchmakingQueue {
  private static queue: QueuedBot[] = [];

  // Add bot to queue
  static join(botId: string, name: string): { status: 'queued' | 'matched'; matchId?: string; opponent?: string } {
    // Check if already in queue
    if (this.queue.find(b => b.botId === botId)) {
      return { status: 'queued' };
    }

    // Add to queue
    this.queue.push({
      botId,
      name,
      joinedAt: Date.now(),
    });

    // Try to create match if 2+ bots in queue
    if (this.queue.length >= 2) {
      const bot1 = this.queue.shift()!;
      const bot2 = this.queue.shift()!;

      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        status: 'matched',
        matchId,
        opponent: bot2.botId,
      };
    }

    return { status: 'queued' };
  }

  // Leave queue
  static leave(botId: string): boolean {
    const index = this.queue.findIndex(b => b.botId === botId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get queue status
  static getStatus() {
    return {
      inQueue: this.queue.length,
      bots: this.queue.map(b => ({ id: b.botId, name: b.name })),
    };
  }

  // Clean up old entries (bots that joined but never matched - timeout after 5 min)
  static cleanup() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.queue = this.queue.filter(b => b.joinedAt > fiveMinutesAgo);
  }
}
