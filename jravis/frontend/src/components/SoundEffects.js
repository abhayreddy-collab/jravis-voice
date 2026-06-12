// Web Audio API Sound Synthesizer for Jarvis UI Sounds
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(state) {
    this.enabled = state;
  }

  // Quick high-pitch sci-fi beep
  playClick() {
    if (!this.enabled) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Ascending confirmation tone
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const notes = [600, 800, 1200];
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.15);
    });
  }

  // Retro buzz for error or block
  playError() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(120, now + 0.1);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(152, now);
    osc2.frequency.setValueAtTime(122, now + 0.1);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc2.start(now);
    
    osc.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  // Futuristic sweep when speech input activates
  playSpeechStart() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(10, now);
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Soft high release chime when speech recognition completes
  playSpeechEnd() {
    if (!this.enabled) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
}

export default new SoundEffects();
