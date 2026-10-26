-- =========================================================================
-- LUMEN PHOTOGRAPHY PORTFOLIO SUITE — MASTER DATABASE SCHEMA & SEED
-- Supabase Project ID: irivkyomfjwsyrnauugg
-- =========================================================================

-- 1. Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'OWNER',
  title TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 2. Categories Table (Dynamic + Preloaded Genres)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. Albums Table
CREATE TABLE IF NOT EXISTS public.albums (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_id TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 4. Photos Table (Master RAW & High-Res Imagery)
CREATE TABLE IF NOT EXISTS public.photos (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  camera TEXT,
  lens TEXT,
  category_id TEXT,
  aperture TEXT,
  shutter TEXT,
  iso TEXT,
  file_size BIGINT DEFAULT 52428800, -- default ~50 MB RAW
  dimensions TEXT,
  shoot TEXT,
  shoot_label TEXT,
  score INTEGER DEFAULT 95,
  is_favorite BOOLEAN DEFAULT FALSE,
  client_status TEXT DEFAULT 'needs_review',
  client_notes TEXT[] DEFAULT '{}',
  in_active_portfolio BOOLEAN DEFAULT FALSE,
  plate_number INTEGER,
  is_cover_hero BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 5. Album Photos Join Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.album_photos (
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  PRIMARY KEY (album_id, photo_id)
);

-- 6. Portfolios / Briefs Table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  purpose TEXT DEFAULT 'job',
  target_audience TEXT DEFAULT 'Recruiter',
  target_count INTEGER DEFAULT 15,
  curation_strategy TEXT,
  candidate_pool_count INTEGER DEFAULT 247,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 7. Portfolio Plates Join Table
CREATE TABLE IF NOT EXISTS public.portfolio_plates (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  match_score INTEGER DEFAULT 95,
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- =========================================================================
-- Enable Row Level Security (RLS) & Policies
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_plates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on albums" ON public.albums;
CREATE POLICY "Allow all on albums" ON public.albums FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on photos" ON public.photos;
CREATE POLICY "Allow all on photos" ON public.photos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on album_photos" ON public.album_photos;
CREATE POLICY "Allow all on album_photos" ON public.album_photos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on portfolios" ON public.portfolios;
CREATE POLICY "Allow all on portfolios" ON public.portfolios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on portfolio_plates" ON public.portfolio_plates;
CREATE POLICY "Allow all on portfolio_plates" ON public.portfolio_plates FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- Seed Categories (13 Genres: Original 3 + 10 Expanded)
-- =========================================================================

INSERT INTO public.categories (id, name) VALUES
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
ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- Seed Master Photographs
-- =========================================================================

INSERT INTO public.photos (
  id, title, url, camera, lens, category_id, aperture, shutter, iso, dimensions, file_size, shoot, shoot_label, score, is_favorite, client_status, client_notes, in_active_portfolio, plate_number, is_cover_hero
) VALUES
  (
    'p-01', 'Monolith & Scaffolding — Carrara Light',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    'Leica M11', 'Noctilux-M 50mm f/0.95', 'cat-fashion', 'f/1.4', '1/1000s', '64', '9528 × 6328', 52428800,
    'fashion', 'Autumn Couture & Runway', 99, TRUE, 'selected', ARRAY['Sublime architectural framing and drapery fall. Must be hero plate.'], TRUE, 1, TRUE
  ),
  (
    'p-02', 'Brutalist Flâneur — Charcoal Wool',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
    'Hasselblad X2D 100C', 'XCD 55mm f/2.5 V', 'cat-fashion', 'f/2.8', '1/800s', '100', '11656 × 8742', 89128960,
    'fashion', 'Autumn Couture & Runway', 97, TRUE, 'selected', ARRAY['Texture on wool is exceptional. High tonal depth.'], TRUE, 2, FALSE
  ),
  (
    'p-03', 'Profile in Chiaroscuro',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V', 'FE 85mm f/1.4 GM II', 'cat-portrait', 'f/1.4', '1/500s', '100', '9504 × 6336', 62914560,
    'fashion', 'Autumn Couture & Runway', 98, TRUE, 'selected', ARRAY['Rembrandt lighting angle works marvelously.'], TRUE, 3, FALSE
  ),
  (
    'p-04', 'Studio Chiaroscuro Portrait',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V', 'FE 50mm f/1.2 GM', 'cat-portrait', 'f/2.0', '1/640s', '100', '9504 × 6336', 61865984,
    'fashion', 'Autumn Couture & Runway', 94, FALSE, 'selected', ARRAY[]::TEXT[], TRUE, 4, FALSE
  ),
  (
    'p-05', 'Studio Light Elena V. (Near Duplicate)',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V', 'FE 50mm f/1.2 GM', 'cat-portrait', 'f/2.0', '1/640s', '100', '9504 × 6336', 61341696,
    'fashion', 'Autumn Couture & Runway', 91, FALSE, 'needs_review', ARRAY['Check similarity against Plate 04. Consider environmental wide.'], TRUE, 5, FALSE
  ),
  (
    'p-06', 'Bridal Preparation Window Spill',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V', 'FE 50mm f/1.2 GM', 'cat-wedding', 'f/1.4', '1/500s', '100', '9504 × 6336', 65011712,
    'wedding', 'Sharma & Mehta Ceremony', 98, TRUE, 'selected', ARRAY['Mother of the bride loved the backlighting here.'], TRUE, 6, FALSE
  ),
  (
    'p-07', 'Palace Colonnade Golden Hour',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V', 'FE 85mm f/1.4 GM II', 'cat-wedding', 'f/1.4', '1/1000s', '100', '9504 × 6336', 66060288,
    'wedding', 'Sharma & Mehta Ceremony', 99, TRUE, 'selected', ARRAY['Full spread recommendation for central album page.'], TRUE, 7, FALSE
  ),
  (
    'p-08', 'Raw Tweed Weave Macro',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
    'Canon EOS R5', 'RF 100mm f/2.8L Macro', 'cat-still-life', 'f/5.6', '1/250s', '100', '8192 × 5464', 49283072,
    'fashion', 'Autumn Couture & Runway', 92, FALSE, 'needs_review', ARRAY[]::TEXT[], TRUE, 8, FALSE
  ),
  (
    'p-09', 'Brutalist Concrete Pavilion Shadows',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    'Hasselblad X2D 100C', 'XCD 38mm f/2.5 V', 'cat-arch', 'f/8.0', '1/400s', '64', '11656 × 8742', 91226112,
    'arch', 'Urban Geometries & Brutalism', 96, TRUE, 'selected', ARRAY[]::TEXT[], TRUE, 9, FALSE
  ),
  (
    'p-10', 'Silk Organza in Wind Tunnel',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85',
    'Leica M11', 'Summilux-M 35mm f/1.4', 'cat-fine-art', 'f/1.4', '1/2000s', '125', '9528 × 6328', 53477376,
    'fashion', 'Autumn Couture & Runway', 97, FALSE, 'selected', ARRAY[]::TEXT[], TRUE, 10, FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  score = EXCLUDED.score,
  is_favorite = EXCLUDED.is_favorite,
  client_status = EXCLUDED.client_status;

-- =========================================================================
-- Seed Initial Albums & Map Photos
-- =========================================================================

INSERT INTO public.albums (id, title, description, cover_image_id, cover_url) VALUES
  ('alb-01', 'Autumn Paris Couture & Monograph', 'High-contrast monochrome plates for European fashion edition.', 'p-01', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85'),
  ('alb-02', 'Sharma & Mehta Royal Wedding — Udaipur', 'Palace Colonnade golden hour ceremony and private client proofing suite.', 'p-07', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85'),
  ('alb-03', 'Brutalist Geometries & Concrete Pavilion', 'Architectural shadows, textured facades, and spatial studies.', 'p-09', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.album_photos (album_id, photo_id) VALUES
  ('alb-01', 'p-01'), ('alb-01', 'p-02'), ('alb-01', 'p-03'), ('alb-01', 'p-04'), ('alb-01', 'p-05'), ('alb-01', 'p-08'), ('alb-01', 'p-10'),
  ('alb-02', 'p-06'), ('alb-02', 'p-07'),
  ('alb-03', 'p-02'), ('alb-03', 'p-09')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- Seed Active Portfolio Brief
-- =========================================================================

INSERT INTO public.portfolios (
  id, title, purpose, target_audience, target_count, curation_strategy, candidate_pool_count, updated_at
) VALUES (
  'brief-main', 'Fashion Photography Internship (Aarav Patel)', 'job', 'Recruiter', 15,
  'For a fashion recruiter brief, we recommend establishing a strong architectural opener, followed by high-contrast chiaroscuro character studies, intercut with tactile macro fabric details to demonstrate versatility.',
  247, NOW()
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- =========================================================================
-- Supabase Storage Bucket Configuration
-- Optional query to initialize bucket 'lumen-raw-vault'
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lumen-raw-vault', 'lumen-raw-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public storage read" ON storage.objects;
CREATE POLICY "Public storage read" ON storage.objects FOR SELECT USING (bucket_id = 'lumen-raw-vault');

DROP POLICY IF EXISTS "Public storage insert" ON storage.objects;
CREATE POLICY "Public storage insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lumen-raw-vault');
