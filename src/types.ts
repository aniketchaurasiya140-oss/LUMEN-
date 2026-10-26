export type Role = 'OWNER' | 'EDITOR' | 'CLIENT' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar: string;
  studioRoleLabel: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  userId?: string | null;
  createdAt?: string;
  isCustom?: boolean;
}

export interface Album {
  id: string;
  userId?: string | null;
  title: string;
  description?: string;
  coverImageId?: string;
  coverUrl?: string;
  photoIds: string[];
  createdAt: string;
}

export interface Photo {
  id: string;
  userId?: string | null;
  title: string;
  url: string; // Storage public URL or high-res source
  camera: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
  dimensions: string;
  fileSize?: number; // In bytes (e.g. 48200000 for 48.2 MB)
  categoryId?: string;
  categoryName?: string;
  shoot: string; // e.g. 'fashion', 'wedding', 'arch', 'portrait', etc.
  shootLabel: string;
  score: number;
  isFavorite?: boolean;
  clientStatus?: 'selected' | 'needs_review' | 'rejected' | 'changes_requested';
  clientNotes?: string[];
  inActivePortfolio?: boolean;
  plateNumber?: number;
  isCoverHero?: boolean;
  createdAt?: string;
}

export interface PortfolioPlate {
  id: string;
  photoId: string;
  portfolioId: string;
  sequenceOrder: number;
  isCover: boolean;
  matchScore: number;
  rationale?: string;
  photo?: Photo;
}

export type ScreenId =
  | 'dashboard'
  | 'library'
  | 'brief'
  | 'suggestions'
  | 'editor'
  | 'health'
  | 'preview'
  | 'proofing';

export interface PortfolioBrief {
  id?: string;
  userId?: string;
  title: string;
  purpose: 'job' | 'client';
  targetAudience: 'Recruiter' | 'Client' | 'Agency';
  targetCount: number;
  curationStrategy: string;
  candidatePoolCount: number;
  status?: 'draft' | 'published';
  selectedAlbumId?: string | null;
  updatedAt?: string;
}

export interface HealthAuditAdvisory {
  id: string;
  type: 'duplicate' | 'pacing' | 'anchor' | 'density' | 'aspect_ratio';
  severity: 'good' | 'advisory' | 'warning';
  title: string;
  description: string;
  actionLabel?: string;
  resolved: boolean;
  affectedPlateIds?: string[];
}
