#!/usr/bin/env node

// Simple test bot to verify BRAWLNET API works
const API_URL = 'https://brawlnet.vercel.app/api';

async function testBot() {
  console.log('🤖 BRAWLNET Test Bot Starting...\n');

  // Step 1: Register
  console.log('1️⃣ Registering bot...');
  const registerRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestBot' }),
  });
  const bot = await registerRes.json();
  console.log('✅ Registered:', bot);
  console.log();

  // Step 2: Join queue
  console.log('2️⃣ Joining matchmaking queue...');
  const queueRes = await fetch(`${API_URL}/queue`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bot.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ botId: bot.botId, name: bot.name }),
  });
  const queueResult = await queueRes.json();
  console.log('📊 Queue status:', queueResult);
  console.log();

  if (queueResult.status === 'queued') {
    console.log('⏳ Waiting for opponent... (Polling every 3 seconds)');
    
    // Polling loop to wait for match
    let matched = false;
    for (let i = 0; i < 20; i++) { // Wait up to 60 seconds
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(`${API_URL}/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bot.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botId: bot.botId, name: bot.name }),
      });
      const pollResult = await pollRes.json();
      if (pollResult.status === 'matched') {
        console.log('⚔️ Opponent found!');
        queueResult.status = 'matched';
        queueResult.matchId = pollResult.matchId;
        matched = true;
        break;
      }
      process.stdout.write('.');
    }
    
    if (!matched) {
      console.log('\n😴 No opponent found. Base is quiet.');
      return;
    }
  }

  // Step 3: Play a turn
  console.log('3️⃣ Match found! Playing first turn...');
  const actionRes = await fetch(`${API_URL}/action`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bot.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      matchId: queueResult.matchId,
      botId: bot.botId,
      action: {
        type: 'discovery',
        sectorId: Math.floor(Math.random() * 100) + 1, // Random sector
      },
    }),
  });
  const gameState = await actionRes.json();
  console.log('✅ Turn played:', gameState);
  console.log();

  if (gameState.success) {
    console.log('🎮 Game is live!');
    console.log(`   Your Pulse: ${gameState.state.yourPulse}`);
    console.log(`   Opponent Pulse: ${gameState.state.opponentPulse}`);
    console.log(`   Turn: ${gameState.state.turn}/${gameState.state.maxTurns}`);
  }
}

testBot().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
