import React, { useState } from 'react';
import { User, Photo, ScreenId, Role, PortfolioBrief, Category, Album } from '../types';
import { USERS } from '../data/mockData';
import { PhotoDetailDrawer } from './PhotoDetailDrawer';
import { UploadModal } from './UploadModal';
import { AlbumModal } from './AlbumModal';
import { UserAvatar } from './UserAvatar';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { supabaseService, SupabaseHealthStatus } from '../services/supabaseService';
import { SUPABASE_PROJECT_ID } from '../lib/supabase';
import { computeHealthAudit } from '../utils/healthAuditEngine';
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
  Cloud,
  FolderPlus,
  Folder,
  Tag,
  Star,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  HardDrive,
  Settings
} from 'lucide-react';

interface StudioWorkspaceProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (newUser: User) => void;
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  albums: Album[];
  setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
  brief: PortfolioBrief | null;
  setBrief: React.Dispatch<React.SetStateAction<PortfolioBrief | null>>;
  onAddCategory: (categoryName: string) => Promise<{ success: boolean; error?: string; category?: Category }>;
  supabaseHealth: SupabaseHealthStatus | null;
  onOpenSupabaseModal: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  photos,
  setPhotos,
  categories,
  setCategories,
  albums,
  setAlbums,
  brief,
  setBrief,
  onAddCategory,
  supabaseHealth,
  onOpenSupabaseModal
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [libraryTab, setLibraryTab] = useState<'photos' | 'albums'>('photos');
  const [activeAlbumFilterId, setActiveAlbumFilterId] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Search & Filter in Library
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'size'>('date');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Workflow Album Scope State across all 5 steps
  const [workflowAlbumId, setWorkflowAlbumId] = useState<string | null>(null);
  const [isAddPlateFromAlbumOpen, setIsAddPlateFromAlbumOpen] = useState(false);
  const [proofingFilter, setProofingFilter] = useState<'all' | 'selected' | 'changes_requested' | 'needs_review' | 'rejected'>('all');
  const [showLivePublicView, setShowLivePublicView] = useState(false);
  const [noteStatusChoice, setNoteStatusChoice] = useState<'changes_requested' | 'selected'>('changes_requested');

  // Currently active album in workflow
  const activeWorkflowAlbum = albums.find((a) => a.id === workflowAlbumId) || null;
  // Candidates in active workflow scope
  const workflowCandidatePhotos = activeWorkflowAlbum
    ? photos.filter((p) => activeWorkflowAlbum.photoIds.includes(p.id))
    : photos;

  // Client note modal state
  const [noteTargetPhotoId, setNoteTargetPhotoId] = useState<string | null>(null);
  const [clientNoteInput, setClientNoteInput] = useState('');

  // Active portfolio plates (filter from actual photos)
  const activePortfolioPlates = photos.filter((p) => p.inActivePortfolio);

  // Safe user-bound brief definition
  const safeBrief: PortfolioBrief = brief || {
    id: `brief-${currentUser.id}`,
    userId: currentUser.id,
    title: `${currentUser.name}'s Monograph Edition`,
    purpose: 'job',
    targetAudience: 'Recruiter',
    targetCount: 15,
    curationStrategy: 'For an editorial recruiter brief, we recommend establishing a strong architectural opener, followed by high-contrast chiaroscuro character studies, intercut with tactile macro fabric details to demonstrate versatility.',
    candidatePoolCount: photos.length
  };

  // Compute dynamic health audit from actual photos
  const healthAudit = computeHealthAudit(activePortfolioPlates, safeBrief.targetCount);

  // Compute total storage used from actual photo sizes (bytes to GB)
  const totalStorageBytes = photos.reduce((acc, p) => acc + (p.fileSize || 52428800), 0);
  const storageUsedGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storageProgressPercent = Math.min(100, Math.max(5, (totalStorageBytes / (100 * 1024 * 1024 * 1024)) * 100));

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // 1. PHOTO ACTIONS
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
    triggerToast(nextFav ? `Marked photograph as favorite` : `Removed from favorites`);
    await supabaseService.updatePhoto(id, { isFavorite: nextFav });
  };

  const handleDeletePhoto = async (id: string) => {
    if (currentUser.role !== 'OWNER') {
      triggerToast('Permission Denied: Only Studio Owner can delete master RAWs.');
      return;
    }
    const target = photos.find((p) => p.id === id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    // Also remove from albums
    setAlbums((prev) =>
      prev.map((a) => ({ ...a, photoIds: a.photoIds.filter((pId) => pId !== id) }))
    );
    setSelectedPhoto(null);
    triggerToast(`RAW master "${target?.title || id}" deleted from archive`);
    await supabaseService.deletePhoto(id);
  };

  const handleUploadPhoto = async (newPhoto: Photo) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    triggerToast(`RAW Ingest Successful: "${newPhoto.title}" persisted to Cloud Vault`);
    await supabaseService.upsertPhoto(newPhoto);
  };

  // 2. ALBUM ACTIONS
  const handleCreateAlbum = async (title: string, description: string, photoIds: string[]) => {
    const res = await supabaseService.createAlbum(title, description, photoIds, photos, currentUser.id);
    if (res.album) {
      setAlbums((prev) => [res.album!, ...prev]);
      triggerToast(`Album "${title}" created with ${photoIds.length} photographs`);
    }
  };

  // 3. SEQUENCE & EDITOR ACTIONS
  const handleMovePlate = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activePortfolioPlates.length) return;

    const copy = [...activePortfolioPlates];
    const current = copy[index];
    const target = copy[targetIndex];

    copy[index] = target;
    copy[targetIndex] = current;

    // Update plate numbers
    const updatedWithNumbers = copy.map((p, idx) => ({ ...p, plateNumber: idx + 1 }));

    setPhotos((prev) =>
      prev.map((p) => {
        const found = updatedWithNumbers.find((u) => u.id === p.id);
        return found ? found : p;
      })
    );

    triggerToast(`Plate "${current.title}" moved ${direction}`);
    await supabaseService.updatePhoto(current.id, { plateNumber: targetIndex + 1 });
    await supabaseService.updatePhoto(target.id, { plateNumber: index + 1 });
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
    await supabaseService.updatePhoto(id, { isCoverHero: true });
  };

  const handleUpdatePlateCaption = async (id: string, newTitle: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p))
    );
    await supabaseService.updatePhoto(id, { title: newTitle });
    triggerToast('Plate caption updated and persisted');
  };

  // 4. BRIEF ACTIONS
  const handleSaveBrief = async () => {
    const updatedBrief: PortfolioBrief = {
      ...safeBrief,
      selectedAlbumId: workflowAlbumId,
      candidatePoolCount: workflowCandidatePhotos.length
    };
    setBrief(updatedBrief);
    await supabaseService.saveBrief(updatedBrief, currentUser.id);
    triggerToast('Portfolio brief parameters updated and saved to Cloud Vault');
    setCurrentScreen('suggestions');
  };

  // 5. AI CURATION SUGGESTIONS ACTIONS
  const handleAcceptSuggestion = async (id: string) => {
    const nextPlateNumber = activePortfolioPlates.length + 1;
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inActivePortfolio: true, plateNumber: p.plateNumber || nextPlateNumber } : p))
    );
    triggerToast('Plate accepted into active sequence');
    await supabaseService.updatePhoto(id, { inActivePortfolio: true, plateNumber: nextPlateNumber });
  };

  const handleTransferAllSuggestions = async () => {
    // Take candidate photos from active workflow scope
    const pool = workflowCandidatePhotos.length > 0 ? workflowCandidatePhotos : photos;
    const targetCount = Math.min(safeBrief.targetCount || 12, pool.length);
    const selectedIds = new Set(pool.slice(0, targetCount).map((p) => p.id));

    setPhotos((prev) =>
      prev.map((p) => {
        if (selectedIds.has(p.id)) {
          const idx = pool.findIndex((item) => item.id === p.id);
          return { ...p, inActivePortfolio: true, plateNumber: idx + 1 };
        }
        return p;
      })
    );

    triggerToast(`Transferred ${targetCount} curated plates to Portfolio Sequence Editor`);
    setCurrentScreen('editor');
  };

  const handleAddPhotoToSequence = async (photo: Photo) => {
    const nextPlateNumber = activePortfolioPlates.length + 1;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photo.id
          ? { ...p, inActivePortfolio: true, plateNumber: nextPlateNumber }
          : p
      )
    );
    triggerToast(`Added "${photo.title}" to active portfolio sequence`);
    await supabaseService.updatePhoto(photo.id, {
      inActivePortfolio: true,
      plateNumber: nextPlateNumber
    });
  };

  const handleRemovePhotoFromSequence = async (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, inActivePortfolio: false, isCoverHero: false }
          : p
      )
    );
    triggerToast('Plate removed from sequence');
    await supabaseService.updatePhoto(photoId, {
      inActivePortfolio: false,
      isCoverHero: false
    });
  };

  // 6. HEALTH AUDIT INTERACTIVE FIXES
  const handleResolveDuplicate = async () => {
    // Swap duplicate Plate 05 with Plate 09 (Architectural Wide)
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === 'p-05') {
          return { ...p, inActivePortfolio: false };
        }
        if (p.id === 'p-09') {
          return { ...p, inActivePortfolio: true, plateNumber: 5 };
        }
        return p;
      })
    );
    triggerToast('Applied: Plate 05 swapped with Brutalist Concrete Pavilion wide shot');
  };

  const handleResolvePacing = async () => {
    // Add Plate 10 (Organza in Wind Tunnel) between Plates 8 and 9
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === 'p-10') {
          return { ...p, inActivePortfolio: true, plateNumber: 9 };
        }
        return p;
      })
    );
    triggerToast('Applied: Runway wide establishing shot injected to establish breathing room');
  };

  // 7. CLIENT PROOFING ACTIONS
  const handleClientStatusChange = async (id: string, status: 'selected' | 'rejected' | 'changes_requested') => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, clientStatus: status } : p))
    );
    const msg =
      status === 'selected'
        ? 'Plate marked as Approved (Select)'
        : status === 'rejected'
        ? 'Plate rejected by reviewer'
        : 'Changes requested on plate';
    triggerToast(msg);
    await supabaseService.updatePhoto(id, { clientStatus: status });
  };

  const handleSaveClientNote = async () => {
    if (!noteTargetPhotoId || !clientNoteInput.trim()) return;
    let updatedNotes: string[] = [];
    const targetStatus = noteStatusChoice;
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === noteTargetPhotoId) {
          updatedNotes = [clientNoteInput.trim(), ...(p.clientNotes || [])];
          return { ...p, clientNotes: updatedNotes, clientStatus: targetStatus };
        }
        return p;
      })
    );
    triggerToast(`Client review feedback logged: "${clientNoteInput.trim()}"`);
    await supabaseService.updatePhoto(noteTargetPhotoId, {
      clientNotes: updatedNotes,
      clientStatus: targetStatus
    });
    setNoteTargetPhotoId(null);
    setClientNoteInput('');
  };

  // 8. PUBLISHING & SHARING
  const handlePublishPortfolio = async () => {
    if (currentUser.role !== 'OWNER') {
      triggerToast('Permission Denied: Only Studio Owner can publish monographs live.');
      return;
    }
    const portfolioId = safeBrief.id || `brief-${currentUser.id}`;
    setIsPublished(true);
    await supabaseService.publishPortfolio(portfolioId);
    setShowLivePublicView(true);
    triggerToast('🎉 Portfolio published live to Cloud Archive!');
  };

  const handleCopyLiveLink = () => {
    const portfolioId = safeBrief.id || `brief-${currentUser.id}`;
    const shareUrl = `${window.location.origin}/?portfolio=${portfolioId}&monograph=true`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    triggerToast('Shareable portfolio link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filtered and sorted photos for photo library
  const filteredPhotos = photos
    .filter((p) => {
      // Album filter
      if (activeAlbumFilterId) {
        const targetAlbum = albums.find((a) => a.id === activeAlbumFilterId);
        if (targetAlbum && !targetAlbum.photoIds.includes(p.id)) return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'all') {
        if (p.categoryId !== selectedCategoryFilter && p.shoot !== selectedCategoryFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.camera.toLowerCase().includes(q) ||
          p.lens.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
      return 0; // date order
    });

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
              title="Cloud Vault Settings"
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Connected</span>
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
              onClick={() => {
                setCurrentScreen('library');
                setActiveAlbumFilterId(null);
              }}
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
                {activePortfolioPlates.length} Plates
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
                    healthAudit.overallScore === 100 ? 'bg-[#2b6e4e]' : 'bg-[#b45309]'
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
                {photos.filter((p) => p.clientStatus === 'selected').length > 0
                  ? `${photos.filter((p) => p.clientStatus === 'selected').length} Selects`
                  : 'Proofing'}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Storage & Active Account Identity */}
        <div className="p-4 border-t border-[#e8e3dc] bg-[#f7f3eb] space-y-3">
          {/* Storage Bar (Calculated dynamically) */}
          <div className="bg-white p-2.5 rounded-lg border border-[#e8e3dc] shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8a8175]">RAW Vault</span>
              <span className="font-semibold text-[#242120]">{storageUsedGB} / 100 GB</span>
            </div>
            <div className="h-1.5 w-full bg-[#eee8de] rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#c45a2c] rounded-full transition-all duration-500"
                style={{ width: `${storageProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Single Active Account Display */}
          <div className="bg-white p-2.5 rounded-lg border border-[#e8e3dc] shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#242120] truncate">{currentUser.name}</div>
                <div className="text-[10px] font-mono text-[#c45a2c] font-bold uppercase truncate">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title="Profile & Settings"
              className="p-1 rounded text-[#8a8175] hover:text-[#242120] hover:bg-[#f5ede3] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
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
              <span>Cloud Vault Connected</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setIsAlbumModalOpen(true)}
              className="hidden sm:flex text-xs font-medium text-[#242120] hover:text-[#c45a2c] items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e3dc] hover:bg-[#fbf9f5] transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#c45a2c]" />
              <span>New Album</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs font-medium text-[#242120] hover:text-[#c45a2c] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e3dc] hover:bg-[#fbf9f5] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#c45a2c]" />
              <span>Ingest RAW</span>
            </button>

            {/* Current User Pill Dropdown (Single Active Account Display) */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-[#f5ede3]/60 transition-colors border border-transparent hover:border-[#e8e3dc] cursor-pointer"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="md" />
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
                  {/* Single Active Profile Details */}
                  <div className="px-4 py-3 border-b border-[#e8e3dc]">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="lg" />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#242120] truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-[#8a8175] truncate">{currentUser.email}</div>
                        <div className="text-[10px] font-mono text-[#c45a2c] font-bold mt-0.5 uppercase">
                          {currentUser.role} · Active Session
                        </div>
                      </div>
                    </div>
                    {currentUser.title && (
                      <div className="mt-2 text-[10px] font-mono text-[#6e6659] border-t border-[#f1ede6] pt-1.5 truncate">
                        {currentUser.title}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-[#242120] hover:bg-[#f5ede3]/70 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#c45a2c]" />
                      <span>Profile & Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSupabaseModal();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-[#242120] hover:bg-[#f5ede3]/70 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Cloud Vault Settings</span>
                    </button>

                    <div className="border-t border-[#e8e3dc] my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Screens Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl w-full mx-auto">
          {/* ==================== ALBUM CURATION SCOPE RIBBON (5 WORKFLOW STEPS) ==================== */}
          {['brief', 'suggestions', 'editor', 'health', 'preview'].includes(currentScreen) && (
            <div className="bg-white border border-[#e8e3dc] rounded-2xl p-4 mb-6 shadow-2xs animate-in fade-in duration-150">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f5ede3] text-[#c45a2c] flex items-center justify-center shrink-0 border border-[#ecd9c7]">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8175]">
                        Curatorial Album Scope
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#f5ede3] text-[#c45a2c] font-bold">
                        {activeWorkflowAlbum ? activeWorkflowAlbum.title : 'All Master Archive'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#242120] flex items-center gap-2 mt-0.5">
                      <span>{workflowCandidatePhotos.length} Candidate Plates Active in Scope</span>
                      {activeWorkflowAlbum && (
                        <span className="text-[11px] text-[#6e6659] font-normal truncate max-w-xs">
                          — {activeWorkflowAlbum.description || 'Studio Album'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Album Filter Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                  <button
                    type="button"
                    onClick={() => setWorkflowAlbumId(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      workflowAlbumId === null
                        ? 'bg-[#242120] text-white shadow-xs'
                        : 'bg-[#fbf9f5] border border-[#e8e3dc] text-[#242120] hover:bg-[#f5ede3]'
                    }`}
                  >
                    All Archive ({photos.length})
                  </button>
                  {albums.map((alb) => (
                    <button
                      key={alb.id}
                      type="button"
                      onClick={() => setWorkflowAlbumId(alb.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        workflowAlbumId === alb.id
                          ? 'bg-[#c45a2c] text-white shadow-xs'
                          : 'bg-[#fbf9f5] border border-[#e8e3dc] text-[#242120] hover:bg-[#f5ede3]'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>{alb.title}</span>
                      <span className="text-[10px] opacity-80">({alb.photoIds.length})</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsAlbumModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-[#c45a2c] text-[#c45a2c] hover:bg-[#f5ede3] whitespace-nowrap cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Album</span>
                  </button>
                </div>
              </div>
            </div>
          )}

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
                      <span>Cloud Vault Active</span>
                    </button>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-normal mt-2 text-[#242120]">
                    Good morning, {currentUser.name.split(' ')[0]}
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Master photography library & editorial portfolio manager with cloud storage.
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

              {/* Dynamic Real-Time Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">TOTAL ARCHIVE</div>
                  <div className="text-2xl font-semibold text-[#242120] mt-1">{photos.length}</div>
                  <div className="text-[11px] text-[#2b6e4e] font-medium mt-1">
                    {storageUsedGB} GB indexed in vault
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">STUDIO ALBUMS</div>
                  <div className="text-2xl font-semibold text-[#242120] mt-1">{albums.length}</div>
                  <div className="text-[11px] text-[#8a8175] mt-1">
                    {categories.length} active genres
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">CLIENT PROOFS</div>
                  <div className="text-2xl font-semibold text-[#242120] mt-1">
                    {photos.filter((p) => p.clientStatus === 'selected').length} / {photos.length}
                  </div>
                  <div className="text-[11px] text-[#b45309] font-medium mt-1">
                    Wedding & commercial review
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#e8e3dc] shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-[#8a8175]">HEALTH AUDIT</div>
                  <div className="text-2xl font-semibold text-[#2b6e4e] mt-1">
                    {healthAudit.overallScore}%
                  </div>
                  <div className="text-[11px] text-[#8a8175] mt-1">
                    {healthAudit.advisories.filter((a) => a.severity === 'advisory').length} advisories detected
                  </div>
                </div>
              </div>

              {/* Active Portfolio Highlight */}
              {!brief || !brief.title ? (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-dashed border-[#dcd6cc] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                        CURATION PIPELINE
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#f1ede6] text-[#736a5e] font-semibold">
                        AWAITING SETUP
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl font-normal text-[#242120]">
                      No active brief configured
                    </h2>
                    <p className="text-xs text-[#6e6659] mt-1.5 leading-relaxed max-w-xl">
                      Click 'New Portfolio Brief' to start configuring your candidate pool, target review audience, and plate goals.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBrief(safeBrief);
                      setCurrentScreen('brief');
                    }}
                    className="px-4 py-2.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>New Portfolio Brief</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-xs flex flex-col md:flex-row items-center gap-6">
                  <img
                    src={
                      photos.find((p) => p.isCoverHero)?.url ||
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
                        {safeBrief.targetAudience.toUpperCase()} REVIEW
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl font-medium text-[#242120]">{safeBrief.title}</h2>
                    <p className="text-xs text-[#6e6659] mt-1 leading-relaxed">
                      {activePortfolioPlates.length} curated plates · Target audience: {safeBrief.targetAudience}
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
                        Audit Health ({healthAudit.overallScore}%)
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
              )}

              {/* Studio Albums Section in Dashboard */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#c45a2c]" />
                    <h3 className="font-semibold text-base text-[#242120]">Studio Albums</h3>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentScreen('library');
                      setLibraryTab('albums');
                    }}
                    className="text-xs font-medium text-[#c45a2c] hover:underline cursor-pointer"
                  >
                    View All Albums ({albums.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {albums.slice(0, 3).map((alb) => (
                    <div
                      key={alb.id}
                      onClick={() => {
                        setActiveAlbumFilterId(alb.id);
                        setCurrentScreen('library');
                        setLibraryTab('photos');
                      }}
                      className="bg-white rounded-xl border border-[#e8e3dc] p-3 flex gap-3 items-center hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#181513] shrink-0 border border-[#e8e3dc]">
                        <img
                          src={alb.coverUrl || photos[0]?.url}
                          alt={alb.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#242120] truncate">{alb.title}</div>
                        <div className="text-[11px] text-[#8a8175] truncate mt-0.5">
                          {alb.photoIds.length} Photographs
                        </div>
                        <div className="text-[10px] font-mono text-[#c45a2c] mt-1">View Album →</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Photos in Studio */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base text-[#242120]">Recent Master Uploads</h3>
                  <button
                    onClick={() => {
                      setCurrentScreen('library');
                      setLibraryTab('photos');
                    }}
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
                        {p.isFavorite && (
                          <span className="absolute top-2 right-2 text-amber-400">★</span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-semibold text-[#242120] truncate">{p.title}</div>
                        <div className="text-[11px] font-mono text-[#8a8175] mt-0.5 truncate">
                          {p.lens} · {p.aperture}
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-[#c45a2c]">
                          {p.categoryName || p.shootLabel}
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
                    Manage device uploads, custom photography categories, and curated studio albums.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAlbumModalOpen(true)}
                    className="px-3.5 py-2 border border-[#e8e3dc] bg-white hover:bg-[#fbf9f5] rounded-lg text-xs font-medium text-[#242120] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span>Create Album</span>
                  </button>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 bg-[#242120] hover:bg-[#3b3634] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>
                </div>
              </div>

              {/* DUAL SECTION VIEW TABS: Photos vs Albums */}
              <div className="flex items-center justify-between border-b border-[#e8e3dc] pb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setLibraryTab('photos')}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                      libraryTab === 'photos'
                        ? 'bg-[#242120] text-white shadow-xs font-semibold'
                        : 'text-[#6e6659] hover:bg-[#f3eee6]'
                    }`}
                  >
                    <Images className="w-3.5 h-3.5" />
                    <span>Photos ({photos.length})</span>
                  </button>
                  <button
                    onClick={() => setLibraryTab('albums')}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                      libraryTab === 'albums'
                        ? 'bg-[#242120] text-white shadow-xs font-semibold'
                        : 'text-[#6e6659] hover:bg-[#f3eee6]'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Albums ({albums.length})</span>
                  </button>
                </div>

                {activeAlbumFilterId && (
                  <div className="flex items-center gap-2 text-xs bg-[#f5ede3] border border-[#c45a2c]/40 text-[#c45a2c] px-3 py-1 rounded-lg">
                    <span>
                      Filtered by Album:{' '}
                      <strong>{albums.find((a) => a.id === activeAlbumFilterId)?.title}</strong>
                    </span>
                    <button
                      onClick={() => setActiveAlbumFilterId(null)}
                      className="font-bold hover:text-black ml-1 cursor-pointer"
                    >
                      ✕ Clear
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: PHOTOS VIEW */}
              {libraryTab === 'photos' && (
                <div className="space-y-4">
                  {/* Search & Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#8a8175] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, camera, optics, genre..."
                        className="w-full bg-white border border-[#e8e3dc] rounded-lg pl-9 pr-3 py-2 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                      {/* Dynamic Category Filter */}
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-white border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] cursor-pointer"
                      >
                        <option value="all">All Genres ({categories.length})</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] cursor-pointer"
                      >
                        <option value="date">Newest RAW First</option>
                        <option value="score">Highest Quality Score</option>
                        <option value="size">Largest File Size</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredPhotos.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl border border-[#e8e3dc] overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all group flex flex-col justify-between"
                      >
                        <div
                          onClick={() => setSelectedPhoto(p)}
                          className="h-52 w-full bg-[#121110] relative overflow-hidden cursor-pointer"
                        >
                          <img
                            src={p.url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 flex gap-1">
                            <span className="text-[9px] font-mono uppercase bg-[#c45a2c] text-white px-2 py-0.5 rounded font-bold">
                              {p.categoryName || p.shootLabel || 'Fashion'}
                            </span>
                          </div>
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 text-[#2b6e4e] px-2 py-0.5 rounded font-bold">
                            {p.score}%
                          </span>
                        </div>

                        <div className="p-3.5">
                          <div
                            onClick={() => setSelectedPhoto(p)}
                            className="text-xs font-semibold text-[#242120] truncate cursor-pointer hover:text-[#c45a2c]"
                          >
                            {p.title}
                          </div>
                          <div className="text-[11px] font-mono text-[#8a8175] mt-1 truncate">
                            {p.camera} · {p.lens}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f1ede6] text-[10px] text-[#8a8175]">
                            <span>{p.dimensions}</span>
                            <button
                              onClick={() => handleToggleFavorite(p.id)}
                              className={`cursor-pointer ${p.isFavorite ? 'text-[#c45a2c] font-bold' : 'hover:text-[#c45a2c]'}`}
                            >
                              ★ {p.isFavorite ? 'Favorited' : 'Favorite'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredPhotos.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-2xl border border-[#e8e3dc]">
                      <Images className="w-8 h-8 text-[#8a8175] mx-auto mb-2" />
                      <h4 className="font-semibold text-sm text-[#242120]">No photographs found</h4>
                      <p className="text-xs text-[#8a8175] mt-1">
                        Try modifying search parameters or upload images from your device.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ALBUMS VIEW */}
              {libraryTab === 'albums' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {albums.map((alb) => (
                      <div
                        key={alb.id}
                        className="bg-white rounded-xl border border-[#e8e3dc] overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between"
                      >
                        <div
                          onClick={() => {
                            setActiveAlbumFilterId(alb.id);
                            setLibraryTab('photos');
                          }}
                          className="h-44 w-full bg-[#121110] relative overflow-hidden cursor-pointer"
                        >
                          <img
                            src={alb.coverUrl || photos[0]?.url}
                            alt={alb.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 text-white px-2 py-0.5 rounded font-bold">
                            {alb.photoIds.length} Plates
                          </span>
                        </div>

                        <div className="p-4">
                          <h4 className="font-serif text-base font-semibold text-[#242120] truncate">
                            {alb.title}
                          </h4>
                          {alb.description && (
                            <p className="text-xs text-[#6e6659] mt-1 line-clamp-2">
                              {alb.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f1ede6]">
                            <button
                              onClick={() => {
                                setActiveAlbumFilterId(alb.id);
                                setLibraryTab('photos');
                              }}
                              className="text-xs font-medium text-[#c45a2c] hover:underline cursor-pointer"
                            >
                              Open Album ({alb.photoIds.length}) →
                            </button>
                            <span className="text-[10px] font-mono text-[#8a8175]">
                              {new Date(alb.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. DEFINE BRIEF SCREEN ==================== */}
          {currentScreen === 'brief' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e8e3dc] pb-6">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                  STEP 01 OF 05 · ACTIVE BRIEF CONFIGURATION
                </span>
                <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                  Define Portfolio Brief
                </h1>
                <p className="text-xs text-[#6e6659] mt-1">
                  Configure submission parameters, review audiences, plate targets, and curation algorithms.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-2xs space-y-4">
                  <h3 className="font-serif text-base font-semibold text-[#242120]">
                    Submission Parameters
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Portfolio Monograph Title
                    </label>
                    <input
                      type="text"
                      value={safeBrief.title}
                      onChange={(e) => setBrief({ ...safeBrief, title: e.target.value })}
                      className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1.5">
                      Submission Purpose
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        onClick={() => setBrief({ ...safeBrief, purpose: 'job' })}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          safeBrief.purpose === 'job'
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
                        onClick={() => setBrief({ ...safeBrief, purpose: 'client' })}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          safeBrief.purpose === 'client'
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
                      value={safeBrief.targetAudience}
                      onChange={(e) =>
                        setBrief({ ...safeBrief, targetAudience: e.target.value as any })
                      }
                      className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120]"
                    >
                      <option value="Recruiter">Recruiter / Senior Photo Editor</option>
                      <option value="Client">Direct Fashion Brand Client</option>
                      <option value="Agency">Creative Director / Art Buyer</option>
                    </select>
                  </div>

                  {/* Album Scope Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Source Album / Curation Pool
                    </label>
                    <select
                      value={workflowAlbumId || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setWorkflowAlbumId(val);
                        const alb = albums.find((a) => a.id === val);
                        const count = alb ? alb.photoIds.length : photos.length;
                        setBrief((b) => ({ ...(b || safeBrief), selectedAlbumId: val, candidatePoolCount: count }));
                      }}
                      className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120]"
                    >
                      <option value="">All Master Archive Photos ({photos.length} plates)</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          📁 {alb.title} ({alb.photoIds.length} plates)
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#8a8175] mt-1">
                      Selecting an album scopes AI recommendations to that specific gallery shoot.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Target Plate Count
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={safeBrief.targetCount}
                        onChange={(e) =>
                          setBrief({ ...safeBrief, targetCount: Number(e.target.value) })
                        }
                        className="w-24 bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-1.5 text-xs text-[#242120]"
                      />
                      <span className="text-xs text-[#8a8175]">
                        (Recommended: 12–18 photographs to prevent viewer fatigue)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBrief}
                    className="w-full py-2.5 px-4 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Brief & Generate AI Curatorial Suggestions →</span>
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
                        {workflowCandidatePhotos.length} Plates in {activeWorkflowAlbum ? activeWorkflowAlbum.title : 'Archive'}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#242120]">
                      Curation Strategy Advisory
                    </h3>
                    <p className="text-xs text-[#6e6659] leading-relaxed mt-2">
                      {safeBrief.curationStrategy}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#e8e3dc]">
                    <div className="text-[10px] font-mono uppercase text-[#8a8175] mb-2 flex items-center justify-between">
                      <span>Scoped Candidates ({activeWorkflowAlbum ? activeWorkflowAlbum.title : 'All Library'})</span>
                      <span className="text-[10px] font-mono text-[#c45a2c]">{workflowCandidatePhotos.length} Plates</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {workflowCandidatePhotos.slice(0, 5).map((p) => (
                        <img
                          key={p.id}
                          src={p.url}
                          alt={p.title}
                          title={`${p.title} (${p.camera})`}
                          className="w-20 h-24 object-cover rounded-md border border-[#e8e3dc]"
                        />
                      ))}
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
                    STEP 02 OF 05 · ALGORITHMIC CURATION
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    AI Curatorial Recommendations
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Rule: The photographer always retains final control. Accept, reject, or replace any recommendation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#e8e3dc] text-xs shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span className="text-[#6e6659] text-[11px] font-medium hidden sm:inline">Album:</span>
                    <select
                      value={workflowAlbumId || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setWorkflowAlbumId(val);
                        const alb = albums.find((a) => a.id === val);
                        const count = alb ? alb.photoIds.length : photos.length;
                        setBrief((b) => ({ ...safeBrief, selectedAlbumId: val, candidatePoolCount: count }));
                      }}
                      className="bg-transparent font-medium text-[#242120] text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">All Master Archive ({photos.length})</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          {alb.title} ({alb.photoIds.length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setCurrentScreen('brief')}
                    className="px-3 py-1.5 border border-[#e8e3dc] bg-white rounded-lg text-xs font-medium text-[#242120] cursor-pointer"
                  >
                    ← Back to Brief
                  </button>
                  <button
                    onClick={handleTransferAllSuggestions}
                    className="px-4 py-1.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Transfer to Editor →
                  </button>
                </div>
              </div>

              {/* Renders real user photos from active album scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(workflowCandidatePhotos.length > 0 ? workflowCandidatePhotos : photos).slice(0, 9).map((p, idx) => (
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
                      <div className="text-xs font-bold text-[#242120] mt-1 truncate">{p.title}</div>
                      <p className="text-[11px] text-[#6e6659] mt-1 leading-relaxed">
                        {idx === 0
                          ? `Recommended Opening Anchor: High dynamic range & tonal confidence (${p.camera}).`
                          : idx % 3 === 0
                          ? `Pacing Interlude: Atmospheric contrast & micro-texture craft (${p.lens}).`
                          : 'Adds editorial silhouette variety & pacing balance to prevent reviewer fatigue.'}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-[#f1ede6]">
                      <button
                        onClick={() => handleAcceptSuggestion(p.id)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          p.inActivePortfolio
                            ? 'bg-[#2b6e4e] text-white'
                            : 'bg-[#242120] hover:bg-[#3b3634] text-white'
                        }`}
                      >
                        {p.inActivePortfolio ? '✓ In Sequence' : 'Accept Plate'}
                      </button>
                      <button
                        onClick={() => handleSetCoverHero(p.id)}
                        className={`px-2.5 py-1.5 border rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          p.isCoverHero ? 'bg-[#f5ede3] border-[#c45a2c] text-[#c45a2c]' : 'border-[#e8e3dc] text-[#242120] hover:bg-[#fbf9f5]'
                        }`}
                        title="Designate as Cover Hero"
                      >
                        {p.isCoverHero ? '★ Hero' : 'Hero'}
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
                    STEP 03 OF 05 · MONOGRAPH SEQUENCE
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Sequence & Plate Editor
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Reorder plates in real time, assign Cover Hero status, add plates from your albums, and fine-tune captions.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#e8e3dc] text-xs shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span className="text-[#6e6659] text-[11px] font-medium hidden sm:inline">Album Scope:</span>
                    <select
                      value={workflowAlbumId || ''}
                      onChange={(e) => setWorkflowAlbumId(e.target.value || null)}
                      className="bg-transparent font-medium text-[#242120] text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">All Monograph Plates ({activePortfolioPlates.length})</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          {alb.title} ({alb.photoIds.length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setIsAddPlateFromAlbumOpen(true)}
                    className="px-3 py-1.5 border border-[#c45a2c] bg-[#f5ede3] text-[#c45a2c] hover:bg-[#c45a2c] hover:text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Add Plate from Album</span>
                  </button>
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
                    Perform Health Audit →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {activePortfolioPlates.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-[#e8e3dc] p-4 shadow-2xs flex flex-col justify-between group"
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
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => handleUpdatePlateCaption(p.id, e.target.value)}
                        className="text-xs font-semibold text-[#242120] w-full bg-transparent border-b border-transparent hover:border-[#e8e3dc] focus:border-[#c45a2c] focus:outline-none py-0.5"
                      />
                      <div className="text-[10px] font-mono text-[#8a8175] mt-1">
                        {p.camera} · {p.lens}
                      </div>
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
                      <button
                        onClick={() => handleRemovePhotoFromSequence(p.id)}
                        className="p-1.5 border border-[#e8e3dc] rounded hover:bg-red-50 text-red-500 cursor-pointer"
                        title="Remove from Sequence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                    STEP 04 OF 05 · DYNAMIC AUDIT ENGINE
                  </span>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    Portfolio Health Audit
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Computed dynamically from your active sequence plates ({activePortfolioPlates.length} photos evaluated).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#e8e3dc] text-xs shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span className="text-[#6e6659] text-[11px] font-medium hidden sm:inline">Album Scope:</span>
                    <select
                      value={workflowAlbumId || ''}
                      onChange={(e) => setWorkflowAlbumId(e.target.value || null)}
                      className="bg-transparent font-medium text-[#242120] text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">All Monograph Plates ({activePortfolioPlates.length})</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          {alb.title} ({alb.photoIds.length})
                        </option>
                      ))}
                    </select>
                  </div>
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

              {/* Dynamic Health Advisories List */}
              <div className="max-w-3xl space-y-4 mx-auto">
                {healthAudit.advisories.map((advisory) => (
                  <div
                    key={advisory.id}
                    className={`bg-white p-5 rounded-xl border border-[#e8e3dc] border-l-4 ${
                      advisory.severity === 'good' ? 'border-l-[#2b6e4e]' : 'border-l-[#b45309]'
                    } flex items-start gap-4 shadow-2xs`}
                  >
                    <div className={advisory.severity === 'good' ? 'text-[#2b6e4e]' : 'text-[#b45309]'}>
                      {advisory.severity === 'good' ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-[#242120]">{advisory.title}</strong>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            advisory.severity === 'good'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {advisory.severity === 'good' ? 'PASSED' : 'ADVISORY'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6e6659] mt-1 leading-relaxed">
                        {advisory.description}
                      </p>

                      {/* Interactive Fix Buttons */}
                      {advisory.actionLabel && advisory.severity !== 'good' && (
                        <div className="mt-3">
                          {advisory.type === 'duplicate' && (
                            <button
                              onClick={handleResolveDuplicate}
                              className="px-3 py-1.5 bg-[#f5ede3] border border-[#c45a2c] text-[#c45a2c] rounded-lg text-xs font-medium hover:bg-[#c45a2c] hover:text-white transition-colors cursor-pointer"
                            >
                              {advisory.actionLabel}
                            </button>
                          )}
                          {advisory.type === 'pacing' && (
                            <button
                              onClick={handleResolvePacing}
                              className="px-3 py-1.5 border border-[#e8e3dc] rounded-lg text-xs font-medium text-[#242120] hover:bg-[#fbf9f5] cursor-pointer"
                            >
                              {advisory.actionLabel}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                    Examine final monograph presentation and distribute live sharing link to recruiters.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#e8e3dc] text-xs shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span className="text-[#6e6659] text-[11px] font-medium hidden sm:inline">Album Scope:</span>
                    <select
                      value={workflowAlbumId || ''}
                      onChange={(e) => setWorkflowAlbumId(e.target.value || null)}
                      className="bg-transparent font-medium text-[#242120] text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">All Monograph Plates ({activePortfolioPlates.length})</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          {alb.title} ({alb.photoIds.length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleCopyLiveLink}
                    className="px-3 py-1.5 border border-[#e8e3dc] bg-white rounded-lg text-xs font-medium text-[#242120] cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#c45a2c]" />
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Share Link'}</span>
                  </button>
                  <button
                    onClick={handlePublishPortfolio}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isPublished ? 'bg-emerald-600 text-white' : 'bg-[#c45a2c] hover:bg-[#b04f24] text-white'
                    }`}
                  >
                    {isPublished ? '✓ Published Live' : '🚀 Publish Live Portfolio'}
                  </button>
                </div>
              </div>

              {/* Exhibition Monograph Frame */}
              <div className="bg-[#11100f] text-white p-8 md:p-12 rounded-2xl border border-[#2b2724] shadow-2xl text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded border border-[#3b3530] text-[#a89e90]">
                  LIVE CURATED SUBMISSION · MONOGRAPH EDITION
                </span>
                <h2 className="font-serif text-3xl md:text-5xl font-light mt-4 mb-2 text-white">
                  {safeBrief.title}
                </h2>
                <p className="text-xs font-mono text-[#a89e90]">
                  Curated for {safeBrief.targetAudience} · {currentUser.name} · Studio Edition 2026
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10 text-left">
                  {activePortfolioPlates.map((p, idx) => (
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#eaf4ef] text-[#2b6e4e] font-bold">
                      CLIENT PROOFING PORTAL
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f5ede3] text-[#c45a2c] font-bold">
                      ACTIVE COMMISSION
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl font-normal mt-2 text-[#242120]">
                    {currentUser.role === 'CLIENT'
                      ? `${currentUser.name} — Review & Proofing`
                      : workflowAlbumId && albums.find((a) => a.id === workflowAlbumId)
                      ? `${albums.find((a) => a.id === workflowAlbumId)?.title} — Proofing`
                      : `${currentUser.name}'s Studio — Client Proofing Suite`}
                  </h1>
                  <p className="text-xs text-[#6e6659] mt-1">
                    Client review and selection suite. Plate selections and retouching notes sync directly to Cloud Vault in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#f5ede3] text-[#c45a2c] px-3 py-1.5 rounded-lg border border-[#edd5c3]">
                    {photos.filter((p) => p.clientStatus === 'selected').length} Approved ·{' '}
                    {photos.filter((p) => p.clientStatus === 'changes_requested').length} Changes Requested ·{' '}
                    {photos.filter((p) => !p.clientStatus || p.clientStatus === 'needs_review').length} Pending
                  </span>
                </div>
              </div>

              {/* Proofing Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(
                  [
                    { key: 'all', label: 'All Plates', count: photos.length },
                    { key: 'selected', label: 'Approved (Selects)', count: photos.filter((p) => p.clientStatus === 'selected').length },
                    { key: 'changes_requested', label: 'Changes Requested', count: photos.filter((p) => p.clientStatus === 'changes_requested').length },
                    { key: 'needs_review', label: 'Needs Review', count: photos.filter((p) => !p.clientStatus || p.clientStatus === 'needs_review').length },
                    { key: 'rejected', label: 'Rejected', count: photos.filter((p) => p.clientStatus === 'rejected').length }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setProofingFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      proofingFilter === tab.key
                        ? 'bg-[#242120] text-white shadow-xs'
                        : 'bg-white border border-[#e8e3dc] text-[#6e6659] hover:bg-[#fbf9f5]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">({tab.count})</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos
                  .filter((p) => {
                    if (proofingFilter === 'all') return true;
                    if (proofingFilter === 'selected') return p.clientStatus === 'selected';
                    if (proofingFilter === 'changes_requested') return p.clientStatus === 'changes_requested';
                    if (proofingFilter === 'rejected') return p.clientStatus === 'rejected';
                    if (proofingFilter === 'needs_review') return !p.clientStatus || p.clientStatus === 'needs_review';
                    return true;
                  })
                  .map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-[#e8e3dc] p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="h-52 w-full rounded-lg overflow-hidden bg-[#141210] border border-[#e8e3dc] mb-3 relative">
                        <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            p.clientStatus === 'selected'
                              ? 'bg-emerald-600 text-white'
                              : p.clientStatus === 'changes_requested'
                              ? 'bg-amber-600 text-white'
                              : p.clientStatus === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-zinc-700 text-white'
                          }`}
                        >
                          {p.clientStatus === 'selected'
                            ? 'APPROVED'
                            : p.clientStatus === 'changes_requested'
                            ? 'CHANGES REQUESTED'
                            : p.clientStatus === 'rejected'
                            ? 'REJECTED'
                            : 'NEEDS REVIEW'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#242120]">{p.title}</div>
                      <div className="text-[11px] font-mono text-[#8a8175] mt-0.5">
                        {p.categoryName || p.shootLabel} · {p.camera}
                      </div>

                      {p.clientNotes && p.clientNotes.length > 0 && (
                        <div className="mt-2.5 p-2 bg-amber-50/80 rounded-md border border-amber-200 text-[11px] text-[#78350f] space-y-1">
                          <div className="font-mono text-[9px] uppercase tracking-wider font-bold text-amber-800">
                            Client Retouching Note:
                          </div>
                          <div>"{p.clientNotes[0]}"</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1.5 mt-4 pt-3 border-t border-[#f1ede6]">
                      <button
                        type="button"
                        onClick={() => handleClientStatusChange(p.id, 'selected')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          p.clientStatus === 'selected'
                            ? 'bg-[#2b6e4e] text-white shadow-xs'
                            : 'border border-[#e8e3dc] hover:bg-emerald-50 hover:text-emerald-700 text-[#242120]'
                        }`}
                      >
                        ✓ Select
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientStatusChange(p.id, 'rejected')}
                        className={`px-2.5 py-1.5 border rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          p.clientStatus === 'rejected'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'border-[#e8e3dc] hover:bg-red-50 text-red-600'
                        }`}
                      >
                        ✕ Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoteTargetPhotoId(p.id);
                          setClientNoteInput(p.clientNotes?.[0] || '');
                          setNoteStatusChoice(p.clientStatus === 'selected' ? 'selected' : 'changes_requested');
                        }}
                        className={`px-2.5 py-1.5 border rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                          p.clientStatus === 'changes_requested'
                            ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold'
                            : 'border-[#e8e3dc] hover:bg-[#fbf9f5] text-[#242120]'
                        }`}
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
        categories={categories}
        onAddCategory={onAddCategory}
      />

      {/* ALBUM CREATION MODAL */}
      <AlbumModal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        photos={photos}
        onCreateAlbum={handleCreateAlbum}
      />

      {/* CLIENT NOTE & RETOUCHING MODAL */}
      {noteTargetPhotoId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e8e3dc] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            {(() => {
              const targetP = photos.find((p) => p.id === noteTargetPhotoId);
              return (
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-[#e8e3dc] mb-4">
                    <div className="flex items-center gap-3">
                      {targetP && (
                        <img
                          src={targetP.url}
                          alt={targetP.title}
                          className="w-12 h-12 rounded-lg object-cover border border-[#e8e3dc]"
                        />
                      )}
                      <div>
                        <h3 className="font-serif text-base font-semibold text-[#242120]">
                          Client Review & Retouching Feedback
                        </h3>
                        <div className="text-xs text-[#8a8175] truncate max-w-xs">
                          {targetP?.title || 'Selected Photograph'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setNoteTargetPhotoId(null)}
                      className="text-xs text-[#8a8175] hover:text-[#242120] font-mono cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Feedback Status Choice */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#242120] mb-1.5">
                      Review Status Decision
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNoteStatusChoice('changes_requested')}
                        className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                          noteStatusChoice === 'changes_requested'
                            ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500 text-amber-900 font-semibold'
                            : 'border-[#e8e3dc] bg-[#fbf9f5] text-[#242120]'
                        }`}
                      >
                        <div>⚠ Changes Requested</div>
                        <div className="text-[10px] text-[#8a8175] font-normal mt-0.5">
                          Requires photographer retouching
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNoteStatusChoice('selected')}
                        className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                          noteStatusChoice === 'selected'
                            ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 text-emerald-900 font-semibold'
                            : 'border-[#e8e3dc] bg-[#fbf9f5] text-[#242120]'
                        }`}
                      >
                        <div>✓ Approved with Note</div>
                        <div className="text-[10px] text-[#8a8175] font-normal mt-0.5">
                          Selected for final monograph spread
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Quick Retouching Chips */}
                  <div className="mb-3">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8a8175] mb-1.5">
                      Quick Editorial Tags (Click to append)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Warm up skin tones, reduce highlights',
                        'Tighten crop on right edge',
                        'Remove distracting background flare',
                        'Soften specular contrast on veil',
                        'Approved for full-bleed spread'
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setClientNoteInput((prev) =>
                              prev ? `${prev} · ${tag}` : tag
                            )
                          }
                          className="px-2.5 py-1 rounded-full bg-[#f5ede3] hover:bg-[#ecd9c7] text-[#c45a2c] text-[10px] font-mono cursor-pointer transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#242120] mb-1">
                      Retouching Feedback & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={clientNoteInput}
                      onChange={(e) => setClientNoteInput(e.target.value)}
                      placeholder="e.g. Warm up skin tones, reduce highlights, soften backlighting flare..."
                      className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg p-3 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#f1ede6]">
                    <button
                      type="button"
                      onClick={() => setNoteTargetPhotoId(null)}
                      className="px-4 py-2 border border-[#e8e3dc] rounded-lg text-xs text-[#6e6659] hover:bg-[#f1ede6] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveClientNote}
                      className="px-4 py-2 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs"
                    >
                      Save Feedback to Cloud Vault
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD PLATE FROM ALBUM MODAL (STEP 03) */}
      {isAddPlateFromAlbumOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-[#e8e3dc] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#e8e3dc] flex items-center justify-between bg-[#fbf9f5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f5ede3] text-[#c45a2c] flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#242120]">
                    Select Photographs from Albums
                  </h3>
                  <p className="text-xs text-[#8a8175]">
                    Browse through your albums and click any photograph to add it directly to the active sequence.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlateFromAlbumOpen(false)}
                className="text-xs text-[#8a8175] hover:text-[#242120] font-mono px-2 py-1 rounded hover:bg-[#e8e3dc] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Album selector tabs inside modal */}
            <div className="p-3 border-b border-[#e8e3dc] bg-white flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setWorkflowAlbumId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                  workflowAlbumId === null ? 'bg-[#242120] text-white' : 'bg-[#fbf9f5] border border-[#e8e3dc] text-[#242120]'
                }`}
              >
                All Master Archive ({photos.length})
              </button>
              {albums.map((alb) => (
                <button
                  key={alb.id}
                  type="button"
                  onClick={() => setWorkflowAlbumId(alb.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    workflowAlbumId === alb.id ? 'bg-[#c45a2c] text-white' : 'bg-[#fbf9f5] border border-[#e8e3dc] text-[#242120]'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>{alb.title}</span>
                  <span className="text-[10px] opacity-80">({alb.photoIds.length})</span>
                </button>
              ))}
            </div>

            {/* Candidate photo grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 flex-1">
              {workflowCandidatePhotos.map((p) => {
                const isAlreadyIn = p.inActivePortfolio;
                return (
                  <div
                    key={p.id}
                    className="border border-[#e8e3dc] rounded-xl overflow-hidden bg-[#fbf9f5] flex flex-col justify-between group hover:shadow-md transition-all"
                  >
                    <div className="h-36 relative overflow-hidden bg-black/80">
                      <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {isAlreadyIn && (
                        <span className="absolute top-2 right-2 text-[9px] font-mono bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                          ✓ In Sequence (0{p.plateNumber || '?'})
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-semibold text-[#242120] truncate">{p.title}</div>
                      <div className="text-[10px] font-mono text-[#8a8175] mt-0.5 truncate">{p.camera} · {p.lens}</div>
                      <div className="mt-2.5 pt-2 border-t border-[#e8e3dc] flex items-center justify-between">
                        {isAlreadyIn ? (
                          <button
                            type="button"
                            onClick={() => handleRemovePhotoFromSequence(p.id)}
                            className="text-xs text-red-600 hover:underline cursor-pointer font-medium"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddPhotoToSequence(p)}
                            className="w-full py-1.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add to Sequence</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIVE PUBLIC VIEW / EXHIBITION MODAL (STEP 05) */}
      {showLivePublicView && (
        <div className="fixed inset-0 z-50 bg-[#0e0d0c] text-white overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-20 bg-[#141210]/95 backdrop-blur-md border-b border-[#292420] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#c45a2c] text-white flex items-center justify-center font-bold text-sm">
                L
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#a89e90]">
                  LIVE PUBLIC MONOGRAPH VIEW
                </span>
                <h3 className="font-serif text-sm font-medium text-white">{safeBrief.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLiveLink}
                className="px-3.5 py-1.5 bg-[#292420] hover:bg-[#36302a] text-[#eae5de] rounded-lg text-xs font-mono flex items-center gap-1.5 border border-[#423b34] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#c45a2c]" />
                <span>{copiedLink ? 'Copied Link!' : 'Copy Share Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLivePublicView(false)}
                className="px-3.5 py-1.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Exit Live View
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-12 text-center">
            <div className="inline-block px-3 py-1 rounded-full border border-[#3b3530] text-[#c45a2c] text-[10px] font-mono mb-4">
              EDITORIAL PORTFOLIO PRESENTATION
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl font-light text-white tracking-tight mb-4">
              {safeBrief.title}
            </h1>
            <p className="text-sm font-sans text-[#a89e90] max-w-xl mx-auto mb-12">
              Curated for {safeBrief.targetAudience} · Photography by {currentUser.name} · Studio Edition 2026
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              {activePortfolioPlates.map((p, idx) => (
                <div key={p.id} className="group flex flex-col justify-between">
                  <div className="aspect-4/5 overflow-hidden rounded-xl bg-[#1a1715] border border-[#2e2823] relative">
                    <img
                      src={p.url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {p.isCoverHero && (
                      <span className="absolute top-3 left-3 bg-[#c45a2c] text-white font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Cover Hero Plate
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif text-base text-white">{p.title}</span>
                      <span className="font-mono text-[10px] text-[#8a8175]">PLATE 0{idx + 1}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8a8175] mt-1">
                      {p.camera} · {p.lens} · {p.aperture} · {p.shutter} · ISO {p.iso}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS & AVATAR UPLOAD MODAL */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={onSwitchUser}
        onToast={triggerToast}
      />
    </div>
  );
};
