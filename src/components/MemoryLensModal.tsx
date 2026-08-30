import React, { useState, useEffect } from 'react';
import { X, Eye, Layers, Calendar, CheckSquare, Square, Shield, Check } from 'lucide-react';
import { MemoryScope, Journal } from '../../shared/types';

interface MemoryLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScope: MemoryScope;
  currentSelectedIds: string[];
  journals: Journal[];
  activeJournalId: string | null;
  isEphemeralMode: boolean;
  onSave: (scope: MemoryScope, selectedIds: string[]) => void;
}

export const MemoryLensModal: React.FC<MemoryLensModalProps> = ({
  isOpen,
  onClose,
  currentScope,
  currentSelectedIds,
  journals,
  activeJournalId,
  isEphemeralMode,
  onSave,
}) => {
  const [scope, setScope] = useState<MemoryScope>(currentScope);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentSelectedIds);

  useEffect(() => {
    setScope(currentScope);
    setSelectedIds(currentSelectedIds);
  }, [currentScope, currentSelectedIds, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleJournalSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((jId) => jId !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onSave(scope, selectedIds);
    onClose();
  };

  return (
    <div
      id="memory-lens-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lens-title"
    >
      <div
        className="w-full max-w-lg bg-[#0F0F10] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 id="lens-title" className="font-mono font-bold uppercase tracking-wider text-white text-sm">
                Memory Lens Configuration
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Control AI memory context and cross-journal retrieval boundaries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* Scope 1: No added memory */}
          <label
            className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              scope === 'none'
                ? 'bg-amber-500/10 border-amber-500/30 text-white'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <input
              type="radio"
              name="memoryScope"
              value="none"
              checked={scope === 'none'}
              onChange={() => setScope('none')}
              className="mt-0.5 accent-amber-500"
            />
            <div>
              <p className="text-xs font-semibold text-white uppercase font-mono">No added memory</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Gemini receives only the bounded current conversation for this turn. No older or outside journal entries are accessed.
              </p>
            </div>
          </label>

          {/* Scope 2: This journal */}
          <label
            className={`flex items-start space-x-3 p-3.5 rounded-xl border transition-all ${
              isEphemeralMode
                ? 'opacity-40 cursor-not-allowed bg-black/40 border-white/5'
                : scope === 'this_journal'
                ? 'bg-amber-500/10 border-amber-500/30 text-white cursor-pointer'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 cursor-pointer'
            }`}
          >
            <input
              type="radio"
              name="memoryScope"
              value="this_journal"
              disabled={isEphemeralMode}
              checked={scope === 'this_journal'}
              onChange={() => setScope('this_journal')}
              className="mt-0.5 accent-amber-500"
            />
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-semibold text-white uppercase font-mono">This journal only</p>
                {isEphemeralMode && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                    UNAVAILABLE_IN_EPHEMERAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Gemini may receive a bounded set of older historical entries from this active journal.
              </p>
            </div>
          </label>

          {/* Scope 3: Selected journals */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              scope === 'selected_journals'
                ? 'bg-amber-500/10 border-amber-500/30 text-white'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="memoryScope"
                value="selected_journals"
                checked={scope === 'selected_journals'}
                onChange={() => setScope('selected_journals')}
                className="mt-0.5 accent-amber-500"
              />
              <div>
                <p className="text-xs font-semibold text-white uppercase font-mono">Selected journals</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Explicitly select other journals below whose entries Gemini may reference.
                </p>
              </div>
            </label>

            {/* Checkbox selector for journals */}
            {scope === 'selected_journals' && (
              <div className="mt-3.5 pt-3 border-t border-white/10 pl-6 space-y-2 max-h-40 overflow-y-auto">
                {journals.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-mono">No other journals available to select.</p>
                ) : (
                  journals
                    .filter((j) => isEphemeralMode || j.id !== activeJournalId)
                    .map((journal) => {
                      const isChecked = selectedIds.includes(journal.id);
                      return (
                        <button
                          key={journal.id}
                          type="button"
                          onClick={() => toggleJournalSelection(journal.id)}
                          className="flex items-center space-x-2.5 text-xs text-slate-300 w-full text-left py-1 hover:text-white"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{journal.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({journal.messageCount} turns)</span>
                        </button>
                      );
                    })
                )}
              </div>
            )}
          </div>

          {/* Scope 4: Recent journals (30 days) */}
          <label
            className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              scope === 'recent_journals'
                ? 'bg-amber-500/10 border-amber-500/30 text-white'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <input
              type="radio"
              name="memoryScope"
              value="recent_journals"
              checked={scope === 'recent_journals'}
              onChange={() => setScope('recent_journals')}
              className="mt-0.5 accent-amber-500"
            />
            <div>
              <p className="text-xs font-semibold text-white uppercase font-mono">Recent journals (Past 30 days)</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Gemini may receive bounded entries from any journals updated within the last 30 days.
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#0A0A0B]/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono uppercase">APPLIES_NEXT_TURN</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="apply-memory-lens-btn"
              onClick={handleApply}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Lens</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

