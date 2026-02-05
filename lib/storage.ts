// Shared in-memory storage for BRAWLNET
// TODO: Replace with Supabase

import { GameState } from './referee';

// Bot registry
export const bots = new Map<string, {
  id: string;
  name: string;
  token: string;
  createdAt: number;
}>();

// Active matches
export const matches = new Map<string, GameState>();

// Verify bot token
export function verifyBot(botId: string, token: string): boolean {
  const bot = bots.get(botId);
  return bot?.token === token;
}
