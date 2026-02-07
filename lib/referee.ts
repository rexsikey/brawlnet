// BRAWLNET Referee Engine v1.2 (BLITZ EDITION)
// Deterministic tactical logic with comeback mechanics

export interface GameState {
  matchId: string;
  bot1: BotState;
  bot2: BotState;
  sectors: SectorState[];
  turn: number;
  maxTurns: number;
  status: 'active' | 'completed';
  winner?: string;
  startTime: number;
}

export interface BotState {
  id: string;
  name: string;
  pulse: number;
  sectors: number[]; 
}

export interface SectorState {
  id: number; // 1-100
  owner: string | null;
  fortifications: number; // 0-3
  pulseGeneration: number; // 5-15 per turn (Scaled down)
}

export interface Action {
  type: 'discovery' | 'raid' | 'fortify';
  sectorId: number;
}

export class Referee {
  static createMatch(bot1Id: string, bot1Name: string, bot2Id: string, bot2Name: string): GameState {
    const sectors: SectorState[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      owner: null,
      fortifications: 0,
      pulseGeneration: Math.floor(Math.random() * 11) + 5, // 5-15
    }));

    return {
      matchId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bot1: { id: bot1Id, name: bot1Name, pulse: 500, sectors: [] }, // Starting pulse 500
      bot2: { id: bot2Id, name: bot2Name, pulse: 500, sectors: [] },
      sectors,
      turn: 1,
      maxTurns: 80, // Shorter games
      status: 'active',
      startTime: Date.now(),
    };
  }

  static validateAction(state: GameState, botId: string, action: Action): { valid: boolean; error?: string } {
    const bot = state.bot1.id === botId ? state.bot1 : state.bot2;
    const sector = state.sectors.find(s => s.id === action.sectorId);

    if (!sector && action.sectorId !== -1) {
      return { valid: false, error: 'Invalid sector ID' };
    }

    // Economy checks for Blitz scale
    const RAID_COST = bot.sectors.length < 40 ? 0 : 50; 
    const FORTIFY_COST = 25;

    // Filter out Rex/Vortex bots for token efficiency if requested
    const isMainlineBot = (name: string) => name.includes('Rex') || name.includes('Vortex');

    switch (action.type) {
      case 'discovery':
        if (!sector || sector.owner !== null) return { valid: false, error: 'Sector is already owned' };
        return { valid: true };

      case 'raid':
        if (!sector || sector.owner === null) return { valid: false, error: 'Cannot raid neutral' };
        if (sector.owner === botId) return { valid: false, error: 'Cannot raid self' };
        if (bot.pulse < RAID_COST) return { valid: false, error: `Need ${RAID_COST} Pulse for raid` };
        return { valid: true };

      case 'fortify':
        if (!sector || sector.owner !== botId) return { valid: false, error: 'Not your sector' };
        if (bot.pulse < FORTIFY_COST) return { valid: false, error: `Need ${FORTIFY_COST} Pulse for fortify` };
        if (sector.fortifications >= 3) return { valid: false, error: 'Max fortified' };
        return { valid: true };

      default:
        return { valid: false, error: 'Unknown action' };
    }
  }

  static executeAction(state: GameState, botId: string, action: Action): GameState {
    const validation = this.validateAction(state, botId, action);
    if (!validation.valid) throw new Error(validation.error);

    const newState = JSON.parse(JSON.stringify(state));
    const bot = newState.bot1.id === botId ? newState.bot1 : newState.bot2;
    const opponent = newState.bot1.id === botId ? newState.bot2 : newState.bot1;
    const sector = newState.sectors.find((s: SectorState) => s.id === action.sectorId)!;

    const RAID_COST = bot.sectors.length < 40 ? 0 : 50;
    const FORTIFY_COST = 25;

    switch (action.type) {
      case 'discovery':
        sector.owner = botId;
        bot.sectors.push(sector.id);
        break;

      case 'raid':
        bot.pulse -= RAID_COST;
        const success = this.resolveRaid(bot.pulse, opponent.pulse, sector.fortifications);
        
        if (success) {
          // Comeback Mechanic: Last Stand
          const pulseDiff = opponent.pulse - bot.pulse;
          const isUnderdog = pulseDiff > 1000 && newState.turn > 40;
          
          const theftMultiplier = isUnderdog ? 0.30 : 0.15; // 30% theft if losing badly
          const stolenPulse = Math.floor(opponent.pulse * theftMultiplier);
          const bounty = isUnderdog ? 300 : 100;

          opponent.pulse -= stolenPulse;
          bot.pulse += (stolenPulse + bounty + RAID_COST);
          
          // Transfer ownership
          opponent.sectors = opponent.sectors.filter((id: number) => id !== sector.id);
          sector.owner = botId;
          sector.fortifications = 0;
          bot.sectors.push(sector.id);

          // Last Stand: Cluster Capture (3 random neighbors)
          if (isUnderdog) {
            this.captureNeighbors(newState, botId, sector.id);
          }
        } else {
          bot.pulse -= 20; // Failed raid penalty
        }
        break;

      case 'fortify':
        bot.pulse -= FORTIFY_COST;
        sector.fortifications += 1;
        break;
    }

    return newState;
  }

  private static captureNeighbors(state: any, botId: string, sectorId: number) {
    // Simple neighbor logic for 10x10 grid
    const neighbors = [sectorId - 1, sectorId + 1, sectorId - 10, sectorId + 10];
    let captured = 0;
    for (const nId of neighbors) {
      if (captured >= 3) break;
      const n = state.sectors.find((s: any) => s.id === nId);
      if (n && n.owner !== botId) {
        // If it was opponent's, remove it from them
        if (n.owner) {
          const opp = state.bot1.id === n.owner ? state.bot1 : state.bot2;
          opp.sectors = opp.sectors.filter((id: number) => id !== n.id);
        }
        n.owner = botId;
        const bot = state.bot1.id === botId ? state.bot1 : state.bot2;
        bot.sectors.push(n.id);
        captured++;
      }
    }
  }

  static resolveRaid(attackerPulse: number, defenderPulse: number, fortifications: number): boolean {
    let winChance = 0.5;
    const pulseAdvantage = ((attackerPulse - defenderPulse) / 5000) * 0.2; // Scaled for smaller numbers
    winChance += pulseAdvantage;
    winChance -= fortifications * 0.20;
    return Math.random() < Math.max(0.1, Math.min(0.9, winChance));
  }

  static processTurn(state: GameState): GameState {
    const newState = JSON.parse(JSON.stringify(state));
    newState.sectors.forEach((sector: SectorState) => {
      if (sector.owner) {
        const ownerBot = newState.bot1.id === sector.owner ? newState.bot1 : newState.bot2;
        // Underdog Passive: +50% mining if < 40% sectors
        const isUnderdog = ownerBot.sectors.length < 40;
        const gen = isUnderdog ? Math.floor(sector.pulseGeneration * 1.5) : sector.pulseGeneration;
        ownerBot.pulse += gen;
      }
    });
    newState.turn += 1;
    return newState;
  }

  static checkVictory(state: GameState): GameState {
    const newState = { ...state };
    if (state.bot1.pulse <= 0) { newState.status = 'completed'; newState.winner = state.bot2.id; }
    else if (state.bot2.pulse <= 0) { newState.status = 'completed'; newState.winner = state.bot1.id; }
    else if (state.bot1.sectors.length >= 75) { newState.status = 'completed'; newState.winner = state.bot1.id; }
    else if (state.bot2.sectors.length >= 75) { newState.status = 'completed'; newState.winner = state.bot2.id; }
    else if (state.turn >= state.maxTurns) {
      newState.status = 'completed';
      newState.winner = state.bot1.pulse > state.bot2.pulse ? state.bot1.id : state.bot2.id;
    }
    return newState;
  }
}
