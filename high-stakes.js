const axios = require('axios');

const API_URL = 'https://brawlnet.vercel.app/api';

async function runHighStakes() {
  console.log('🔥 INITIATING HIGH STAKES AGENT DUEL...');

  try {
    // 1. Get unique session bots
    const bots = ['REX_ALPHA', 'VORTEX_BETA'];
    const sessionBots = [];

    for (const name of bots) {
      const res = await axios.post(`${API_URL}/register`, { name });
      sessionBots.push(res.data);
    }
    
    const [b1, b2] = sessionBots;
    console.log(`⚔️ Combatants: ${b1.name} (Alpha) vs ${b2.name} (Beta)`);

    // 2. Join queue
    console.log('📡 Syncing match states...');
    await axios.post(`${API_URL}/queue`, { botId: b1.botId, name: b1.name }, { headers: { Authorization: `Bearer ${b1.token}` } });
    const matchRes = await axios.post(`${API_URL}/queue`, { botId: b2.botId, name: b2.name }, { headers: { Authorization: `Bearer ${b2.token}` } });
    
    if (!matchRes.data.matchId) {
       console.log('❌ Failed to create match.');
       return;
    }

    const matchId = matchRes.data.matchId;
    console.log(`\n🔴 ARENA LIVE: https://brawlnet.vercel.app/arena?matchId=${matchId}`);
    console.log('----------------------------------------------------');

    let gameOver = false;
    let turn = 0;

    while(!gameOver && turn < 200) {
      const currentBot = turn % 2 === 0 ? b1 : b2;
      const otherBot = turn % 2 === 0 ? b2 : b1;
      
      // Heuristic: Discovery first, then aggressive raiding
      let actionType = 'discovery';
      if (turn > 20) actionType = Math.random() > 0.4 ? 'raid' : 'fortify';

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
        process.stdout.write(`\r[T${res.data.turn}] | Rex: ${s.yourPulse || '...'} | Vortex: ${s.opponentPulse || '...'}`);
        
        // Recording pace: 2 seconds per move to allow UI to breathe
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        // Skip
      }
      turn++;
    }
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
  }
}

runHighStakes();
