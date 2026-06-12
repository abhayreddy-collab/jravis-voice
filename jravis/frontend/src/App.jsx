import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Mic, AlertCircle } from 'lucide-react';
import ArcReactor from './components/ArcReactor';
import SystemStats from './components/SystemStats';
import TerminalLog from './components/TerminalLog';
import VoiceSettings from './components/VoiceSettings';
import QuickActions from './components/QuickActions';
import { useSpeech } from './hooks/useSpeech';
import soundEffects from './components/SoundEffects';

export default function App() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Settings State
  const [voiceRate, setVoiceRate] = useState(1.05);
  const [voicePitch, setVoicePitch] = useState(0.9);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState('llama3');
  const [systemPrompt, setSystemPrompt] = useState(
    "You are JARVIS, a highly advanced AI system designed by Tony Stark. Be helpful, concise, and refer to the user as 'Sir' or 'Ma'am'. Make brief responses suited for a voice assistant. Keep it to 1-3 sentences maximum. Focus on local capabilities."
  );

  // Security Override Modal State
  const [pendingCommand, setPendingCommand] = useState(null);

  // Add a log helper
  const addLog = useCallback((sender, message, status = 'normal') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      time: timestamp,
      sender,
      message,
      status
    }]);
  }, []);

  // Check backend server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/system');
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (e) {
        setBackendOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Logs
  useEffect(() => {
    addLog('SYSTEM', 'J.A.R.V.I.S. Home Protocol v2.5 Online', 'normal');
    addLog('SYSTEM', 'Checking connection status of local OS automation server...', 'normal');
    
    // Quick delay check
    setTimeout(() => {
      fetch('/api/system')
        .then(res => {
          if (res.ok) {
            addLog('SYSTEM', 'Local OS server link successfully established on Port 3001.', 'normal');
          } else {
            addLog('SYSTEM', 'OS Server returned error. Local controls disabled.', 'error');
          }
        })
        .catch(() => {
          addLog('SYSTEM', 'OS Server link offline. Simulated mode active.', 'error');
          addLog('SYSTEM', 'Tip: Execute "npm start" in the root directory to activate the Express backend.', 'normal');
        });
    }, 1000);
  }, [addLog]);

  // Execute system commands via Express
  const runOsCommand = useCallback(async (command, type) => {
    try {
      addLog('SYSTEM', `Executing security-verified OS directive: ${command}...`, 'normal');
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, type })
      });
      const data = await res.json();
      
      if (res.ok) {
        soundEffects.playSuccess();
        addLog('SYSTEM', data.output || 'Directive execution complete.', 'normal');
        return { success: true, output: data.output };
      } else {
        soundEffects.playError();
        addLog('SYSTEM', `Directive error: ${data.error}`, 'error');
        return { success: false, error: data.error };
      }
    } catch (err) {
      soundEffects.playError();
      addLog('SYSTEM', `Directive network failure: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  }, [addLog]);

  // Process user request (either voice or typed text)
  const processQuery = useCallback(async (query) => {
    addLog('USER', query, 'normal');
    setLoading(true);
    
    const queryLower = query.toLowerCase().trim();
    
    // 1. Check local command matches to run without LLM latency
    let matchedCommand = null;

    if (queryLower.match(/(open|launch|start)\s+notepad/)) {
      matchedCommand = { cmd: 'notepad', type: 'app', speakText: 'Opening Notepad, Sir.' };
    } else if (queryLower.match(/(open|launch|start)\s+calculator/)) {
      matchedCommand = { cmd: 'calculator', type: 'app', speakText: 'Opening calculator, Sir.' };
    } else if (queryLower.match(/(open|launch|start)\s+paint/)) {
      matchedCommand = { cmd: 'paint', type: 'app', speakText: 'Launching Paint canvas.' };
    } else if (queryLower.match(/(open|launch|start)\s+chrome/)) {
      matchedCommand = { cmd: 'chrome', type: 'app', speakText: 'Opening web browser.' };
    } else if (queryLower.match(/(open|launch|start)\s+(explorer|file explorer|my computer)/)) {
      matchedCommand = { cmd: 'explorer', type: 'app', speakText: 'Opening File Explorer.' };
    } else if (queryLower.match(/(open|launch|start)\s+(task manager|taskmanager)/)) {
      matchedCommand = { cmd: 'taskmgr', type: 'app', speakText: 'Displaying system processes.' };
    } else if (queryLower.match(/who\s*am\s*i/)) {
      matchedCommand = { cmd: 'whoami', type: 'shell', speakText: 'Retrieving local credentials, Sir.' };
    } else if (queryLower.match(/(run\s+ping|ping\s+local|check\s+network)/)) {
      matchedCommand = { cmd: 'ping 127.0.0.1 -n 3', type: 'shell', speakText: 'Initiating network ping test.' };
    }

    if (matchedCommand) {
      // If it is a shell command (not app), request confirmation modal for safety
      if (matchedCommand.type === 'shell') {
        setPendingCommand({
          cmd: matchedCommand.cmd,
          type: matchedCommand.type,
          speakText: matchedCommand.speakText
        });
        setLoading(false);
        return;
      }
      
      // Execute app launch directly
      speak(matchedCommand.speakText);
      addLog('JARVIS', matchedCommand.speakText, 'normal');
      await runOsCommand(matchedCommand.cmd, matchedCommand.type);
      setLoading(false);
      return;
    }

    // 2. Chat Query (send to local Ollama)
    try {
      addLog('SYSTEM', `Routing request to Ollama model '${selectedModel}'...`, 'normal');
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        const reply = data.message.content;
        addLog('JARVIS', reply, 'normal');
        
        // Speak the reply
        speak(reply);
      } else {
        soundEffects.playError();
        const errMsg = data.error || 'Ollama offline.';
        addLog('JARVIS', `Connection error: ${errMsg}`, 'error');
        
        // Fallback offline canned responses
        let offlineReply = "Offline mode active, Sir. Ollama server is currently unreachable, but I can launch your computer applications if requested.";
        if (queryLower.includes('hello') || queryLower.includes('hi ')) {
          offlineReply = "Hello Sir. I am online and running locally, though my neural network is offline. How can I assist you today?";
        } else if (queryLower.includes('status') || queryLower.includes('how are you')) {
          offlineReply = "Systems operating in localized mode. Diagnostic details are rendering on your console grid, Sir.";
        }
        
        addLog('JARVIS', offlineReply, 'normal');
        speak(offlineReply);
      }
    } catch (e) {
      setLoading(false);
      soundEffects.playError();
      const offlineReply = "Core network error, Sir. Standard voice commands remain functional. How can I help?";
      addLog('JARVIS', offlineReply, 'error');
      speak(offlineReply);
    }
  }, [addLog, selectedModel, systemPrompt, runOsCommand]);

  // Connect useSpeech hooks
  const {
    isListening,
    isSpeaking,
    availableVoices,
    selectedVoice: hookVoice,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useSpeech({
    onSpeechResult: processQuery,
    voiceName: selectedVoice ? selectedVoice.name : '',
    voiceRate,
    voicePitch,
    wakeWordEnabled
  });

  // Keep hookVoice in sync with local UI selected voice
  useEffect(() => {
    if (hookVoice) {
      setSelectedVoice(hookVoice);
    }
  }, [hookVoice]);

  // Handle Quick Actions execution
  const handleQuickAction = async (action) => {
    if (action.status === 'error') {
      addLog('SYSTEM', action.message, 'error');
      return;
    }

    if (action.type === 'shell') {
      setPendingCommand({
        cmd: action.cmd,
        type: action.type,
        speakText: action.desc
      });
      return;
    }

    speak(`Launching ${action.name}, Sir.`);
    addLog('SYSTEM', `Requesting OS launch: ${action.name}`, 'normal');
    await runOsCommand(action.cmd, action.type);
  };

  // Safe manual override action confirmations
  const confirmPendingCommand = async () => {
    if (!pendingCommand) return;
    
    const cmd = pendingCommand.cmd;
    const type = pendingCommand.type;
    const speakText = pendingCommand.speakText;
    
    setPendingCommand(null);
    speak(speakText);
    await runOsCommand(cmd, type);
  };

  const cancelPendingCommand = () => {
    soundEffects.playClick();
    setPendingCommand(null);
    addLog('SYSTEM', 'Override directive aborted by operator.', 'error');
  };

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <header className="dashboard-header">
        <div className="system-title">
          <div className="dot online pulse" style={{ width: '12px', height: '12px' }}></div>
          <h1>J.A.R.V.I.S.</h1>
          <span className="title-badge">STARK-OS V2.5</span>
        </div>

        <div className="header-status-indicator">
          <div className="status-item">
            <span style={{ color: 'var(--color-text-dim)' }}>OS Link:</span>
            <span className={`dot ${backendOnline ? 'online' : 'offline'}`}></span>
            <span style={{ color: backendOnline ? 'var(--color-green)' : 'var(--color-magenta)' }}>
              {backendOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          
          <div className="status-item" style={{ borderLeft: '1px solid rgba(0, 240, 255, 0.1)', paddingLeft: '15px' }}>
            <button 
              className={`btn-mic-header ${isListening ? 'listening' : ''}`} 
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Deactivate Voice Override' : 'Initialize Voice Authorization'}
            >
              <Mic size={16} />
            </button>
            <span style={{ color: isListening ? 'var(--color-magenta)' : 'var(--color-cyan)', fontWeight: 'bold' }}>
              {isListening ? 'LISTENING' : 'SPEECH ACTIVE'}
            </span>
          </div>
        </div>
      </header>

      {/* LEFT COLUMN: Settings & Voice Configuration */}
      <aside className="left-sidebar">
        <VoiceSettings 
          voiceRate={voiceRate}
          setVoiceRate={setVoiceRate}
          voicePitch={voicePitch}
          setVoicePitch={setVoicePitch}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          availableVoices={availableVoices}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          wakeWordEnabled={wakeWordEnabled}
          setWakeWordEnabled={setWakeWordEnabled}
          ollamaUrl={ollamaUrl}
          setOllamaUrl={setOllamaUrl}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          backendOnline={backendOnline}
        />
      </aside>

      {/* CENTER COLUMN: Arc Reactor Core & Terminal Logs */}
      <main className="center-column">
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <h2>
              <ShieldCheck size={18} style={{ color: 'var(--color-cyan)' }} />
              PRIMARY PROTOCOL CORE
            </h2>
            <span className="title-badge" style={{ color: isListening ? 'var(--color-magenta)' : isSpeaking ? 'var(--color-green)' : 'var(--color-cyan)' }}>
              {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'IDLE'}
            </span>
          </div>

          <ArcReactor 
            state={loading ? 'thinking' : 'idle'} 
            isListening={isListening} 
            isSpeaking={isSpeaking}
          />


        </div>

        {/* Console Log Screen */}
        <TerminalLog 
          logs={logs}
          onSendMessage={processQuery}
          loading={loading}
        />
      </main>

      {/* RIGHT COLUMN: Diagnostics & Quick OS Launcher */}
      <aside className="right-sidebar">
        <SystemStats backendOnline={backendOnline} />
        
        <QuickActions 
          backendOnline={backendOnline}
          onActionExecute={handleQuickAction}
        />
      </aside>

      {/* SECURITY OVERRIDE MODAL */}
      {pendingCommand && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AlertCircle size={48} className="modal-icon" style={{ color: 'var(--color-magenta)' }} />
            <h3 className="modal-title" style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-magenta)' }}>
              SECURITY CONTROLS OVERRIDE
            </h3>
            <p style={{ margin: '15px 0 10px 0', fontSize: '0.85rem', color: 'var(--color-text)' }}>
              A shell command requires operator approval. Proceed with execution?
            </p>
            <div className="modal-desc">
              {pendingCommand.cmd}
            </div>
            <div className="modal-buttons">
              <button onClick={confirmPendingCommand} className="btn-confirm" style={{ backgroundColor: 'var(--color-magenta)', color: '#fff' }}>
                CONFIRM OVERRIDE
              </button>
              <button onClick={cancelPendingCommand} className="btn-cancel">
                ABORT DIRECTIVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
