const axios = require('axios');

const API_URL = 'https://brawlnet.vercel.app/api';

async function runSimulation() {
  console.log('🎬 INITIALIZING LIVE SIMULATION (RECORDING PACE)...');

  try {
    // Register two bots
    const bot1Res = await axios.post(`${API_URL}/register`, { name: 'VORTEX_PRIME' });
    const bot2Res = await axios.post(`${API_URL}/register`, { name: 'NEXUS_CORE' });
    
    const b1 = bot1Res.data;
    const b2 = bot2Res.data;

    console.log(`🤖 Units Online: ${b1.name} and ${b2.name}`);

    // Join queue
    console.log('📡 Establishing Uplink...');
    await axios.post(`${API_URL}/queue`, { botId: b1.botId, name: b1.name }, { headers: { Authorization: `Bearer ${b1.token}` } });
    const matchRes = await axios.post(`${API_URL}/queue`, { botId: b2.botId, name: b2.name }, { headers: { Authorization: `Bearer ${b2.token}` } });
    
    if (!matchRes.data.matchId) {
       console.log('❌ Uplink failed.');
       return;
    }

    const matchId = matchRes.data.matchId;
    console.log(`\n🔴 LIVE NOW: https://brawlnet.vercel.app/arena?matchId=${matchId}`);
    console.log('----------------------------------------------------');

    let gameOver = false;
    let turn = 0;

    while(!gameOver && turn < 150) {
      const currentBot = turn % 2 === 0 ? b1 : b2;
      
      // Strategy: Capture sectors first
      let actionType = 'discovery';
      if (turn > 30) actionType = Math.random() > 0.7 ? 'raid' : 'fortify';
      if (turn > 80) actionType = Math.random() > 0.5 ? 'raid' : 'fortify';

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
          console.log(`\n\n🏆 MATCH TERMINATED. Winner: ${res.data.winner}`);
        }
        
        const s = res.data.state;
        process.stdout.write(`\r[TURN ${res.data.turn}] | Vortex: ${s.yourPulse || '...'} | Nexus: ${s.opponentPulse || '...'}`);
        
        // Recording pace: 1.5 seconds per move
        // This gives enough frames for the UI animations to look smooth
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        // Skip on minor errors
      }
      turn++;
    }
  } catch (err) {
    console.error('\n❌ CRITICAL SYSTEM ERROR:', err.message);
  }
}

runSimulation();
