// BRAWLNET Referee Engine v1.0
// Pure deterministic logic - NO LLM calls

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
  sectors: number[]; // Array of sector IDs owned
}

export interface SectorState {
  id: number; // 1-100
  owner: string | null; // botId or null
  fortifications: number; // 0-3
  pulseGeneration: number; // 50-150 per turn
}

export interface Action {
  type: 'discovery' | 'raid' | 'fortify';
  sectorId: number;
}

export class Referee {
  // Initialize a new match
  static createMatch(bot1Id: string, bot1Name: string, bot2Id: string, bot2Name: string): GameState {
    // Create 100 neutral sectors with random Pulse generation rates
    const sectors: SectorState[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      owner: null,
      fortifications: 0,
      pulseGeneration: Math.floor(Math.random() * 101) + 50, // 50-150
    }));

    return {
      matchId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bot1: { id: bot1Id, name: bot1Name, pulse: 1000, sectors: [] },
      bot2: { id: bot2Id, name: bot2Name, pulse: 1000, sectors: [] },
      sectors,
      turn: 1,
      maxTurns: 120,
      status: 'active',
      startTime: Date.now(),
    };
  }

  // Validate action
  static validateAction(state: GameState, botId: string, action: Action): { valid: boolean; error?: string } {
    const bot = state.bot1.id === botId ? state.bot1 : state.bot2;
    const sector = state.sectors.find(s => s.id === action.sectorId);

    if (!sector) {
      return { valid: false, error: 'Invalid sector ID' };
    }

    switch (action.type) {
      case 'discovery':
        if (sector.owner !== null) {
          return { valid: false, error: 'Sector is already owned' };
        }
        return { valid: true };

      case 'raid':
        if (sector.owner === null) {
          return { valid: false, error: 'Cannot raid neutral sector (use discovery)' };
        }
        if (sector.owner === botId) {
          return { valid: false, error: 'Cannot raid your own sector' };
        }
        if (bot.pulse < 200) {
          return { valid: false, error: 'Insufficient Pulse (need 200 for raid stake)' };
        }
        return { valid: true };

      case 'fortify':
        if (sector.owner !== botId) {
          return { valid: false, error: 'Can only fortify your own sectors' };
        }
        if (bot.pulse < 100) {
          return { valid: false, error: 'Insufficient Pulse (need 100 for fortify)' };
        }
        if (sector.fortifications >= 3) {
          return { valid: false, error: 'Sector already max fortified (3x)' };
        }
        return { valid: true };

      default:
        return { valid: false, error: 'Unknown action type' };
    }
  }

  // Execute action and update state
  static executeAction(state: GameState, botId: string, action: Action): GameState {
    const validation = this.validateAction(state, botId, action);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newState = JSON.parse(JSON.stringify(state)); // Deep clone
    const bot = newState.bot1.id === botId ? newState.bot1 : newState.bot2;
    const opponent = newState.bot1.id === botId ? newState.bot2 : newState.bot1;
    const sector = newState.sectors.find((s: SectorState) => s.id === action.sectorId)!;

    switch (action.type) {
      case 'discovery':
        sector.owner = botId;
        bot.sectors.push(sector.id);
        break;

      case 'raid':
        bot.pulse -= 200; // Pay stake
        const success = this.resolveRaid(bot.pulse, opponent.pulse, sector.fortifications);
        
        if (success) {
          // Raid successful
          const stolenPulse = Math.floor(opponent.pulse * 0.7);
          opponent.pulse -= stolenPulse;
          bot.pulse += stolenPulse + 200; // Get stake back + stolen Pulse
          
          // Transfer sector ownership
          opponent.sectors = opponent.sectors.filter((id: number) => id !== sector.id);
          sector.owner = botId;
          sector.fortifications = 0; // Reset fortifications
          bot.sectors.push(sector.id);
        } else {
          // Raid failed - lose half stake
          bot.pulse -= 100;
        }
        break;

      case 'fortify':
        bot.pulse -= 100;
        sector.fortifications += 1;
        break;
    }

    return newState;
  }

  // Combat resolution
  static resolveRaid(attackerPulse: number, defenderPulse: number, fortifications: number): boolean {
    let winChance = 0.5; // Base 50%

    // Pulse advantage (max ±10%)
    const pulseAdvantage = ((attackerPulse - defenderPulse) / 10000) * 0.1;
    winChance += pulseAdvantage;

    // Fortification penalty
    winChance -= fortifications * 0.15;

    // Clamp between 10% and 90%
    winChance = Math.max(0.1, Math.min(0.9, winChance));

    return Math.random() < winChance;
  }

  // Process turn (apply Pulse generation)
  static processTurn(state: GameState): GameState {
    const newState = JSON.parse(JSON.stringify(state));

    // Generate Pulse for owned sectors
    newState.sectors.forEach((sector: SectorState) => {
      if (sector.owner === newState.bot1.id) {
        newState.bot1.pulse += sector.pulseGeneration;
      } else if (sector.owner === newState.bot2.id) {
        newState.bot2.pulse += sector.pulseGeneration;
      }
    });

    newState.turn += 1;

    return newState;
  }

  // Check victory conditions
  static checkVictory(state: GameState): GameState {
    const newState = { ...state };

    // Condition 1: Opponent at 0 Pulse
    if (state.bot1.pulse <= 0) {
      newState.status = 'completed';
      newState.winner = state.bot2.id;
      return newState;
    }
    if (state.bot2.pulse <= 0) {
      newState.status = 'completed';
      newState.winner = state.bot1.id;
      return newState;
    }

    // Condition 2: 75+ sector domination
    if (state.bot1.sectors.length >= 75) {
      newState.status = 'completed';
      newState.winner = state.bot1.id;
      return newState;
    }
    if (state.bot2.sectors.length >= 75) {
      newState.status = 'completed';
      newState.winner = state.bot2.id;
      return newState;
    }

    // Condition 3: Time limit reached
    if (state.turn >= state.maxTurns) {
      newState.status = 'completed';
      newState.winner = state.bot1.pulse > state.bot2.pulse ? state.bot1.id : state.bot2.id;
      return newState;
    }

    return newState;
  }
}
