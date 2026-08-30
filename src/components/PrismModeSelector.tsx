import React from 'react';
import { Sparkles, HelpCircle, Compass, Zap, Heart, Atom, Check } from 'lucide-react';

export type PrismMode = 'socratic' | 'stoic' | 'strategist' | 'compassion' | 'first_principles';

export interface PrismConfig {
  id: PrismMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  promptPrefix: string;
}

export const PRISM_MODES: Record<PrismMode, PrismConfig> = {
  socratic: {
    id: 'socratic',
    label: 'Socratic Inquiry',
    shortLabel: 'Socratic',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    description: 'Probes core assumptions, hidden beliefs, and underlying questions.',
    promptPrefix: '[PRISM FRAMEWORK: Socratic Inquiry - Guide with thoughtful questions that deconstruct assumptions.]',
  },
  stoic: {
    id: 'stoic',
    label: 'Stoic Clarity',
    shortLabel: 'Stoic',
    icon: <Compass className="w-3.5 h-3.5" />,
    description: 'Focuses on what is within control, emotional sovereignty, and calmness.',
    promptPrefix: '[PRISM FRAMEWORK: Stoic Clarity - Anchor in the dichotomy of control, perspective, and composure.]',
  },
  strategist: {
    id: 'strategist',
    label: 'Strategic Leverage',
    shortLabel: 'Strategist',
    icon: <Zap className="w-3.5 h-3.5" />,
    description: 'Identifies 80/20 leverage points, bottlenecks, and decision paths.',
    promptPrefix: '[PRISM FRAMEWORK: Strategic Leverage - Synthesize high-impact insights and core decision matrices.]',
  },
  compassion: {
    id: 'compassion',
    label: 'Mindful Compassion',
    shortLabel: 'Compassion',
    icon: <Heart className="w-3.5 h-3.5" />,
    description: 'Provides gentle space, self-kindness, and mindful emotional breath.',
    promptPrefix: '[PRISM FRAMEWORK: Mindful Compassion - Offer warm validation and space for gentle self-kindness.]',
  },
  first_principles: {
    id: 'first_principles',
    label: 'First Principles',
    shortLabel: 'First Principles',
    icon: <Atom className="w-3.5 h-3.5" />,
    description: 'Deconstructs challenges to irreducible fundamental truths.',
    promptPrefix: '[PRISM FRAMEWORK: First Principles - Deconstruct thoughts to foundational axioms.]',
  },
};

interface PrismModeSelectorProps {
  currentMode: PrismMode;
  onSelectMode: (mode: PrismMode) => void;
}

export const PrismModeSelector: React.FC<PrismModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeConfig = PRISM_MODES[currentMode] || PRISM_MODES.socratic;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="btn-prism-mode-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-[11px] transition-all cursor-pointer"
        title={activeConfig.description}
      >
        <span className="text-amber-400">{activeConfig.icon}</span>
        <span className="uppercase text-slate-400 hidden sm:inline">Prism:</span>
        <span className="text-white font-bold">{activeConfig.shortLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-[#141416] border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] p-2 z-50 backdrop-blur-xl">
          <div className="px-2 py-1.5 border-b border-white/5 mb-1.5">
            <p className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Cognitive Reflection Prism
            </p>
          </div>
          <div className="space-y-1">
            {(Object.keys(PRISM_MODES) as PrismMode[]).map((modeKey) => {
              const item = PRISM_MODES[modeKey];
              const isSelected = currentMode === modeKey;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => {
                    onSelectMode(modeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg flex items-start space-x-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-amber-400">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold truncate">{item.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 font-sans leading-tight">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
