import React, { useEffect } from 'react';
import { X, ShieldCheck, Eye, Layers, MessageSquare, Clock, Hash } from 'lucide-react';
import { ProvenanceItem } from '../../shared/types';

interface MemoryReceiptModalProps {
  receipt: ProvenanceItem[] | null;
  onClose: () => void;
}

export const MemoryReceiptModal: React.FC<MemoryReceiptModalProps> = ({ receipt, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!receipt) return null;

  const conversationItems = receipt.filter((r) => r.sourceKind === 'conversation');
  const memoryItems = receipt.filter((r) => r.sourceKind === 'memory');

  return (
    <div
      id="memory-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div
        className="w-full max-w-2xl bg-[#0F0F10] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="receipt-title" className="font-mono font-bold uppercase tracking-wider text-white text-sm">
                Memory Receipt
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Verifiable record of all context supplied to Gemini for this turn
              </p>
            </div>
          </div>

          <button
            id="receipt-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-300">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-widest font-semibold block">
                Current Conversation
              </span>
              <p className="text-lg font-bold text-white font-mono mt-1">
                {conversationItems.length} {conversationItems.length === 1 ? 'ITEM' : 'ITEMS'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-mono uppercase text-amber-400 tracking-widest font-semibold block">
                Memory Lens Excerpts
              </span>
              <p className="text-lg font-bold text-amber-400 font-mono mt-1">
                {memoryItems.length} {memoryItems.length === 1 ? 'ITEM' : 'ITEMS'}
              </p>
            </div>
          </div>

          {receipt.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white/5 border border-dashed border-white/10 text-slate-500 font-mono text-xs">
              No prior conversation or memory context was supplied for this turn.
            </div>
          ) : (
            <div className="space-y-3">
              {receipt.map((item, index) => {
                const isMemory = item.sourceKind === 'memory';
                return (
                  <div
                    key={`${item.messageId}-${index}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isMemory
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {/* Source Kind Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold border ${
                            isMemory
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-white/10 text-slate-300 border-white/10'
                          }`}
                        >
                          {item.sourceKind}
                        </span>

                        <span className="text-xs font-semibold text-white">
                          {item.journalTitle}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="text-[11px] text-slate-400 uppercase font-mono">
                          {item.role}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                        <span className="inline-flex items-center space-x-1">
                          <Hash className="w-3 h-3" />
                          <span>{item.messageId.slice(0, 8)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div className="p-3 rounded-lg bg-[#0A0A0B] border border-white/5 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {item.excerpt}
                    </div>

                    <div className="mt-2 flex items-center justify-end text-[10px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#0A0A0B]/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">CONTEXT_ITEMS: {receipt.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

