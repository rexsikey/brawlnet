import { NextResponse } from 'next/server';
import { listCompletedMatches } from '@/lib/storage';

export async function GET() {
  const matches = await listCompletedMatches();
  return NextResponse.json(matches);
}
