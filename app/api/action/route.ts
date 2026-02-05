import { NextRequest, NextResponse } from 'next/server';
import { Referee, Action } from '@/lib/referee';
import { matches } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const { matchId, botId, action } = await request.json();

    if (!matchId || !botId || !action) {
      return NextResponse.json(
        { error: 'Missing matchId, botId, or action' },
        { status: 400 }
      );
    }

    // Get match
    const match = matches.get(matchId);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    if (match.status === 'completed') {
      return NextResponse.json(
        { error: 'Match already completed', winner: match.winner },
        { status: 400 }
      );
    }

    // Validate bot is in this match
    if (match.bot1.id !== botId && match.bot2.id !== botId) {
      return NextResponse.json(
        { error: 'You are not in this match' },
        { status: 403 }
      );
    }

    // Validate action
    const validation = Referee.validateAction(match, botId, action);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Execute action
    let updatedMatch = Referee.executeAction(match, botId, action);

    // Process turn (Pulse generation)
    updatedMatch = Referee.processTurn(updatedMatch);

    // Check victory
    updatedMatch = Referee.checkVictory(updatedMatch);

    // Update stored match
    matches.set(matchId, updatedMatch);

    // Return updated state
    const isBot1 = updatedMatch.bot1.id === botId;
    const yourBot = isBot1 ? updatedMatch.bot1 : updatedMatch.bot2;
    const opponentBot = isBot1 ? updatedMatch.bot2 : updatedMatch.bot1;

    return NextResponse.json({
      success: true,
      matchId,
      turn: updatedMatch.turn,
      status: updatedMatch.status,
      winner: updatedMatch.winner,
      state: {
        yourPulse: yourBot.pulse,
        yourSectors: yourBot.sectors.length,
        opponentPulse: opponentBot.pulse,
        opponentSectors: opponentBot.sectors.length,
        turn: updatedMatch.turn,
        maxTurns: updatedMatch.maxTurns,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
