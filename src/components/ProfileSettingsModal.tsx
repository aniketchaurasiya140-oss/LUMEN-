import React, { useState, useRef } from 'react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { supabase } from '../lib/supabase';
import {
  Camera,
  X,
  Upload,
  RotateCcw,
  ZoomIn,
  Check,
  Shield,
  User as UserIcon,
  Mail,
  FileText
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onToast: (msg: string) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onToast
}) => {
  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser.avatar || '');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onToast('Image size exceeds 10 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setZoomLevel(1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToMonogram = () => {
    setAvatarPreview('');
    setZoomLevel(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onToast('Profile picture reset to monogram initials');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedUser: User = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      title: title.trim() || currentUser.title,
      bio: bio.trim(),
      avatar: avatarPreview
    };

    // 1. Persist to local storage for instant active session retention
    try {
      localStorage.setItem(`lumen_user_profile_${currentUser.id}`, JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    // 2. Persist to Supabase Auth metadata and profiles table if connected
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updatedUser.name,
          title: updatedUser.title,
          bio: updatedUser.bio,
          avatar_url: updatedUser.avatar
        }
      });

      // Try updating public.profiles table if present
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        name: updatedUser.name,
        title: updatedUser.title,
        bio: updatedUser.bio,
        avatar_url: updatedUser.avatar,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      // Non-blocking in offline / preview environments
      console.warn('Cloud profile sync notice:', err);
    }

    onUpdateUser(updatedUser);
    setIsSaving(false);
    onToast('Studio profile and avatar updated successfully!');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#e8e3dc] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e3dc] flex items-center justify-between bg-[#fbf9f5]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f5ede3] text-[#c45a2c] flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-settings-title" className="font-serif text-base font-semibold text-[#242120]">
                Studio Profile & Identity
              </h2>
              <p className="text-xs text-[#8a8175]">
                Manage your master photographer profile, custom portrait, and studio title.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile settings dialog"
            className="text-xs text-[#8a8175] hover:text-[#242120] font-mono px-2 py-1 rounded hover:bg-[#e8e3dc] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Avatar Management Section */}
          <div className="p-4 bg-[#fbf9f5] rounded-xl border border-[#e8e3dc]">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8175] mb-3">
              Profile Portrait & Monogram
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Live Preview */}
              <div className="relative group shrink-0">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#c45a2c]/50 shadow-md bg-[#242120] flex items-center justify-center"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={name}
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="w-full h-full object-cover transition-transform duration-150"
                    />
                  ) : (
                    <UserAvatar name={name} size="xl" className="w-full h-full text-2xl" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#c45a2c] text-white flex items-center justify-center shadow-md hover:bg-[#b04f24] transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload & Monogram Controls */}
              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                <div className="text-xs font-medium text-[#242120]">
                  {avatarPreview ? 'Custom Profile Picture Active' : 'Default Neutral Monogram Initials'}
                </div>
                <p className="text-[11px] text-[#8a8175]">
                  Recommended: High-resolution square portrait (PNG, JPG, WebP) under 10 MB.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#242120] hover:bg-[#3b3634] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Picture</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleResetToMonogram}
                      className="px-3 py-1.5 border border-[#e8e3dc] hover:bg-[#f1ede6] text-[#6e6659] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Use Monogram</span>
                    </button>
                  )}
                </div>

                {/* Framing & Crop Zoom Slider */}
                {avatarPreview && (
                  <div className="pt-2 border-t border-[#e8e3dc]/70">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8a8175] mb-1">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-[#c45a2c]" /> Framing Zoom
                      </span>
                      <span>{Math.round(zoomLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.05"
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                      className="w-full accent-[#c45a2c] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Information Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-fullname" className="block text-xs font-mono uppercase tracking-wider text-[#8a8175] mb-1">
                Full Name / Studio Signature
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#8a8175] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-fullname"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Madhura Dhoke"
                  className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#242120] font-medium focus:outline-none focus:border-[#c45a2c]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-title" className="block text-xs font-mono uppercase tracking-wider text-[#8a8175] mb-1">
                Studio Title & Accreditation
              </label>
              <input
                id="profile-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Photographer & Monograph Author"
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3.5 py-2 text-xs text-[#242120] font-medium focus:outline-none focus:border-[#c45a2c]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8175] mb-1">
                  Studio Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8a8175] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full bg-[#f1ede6] border border-[#e8e3dc] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#6e6659] font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8175] mb-1">
                  Active Security Role
                </label>
                <div className="flex items-center gap-2 h-9 px-3 bg-[#f5ede3] border border-[#e8dacb] rounded-lg text-xs font-semibold text-[#c45a2c]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{currentUser.role} · Full Studio Access</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="profile-bio" className="block text-xs font-mono uppercase tracking-wider text-[#8a8175] mb-1">
                Bio / Curatorial Statement
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief artistic bio, monograph focus, or editorial accolades..."
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg p-3 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e8e3dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e8e3dc] rounded-lg text-xs text-[#6e6659] hover:bg-[#f1ede6] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
