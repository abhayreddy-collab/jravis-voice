import React, { useEffect, useState } from 'react';
import { Mic, Activity, Eye, Zap } from 'lucide-react';

export default function ArcReactor({ state, isListening, isSpeaking }) {
  // state can be: 'idle', 'listening', 'thinking', 'speaking'
  const [activeState, setActiveState] = useState('idle');

  useEffect(() => {
    if (isListening) {
      setActiveState('listening');
    } else if (isSpeaking) {
      setActiveState('speaking');
    } else if (state === 'thinking') {
      setActiveState('thinking');
    } else {
      setActiveState('idle');
    }
  }, [state, isListening, isSpeaking]);

  // Determine glow color and texts depending on state
  let glowColor = 'var(--color-cyan)';
  let glowClass = 'pulse-glow';
  let innerText = 'STANDBY';
  let descText = 'HOME PROTOCOL ACTIVE';

  if (activeState === 'listening') {
    glowColor = 'var(--color-magenta)';
    innerText = 'LISTENING';
    descText = 'AWAITING VOICE COMMAND';
  } else if (activeState === 'thinking') {
    glowColor = 'var(--color-cyan)';
    innerText = 'THINKING';
    descText = 'PROCESSING QUERY';
  } else if (activeState === 'speaking') {
    glowColor = 'var(--color-green)';
    innerText = 'SPEAKING';
    descText = 'VOCAL FEEDBACK IN PROGRESS';
  }

  // Draw speech frequency lines for speaking state
  const renderSpeechWaves = () => {
    if (activeState !== 'speaking') return null;
    return (
      <div className="speech-waves">
        <div className="wave-bar bar-1"></div>
        <div className="wave-bar bar-2"></div>
        <div className="wave-bar bar-3"></div>
        <div className="wave-bar bar-4"></div>
        <div className="wave-bar bar-5"></div>
      </div>
    );
  };

  return (
    <div className="core-container">
      {/* Dynamic Sound Waves overlay at top */}
      {renderSpeechWaves()}

      <div style={{ position: 'relative', width: '280px', height: '280px' }}>
        {/* Glow Filters */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-magenta" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {/* Central Core Arc Reactor */}
        <svg 
          viewBox="0 0 200 200" 
          style={{ width: '100%', height: '100%', filter: `url(#glow-${activeState === 'listening' ? 'magenta' : activeState === 'speaking' ? 'green' : 'cyan'})` }}
          className={`${glowClass}`}
        >
          {/* Circular grids background */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(0, 240, 255, 0.03)" strokeWidth="1" />
          <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(0, 240, 255, 0.03)" strokeWidth="1" />
          <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(0, 240, 255, 0.03)" strokeWidth="1" />

          {/* Outer Segment Ring (Spinning) */}
          <g className={`ring ${activeState === 'thinking' ? 'spin-fast' : 'spin-slow'}`} style={{ stroke: glowColor }}>
            {/* Outer dashes */}
            <circle cx="100" cy="100" r="88" fill="none" strokeDasharray="10, 8" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="100" r="82" fill="none" strokeDasharray="30, 20, 10, 20" strokeWidth="3" opacity="0.6" />
          </g>

          {/* Middle Triangle Ring (Counter Spinning) */}
          <g className={`ring ${activeState === 'thinking' ? 'spin-reverse' : 'spin-fast'}`} style={{ stroke: glowColor }}>
            <circle cx="100" cy="100" r="68" fill="none" strokeDasharray="40, 15, 5, 15" strokeWidth="2.5" opacity="0.8" />
            <path d="M100 37 L155 132 L45 132 Z" fill="none" strokeWidth="1" opacity="0.15" />
          </g>

          {/* Reactor Inner Rings */}
          <circle 
            cx="100" 
            cy="100" 
            r="50" 
            fill="none" 
            stroke={glowColor} 
            strokeWidth="4" 
            strokeDasharray={activeState === 'listening' ? "20, 5" : "15, 10"}
            opacity="0.9"
            className={activeState === 'listening' ? 'spin-fast' : ''}
          />

          {/* Core Central Dot Indicator */}
          <circle 
            cx="100" 
            cy="100" 
            r="32" 
            fill="rgba(10, 15, 28, 0.9)" 
            stroke={glowColor} 
            strokeWidth="1.5" 
          />

          {/* Core pulsing circle */}
          <circle 
            cx="100" 
            cy="100" 
            r={activeState === 'listening' ? "24" : activeState === 'thinking' ? "18" : activeState === 'speaking' ? "22" : "20"} 
            fill={glowColor} 
            opacity={activeState === 'listening' ? 0.7 : 0.4}
            style={{ transition: 'r 0.15s ease' }}
          />

          {/* Geometric Target lines */}
          <line x1="100" y1="5" x2="100" y2="25" stroke={glowColor} strokeWidth="1" opacity="0.4" />
          <line x1="100" y1="175" x2="100" y2="195" stroke={glowColor} strokeWidth="1" opacity="0.4" />
          <line x1="5" y1="100" x2="25" y2="100" stroke={glowColor} strokeWidth="1" opacity="0.4" />
          <line x1="175" y1="100" x2="195" y2="100" stroke={glowColor} strokeWidth="1" opacity="0.4" />
        </svg>

        {/* Floating status icon */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeState === 'listening' ? '#ff0055' : activeState === 'speaking' ? '#00ff88' : '#00f0ff',
            zIndex: 10
          }}
        >
          {activeState === 'listening' ? (
            <Mic size={24} className="pulse-opacity" />
          ) : activeState === 'speaking' ? (
            <Activity size={24} />
          ) : activeState === 'thinking' ? (
            <Zap size={24} className="spin-slow" />
          ) : (
            <Eye size={24} />
          )}
        </div>
      </div>

      <div style={{ marginTop: '25px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '2px', color: glowColor }}>
          {innerText}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px', letterSpacing: '1px' }}>
          {descText}
        </div>
      </div>

      {/* Styled styles for waves */}
      <style>{`
        .speech-waves {
          position: absolute;
          top: -20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 40px;
        }
        .wave-bar {
          width: 3px;
          height: 10px;
          background-color: var(--color-green);
          border-radius: 2px;
          animation: dance-wave 1s ease-in-out infinite;
        }
        .bar-1 { animation-delay: 0.1s; height: 15px; }
        .bar-2 { animation-delay: 0.3s; height: 25px; }
        .bar-3 { animation-delay: 0.5s; height: 35px; }
        .bar-4 { animation-delay: 0.2s; height: 20px; }
        .bar-5 { animation-delay: 0.4s; height: 12px; }

        @keyframes dance-wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}
