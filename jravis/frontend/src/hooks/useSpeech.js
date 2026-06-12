import { useState, useEffect, useRef, useCallback } from 'react';
import soundEffects from '../components/SoundEffects';

export function useSpeech({ 
  onSpeechResult, 
  voiceName = '', 
  voiceRate = 1.05, 
  voicePitch = 0.9,
  wakeWordEnabled = true
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  const recognitionRef = useRef(null);
  const speechActiveRef = useRef(false);
  const synthRef = useRef(window.speechSynthesis);

  // Load available system voices
  useEffect(() => {
    const loadVoices = () => {
      if (!synthRef.current) return;
      const voices = synthRef.current.getVoices();
      setAvailableVoices(voices);

      // Default Jarvis selection: Search for Google UK English Male, Microsoft Hazel, or standard UK English
      let defaultVoice = voices.find(v => v.name.includes('Google UK English Male')) || 
                         voices.find(v => v.name.includes('Microsoft George') || v.name.includes('George')) ||
                         voices.find(v => v.lang.startsWith('en-GB')) ||
                         voices.find(v => v.lang.startsWith('en-US')) ||
                         voices[0];
      
      setSelectedVoice(defaultVoice);
    };

    loadVoices();
    if (synthRef.current && synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  // Update selected voice when choice matches voiceName
  useEffect(() => {
    if (voiceName && availableVoices.length > 0) {
      const match = availableVoices.find(v => v.name === voiceName);
      if (match) setSelectedVoice(match);
    }
  }, [voiceName, availableVoices]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      soundEffects.playSpeechStart();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // If we want continuous active listening (wake word mode), restart it if it stopped automatically
      if (speechActiveRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart speech recognition:', e);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript.trim();
      console.log('Recognized speech:', transcript);

      soundEffects.playSpeechEnd();

      if (wakeWordEnabled) {
        // Look for wake phrase "jarvis" or "hey jarvis" at the beginning
        const lowerTranscript = transcript.toLowerCase();
        if (lowerTranscript.includes('jarvis') || lowerTranscript.includes('hey jarvis') || lowerTranscript.includes('charvis')) {
          // Extract the actual command after the wake word
          let command = transcript;
          const wakeWords = ['hey jarvis', 'jarvis', 'charvis'];
          for (const word of wakeWords) {
            const index = lowerTranscript.indexOf(word);
            if (index !== -1) {
              command = transcript.slice(index + word.length).trim();
              break;
            }
          }
          // Remove leading non-alphanumeric punctuation
          command = command.replace(/^[^a-zA-Z0-9]+/, '');
          
          if (command) {
            onSpeechResult(command);
          } else {
            // Wake word detected but no command, prompt for input
            speak('Yes, Sir. I am listening.');
          }
        }
      } else {
        // Direct recognition mode without wake word
        onSpeechResult(transcript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSpeechResult, wakeWordEnabled]);

  // Toggle listening state
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    speechActiveRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('Recognition already active');
    }
  }, []);

  const stopListening = useCallback(() => {
    speechActiveRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Text to Speech
  const speak = useCallback((text, onEndCallback) => {
    if (!synthRef.current) return;

    // Cancel any active speech
    synthRef.current.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    synthRef.current.speak(utterance);
  }, [selectedVoice, voiceRate, voicePitch]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    availableVoices,
    selectedVoice,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
