import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  Menu,
  Sparkles,
  Send,
  Eye,
  Download,
  Lock,
  Clock,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Info,
  Sliders,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Headphones,
  Compass,
} from 'lucide-react';
import {
  Journal,
  Message,
  Summary,
  ProvenanceItem,
  MemoryScope,
  ChatRequest,
  EphemeralHistoryItem,
} from '../shared/types';
import { api, setApiAuthContext, abortActiveRequests } from './api';
import { subscribeToAuth, signInWithGoogle, signOut } from './firebase';
import { SignedOutView } from './components/SignedOutView';
import { Sidebar } from './components/Sidebar';
import { SummaryCard } from './components/SummaryCard';
import { MemoryReceiptModal } from './components/MemoryReceiptModal';
import { MemoryLensModal } from './components/MemoryLensModal';
import { DeleteExportModal } from './components/DeleteExportModal';
import { NewJournalModal } from './components/NewJournalModal';
import { SettingsModal, FontSizePreference } from './components/SettingsModal';
import { JumpToBottomButton } from './components/JumpToBottomButton';
import { VoiceDictationButton } from './components/VoiceDictationButton';
import { PrismModeSelector, PrismMode, PRISM_MODES } from './components/PrismModeSelector';
import { LighthouseAtmosphere } from './components/LighthouseAtmosphere';
import { LighthouseLogo } from './components/LighthouseLogo';
import { SoundscapeType, soundscapeEngine } from './utils/audioSoundscape';

interface DisplayMessage {
  id: string;
  turnId?: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
  provenance?: ProvenanceItem[];
  isOptimistic?: boolean;
}

