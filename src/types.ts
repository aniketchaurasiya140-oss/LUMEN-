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

export interface Photo {
  id: string;
  title: string;
  url: string;
  camera: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
  dimensions: string;
  shoot: 'fashion' | 'wedding' | 'arch' | 'editorial' | 'commercial';
  shootLabel: string;
  score: number;
  isFavorite?: boolean;
  clientStatus?: 'selected' | 'needs_review' | 'rejected';
  clientNotes?: string[];
  inActivePortfolio?: boolean;
  plateNumber?: number;
  isCoverHero?: boolean;
}

export type ScreenId =
  | 'dashboard'
  | 'library'
  | 'brief'
  | 'suggestions'
  | 'editor'
  | 'health'
  | 'preview'
  | 'proofing'
  | 'collaborators';

export interface PortfolioBrief {
  title: string;
  purpose: 'job' | 'client';
  targetAudience: 'Recruiter' | 'Client' | 'Agency';
  targetCount: number;
  curationStrategy: string;
  candidatePoolCount: number;
}
