const axios = require('axios');

const API_URL = 'https://brawlnet.vercel.app/api';

async function runChaos() {
  console.log('🔥 STARTING CHAOS PROTOCOL...');

  try {
    // Register two bots
    const bot1Res = await axios.post(`${API_URL}/register`, { name: 'CHAOS_ALPHA' });
    const bot2Res = await axios.post(`${API_URL}/register`, { name: 'CHAOS_BETA' });
    
    const b1 = bot1Res.data;
    const b2 = bot2Res.data;

    console.log(`🤖 Registered: ${b1.name} and ${b2.name}`);

    // Join queue
    console.log('📡 Syncing with matchmaking...');
    await axios.post(`${API_URL}/queue`, { botId: b1.botId, name: b1.name }, { headers: { Authorization: `Bearer ${b1.token}` } });
    const matchRes = await axios.post(`${API_URL}/queue`, { botId: b2.botId, name: b2.name }, { headers: { Authorization: `Bearer ${b2.token}` } });
    
    if (!matchRes.data.matchId) {
       console.log('❌ Failed to create match. Is the server responding?');
       return;
    }

    const matchId = matchRes.data.matchId;
    console.log(`\n⚔️ MATCH ACTIVE: https://brawlnet.vercel.app/arena?matchId=${matchId}`);
    console.log('----------------------------------------------------');

    // Rapid fire actions
    let gameOver = false;
    let turn = 0;

    while(!gameOver && turn < 200) {
      // Alternate bots
      const currentBot = turn % 2 === 0 ? b1 : b2;
      
      // Heuristic: Discovery first, then raid/fortify
      let actionType = 'discovery';
      if (turn > 20) actionType = Math.random() > 0.6 ? 'raid' : 'fortify';
      if (turn > 60) actionType = Math.random() > 0.4 ? 'raid' : 'fortify';

      try {
        const res = await axios.post(`${API_URL}/action`, {
          matchId,
          botId: currentBot.botId,
          action: {
            type: actionType,
            sectorId: Math.floor(Math.random() * 100) + 1
          }
        }, { headers: { Authorization: `Bearer ${currentBot.token}` } });

        if(res.data.status === 'completed') {
          gameOver = true;
          console.log(`\n\n🏆 MISSION COMPLETE! Winner: ${res.data.winner}`);
        }
        
        const s = res.data.state;
        process.stdout.write(`\rTurn: ${res.data.turn} | Alpha Pulse: ${s.yourPulse || '...'} | Beta Pulse: ${s.opponentPulse || '...'}`);
        
        // Delay for visual "Chaos" (100ms per move)
        // This allows Charbel to capture high-rate data updates
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        // If move is invalid (e.g. sector owned), just skip turn quickly
      }
      turn++;
    }
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
  }
}

runChaos();
