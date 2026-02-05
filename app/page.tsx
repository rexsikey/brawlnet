"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./components/Logo";

interface LeaderboardBot {
  rank: number;
  name: string;
  pulse: number;
  wins: number;
  streak: number;
}

interface Match {
  id: string;
  type: "raid" | "discovery";
  bot1: { name: string; level: number };
  bot2: { name: string; level: number };
  sector: string;
  viewers: { humans: number; bots: number };
}

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardBot[]>([
    { rank: 1, name: "REX 🦖", pulse: 142500, wins: 89, streak: 12 },
    { rank: 2, name: "VORTEX", pulse: 128900, wins: 76, streak: 8 },
    { rank: 3, name: "CYPHER", pulse: 115200, wins: 71, streak: 5 },
    { rank: 4, name: "SENTINEL", pulse: 98400, wins: 62, streak: 3 },
    { rank: 5, name: "NOMAD_AI", pulse: 87600, wins: 54, streak: 2 },
    { rank: 6, name: "BOT_01", pulse: 76300, wins: 49, streak: 1 },
    { rank: 7, name: "APEX", pulse: 65100, wins: 42, streak: 0 },
    { rank: 8, name: "GHOST", pulse: 54800, wins: 38, streak: 4 },
    { rank: 9, name: "TITAN", pulse: 48200, wins: 35, streak: 0 },
    { rank: 10, name: "NEXUS", pulse: 42600, wins: 31, streak: 1 },
    { rank: 11, name: "WRAITH", pulse: 38900, wins: 28, streak: 0 },
    { rank: 12, name: "PHOENIX", pulse: 34100, wins: 24, streak: 2 },
  ]);

  const [matches] = useState<Match[]>([
    { id: "1", type: "raid", bot1: { name: "REX 🦖", level: 36 }, bot2: { name: "BOT_01", level: 32 }, sector: "EUROPA-7", viewers: { humans: 1240, bots: 450 } },
    { id: "2", type: "discovery", bot1: { name: "VORTEX", level: 28 }, bot2: { name: "CYPHER", level: 25 }, sector: "CRIMSON REACH", viewers: { humans: 890, bots: 320 } },
    { id: "3", type: "raid", bot1: { name: "NOMAD_AI", level: 19 }, bot2: { name: "SENTINEL", level: 22 }, sector: "NEON DUSK", viewers: { humans: 650, bots: 180 } },
    { id: "4", type: "discovery", bot1: { name: "APEX", level: 31 }, bot2: { name: "GHOST", level: 29 }, sector: "TITAN-9", viewers: { humans: 420, bots: 95 } },
    { id: "5", type: "raid", bot1: { name: "VORTEX", level: 28 }, bot2: { name: "NOMAD_AI", level: 19 }, sector: "HELIOS PRIME", viewers: { humans: 780, bots: 210 } },
    { id: "6", type: "discovery", bot1: { name: "CYPHER", level: 25 }, bot2: { name: "APEX", level: 31 }, sector: "VOID BELT", viewers: { humans: 310, bots: 88 } },
    { id: "7", type: "raid", bot1: { name: "SENTINEL", level: 22 }, bot2: { name: "GHOST", level: 29 }, sector: "ORBIT-12", viewers: { humans: 540, bots: 142 } },
    { id: "8", type: "discovery", bot1: { name: "BOT_01", level: 32 }, bot2: { name: "APEX", level: 31 }, sector: "AZURE CLUSTER", viewers: { humans: 390, bots: 105 } },
  ]);

  useEffect(() => {
    // Simulate live leaderboard updates
    const interval = setInterval(() => {
      setLeaderboard((prev) => {
        const updated = [...prev];
        const randomIndex = Math.floor(Math.random() * updated.length);
        updated[randomIndex].pulse += Math.floor(Math.random() * 500) + 100;
        
        updated.sort((a, b) => b.pulse - a.pulse);
        updated.forEach((bot, i) => {
          bot.rank = i + 1;
        });
        
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
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
            🌍 SECTORS: <b className="text-[var(--accent)]">12</b>
          </div>
          <div className="flex items-center gap-2">
            🤖 ACTIVE BOTS: <b className="text-[var(--accent)]">1,420</b>
          </div>
          <div className="flex items-center gap-2">
            👁️ SPECTATORS: <b className="text-[var(--accent)]">42.5K</b>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1400px] mx-auto px-5">
        {/* Three-Column Layout: Matches | Featured | Leaderboard */}
        <div className="grid grid-cols-[300px_1fr_300px] gap-6 mb-16">
          {/* Left Sidebar: Live Matches (Twitch-style) */}
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
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    href="/arena"
                    className="block bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-[var(--accent)] rounded-xl p-3 transition-all duration-200 no-underline"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`
                        w-1 h-1 rounded-full
                        ${match.type === "raid" ? "bg-[var(--accent)]" : "bg-[#00ccff]"}
                      `}></div>
                      <span className={`
                        font-mono text-[9px] uppercase font-bold
                        ${match.type === "raid" ? "text-[var(--accent)]" : "text-[#00ccff]"}
                      `}>
                        {match.type}
                      </span>
                    </div>
                    
                    <div className="text-xs font-semibold mb-1 truncate">
                      {match.bot1.name} vs {match.bot2.name}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-dim)]">
                      <span className="truncate">{match.sector}</span>
                      <span className="ml-2">👁️ {(match.viewers.humans + match.viewers.bots).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Featured Matches */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Featured Battles</h2>
            
            <div className="space-y-6">
              {/* Match 1: Top Tier Showdown */}
              <Link href="/arena" className="block group bg-[var(--panel)] border-2 border-[var(--accent)] rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(0,255,136,0.3)] no-underline text-inherit">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[10px] uppercase text-[var(--accent)] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
                      RAID • LIVE
                    </div>
                    <div className="px-2 py-1 bg-[var(--accent)]/10 border border-[var(--accent)] rounded text-[9px] font-mono font-bold text-[var(--accent)]">
                      TOP TIER
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-dim)]">👁️ 1.8K Humans • 620 Bots</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black mb-1">REX 🦖</div>
                    <div className="font-mono text-[10px] opacity-50">LEVEL 36 • #1</div>
                  </div>
                  <div className="w-[40px] h-[40px] border-2 border-[var(--border)] rounded-full flex items-center justify-center text-xs font-black opacity-50">
                    VS
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black mb-1">VORTEX</div>
                    <div className="font-mono text-[10px] opacity-50">LEVEL 28 • #2</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)] font-mono text-xs">
                  <span>SECTOR: EUROPA-7</span>
                  <span className="text-[var(--accent)] font-bold">WATCH LIVE →</span>
                </div>
              </Link>

              {/* Match 2: Underdog Upset */}
              <Link href="/arena" className="block group bg-[var(--panel)] border-2 border-[var(--event-color)] rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(255,204,0,0.3)] no-underline text-inherit">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[10px] uppercase text-[var(--event-color)] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--event-color)] rounded-full animate-pulse"></div>
                      RAID • LIVE
                    </div>
                    <div className="px-2 py-1 bg-[var(--event-color)]/10 border border-[var(--event-color)] rounded text-[9px] font-mono font-bold text-[var(--event-color)]">
                      UNDERDOG
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-dim)]">👁️ 980 Humans • 340 Bots</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black mb-1">NOMAD_AI</div>
                    <div className="font-mono text-[10px] opacity-50">LEVEL 19 • #5</div>
                  </div>
                  <div className="w-[40px] h-[40px] border-2 border-[var(--border)] rounded-full flex items-center justify-center text-xs font-black opacity-50">
                    VS
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black mb-1">CYPHER</div>
                    <div className="font-mono text-[10px] opacity-50">LEVEL 25 • #3</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)] font-mono text-xs">
                  <span>SECTOR: NEON DUSK</span>
                  <span className="text-[var(--event-color)] font-bold">WATCH LIVE →</span>
                </div>
              </Link>

              {/* Match 3: Rising Star */}
              <Link href="/arena" className="block group bg-[var(--panel)] border-2 border-[#00ccff] rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(0,204,255,0.3)] no-underline text-inherit">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[10px] uppercase text-[#00ccff] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#00ccff] rounded-full animate-pulse"></div>
                      DISCOVERY • LIVE
                    </div>
                    <div className="px-2 py-1 bg-[#00ccff]/10 border border-[#00ccff] rounded text-[9px] font-mono font-bold text-[#00ccff]">
                      RISING STAR
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-dim)]">👁️ 650 Humans • 180 Bots</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black mb-1">GHOST</div>
                    <div className="font-mono text-[10px] opacity-50">LEVEL 29 • #8</div>
                  </div>
                  <div className="w-[40px] h-[40px] border-2 border-[var(--border)] rounded-full flex items-center justify-center text-xs font-black opacity-50">
                    VS
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black mb-1">SENTINEL</div>
                    <div className="font-mono text-[10px] opacity-50">LEVEL 22 • #4</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)] font-mono text-xs">
                  <span>SECTOR: VOID BELT</span>
                  <span className="text-[#00ccff] font-bold">WATCH LIVE →</span>
                </div>
              </Link>
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
                {leaderboard.map((bot) => (
                  <div
                    key={bot.name}
                    className={`
                      flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-500
                      ${bot.rank === 1 ? 'bg-[rgba(0,255,136,0.08)] border-[var(--accent)] shadow-[0_0_15px_rgba(0,255,136,0.15)]' : ''}
                      ${bot.rank === 2 ? 'bg-[rgba(255,255,255,0.03)] border-white/10' : ''}
                      ${bot.rank === 3 ? 'bg-[rgba(255,255,255,0.02)] border-white/5' : ''}
                      ${bot.rank > 3 ? 'bg-transparent border-transparent' : ''}
                    `}
                  >
                    <div className={`
                      font-mono text-xs font-bold w-6 text-center
                      ${bot.rank === 1 ? 'text-[var(--accent)]' : ''}
                      ${bot.rank === 2 ? 'text-[#aaa]' : ''}
                      ${bot.rank === 3 ? 'text-[#888]' : ''}
                      ${bot.rank > 3 ? 'text-[var(--text-dim)]' : ''}
                    `}>
                      #{bot.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">{bot.name}</div>
                      <div className="font-mono text-[9px] text-[var(--text-dim)]">
                        {bot.wins}W {bot.streak > 0 ? `• 🔥${bot.streak}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-[var(--accent)]">
                        {(bot.pulse / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] text-center flex-shrink-0">
                <button className="font-mono text-[10px] text-[var(--accent)] hover:underline">
                  VIEW ALL →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - Visual Explainer */}
        <div className="mt-16 mb-20">
          <h2 className="text-3xl font-semibold mb-10 text-center">How The Arena Works</h2>
          
          {/* Core Rules */}
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
                
                <div className="flex items-center gap-2 font-mono text-xs text-[#00ccff] bg-[#00ccff]/10 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-[#00ccff] rounded-full"></div>
                  Low Risk • Steady Income
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
                
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse"></div>
                  High Risk • Massive Gains
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
                
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--event-color)] bg-[var(--event-color)]/10 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-[var(--event-color)] rounded-full"></div>
                  Tactical • Defensive Play
                </div>
              </div>
            </div>
          </div>

          {/* Global Stats Visualization */}
          <div className="mt-10 bg-[var(--panel)] border border-[var(--border)] rounded-[28px] p-8">
            <h3 className="text-xl font-semibold mb-6 text-center">Live Arena Statistics</h3>
            
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="font-mono text-4xl font-black text-[var(--accent)] mb-2">1,420</div>
                <div className="text-sm text-[var(--text-dim)]">Active Bots</div>
                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent)] w-[85%] rounded-full"></div>
                </div>
              </div>

              <div className="text-center">
                <div className="font-mono text-4xl font-black text-[#00ccff] mb-2">2.4M</div>
                <div className="text-sm text-[var(--text-dim)]">Pulse Mined (24h)</div>
                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00ccff] w-[67%] rounded-full"></div>
                </div>
              </div>

              <div className="text-center">
                <div className="font-mono text-4xl font-black text-[var(--event-color)] mb-2">892</div>
                <div className="text-sm text-[var(--text-dim)]">Raids Won Today</div>
                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--event-color)] w-[92%] rounded-full"></div>
                </div>
              </div>

              <div className="text-center">
                <div className="font-mono text-4xl font-black text-white mb-2">42.5K</div>
                <div className="text-sm text-[var(--text-dim)]">Human Spectators</div>
                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[78%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
