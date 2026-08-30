import React, { useState } from 'react';
import { Sparkles, Hash, Clock, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Summary } from '../../shared/types';

interface SummaryCardProps {
  summary: Summary | null;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!summary) return null;

  return (
    <section
      id="automatic-summary-card"
      aria-label="Automatic Conversation Summary"
      className="mb-6 rounded-2xl glass-panel-amber border border-amber-500/30 overflow-hidden shadow-[0_8px_32px_rgba(245,158,11,0.08)] transition-all"
    >
      <div className="p-4 bg-[#0F0F10]/70 flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              AUTOMATIC TURN SYNOPSIS
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                SYNCHRONIZED
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
          <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold bg-black/40 px-2 py-0.5 rounded border border-white/5">
            <Hash className="w-3 h-3" />
            <span>TURN_{summary.throughMessageCount}</span>
          </span>
          <span className="text-white/20">&bull;</span>
          <span>{new Date(summary.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label={isExpanded ? "Collapse summary" : "Expand summary"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3.5 bg-black/40">
          <p className="text-xs text-slate-200 leading-relaxed font-sans italic bg-white/5 p-3.5 rounded-xl border border-white/5 shadow-inner">
            &ldquo;{summary.abstract}&rdquo;
          </p>

          {summary.themes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-1 font-semibold">
                THEMES:
              </span>
              {summary.themes.map((theme, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono font-bold tracking-tight hover:bg-amber-500/20 transition-colors"
                >
                  <Tag className="w-2.5 h-2.5 text-amber-400" />
                  <span className="uppercase">#{theme}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};


