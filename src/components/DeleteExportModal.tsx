import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, AlertTriangle, FileText, Check, Shield } from 'lucide-react';
import { Journal } from '../../shared/types';

interface DeleteExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: Journal | null;
  onExport: () => Promise<void>;
  onDelete: () => Promise<void>;
  isProcessing: boolean;
}

export const DeleteExportModal: React.FC<DeleteExportModalProps> = ({
  isOpen,
  onClose,
  journal,
  onExport,
  onDelete,
  isProcessing,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !journal) return null;

  return (
    <div
      id="delete-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-journal-title"
    >
      <div
        className="w-full max-w-md bg-[#0F0F10] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 id="manage-journal-title" className="font-mono font-bold uppercase tracking-wider text-white text-sm">
                Manage Journal
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs font-sans">
                &ldquo;{journal.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          {/* Export Action */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="pr-3">
              <p className="font-mono font-bold uppercase text-white text-xs">Export Journal</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Download verified history with turn summaries and provenance receipts in JSON.
              </p>
            </div>
            <button
              id="btn-export-journal"
              onClick={onExport}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase font-bold transition-colors shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Permanent Deletion Action */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono font-bold uppercase text-rose-300 text-xs">Permanent Deletion</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Permanently deletes this journal document and all descendant turn messages from Firestore. This action is irreversible.
                </p>
              </div>
            </div>

            {!confirmDelete ? (
              <button
                id="btn-start-delete-journal"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 px-3 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-mono text-xs uppercase transition-colors"
              >
                Delete this journal...
              </button>
            ) : (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-mono text-rose-300">
                  Are you certain? Confirm deletion below:
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-delete-journal"
                    onClick={onDelete}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase font-bold transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Deleting...' : 'Confirm Delete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#0A0A0B]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

