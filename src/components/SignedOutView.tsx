import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Lock,
  Eye,
  ArrowRight,
  BookOpen,
  Clock,
  ShieldCheck,
  Headphones,
  Compass,
  ArrowDown,
  Mic,
  Search,
  CheckCircle2,
  Volume2,
  Sliders,
  HelpCircle,
  Zap,
  Heart,
  Atom,
  ChevronRight,
  Download,
  Terminal,
} from 'lucide-react';
import { LighthouseAtmosphere } from './LighthouseAtmosphere';
import { LighthouseLogo } from './LighthouseLogo';
import { SoundscapeType, soundscapeEngine } from '../utils/audioSoundscape';

interface SignedOutViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
}

type PreviewTab = 'lens' | 'prisms' | 'soundscapes' | 'navigation' | 'ephemeral';

export const SignedOutView: React.FC<SignedOutViewProps> = ({ onSignIn, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('lens');
  const [activePrismPreview, setActivePrismPreview] = useState<'socratic' | 'stoic' | 'strategist' | 'compassion' | 'first_principles'>('socratic');
  const [demoSoundscape, setDemoSoundscape] = useState<SoundscapeType>('none');

  const handleTestSoundscape = (type: SoundscapeType) => {
    if (demoSoundscape === type) {
      soundscapeEngine.stop();
      setDemoSoundscape('none');
    } else {
      soundscapeEngine.play(type);
      setDemoSoundscape(type);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col justify-between selection:bg-amber-500/30 selection:text-white font-sans relative overflow-hidden bg-cyber-grid">
      {/* Cinematic Animated Lighthouse Sweeping Across the Horizon */}
      <LighthouseAtmosphere />

      {/* Ambient background illumination */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-3xl pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-[#0F0F10]/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LighthouseLogo size="sm" />
          <div>
            <h1 className="text-base font-bold tracking-tighter text-white uppercase font-mono flex items-center gap-2">
              LIGHTHOUSE
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">v2.5</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              PRIVATE VAULT &bull; GEMINI JOURNAL
            </p>
          </div>
        </div>

        <button
          id="nav-signin-button"
          onClick={onSignIn}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <>
              <span>Sign in with Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </header>

      {/* Main Hero & Presentation */}
      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16 text-center flex-1 flex flex-col justify-center items-center relative z-10">
        {/* Top Badges */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-tight mb-8 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse-subtle">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CONSENT-AWARE AI REFLECTION &bull; COGNITIVE PRISMS &bull; PROCEDURAL SOUNDSCAPES</span>
        </div>

        {/* Hero Title */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans tracking-tight text-white font-black leading-[1.1] mb-6 max-w-4xl">
          A calm, private sanctuary for your thoughts and ideas.
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 font-sans font-light leading-relaxed max-w-3xl mb-8">
          Reflect calmly with Gemini in a verified, security-hardened vault. Choose cognitive inquiry frameworks, listen to offline procedural soundscapes, inspect cryptographically verifiable <strong className="font-semibold text-white">Memory Receipts</strong>, and enjoy seamless <strong className="font-semibold text-white">Auto-Scroll & Jump</strong> navigation.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono max-w-md text-left shadow-lg">
            <p className="font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Authentication Notice
            </p>
            <p className="text-rose-400 mt-1">{error}</p>
          </div>
        )}

        {/* Sign-in Call to Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-14">
          <button
            id="hero-signin-button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Interactive Feature Workbench Preview */}
        <div className="w-full max-w-4xl p-6 rounded-2xl glass-panel text-left space-y-5 mb-14 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/70 inline-block" />
              <span className="text-slate-400 ml-2 font-bold uppercase tracking-wider">
                FEATURE WORKBENCH &bull; LIVE PREVIEW
              </span>
            </div>

            {/* Interactive Tab Selectors */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'lens', label: 'Memory Lens & Receipts' },
                { id: 'prisms', label: 'Cognitive Prisms' },
                { id: 'soundscapes', label: 'Focus Soundscapes' },
                { id: 'navigation', label: 'Auto-Scroll & Jump' },
                { id: 'ephemeral', label: 'Ephemeral Mode' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as PreviewTab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'text-slate-400 hover:text-white bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: Memory Lens & Receipts */}
          {activeTab === 'lens' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  VERIFIED MEMORY RECEIPT
                </span>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  AUTHENTICATED_PROVENANCE
                </span>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5 text-slate-300 font-sans">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-white/5 pb-1.5">
                  <span>Scope: <strong className="text-amber-400">Selected Journals (2 active)</strong></span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Exact Excerpts Verified
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 italic font-serif">
                  &ldquo;Reflecting on the balance between high-leverage focus and emotional sovereignty during deep project architectural milestones...&rdquo;
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  You inspect every single past excerpt that Gemini was allowed to review during that turn.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Cognitive Reflection Prisms */}
          {activeTab === 'prisms' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  5 COGNITIVE INQUIRY FRAMEWORKS
                </span>
                <span className="text-[10px] text-slate-500">CLICK TO PREVIEW DIRECTIVE</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'socratic', label: 'Socratic', icon: <HelpCircle className="w-3.5 h-3.5" />, desc: 'Deconstruct hidden assumptions' },
                  { id: 'stoic', label: 'Stoic', icon: <Compass className="w-3.5 h-3.5" />, desc: 'Focus on what is within control' },
                  { id: 'strategist', label: 'Strategist', icon: <Zap className="w-3.5 h-3.5" />, desc: '80/20 leverage & decision matrices' },
                  { id: 'compassion', label: 'Compassion', icon: <Heart className="w-3.5 h-3.5" />, desc: 'Gentle emotional breath & validation' },
                  { id: 'first_principles', label: 'Principles', icon: <Atom className="w-3.5 h-3.5" />, desc: 'Foundational irreducible axioms' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePrismPreview(p.id as any)}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      activePrismPreview === p.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      {p.icon}
                      <span className="text-[11px] truncate">{p.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-slate-300 font-sans space-y-1">
                <p className="text-xs font-mono font-bold text-amber-400 uppercase">
                  Active Framework: {activePrismPreview}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePrismPreview === 'socratic' && 'Guides Gemini to ask clarifying questions that deconstruct unconscious assumptions and reveal underlying truths.'}
                  {activePrismPreview === 'stoic' && 'Anchors your reflection in the dichotomy of control, emotional sovereignty, and enduring equanimity.'}
                  {activePrismPreview === 'strategist' && 'Focuses on the vital few 80/20 leverage points, identifying bottlenecks and strategic decision paths.'}
                  {activePrismPreview === 'compassion' && 'Provides warm validation, holding space for self-kindness and mindful emotional decompression.'}
                  {activePrismPreview === 'first_principles' && 'Deconstructs complex challenges to fundamental axioms and reasons upward from first principles.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Focus Soundscapes */}
          {activeTab === 'soundscapes' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" />
                  PROCEDURAL AMBIENT SOUNDSCAPES (WEB AUDIO API)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">100% OFFLINE SYNTHESIS</span>
              </div>

              <p className="text-xs text-slate-400 font-sans">
                Zero external audio files or streaming requests. Synthesized mathematically directly in your browser:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ocean', label: '🌊 Ocean Tide', desc: 'Rolling sine wave swell' },
                  { id: 'rain', label: '🌧️ Gentle Rain', desc: 'Bandpass filtered noise' },
                  { id: 'brown_noise', label: '🌌 Brown Noise', desc: 'Deep lowpass focus tone' },
                  { id: 'beacon_432hz', label: '🔔 432Hz Beacon', desc: 'Calm harmonic resonance' },
                ].map((s) => {
                  const isPlaying = demoSoundscape === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleTestSoundscape(s.id as SoundscapeType)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{s.label}</span>
                        {isPlaying ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : null}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">{s.desc}</span>
                      <span className="text-[9px] uppercase font-bold text-amber-400/80 block mt-1.5">
                        {isPlaying ? 'Playing (Click to stop)' : 'Click to preview audio'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Auto-Scroll & Smart Navigation */}
          {activeTab === 'navigation' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                  SMART SCROLL & JUMP TO BOTTOM
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">USER-CONTROLLED</span>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 text-slate-300 font-sans">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 font-mono text-xs">
                  <span>Auto-Scroll Preference:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    User Configurable
                  </span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-full bg-[#161619] border border-amber-500/40 text-white shadow-[0_4px_20px_rgba(245,158,11,0.25)] text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-amber-300 font-bold">+2 new turns</span>
                    <span className="text-slate-400">&bull; Click to Jump to latest</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Never lose your reading position when reviewing past insights. When you scroll up, incoming turns smoothly queue with a sticky indicator rather than snapping your viewport.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Ephemeral Mode */}
          {activeTab === 'ephemeral' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-purple-400 font-bold uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  ZERO-DATA RETENTION EPHEMERAL TAB
                </span>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold">
                  TRANSIENT_MEMORY
                </span>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 text-slate-300 font-sans">
                <p className="text-xs leading-relaxed text-slate-300">
                  Need a scratchpad for a thought you don&apos;t want saved to your Firestore database? Switch to <strong className="text-purple-300 font-semibold">Ephemeral Mode</strong>. Turns live strictly in your current browser tab memory and disappear the moment you close the session.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bento Grid Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full mb-12">
          <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-amber-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide">
              Structural UID Isolation
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every journal is partitioned strictly under <code className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-amber-400 font-mono border border-white/10">users/&#123;verifiedUid&#125;</code>. Direct browser queries are denied by Firestore security rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel-amber space-y-3 hover:border-amber-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide">
              Memory Lens & Provenance
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Bound Gemini to your active journal, selected journals, or ephemeral scratchpad. Every response attaches a verifiable receipt of exact context excerpts provided.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-amber-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide">
              Full Export & Ownership
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your thoughts belong entirely to you. Export complete journal histories to formatted JSON files or permanently wipe journals with cascading deletions at any moment.
            </p>
          </div>
        </div>

        {/* Feature Capability Highlights */}
        <div className="w-full max-w-4xl p-5 rounded-xl bg-white/[0.03] border border-white/10 text-left mb-12">
          <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            COMPLETE VAULT CAPABILITY MATRIX
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Voice Dictation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Real-time Search</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Theme Tagging</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Auto Turn Summaries</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>5 Cognitive Prisms</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Web Audio Ambient</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Type Scale Control</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>JSON Backup Export</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 max-w-2xl text-[11px] text-slate-500 leading-relaxed text-center font-mono">
          <p>
            <strong className="font-bold text-slate-300 uppercase">Reflection & Brainstorming Aid:</strong> Lighthouse is designed for personal brainstorming and reflective self-inquiry. It is not a therapist, psychiatrist, or medical diagnostic tool. If you or someone you know is in distress, please connect with local emergency health services or a crisis helpline.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500 font-mono bg-[#0F0F10]/50 backdrop-blur-md">
        <p>LIGHTHOUSE &bull; PRIVATE PERSONAL GEMINI JOURNAL &bull; FIREBASE AUTH &bull; FIRESTORE &bull; GEMINI</p>
      </footer>
    </div>
  );
};
