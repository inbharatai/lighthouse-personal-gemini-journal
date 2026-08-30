import React from 'react';
import { ChevronDown, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JumpToBottomButtonProps {
  isVisible: boolean;
  unreadCount: number;
  onClick: () => void;
  isAutoScrollEnabled: boolean;
}

export const JumpToBottomButton: React.FC<JumpToBottomButtonProps> = ({
  isVisible,
  unreadCount,
  onClick,
  isAutoScrollEnabled,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="sticky bottom-4 z-30 flex justify-center w-full pointer-events-none"
        >
          <button
            id="btn-jump-to-bottom"
            type="button"
            onClick={onClick}
            className="pointer-events-auto group inline-flex items-center space-x-2 px-3.5 py-2 rounded-full bg-[#161619]/90 hover:bg-[#1E1E24] text-white border border-amber-500/30 hover:border-amber-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-xl transition-all cursor-pointer text-xs font-mono select-none"
            aria-label="Jump to latest message"
          >
            <div className="w-5 h-5 rounded-full bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-400 flex items-center justify-center transition-colors">
              <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </div>

            <span className="font-semibold text-slate-200 group-hover:text-white">
              {unreadCount > 0 ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-bold">+{unreadCount} new {unreadCount === 1 ? 'turn' : 'turns'}</span>
                </span>
              ) : (
                'Jump to latest'
              )}
            </span>

            {!isAutoScrollEnabled && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 font-mono">
                Manual
              </span>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
