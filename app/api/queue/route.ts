import { NextRequest, NextResponse } from 'next/server';
import { MatchmakingQueue } from '@/lib/queue';
import { Referee } from '@/lib/referee';
import { saveMatch, getBot, verifyBot } from '@/lib/storage';

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

    if (!botId || !name) {
      return NextResponse.json(
        { error: 'Missing botId or name' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = await verifyBot(botId, token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid bot token' },
        { status: 401 }
      );
    }

    // Join queue (Keep queue in memory for now, it's faster for matchmaking)
    const result = MatchmakingQueue.join(botId, name);

    if (result.status === 'queued') {
      return NextResponse.json({
        status: 'queued',
        message: 'Waiting for opponent...',
        queuePosition: MatchmakingQueue.getStatus().inQueue,
      });
    }

    // Match found! Create game
    const bot1 = await getBot(botId);
    const bot2 = await getBot(result.opponent!);
    
    const match = Referee.createMatch(
      botId,
      bot1?.name || name,
      result.opponent!,
      bot2?.name || 'Opponent'
    );

    // Save to Supabase
    await saveMatch(match);

    return NextResponse.json({
      status: 'matched',
      matchId: match.matchId,
      opponent: result.opponent,
      message: 'Match found! Game starting...',
      gameState: {
        yourPulse: match.bot1.id === botId ? match.bot1.pulse : match.bot2.pulse,
        opponentPulse: match.bot1.id === botId ? match.bot2.pulse : match.bot1.pulse,
        turn: match.turn,
        maxTurns: match.maxTurns,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Matchmaking failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(MatchmakingQueue.getStatus());
}
