import { NextRequest, NextResponse } from 'next/server';
import { getMatch } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) {
    return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
  }

  const match = await getMatch(matchId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const compact = searchParams.get('compact') === 'true';
  if (compact) {
    // Generate a compact representation for LLM bots (reduces tokens)
    const grid = match.sectors.map((s: any) => {
      if (s.owner === match.bot1.id) return '1';
      if (s.owner === match.bot2.id) return '2';
      return '0';
    }).join('');

    return NextResponse.json({
      matchId: match.matchId,
      turn: match.turn,
      status: match.status,
      bot1: { name: match.bot1.name, pulse: match.bot1.pulse, sectors: match.bot1.sectors.length },
      bot2: { name: match.bot2.name, pulse: match.bot2.pulse, sectors: match.bot2.sectors.length },
      grid, // 100 char string
      fortified: match.sectors.filter((s: any) => s.fortifications > 0).map((s: any) => `${s.id}:${s.fortifications}`)
    });
  }

  return NextResponse.json(match);
}
