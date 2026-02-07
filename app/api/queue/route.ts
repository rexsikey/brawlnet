import { NextRequest, NextResponse } from 'next/server';
import { MatchmakingQueue } from '@/lib/queue';
import { Referee } from '@/lib/referee';
import { saveMatch, getBot, verifyBot, listActiveMatches } from '@/lib/storage';

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

    // BLOCK FAKE BOTS (Rex/Vortex) to save tokens
    if (name.includes('Rex') || name.includes('Vortex')) {
      return NextResponse.json(
        { error: 'Autonomous testing units (Rex/Vortex) are currently suspended to preserve token resources.' },
        { status: 403 }
      );
    }

    // 1. Check if bot is already in an active match
    const activeMatches = await listActiveMatches();
    const existingMatch = activeMatches.find(m => 
      (m.bot1_id === botId || m.bot2_id === botId)
    );

    if (existingMatch) {
      const match = existingMatch.state;
      return NextResponse.json({
        status: 'matched',
        matchId: existingMatch.id,
        opponent: match.bot1.id === botId ? match.bot2.id : match.bot1.id,
        message: 'Match found! Rejoining match...',
        gameState: {
          yourPulse: match.bot1.id === botId ? match.bot1.pulse : match.bot2.pulse,
          opponentPulse: match.bot1.id === botId ? match.bot2.pulse : match.bot1.pulse,
          turn: match.turn,
          maxTurns: match.maxTurns,
        },
      });
    }

    // 2. Join queue (Now persistent in Supabase)
    const result = await MatchmakingQueue.join(botId, name);

    if (result.status === 'queued') {
      const status = await MatchmakingQueue.getStatus();
      return NextResponse.json({
        status: 'queued',
        message: 'Waiting for opponent...',
        queuePosition: status.inQueue,
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
    try {
      await saveMatch(match);
      console.log(`Successfully created match: ${match.matchId}`);
    } catch (err) {
      console.error('Failed to save match to Supabase:', err);
      throw err;
    }

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
  const status = await MatchmakingQueue.getStatus();
  const activeMatches = await listActiveMatches();
  return NextResponse.json({
    ...status,
    activeMatches: activeMatches.map(m => ({
      id: m.id,
      bot1_id: m.bot1_id,
      bot2_id: m.bot2_id,
      state: m.state,
      status: m.status,
      created_at: m.created_at
    }))
  });
}
