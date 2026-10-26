import { createClient } from '@supabase/supabase-js';
import { Photo } from '../types';

export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || 'irivkyomfjwsyrnauugg';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://irivkyomfjwsyrnauugg.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXZreW9tZmp3c3lybmF1dWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NDEyNTIsImV4cCI6MjEwODUxNzI1Mn0.NkARBMotwF8qSgB6f1GYN_x0Z21nw_Lmp8TUrkzjlDg';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const SQL_SCHEMA_SCRIPT = `-- ========================================================
-- LUMEN PHOTOGRAPHY PORTFOLIO SUITE - SUPABASE DATABASE SCHEMA & ENTRIES
-- Project ID: irivkyomfjwsyrnauugg
-- ========================================================

-- 1. Create Photos Table for Master RAW Archive
create table if not exists public.photos (
  id text primary key,
  title text not null,
  url text not null,
  camera text,
  lens text,
  aperture text,
  shutter text,
  iso text,
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

-- 2. Create Portfolios / Curation Briefs Table
create table if not exists public.portfolios (
  id text primary key,
  title text not null,
  purpose text default 'job',
  target_audience text default 'Recruiter',
  target_count integer default 15,
  curation_strategy text,
  candidate_pool_count integer default 247,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.photos enable row level security;
alter table public.portfolios enable row level security;

-- 4. Create Open Access Policies for Studio Preview & Client Proofing
drop policy if exists "Allow full photo access for anon and authenticated" on public.photos;
create policy "Allow full photo access for anon and authenticated"
  on public.photos for all using (true) with check (true);

drop policy if exists "Allow full portfolio access for anon and authenticated" on public.portfolios;
create policy "Allow full portfolio access for anon and authenticated"
  on public.portfolios for all using (true) with check (true);

-- 5. Seed Initial Master Photography Plates
insert into public.photos (id, title, url, camera, lens, aperture, shutter, iso, dimensions, shoot, shoot_label, score, is_favorite, client_status, client_notes, in_active_portfolio, plate_number, is_cover_hero) values
  ('p-01', 'Monolith & Scaffolding — Carrara Light', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85', 'Leica M11', 'Noctilux-M 50mm f/0.95', 'f/1.4', '1/1000s', '64', '9528 × 6328', 'fashion', 'Autumn Couture & Runway', 99, true, 'selected', array['Sublime architectural framing and drapery fall. Must be hero plate.'], true, 1, true),
  ('p-02', 'Brutalist Flâneur — Charcoal Wool', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85', 'Hasselblad X2D 100C', 'XCD 55mm f/2.5 V', 'f/2.8', '1/800s', '100', '11656 × 8742', 'fashion', 'Autumn Couture & Runway', 97, true, 'selected', array['Texture on wool is exceptional. High tonal depth.'], true, 2, false),
  ('p-03', 'Profile in Chiaroscuro', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85', 'Sony A7R V', 'FE 85mm f/1.4 GM II', 'f/1.4', '1/500s', '100', '9504 × 6336', 'fashion', 'Autumn Couture & Runway', 98, true, 'selected', array['Rembrandt lighting angle works marvelously.'], true, 3, false),
  ('p-04', 'Studio Chiaroscuro Portrait', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85', 'Sony A7R V', 'FE 50mm f/1.2 GM', 'f/2.0', '1/640s', '100', '9504 × 6336', 'fashion', 'Autumn Couture & Runway', 94, false, 'selected', array[]::text[], true, 4, false),
  ('p-05', 'Studio Light Elena V. (Near Duplicate)', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85', 'Sony A7R V', 'FE 50mm f/1.2 GM', 'f/2.0', '1/640s', '100', '9504 × 6336', 'fashion', 'Autumn Couture & Runway', 91, false, 'needs_review', array['Check similarity against Plate 04. Consider environmental wide.'], true, 5, false),
  ('p-06', 'Bridal Preparation Window Spill', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85', 'Sony A7R V', 'FE 50mm f/1.2 GM', 'f/1.4', '1/500s', '100', '9504 × 6336', 'wedding', 'Sharma & Mehta Ceremony', 98, true, 'selected', array['Mother of the bride loved the backlighting here.'], true, 6, false),
  ('p-07', 'Palace Colonnade Golden Hour', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85', 'Sony A7R V', 'FE 85mm f/1.4 GM II', 'f/1.4', '1/1000s', '100', '9504 × 6336', 'wedding', 'Sharma & Mehta Ceremony', 99, true, 'selected', array['Full spread recommendation for central album page.'], true, 7, false),
  ('p-08', 'Raw Tweed Weave Macro', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85', 'Canon EOS R5', 'RF 100mm f/2.8L Macro', 'f/5.6', '1/250s', '100', '8192 × 5464', 'fashion', 'Autumn Couture & Runway', 92, false, 'needs_review', array[]::text[], true, 8, false),
  ('p-09', 'Brutalist Concrete Pavilion Shadows', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85', 'Hasselblad X2D 100C', 'XCD 38mm f/2.5 V', 'f/8.0', '1/400s', '64', '11656 × 8742', 'arch', 'Urban Geometries & Brutalism', 96, true, 'selected', array[]::text[], true, 9, false),
  ('p-10', 'Silk Organza in Wind Tunnel', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85', 'Leica M11', 'Summilux-M 35mm f/1.4', 'f/1.4', '1/2000s', '125', '9528 × 6328', 'fashion', 'Autumn Couture & Runway', 97, false, 'selected', array[]::text[], true, 10, false)
on conflict (id) do update set
  title = excluded.title,
  url = excluded.url,
  score = excluded.score,
  is_favorite = excluded.is_favorite,
  client_status = excluded.client_status;

-- 6. Seed Active Portfolio Brief
insert into public.portfolios (id, title, purpose, target_audience, target_count, curation_strategy, candidate_pool_count, updated_at) values
  ('brief-main', 'Fashion Photography Internship (Aarav Patel)', 'job', 'Recruiter', 15, 'For a fashion recruiter brief, we recommend establishing a strong architectural opener, followed by high-contrast chiaroscuro character studies, intercut with tactile macro fabric details to demonstrate versatility.', 247, now())
on conflict (id) do update set
  title = excluded.title;
`;

export interface SupabasePhotoRow {
  id: string;
  title: string;
  url: string;
  camera: string | null;
  lens: string | null;
  aperture: string | null;
  shutter: string | null;
  iso: string | null;
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
export function mapRowToPhoto(row: SupabasePhotoRow): Photo {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    camera: row.camera || 'Leica M11',
    lens: row.lens || '50mm f/1.4',
    aperture: row.aperture || 'f/1.4',
    shutter: row.shutter || '1/1000s',
    iso: row.iso || '100',
    dimensions: row.dimensions || '9528 × 6328',
    shoot: (row.shoot as any) || 'fashion',
    shootLabel: row.shoot_label || 'Autumn Couture & Runway',
    score: row.score ?? 95,
    isFavorite: !!row.is_favorite,
    clientStatus: (row.client_status as any) || 'needs_review',
    clientNotes: row.client_notes || [],
    inActivePortfolio: !!row.in_active_portfolio,
    plateNumber: row.plate_number || undefined,
    isCoverHero: !!row.is_cover_hero
  };
}

// Convert frontend Photo model to Supabase database row
export function mapPhotoToRow(photo: Photo): SupabasePhotoRow {
  return {
    id: photo.id,
    title: photo.title,
    url: photo.url,
    camera: photo.camera,
    lens: photo.lens,
    aperture: photo.aperture,
    shutter: photo.shutter,
    iso: photo.iso,
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
