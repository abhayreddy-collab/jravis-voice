import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Send, ArrowRight } from 'lucide-react';
import soundEffects from './SoundEffects';

export default function TerminalLog({ logs, onSendMessage, loading }) {
  const [inputText, setInputText] = useState('');
  const screenRef = useRef(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [logs, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    soundEffects.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Trigger click audio on Enter key
    }
  };

  return (
    <div className="panel terminal-panel">
      <div className="panel-header">
        <h2>
          <Terminal size={18} style={{ color: 'var(--color-cyan)' }} />
          COMMUNICATION INTERFACE
        </h2>
        <span className="title-badge">STDOUT/STDIN</span>
      </div>

      <div className="terminal-screen" ref={screenRef}>
        {logs.map((log) => (
          <div key={log.id} className="log-entry">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="log-timestamp">[{log.time}]</span>
              <span className={`log-sender ${log.sender.toLowerCase()}`}>
                {log.sender} &gt;&gt;
              </span>
            </div>
            <div className={`log-message ${log.status === 'error' ? 'error' : ''}`}>
              {log.message}
            </div>
          </div>
        ))}

        {loading && (
          <div className="log-entry">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="log-timestamp">[{new Date().toLocaleTimeString()}]</span>
              <span className="log-sender jarvis">JARVIS &gt;&gt;</span>
            </div>
            <div className="log-message pending">
              Searching data arrays...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="terminal-input-container">
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--color-cyan)', opacity: 0.8 }}>
          <ArrowRight size={16} />
        </div>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Input manual override command..."
          className="terminal-input"
          disabled={loading}
        />
        <button type="submit" className="btn-send" disabled={loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
