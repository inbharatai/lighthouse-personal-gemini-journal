import React from 'react';
import {
  X,
  Sliders,
  ArrowDown,
  Volume2,
  Type,
  Command,
  Shield,
  Check,
  Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SoundscapeType, soundscapeEngine } from '../utils/audioSoundscape';

export type FontSizePreference = 'compact' | 'standard' | 'spacious';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoScrollEnabled: boolean;
  onToggleAutoScroll: (enabled: boolean) => void;
  fontSize: FontSizePreference;
  onChangeFontSize: (size: FontSizePreference) => void;
  currentSoundscape: SoundscapeType;
  onChangeSoundscape: (type: SoundscapeType) => void;
  soundscapeVolume: number;
  onChangeVolume: (val: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isAutoScrollEnabled,
  onToggleAutoScroll,
  fontSize,
  onChangeFontSize,
  currentSoundscape,
  onChangeSoundscape,
  soundscapeVolume,
  onChangeVolume,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#121214] border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.1)] p-6 z-10 flex flex-col max-h-[90vh] overflow-hidden"
          role="dialog"
          aria-labelledby="settings-modal-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 id="settings-modal-title" className="font-mono font-bold text-white text-base uppercase tracking-tight">
                  Vault Preferences
                </h3>
                <p className="text-xs text-slate-400 font-sans">Customize your reflection environment</p>
              </div>
            </div>
            <button
              id="btn-close-settings-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
            {/* Auto-Scroll Toggle Setting */}
            <div className="p-4 rounded-xl glass-panel space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Auto-Scroll To Latest
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Automatically scrolls viewport as new turns arrive. When disabled, a sticky jump button appears upon scrolling up.
                    </p>
                  </div>
                </div>

                {/* Switch button */}
                <button
                  id="toggle-autoscroll-setting"
                  type="button"
                  role="switch"
                  aria-checked={isAutoScrollEnabled}
                  onClick={() => onToggleAutoScroll(!isAutoScrollEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isAutoScrollEnabled ? 'bg-amber-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isAutoScrollEnabled ? 'translate-x-5 bg-black' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Typography Scale */}
            <div className="p-4 rounded-xl glass-panel space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Typography Scale
                  </h4>
                  <p className="text-[11px] text-slate-400">Adjust reading density for journal reflections</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: 'compact', label: 'Compact', desc: '13px Dense' },
                    { id: 'standard', label: 'Standard', desc: '14px Balanced' },
                    { id: 'spacious', label: 'Spacious', desc: '16px Relaxed' },
                  ] as const
                ).map((opt) => {
                  const isSelected = fontSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeFontSize(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Audio Soundscapes */}
            <div className="p-4 rounded-xl glass-panel space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Lighthouse Ambient Soundscapes
                  </h4>
                  <p className="text-[11px] text-slate-400">Procedural audio synthesis for deep meditative focus</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: 'none', label: 'Muted / Silent' },
                    { id: 'ocean', label: '🌊 Ocean Tide' },
                    { id: 'rain', label: '🌧️ Gentle Rain' },
                    { id: 'brown_noise', label: '🌌 Brown Noise' },
                    { id: 'beacon_432hz', label: '🔔 432Hz Beacon' },
                  ] as const
                ).map((s) => {
                  const isSelected = currentSoundscape === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onChangeSoundscape(s.id)}
                      className={`p-2 rounded-xl border text-xs font-mono transition-all text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {currentSoundscape !== 'none' && (
                <div className="pt-2 flex items-center space-x-3 text-xs font-mono text-slate-400">
                  <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={soundscapeVolume}
                    onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <span className="w-10 text-right text-slate-300 font-mono text-[10px]">
                    {Math.round(soundscapeVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Reference */}
            <div className="p-4 rounded-xl glass-panel space-y-2.5">
              <div className="flex items-center space-x-2 text-slate-300">
                <Command className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Keyboard Shortcuts
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                  <span>Send turn</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] border border-white/10">
                    Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                  <span>New line</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] border border-white/10">
                    Shift + Enter
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              id="btn-done-settings"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
