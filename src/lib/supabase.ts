import { createClient } from '@supabase/supabase-js';
import { Photo, Category, Album } from '../types';

export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || 'irivkyomfjwsyrnauugg';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://irivkyomfjwsyrnauugg.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXZreW9tZmp3c3lybmF1dWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NDEyNTIsImV4cCI6MjEwODUxNzI1Mn0.NkARBMotwF8qSgB6f1GYN_x0Z21nw_Lmp8TUrkzjlDg';

export const STORAGE_BUCKET_NAME = 'lumen-raw-vault';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const SQL_SCHEMA_SCRIPT = `-- ========================================================
-- LUMEN PHOTOGRAPHY PORTFOLIO SUITE — FULL DYNAMIC SCHEMA & SEED
-- Project ID: irivkyomfjwsyrnauugg
-- ========================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id text primary key,
  email text not null,
  name text not null,
  role text default 'OWNER',
  title text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories Table
create table if not exists public.categories (
  id text primary key,
  user_id text,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Albums Table
create table if not exists public.albums (
  id text primary key,
  user_id text,
  title text not null,
  description text,
  cover_image_id text,
  cover_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Photos Table (RAW & Master Imagery)
create table if not exists public.photos (
  id text primary key,
  user_id text,
  title text not null,
  url text not null,
  camera text,
  lens text,
  category_id text,
  aperture text,
  shutter text,
  iso text,
  file_size bigint default 52428800,
  dimensions text,
  shoot text,
  shoot_label text,
  score integer default 95,
  is_favorite boolean default false,
  client_status text default 'needs_review',
  client_notes text[] default '{}',
  in_active_portfolio boolean default false,
  plate_number integer,
  is_cover_hero boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Album Photos Join Table
create table if not exists public.album_photos (
  album_id text not null references public.albums(id) on delete cascade,
  photo_id text not null references public.photos(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (album_id, photo_id)
);

-- 6. Portfolios / Briefs Table
create table if not exists public.portfolios (
  id text primary key,
  user_id text,
  title text not null,
  purpose text default 'job',
  target_audience text default 'Recruiter',
  target_count integer default 15,
  curation_strategy text,
  candidate_pool_count integer default 247,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Portfolio Plates Join Table
create table if not exists public.portfolio_plates (
  id text primary key,
  portfolio_id text not null references public.portfolios(id) on delete cascade,
  photo_id text not null references public.photos(id) on delete cascade,
  sequence_order integer not null,
  is_cover boolean default false,
  match_score integer default 95,
  rationale text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS & Policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.album_photos enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_plates enable row level security;

create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all on categories" on public.categories for all using (true) with check (true);
create policy "Allow all on albums" on public.albums for all using (true) with check (true);
create policy "Allow all on photos" on public.photos for all using (true) with check (true);
create policy "Allow all on album_photos" on public.album_photos for all using (true) with check (true);
create policy "Allow all on portfolios" on public.portfolios for all using (true) with check (true);
create policy "Allow all on portfolio_plates" on public.portfolio_plates for all using (true) with check (true);

-- Seed Categories (13 Genres)
insert into public.categories (id, name) values
  ('cat-fashion', 'Fashion & Runway'),
  ('cat-wedding', 'Wedding & Ceremony'),
  ('cat-arch', 'Urban & Architecture'),
  ('cat-portrait', 'Editorial & Portraiture'),
  ('cat-fine-art', 'Fine Art & Monograph'),
  ('cat-landscape', 'Landscape & Environmental'),
  ('cat-street', 'Street & Documentary'),
  ('cat-still-life', 'Still Life & Product'),
  ('cat-commercial', 'Commercial & Campaign'),
  ('cat-interior', 'Architectural & Interior'),
  ('cat-photojournalism', 'Photojournalism & Storytelling'),
  ('cat-wildlife', 'Wildlife & Nature Conservation'),
  ('cat-conceptual', 'Experimental & Conceptual')
on conflict (name) do nothing;
`;

export interface SupabasePhotoRow {
  id: string;
  user_id?: string | null;
  title: string;
  url: string;
  camera: string | null;
  lens: string | null;
  category_id?: string | null;
  aperture: string | null;
  shutter: string | null;
  iso: string | null;
  file_size?: number | null;
  dimensions: string | null;
  shoot: string | null;
  shoot_label: string | null;
  score: number | null;
  is_favorite: boolean | null;
  client_status: string | null;
  client_notes: string[] | null;
  in_active_portfolio: boolean | null;
  plate_number: number | null;
  is_cover_hero: boolean | null;
  created_at?: string;
}

// Convert Supabase database row to frontend Photo model
export function mapRowToPhoto(row: SupabasePhotoRow, categoryName?: string): Photo {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    url: row.url,
    camera: row.camera || 'Leica M11',
    lens: row.lens || '50mm f/1.4',
    categoryId: row.category_id || undefined,
    categoryName: categoryName || undefined,
    aperture: row.aperture || 'f/1.4',
    shutter: row.shutter || '1/1000s',
    iso: row.iso || '100',
    fileSize: row.file_size || 52428800,
    dimensions: row.dimensions || '9528 × 6328',
    shoot: row.shoot || 'fashion',
    shootLabel: row.shoot_label || 'Autumn Couture & Runway',
    score: row.score ?? 95,
    isFavorite: !!row.is_favorite,
    clientStatus: (row.client_status as any) || 'needs_review',
    clientNotes: row.client_notes || [],
    inActivePortfolio: !!row.in_active_portfolio,
    plateNumber: row.plate_number || undefined,
    isCoverHero: !!row.is_cover_hero,
    createdAt: row.created_at
  };
}

// Convert frontend Photo model to Supabase database row
export function mapPhotoToRow(photo: Photo): SupabasePhotoRow {
  return {
    id: photo.id,
    user_id: photo.userId || null,
    title: photo.title,
    url: photo.url,
    camera: photo.camera,
    lens: photo.lens,
    category_id: photo.categoryId || null,
    aperture: photo.aperture,
    shutter: photo.shutter,
    iso: photo.iso,
    file_size: photo.fileSize || 52428800,
    dimensions: photo.dimensions,
    shoot: photo.shoot,
    shoot_label: photo.shootLabel,
    score: photo.score,
    is_favorite: photo.isFavorite ?? false,
    client_status: photo.clientStatus ?? 'needs_review',
    client_notes: photo.clientNotes ?? [],
    in_active_portfolio: photo.inActivePortfolio ?? false,
    plate_number: photo.plateNumber ?? null,
    is_cover_hero: photo.isCoverHero ?? false
  };
}
