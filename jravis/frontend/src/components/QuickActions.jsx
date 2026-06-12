import React from 'react';
import { Play, FileText, Calculator, Image, Globe, Folder, Cpu, Terminal, ShieldAlert } from 'lucide-react';
import soundEffects from './SoundEffects';

export default function QuickActions({ backendOnline, onActionExecute }) {
  const actions = [
    { name: 'Notepad', icon: FileText, cmd: 'notepad', type: 'app', desc: 'Text editor' },
    { name: 'Calculator', icon: Calculator, cmd: 'calculator', type: 'app', desc: 'Calc tool' },
    { name: 'MS Paint', icon: Image, cmd: 'paint', type: 'app', desc: 'Canvas paint' },
    { name: 'Chrome', icon: Globe, cmd: 'chrome', type: 'app', desc: 'Web browser' },
    { name: 'Explorer', icon: Folder, cmd: 'explorer', type: 'app', desc: 'File manager' },
    { name: 'Task Manager', icon: Cpu, cmd: 'taskmgr', type: 'app', desc: 'Process monitor' },
    { name: 'Who Am I', icon: Terminal, cmd: 'whoami', type: 'shell', desc: 'Account name' },
    { name: 'Network Ping', icon: Terminal, cmd: 'ping 127.0.0.1 -n 3', type: 'shell', desc: 'Local ping' }
  ];

  const handleAction = (action) => {
    if (!backendOnline) {
      soundEffects.playError();
      onActionExecute({
        status: 'error',
        message: `Action execution failed: Local Express server is offline. Run 'npm start' to enable local system controls.`
      });
      return;
    }
    
    soundEffects.playClick();
    onActionExecute(action);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>
          <Play size={18} style={{ color: 'var(--color-cyan)' }} />
          Local Core Controls
        </h2>
        <span className="title-badge">OS ACCESS</span>
      </div>

      <div className="actions-grid">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.name}
              onClick={() => handleAction(act)}
              className="btn-action"
              title={act.desc}
            >
              <Icon size={16} />
              <span>{act.name}</span>
            </button>
          );
        })}
      </div>

      {!backendOnline && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255,0,85,0.08)',
          border: '1px solid rgba(255,0,85,0.2)',
          borderRadius: '4px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          color: 'var(--color-magenta)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          lineHeight: '1.4'
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <strong>OS LINK OFFLINE:</strong> System control commands will fail. Start the local server to unlock device interactions.
          </div>
        </div>
      )}
    </div>
  );
}
