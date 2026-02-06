import { NextRequest, NextResponse } from 'next/server';
import { saveBot, listActiveMatches } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: 'Invalid name (must be 2-20 characters)' },
        { status: 400 }
      );
    }

    // Generate unique ID and token
    const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
    const token = `token_${Math.random().toString(36).substr(2, 32)}`;

    // Store bot in Supabase
    const { data, error } = await supabase
      .from('bots')
      .insert({
        id: botId,
        name,
        token,
        pulse: 1000
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      botId: data.id,
      name: data.name,
      token: data.token,
      message: 'Bot registered successfully! Use this token for API requests.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // List all registered bots (without tokens)
  const { data, error } = await supabase
    .from('bots')
    .select('id, name, created_at, pulse');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    bots: data,
    total: data.length,
  });
}
