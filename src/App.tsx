/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Photo, Role } from './types';
import { USERS, INITIAL_PHOTOS } from './data/mockData';
import { LoginPage } from './components/LoginPage';
import { StudioWorkspace } from './components/StudioWorkspace';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { supabase, SUPABASE_PROJECT_ID } from './lib/supabase';
import { supabaseService, SupabaseHealthStatus } from './services/supabaseService';
import { KeyRound, Shield, Database, Cloud } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthStatus | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // 1. Initial Health Check, Data Loading & Realtime Subscription
  useEffect(() => {
    checkHealthAndLoadData();

    // Listen to Supabase Auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !currentUser) {
        const email = session.user.email || '';
        const name =
          session.user.user_metadata?.full_name || email.split('@')[0].toUpperCase();
        const role: Role = (session.user.user_metadata?.role as Role) || 'OWNER';

        setCurrentUser({
          id: session.user.id,
          name,
          email,
          role,
          title: 'Authenticated Studio Photographer',
          avatar:
            session.user.user_metadata?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          studioRoleLabel: `${role} (Supabase Auth)`
        });
      }
    });

    // Realtime postgres changes subscription
    const unsubscribeRealtime = supabaseService.subscribeToPhotos(async () => {
      const { photos: livePhotos } = await supabaseService.getPhotos();
      if (livePhotos && livePhotos.length > 0) {
        setPhotos(livePhotos);
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeRealtime();
    };
  }, []);

  const checkHealthAndLoadData = async () => {
    const health = await supabaseService.checkHealth();
    setSupabaseHealth(health);

    if (health.isConnected && health.tableExists) {
      const { photos: dbPhotos, error } = await supabaseService.getPhotos();
      if (!error && dbPhotos && dbPhotos.length > 0) {
        setPhotos(dbPhotos);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Ignore
    }
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
  };

  const handleSeedDatabase = (seededPhotos: Photo[]) => {
    setPhotos(seededPhotos);
  };

  return (
    <div className="relative min-h-screen bg-[#141211] font-sans antialiased text-[#242120]">
      {/* Main View Router */}
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
          supabaseHealth={supabaseHealth}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />
      )}

      {/* Supabase Schema & Sync Management Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        health={supabaseHealth}
        onRefreshHealth={checkHealthAndLoadData}
        onSeedDatabase={handleSeedDatabase}
        photos={photos}
      />

      {/* Floating State Indicator / Quick Preview Switcher */}
      <div className="fixed bottom-3 right-3 z-40 bg-[#1e1a17]/95 backdrop-blur-md border border-[#3b332d] rounded-full pl-3 pr-2 py-1.5 shadow-xl flex items-center gap-2 text-[11px] font-mono text-[#dcd2c4]">
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          title="Open Supabase Cloud Settings"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        <span className="text-[#524942]">|</span>

        {currentUser ? (
          <span className="font-semibold text-emerald-300 truncate max-w-[120px]">
            {currentUser.name.split(' ')[0]} ({currentUser.role})
          </span>
        ) : (
          <span className="font-semibold text-amber-300">Login View</span>
        )}

        <button
          onClick={() => {
            if (currentUser) {
              handleLogout();
            } else {
              handleLogin(USERS.OWNER);
            }
          }}
          className="ml-1 text-[10px] bg-[#332c25] hover:bg-[#473e35] px-2 py-0.5 rounded text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <KeyRound className="w-3 h-3 text-[#c45a2c]" />
          <span>{currentUser ? 'Show Login' : 'Quick Demo'}</span>
        </button>
      </div>
    </div>
  );
}
