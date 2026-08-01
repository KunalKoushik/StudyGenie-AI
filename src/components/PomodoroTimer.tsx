import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Flame, Clock } from 'lucide-react';

export const PomodoroTimer: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds((s) => s - 1);
        } else if (minutes > 0) {
          setMinutes((m) => m - 1);
          setSeconds(59);
        } else {
          // Timer finished!
          clearInterval(interval);
          setIsActive(false);
          if (mode === 'focus') {
            setMode('break');
            setMinutes(5);
            setSeconds(0);
            alert('🎉 Great 25-minute focus session! Time for a 5-minute break.');
          } else {
            setMode('focus');
            setMinutes(25);
            setSeconds(0);
            alert('⚡ Break complete! Ready for another focus session?');
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'focus') {
      setMinutes(25);
      setSeconds(0);
    } else {
      setMinutes(5);
      setSeconds(0);
    }
  };

  const toggleLofiSound = () => {
    if (isLofiPlaying) {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      setIsLofiPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Create warm ambient sine waves (432Hz alpha wave tone)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(216, ctx.currentTime); // Deep warm tone
        gain.gain.setValueAtTime(0.05, ctx.currentTime); // Soft volume

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setIsLofiPlaying(true);
      } catch (err) {
        console.error('Audio synth error:', err);
      }
    }
  };

  const totalSecs = mode === 'focus' ? 25 * 60 : 5 * 60;
  const currentSecs = minutes * 60 + seconds;
  const progressPercent = Math.round(((totalSecs - currentSecs) / totalSecs) * 100);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-indigo-300 transition-all shadow-sm"
      >
        <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400 animate-spin' : 'text-indigo-400'}`} />
        <span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 uppercase font-bold">
          {mode}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl z-50 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Pomodoro Study Focus Mode</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                setMode('focus');
                setMinutes(25);
                setSeconds(0);
                setIsActive(false);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                mode === 'focus'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Focus (25m)
            </button>
            <button
              onClick={() => {
                setMode('break');
                setMinutes(5);
                setSeconds(0);
                setIsActive(false);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                mode === 'break'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Break (5m)
            </button>
          </div>

          <div className="text-center py-2 space-y-1">
            <div className="text-4xl font-black font-mono tracking-wider text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  mode === 'focus' ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleTimer}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-all ${
                isActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isActive ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={resetTimer}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleLofiSound}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                isLofiPlaying
                  ? 'bg-purple-600/30 border-purple-500/50 text-purple-200 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Lofi Ambient Alpha Waves Sound"
            >
              {isLofiPlaying ? <Volume2 className="w-3.5 h-3.5 text-purple-300" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