const STORAGE_KEYS = {
  AUTO_SCROLL: 'lighthouse_auto_scroll',
  FONT_SIZE: 'lighthouse_font_size',
  PRISM_MODE: 'lighthouse_prism_mode',
  SOUNDSCAPE: 'lighthouse_soundscape',
  SOUNDSCAPE_VOL: 'lighthouse_soundscape_vol',
};

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App data state
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [totalMessageCount, setTotalMessageCount] = useState(0);

  // Ephemeral state
  const [isEphemeralMode, setIsEphemeralMode] = useState(false);
  const [ephemeralMessages, setEphemeralMessages] = useState<DisplayMessage[]>([]);

  // Composer & Turn state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // User Settings & Preferences
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SCROLL);
    return saved !== null ? saved === 'true' : true;
  });
  const [fontSize, setFontSize] = useState<FontSizePreference>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSizePreference;
    return saved || 'standard';
  });
  const [prismMode, setPrismMode] = useState<PrismMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRISM_MODE) as PrismMode;
    return saved || 'socratic';
  });
  const [currentSoundscape, setCurrentSoundscape] = useState<SoundscapeType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUNDSCAPE) as SoundscapeType;
    return saved || 'none';
  });
  const [soundscapeVolume, setSoundscapeVolume] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUNDSCAPE_VOL);
    return saved !== null ? parseFloat(saved) : 0.4;
  });
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Scroll Tracking & Jump To Bottom
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadTurnsScrolledUp, setUnreadTurnsScrolledUp] = useState(0);

  // Memory Lens state
  const [memoryScope, setMemoryScope] = useState<MemoryScope>('none');
  const [selectedJournalIds, setSelectedJournalIds] = useState<string[]>([]);
  const [isMemoryLensOpen, setIsMemoryLensOpen] = useState(false);

  // Modals state
  const [activeReceipt, setActiveReceipt] = useState<ProvenanceItem[] | null>(null);
  const [isNewJournalOpen, setIsNewJournalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save Settings
  const handleToggleAutoScroll = (enabled: boolean) => {
    setIsAutoScrollEnabled(enabled);
    localStorage.setItem(STORAGE_KEYS.AUTO_SCROLL, String(enabled));
    if (enabled) {
      scrollToBottom();
    }
  };

  const handleChangeFontSize = (size: FontSizePreference) => {
    setFontSize(size);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
  };

  const handleSelectPrismMode = (mode: PrismMode) => {
    setPrismMode(mode);
    localStorage.setItem(STORAGE_KEYS.PRISM_MODE, mode);
  };

  const handleChangeSoundscape = (type: SoundscapeType) => {
    setCurrentSoundscape(type);
    localStorage.setItem(STORAGE_KEYS.SOUNDSCAPE, type);
    soundscapeEngine.play(type);
  };

  const handleChangeSoundscapeVolume = (val: number) => {
    setSoundscapeVolume(val);
    localStorage.setItem(STORAGE_KEYS.SOUNDSCAPE_VOL, String(val));
    soundscapeEngine.setVolume(val);
  };

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadTurnsScrolledUp(0);
    setIsAtBottom(true);
  }, []);

  // Handle manual user scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom <= 80;

    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadTurnsScrolledUp(0);
    }
  };

  // Scroll effect on incoming message or turn changes
  useEffect(() => {
    if (isAutoScrollEnabled || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadTurnsScrolledUp(0);
    } else {
      // User is scrolled up and auto-scroll is disabled or inactive
      setUnreadTurnsScrolledUp((prev) => prev + 1);
    }
  }, [messages, ephemeralMessages, isSending, isAutoScrollEnabled]);

  // Auth subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      // Clear account-scoped browser state on auth switch or sign-out
      abortActiveRequests();
      setApiAuthContext(user ? user.uid : null);

      setCurrentUser(user);
      setIsAuthLoading(false);

      if (!user) {
        // Clear all sensitive and private state
        setJournals([]);
        setActiveJournalId(null);
        setActiveJournal(null);
        setMessages([]);
        setEphemeralMessages([]);
        setInputText('');
        setChatError(null);
        setMemoryScope('none');
        setSelectedJournalIds([]);
        setActiveReceipt(null);
        setIsNewJournalOpen(false);
        setIsManageModalOpen(false);
        setIsSettingsOpen(false);
        setIsSidebarOpenMobile(false);
        soundscapeEngine.stop();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load journals when authenticated
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    async function loadJournals() {
      try {
        const data = await api.listJournals(currentUser!);
        if (!isMounted) return;

        setJournals(data.journals);

        // If no active journal and journals exist, select the most recently updated one
        if (!activeJournalId && !isEphemeralMode && data.journals.length > 0) {
          handleSelectJournal(data.journals[0].id);
        } else if (data.journals.length === 0 && !activeJournalId && !isEphemeralMode) {
          // Default to ephemeral mode if no journals exist
          setIsEphemeralMode(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setChatError(`Failed to load journals: ${err.message}`);
        }
      }
    }

    loadJournals();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Load active journal details and latest messages
  useEffect(() => {
    if (!currentUser || isEphemeralMode || !activeJournalId) return;

    let isMounted = true;

    async function loadJournalDetail() {
      try {
        const data = await api.getJournal(currentUser!, activeJournalId!);
        if (!isMounted) return;

        setActiveJournal(data.journal);
        setMessages(data.messages);
        setHasOlderMessages(data.hasOlderMessages);
        setTotalMessageCount(data.totalMessages);
        setChatError(null);
      } catch (err: any) {
        if (isMounted) {
          setChatError(`Failed to load journal: ${err.message}`);
        }
      }
    }

    loadJournalDetail();

    return () => {
      isMounted = false;
    };
  }, [currentUser, activeJournalId, isEphemeralMode]);

  // Sign In handler
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const code = err.code || '';
      const msg = err.message || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups or open the app in a new tab.');
      } else if (code === 'auth/cancelled-popup-request') {
        setAuthError('Only one popup request is allowed at a time.');
      } else if (msg.includes('api-key-not-valid') || code === 'auth/api-key-not-valid') {
        setAuthError('Invalid Firebase API key detected. Please verify your Firebase project credentials.');
      } else {
        setAuthError(msg || 'Google sign-in could not be completed.');
      }
    }
  };

  // Sign Out handler
  const handleSignOut = async () => {
    try {
      soundscapeEngine.stop();
      await signOut();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Select persistent journal
  const handleSelectJournal = (journalId: string) => {
    setIsEphemeralMode(false);
    setActiveJournalId(journalId);
    setChatError(null);
    setUnreadTurnsScrolledUp(0);
  };

  // Switch to Ephemeral Reflection
  const handleSelectEphemeral = () => {
    setIsEphemeralMode(true);
    setActiveJournalId(null);
    setActiveJournal(null);
    if (memoryScope === 'this_journal') {
      setMemoryScope('none');
    }
    setChatError(null);
    setUnreadTurnsScrolledUp(0);
  };

  // Create new journal
  const handleCreateJournal = async (title: string) => {
    if (!currentUser) return;
    setIsProcessingAction(true);
    try {
      const data = await api.createJournal(currentUser, title);
      setJournals((prev) => [data.journal, ...prev]);
      setIsEphemeralMode(false);
      setActiveJournalId(data.journal.id);
      setActiveJournal(data.journal);
      setMessages([]);
      setHasOlderMessages(false);
      setTotalMessageCount(0);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Export current active journal
  const handleExportJournal = async () => {
    if (!currentUser || !activeJournalId) return;
    setIsProcessingAction(true);
    try {
      const data = await api.exportJournal(currentUser, activeJournalId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lighthouse-journal-${activeJournal?.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setChatError(`Export failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Delete current active journal
  const handleDeleteJournal = async () => {
    if (!currentUser || !activeJournalId) return;
    setIsProcessingAction(true);
    try {
      await api.deleteJournal(currentUser, activeJournalId);
      setJournals((prev) => prev.filter((j) => j.id !== activeJournalId));
      setIsManageModalOpen(false);

      // Select next available journal or ephemeral mode
      const remaining = journals.filter((j) => j.id !== activeJournalId);
      if (remaining.length > 0) {
        handleSelectJournal(remaining[0].id);
      } else {
        handleSelectEphemeral();
      }
    } catch (err: any) {
      setChatError(`Deletion failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Copy message text
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Send turn message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending || !currentUser) return;

    const turnId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Optimistic user message
    const optimisticUserMsg: DisplayMessage = {
      id: `${turnId}-user`,
      turnId,
      role: 'user',
      text: textToSend,
      createdAt: now,
      isOptimistic: true,
    };

    // Save draft text in case we need to restore on failure
    const draftText = textToSend;
    setInputText('');
    setChatError(null);
    setIsSending(true);

    if (isEphemeralMode) {
      setEphemeralMessages((prev) => [...prev, optimisticUserMsg]);
    } else {
      setMessages((prev) => [...prev, optimisticUserMsg]);
    }

    try {
      let requestPayload: ChatRequest;

      // Attach Prism lens directive if non-default
      const activePrism = PRISM_MODES[prismMode];
      const processedMessage = activePrism ? `${activePrism.promptPrefix}\n${textToSend}` : textToSend;

      let targetJournalId = activeJournalId;
      if (!isEphemeralMode && !targetJournalId) {
        // Auto-provision initial journal for the user
        const journalTitle = textToSend.length > 32 ? `${textToSend.slice(0, 30)}...` : textToSend;
        try {
          const created = await api.createJournal(currentUser, journalTitle || 'Reflection Journal');
          setJournals((prev) => [created.journal, ...prev]);
          setActiveJournalId(created.journal.id);
          setActiveJournal(created.journal);
          targetJournalId = created.journal.id;
        } catch {
          // Fallback to ephemeral reflection if offline/error
          targetJournalId = null;
        }
      }

      if (isEphemeralMode || !targetJournalId) {
        const ephemeralHistory: EphemeralHistoryItem[] = ephemeralMessages.slice(-20).map((m) => ({
          role: m.role,
          text: m.text,
          createdAt: m.createdAt,
        }));

        requestPayload = {
          turnId,
          message: textToSend,
          prismMode,
          memoryScope,
          selectedJournalIds: memoryScope === 'selected_journals' ? selectedJournalIds : undefined,
          ephemeralHistory,
        };
      } else {
        requestPayload = {
          journalId: targetJournalId,
          turnId,
          message: textToSend,
          prismMode,
          memoryScope,
          selectedJournalIds: memoryScope === 'selected_journals' ? selectedJournalIds : undefined,
        };
      }

      const response = await api.sendChat(currentUser, requestPayload);

      // Server model response message
      const modelReplyText =
        response.reply && response.reply.trim().length > 0
          ? response.reply
          : 'Welcome to your reflection space. What is currently on your mind that you would like to reflect on?';

      const modelMsg: DisplayMessage = {
        id: response.modelMessage ? response.modelMessage.id : `${turnId}-model`,
        turnId,
        role: 'model',
        text: modelReplyText,
        createdAt: response.modelMessage ? response.modelMessage.createdAt : new Date().toISOString(),
        provenance: response.provenance,
      };

      if (isEphemeralMode || !targetJournalId) {
        setEphemeralMessages((prev) => [
          ...prev.filter((m) => m.turnId !== turnId || !m.isOptimistic),
          { ...optimisticUserMsg, isOptimistic: false },
          modelMsg,
        ]);
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.turnId !== turnId || !m.isOptimistic),
          response.userMessage ? response.userMessage : { ...optimisticUserMsg, isOptimistic: false },
          modelMsg,
        ]);

        if (response.summary) {
          setActiveJournal((prev) =>
            prev
              ? {
                  ...prev,
                  summary: response.summary,
                  messageCount: prev.messageCount + 2,
                  updatedAt: new Date().toISOString(),
                }
              : null
          );

          setJournals((prev) =>
            prev.map((j) =>
              j.id === targetJournalId
                ? {
                    ...j,
                    summary: response.summary,
                    messageCount: j.messageCount + 2,
                    updatedAt: new Date().toISOString(),
                  }
                : j
            )
          );
        }
      }
    } catch (err: any) {
      if (isEphemeralMode) {
        setEphemeralMessages((prev) => prev.filter((m) => m.turnId !== turnId));
      } else {
        setMessages((prev) => prev.filter((m) => m.turnId !== turnId));
      }

      setInputText(draftText);
      setChatError(err.message || 'Turn failed to process. Your draft has been restored.');
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Keyboard shortcut: Enter sends, Shift+Enter new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceTranscript = (dictated: string) => {
    setInputText((prev) => (prev ? `${prev.trim()} ${dictated.trim()}` : dictated.trim()));
  };

  // Current display messages based on mode
  const currentMessages = isEphemeralMode ? ephemeralMessages : messages;

  // Typography scale classes
  const fontClass =
    fontSize === 'compact'
      ? 'text-xs'
      : fontSize === 'spacious'
      ? 'text-base sm:text-base leading-relaxed'
      : 'text-xs sm:text-sm leading-relaxed';

  // Render Signed Out view
  if (!isAuthLoading && !currentUser) {
    return <SignedOutView onSignIn={handleSignIn} isLoading={isAuthLoading} error={authError} />;
  }

  // Loading Splash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-slate-300 space-y-4 relative overflow-hidden bg-cyber-grid">
        <LighthouseAtmosphere />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10 flex flex-col items-center">
          <LighthouseLogo size="lg" className="mb-2" />
        </div>
        <div className="text-center space-y-1 z-10">
          <p className="font-mono text-white text-base font-bold tracking-tight uppercase">Opening Lighthouse Vault</p>
          <p className="text-xs text-slate-500 font-mono">Verifying secure authentication context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-300 selection:bg-amber-500/30 selection:text-white font-sans overflow-hidden relative">
      {/* Background Animated Lighthouse Atmosphere */}
      <LighthouseAtmosphere />

      {/* Sidebar */}
      <Sidebar
        user={currentUser!}
        journals={journals}
        activeJournalId={activeJournalId}
        isEphemeralMode={isEphemeralMode}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onSelectJournal={handleSelectJournal}
        onSelectEphemeral={handleSelectEphemeral}
        onOpenNewJournalModal={() => setIsNewJournalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Chat & Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0A0A0B]/75 backdrop-blur-[2px] relative z-10">
        {/* Header Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#0A0A0B]/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <button
              id="btn-open-mobile-sidebar"
              onClick={() => setIsSidebarOpenMobile(true)}
              aria-expanded={isSidebarOpenMobile}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 md:hidden cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="truncate">
              <div className="flex items-center space-x-2.5 truncate">
                <h2 className="font-mono font-bold text-white text-sm sm:text-base uppercase tracking-tight truncate">
                  {isEphemeralMode ? 'Ephemeral Reflection' : activeJournal?.title || 'Personal Journal'}
                </h2>

                {/* Status Badges */}
                {isEphemeralMode ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>UNSAVED_TAB</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    <span>FIRESTORE_SECURED</span>
                  </span>
                )}
              </div>

              {!isEphemeralMode && activeJournal && (
                <p className="text-[10px] text-slate-500 font-mono hidden sm:block truncate mt-0.5">
                  {activeJournal.messageCount} turns &bull; Updated {new Date(activeJournal.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Soundscape Quick Toggle */}
            <button
              id="header-soundscape-btn"
              onClick={() => {
                if (currentSoundscape === 'none') {
                  handleChangeSoundscape('ocean');
                } else {
                  handleChangeSoundscape('none');
                }
              }}
              className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                currentSoundscape !== 'none'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title={currentSoundscape !== 'none' ? `Playing: ${currentSoundscape}` : 'Play Ambient Soundscape'}
            >
              {currentSoundscape !== 'none' ? <Headphones className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Memory Lens Quick Toggle Button */}
            <button
              id="header-memory-lens-btn"
              onClick={() => setIsMemoryLensOpen(true)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                memoryScope !== 'none'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <Eye className={`w-3.5 h-3.5 ${memoryScope !== 'none' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline uppercase text-[10px] text-slate-400">Lens:</span>
              <span className="capitalize text-[11px] font-semibold">
                {memoryScope === 'none'
                  ? 'Off'
                  : memoryScope === 'this_journal'
                  ? 'Active'
                  : memoryScope === 'selected_journals'
                  ? `${selectedJournalIds.length} Selected`
                  : '30d Recent'}
              </span>
            </button>

            {/* Vault Preferences Button */}
            <button
              id="header-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
              title="Preferences & Auto-scroll Settings"
              aria-label="Vault Preferences"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Manage/Export/Delete button (Only for persistent journals) */}
            {!isEphemeralMode && activeJournal && (
              <button
                id="header-manage-journal-btn"
                onClick={() => setIsManageModalOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
                title="Manage & Export Journal"
                aria-label="Manage & Export Journal"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Content Container (Center Canvas + Desktop Bento Sidebar) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Conversation Main Scroll Area */}
          <main
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 max-w-4xl w-full mx-auto relative flex flex-col justify-between"
            aria-live="polite"
          >
            <div>
              {/* Automatic Summary Banner (Persistent Journals only) */}
              {!isEphemeralMode && activeJournal?.summary && (
                <SummaryCard summary={activeJournal.summary} />
              )}

              {/* Disclosure notice when message count > 500 */}
              {hasOlderMessages && (
                <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between font-mono">
                  <span className="inline-flex items-center space-x-1.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Displaying latest 500 turns. Total vault count: {totalMessageCount} turns.</span>
                  </span>
                  <button
                    onClick={handleExportJournal}
                    className="text-amber-400 hover:underline font-bold ml-2 shrink-0 uppercase text-[11px] cursor-pointer"
                  >
                    Export Full History
                  </button>
                </div>
              )}

              {/* Conversation Messages */}
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse-subtle">
                    {isEphemeralMode ? <Sparkles className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                  </div>

                  <h3 className="font-mono font-bold text-xl sm:text-2xl text-white uppercase tracking-tight mb-2">
                    {isEphemeralMode ? 'Ephemeral Reflection' : `${activeJournal?.title || 'Personal Journal'}`}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm max-w-md font-sans leading-relaxed mb-8">
                    {isEphemeralMode
                      ? 'This reflection exists strictly in transient tab memory. No turns or summaries will be persisted in Firestore.'
                      : 'Reflect calmly with Gemini. Your inputs are isolated, encrypted, and automatically summarized per turn.'}
                  </p>

                  {/* Bento Starter Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl w-full">
                    {[
                      { title: '💡 Strategic Clarity', text: 'What major challenge or opportunity requires my highest-leverage focus this week?' },
                      { title: '🧭 Deep Reflection', text: 'Help me reflect on what energizes me versus what drains my attention lately.' },
                      { title: '⚡ Decision Matrix', text: 'Walk through pros, cons, and second-order consequences of a major decision I am contemplating.' },
                      { title: '🛡️ Architectural Review', text: 'Let’s analyze my system design boundaries, data isolation, and failure modes.' },
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputText(prompt.text)}
                        className="p-4 rounded-xl glass-panel hover:border-amber-500/50 hover:bg-white/[0.08] text-left transition-all group flex flex-col justify-between space-y-2.5 cursor-pointer shadow-sm"
                      >
                        <span className="text-[11px] font-mono font-bold uppercase text-amber-400 tracking-wider flex items-center justify-between">
                          {prompt.title}
                          <span className="text-slate-500 group-hover:text-amber-300 transition-colors">&rarr;</span>
                        </span>
                        <p className="text-xs text-slate-300 group-hover:text-white leading-relaxed font-sans">
                          &ldquo;{prompt.text}&rdquo;
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const msgKey = msg.id || String(index);
                    const isCopied = copiedMessageId === msgKey;

                    return (
                      <div
                        key={msgKey}
                        id={`message-bubble-${msgKey}`}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                      >
                        {/* Message Meta Info */}
                        <div className="flex items-center space-x-2 mb-1.5 px-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          {!isUser && (
                            <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-[9px] shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                              L
                            </div>
                          )}
                          <span className={isUser ? 'text-slate-400 font-semibold' : 'text-amber-400 font-bold'}>
                            {isUser ? 'YOU' : 'LIGHTHOUSE // GEMINI'}
                          </span>
                          <span className="text-white/20">&bull;</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isOptimistic && (
                            <span className="text-amber-400 font-bold animate-pulse">&bull; TRANSMITTING...</span>
                          )}

                          {/* Quick Copy Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msgKey, msg.text)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-white cursor-pointer ml-1"
                            title="Copy message text"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Message Card */}
                        <div
                          className={`p-4 sm:p-5 rounded-2xl max-w-2xl leading-relaxed whitespace-pre-wrap ${fontClass} ${
                            isUser
                              ? 'chat-bubble-user text-white rounded-tr-xs'
                              : 'chat-bubble-model text-slate-100 rounded-tl-xs'
                          } ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'}`}
                        >
                          {msg.text || (
                            <span className="text-slate-400 italic">
                              {msg.isOptimistic ? 'Transmitting reflection...' : 'Reflection received.'}
                            </span>
                          )}
                        </div>

                        {/* Model Receipt Action Button */}
                        {!isUser && msg.provenance && msg.provenance.length > 0 && (
                          <div className="mt-2 px-1">
                            <button
                              onClick={() => setActiveReceipt(msg.provenance || null)}
                              className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors shadow-xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Memory Receipt ({msg.provenance.length} items)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Active Reflection Thinking Indicator */}
                  {isSending && (
                    <div id="reflection-thinking-indicator" className="flex flex-col items-start space-y-1.5 animate-fadeIn">
                      <div className="flex items-center space-x-2 px-1 text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                        <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-[9px] shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse">
                          L
                        </div>
                        <span className="font-bold">LIGHTHOUSE // REFLECTING</span>
                        <span className="text-white/20">&bull;</span>
                        <span className="text-slate-400 font-mono">
                          PRISM: {PRISM_MODES[prismMode]?.name || 'Socratic'}
                        </span>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl max-w-2xl chat-bubble-model text-slate-200 rounded-tl-xs border border-amber-500/30 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.08)] flex items-center space-x-3">
                        <div className="flex space-x-1.5 items-center">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-xs text-slate-300 font-mono">
                          Synthesizing thoughtful observation & Socratic inquiry...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Sticky Jump to Bottom Button */}
            <JumpToBottomButton
              isVisible={!isAtBottom && currentMessages.length > 2}
              unreadCount={unreadTurnsScrolledUp}
              onClick={scrollToBottom}
              isAutoScrollEnabled={isAutoScrollEnabled}
            />
          </main>

          {/* Desktop Right Bento Inspection Rail */}
          <aside className="hidden xl:flex w-72 shrink-0 border-l border-white/10 bg-[#0F0F10]/90 backdrop-blur-md p-4 flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Vault Security Status */}
              <div className="p-4 rounded-xl glass-panel space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    SYSTEM INTEGRITY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                </div>

                <div className="space-y-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>AUTH_STATE</span>
                    <span className="text-emerald-400 font-bold">VERIFIED_UID</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>STORAGE_LAYER</span>
                    <span className="text-slate-300">{isEphemeralMode ? 'TRANSIENT' : 'FIRESTORE_ISOLATED'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GEMINI_BOUNDARY</span>
                    <span className="text-amber-400 font-bold">SERVER_MEDIATED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AUTO_SCROLL</span>
                    <button
                      onClick={() => handleToggleAutoScroll(!isAutoScrollEnabled)}
                      className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${
                        isAutoScrollEnabled
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {isAutoScrollEnabled ? 'ENABLED' : 'PAUSED'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reader & Atmosphere Quick Rail */}
              <div className="p-4 rounded-xl glass-panel space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    ATMOSPHERE & FOCUS
                  </span>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-[10px] text-amber-400 hover:underline font-mono uppercase cursor-pointer"
                  >
                    PREFS
                  </button>
                </div>

                <div className="space-y-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>SOUNDSCAPE</span>
                    <span className="text-amber-400 font-bold capitalize">
                      {currentSoundscape === 'none' ? 'Muted' : currentSoundscape.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>PRISM_LENS</span>
                    <span className="text-slate-200 font-bold capitalize">{prismMode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TYPE_SCALE</span>
                    <span className="text-slate-300 capitalize">{fontSize}</span>
                  </div>
                </div>
              </div>

              {/* Memory Lens Active Inspector */}
              <div className="p-4 rounded-xl glass-panel space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    MEMORY LENS
                  </span>
                  <button
                    onClick={() => setIsMemoryLensOpen(true)}
                    className="text-[10px] text-amber-400 hover:underline font-mono uppercase cursor-pointer"
                  >
                    CONFIG
                  </button>
                </div>

                <div className="text-xs">
                  <p className="font-mono font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${memoryScope !== 'none' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                    {memoryScope === 'none'
                      ? 'No added memory'
                      : memoryScope === 'this_journal'
                      ? 'Active Journal History'
                      : memoryScope === 'selected_journals'
                      ? `${selectedJournalIds.length} Selected Journals`
                      : 'Recent 30 Days'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {memoryScope === 'none'
                      ? 'Gemini only inspects the bounded current conversation.'
                      : 'Context is bounded, sanitized, and verifiable via receipts.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Vault Stats */}
            <div className="p-3.5 rounded-xl glass-panel text-[10px] font-mono text-slate-500 space-y-1.5">
              <div className="flex justify-between">
                <span>TOTAL_JOURNALS</span>
                <span className="text-slate-300 font-bold">{journals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>ACTIVE_TURNS</span>
                <span className="text-slate-300 font-bold">{currentMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span>VIEWPORT_TRACK</span>
                <span className={isAtBottom ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {isAtBottom ? 'AT_BOTTOM' : 'SCROLLED_UP'}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Composer & Input Area */}
        <footer className="p-4 sm:p-6 bg-[#0F0F10]/95 border-t border-white/10 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Active Lens & Prism Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                {/* Memory Lens pill */}
                <button
                  type="button"
                  onClick={() => setIsMemoryLensOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-[11px] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase text-slate-400">SCOPE:</span>
                  <span className="text-white font-bold capitalize">
                    {memoryScope === 'none' ? 'No added memory' : memoryScope.replace('_', ' ')}
                  </span>
                </button>

                {/* Cognitive Prism Mode Selector */}
                <PrismModeSelector
                  currentMode={prismMode}
                  onSelectMode={handleSelectPrismMode}
                />
              </div>

              <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono hidden sm:flex">
                <span>{inputText.length} / 4000 CHARS</span>
                <span>&bull;</span>
                <span>[ENTER] SEND &bull; [SHIFT+ENTER] NEWLINE</span>
              </div>
            </div>

            {/* Error Alert */}
            {chatError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p className="font-bold uppercase">Transmission error</p>
                  <p className="mt-0.5 text-rose-300">{chatError}</p>
                </div>
                <button
                  onClick={() => setChatError(null)}
                  className="text-rose-400 hover:text-rose-200 text-xs underline ml-2 uppercase font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Input Composer Form */}
            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
              <div className="flex-1 rounded-xl border border-white/10 focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-500/20 bg-black/50 overflow-hidden transition-all shadow-inner">
                <textarea
                  ref={textareaRef}
                  id="chat-message-input"
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isEphemeralMode
                      ? 'Reflect in ephemeral mode (unsaved memory)...'
                      : `Write your reflection for "${activeJournal?.title || 'Journal'}"...`
                  }
                  maxLength={4000}
                  className={`w-full px-4 py-3 ${fontClass} text-white placeholder-slate-500 font-sans outline-hidden resize-none bg-transparent`}
                  disabled={isSending}
                />
              </div>

              {/* Voice Dictation Button */}
              <VoiceDictationButton
                onTranscript={handleVoiceTranscript}
                disabled={isSending}
              />

              <button
                id="chat-submit-button"
                type="submit"
                disabled={!inputText.trim() || isSending}
                aria-label="Send message"
                className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </footer>
      </div>

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isAutoScrollEnabled={isAutoScrollEnabled}
        onToggleAutoScroll={handleToggleAutoScroll}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        currentSoundscape={currentSoundscape}
        onChangeSoundscape={handleChangeSoundscape}
        soundscapeVolume={soundscapeVolume}
        onChangeVolume={handleChangeSoundscapeVolume}
      />

      <MemoryReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      <MemoryLensModal
        isOpen={isMemoryLensOpen}
        onClose={() => setIsMemoryLensOpen(false)}
        currentScope={memoryScope}
        currentSelectedIds={selectedJournalIds}
        journals={journals}
        activeJournalId={activeJournalId}
        isEphemeralMode={isEphemeralMode}
        onSave={(scope, ids) => {
          setMemoryScope(scope);
          setSelectedJournalIds(ids);
        }}
      />

      <DeleteExportModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        journal={activeJournal}
        onExport={handleExportJournal}
        onDelete={handleDeleteJournal}
        isProcessing={isProcessingAction}
      />

      <NewJournalModal
        isOpen={isNewJournalOpen}
        onClose={() => setIsNewJournalOpen(false)}
        onCreate={handleCreateJournal}
        isCreating={isProcessingAction}
      />
    </div>
  );
}
