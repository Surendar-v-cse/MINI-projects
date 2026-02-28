import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Zap, 
  Terminal, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Copy, 
  Trash2, 
  Radio, 
  Wifi, 
  Target,
  Lock,
  Unlock
} from 'lucide-react';

// --- Morse Code Dictionary ---
const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [char, morse]) => ({ ...acc, [morse]: char }),
  {}
);

const encodeMorse = (text: string) => {
  return text.toUpperCase().split('').map(char => MORSE_MAP[char] || '').join(' ').trim();
};

const decodeMorse = (morse: string) => {
  return morse.split(' ').map(code => REVERSE_MORSE_MAP[code] || (code === '/' ? ' ' : '?')).join('');
};

// --- Audio Service ---
class MorseAudio {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private frequency = 600;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0;
    }
  }

  start() {
    this.init();
    if (this.ctx && this.gainNode) {
      this.oscillator = this.ctx.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(this.frequency, this.ctx.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
      this.gainNode.gain.setTargetAtTime(0.1, this.ctx.currentTime, 0.01);
    }
  }

  stop() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
          this.oscillator = null;
        }
      }, 50);
    }
  }
}

const audio = new MorseAudio();

export default function App() {
  const [inputText, setInputText] = useState('');
  const [inputMorse, setInputMorse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [signalActive, setSignalActive] = useState(false);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [currentSequence, setCurrentSequence] = useState('');
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Telegraph Key Logic ---
  const handleKeyDown = useCallback(() => {
    if (isMuted) return;
    setSignalActive(true);
    audio.start();
    setLastPressTime(Date.now());
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [isMuted]);

  const handleKeyUp = useCallback(() => {
    setSignalActive(false);
    audio.stop();
    const duration = Date.now() - lastPressTime;
    const symbol = duration < 200 ? '.' : '-';
    setCurrentSequence(prev => prev + symbol);

    // Auto-space logic
    timeoutRef.current = setTimeout(() => {
      setCurrentSequence(prev => {
        if (prev) {
          setInputMorse(m => (m ? m + ' ' + prev : prev));
          return '';
        }
        return prev;
      });
    }, 600);
  }, [lastPressTime]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearAll = () => {
    setInputText('');
    setInputMorse('');
    setCurrentSequence('');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header Section */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 tactical-glass p-4 rounded-xl tactical-border"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold-500/20 rounded-lg">
            <Shield className="text-gold-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-gold-500 uppercase">Tactical Morse Comm</h1>
            <p className="text-[10px] text-white/50 tracking-tighter uppercase">Navy Special Forces // Unit: Ghost-1</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${signalActive ? 'text-gold-500 animate-pulse' : 'text-white/30'}`} />
            <span className="text-white/40">Status:</span>
            <span className="text-gold-500">Zulu Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-gold-500" />
            <span className="text-white/40">Signal:</span>
            <span className="text-gold-500">100%</span>
          </div>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            {isMuted ? <VolumeX className="text-red-500 w-5 h-5" /> : <Volume2 className="text-gold-500 w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Main Command Center */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Pane: Encoder (Text -> Morse) */}
        <motion.section 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="tactical-glass p-6 rounded-2xl tactical-border relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Target className="w-32 h-32 text-gold-500" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Terminal className="text-gold-500 w-5 h-5" />
              <h2 className="text-sm font-bold tracking-widest uppercase">Encryption Module</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setInputText('')} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Plaintext Input</label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="ENTER MISSION INTEL..."
                className="w-full h-32 bg-navy-900/50 border border-white/10 rounded-xl p-4 text-gold-500 placeholder:text-white/10 focus:outline-none focus:border-gold-500/50 transition-all resize-none font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Morse Output</label>
                <button 
                  onClick={() => copyToClipboard(encodeMorse(inputText))}
                  className="flex items-center gap-1 text-[9px] text-gold-500/60 hover:text-gold-500 uppercase font-bold transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <div className="w-full h-32 bg-navy-900/80 border border-gold-500/20 rounded-xl p-4 text-gold-500/80 font-mono text-lg break-all overflow-y-auto">
                {encodeMorse(inputText) || <span className="text-white/5 opacity-50">... --- ...</span>}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Right Pane: Decoder (Morse -> Text) */}
        <motion.section 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="tactical-glass p-6 rounded-2xl tactical-border relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Zap className="w-32 h-32 text-gold-500" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="text-gold-500 w-5 h-5" />
              <h2 className="text-sm font-bold tracking-widest uppercase">Decryption Module</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setInputMorse('')} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Morse Input (Use space between letters)</label>
              <textarea 
                value={inputMorse}
                onChange={(e) => setInputMorse(e.target.value)}
                placeholder="... --- ... / -.-. --- -- --"
                className="w-full h-32 bg-navy-900/50 border border-white/10 rounded-xl p-4 text-gold-500 placeholder:text-white/10 focus:outline-none focus:border-gold-500/50 transition-all resize-none font-mono text-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Plaintext Output</label>
                <button 
                  onClick={() => copyToClipboard(decodeMorse(inputMorse))}
                  className="flex items-center gap-1 text-[9px] text-gold-500/60 hover:text-gold-500 uppercase font-bold transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <div className="w-full h-32 bg-navy-900/80 border border-gold-500/20 rounded-xl p-4 text-gold-500/80 font-mono text-sm uppercase break-all overflow-y-auto">
                {decodeMorse(inputMorse) || <span className="text-white/5 opacity-50">WAITING FOR SIGNAL...</span>}
              </div>
            </div>
          </div>
        </motion.section>

      </main>

      {/* Telegraph Key Section */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 w-full max-w-2xl flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className={`w-3 h-3 rounded-full transition-all duration-75 ${signalActive ? 'bg-gold-500 glow-gold scale-125' : 'bg-white/10'}`} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Signal Lamp</span>
          <div className={`w-3 h-3 rounded-full transition-all duration-75 ${signalActive ? 'bg-gold-500 glow-gold scale-125' : 'bg-white/10'}`} />
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-gold-500/5 rounded-full blur-xl group-hover:bg-gold-500/10 transition-all" />
          <button 
            onMouseDown={handleKeyDown}
            onMouseUp={handleKeyUp}
            onMouseLeave={() => { if(signalActive) handleKeyUp(); }}
            onTouchStart={(e) => { e.preventDefault(); handleKeyDown(); }}
            onTouchEnd={(e) => { e.preventDefault(); handleKeyUp(); }}
            className={`
              relative w-32 h-32 rounded-full border-4 transition-all duration-75 flex items-center justify-center
              ${signalActive 
                ? 'bg-gold-500 border-gold-400 scale-95 shadow-inner' 
                : 'bg-navy-800 border-gold-500/30 hover:border-gold-500/60 shadow-lg'}
            `}
          >
            <div className={`text-center transition-colors ${signalActive ? 'text-navy-900' : 'text-gold-500'}`}>
              <Zap className={`w-8 h-8 mx-auto mb-1 ${signalActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Transmit</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-white/30 uppercase">
          <span>Current Buffer:</span>
          <span className="text-gold-500 font-mono text-sm min-w-[60px]">{currentSequence || '---'}</span>
        </div>
      </motion.div>

      {/* Footer / Security Status */}
      <footer className="mt-12 flex items-center gap-8 text-[9px] uppercase tracking-[0.4em] font-bold text-white/20">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3" />
          <span>Encryption: AES-256-MORSE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-gold-500 rounded-full animate-pulse" />
          <span>Secure Line Established</span>
        </div>
      </footer>
    </div>
  );
}
