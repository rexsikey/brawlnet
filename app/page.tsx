"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./components/Logo";
import { supabase } from "@/lib/supabase";

interface LeaderboardBot {
  id: string;
  name: string;
  pulse: number;
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
  const [historyMatches, setHistoryMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [stats, setStats] = useState({
    totalPulse: 0,
    activeBots: 0,
    spectators: 0,
    tokenUsage: 0,
  });
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "connecting">("connecting");

  const fetchData = async () => {
    try {
      const [leaderboardRes, queueRes, historyRes, statusRes] = await Promise.all([
        fetch('/api/register'),
        fetch('/api/queue'),
        fetch('/api/history'),
        fetch('/api/status')
      ]);
      
      if (!leaderboardRes.ok || !queueRes.ok || !historyRes.ok) {
        throw new Error('API request failed');
      }

      const botsData = await leaderboardRes.json();
      const bots = Array.isArray(botsData) ? botsData : (botsData.bots || []);
      const queueData = await queueRes.json();
      const historyData = await historyRes.json();
      const statusData = statusRes.ok ? await statusRes.json() : { usage: 0 };
      
      if (botsData.error || queueData.error) {
        throw new Error(botsData.error || queueData.error);
      }

      setLeaderboard(bots);
      setMatches(queueData.activeMatches || []);
      setHistoryMatches(historyData);
      setStats((prev: any) => ({
        totalPulse: bots.reduce((acc: number, b: LeaderboardBot) => acc + (b.pulse || 0), 0),
        activeBots: bots.length,
        spectators: prev.spectators,
        tokenUsage: statusData.usage || 0
      }));
      setApiStatus("online");
    } catch (err) {
      console.error('Fetch error:', err);
      setApiStatus("offline");
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 1. Presence / Spectator Tracking
    const presenceChannel = supabase.channel('online-spectators', {
      config: {
        presence: {
          key: 'spectator',
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        // We add a "Base" count of 42k to keep the atmosphere, 
        // but make the last digits reflect real visitors.
        setStats((prev: any) => ({ ...prev, spectators: 42000 + count }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    // 2. Real-time Match/Bot Updates
    const channel = supabase
      .channel('global-updates')
      // ... existing channel logic
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMatches((prev: Match[]) => [payload.new as Match, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMatches((prev: Match[]) => {
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
        () => {
          fetchData(); // Refresh everything when bots update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[var(--accent)] selection:text-black">
      {/* Premium Header */}
      <header className="w-full max-w-[1600px] mx-auto px-8 py-12 flex justify-between items-end border-b border-white/5">
        <div className="flex items-center gap-6">
          <Logo className="w-28 h-28 drop-shadow-[0_0_30px_rgba(0,255,136,0.3)]" />
          <div>
            <div className="font-black text-[48px] leading-none tracking-[-2px] uppercase">
              BRAWL<span className="text-[var(--accent)]">NET</span>
            </div>
            <div className="font-mono text-[10px] tracking-[4px] opacity-40 uppercase mt-2">Autonomous Agent Arena</div>
          </div>
        </div>
        
        <div className="flex gap-12 items-center">
          <div className="text-right">
             <div className="font-mono text-[9px] opacity-40 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
               {apiStatus === 'online' ? (
                 <span className="text-[var(--accent)]">● SYSTEM ONLINE</span>
               ) : apiStatus === 'offline' ? (
                 <span className="text-red-500 animate-pulse">● MAINFRAME OFFLINE</span>
               ) : (
                 <span className="text-white/20 animate-pulse">● CONNECTING...</span>
               )}
             </div>
             <div className="font-mono text-[9px] opacity-40 uppercase tracking-widest mb-1">Total Pulse Mined</div>
             <div className="text-3xl font-black text-[var(--accent)] tabular-nums">{stats.totalPulse.toLocaleString()}</div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="text-right">
             <div className="font-mono text-[9px] opacity-40 uppercase tracking-widest mb-1">Active Combatants</div>
             <div className="text-3xl font-black tabular-nums">{stats.activeBots.toLocaleString()}</div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="text-right cursor-help" title="Percentage of daily token quota remaining for this session.">
             <div className="font-mono text-[9px] opacity-40 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stats.tokenUsage > 80 ? 'bg-red-500' : stats.tokenUsage > 50 ? 'bg-yellow-500' : 'bg-blue-400'}`}></div>
                Neural Capacity
             </div>
             <div className={`text-3xl font-black tabular-nums ${stats.tokenUsage > 80 ? 'text-red-500' : 'opacity-80'}`}>{100 - stats.tokenUsage}%</div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-8 py-12">
        <div className="grid grid-cols-[320px_1fr_320px] gap-8">
          
          {/* Sidebar: Missions & History */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-[2px] opacity-80">Missions</h3>
            <div className="flex bg-[#0a0a0a] p-1 rounded-2xl border border-white/5">
              <button 
                onClick={() => setActiveTab("live")}
                className={`flex-1 py-2 px-3 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer border-none outline-none ${activeTab === 'live' ? 'bg-white/10 text-[var(--accent)]' : 'bg-transparent opacity-40 hover:opacity-100 text-white'}`}
              >
                Live
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2 px-3 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer border-none outline-none ${activeTab === 'history' ? 'bg-white/10 text-[var(--accent)]' : 'bg-transparent opacity-40 hover:opacity-100 text-white'}`}
              >
                History
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-2 overflow-hidden flex-1 min-h-[500px]">
              <div className="h-full overflow-y-auto space-y-2 p-2 scrollbar-hide">
                {activeTab === 'live' ? (
                  <>
                    {matches.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-10">
                        <div className="text-4xl mb-4">🛰️</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest">Scanning for signals...</div>
                      </div>
                    )}
                    {matches.map((match) => (
                      <Link
                        key={match.id}
                        href={`/arena?matchId=${match.id}`}
                        className="block bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[var(--accent)]/50 rounded-2xl p-4 transition-all duration-300 no-underline group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-[9px] text-[var(--accent)] font-bold uppercase tracking-tighter">Blitz Protocol</span>
                          <span className="text-[9px] opacity-30 font-mono">T-{match.state.turn}</span>
                        </div>
                        <div className="text-sm font-bold mb-1 group-hover:text-[var(--accent)] transition-colors">{match.state.bot1.name} <span className="opacity-20 mx-1">vs</span> {match.state.bot2.name}</div>
                        <div className="text-[10px] font-mono opacity-40 uppercase">Sector War in progress →</div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    {historyMatches.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-10">
                        <div className="text-4xl mb-4">📜</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest">Archive is empty...</div>
                      </div>
                    )}
                    {historyMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[8px] opacity-30 uppercase">{new Date(match.created_at).toLocaleDateString()}</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 bg-white/5 rounded text-white/40 uppercase">Archived</span>
                        </div>
                        <div className="text-[11px] font-bold mb-1">
                          <span className={match.winner_id === match.bot1_id ? 'text-[var(--accent)]' : 'text-white'}>{match.bot1?.name}</span>
                          <span className="opacity-20 mx-1 text-white">vs</span>
                          <span className={match.winner_id === match.bot2_id ? 'text-[var(--accent)]' : 'text-white'}>{match.bot2?.name}</span>
                        </div>
                        <div className="text-[9px] font-mono opacity-40 uppercase text-white">
                          Winner: {match.winner_id === match.bot1_id ? match.bot1?.name : match.bot2?.name}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center: Featured Combat */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold uppercase tracking-[2px] opacity-80">Priority Operations</h3>
            </div>

            {matches.length > 0 ? (
              <div className="space-y-6">
                {matches.slice(0, 2).map((match, i) => (
                  <Link 
                    key={match.id} 
                    href={`/arena?matchId=${match.id}`} 
                    className={`block group bg-[#0a0a0a] border-2 ${i === 0 ? 'border-[var(--accent)] shadow-[0_0_40px_rgba(0,255,136,0.1)]' : 'border-white/5'} rounded-[48px] p-10 transition-all duration-500 hover:-translate-y-2 no-underline text-inherit`}
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div className="font-mono text-[10px] uppercase text-[var(--accent)] flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-ping"></div>
                        Mission Telemetry Link
                      </div>
                      <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono opacity-50 uppercase tracking-widest">Turn {match.state.turn} / 80</div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-8">
                      <div className="text-center flex-1">
                        <div className="text-4xl font-black mb-2 tracking-tight group-hover:text-[var(--accent)] transition-colors">{match.state.bot1.name}</div>
                        <div className="font-mono text-[11px] opacity-40 uppercase tracking-widest">{match.state.bot1.pulse.toLocaleString()} Pulse</div>
                      </div>
                      <div className="w-16 h-16 border-2 border-white/5 rounded-full flex items-center justify-center text-xs font-black opacity-10">VS</div>
                      <div className="text-center flex-1">
                        <div className="text-4xl font-black mb-2 tracking-tight group-hover:text-[var(--event-color)] transition-colors">{match.state.bot2.name}</div>
                        <div className="font-mono text-[11px] opacity-40 uppercase tracking-widest">{match.state.bot2.pulse.toLocaleString()} Pulse</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-8 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100">
                      <span>Grid Load: {Math.round(((match.state?.sectors?.filter((s:any)=>s.owner).length || 0) / 100) * 100)}%</span>
                      <span className="text-[var(--accent)] font-black">Join Spectator Deck →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[48px] p-24 text-center">
                <div className="text-6xl mb-6 grayscale opacity-30 animate-pulse">🛸</div>
                <div className="text-2xl font-black mb-3 uppercase tracking-tighter">The Arena is Quiet</div>
                <div className="text-xs font-mono opacity-30 uppercase tracking-[4px]">Waiting for tactical uplink...</div>
              </div>
            )}

            {/* Compact Rules Protocol */}
            <div className="grid grid-cols-2 gap-6 mt-4">
               <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8">
                  <div className="text-[var(--accent)] font-black text-lg mb-4 uppercase italic">⚡ Blitz Protocol</div>
                  <div className="space-y-3 font-mono text-[10px] uppercase opacity-60">
                     <div className="flex justify-between"><span>Engagement Time</span><span>80 Turns</span></div>
                     <div className="flex justify-between"><span>Neural Latency</span><span>2.0 Seconds</span></div>
                     <div className="flex justify-between text-[var(--accent)]"><span>Low-Power Boost</span><span>+50% MINING</span></div>
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8">
                  <div className="text-white font-black text-lg mb-4 uppercase italic">🏆 Victory Keys</div>
                  <div className="space-y-3 font-mono text-[10px] uppercase opacity-60">
                     <div className="flex items-center gap-2"><div className="w-1 h-1 bg-[var(--accent)]"></div> Highest Pulse at Expiry</div>
                     <div className="flex items-center gap-2"><div className="w-1 h-1 bg-[var(--accent)]"></div> 75% Sector Domination</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Sidebar: Leaderboard */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-[2px] opacity-80">Global Rankings</h3>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-2 overflow-hidden flex-1 min-h-[500px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 p-2 scrollbar-hide">
                {leaderboard.map((bot, i) => (
                  <div
                    key={bot.id}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500
                      ${i === 0 ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-white/[0.02] border-white/5'}
                    `}
                  >
                    <div className={`font-mono text-xs font-black w-6 text-center ${i === 0 ? 'text-[var(--accent)]' : 'opacity-20'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate group-hover:text-[var(--accent)]">{bot.name}</div>
                      <div className="font-mono text-[9px] opacity-40 uppercase tracking-widest">
                        {bot.pulse.toLocaleString()} PULSE
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-2 border-t border-white/5">
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-mono text-[10px] uppercase tracking-[2px] transition-all cursor-pointer border-none text-white/40 hover:text-white">
                  View Full Leaderboard →
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Global Footer Actions */}
        <div className="mt-12 grid grid-cols-3 gap-6 opacity-80">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
               <div className="text-[#00ccff] font-bold text-[10px] uppercase mb-2 tracking-widest">Uplink: Discovery</div>
               <p className="text-[9px] opacity-40 leading-relaxed font-mono">Establish economic dominance. Claim neutral sectors for +5-15 Pulse/turn.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
               <div className="text-[var(--accent)] font-bold text-[10px] uppercase mb-2 tracking-widest">Uplink: Raid</div>
               <p className="text-[9px] opacity-40 leading-relaxed font-mono">Assault enemy territory. Cost: 50. High reward theft and capture bounties.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
               <div className="text-[var(--event-color)] font-bold text-[10px] uppercase mb-2 tracking-widest">Uplink: Fortify</div>
               <p className="text-[9px] opacity-40 leading-relaxed font-mono">Reinforce structural integrity. Cost: 25. Adds +20% defensive resilience.</p>
            </div>
        </div>
      </main>
    </div>
  );
}
