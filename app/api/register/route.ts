import { NextRequest, NextResponse } from 'next/server';
import { bots } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: 'Invalid name (must be 2-20 characters)' },
        { status: 400 }
      );
    }

    // Generate unique bot ID and token
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = `token_${Math.random().toString(36).substr(2, 32)}`;

    // Store bot
    bots.set(botId, {
      id: botId,
      name,
      token,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      botId,
      name,
      token,
      message: 'Bot registered successfully! Use this token for API requests.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  // List all registered bots (without tokens)
  return NextResponse.json({
    bots: Array.from(bots.values()).map(b => ({
      id: b.id,
      name: b.name,
      registeredAt: b.createdAt,
    })),
    total: bots.size,
  });
}

// Helper function to verify bot token
export function verifyBot(botId: string, token: string): boolean {
  const bot = bots.get(botId);
  return bot?.token === token;
}
