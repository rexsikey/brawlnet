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

interface PulsePoint {
  turn: number;
  p1: number;
  p2: number;
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
  const [graphPoints, setGraphPoints] = useState<PulsePoint[]>([]);
  
  const prevPulse1 = useRef<number>(0);
  const prevPulse2 = useRef<number>(0);

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
        setGraphPoints([{ turn: state.turn, p1: state.bot1.pulse, p2: state.bot2.pulse }]);
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
          
          const delta1 = newState.bot1.pulse - prevPulse1.current;
          const delta2 = newState.bot2.pulse - prevPulse2.current;
          
          if (delta1 !== 0) {
            setPulseDelta1(delta1);
            setTimeout(() => setPulseDelta1(null), 3000);
            let actionType = delta1 > 100 ? "RAID SUCCESS" : delta1 < 0 ? "RAID/FORTIFY" : "MINING";
            setHistory1(prev => [{
              turn: newState.turn,
              type: actionType,
              amount: delta1,
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev].slice(0, 15));
          }
          
          if (delta2 !== 0) {
            setPulseDelta2(delta2);
            setTimeout(() => setPulseDelta2(null), 3000);
            let actionType = delta2 > 100 ? "RAID SUCCESS" : delta2 < 0 ? "RAID/FORTIFY" : "MINING";
            setHistory2(prev => [{
              turn: newState.turn,
              type: actionType,
              amount: delta2,
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev].slice(0, 15));
          }

          setGraphPoints(prev => [...prev, { turn: newState.turn, p1: newState.bot1.pulse, p2: newState.bot2.pulse }].slice(-50));
          prevPulse1.current = newState.bot1.pulse;
          prevPulse2.current = newState.bot2.pulse;
          setMatch(newState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono text-[var(--accent)]">LOADING TELEMETRY...</div>;
  if (!match) return <div className="min-h-screen flex items-center justify-center font-mono">MISSION NOT FOUND</div>;

  const isMatchOver = match.status === 'completed';
  const winnerId = match.winner;

  // Simple Graph Path Calculation
  const maxPulse = Math.max(...graphPoints.map(p => Math.max(p.p1, p.p2)), 1000);
  const getPath = (player: 'p1' | 'p2') => {
    if (graphPoints.length < 2) return "";
    return graphPoints.map((p, i) => {
      const x = (i / (graphPoints.length - 1)) * 100;
      const y = 100 - (p[player] / maxPulse) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      {/* Top Navigation */}
      <header className="max-w-[1600px] mx-auto mb-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 no-underline text-white opacity-80 hover:opacity-100">
          <Logo className="w-12 h-12" />
          <div className="font-bold text-sm tracking-widest uppercase">Ongoing Match</div>
        </Link>
        <div className="flex gap-4 font-mono text-[9px] opacity-50">
          <div>ID: {match.matchId}</div>
          <div className="text-[var(--accent)] animate-pulse">● LIVE TELEMETRY</div>
        </div>
      </header>

      {/* Main Grid: Telemetry | Grid | Telemetry */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-[320px_1fr_320px] gap-6">
        
        {/* Left Side: Bot 1 Logs */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex-1 flex flex-col overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--accent)] mb-4 border-b border-white/5 pb-2 flex justify-between">
              <span>{match.bot1.name} Logs</span>
              <span className="opacity-50">#01</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
              {history1.map((e, i) => (
                <div key={i} className="flex justify-between font-mono text-[9px] border-b border-white/[0.03] pb-1 animate-in fade-in slide-in-from-left-2">
                  <span className="opacity-30">{e.timestamp}</span>
                  <span className="flex-1 px-2 truncate">{e.type}</span>
                  <span className={e.amount > 0 ? 'text-[var(--accent)]' : 'text-red-500'}>
                    {e.amount > 0 ? '+' : ''}{e.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Section: Scores -> Grid -> Graph */}
        <div className="flex flex-col gap-6">
          
          {/* Header Scores */}
          <div className="flex justify-center items-center gap-12 bg-[#0a0a0a] border border-white/10 rounded-[32px] py-6 px-12 relative overflow-hidden">
             {/* Winner Overlay */}
             {isMatchOver && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-md animate-in fade-in duration-1000">
                 <div className={`text-6xl font-black italic tracking-tighter mb-8 ${winnerId === match.bot1.id ? 'text-[var(--accent)]' : 'text-[var(--event-color)]'} drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]`}>
                   {match.bot1.id === winnerId ? match.bot1.name : match.bot2.name} VICTORIOUS
                 </div>
                 
                 <div className="flex gap-4">
                    <Link 
                      href="/"
                      className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-mono text-xs uppercase tracking-[2px] transition-all no-underline text-white border border-white/10"
                    >
                      Return to Command Center
                    </Link>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-8 py-3 bg-[var(--accent)] text-black hover:opacity-80 rounded-2xl font-black text-xs uppercase tracking-[2px] transition-all border-none cursor-pointer"
                    >
                      Rematch (Reload Uplink)
                    </button>
                 </div>
               </div>
             )}

             <div className="text-right flex-1">
                <div className="text-[10px] font-mono text-[var(--accent)] opacity-50 uppercase mb-1 tracking-widest">Pulse Bot Alpha</div>
                <div className="text-6xl font-black tracking-tighter text-[var(--accent)] flex items-center justify-end gap-4">
                   {pulseDelta1 !== null && <span className="text-xl animate-bounce">{pulseDelta1 > 0 ? `+${pulseDelta1}` : pulseDelta1}</span>}
                   {match.bot1.pulse.toLocaleString()}
                </div>
                <div className="text-sm font-bold opacity-80 uppercase">{match.bot1.name}</div>
             </div>

             <div className="w-px h-16 bg-white/10"></div>

             <div className="text-left flex-1">
                <div className="text-[10px] font-mono text-[var(--event-color)] opacity-50 uppercase mb-1 tracking-widest">Pulse Bot Beta</div>
                <div className="text-6xl font-black tracking-tighter text-[var(--event-color)] flex items-center gap-4">
                   {match.bot2.pulse.toLocaleString()}
                   {pulseDelta2 !== null && <span className="text-xl animate-bounce">{pulseDelta2 > 0 ? `+${pulseDelta2}` : pulseDelta2}</span>}
                </div>
                <div className="text-sm font-bold opacity-80 uppercase">{match.bot2.name}</div>
             </div>
          </div>

          {/* Tactical Grid */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[48px] p-8 aspect-video relative flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
            <div className="grid grid-cols-10 grid-rows-10 gap-2 w-full h-full max-w-[800px]">
               {match.sectors.map((s: SectorState) => (
                 <div key={s.id} className={`rounded-sm border transition-all duration-700 ${s.owner === match.bot1.id ? 'bg-[var(--accent)]/40 border-[var(--accent)] shadow-[0_0_15px_rgba(0,255,136,0.15)]' : s.owner === match.bot2.id ? 'bg-[var(--event-color)]/40 border-[var(--event-color)] shadow-[0_0_15px_rgba(255,204,0,0.15)]' : 'bg-white/[0.02] border-white/5 opacity-20'}`}>
                    {s.fortifications > 0 && <div className="w-full h-full flex items-center justify-center text-[8px] font-bold opacity-50">🛡️{s.fortifications}</div>}
                 </div>
               ))}
            </div>
          </div>

          {/* Bottom Info & Graph */}
          <div className="grid grid-cols-[240px_1fr_240px] gap-6 items-stretch">
             <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 flex flex-col justify-center text-center font-mono">
                <div className="text-[10px] opacity-40 uppercase mb-1">Global Turn</div>
                <div className="text-3xl font-black">{match.turn} <span className="text-xs opacity-20">/ {match.maxTurns}</span></div>
             </div>

             <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 relative overflow-hidden h-[100px]">
                <div className="absolute top-2 left-4 text-[8px] font-mono opacity-30 uppercase tracking-[2px]">Real-time Pulse Dominance</div>
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d={getPath('p1')} fill="none" stroke="var(--accent)" strokeWidth="1" className="transition-all duration-1000" />
                  <path d={getPath('p2')} fill="none" stroke="var(--event-color)" strokeWidth="1" className="transition-all duration-1000" />
                </svg>
             </div>

             <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 flex flex-col justify-center text-center font-mono">
                <div className="text-[10px] opacity-40 uppercase mb-1">Arena Load</div>
                <div className="text-3xl font-black text-[var(--accent)]">{match.sectors.filter(s => s.owner).length}%</div>
             </div>
          </div>

        </div>

        {/* Right Side: Bot 2 Logs */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex-1 flex flex-col overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--event-color)] mb-4 border-b border-white/5 pb-2 flex justify-between">
              <span>#02</span>
              <span>{match.bot2.name} Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
              {history2.map((e, i) => (
                <div key={i} className="flex justify-between font-mono text-[9px] border-b border-white/[0.03] pb-1 animate-in fade-in slide-in-from-right-2">
                  <span className={e.amount > 0 ? 'text-[var(--event-color)]' : 'text-red-500'}>
                    {e.amount > 0 ? '+' : ''}{e.amount}
                  </span>
                  <span className="flex-1 px-2 truncate text-right">{e.type}</span>
                  <span className="opacity-30">{e.timestamp}</span>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono">INITIALIZING MISSION...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
