import React, { useState } from 'react';
import { User, Photo, ScreenId, Role, PortfolioBrief } from '../types';
import { USERS, INITIAL_BRIEF } from '../data/mockData';
import { PhotoDetailDrawer } from './PhotoDetailDrawer';
import { UploadModal } from './UploadModal';
import { supabaseService, SupabaseHealthStatus } from '../services/supabaseService';
import { SUPABASE_PROJECT_ID } from '../lib/supabase';
import {
  LayoutDashboard,
  Images,
  BookOpen,
  Sparkles,
  Layers,
  HeartPulse,
  Send,
  Users,
  ShieldCheck,
  Upload,
  LogOut,
  ChevronRight,
  Search,
  Check,
  AlertTriangle,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Lock,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  UserCheck,
  Database,
  Cloud
} from 'lucide-react';

interface StudioWorkspaceProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (newUser: User) => void;
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  supabaseHealth: SupabaseHealthStatus | null;
  onOpenSupabaseModal: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  photos,
  setPhotos,
  supabaseHealth,
  onOpenSupabaseModal
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shootFilter, setShootFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [brief, setBrief] = useState<PortfolioBrief>(INITIAL_BRIEF);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Health audit interactive states
  const [duplicateResolved, setDuplicateResolved] = useState(false);
  const [pacingResolved, setPacingResolved] = useState(false);

  // Client note modal state
  const [noteTargetPhotoId, setNoteTargetPhotoId] = useState<string | null>(null);
  const [clientNoteInput, setClientNoteInput] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleToggleFavorite = async (id: string) => {
    let nextFav = false;
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextFav = !p.isFavorite;
          return { ...p, isFavorite: nextFav };
        }
        return p;
      })
    );
    triggerToast(nextFav ? `Marked as favorite` : `Removed from favorites`);

    // Sync to Supabase
    await supabaseService.updatePhoto(id, { isFavorite: nextFav });
  };

  const handleDeletePhoto = async (id: string) => {
    if (currentUser.role !== 'OWNER') {
      triggerToast('Permission Denied: Only Studio Owner can delete master RAWs.');
      return;
    }
    const target = photos.find((p) => p.id === id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedPhoto(null);
    triggerToast(`RAW master "${target?.title || id}" deleted from archive`);

    // Sync deletion to Supabase
    await supabaseService.deletePhoto(id);
  };

  const handleUploadPhoto = async (newPhoto: Photo) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    triggerToast(`RAW ingest successful: "${newPhoto.title}" added to archive`);

    // Sync to Supabase
    await supabaseService.upsertPhoto(newPhoto);
  };

  // Reordering in portfolio sequence editor
  const handleMovePlate = (index: number, direction: 'up' | 'down') => {
    const portfolioPhotos = photos.filter((p) => p.inActivePortfolio);
    if (direction === 'up' && index > 0) {
      const copy = [...photos];
      const current = portfolioPhotos[index];
      const prev = portfolioPhotos[index - 1];
      const idxA = copy.findIndex((p) => p.id === current.id);
      const idxB = copy.findIndex((p) => p.id === prev.id);
      copy[idxA] = prev;
      copy[idxB] = current;
      setPhotos(copy);
      triggerToast(`Plate "${current.title}" moved up`);
    } else if (direction === 'down' && index < portfolioPhotos.length - 1) {
      const copy = [...photos];
      const current = portfolioPhotos[index];
      const next = portfolioPhotos[index + 1];
      const idxA = copy.findIndex((p) => p.id === current.id);
      const idxB = copy.findIndex((p) => p.id === next.id);
      copy[idxA] = next;
      copy[idxB] = current;
      setPhotos(copy);
      triggerToast(`Plate "${current.title}" moved down`);
    }
  };

  const handleSetCoverHero = async (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCoverHero: p.id === id
      }))
    );
    const target = photos.find((p) => p.id === id);
    triggerToast(`Set "${target?.title}" as Cover Hero Plate`);

    // Update in Supabase
    await supabaseService.updatePhoto(id, { isCoverHero: true });
  };

  // Filtered and sorted photos for photo library
  const filteredPhotos = photos
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.camera.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lens.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesShoot = shootFilter === 'all' || p.shoot === shootFilter;
      return matchesSearch && matchesShoot;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      return 0;
    });

  const activePortfolioPlates = photos.filter((p) => p.inActivePortfolio);

  const handlePublishPortfolio = () => {
    if (currentUser.role !== 'OWNER') {
      triggerToast('Action Denied: Only Studio Owner can publish monographs live.');
      return;
    }
    setIsPublished(true);
    triggerToast('🎉 Portfolio Monograph published live to: https://lumen.studio/p/fashion-internship');
  };

  const handleClientStatusChange = async (id: string, status: 'selected' | 'rejected') => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, clientStatus: status } : p))
    );
    triggerToast(
      status === 'selected'
        ? 'Plate marked as Selected for Wedding Monograph'
        : 'Plate rejected'
    );

    // Sync to Supabase
    await supabaseService.updatePhoto(id, { clientStatus: status });
  };

  const handleSaveClientNote = async () => {
    if (!noteTargetPhotoId || !clientNoteInput.trim()) return;
    let updatedNotes: string[] = [];

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === noteTargetPhotoId) {
          updatedNotes = [clientNoteInput.trim(), ...(p.clientNotes || [])];
          return {
            ...p,
            clientNotes: updatedNotes
          };
        }
        return p;
      })
    );
    triggerToast(`Client feedback logged: "${clientNoteInput.trim()}"`);

    // Sync to Supabase
    await supabaseService.updatePhoto(noteTargetPhotoId, { clientNotes: updatedNotes });

    setNoteTargetPhotoId(null);
    setClientNoteInput('');
  };

  return (
    <div className="flex h-screen w-full bg-[#fbf9f5] text-[#242120] overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#242120] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-[#3b3634] animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#c45a2c] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside className="w-64 bg-[#fbf9f5] border-r border-[#e8e3dc] flex flex-col justify-between shrink-0 h-screen select-none">
        <div className="overflow-y-auto">
          {/* Brand Mark */}
          <div className="p-5 border-b border-[#e8e3dc] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#c45a2c] text-white flex items-center justify-center font-bold text-base shadow-sm">
                L
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm tracking-wide text-[#242120]">LUMEN</h2>
                <p className="text-[9px] font-mono tracking-widest text-[#8a8175] uppercase">
                  PORTFOLIO SUITE
                </p>
              </div>
            </div>
            <button
              onClick={onOpenSupabaseModal}
              title="Supabase Database Settings"
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Supabase</span>
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="p-4 pb-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-[#242120] hover:bg-[#3b3634] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Photographs</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 pt-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#8a8175]">
              Studio Workspace
            </div>

            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-white text-[#242120] border border-[#e8e3dc] shadow-xs font-semibold'
                  : 'text-[#6e6659] hover:bg-[#f3eee6] hover:text-[#242120]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#8a8175]" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('library')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentScreen === 'library'
                  ? 'bg-white text-[#242120] border border-[#e8e3dc] shadow-xs font-semibold'
                  : 'text-[#6e6659] hover:bg-[#f3eee6] hover:text-[#242120]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Images className="w-4 h-4 text-[#8a8175]" />
                <span>Photo Library</span>
              </div>
              <span className="text-[10px] font-mono bg-[#f5ede3] text-[#c45a2c] font-bold px-1.5 py-0.5 rounded">
                {photos.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentScreen('editor')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                ['brief', 'suggestions', 'editor', 'health', 'preview'].includes(currentScreen)
                  ? 'bg-white text-[#242120] border border-[#e8e3dc] shadow-xs font-semibold'
                  : 'text-[#6e6659] hover:bg-[#f3eee6] hover:text-[#242120]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#8a8175]" />
                <span>Active Portfolio</span>
              </div>
              <span className="text-[10px] font-mono bg-[#242120] text-white px-1.5 py-0.5 rounded font-bold">
                15 Plates
              </span>
            </button>

            {/* Sub-steps in portfolio curation */}
            <div className="ml-5 pl-3 border-l-2 border-[#e8e3dc] space-y-0.5 py-1">
              <button
                onClick={() => setCurrentScreen('brief')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${
                  currentScreen === 'brief'
                    ? 'font-semibold text-[#c45a2c] bg-[#f5ede3]'
                    : 'text-[#8a8175] hover:text-[#242120]'
                }`}
              >
                1. Define Brief
              </button>
              <button
                onClick={() => setCurrentScreen('suggestions')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${
                  currentScreen === 'suggestions'
                    ? 'font-semibold text-[#c45a2c] bg-[#f5ede3]'
                    : 'text-[#8a8175] hover:text-[#242120]'
                }`}
              >
                2. AI Suggestions
              </button>
              <button
                onClick={() => setCurrentScreen('editor')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${
                  currentScreen === 'editor'
                    ? 'font-semibold text-[#c45a2c] bg-[#f5ede3]'
                    : 'text-[#8a8175] hover:text-[#242120]'
                }`}
              >
                3. Sequence & Edit
              </button>
              <button
                onClick={() => setCurrentScreen('health')}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${
                  currentScreen === 'health'
                    ? 'font-semibold text-[#c45a2c] bg-[#f5ede3]'
                    : 'text-[#8a8175] hover:text-[#242120]'
                }`}
              >
                <span>4. Health Audit</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    duplicateResolved && pacingResolved ? 'bg-[#2b6e4e]' : 'bg-[#b45309]'
                  }`}
                />
              </button>
              <button
                onClick={() => setCurrentScreen('preview')}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer ${
                  currentScreen === 'preview'
                    ? 'font-semibold text-[#c45a2c] bg-[#f5ede3]'
                    : 'text-[#8a8175] hover:text-[#242120]'
                }`}
              >
                5. Final Preview
              </button>
            </div>

            <div className="px-3 pt-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#8a8175]">
              Client & Governance
            </div>

            <button
              onClick={() => setCurrentScreen('proofing')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentScreen === 'proofing'
                  ? 'bg-white text-[#242120] border border-[#e8e3dc] shadow-xs font-semibold'
                  : 'text-[#6e6659] hover:bg-[#f3eee6] hover:text-[#242120]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#8a8175]" />
                <span>Client Proofing</span>
              </div>
              <span className="text-[10px] font-mono bg-[#eaf4ef] text-[#2b6e4e] font-bold px-1.5 py-0.5 rounded">
                Sharma
              </span>
            </button>

            <button
              onClick={() => setCurrentScreen('collaborators')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentScreen === 'collaborators'
                  ? 'bg-white text-[#242120] border border-[#e8e3dc] shadow-xs font-semibold'
                  : 'text-[#6e6659] hover:bg-[#f3eee6] hover:text-[#242120]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8a8175]" />
                <span>Permissions Matrix</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Storage & Active Role Simulator */}
        <div className="p-4 border-t border-[#e8e3dc] bg-[#f7f3eb] space-y-3">
          {/* Storage Bar */}
          <div className="bg-white p-2.5 rounded-lg border border-[#e8e3dc] shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8a8175]">RAW Storage</span>
              <span className="font-semibold text-[#242120]">64.8 / 100 GB</span>
            </div>
            <div className="h-1.5 w-full bg-[#eee8de] rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-[#c45a2c] rounded-full" style={{ width: '64.8%' }} />
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#8a8175] mb-1">
              Active Role Simulation:
            </label>
            <select
              value={currentUser.role}
              onChange={(e) => {
                const targetUser = USERS[e.target.value as Role];
                if (targetUser) {
                  onSwitchUser(targetUser);
                  triggerToast(`Switched active persona to ${targetUser.name} (${targetUser.role})`);
                  if (targetUser.role === 'CLIENT') setCurrentScreen('proofing');
                }
              }}
              className="w-full bg-white border border-[#e8e3dc] rounded-md px-2 py-1.5 text-xs text-[#242120] font-medium focus:outline-none focus:border-[#c45a2c] cursor-pointer"
            >
              <option value="OWNER">Owner (Madhura Dhoke)</option>
              <option value="EDITOR">Editor (Rahul Sharma)</option>
              <option value="CLIENT">Client (Anita & Vikram)</option>
              <option value="VIEWER">Viewer (Sarah Lin)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN WORKSPACE ==================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#e8e3dc] bg-white px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-[#8a8175] uppercase flex items-center gap-1.5">
              <span>LUMEN</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#242120] font-semibold uppercase">{currentScreen}</span>
            </div>
            {isPublished && (
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Live Published
              </span>
            )}
            <button
              onClick={onOpenSupabaseModal}
              className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#f7f4ee] hover:bg-[#ede8df] border border-[#e5dfd5] text-[#554d42] transition-colors cursor-pointer"
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Supabase Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
          </div>

          {/* User Profile & Logout Controls */}
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs font-medium text-[#242120] hover:text-[#c45a2c] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e3dc] hover:bg-[#fbf9f5] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#c45a2c]" />
              <span>Ingest RAW</span>
            </button>

            {/* Current User Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-[#f5ede3]/60 transition-colors border border-transparent hover:border-[#e8e3dc] cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#c45a2c]/40"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-[#242120] leading-tight flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[9px] font-mono bg-[#c45a2c] text-white px-1.5 py-0.2 rounded font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8a8175] truncate max-w-[140px]">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8a8175]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-[#e8e3dc] py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-[#e8e3dc]">
                    <div className="font-semibold text-[#242120]">{currentUser.name}</div>
                    <div className="text-[11px] text-[#8a8175]">{currentUser.title}</div>
                    <div className="text-[10px] font-mono text-[#c45a2c] mt-1">
                      {currentUser.studioRoleLabel}
                    </div>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-mono uppercase text-[#8a8175]">
                    Switch Studio Persona
                  </div>
                  {(['OWNER', 'EDITOR', 'CLIENT', 'VIEWER'] as Role[]).map((r) => {
                    const u = USERS[r];
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          onSwitchUser(u);
                          setUserDropdownOpen(false);
                          triggerToast(`Switched persona to ${u.name}`);
                          if (r === 'CLIENT') setCurrentScreen('proofing');
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-[#fbf9f5] cursor-pointer ${
                          currentUser.role === r ? 'font-semibold text-[#c45a2c]' : 'text-[#242120]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} className="w-5 h-5 rounded-full object-cover" />
                          <span>{u.name}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1 rounded bg-gray-100 text-gray-700">
                          {r}
                        </span>
                      </button>
                    );
                  })}

                  <div className="border-t border-[#e8e3dc] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSupabaseModal();
                      }}
                      className="w-full px-4 py-2 text-left text-[#242120] hover:bg-[#fbf9f5] flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Supabase Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out to Login Page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Screens Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl w-full mx-auto">
          {/* ==================== 1. DASHBOARD SCREEN ==================== */}
          {currentScreen === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                      STUDIO ACTIVE · EDITION 2.4
                    </span>
                    <button
                      onClick={onOpenSupabaseModal}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>Supabase: {SUPABASE_PROJECT_ID}</span>
                    </button>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-normal mt-2 text-[#242120]">
                    Good morning, {currentUser.name.split(' ')[0]}
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Master photography library & editorial portfolio manager for Leica and Hasselblad monographs.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentScreen('brief')}
                    className="px-4 py-2 border border-[#e8e3dc] bg-white hover:bg-[#f5ede3] rounded-lg text-xs font-medium text-[#242120] transition-colors cursor-pointer"
                  >
                    New Portfolio Brief
                  </button>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 bg-[#242120] hover:bg-[#3b3634] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Upload RAWs
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">TOTAL ARCHIVE</div>
                  <div className="text-2xl font-semibold text-[#242120] mt-1">{photos.length}</div>
                  <div className="text-[11px] text-[#2b6e4e] font-medium mt-1">
                    Synchronized with Supabase
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">ACTIVE PORTFOLIOS</div>
                  <div className="text-2xl font-semibold text-[#242120] mt-1">3</div>
                  <div className="text-[11px] text-[#8a8175] mt-1">1 published · 2 in curation</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">CLIENT PROOFS</div>
                  <div className="text-2xl font-semibold text-[#242120] mt-1">
                    {photos.filter((p) => p.clientStatus === 'selected').length} / {photos.length}
                  </div>
                  <div className="text-[11px] text-[#b45309] font-medium mt-1">
                    Sharma wedding review active
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">HEALTH AUDIT</div>
                  <div className="text-2xl font-semibold text-[#2b6e4e] mt-1">
                    {duplicateResolved && pacingResolved ? '100%' : '96%'}
                  </div>
                  <div className="text-[11px] text-[#8a8175] mt-1">
                    {duplicateResolved && pacingResolved
                      ? 'All checks verified optimal'
                      : '2 minor advisories detected'}
                  </div>
                </div>
              </div>

              {/* Active Portfolio Highlight */}
              <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-xs flex flex-col md:flex-row items-center gap-6">
                <img
                  src={
                    photos[0]?.url ||
                    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
                  }
                  alt="Portfolio Cover"
                  className="w-full md:w-56 h-36 object-cover rounded-xl border border-[#e8e3dc] shrink-0"
                />
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                      ACTIVE BRIEF
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#242120] text-white font-bold">
                      RECRUITER REVIEW
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl font-medium text-[#242120]">
                    Fashion Photography Internship (Aarav Patel)
                  </h2>
                  <p className="text-xs text-[#6e6659] mt-1">
                    15 curated plates · Target audience: Senior Photo Editor & Recruiter (XYZ Magazine)
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setCurrentScreen('editor')}
                      className="px-3 py-1.5 bg-[#242120] hover:bg-[#3b3634] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Open in Sequence Editor
                    </button>
                    <button
                      onClick={() => setCurrentScreen('health')}
                      className="px-3 py-1.5 border border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Check Health ({duplicateResolved && pacingResolved ? '0' : '2'} Advisories)
                    </button>
                    <button
                      onClick={() => setCurrentScreen('preview')}
                      className="px-3 py-1.5 border border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Final Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Photos in Studio */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base text-[#242120]">Recent Library Highlights</h3>
                  <button
                    onClick={() => setCurrentScreen('library')}
                    className="text-xs font-medium text-[#c45a2c] hover:underline cursor-pointer"
                  >
                    View Full Library ({photos.length}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPhoto(p)}
                      className="bg-white rounded-xl border border-[#e8e3dc] overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="h-44 w-full bg-[#1a1715] overflow-hidden relative">
                        <img
                          src={p.url}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 text-[9px] font-mono bg-black/70 text-white px-1.5 py-0.5 rounded">
                          {p.camera}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-semibold text-[#242120] truncate">{p.title}</div>
                        <div className="text-[11px] font-mono text-[#8a8175] mt-0.5 truncate">
                          {p.lens} · {p.aperture}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. PHOTO LIBRARY SCREEN ==================== */}
          {currentScreen === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                    STUDIO MASTER ARCHIVE
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Master Photo Library
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Inspect high-resolution photographs, technical EXIF parameters, and quality signals.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-[#242120] hover:bg-[#3b3634] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer self-start md:self-auto"
                >
                  + Upload RAWs
                </button>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#8a8175] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, camera body, lens optics..."
                    className="w-full bg-white border border-[#e8e3dc] rounded-lg pl-9 pr-3 py-2 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={shootFilter}
                    onChange={(e) => setShootFilter(e.target.value)}
                    className="bg-white border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] cursor-pointer"
                  >
                    <option value="all">All Shoots & Albums</option>
                    <option value="fashion">Autumn Couture & Runway</option>
                    <option value="wedding">Sharma & Mehta Ceremony</option>
                    <option value="arch">Urban Geometries & Brutalism</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] cursor-pointer"
                  >
                    <option value="date">Newest RAW First</option>
                    <option value="score">Highest Quality Score</option>
                  </select>
                </div>
              </div>

              {/* Photo Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPhoto(p)}
                    className="bg-white rounded-xl border border-[#e8e3dc] overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="h-52 w-full bg-[#121110] relative overflow-hidden">
                      <img
                        src={p.url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="text-[9px] font-mono uppercase bg-[#c45a2c] text-white px-2 py-0.5 rounded font-bold">
                          {p.shoot}
                        </span>
                      </div>
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 text-[#2b6e4e] px-2 py-0.5 rounded font-bold">
                        {p.score}%
                      </span>
                    </div>

                    <div className="p-3.5">
                      <div className="text-xs font-semibold text-[#242120] truncate">{p.title}</div>
                      <div className="text-[11px] font-mono text-[#8a8175] mt-1">
                        {p.camera} · {p.aperture}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f1ede6] text-[10px] text-[#8a8175]">
                        <span>{p.dimensions}</span>
                        {p.isFavorite && <span className="text-[#c45a2c] font-bold">★ Favorite</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 3. DEFINE BRIEF SCREEN ==================== */}
          {currentScreen === 'brief' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e8e3dc] pb-6">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                  STEP 01 OF 05
                </span>
                <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                  Define Portfolio Brief
                </h1>
                <p className="text-xs text-[#6e6659] mt-1">
                  Set curatorial rules, target audience, aesthetic anchor, and candidate pool parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-2xs space-y-4">
                  <h3 className="font-serif text-base font-semibold text-[#242120]">
                    1. Submission Parameters
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Portfolio Title
                    </label>
                    <input
                      type="text"
                      value={brief.title}
                      onChange={(e) => setBrief({ ...brief, title: e.target.value })}
                      className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1.5">
                      Submission Purpose
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        onClick={() => setBrief({ ...brief, purpose: 'job' })}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          brief.purpose === 'job'
                            ? 'border-[#c45a2c] bg-[#f5ede3]/40 ring-1 ring-[#c45a2c]'
                            : 'border-[#e8e3dc] bg-white'
                        }`}
                      >
                        <div className="font-semibold text-[#242120]">Job / Internship</div>
                        <div className="text-[11px] text-[#6e6659] mt-1">
                          Editorial submission & magazine agency recruitment.
                        </div>
                      </label>

                      <label
                        onClick={() => setBrief({ ...brief, purpose: 'client' })}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          brief.purpose === 'client'
                            ? 'border-[#c45a2c] bg-[#f5ede3]/40 ring-1 ring-[#c45a2c]'
                            : 'border-[#e8e3dc] bg-white'
                        }`}
                      >
                        <div className="font-semibold text-[#242120]">Client Commission</div>
                        <div className="text-[11px] text-[#6e6659] mt-1">
                          Targeted commercial brand presentation.
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Target Audience
                    </label>
                    <select
                      value={brief.targetAudience}
                      onChange={(e) =>
                        setBrief({ ...brief, targetAudience: e.target.value as any })
                      }
                      className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120]"
                    >
                      <option value="Recruiter">Recruiter / Senior Photo Editor</option>
                      <option value="Client">Direct Fashion Brand Client</option>
                      <option value="Agency">Creative Director / Art Buyer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Target Plate Count
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={brief.targetCount}
                        onChange={(e) =>
                          setBrief({ ...brief, targetCount: Number(e.target.value) })
                        }
                        className="w-24 bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-1.5 text-xs text-[#242120]"
                      />
                      <span className="text-xs text-[#8a8175]">
                        (Recommended: 12–18 photographs)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerToast('Analyzing candidate archive against brief parameters...');
                      setTimeout(() => setCurrentScreen('suggestions'), 500);
                    }}
                    className="w-full py-2.5 px-4 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer mt-2"
                  >
                    Generate AI Curatorial Suggestions →
                  </button>
                </div>

                {/* AI Interpretation Card */}
                <div className="bg-[#fdfcf9] p-6 rounded-2xl border border-[#e8e3dc] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                        AI CANDIDATE POOL PREVIEW
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        247 Matches
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#242120]">
                      Curation Strategy Advisory
                    </h3>
                    <p className="text-xs text-[#6e6659] leading-relaxed mt-2">
                      {brief.curationStrategy}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#e8e3dc]">
                    <div className="text-[10px] font-mono uppercase text-[#8a8175] mb-2">
                      Candidate Pool Highlights
                    </div>
                    <div className="flex gap-2">
                      {photos.slice(0, 3).map((p) => (
                        <img
                          key={p.id}
                          src={p.url}
                          alt="Candidate"
                          className="w-20 h-24 object-cover rounded-md border border-[#e8e3dc]"
                        />
                      ))}
                      <div className="w-20 h-24 rounded-md bg-[#eee8de] border border-[#e8e3dc] flex items-center justify-center text-xs font-bold text-[#6e6659]">
                        +244
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. AI SUGGESTIONS SCREEN ==================== */}
          {currentScreen === 'suggestions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                    STEP 02 OF 05 · TRANSPARENT AI
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    AI Curatorial Recommendations
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Rule: The photographer always retains final control. Accept, reject, or replace any recommendation.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentScreen('brief')}
                    className="px-3 py-1.5 border border-[#e8e3dc] bg-white rounded-lg text-xs font-medium text-[#242120] cursor-pointer"
                  >
                    ← Back to Brief
                  </button>
                  <button
                    onClick={() => {
                      triggerToast('Transferred 15 recommended plates to Portfolio Sequence Editor');
                      setCurrentScreen('editor');
                    }}
                    className="px-4 py-1.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Transfer to Portfolio Editor →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {photos.slice(0, 6).map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-[#e8e3dc] p-4 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <img
                        src={p.url}
                        alt={p.title}
                        className="w-full h-44 object-cover rounded-lg border border-[#e8e3dc] mb-3"
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                          PLATE 0{idx + 1}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#2b6e4e]">
                          {p.score}% MATCH
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#242120] mt-1">{p.title}</div>
                      <p className="text-[11px] text-[#6e6659] mt-1 leading-relaxed">
                        {idx === 0
                          ? 'Strong opening image anchor with brutalist geometry and high dynamic range.'
                          : 'Adds visual variety and editorial silhouette pacing to avoid visual fatigue.'}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-[#f1ede6]">
                      <button
                        onClick={() => triggerToast(`Plate 0${idx + 1} accepted into sequence`)}
                        className="flex-1 py-1.5 bg-[#242120] hover:bg-[#3b3634] text-white rounded-md text-xs font-medium cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => triggerToast(`Alternative recommended for Plate 0${idx + 1}`)}
                        className="px-3 py-1.5 border border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120] rounded-md text-xs font-medium cursor-pointer"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 5. SEQUENCE & PLATE EDITOR ==================== */}
          {currentScreen === 'editor' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                    STEP 03 OF 05
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Sequence & Plate Editor
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Reorder plates, arrange section spreads, assign hero covers, and configure captions.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentScreen('suggestions')}
                    className="px-3 py-1.5 border border-[#e8e3dc] bg-white rounded-lg text-xs font-medium text-[#242120] cursor-pointer"
                  >
                    ← AI Suggestions
                  </button>
                  <button
                    onClick={() => setCurrentScreen('health')}
                    className="px-4 py-1.5 bg-[#242120] hover:bg-[#3b3634] text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Perform Health Check →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {activePortfolioPlates.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-[#e8e3dc] p-4 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242120] text-white font-bold">
                          PLATE 0{idx + 1}
                        </span>
                        {p.isCoverHero && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                            COVER HERO
                          </span>
                        )}
                      </div>
                      <img
                        src={p.url}
                        alt={p.title}
                        className="w-full h-40 object-cover rounded-lg border border-[#e8e3dc] mb-2"
                      />
                      <div className="text-xs font-semibold text-[#242120] truncate">{p.title}</div>
                      <div className="text-[10px] font-mono text-[#8a8175] mt-0.5">{p.camera}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f1ede6]">
                      <button
                        onClick={() => handleMovePlate(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 border border-[#e8e3dc] rounded hover:bg-[#fbf9f5] disabled:opacity-30 cursor-pointer"
                        title="Move Plate Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-[#242120]" />
                      </button>
                      <button
                        onClick={() => handleMovePlate(idx, 'down')}
                        disabled={idx === activePortfolioPlates.length - 1}
                        className="p-1.5 border border-[#e8e3dc] rounded hover:bg-[#fbf9f5] disabled:opacity-30 cursor-pointer"
                        title="Move Plate Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-[#242120]" />
                      </button>
                      <button
                        onClick={() => handleSetCoverHero(p.id)}
                        className={`flex-1 py-1.5 px-2 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                          p.isCoverHero
                            ? 'bg-[#f5ede3] border-[#c45a2c] text-[#c45a2c]'
                            : 'border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120]'
                        }`}
                      >
                        {p.isCoverHero ? '✓ Cover Assigned' : 'Set as Cover'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 6. HEALTH AUDIT SCREEN ==================== */}
          {currentScreen === 'health' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                    STEP 04 OF 05 · TRANSPARENT RULES
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Portfolio Health Audit
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Transparent, non-destructive rule-based checks. AI never automatically modifies your work.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentScreen('editor')}
                    className="px-3 py-1.5 border border-[#e8e3dc] bg-white rounded-lg text-xs font-medium text-[#242120] cursor-pointer"
                  >
                    ← Back to Editor
                  </button>
                  <button
                    onClick={() => setCurrentScreen('preview')}
                    className="px-4 py-1.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Proceed to Final Preview →
                  </button>
                </div>
              </div>

              <div className="max-w-3xl space-y-4 mx-auto">
                {/* 1. Count */}
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] border-l-4 border-l-[#2b6e4e] flex items-start gap-4 shadow-2xs">
                  <div className="text-[#2b6e4e] mt-0.5">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#242120]">Photo Target Count</strong>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        OPTIMAL
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6659] mt-1">
                      15 photographs are within your defined brief target of 12–18 photos. Density prevents recruiter fatigue.
                    </p>
                  </div>
                </div>

                {/* 2. Near Duplicate */}
                <div
                  className={`bg-white p-5 rounded-xl border border-[#e8e3dc] border-l-4 ${
                    duplicateResolved ? 'border-l-[#2b6e4e]' : 'border-l-[#b45309]'
                  } flex items-start gap-4 shadow-2xs transition-colors`}
                >
                  <div className={duplicateResolved ? 'text-[#2b6e4e]' : 'text-[#b45309]'}>
                    {duplicateResolved ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#242120]">
                        {duplicateResolved
                          ? 'Duplicate Advisory Resolved'
                          : 'Near-Duplicate Photographs Detected'}
                      </strong>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          duplicateResolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {duplicateResolved ? 'PASSED' : 'ADVISORY'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6659] mt-1">
                      {duplicateResolved
                        ? 'Plate 05 replaced with 3/4 length environmental wide shot. Distinct focal distance established.'
                        : 'Plates 04 & 05 share 92% framing and focal length similarity. Recruiters may perceive this as indecision in your curation.'}
                    </p>
                    {!duplicateResolved && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setDuplicateResolved(true);
                            triggerToast('Applied: Plate 05 replaced with 3/4 length environmental wide shot.');
                          }}
                          className="px-3 py-1.5 bg-[#f5ede3] border border-[#c45a2c] text-[#c45a2c] rounded-lg text-xs font-medium hover:bg-[#c45a2c] hover:text-white transition-colors cursor-pointer"
                        >
                          Swap Plate 05 with Environmental Wide Shot
                        </button>
                        <button
                          onClick={() => {
                            setDuplicateResolved(true);
                            triggerToast('Advisory dismissed by photographer.');
                          }}
                          className="px-3 py-1.5 border border-[#e8e3dc] rounded-lg text-xs text-[#6e6659] hover:bg-[#fbf9f5] cursor-pointer"
                        >
                          Keep Both
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Opening Impact */}
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] border-l-4 border-l-[#2b6e4e] flex items-start gap-4 shadow-2xs">
                  <div className="text-[#2b6e4e] mt-0.5">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#242120]">Opening Image Impact Anchor</strong>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        PASSED
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6659] mt-1">
                      Plate 01 features high tonal dynamic range and brutalist geometry to immediately capture recruiter attention.
                    </p>
                  </div>
                </div>

                {/* 4. Sequence Pacing */}
                <div
                  className={`bg-white p-5 rounded-xl border border-[#e8e3dc] border-l-4 ${
                    pacingResolved ? 'border-l-[#2b6e4e]' : 'border-l-[#b45309]'
                  } flex items-start gap-4 shadow-2xs`}
                >
                  <div className={pacingResolved ? 'text-[#2b6e4e]' : 'text-[#b45309]'}>
                    {pacingResolved ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#242120]">
                        {pacingResolved
                          ? 'Sequence Pacing Resolved'
                          : 'Sequence Pacing: Clustered Close-Ups'}
                      </strong>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          pacingResolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pacingResolved ? 'OPTIMAL' : 'ADVISORY'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6659] mt-1">
                      {pacingResolved
                        ? 'Runway establishing shot inserted between Plates 08 & 09, giving rhythmic breathing room.'
                        : 'Plates 08, 09, and 10 feature three consecutive macro shots without establishing spatial breathing room.'}
                    </p>
                    {!pacingResolved && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setPacingResolved(true);
                            triggerToast('Applied: Runway wide shot inserted between macro plates.');
                          }}
                          className="px-3 py-1.5 border border-[#e8e3dc] rounded-lg text-xs font-medium text-[#242120] hover:bg-[#fbf9f5] cursor-pointer"
                        >
                          Inject Runway Wide Shot Between Plates
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Color & Gamut Consistency */}
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] border-l-4 border-l-[#2b6e4e] flex items-start gap-4 shadow-2xs">
                  <div className="text-[#2b6e4e] mt-0.5">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#242120]">Color & Gamut Consistency</strong>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        HARMONIC
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6659] mt-1">
                      Monochromatic silver-gelatin deep black tone curve is maintained consistently across the whole monograph.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. FINAL PREVIEW / PUBLISH SCREEN ==================== */}
          {currentScreen === 'preview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                    STEP 05 OF 05
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Final Preview & Publishing Desk
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Inspect recruiter perspective, toggle mobile/retina viewports, and publish live monograph.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentScreen('health')}
                    className="px-3 py-1.5 border border-[#e8e3dc] bg-white rounded-lg text-xs font-medium text-[#242120] cursor-pointer"
                  >
                    ← Health Audit
                  </button>
                  <button
                    onClick={handlePublishPortfolio}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isPublished
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#c45a2c] hover:bg-[#b04f24] text-white'
                    }`}
                  >
                    {isPublished ? '✓ Published Live' : '🚀 Publish Live Portfolio'}
                  </button>
                </div>
              </div>

              {/* Editorial Monograph Viewer Frame */}
              <div className="bg-[#11100f] text-white p-8 md:p-12 rounded-2xl border border-[#2b2724] shadow-2xl text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded border border-[#3b3530] text-[#a89e90]">
                  LIVE CURATED SUBMISSION · MONOGRAPH EDITION
                </span>
                <h2 className="font-serif text-3xl md:text-5xl font-light mt-4 mb-2 text-white">
                  Fashion Photography Internship
                </h2>
                <p className="text-xs font-mono text-[#a89e90]">
                  Curated for XYZ Magazine · Aarav Patel · Studio Edition 2026
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10 text-left">
                  {photos.slice(0, 6).map((p, idx) => (
                    <div key={p.id} className="group">
                      <div className="h-56 overflow-hidden rounded-lg bg-[#221e1b] border border-[#36302a]">
                        <img
                          src={p.url}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-white truncate">{p.title}</span>
                        <span className="font-mono text-[10px] text-[#8a8175]">PLATE 0{idx + 1}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#6e6659]">
                        {p.camera} · {p.lens}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 8. CLIENT PROOFING PORTAL ==================== */}
          {currentScreen === 'proofing' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3dc] pb-6 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#eaf4ef] text-[#2b6e4e] font-bold">
                    CLIENT PROOFING PORTAL
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Sharma & Mehta Ceremony — Proofing
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Anita & Vikram are reviewing plates. Clients can select favorites, mark revisions, and leave comments.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#f5ede3] text-[#c45a2c] px-3 py-1.5 rounded-lg border border-[#edd5c3]">
                    {photos.filter((p) => p.clientStatus === 'selected').length} Selected ·{' '}
                    {photos.filter((p) => p.clientStatus !== 'selected').length} Pending
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-[#e8e3dc] p-4 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="h-52 w-full rounded-lg overflow-hidden bg-[#141210] border border-[#e8e3dc] mb-3 relative">
                        <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            p.clientStatus === 'selected'
                              ? 'bg-emerald-600 text-white'
                              : p.clientStatus === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {p.clientStatus ? p.clientStatus.toUpperCase() : 'NEEDS REVIEW'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#242120]">{p.title}</div>
                      <div className="text-[11px] font-mono text-[#8a8175] mt-0.5">
                        {p.shootLabel} · {p.camera}
                      </div>

                      {p.clientNotes && p.clientNotes.length > 0 && (
                        <div className="mt-2 p-2 bg-[#fef3c7] rounded-md border border-[#fde68a] text-[11px] text-[#78350f] italic">
                          "{p.clientNotes[0]}"
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1.5 mt-4 pt-3 border-t border-[#f1ede6]">
                      <button
                        onClick={() => handleClientStatusChange(p.id, 'selected')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          p.clientStatus === 'selected'
                            ? 'bg-[#2b6e4e] text-white'
                            : 'border border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120]'
                        }`}
                      >
                        ✓ Select
                      </button>
                      <button
                        onClick={() => handleClientStatusChange(p.id, 'rejected')}
                        className="px-2.5 py-1.5 border border-[#e8e3dc] hover:bg-red-50 text-red-600 rounded-md text-xs font-medium cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => {
                          setNoteTargetPhotoId(p.id);
                          setClientNoteInput(p.clientNotes?.[0] || '');
                        }}
                        className="px-2.5 py-1.5 border border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120] rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Note</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 9. PERMISSIONS MATRIX ==================== */}
          {currentScreen === 'collaborators' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e8e3dc] pb-6">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                  ROLE-BASED ACCESS CONTROL (RBAC)
                </span>
                <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                  Studio Permissions Matrix
                </h1>
                <p className="text-xs text-[#6e6659] mt-1">
                  Strict architectural boundaries. AI never automatically modifies, deletes originals, or publishes work.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#e8e3dc] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#e8e3dc] bg-[#fbf9f5] font-mono text-[11px] text-[#8a8175]">
                        <th className="p-3.5">STUDIO CAPABILITY</th>
                        <th className="p-3.5">OWNER (MADHURA)</th>
                        <th className="p-3.5">EDITOR (RAHUL)</th>
                        <th className="p-3.5">CLIENT (ANITA & VIKRAM)</th>
                        <th className="p-3.5">VIEWER (SARAH)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ede6]">
                      <tr>
                        <td className="p-3.5 font-medium text-[#242120]">View Master Photo Library</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-medium text-[#242120]">Upload Photos & EXIF Ingest</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-medium text-[#242120]">Accept / Reject AI Suggestions</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-medium text-[#242120]">Delete Master RAWs</td>
                        <td className="p-3.5 text-[#2b6e4e] font-bold">✓ Owner Exclusive</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-medium text-[#242120]">Publish Monograph Live</td>
                        <td className="p-3.5 text-[#2b6e4e] font-bold">✓ Owner Exclusive</td>
                        <td className="p-3.5 text-amber-600 font-semibold">Drafts Only</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-medium text-[#242120]">Client Proofing & Selection</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-[#2b6e4e] font-semibold">✓ Granted</td>
                        <td className="p-3.5 text-[#2b6e4e] font-bold">✓ Direct Access</td>
                        <td className="p-3.5 text-red-500 font-semibold">✕ Denied</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PHOTO DETAIL INSPECTOR DRAWER */}
      <PhotoDetailDrawer
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onToggleFavorite={handleToggleFavorite}
        onDeletePhoto={handleDeletePhoto}
        currentRole={currentUser.role}
      />

      {/* UPLOAD MODAL */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadPhoto}
      />

      {/* CLIENT NOTE MODAL */}
      {noteTargetPhotoId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e8e3dc] shadow-2xl p-6">
            <h3 className="font-serif text-lg font-medium text-[#242120] mb-1">
              Add Client Proofing Feedback
            </h3>
            <p className="text-xs text-[#8a8175] mb-4">
              Enter retouching notes, album layout preferences, or crop suggestions.
            </p>

            <textarea
              rows={3}
              value={clientNoteInput}
              onChange={(e) => setClientNoteInput(e.target.value)}
              placeholder="e.g. Please soften backlighting flare and ensure bride's veil embroidery is highlighted."
              className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg p-3 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setNoteTargetPhotoId(null)}
                className="px-4 py-2 border border-[#e8e3dc] rounded-lg text-xs text-[#6e6659] hover:bg-[#f1ede6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClientNote}
                className="px-4 py-2 bg-[#2b6e4e] hover:bg-[#23583e] text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
