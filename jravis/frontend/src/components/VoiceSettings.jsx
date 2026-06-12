import React, { useEffect, useState } from 'react';
import { Sliders, Volume2, Globe, Sparkles } from 'lucide-react';
import soundEffects from './SoundEffects';

export default function VoiceSettings({ 
  voiceRate, 
  setVoiceRate, 
  voicePitch, 
  setVoicePitch, 
  selectedVoice, 
  setSelectedVoice, 
  availableVoices, 
  soundEnabled, 
  setSoundEnabled,
  wakeWordEnabled,
  setWakeWordEnabled,
  ollamaUrl,
  setOllamaUrl,
  selectedModel,
  setSelectedModel,
  systemPrompt,
  setSystemPrompt,
  backendOnline
}) {
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState('Checking...');

  // Fetch Ollama models when backend is online or when URL changes
  useEffect(() => {
    if (!backendOnline) {
      setOllamaStatus('Backend Offline');
      setOllamaModels(['llama3', 'mistral', 'phi3', 'gemma2']);
      return;
    }

    const fetchModels = async () => {
      try {
        setOllamaStatus('Connecting...');
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error('Unreachable');
        const data = await res.json();
        
        if (data.models && data.models.length > 0) {
          const modelNames = data.models.map(m => m.name);
          setOllamaModels(modelNames);
          setOllamaStatus('Online');
          // If current selected model is not in the list, choose the first available one
          if (!modelNames.includes(selectedModel)) {
            setSelectedModel(modelNames[0]);
          }
        } else {
          setOllamaModels(['llama3', 'mistral']);
          setOllamaStatus('Ollama Online (No Models)');
        }
      } catch (err) {
        setOllamaStatus('Ollama Offline');
        setOllamaModels(['llama3', 'mistral', 'phi3', 'gemma2']);
      }
    };

    fetchModels();
  }, [backendOnline, ollamaUrl, setSelectedModel]);

  const handleSoundToggle = (e) => {
    const enabled = e.target.checked;
    setSoundEnabled(enabled);
    soundEffects.toggle(enabled);
    if (enabled) {
      soundEffects.playClick();
    }
  };

  const handleVoiceChange = (e) => {
    soundEffects.playClick();
    const voice = availableVoices.find(v => v.name === e.target.value);
    if (voice) setSelectedVoice(voice);
  };

  return (
    <div className="panel" style={{ flex: 'none' }}>
      <div className="panel-header">
        <h2>
          <Sliders size={18} style={{ color: 'var(--color-cyan)' }} />
          SYSTEM CONFIGURATION
        </h2>
        <span className="title-badge" style={{ color: ollamaStatus.includes('Online') ? 'var(--color-green)' : 'var(--color-magenta)' }}>
          {ollamaStatus}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* LLM Model Config */}
        <div className="form-group">
          <label>
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
            OLLAMA AI MODEL
          </label>
          <select 
            value={selectedModel} 
            onChange={(e) => { soundEffects.playClick(); setSelectedModel(e.target.value); }} 
            className="control-select"
          >
            {ollamaModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* System Prompt Config */}
        <div className="form-group">
          <label>ASSISTANT CORE DIRECTIVES</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="control-input"
            rows="3"
            style={{ resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: '1.4' }}
          />
        </div>

        {/* Text to Speech Voice Config */}
        <div className="form-group">
          <label>
            <Volume2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
            VOCAL INTEGRATION VOICE
          </label>
          <select 
            value={selectedVoice ? selectedVoice.name : ''} 
            onChange={handleVoiceChange} 
            className="control-select"
          >
            {availableVoices.map(voice => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Speech Rate & Pitch Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>VOCAL SPEED</label>
            <div className="range-container">
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.05" 
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
              />
              <span className="range-value">{voiceRate}x</span>
            </div>
          </div>

          <div className="form-group">
            <label>VOCAL PITCH</label>
            <div className="range-container">
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.05" 
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
              />
              <span className="range-value">{voicePitch}x</span>
            </div>
          </div>
        </div>

        {/* Network Endpoint Config */}
        <div className="form-group">
          <label>
            <Globe size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
            LOCAL ENGINE IP
          </label>
          <input 
            type="text" 
            value={ollamaUrl} 
            onChange={(e) => setOllamaUrl(e.target.value)} 
            className="control-input"
          />
        </div>

        {/* Toggle Switches */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '5px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(0,240,255,0.06)'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
            <input 
              type="checkbox" 
              checked={soundEnabled} 
              onChange={handleSoundToggle}
              style={{ accentColor: 'var(--color-cyan)' }}
            />
            UI Audio
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
            <input 
              type="checkbox" 
              checked={wakeWordEnabled} 
              onChange={(e) => { soundEffects.playClick(); setWakeWordEnabled(e.target.checked); }}
              style={{ accentColor: 'var(--color-cyan)' }}
            />
            Wake Word ("Jarvis")
          </label>
        </div>

      </div>
    </div>
  );
}
