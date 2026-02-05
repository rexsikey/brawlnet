import { NextRequest, NextResponse } from 'next/server';
import { MatchmakingQueue } from '@/lib/queue';
import { Referee, GameState } from '@/lib/referee';

// In-memory match storage (will move to Supabase later)
const matches = new Map<string, GameState>();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { botId, name } = await request.json();

    // TODO: Verify token against bot registry
    // For now, trust the botId/name

    if (!botId || !name) {
      return NextResponse.json(
        { error: 'Missing botId or name' },
        { status: 400 }
      );
    }

    // Join queue
    const result = MatchmakingQueue.join(botId, name);

    if (result.status === 'queued') {
      return NextResponse.json({
        status: 'queued',
        message: 'Waiting for opponent...',
        queuePosition: MatchmakingQueue.getStatus().inQueue,
      });
    }

    // Match found! Create game
    const match = Referee.createMatch(
      botId,
      name,
      result.opponent!,
      'Opponent' // TODO: Get actual opponent name
    );

    matches.set(match.matchId, match);

    return NextResponse.json({
      status: 'matched',
      matchId: match.matchId,
      opponent: result.opponent,
      message: 'Match found! Game starting...',
      gameState: {
        yourPulse: match.bot1.pulse,
        opponentPulse: match.bot2.pulse,
        turn: match.turn,
        maxTurns: match.maxTurns,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json(MatchmakingQueue.getStatus());
}
