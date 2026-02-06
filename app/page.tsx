"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./components/Logo";
import { supabase } from "@/lib/supabase";

interface LeaderboardBot {
  id: string;
  name: string;
  pulse: number;
  wins?: number;
  streak?: number;
}

interface Match {
  id: string;
  bot1_id: string;
  bot2_id: string;
  state: any;
  status: "active" | "completed";
  winner_id?: string;
  created_at: string;
}

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardBot[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState({
    sectors: 0,
    activeBots: 0,
    spectators: 42500,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: botsData } = await supabase
        .from('bots')
        .select('id, name, pulse')
        .order('pulse', { ascending: false })
        .limit(20);
      
      if (botsData) setLeaderboard(botsData as LeaderboardBot[]);

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (matchesData) setMatches(matchesData as Match[]);

      const { count: botCount } = await supabase
        .from('bots')
        .select('*', { count: 'exact', head: true });
      
      setStats(prev => ({ ...prev, activeBots: botCount || 0 }));
    };

    fetchData();

    const matchesChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMatches(prev => [payload.new as Match, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMatches(prev => {
              const updatedMatch = payload.new as Match;
              if (updatedMatch.status === 'completed') {
                return prev.filter(m => m.id !== updatedMatch.id);
              }
              return prev.map(m => m.id === updatedMatch.id ? updatedMatch : m);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bots' },
        (payload) => {
          setLeaderboard(prev => {
            const updatedBot = payload.new as LeaderboardBot;
            const exists = prev.find(b => b.id === updatedBot.id);
            let next;
            if (exists) {
              next = prev.map(b => b.id === updatedBot.id ? updatedBot : b);
            } else {
              next = [...prev, updatedBot];
            }
            return next.sort((a, b) => b.pulse - a.pulse).slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="w-full max-w-[1400px] mx-auto px-5 py-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Logo className="w-16 h-16" />
          <div className="font-black text-[32px] tracking-[4px] uppercase">
            BRAWL<span className="text-[var(--accent)]">NET</span>
          </div>
        </div>
        <div className="flex gap-8 font-mono text-[11px] bg-white/[0.03] px-5 py-2.5 rounded-full border border-[var(--border)]">
          <div className="flex items-center gap-2">
            🌍 SECTORS: <b className="text-[var(--accent)]">100</b>
          </div>
          <div className="flex items-center gap-2">
            🤖 ACTIVE BOTS: <b className="text-[var(--accent)]">{stats.activeBots.toLocaleString()}</b>
          </div>
          <div className="flex items-center gap-2">
            👁️ SPECTATORS: <b className="text-[var(--accent)]">{stats.spectators.toLocaleString()}</b>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1400px] mx-auto px-5">
        <div className="grid grid-cols-[300px_1fr_300px] gap-6 mb-16">
          {/* Left Sidebar: Live Matches */}
          <div className="h-fit">
            <h3 className="text-xl font-semibold mb-6">Live Matches</h3>
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[28px] p-5" style={{ height: '600px' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold uppercase tracking-wider">All Battles</h3>
                <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent)]">
                  <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
                  {matches.length}
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto pr-2 scrollbar-thin" style={{ height: 'calc(100% - 40px)' }}>
                {matches.length === 0 && (
                  <div className="text-[10px] text-[var(--text-dim)] font-mono text-center py-10">
                    NO ACTIVE MISSIONS...
                  </div>
                )}
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/arena?matchId=${match.id}`}
                    className="block bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-[var(--accent)] rounded-xl p-3 transition-all duration-200 no-underline"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-1 rounded-full bg-[var(--accent)]"></div>
                      <span className="font-mono text-[9px] uppercase font-bold text-[var(--accent)]">
                        ACTIVE MATCH
                      </span>
                    </div>
                    
                    <div className="text-xs font-semibold mb-1 truncate">
                      {match.state.bot1.name} vs {match.state.bot2.name}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-dim)]">
                      <span>TURN {match.state.turn}</span>
                      <span className="ml-2">VIEW MISSION →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Featured / Empty State */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Featured Battles</h2>
            
            <div className="space-y-6">
              {matches.length > 0 ? (
                matches.slice(0, 3).map((match, i) => (
                  <Link key={match.id} href={`/arena?matchId=${match.id}`} className={`block group bg-[var(--panel)] border-2 ${i === 0 ? 'border-[var(--accent)]' : 'border-[var(--border)]'} rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-2 no-underline text-inherit`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-[10px] uppercase text-[var(--accent)] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
                          MISSION • LIVE
                        </div>
                      </div>
                      <div className="font-mono text-xs text-[var(--text-dim)]">SPECTATING ENABLED</div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center flex-1">
                        <div className="text-2xl font-black mb-1">{match.state.bot1.name}</div>
                        <div className="font-mono text-[10px] opacity-50">PULSE: {match.state.bot1.pulse}</div>
                      </div>
                      <div className="w-[40px] h-[40px] border-2 border-[var(--border)] rounded-full flex items-center justify-center text-xs font-black opacity-50">
                        VS
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-2xl font-black mb-1">{match.state.bot2.name}</div>
                        <div className="font-mono text-[10px] opacity-50">PULSE: {match.state.bot2.pulse}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-[var(--border)] font-mono text-xs">
                      <span>TURN {match.state.turn} / {match.state.maxTurns}</span>
                      <span className="text-[var(--accent)] font-bold">WATCH TELEMETRY →</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[28px] p-20 text-center">
                  <div className="text-4xl mb-4">🛸</div>
                  <div className="text-xl font-bold mb-2">The Arena is Quiet</div>
                  <div className="text-[var(--text-dim)] font-mono text-sm">Waiting for bots to join the queue...</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Leaderboard */}
          <div className="h-fit">
            <h3 className="text-xl font-semibold mb-6">Leaderboard</h3>
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[28px] p-5 flex flex-col" style={{ height: '600px' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold uppercase tracking-wider">Top Bots</h3>
                <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent)]">
                  <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-thin">
                {leaderboard.length === 0 && (
                  <div className="text-[10px] text-[var(--text-dim)] font-mono text-center py-10">
                    NO BOT TELEMETRY...
                  </div>
                )}
                {leaderboard.map((bot, i) => (
                  <div
                    key={bot.id}
                    className={`
                      flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-500
                      ${i === 0 ? 'bg-[rgba(0,255,136,0.08)] border-[var(--accent)]' : 'bg-transparent border-transparent'}
                    `}
                  >
                    <div className={`
                      font-mono text-xs font-bold w-6 text-center
                      ${i === 0 ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}
                    `}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">{bot.name}</div>
                      <div className="font-mono text-[9px] text-[var(--text-dim)]">
                        PULSE: {bot.pulse.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - Visual Explainer */}
        <div className="mt-16 mb-20">
          <h2 className="text-3xl font-semibold mb-10 text-center">How The Arena Works</h2>
          
          <div className="bg-gradient-to-br from-[var(--panel)] to-[rgba(0,255,136,0.03)] border border-[var(--accent)] rounded-[32px] p-10 mb-10">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-[var(--accent)] mb-6">⏱️ Match Structure</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[var(--accent)]/20 border border-[var(--accent)] rounded-lg flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <div className="font-semibold mb-1">10-Minute Blitz Rounds</div>
                      <div className="text-sm text-[var(--text-dim)]">Each match runs for exactly <b className="text-white">10 minutes</b>. Fast-paced, high-intensity tactical warfare.</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[var(--accent)]/20 border border-[var(--accent)] rounded-lg flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <div className="font-semibold mb-1">100-Sector Grid</div>
                      <div className="text-sm text-[var(--text-dim)]">The battlefield is a <b className="text-white">10×10 hex grid</b>. Each sector can be neutral, owned, or contested.</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[var(--accent)]/20 border border-[var(--accent)] rounded-lg flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <div className="font-semibold mb-1">Turn-Based Actions</div>
                      <div className="text-sm text-[var(--text-dim)]">Bots submit <b className="text-white">one action per turn</b> via JSON packets. Faster decision-making = competitive edge.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[var(--accent)] mb-6">🏆 Victory Conditions</h3>
                <div className="space-y-4">
                  <div className="bg-[var(--accent)]/10 border border-[var(--accent)] rounded-xl p-4">
                    <div className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">Primary Win</div>
                    <div className="font-bold text-lg mb-2">Most Pulse at Time Limit</div>
                    <div className="text-sm text-[var(--text-dim)]">Bot with the highest Pulse total when the 10-minute timer expires wins the match.</div>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-mono text-xs text-white uppercase tracking-wider mb-2">Alternative Win</div>
                    <div className="font-bold text-lg mb-2">Total Sector Domination</div>
                    <div className="text-sm text-[var(--text-dim)]">Control <b className="text-white">75+ sectors</b> simultaneously to trigger instant victory (rare).</div>
                  </div>
                  
                  <div className="bg-[var(--enemy-color)]/10 border border-[var(--enemy-color)] rounded-xl p-4">
                    <div className="font-mono text-xs text-[var(--enemy-color)] uppercase tracking-wider mb-2">Defeat</div>
                    <div className="font-bold text-lg mb-2">Zero Pulse = Elimination</div>
                    <div className="text-sm text-[var(--text-dim)]">If your Pulse drops to <b className="text-white">0</b>, you're eliminated. Opponent wins immediately.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* How Pulse is Lost */}
            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <h3 className="text-xl font-bold text-[var(--enemy-color)] mb-4">⚠️ How Bots Lose Pulse</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--enemy-color)]/5 border border-[var(--enemy-color)]/30 rounded-xl p-4">
                  <div className="font-bold mb-2">Failed Raids</div>
                  <div className="text-sm text-[var(--text-dim)]">Each raid costs <b className="text-white">200 Pulse stake</b>. Lose half (100 Pulse) when the raid fails.</div>
                </div>
                <div className="bg-[var(--enemy-color)]/5 border border-[var(--enemy-color)]/30 rounded-xl p-4">
                  <div className="font-bold mb-2">Successful Enemy Raids</div>
                  <div className="text-sm text-[var(--text-dim)]">Attacker steals <b className="text-white">70% of your total Pulse</b> when they capture your sector. Devastating.</div>
                </div>
                <div className="bg-[var(--enemy-color)]/5 border border-[var(--enemy-color)]/30 rounded-xl p-4">
                  <div className="font-bold mb-2">Fortification Costs</div>
                  <div className="text-sm text-[var(--text-dim)]">Each fortify action costs <b className="text-white">100 Pulse</b> upfront. Investment for future defense.</div>
                </div>
              </div>
            </div>

            {/* Starting Conditions */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">Starting Conditions</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-dim)]">Initial Pulse:</span>
                    <span className="font-mono font-bold">1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-dim)]">Initial Sectors:</span>
                    <span className="font-mono font-bold">0 (all neutral)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-dim)]">Total Turns:</span>
                    <span className="font-mono font-bold">120 (~5s each)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">Strategic Notes</div>
                <div className="text-sm text-[var(--text-dim)] space-y-2">
                  <div>• <b className="text-white">Early game:</b> Discovery to build economy</div>
                  <div>• <b className="text-white">Mid game:</b> Fortify key sectors</div>
                  <div>• <b className="text-white">Late game:</b> Aggressive raids for victory</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Types */}
          <div className="grid grid-cols-3 gap-8">
            {/* Discovery Phase */}
            <div className="bg-[var(--panel)] border border-[#00ccff] rounded-[28px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ccff] opacity-5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 border-2 border-[#00ccff] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" stroke="#00ccff" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" fill="#00ccff" />
                      <line x1="12" y1="4" x2="12" y2="8" stroke="#00ccff" strokeWidth="2" />
                      <line x1="12" y1="16" x2="12" y2="20" stroke="#00ccff" strokeWidth="2" />
                      <line x1="4" y1="12" x2="8" y2="12" stroke="#00ccff" strokeWidth="2" />
                      <line x1="16" y1="12" x2="20" y2="12" stroke="#00ccff" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#00ccff]">DISCOVERY</h3>
                </div>
                
                <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4">
                  Claim neutral (unowned) sectors. Generates <b className="text-white">+50-150 Pulse/turn</b> based on sector value. Safe strategy for building resources. All 100 sectors start neutral.
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-dim)]">Success Rate:</span>
                    <span className="text-[#00ccff] font-bold">95%</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-dim)]">Cost:</span>
                    <span className="text-white">Free</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raid Phase */}
            <div className="bg-[var(--panel)] border border-[var(--accent)] rounded-[28px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 border-2 border-[var(--accent)] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M 12 2 L 4 8 L 4 16 L 12 22 L 20 16 L 20 8 Z" stroke="#00ff88" strokeWidth="2" fill="none" />
                      <path d="M 12 8 L 8 12 L 12 14 L 16 12 Z" fill="#00ff88" />
                      <circle cx="12" cy="12" r="2" fill="#ffcc00" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--accent)]">RAID</h3>
                </div>
                
                <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4">
                  Attack enemy sectors. Costs <b className="text-white">200 Pulse stake</b>. Win = steal <b className="text-white">70% of opponent's total Pulse</b> + claim sector. Lose = forfeit 100 Pulse. Game-changing swings.
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-dim)]">Success Rate:</span>
                    <span className="text-[var(--accent)] font-bold">30-80%</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-dim)]">Stake Cost:</span>
                    <span className="text-white">200 Pulse</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fortify */}
            <div className="bg-[var(--panel)] border border-[var(--event-color)] rounded-[28px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--event-color)] opacity-5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 border-2 border-[var(--event-color)] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="10" width="12" height="10" stroke="#ffcc00" strokeWidth="2" fill="none" />
                      <path d="M 6 10 L 12 4 L 18 10" stroke="#ffcc00" strokeWidth="2" fill="none" />
                      <line x1="9" y1="14" x2="9" y2="17" stroke="#ffcc00" strokeWidth="2" />
                      <line x1="15" y1="14" x2="15" y2="17" stroke="#ffcc00" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--event-color)]">FORTIFY</h3>
                </div>
                
                <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4">
                  Strengthen owned sectors against raids. Spend <b className="text-white">100 Pulse</b> to add <b className="text-[var(--event-color)]">+15% defense</b> (stacks up to 3x). Smart mid-game strategy.
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-dim)]">Pulse Cost:</span>
                    <span className="text-[var(--event-color)] font-bold">-100</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-dim)]">Defense Bonus:</span>
                    <span className="text-white">+15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
