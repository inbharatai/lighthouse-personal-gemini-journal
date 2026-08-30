import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Plus,
  Sparkles,
  LogOut,
  X,
  MessageSquare,
  ChevronRight,
  Clock,
  Search,
  Sliders,
} from 'lucide-react';
import { Journal } from '../../shared/types';
import { LighthouseLogo } from './LighthouseLogo';

interface SidebarProps {
  user: User;
  journals: Journal[];
  activeJournalId: string | null;
  isEphemeralMode: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectJournal: (journalId: string) => void;
  onSelectEphemeral: () => void;
  onOpenNewJournalModal: () => void;
  onOpenSettingsModal?: () => void;
  onSignOut: () => void;
}

export function formatLastActive(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) {
      return 'Just now';
    }
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }
    if (diffHour < 24) {
      return `${diffHour}h ago`;
    }
    if (diffDay === 1) {
      return 'Yesterday';
    }
    if (diffDay < 7) {
      return `${diffDay}d ago`;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  journals,
  activeJournalId,
  isEphemeralMode,
  isOpenMobile,
  onCloseMobile,
  onSelectJournal,
  onSelectEphemeral,
  onOpenNewJournalModal,
  onOpenSettingsModal,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJournals = journals.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = j.title.toLowerCase().includes(q);
    const abstractMatch = j.summary?.abstract.toLowerCase().includes(q);
    const themeMatch = j.summary?.themes.some((t) => t.toLowerCase().includes(q));
    return titleMatch || abstractMatch || themeMatch;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0F0F10] border-r border-white/10 flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding & New Journal */}
        <div className="p-5 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LighthouseLogo size="sm" />
              <div>
                <h1 className="text-base font-bold tracking-tighter text-white uppercase font-mono">LIGHTHOUSE</h1>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-semibold block">PERSONAL VAULT</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              id="sidebar-mobile-close"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 md:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Journal Button */}
          <button
            id="sidebar-new-journal-btn"
            onClick={() => {
              onOpenNewJournalModal();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-dashed border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-amber-400 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span className="uppercase tracking-wider">+ New Journal</span>
          </button>

          {/* Search Filter Input */}
          {journals.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="sidebar-journal-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journals & themes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-amber-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation & List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Modes Section */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-1 font-mono">
              Operating Mode
            </div>

            {/* Ephemeral Mode Button */}
            <button
              id="btn-mode-ephemeral"
              onClick={() => {
                onSelectEphemeral();
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                isEphemeralMode
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Sparkles className={`w-4 h-4 shrink-0 ${isEphemeralMode ? 'text-purple-400' : 'text-slate-500'}`} />
                <div className="truncate">
                  <p className="font-medium text-white truncate">Ephemeral Reflection</p>
                  <p className="text-[10px] font-mono text-purple-400/80 truncate">No Firestore persistence</p>
                </div>
              </div>
              {isEphemeralMode && (
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold border border-purple-500/30">
                  ACTIVE
                </span>
              )}
            </button>
          </div>

          {/* Journals List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-1 font-mono">
              <span>Personal Journals</span>
              <span className="px-1.5 py-0.2 bg-white/5 rounded border border-white/5 text-[9px]">
                {filteredJournals.length}
              </span>
            </div>

            {filteredJournals.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-white/5 border border-dashed border-white/10 text-xs text-slate-500 font-mono">
                {searchQuery ? (
                  <>
                    <p>No journals matching &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-1.5 text-[11px] text-amber-400 underline"
                    >
                      Clear search filter
                    </button>
                  </>
                ) : (
                  <>
                    <p>No journals created yet.</p>
                    <p className="mt-1 text-[11px] text-slate-600">Click &ldquo;+ New Journal&rdquo; above to begin.</p>
                  </>
                )}
              </div>
            ) : (
              filteredJournals.map((journal) => {
                const isActive = !isEphemeralMode && activeJournalId === journal.id;
                return (
                  <button
                    key={journal.id}
                    id={`journal-item-${journal.id}`}
                    onClick={() => {
                      onSelectJournal(journal.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all border group cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 text-white border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.12)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                      <div className="truncate flex-1 min-w-0">
                        <p className={`truncate font-medium ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{journal.title}</p>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono truncate mt-0.5">
                          <span className="shrink-0">{journal.messageCount} {journal.messageCount === 1 ? 'Turn' : 'Turns'}</span>
                          <span className="text-slate-600 shrink-0">·</span>
                          <span
                            id={`journal-last-active-${journal.id}`}
                            className={`flex items-center space-x-1 truncate ${
                              isActive ? 'text-amber-400/90' : 'text-slate-400 group-hover:text-slate-300'
                            }`}
                            title={`Last active: ${new Date(journal.updatedAt).toLocaleString()}`}
                          >
                            <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            <span className="truncate">Last active {formatLastActive(journal.updatedAt)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* User Profile & Sign Out */}
        <div className="p-4 border-t border-white/10 bg-[#0A0A0B]/60 space-y-2">
          {onOpenSettingsModal && (
            <button
              id="sidebar-preferences-btn"
              onClick={() => {
                onOpenSettingsModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono border border-white/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Vault Preferences</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase">Config</span>
            </button>
          )}

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center space-x-2.5 truncate">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-lg border border-white/10 shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-amber-400 shrink-0">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user.displayName || 'dev_lead_auditor'}</p>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                  <p className="text-[10px] text-emerald-400 font-mono tracking-tight truncate">SECURE_SESSION</p>
                </div>
              </div>
            </div>

            <button
              id="sidebar-signout-btn"
              onClick={onSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

