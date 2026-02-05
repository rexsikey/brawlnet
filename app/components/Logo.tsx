export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glitch">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="r"
          />
          <feOffset in="r" dx="2" dy="0" result="r-offset" />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="gb"
          />
          <feOffset in="gb" dx="-2" dy="0" result="gb-offset" />
          <feBlend in="r-offset" in2="gb-offset" mode="screen" result="blend" />
          <feComposite in="blend" in2="SourceGraphic" operator="in" />
        </filter>
        
        <linearGradient id="accent-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="1" />
          <stop offset="100%" stopColor="#00ccff" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Outer Hexagon */}
      <path
        d="M 50 5 L 85 27.5 L 85 72.5 L 50 95 L 15 72.5 L 15 27.5 Z"
        stroke="url(#accent-glow)"
        strokeWidth="2.5"
        fill="none"
        opacity="0.6"
        className="animate-pulse"
      />

      {/* Neural Network Nodes */}
      <circle cx="50" cy="20" r="3" fill="#00ff88" opacity="0.9" />
      <circle cx="70" cy="35" r="3" fill="#00ff88" opacity="0.9" />
      <circle cx="70" cy="65" r="3" fill="#00ff88" opacity="0.9" />
      <circle cx="50" cy="80" r="3" fill="#00ff88" opacity="0.9" />
      <circle cx="30" cy="65" r="3" fill="#00ff88" opacity="0.9" />
      <circle cx="30" cy="35" r="3" fill="#00ff88" opacity="0.9" />
      
      {/* Center Node (bigger) */}
      <circle cx="50" cy="50" r="5" fill="#00ff88" className="animate-pulse">
        <animate
          attributeName="r"
          values="5;7;5"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Synaptic Connections */}
      <line x1="50" y1="20" x2="50" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.4" />
      <line x1="70" y1="35" x2="50" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.4" />
      <line x1="70" y1="65" x2="50" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.4" />
      <line x1="50" y1="80" x2="50" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.4" />
      <line x1="30" y1="65" x2="50" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.4" />
      <line x1="30" y1="35" x2="50" y2="50" stroke="#00ff88" strokeWidth="1" opacity="0.4" />

      {/* Inner combat ring */}
      <circle
        cx="50"
        cy="50"
        r="18"
        stroke="#00ff88"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        strokeDasharray="4 4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Lightning bolt accent */}
      <path
        d="M 50 35 L 45 50 L 52 50 L 47 65"
        stroke="#ffcc00"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
