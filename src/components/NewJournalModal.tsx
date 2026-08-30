import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Plus } from 'lucide-react';

interface NewJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  isCreating: boolean;
}

export const NewJournalModal: React.FC<NewJournalModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please provide a title for your journal.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Title cannot exceed 100 characters.');
      return;
    }

    try {
      await onCreate(trimmed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create journal.');
    }
  };

  return (
    <div
      id="new-journal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-journal-title"
    >
      <div
        className="w-full max-w-md bg-[#0F0F10] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 id="create-journal-title" className="font-mono font-bold uppercase tracking-wider text-white text-sm">
                Create New Journal
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Initialize an isolated encrypted journal container in your vault
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label htmlFor="journal-title-input" className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Journal Identifier / Title
            </label>
            <input
              ref={inputRef}
              id="journal-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Architecture reflections, Weekly strategy, Personal thoughts..."
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-500/60 text-white placeholder-slate-600 text-xs font-mono outline-hidden transition-all"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-create-journal-btn"
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Creating...' : 'Create Journal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

