/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Photo, Role, Category, Album, PortfolioBrief } from './types';
import { USERS, INITIAL_PHOTOS, INITIAL_CATEGORIES, INITIAL_ALBUMS, INITIAL_BRIEF } from './data/mockData';
import { LoginPage } from './components/LoginPage';
import { StudioWorkspace } from './components/StudioWorkspace';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { supabase, SUPABASE_PROJECT_ID } from './lib/supabase';
import { supabaseService, SupabaseHealthStatus } from './services/supabaseService';
import { KeyRound, Shield, Database, Cloud } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [brief, setBrief] = useState<PortfolioBrief | null>(null);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthStatus | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // 1. Initial Health Check & Supabase Auth Listener
  useEffect(() => {
    supabaseService.checkHealth().then(setSupabaseHealth);

    // Listen to Supabase Auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && !currentUser) {
        const email = session.user.email || '';
        const name =
          session.user.user_metadata?.full_name || email.split('@')[0].toUpperCase();
        const role: Role = (session.user.user_metadata?.role as Role) || 'OWNER';

        let savedAvatar = session.user.user_metadata?.avatar_url || '';
        try {
          const cached = localStorage.getItem(`lumen_user_profile_${session.user.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.avatar) savedAvatar = parsed.avatar;
          }
        } catch (e) {
          // Ignore
        }

        const authenticatedUser: User = {
          id: session.user.id,
          name,
          email,
          role,
          title: role === 'OWNER' ? 'Studio Founder & Master Photographer' : 'Studio Member',
          avatar: savedAvatar, // Clean neutral monogram by default
          studioRoleLabel: role === 'OWNER' ? 'Studio Owner' : `${role}`
        };

        setCurrentUser(authenticatedUser);
        await loadUserData(authenticatedUser.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    // 1. Load Photos strictly for this user (with automatic sample template cloning for new accounts)
    const { photos: userPhotos } = await supabaseService.getPhotos(userId);
    setPhotos(userPhotos);

    // 2. Load Categories
    const { categories: dbCategories } = await supabaseService.getCategories();
    setCategories(dbCategories);

    // 3. Load Albums strictly for this user
    const { albums: userAlbums } = await supabaseService.getAlbums(userPhotos, userId);
    setAlbums(userAlbums);

    // 4. Load Brief strictly for this user
    const { brief: userBrief } = await supabaseService.getBrief(userId);
    setBrief(userBrief);
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    await loadUserData(user.id);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Ignore
    }
    try {
      sessionStorage.clear();
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('sb-') || k.startsWith('lumen_session')) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      // Ignore
    }
    setCurrentUser(null);
    setPhotos([]);
    setAlbums([]);
    setBrief(null);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    loadUserData(user.id);
  };

  const handleSeedDatabase = (seededPhotos: Photo[]) => {
    setPhotos(seededPhotos);
  };

  // Callback to add new category with duplicate validation
  const handleAddCategory = async (categoryName: string): Promise<{ success: boolean; error?: string; category?: Category }> => {
    const res = await supabaseService.createCategory(categoryName, categories, currentUser?.id);
    if (res.category) {
      setCategories((prev) => [...prev, res.category!]);
      return { success: true, category: res.category };
    }
    return { success: false, error: res.error || 'Failed to create category' };
  };

  return (
    <div className="relative min-h-screen bg-[#141211] font-sans antialiased text-[#242120]">
      {/* Main View Router: Strictly Login Page first when unauthenticated */}
      {!currentUser ? (
        <LoginPage
          onLogin={handleLogin}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          supabaseConnected={supabaseHealth?.isConnected ?? true}
        />
      ) : (
        <StudioWorkspace
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          photos={photos}
          setPhotos={setPhotos}
          categories={categories}
          setCategories={setCategories}
          albums={albums}
          setAlbums={setAlbums}
          brief={brief}
          setBrief={setBrief}
          onAddCategory={handleAddCategory}
          supabaseHealth={supabaseHealth}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />
      )}

      {/* Cloud Vault Schema & Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        health={supabaseHealth}
        onRefreshHealth={() => currentUser && loadUserData(currentUser.id)}
        onSeedDatabase={handleSeedDatabase}
        photos={photos}
      />
    </div>
  );
}
