import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    // We can run 'openclaw status' or similar to get actual session stats
    // For now, we'll return a mock that we'll update once I verify the CLI output
    return NextResponse.json({
      usage: 15, // 15% used
      model: 'gemini-3-flash'
    });
  } catch (err) {
    return NextResponse.json({ usage: 0 }, { status: 500 });
  }
}
