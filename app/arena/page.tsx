"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "../components/Logo";
import { supabase } from "@/lib/supabase";
import { GameState, SectorState } from "@/lib/referee";

interface LogEntry {
  turn: number;
  type: string;
  amount: number;
  timestamp: string;
}

function ArenaContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const [match, setMatch] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [pulseDelta1, setPulseDelta1] = useState<number | null>(null);
  const [pulseDelta2, setPulseDelta2] = useState<number | null>(null);
  
  const [history1, setHistory1] = useState<LogEntry[]>([]);
  const [history2, setHistory2] = useState<LogEntry[]>([]);
  
  const prevPulse1 = useRef<number>(0);
  const prevPulse2 = useRef<number>(0);
  const prevTurn = useRef<number>(0);

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('state')
        .eq('id', matchId)
        .single();
      
      if (data) {
        const state = data.state as GameState;
        setMatch(state);
        prevPulse1.current = state.bot1.pulse;
        prevPulse2.current = state.bot2.pulse;
        prevTurn.current = state.turn;
      }
      setLoading(false);
    };

    fetchMatch();

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
          
          // Calculate Deltas and History
          const delta1 = newState.bot1.pulse - prevPulse1.current;
          const delta2 = newState.bot2.pulse - prevPulse2.current;
          
          if (delta1 !== 0) {
            setPulseDelta1(delta1);
            setTimeout(() => setPulseDelta1(null), 3000);
            
            // Derive Action Type (Roughly)
            let actionType = delta1 > 200 ? "RAID SUCCESS" : delta1 < 0 ? "RAID / FORTIFY" : "MINING";
            setHistory1(prev => [{
              turn: newState.turn,
              type: actionType,
              amount: delta1,
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev].slice(0, 5));
          }
          
          if (delta2 !== 0) {
            setPulseDelta2(delta2);
            setTimeout(() => setPulseDelta2(null), 3000);
            
            let actionType = delta2 > 200 ? "RAID SUCCESS" : delta2 < 0 ? "RAID / FORTIFY" : "MINING";
            setHistory2(prev => [{
              turn: newState.turn,
              type: actionType,
              amount: delta2,
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev].slice(0, 5));
          }

          prevPulse1.current = newState.bot1.pulse;
          prevPulse2.current = newState.bot2.pulse;
          prevTurn.current = newState.turn;
          
          setMatch(newState);
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

  const isMatchOver = match.status === 'completed';
  const winnerId = match.winner;

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-[1400px] mx-auto mb-10 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-4 no-underline text-white group">
          <Logo className="w-12 h-12 transition-transform group-hover:scale-110" />
          <div className="font-black text-2xl tracking-[2px] uppercase">
            ONGOING <span className="text-[var(--accent)]">MATCH</span>
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

      <div className="max-w-[1400px] mx-auto grid grid-cols-[380px_1fr_380px] gap-8">
        {/* Left Telemetry: Bot 1 */}
        <div className="space-y-6">
          <div className={`bg-[var(--panel)] border-2 ${isMatchOver && winnerId === match.bot1.id ? 'border-[var(--accent)] shadow-[0_0_40px_rgba(0,255,136,0.4)]' : isMatchOver && winnerId !== match.bot1.id ? 'border-red-900 opacity-80' : 'border-[var(--border)]'} rounded-[40px] p-8 relative overflow-hidden transition-all duration-700`}>
            {isMatchOver && winnerId === match.bot1.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="text-[60px] font-black text-[var(--accent)] drop-shadow-[0_0_20px_rgba(0,255,136,0.8)] animate-pulse rotate-[-12deg] tracking-tighter">WINNER</div>
              </div>
            )}
            {isMatchOver && winnerId !== match.bot1.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 grayscale">
                <div className="text-[60px] font-black text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)] rotate-[-12deg] tracking-tighter opacity-50">LOSER</div>
              </div>
            )}
            
            <div className="mb-8">
              <div className="font-mono text-[11px] text-[var(--accent)] uppercase mb-2 tracking-widest opacity-70">STRIKER_01</div>
              <div className="text-4xl font-black tracking-tight">{match.bot1.name}</div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="font-mono text-[10px] opacity-50 mb-1 uppercase">Pulse Energy</div>
                <div className="text-5xl font-black text-[var(--accent)] flex items-end gap-3">
                  {match.bot1.pulse.toLocaleString()}
                  {pulseDelta1 !== null && (
                    <span className={`text-xl font-bold animate-bounce ${pulseDelta1 > 0 ? 'text-[var(--accent)]' : 'text-red-500'}`}>
                      {pulseDelta1 > 0 ? `+${pulseDelta1}` : pulseDelta1}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="font-mono text-[10px] opacity-50 mb-1 uppercase">Sectors</div>
                  <div className="text-2xl font-black">{match.bot1.sectors.length}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="font-mono text-[10px] opacity-50 mb-1 uppercase">Control</div>
                  <div className="text-2xl font-black">{Math.round((match.bot1.sectors.length / 100) * 100)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* PULSE HISTORY WINDOW 1 */}
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[32px] p-6 h-[250px] font-mono">
            <div className="text-[10px] uppercase tracking-widest text-[var(--accent)] mb-4 flex justify-between items-center">
              <span>Tactical Pulse Log</span>
              <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {history1.length === 0 && <div className="text-[9px] opacity-30 text-center py-10">WAITING FOR DATA...</div>}
              {history1.map((entry, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2 last:border-0">
                  <div className="flex gap-3 items-center">
                    <span className="opacity-40">{entry.timestamp}</span>
                    <span className="font-bold">{entry.type}</span>
                  </div>
                  <span className={entry.amount > 0 ? 'text-[var(--accent)]' : 'text-red-500'}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: The Grid */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[40px] p-8 aspect-square relative flex items-center justify-center">
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
                      ${isBot1 ? 'bg-[rgba(0,255,136,0.4)] border-[var(--accent)] shadow-[0_0_10px_rgba(0,255,136,0.2)]' : ''}
                      ${isBot2 ? 'bg-[rgba(255,204,0,0.4)] border-[var(--event-color)] shadow-[0_0_10px_rgba(255,204,0,0.2)]' : ''}
                      ${!sector.owner ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' : ''}
                    `}
                  >
                    {sector.fortifications > 0 && (
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                        {Array.from({ length: sector.fortifications }).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-white rounded-full opacity-80"></div>
                        ))}
                      </div>
                    )}
                    
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

          <div className="flex justify-between items-center bg-[var(--panel)] border border-[var(--border)] rounded-[32px] px-10 py-6 font-mono">
            <div className="flex items-center gap-12">
              <div className="text-center">
                <div className="text-[11px] opacity-50 mb-1 uppercase tracking-widest">Global Turn</div>
                <div className="text-3xl font-black">{match.turn} <span className="text-sm opacity-30">/ {match.maxTurns}</span></div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="text-center">
                <div className="text-[11px] opacity-50 mb-1 uppercase tracking-widest">Arena Load</div>
                <div className="text-3xl font-black text-[var(--accent)]">{match.sectors.filter(s => s.owner).length}%</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[11px] opacity-50 uppercase tracking-widest">Time to Expiry</div>
                <div className="text-3xl font-black">{Math.max(0, 10 - Math.floor((Date.now() - match.startTime) / 60000))}m</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Telemetry: Bot 2 */}
        <div className="space-y-6 text-right">
          <div className={`bg-[var(--panel)] border-2 ${isMatchOver && winnerId === match.bot2.id ? 'border-[var(--event-color)] shadow-[0_0_40px_rgba(255,204,0,0.4)]' : isMatchOver && winnerId !== match.bot2.id ? 'border-red-900 opacity-80' : 'border-[var(--border)]'} rounded-[40px] p-8 relative overflow-hidden transition-all duration-700`}>
            {isMatchOver && winnerId === match.bot2.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="text-[60px] font-black text-[var(--event-color)] drop-shadow-[0_0_20px_rgba(255,204,0,0.8)] animate-pulse rotate-[12deg] tracking-tighter">WINNER</div>
              </div>
            )}
            {isMatchOver && winnerId !== match.bot2.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 grayscale">
                <div className="text-[60px] font-black text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)] rotate-[12deg] tracking-tighter opacity-50">LOSER</div>
              </div>
            )}
            
            <div className="mb-8">
              <div className="font-mono text-[11px] text-[var(--event-color)] uppercase mb-2 tracking-widest opacity-70 text-right">STRIKER_02</div>
              <div className="text-4xl font-black tracking-tight">{match.bot2.name}</div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="font-mono text-[10px] opacity-50 mb-1 uppercase text-right">Pulse Energy</div>
                <div className="text-5xl font-black text-[var(--event-color)] flex items-end justify-end gap-3">
                  {pulseDelta2 !== null && (
                    <span className={`text-xl font-bold animate-bounce ${pulseDelta2 > 0 ? 'text-[var(--event-color)]' : 'text-red-500'}`}>
                      {pulseDelta2 > 0 ? `+${pulseDelta2}` : pulseDelta2}
                    </span>
                  )}
                  {match.bot2.pulse.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                  <div className="font-mono text-[10px] opacity-50 mb-1 uppercase">Sectors</div>
                  <div className="text-2xl font-black">{match.bot2.sectors.length}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                  <div className="font-mono text-[10px] opacity-50 mb-1 uppercase">Control</div>
                  <div className="text-2xl font-black">{Math.round((match.bot2.sectors.length / 100) * 100)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* PULSE HISTORY WINDOW 2 */}
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[32px] p-6 h-[250px] font-mono text-left">
            <div className="text-[10px] uppercase tracking-widest text-[var(--event-color)] mb-4 flex justify-between items-center">
              <span>Tactical Pulse Log</span>
              <div className="w-1.5 h-1.5 bg-[var(--event-color)] rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {history2.length === 0 && <div className="text-[9px] opacity-30 text-center py-10">WAITING FOR DATA...</div>}
              {history2.map((entry, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2 last:border-0">
                  <div className="flex gap-3 items-center">
                    <span className="opacity-40">{entry.timestamp}</span>
                    <span className="font-bold">{entry.type}</span>
                  </div>
                  <span className={entry.amount > 0 ? 'text-[var(--event-color)]' : 'text-red-500'}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}
                  </span>
                </div>
              ))}
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
