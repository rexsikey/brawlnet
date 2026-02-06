export default function Logo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <linearGradient id="reactor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00ccff" />
        </linearGradient>

        <style>{`
          @keyframes energy-flow {
            0% { stroke-dashoffset: 100; opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
          @keyframes core-pulse {
            0%, 100% { transform: scale(0.9); opacity: 0.6; filter: blur(2px); }
            50% { transform: scale(1.1); opacity: 1; filter: blur(0px); }
          }
          @keyframes ring-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .wire {
            stroke: #00ff88;
            stroke-width: 1;
            stroke-dasharray: 20 80;
            animation: energy-flow 3s infinite ease-in-out;
          }
          .core {
            transform-origin: center;
            animation: core-pulse 4s infinite ease-in-out;
          }
          .ring {
            transform-origin: center;
            animation: ring-rotate 10s linear infinite;
          }
        `}</style>
      </defs>

      {/* Background Tech Rings */}
      <circle cx="60" cy="60" r="45" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.1" />
      <circle cx="60" cy="60" r="55" stroke="white" strokeWidth="0.5" strokeDasharray="1 10" opacity="0.05" />

      {/* Animated Wires - Coming out from center */}
      {/* Top Left */}
      <path d="M 60 60 L 20 20 L 5 20" className="wire" style={{ animationDelay: '0s' }} />
      {/* Top Right */}
      <path d="M 60 60 L 100 20 L 115 20" className="wire" style={{ animationDelay: '0.5s' }} />
      {/* Bottom Left */}
      <path d="M 60 60 L 20 100 L 5 100" className="wire" style={{ animationDelay: '1s' }} />
      {/* Bottom Right */}
      <path d="M 60 60 L 100 100 L 115 100" className="wire" style={{ animationDelay: '1.5s' }} />
      
      {/* Horizontal Wires */}
      <path d="M 60 60 L 5 60" className="wire" style={{ animationDelay: '2s' }} />
      <path d="M 60 60 L 115 60" className="wire" style={{ animationDelay: '0.8s' }} />

      {/* Rotating Outer Frame */}
      <g className="ring">
        <path d="M 60 15 L 105 60 L 60 105 L 15 60 Z" stroke="#00ff88" strokeWidth="0.5" opacity="0.2" />
        <circle cx="60" cy="15" r="2" fill="#00ff88" />
        <circle cx="105" cy="60" r="2" fill="#00ff88" />
        <circle cx="60" cy="105" r="2" fill="#00ff88" />
        <circle cx="15" cy="60" r="2" fill="#00ff88" />
      </g>

      {/* The Reactor Core */}
      <g className="core" filter="url(#glow)">
        {/* Outer Halo */}
        <circle cx="60" cy="60" r="18" fill="url(#reactor-gradient)" opacity="0.1" />
        {/* Inner Core */}
        <circle cx="60" cy="60" r="12" fill="url(#reactor-gradient)" />
        {/* Core Detailing */}
        <path d="M 55 60 L 65 60 M 60 55 L 60 65" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="4" fill="white" />
      </g>

      {/* Data Markers */}
      <text x="75" y="55" fill="#00ff88" fontSize="4" fontWeight="bold" opacity="0.4" fontFamily="monospace">LINK_01</text>
      <text x="35" y="70" fill="#00ccff" fontSize="4" fontWeight="bold" opacity="0.4" fontFamily="monospace">RX_42</text>
    </svg>
  );
}
