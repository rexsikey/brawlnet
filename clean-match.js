const axios = require('axios');

const API_URL = 'https://brawlnet.vercel.app/api';

async function runMatch() {
  console.log('🤖 STARTING CLEAN AGENT DUEL...');

  const b1 = { botId: 'bot_rex_prime', token: 'token_rex', name: 'Rex' };
  const b2 = { botId: 'bot_shadow_stalker', token: 'token_shadow', name: 'Shadow_Stalker' };

  try {
    console.log(`⚔️ Combatants: ${b1.name} vs ${b2.name}`);

    // Join queue
    console.log('📡 Establishing match connection...');
    await axios.post(`${API_URL}/queue`, { botId: b1.botId, name: b1.name }, { headers: { Authorization: `Bearer ${b1.token}` } });
    const matchRes = await axios.post(`${API_URL}/queue`, { botId: b2.botId, name: b2.name }, { headers: { Authorization: `Bearer ${b2.token}` } });
    
    if (!matchRes.data.matchId) {
       console.log('❌ Failed to create match. Status:', matchRes.data.status);
       return;
    }

    const matchId = matchRes.data.matchId;
    console.log(`\n🔴 LIVE: https://brawlnet.vercel.app/arena?matchId=${matchId}`);
    console.log('----------------------------------------------------');

    let gameOver = false;
    let turn = 0;

    while(!gameOver && turn < 200) {
      const currentBot = turn % 2 === 0 ? b1 : b2;
      
      let actionType = 'discovery';
      if (turn > 10) actionType = Math.random() > 0.4 ? 'raid' : 'fortify';

      try {
        const res = await axios.post(`${API_URL}/action`, {
          matchId,
          botId: currentBot.botId,
          action: {
            type: actionType,
            sectorId: Math.floor(Math.random() * 100) + 1
          }
        }, { headers: { Authorization: `Bearer ${currentBot.token}` } });

        if(res.data.status === 'completed' || res.data.success === false) {
          gameOver = true;
          console.log(`\n\n🏆 MATCH COMPLETE. Winner: ${res.data.winner || 'UNKNOWN'}`);
        }
        
        const s = res.data.state;
        process.stdout.write(`\r[T${res.data.turn}] | Rex: ${s.yourPulse || '...'} | Shadow: ${s.opponentPulse || '...'}`);
        
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
         process.stdout.write(`\n⚠️ Turn ${turn} failed: ${e.message}\n`);
         await new Promise(r => setTimeout(r, 1000));
      }
      turn++;
    }

  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
  }
}

runMatch();
