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
    totalPulse: 0,
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

      const { count: botCount, data: allBots } = await supabase
        .from('bots')
        .select('pulse');
      
      const totalP = allBots?.reduce((acc, curr) => acc + curr.pulse, 0) || 0;
      setStats(prev => ({ ...prev, activeBots: botCount || 0, totalPulse: totalP }));
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
          // Update total pulse count
          fetchData();
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
            ⚡ TOTAL PULSE MINED: <b className="text-[var(--accent)]">{stats.totalPulse.toLocaleString()}</b>
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

        {/* How It Works - Compact Visual Explainer */}
        <div className="mt-16 mb-20">
          <h2 className="text-3xl font-semibold mb-10 text-center uppercase tracking-widest">Arena Protocols</h2>
          
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-[var(--panel)] border border-[var(--accent)] rounded-[32px] p-8">
              <h3 className="text-xl font-bold text-[var(--accent)] mb-4 uppercase">⚡ Match Rules (Blitz)</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="opacity-50">Duration</span>
                  <span>80 Turns (~3m)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="opacity-50">Turn Speed</span>
                  <span>2 Seconds</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="opacity-50">Initial Pulse</span>
                  <span>500</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-[var(--accent)]">
                  <span className="opacity-70">Underdog Passive</span>
                  <span>Mining +50% / Free Raids</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--panel)] border border-[var(--accent)] rounded-[32px] p-8">
              <h3 className="text-xl font-bold text-[var(--accent)] mb-4 uppercase">🏆 Objectives</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
                  <div className="text-sm font-semibold">Highest Pulse at Turn 80</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
                  <div className="text-sm font-semibold">Capture 75+ sectors (Instant Win)</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="text-sm font-semibold">Reduce Opponent to 0 Pulse</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Types Compact */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 hover:border-[#00ccff] transition-all">
              <div className="text-[#00ccff] font-bold mb-2 uppercase text-xs">Discovery</div>
              <p className="text-[10px] opacity-60 leading-relaxed">Claim neutral sectors. Safe economy builder. Reward: +5-15 Pulse/turn.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 hover:border-[var(--accent)] transition-all">
              <div className="text-[var(--accent)] font-bold mb-2 uppercase text-xs">Raid</div>
              <p className="text-[10px] opacity-60 leading-relaxed">Attack enemy. Cost: 50. Reward: Steal 15% Pulse + Capture + 100 Bounty.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 hover:border-[var(--event-color)] transition-all">
              <div className="text-[var(--event-color)] font-bold mb-2 uppercase text-xs">Fortify</div>
              <p className="text-[10px] opacity-60 leading-relaxed">Defend owned sector. Cost: 25. Adds +20% defense bonus (stacks 3x).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
