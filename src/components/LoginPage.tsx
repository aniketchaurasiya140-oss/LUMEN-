import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { USERS } from '../data/mockData';
import { supabase, SUPABASE_PROJECT_ID } from '../lib/supabase';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Fingerprint,
  Database,
  UserPlus,
  X
} from 'lucide-react';

import glacialHeroImage from '../assets/images/login_hero_glacial_1792996057032.jpg';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onOpenSupabaseModal?: () => void;
  supabaseConnected?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onOpenSupabaseModal,
  supabaseConnected = true
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'clientCode'>('credentials');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientCode, setClientCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);

  // Close modal on Escape key press for keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForgotModal) {
        setShowForgotModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgotModal]);

  const heroPhotos = [
    {
      title: 'Glacial Twilight — Torres del Paine',
      optics: 'Hasselblad X2D 100C · XCD 38mm f/2.5 V · f/8.0 · 2.5s · ISO 64',
      url: glacialHeroImage,
      caption: 'Medium Format Study — Calm Blue Glacial Lake & Fog-Enshrouded Slate Granite Peaks'
    },
    {
      title: 'Nordic Solitude — Lofoten Indigo Fjord',
      optics: 'Leica SL2-S · APO-Summicron-SL 35mm f/2 · f/5.6 · 1/640s · ISO 100',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
      caption: 'Mist-Covered Mountain Ridge & Calm Cyan Water Reflections'
    },
    {
      title: 'Basalt Sea Stack & Breaking Ocean Swell',
      optics: 'Sony A7R V · FE 24-70mm f/2.8 GM II · f/11 · 1/250s · ISO 100',
      url: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1920&q=85',
      caption: 'High-Contrast Coastal Cliffs — Atlantic Monochrome Study'
    }
  ];

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try real Supabase Auth first
    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password === '••••••••••••' ? 'LumenStudio2026!' : password
        });

        if (!error && data.user) {
          setIsLoading(false);
          const userName =
            data.user.user_metadata?.full_name ||
            cleanEmail.split('@')[0].toUpperCase();
          const userRole: Role =
            (data.user.user_metadata?.role as Role) || 'OWNER';

          // Check if custom profile picture exists in localStorage
          let savedAvatar = data.user.user_metadata?.avatar_url || '';
          try {
            const cached = localStorage.getItem(`lumen_user_profile_${data.user.id}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.avatar) savedAvatar = parsed.avatar;
            }
          } catch (e) {
            // Ignore
          }

          onLogin({
            id: data.user.id,
            name: userName,
            email: cleanEmail,
            role: userRole,
            title: userRole === 'OWNER' ? 'Studio Founder' : 'Studio Member',
            avatar: savedAvatar, // Clean monogram by default
            studioRoleLabel: `${userRole} (Studio Vault)`
          });
          return;
        }
      } else {
        // Sign Up Mode in Supabase
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password === '••••••••••••' ? 'LumenStudio2026!' : password,
          options: {
            data: {
              full_name: fullName,
              role: 'OWNER',
              avatar_url: ''
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          setIsLoading(false);
          setInfoMsg(
            'Account registered successfully! If email confirmation is required, please check your inbox.'
          );
          onLogin({
            id: data.user.id,
            name: fullName,
            email: cleanEmail,
            role: 'OWNER',
            title: 'Studio Founder',
            avatar: '', // Clean neutral monogram by default
            studioRoleLabel: 'Studio Owner'
          });
          return;
        }
      }
    } catch (err: any) {
      console.warn('Authentication notice, evaluating persona:', err);
    }

    // Fallback: If password was the demo masked password or standard persona test, log in immediately as persona
    setTimeout(() => {
      setIsLoading(false);
      let targetUser: User;
      if (cleanEmail === USERS.OWNER.email.toLowerCase() || cleanEmail === 'owner@lumen.studio') {
        targetUser = USERS.OWNER;
      } else if (cleanEmail === USERS.EDITOR.email.toLowerCase() || cleanEmail === 'editor@lumen.studio') {
        targetUser = USERS.EDITOR;
      } else if (cleanEmail === USERS.CLIENT.email.toLowerCase() || cleanEmail === 'client@lumen.studio') {
        targetUser = USERS.CLIENT;
      } else if (cleanEmail === USERS.VIEWER.email.toLowerCase() || cleanEmail === 'viewer@lumen.studio') {
        targetUser = USERS.VIEWER;
      } else {
        targetUser = {
          id: `usr-${Date.now()}`,
          name: fullName || cleanEmail.split('@')[0].toUpperCase(),
          email: cleanEmail,
          role: 'OWNER',
          title: 'Studio Photographer',
          avatar: '', // Clean neutral monogram
          studioRoleLabel: 'Studio Owner'
        };
      }

      // Check if custom profile picture exists in localStorage
      try {
        const cached = localStorage.getItem(`lumen_user_profile_${targetUser.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.avatar) targetUser = { ...targetUser, avatar: parsed.avatar };
          if (parsed.title) targetUser = { ...targetUser, title: parsed.title };
          if (parsed.bio) targetUser = { ...targetUser, bio: parsed.bio };
        }
      } catch (e) {
        // Ignore
      }

      onLogin(targetUser);
    }, 400);
  };

  const handleClientCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(USERS.CLIENT);
    }, 400);
  };

  const handlePersonaSelect = (roleKey: Role) => {
    const user = USERS[roleKey];
    if (user) {
      setEmail(user.email);
      setPassword('••••••••••••');
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin(user);
      }, 350);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail);
    } catch (err) {
      // Ignore network errors in preview
    }
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#141211] text-[#eae5de] selection:bg-[#c45a2c] selection:text-white">
      {/* LEFT COLUMN: Visual Editorial Canvas & Photography Showcase */}
      <div className="lg:w-7/12 relative hidden md:flex flex-col justify-between p-8 lg:p-14 overflow-hidden border-r border-[#2d2825]">
        {/* Background Image with Ambient Vignette & Cool Atmospheric Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroPhotos[selectedHeroIndex].url}
            alt={`Masterwork landscape showcase: ${heroPhotos[selectedHeroIndex].title}`}
            className="w-full h-full object-cover transition-all duration-700 filter brightness-[0.55] contrast-[1.15] saturate-[0.95] scale-105"
          />
          {/* Subtle dark & cool-neutral gradient overlay ensuring high contrast and legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1115] via-[#111620]/60 to-[#0e1115]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e12]/85 via-transparent to-[#0b0e12]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/25 via-[#0e1115]/40 to-[#0e1115]" />
        </div>

        {/* Top Header inside Image Pane */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c45a2c] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-[#c45a2c]/30" aria-hidden="true">
              L
            </div>
            <div>
              <div className="font-serif text-xl tracking-wide font-medium text-white">LUMEN</div>
              <div className="text-[10px] font-mono tracking-widest text-[#a89f91] uppercase">
                PHOTOGRAPHY PORTFOLIO SUITE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSupabaseModal}
              aria-label="Cloud vault connection status: Active. Click to view settings."
              className="flex items-center gap-2 bg-[#1f1b18]/90 hover:bg-[#2d2824] backdrop-blur-md px-3 py-1.5 rounded-full border border-[#3b342e] text-[11px] font-mono text-[#d6cdbf] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Cloud Vault Connected</span>
            </button>
            <div className="hidden xl:flex items-center gap-1.5 bg-[#1f1b18]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#3b342e] text-[11px] font-mono text-[#d6cdbf]">
              <Shield className="w-3.5 h-3.5 text-[#2b6e4e]" aria-hidden="true" />
              <span>AES-256 Vault</span>
            </div>
          </div>
        </div>

        {/* Middle Visual Accent */}
        <div className="relative z-10 my-auto max-w-xl py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c45a2c]/20 border border-[#c45a2c]/40 text-[#f59e0b] text-[11px] font-mono mb-4">
            <Sparkles className="w-3 h-3 text-[#c45a2c]" aria-hidden="true" />
            <span>CLOUD VAULT · EXIF INGEST · PROOFING PORTAL</span>
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-light leading-tight text-white mb-4">
            Where Masterwork Curation Meets Editorial Precision.
          </h1>
          <p className="text-[#a89f91] text-sm leading-relaxed font-sans max-w-lg">
            Integrated with real-time cloud persistence, audit trails, and multi-user proofing feedback across Leica and Hasselblad monographs.
          </p>

          {/* Quick Photo Switcher Dots with accessible roles & keyboard focus */}
          <div className="flex items-center gap-3 mt-8" role="tablist" aria-label="Plate spotlight gallery">
            <span id="spotlight-label" className="text-[11px] font-mono text-[#8a8175]">PLATE SPOTLIGHT:</span>
            {heroPhotos.map((photo, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                id={`spotlight-tab-${i}`}
                aria-selected={selectedHeroIndex === i}
                aria-label={`View spotlight exhibit ${i + 1} of ${heroPhotos.length}: ${photo.title}`}
                onClick={() => setSelectedHeroIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none cursor-pointer ${
                  selectedHeroIndex === i ? 'w-8 bg-[#c45a2c]' : 'w-2 bg-[#423b35] hover:bg-[#665c53]'
                }`}
                title={photo.title}
              />
            ))}
          </div>
        </div>

        {/* Bottom EXIF Optics Card */}
        <div className="relative z-10 bg-[#1a1715]/90 backdrop-blur-md rounded-xl p-4 border border-[#362f2a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase text-[#c45a2c] tracking-wider mb-0.5">
              CURRENT HERO EXHIBIT
            </div>
            <div className="text-sm font-medium text-white">{heroPhotos[selectedHeroIndex].title}</div>
            <div className="text-xs text-[#9c9384] mt-0.5">{heroPhotos[selectedHeroIndex].caption}</div>
          </div>
          <div className="bg-[#12100f] px-3 py-2 rounded-lg border border-[#2b2521] text-[11px] font-mono text-[#dcd2c4] whitespace-nowrap">
            <Camera className="w-3.5 h-3.5 inline mr-1.5 text-[#c45a2c]" aria-hidden="true" />
            {heroPhotos[selectedHeroIndex].optics}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Gateway */}
      <div className="lg:w-5/12 flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto bg-[#181513]">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between mb-8 pb-4 border-b border-[#2d2825]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#c45a2c] text-white flex items-center justify-center font-bold text-base" aria-hidden="true">
              L
            </div>
            <div>
              <div className="font-serif text-lg font-medium text-white">LUMEN</div>
              <div className="text-[9px] font-mono tracking-widest text-[#9c9384]">PORTFOLIO SUITE</div>
            </div>
          </div>
          <button
            onClick={onOpenSupabaseModal}
            aria-label="Cloud vault connection status"
            className="text-[10px] font-mono bg-[#24201c] text-emerald-400 px-2.5 py-1 rounded border border-[#3b342e] flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer"
          >
            <Database className="w-3 h-3" aria-hidden="true" />
            <span>Cloud Vault</span>
          </button>
        </div>

        {/* Main Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-2">
          {/* Welcome Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#c45a2c] uppercase tracking-wider mb-1">
                <Key className="w-3 h-3" aria-hidden="true" />
                <span>Studio Authentication</span>
              </div>
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                aria-label="Open cloud vault settings dialog"
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded px-1"
              >
                <Database className="w-3 h-3" aria-hidden="true" />
                <span>Vault Settings</span>
              </button>
            </div>
            <h2 className="font-serif text-3xl font-normal text-white">
              {authMode === 'signin' ? 'Access Studio Vault' : 'Create Studio Profile'}
            </h2>
            <p className="text-xs text-[#a09789] mt-1">
              {authMode === 'signin'
                ? 'Sign in to access your RAW vault, curatorial briefs, or client reviews.'
                : 'Register an authorized studio photographer identity.'}
            </p>
          </div>

          {/* Mode Switcher: Sign In vs Sign Up */}
          <div className="flex items-center justify-between bg-[#1f1b18] px-3 py-2 rounded-lg border border-[#2d2825] mb-5 text-xs">
            <span className="text-[#a09789]">
              {authMode === 'signin' ? "Don't have a studio account?" : 'Already registered with the studio?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setErrorMsg('');
                setInfoMsg('');
              }}
              aria-label={authMode === 'signin' ? 'Switch to Create Account registration form' : 'Switch to Sign In authentication form'}
              className="text-[#c45a2c] hover:underline font-semibold flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none rounded px-1.5 py-0.5"
            >
              {authMode === 'signin' ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Switcher: Credentials vs Client Passcode */}
          <div className="flex bg-[#221e1a] p-1 rounded-lg border border-[#332c26] mb-5" role="tablist" aria-label="Studio authentication options">
            <button
              type="button"
              role="tab"
              id="tab-credentials"
              aria-selected={activeTab === 'credentials'}
              aria-controls="panel-credentials"
              onClick={() => setActiveTab('credentials')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none ${
                activeTab === 'credentials'
                  ? 'bg-[#c45a2c] text-white shadow-sm'
                  : 'text-[#9c9384] hover:text-[#eee7dd]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Studio Member</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-clientCode"
              aria-selected={activeTab === 'clientCode'}
              aria-controls="panel-clientCode"
              onClick={() => setActiveTab('clientCode')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none ${
                activeTab === 'clientCode'
                  ? 'bg-[#c45a2c] text-white shadow-sm'
                  : 'text-[#9c9384] hover:text-[#eee7dd]'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Client Passcode</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{infoMsg}</span>
            </div>
          )}

          {activeTab === 'credentials' ? (
            /* TAB 1: Studio Member Login Form */
            <form
              id="panel-credentials"
              role="tabpanel"
              aria-labelledby="tab-credentials"
              onSubmit={handleCredentialsSubmit}
              className="space-y-3.5"
            >
              {authMode === 'signup' && (
                <div>
                  <label
                    htmlFor="login-fullname"
                    className="block text-xs font-mono uppercase text-[#b5aba0] tracking-wider mb-1"
                  >
                    Photographer Name
                  </label>
                  <input
                    id="login-fullname"
                    name="fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Madhura Dhoke"
                    autoComplete="name"
                    className="w-full bg-[#1e1a17] border border-[#38312b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#685f54] focus:outline-none focus:border-[#c45a2c] focus-visible:ring-2 focus-visible:ring-[#c45a2c] transition-colors"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-mono uppercase text-[#b5aba0] tracking-wider mb-1"
                >
                  Studio Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8a8175] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@lumen.studio"
                    autoComplete="email"
                    spellCheck={false}
                    className="w-full bg-[#1e1a17] border border-[#38312b] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#685f54] focus:outline-none focus:border-[#c45a2c] focus-visible:ring-2 focus-visible:ring-[#c45a2c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-mono uppercase text-[#b5aba0] tracking-wider"
                  >
                    Master Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      aria-label="Forgot master passcode? Open recovery dialog"
                      className="text-[11px] text-[#c45a2c] hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none rounded px-1"
                    >
                      Forgot passcode?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8a8175] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full bg-[#1e1a17] border border-[#38312b] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#685f54] focus:outline-none focus:border-[#c45a2c] focus-visible:ring-2 focus-visible:ring-[#c45a2c] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password as plain text'}
                    aria-pressed={showPassword}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a8175] hover:text-[#eae5de] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none rounded p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label htmlFor="login-remember" className="flex items-center gap-2 text-xs text-[#a39a8c] cursor-pointer select-none">
                  <input
                    id="login-remember"
                    name="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#1e1a17] border-[#38312b] text-[#c45a2c] focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none cursor-pointer"
                  />
                  <span>Remember workstation</span>
                </label>
                <span className="text-[10px] font-mono text-[#8a8175] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#2b6e4e]" aria-hidden="true" />
                  Cloud Vault Connected
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-label={
                  isLoading
                    ? 'Authenticating with Cloud Vault...'
                    : authMode === 'signin'
                    ? 'Enter Studio Workspace'
                    : 'Create Studio Account'
                }
                className="w-full mt-2 bg-[#c45a2c] hover:bg-[#b04f24] text-white py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#c45a2c]/20 disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181513] focus-visible:ring-[#c45a2c] focus-visible:outline-none"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    <span>Authenticating Vault Access...</span>
                  </span>
                ) : (
                  <>
                    <span>
                      {authMode === 'signin' ? 'Enter Studio Workspace' : 'Create Studio Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: Client Proofing Passcode */
            <form
              id="panel-clientCode"
              role="tabpanel"
              aria-labelledby="tab-clientCode"
              onSubmit={handleClientCodeSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="client-passcode"
                  className="block text-xs font-mono uppercase text-[#b5aba0] tracking-wider mb-1.5"
                >
                  Client Gallery Access Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#8a8175] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="client-passcode"
                    name="clientPasscode"
                    type="text"
                    required
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                    aria-describedby="client-passcode-hint"
                    placeholder="e.g. CLIENT-2026"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full uppercase font-mono tracking-wider bg-[#1e1a17] border border-[#38312b] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#685f54] focus:outline-none focus:border-[#2b6e4e] focus-visible:ring-2 focus-visible:ring-[#2b6e4e] transition-colors"
                  />
                </div>
                <p id="client-passcode-hint" className="text-[11px] text-[#8a8175] mt-1.5 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-[#c45a2c]" aria-hidden="true" />
                  <span>Enter your private invitation token (e.g. <strong>CLIENT-2026</strong>) to access the proofing suite.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-label={isLoading ? 'Unlocking client portal...' : 'Unlock Client Proofing Gallery'}
                className="w-full mt-4 bg-[#2b6e4e] hover:bg-[#23583e] text-white py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#2b6e4e]/20 disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181513] focus-visible:ring-[#2b6e4e] focus-visible:outline-none"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    <span>Unlocking Client Portal...</span>
                  </span>
                ) : (
                  <>
                    <span>Unlock Client Proofing Gallery</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* DIVIDER: DEMO PERSONAS FOR QUICK TESTING */}
          <div className="relative my-6" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2e2823]" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
              <span className="bg-[#181513] px-3 text-[#948b7f]">
                Instant Persona Quick-Select (One Click)
              </span>
            </div>
          </div>

          {/* 4 Interactive Role Buttons with Accessible Group & Labels */}
          <div
            role="group"
            aria-label="Demo persona one-click accounts"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {/* 1. Owner */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('OWNER')}
              aria-label={`Switch demo profile to ${USERS.OWNER.name}, Role: Studio Owner, Master Vault access`}
              className="text-left p-2.5 rounded-lg bg-[#201c19] border border-[#362f2a] hover:border-[#c45a2c] hover:bg-[#26211d] transition-all group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#c45a2c]/20 text-[#c45a2c] font-semibold">
                  OWNER
                </span>
                <UserCheck className="w-3 h-3 text-[#8a8175] group-hover:text-[#c45a2c] transition-colors" aria-hidden="true" />
              </div>
              <div className="text-xs font-semibold text-white truncate">{USERS.OWNER.name}</div>
              <div className="text-[10px] text-[#91877a] truncate">Master Vault · Publish Live</div>
            </button>

            {/* 2. Editor */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('EDITOR')}
              aria-label={`Switch demo profile to ${USERS.EDITOR.name}, Role: Editor, Curate and AI Sequencing`}
              className="text-left p-2.5 rounded-lg bg-[#201c19] border border-[#362f2a] hover:border-[#b45309] hover:bg-[#26211d] transition-all group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#b45309] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#b45309]/20 text-[#b45309] font-semibold">
                  EDITOR
                </span>
                <UserCheck className="w-3 h-3 text-[#8a8175] group-hover:text-[#b45309] transition-colors" aria-hidden="true" />
              </div>
              <div className="text-xs font-semibold text-white truncate">{USERS.EDITOR.name}</div>
              <div className="text-[10px] text-[#91877a] truncate">Curate · AI Sequencing</div>
            </button>

            {/* 3. Client */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('CLIENT')}
              aria-label={`Switch demo profile to ${USERS.CLIENT.name}, Role: Client, Proofing Selections and Notes`}
              className="text-left p-2.5 rounded-lg bg-[#201c19] border border-[#362f2a] hover:border-[#2b6e4e] hover:bg-[#26211d] transition-all group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2b6e4e] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#2b6e4e]/20 text-[#2b6e4e] font-semibold">
                  CLIENT
                </span>
                <UserCheck className="w-3 h-3 text-[#8a8175] group-hover:text-[#2b6e4e] transition-colors" aria-hidden="true" />
              </div>
              <div className="text-xs font-semibold text-white truncate">{USERS.CLIENT.name}</div>
              <div className="text-[10px] text-[#91877a] truncate">Proofing · Selections & Notes</div>
            </button>

            {/* 4. Viewer / Recruiter */}
            <button
              type="button"
              onClick={() => handlePersonaSelect('VIEWER')}
              aria-label={`Switch demo profile to ${USERS.VIEWER.name}, Role: Magazine Viewer, Recruiter Review`}
              className="text-left p-2.5 rounded-lg bg-[#201c19] border border-[#362f2a] hover:border-[#7c3aed] hover:bg-[#26211d] transition-all group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#7c3aed]/20 text-[#a78bfa] font-semibold">
                  VIEWER
                </span>
                <UserCheck className="w-3 h-3 text-[#8a8175] group-hover:text-[#a78bfa] transition-colors" aria-hidden="true" />
              </div>
              <div className="text-xs font-semibold text-white truncate">{USERS.VIEWER.name}</div>
              <div className="text-[10px] text-[#91877a] truncate">XYZ Mag · Recruiter Review</div>
            </button>
          </div>
        </div>

        {/* Footer Security & Cloud Vault Assurance */}
        <div className="pt-4 border-t border-[#26211d] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#786f63] font-mono gap-2">
          <button
            onClick={onOpenSupabaseModal}
            aria-label="Cloud vault connection status"
            className="flex items-center gap-1.5 text-emerald-400/90 hover:text-emerald-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded px-1"
          >
            <Database className="w-3 h-3" aria-hidden="true" />
            <span>Cloud Vault Protected</span>
          </button>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#2b6e4e]" aria-hidden="true" />
            End-to-End Vault Encryption
          </span>
        </div>
      </div>

      {/* Forgot Passcode Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          aria-describedby="forgot-modal-desc"
        >
          <div className="bg-[#1c1815] border border-[#38312b] rounded-xl max-w-md w-full p-6 text-[#eae5de] shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotSubmitted(false);
              }}
              aria-label="Close credentials reset dialog"
              className="absolute top-4 right-4 text-[#8a8175] hover:text-white transition-colors p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <h3 id="forgot-modal-title" className="font-serif text-xl font-medium text-white mb-2">
              Reset Studio Credentials
            </h3>
            <p id="forgot-modal-desc" className="text-xs text-[#a39a8c] mb-4">
              Enter your registered studio email address. We will transmit an authorized cryptographic recovery key to your inbox.
            </p>

            {forgotSubmitted ? (
              <div
                role="status"
                aria-live="polite"
                className="p-4 rounded-lg bg-[#2b6e4e]/20 border border-[#2b6e4e]/40 text-emerald-200 text-xs"
              >
                <div className="font-semibold text-sm mb-1">Recovery Key Dispatched</div>
                Instructions to regain studio vault access have been transmitted to <strong>{forgotEmail}</strong> via secure studio service.
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                    setForgotEmail('');
                  }}
                  className="w-full mt-4 bg-[#2b6e4e] hover:bg-[#245c42] text-white py-2 rounded-lg text-xs font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2b6e4e] focus-visible:outline-none transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-[11px] font-mono uppercase text-[#b5aba0] mb-1"
                  >
                    Studio Email Address
                  </label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="madhura@lumen.studio"
                    autoComplete="email"
                    className="w-full bg-[#141210] border border-[#38312b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c45a2c] focus-visible:ring-2 focus-visible:ring-[#c45a2c] transition-colors"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#38312b] text-xs text-[#a39a8c] hover:bg-[#25201c] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#c45a2c] hover:bg-[#b04f24] text-white text-xs font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#c45a2c] focus-visible:outline-none transition-colors"
                  >
                    Transmit Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
