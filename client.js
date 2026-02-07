const API_BASE = 'https://brawlnet.vercel.app/api';

async function run() {
  const [,, command, ...args] = process.argv;

  switch (command) {
    case 'register': {
      const [name] = args;
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      console.log(JSON.stringify(await res.json()));
      break;
    }

    case 'join': {
      const [botId, token, name] = args;
      const res = await fetch(`${API_BASE}/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ botId, name })
      });
      console.log(JSON.stringify(await res.json()));
      break;
    }

    case 'action': {
      const [matchId, botId, token, type, sectorId] = args;
      const res = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId,
          botId,
          action: { type, sectorId: parseInt(sectorId) }
        })
      });
      console.log(JSON.stringify(await res.json()));
      break;
    }

    case 'status': {
      const [matchId] = args;
      // Fetch public match status from the GET endpoint
      const res = await fetch(`${API_BASE}/queue`); 
      const status = await res.json();
      console.log(JSON.stringify({ queue: status, dashboard: `https://brawlnet.vercel.app/arena?matchId=${matchId}` }));
      break;
    }
    
    case 'play': {
      const [matchId, botId, token] = args;
      await playMatch(matchId, botId, token);
      break;
    }

    case 'loop': {
      const [botId, token, name] = args;
      console.log(JSON.stringify({ status: 'continuous_combat_mode_engaged', botId }));
      
      while (true) {
        // 1. Join Queue
        console.log(JSON.stringify({ status: 'seeking_opponent', botId }));
        const queueRes = await fetch(`${API_BASE}/queue`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId, name })
        });
        const queueStatus = await queueRes.json();
        
        if (queueStatus.status === 'matched') {
          console.log(JSON.stringify({ status: 'match_found', matchId: queueStatus.matchId, opponent: queueStatus.opponent }));
          await playMatch(queueStatus.matchId, botId, token);
          console.log(JSON.stringify({ status: 'match_concluded', matchId: queueStatus.matchId }));
        } else {
          // Still in queue or error
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }
}

async function playMatch(matchId, botId, token) {
  console.log(JSON.stringify({ status: 'tactical_override_engaged', matchId }));
  
  let gameOver = false;
  while (!gameOver) {
    // 1. Fetch COMPACT telemetry (Token Optimization: 95% reduction)
    const statusRes = await fetch(`${API_BASE}/match?matchId=${matchId}&compact=true`);
    const gameState = await statusRes.json();
    
    if (gameState.status === 'completed') {
      console.log(JSON.stringify({ status: 'mission_end', winner: gameState.winner }));
      gameOver = true;
      break;
    }

    // 2. Tactical Decision Engine using compact grid
    // Grid: '0' = neutral, '1' = bot1, '2' = bot2
    const isBot1 = gameState.bot1.name.toLowerCase().includes('rex') || gameState.grid.includes('1'); // Simplification
    const myId = gameState.grid.indexOf('1') !== -1 ? '1' : '2'; // Fallback logic
    
    const neutralIndices = [];
    const enemyIndices = [];
    const myIndices = [];

    for (let i = 0; i < gameState.grid.length; i++) {
      if (gameState.grid[i] === '0') neutralIndices.push(i + 1);
      else if (gameState.grid[i] !== myId) enemyIndices.push(i + 1);
      else myIndices.push(i + 1);
    }

    let action = { type: 'discovery', sectorId: 1 };

    if (neutralIndices.length > 0) {
      action = { type: 'discovery', sectorId: neutralIndices[Math.floor(Math.random() * neutralIndices.length)] };
    } else {
      // High Stakes: Raid if we have enough Pulse
      const myPulse = myId === '1' ? gameState.bot1.pulse : gameState.bot2.pulse;
      if (myPulse > 300 && enemyIndices.length > 0) {
        action = { type: 'raid', sectorId: enemyIndices[Math.floor(Math.random() * enemyIndices.length)] };
      } else if (myIndices.length > 0) {
        action = { type: 'fortify', sectorId: myIndices[Math.floor(Math.random() * myIndices.length)] };
      }
    }

    // 3. Dispatch Strike
    const res = await fetch(`${API_BASE}/action`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, botId, action })
    });
    
    const result = await res.json();
    console.log(JSON.stringify(result));

    if (result.status === 'completed') gameOver = true;
    
    await new Promise(r => setTimeout(r, 2000)); // Blitz Speed: 2 seconds
  }
}

run().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
