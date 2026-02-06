"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "../components/Logo";
import { supabase } from "@/lib/supabase";
import { GameState, SectorState } from "@/lib/referee";

function ArenaContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const [match, setMatch] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    // 1. Fetch initial match state
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('state')
        .eq('id', matchId)
        .single();
      
      if (data) {
        setMatch(data.state as GameState);
      }
      setLoading(false);
    };

    fetchMatch();

    // 2. Subscribe to real-time updates for THIS match
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          const newState = payload.new.state as GameState;
          setMatch(newState);
          
          // Flash effect for actions
          setLastAction(`UPDATE: TURN ${newState.turn}`);
          setTimeout(() => setLastAction(null), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-[var(--accent)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          LOADING TELEMETRY...
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-4xl mb-4">📡❌</div>
          <div className="text-xl font-bold mb-4">MISSION NOT FOUND</div>
          <Link href="/" className="text-[var(--accent)] hover:underline">RETURN TO BASE</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-[1400px] mx-auto mb-10 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-4 no-underline text-white group">
          <Logo className="w-12 h-12 transition-transform group-hover:scale-110" />
          <div className="font-black text-2xl tracking-[2px] uppercase">
            MISSION <span className="text-[var(--accent)]">CONTROL</span>
          </div>
        </Link>

        <div className="flex gap-6 font-mono text-[10px]">
          <div className="bg-white/[0.03] border border-[var(--border)] px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
            LIVE FEED: {match.matchId}
          </div>
          <div className="bg-white/[0.03] border border-[var(--border)] px-4 py-2 rounded-full">
            STATUS: <span className={match.status === 'active' ? 'text-[var(--accent)]' : 'text-red-500'}>{match.status.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto grid grid-cols-[350px_1fr_350px] gap-8">
        {/* Left Telemetry: Bot 1 */}
        <div className="space-y-6">
          <div className={`bg-[var(--panel)] border-2 ${match.winner === match.bot1.id ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(0,255,136,0.2)]' : 'border-[var(--border)]'} rounded-[32px] p-6`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="font-mono text-[10px] text-[var(--accent)] uppercase mb-1">STRIKER_01</div>
                <div className="text-2xl font-black">{match.bot1.name}</div>
              </div>
              {match.winner === match.bot1.id && (
                <div className="bg-[var(--accent)] text-black font-black text-[10px] px-2 py-1 rounded">WINNER</div>
              )}
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="opacity-50 text-[10px]">PULSE ENERGY</span>
                <span className="text-[var(--accent)] font-bold">{match.bot1.pulse.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="opacity-50 text-[10px]">SECTOR COUNT</span>
                <span className="font-bold">{match.bot1.sectors.length}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="opacity-50 text-[10px]">DOMINATION</span>
                <span className="font-bold">{Math.round((match.bot1.sectors.length / 100) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[24px] p-4 h-[300px] font-mono text-[9px] overflow-hidden">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
              <div className="w-1 h-1 bg-[var(--accent)] rounded-full"></div>
              LOCAL_LOGS: {match.bot1.name}
            </div>
            <div className="space-y-1 opacity-60">
              <div>[00:01:42] SYSTEM_BOOT: OK</div>
              <div>[00:01:43] NETWORK_LINK: ESTABLISHED</div>
              <div>[00:01:45] SCANNING_GRID...</div>
              <div>[00:02:10] SECTOR_{Math.floor(Math.random()*100)}: CLAIMED</div>
              {lastAction && <div>[{new Date().toLocaleTimeString()}] {lastAction}</div>}
            </div>
          </div>
        </div>

        {/* Center: The Grid */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[40px] p-8 aspect-square relative flex items-center justify-center">
            {/* Grid Overlay Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.05),transparent)] pointer-events-none"></div>
            
            <div className="grid grid-cols-10 grid-rows-10 gap-1.5 w-full h-full relative z-10">
              {match.sectors.map((sector: SectorState) => {
                const isBot1 = sector.owner === match.bot1.id;
                const isBot2 = sector.owner === match.bot2.id;
                
                return (
                  <div
                    key={sector.id}
                    className={`
                      relative group transition-all duration-500 rounded-sm border
                      ${isBot1 ? 'bg-[rgba(0,255,136,0.4)] border-[var(--accent)]' : ''}
                      ${isBot2 ? 'bg-[rgba(255,204,0,0.4)] border-[var(--event-color)]' : ''}
                      ${!sector.owner ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' : ''}
                    `}
                  >
                    {/* Fortification Pips */}
                    {sector.fortifications > 0 && (
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                        {Array.from({ length: sector.fortifications }).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-white rounded-full opacity-80"></div>
                        ))}
                      </div>
                    )}
                    
                    {/* Hover Info */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/90 border border-[var(--border)] p-1.5 rounded text-[8px] font-mono whitespace-nowrap z-20">
                        ID: {sector.id}<br/>
                        GEN: {sector.pulseGeneration}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center bg-[var(--panel)] border border-[var(--border)] rounded-full px-8 py-4 font-mono">
            <div className="flex items-center gap-10">
              <div className="text-center">
                <div className="text-[10px] opacity-50 mb-1 uppercase tracking-widest">Turn</div>
                <div className="text-xl font-black">{match.turn} <span className="text-xs opacity-30">/ {match.maxTurns}</span></div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-[10px] opacity-50 mb-1 uppercase tracking-widest">Grid Load</div>
                <div className="text-xl font-black text-[var(--accent)]">{match.sectors.filter(s => s.owner).length}%</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="text-[10px] opacity-50 uppercase tracking-widest">Time Remaining</div>
                <div className="text-xl font-black">{Math.max(0, 10 - Math.floor((Date.now() - match.startTime) / 60000))}m</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Telemetry: Bot 2 */}
        <div className="space-y-6 text-right">
          <div className={`bg-[var(--panel)] border-2 ${match.winner === match.bot2.id ? 'border-[var(--event-color)] shadow-[0_0_30px_rgba(255,204,0,0.2)]' : 'border-[var(--border)]'} rounded-[32px] p-6`}>
            <div className="flex justify-between items-start mb-6 flex-row-reverse">
              <div>
                <div className="font-mono text-[10px] text-[var(--event-color)] uppercase mb-1">STRIKER_02</div>
                <div className="text-2xl font-black">{match.bot2.name}</div>
              </div>
              {match.winner === match.bot2.id && (
                <div className="bg-[var(--event-color)] text-black font-black text-[10px] px-2 py-1 rounded">WINNER</div>
              )}
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2 flex-row-reverse">
                <span className="opacity-50 text-[10px]">PULSE ENERGY</span>
                <span className="text-[var(--event-color)] font-bold">{match.bot2.pulse.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 flex-row-reverse">
                <span className="opacity-50 text-[10px]">SECTOR COUNT</span>
                <span className="font-bold">{match.bot2.sectors.length}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 flex-row-reverse">
                <span className="opacity-50 text-[10px]">DOMINATION</span>
                <span className="font-bold">{Math.round((match.bot2.sectors.length / 100) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[24px] p-4 h-[300px] font-mono text-[9px] overflow-hidden text-left">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
              <div className="w-1 h-1 bg-[var(--event-color)] rounded-full"></div>
              LOCAL_LOGS: {match.bot2.name}
            </div>
            <div className="space-y-1 opacity-60">
              <div>[00:01:42] SYSTEM_BOOT: OK</div>
              <div>[00:01:43] NETWORK_LINK: ESTABLISHED</div>
              <div>[00:02:05] SCANNING_GRID...</div>
              <div>[00:02:15] SECTOR_{Math.floor(Math.random()*100)}: CLAIMED</div>
              {lastAction && <div>[{new Date().toLocaleTimeString()}] {lastAction}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div>LOADING MISSION...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
