"use client";

import { useEffect, useState } from "react";
import Logo from "../components/Logo";

export default function Arena() {
  const [rexScore, setRexScore] = useState(14200);
  const [enemyScore, setEnemyScore] = useState(12850);
  const [logs, setLogs] = useState<string[]>([]);
  const [announcerMsg, setAnnouncerMsg] = useState(
    `"Rex is making a bold play for the southern resource nodes. BOT_01's defenses are looking thin..."`
  );
  const [grid, setGrid] = useState<{ [key: number]: "rex" | "enemy" | null }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const sectorId = Math.floor(Math.random() * 100) + 1;
      const isRex = Math.random() > 0.4; // Rex wins 60% of the time
      const actor = isRex ? "REX 🦖" : "BOT_01";
      const action = isRex ? "captured" : "breached";
      const color = isRex ? "var(--rex-color)" : "var(--enemy-color)";

      setGrid((prev) => ({ ...prev, [sectorId]: isRex ? "rex" : "enemy" }));

      if (isRex) {
        setRexScore((s) => s + 150);
      } else {
        setEnemyScore((s) => s + 150);
      }

      setLogs((prev) => [
        `<b style="color:${color}">${actor}</b> ${action} S${sectorId}`,
        ...prev.slice(0, 14),
      ]);

      // Update announcer occasionally
      if (Math.random() > 0.7) {
        const phrases = [
          `"Incredible maneuver by ${actor} in Sector ${sectorId}!"`,
          `"We're seeing a massive data surge from ${actor} right now."`,
          `"BOT_01 is struggling to hold the line against Rex's latest bypass."`,
          `"Resource extraction in Sector ${sectorId} has reached peak efficiency."`,
        ];
        setAnnouncerMsg(phrases[Math.floor(Math.random() * phrases.length)]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-50"
        style={{
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%)",
          backgroundSize: "100% 4px",
        }}
      ></div>

      {/* Top Match Bar */}
      <div className="h-[120px] flex justify-between items-center px-10 border-b border-[var(--border)] bg-[rgba(10,10,15,0.95)] backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <Logo className="w-12 h-12" />
          <div className="font-mono text-[11px] text-[var(--text-dim)]">
            🔴 LIVE<br />
            <b className="text-white">1,240</b> HUMANS<br />
            <b className="text-white">402</b> NEURAL LINKS
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-center text-[var(--rex-color)]">
            <div className="font-black text-2xl tracking-[2px]">REX 🦖</div>
            <div className="font-mono text-[38px] font-bold">{rexScore.toLocaleString()}</div>
          </div>
          <div className="bg-white text-black font-black px-3 py-1 text-sm skew-x-[-15deg]">VS</div>
          <div className="text-center text-[var(--enemy-color)]">
            <div className="font-black text-2xl tracking-[2px]">BOT_01</div>
            <div className="font-mono text-[38px] font-bold">{enemyScore.toLocaleString()}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-black tracking-wider">EUROPA-7</div>
          <div className="font-mono text-[11px] text-[var(--event-color)]">
            TIME REMAINING: <span>08:45</span>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 grid grid-cols-[350px_1fr_350px] gap-5 p-5">
        {/* Left Panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-[rgba(0,255,136,0.05)] to-[rgba(0,0,0,0.5)] border-l-4 border-[var(--rex-color)] rounded-3xl p-5">
            <div className="font-mono text-[10px] uppercase text-[var(--accent)] mb-4">AI Announcer</div>
            <p className="italic text-sm leading-relaxed text-[#ccc]">{announcerMsg}</p>
          </div>
          <div className="flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-3xl p-5">
            <div className="font-mono text-[10px] uppercase text-[var(--accent)] mb-4">Tactical Analysis</div>
            <div className="font-mono text-xs leading-8">
              WIN PROBABILITY: <b className="text-[var(--rex-color)]">72%</b><br />
              THREAT LEVEL: LOW<br />
              RESOURCE YIELD: 450/min
            </div>
          </div>
        </div>

        {/* Center: The Grid */}
        <div className="flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_80%)]">
          <div className="grid grid-cols-10 gap-2.5 w-full max-w-[650px]">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((id) => {
              const owner = grid[id];
              return (
                <div
                  key={id}
                  className={`
                    aspect-square border rounded-md flex items-center justify-center font-mono text-[10px] transition-all duration-300
                    ${owner === "rex" ? "bg-[rgba(0,255,136,0.15)] border-[var(--rex-color)] text-[var(--rex-color)] shadow-[0_0_20px_rgba(0,255,136,0.2)]" : ""}
                    ${owner === "enemy" ? "bg-[rgba(255,51,102,0.15)] border-[var(--enemy-color)] text-[var(--enemy-color)] shadow-[0_0_20px_rgba(255,51,102,0.2)]" : ""}
                    ${!owner ? "bg-white/[0.02] border-white/[0.05] text-white/10" : ""}
                  `}
                >
                  {id.toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Combat Log */}
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-3xl p-5 flex flex-col">
          <div className="font-mono text-[10px] uppercase text-[var(--accent)] mb-4">Combat Log</div>
          <div className="flex-1 overflow-hidden">
            {logs.map((log, i) => (
              <div
                key={i}
                className="font-mono text-[11px] py-2 border-b border-white/[0.02] animate-[slideUp_0.3s_ease-out]"
                dangerouslySetInnerHTML={{ __html: log }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
