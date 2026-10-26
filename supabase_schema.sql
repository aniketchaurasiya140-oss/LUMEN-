-- =========================================================================
-- LUMEN PHOTOGRAPHY PORTFOLIO SUITE - SUPABASE COMPLETE DDL & SEED SCRIPT
-- Supabase Project ID: irivkyomfjwsyrnauugg
-- =========================================================================

-- 1. Create Photos Table
CREATE TABLE IF NOT EXISTS public.photos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  camera TEXT,
  lens TEXT,
  aperture TEXT,
  shutter TEXT,
  iso TEXT,
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

-- 2. Create Portfolios / Curation Briefs Table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  purpose TEXT DEFAULT 'job',
  target_audience TEXT DEFAULT 'Recruiter',
  target_count INTEGER DEFAULT 15,
  curation_strategy TEXT,
  candidate_pool_count INTEGER DEFAULT 247,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Public Anon & Authenticated Access
DROP POLICY IF EXISTS "Allow full photo access for anon and authenticated" ON public.photos;
CREATE POLICY "Allow full photo access for anon and authenticated"
  ON public.photos
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full portfolio access for anon and authenticated" ON public.portfolios;
CREATE POLICY "Allow full portfolio access for anon and authenticated"
  ON public.portfolios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Seed Entries into public.photos Table
INSERT INTO public.photos (
  id,
  title,
  url,
  camera,
  lens,
  aperture,
  shutter,
  iso,
  dimensions,
  shoot,
  shoot_label,
  score,
  is_favorite,
  client_status,
  client_notes,
  in_active_portfolio,
  plate_number,
  is_cover_hero
) VALUES
  (
    'p-01',
    'Monolith & Scaffolding — Carrara Light',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    'Leica M11',
    'Noctilux-M 50mm f/0.95',
    'f/1.4',
    '1/1000s',
    '64',
    '9528 × 6328',
    'fashion',
    'Autumn Couture & Runway',
    99,
    TRUE,
    'selected',
    ARRAY['Sublime architectural framing and drapery fall. Must be hero plate.'],
    TRUE,
    1,
    TRUE
  ),
  (
    'p-02',
    'Brutalist Flâneur — Charcoal Wool',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
    'Hasselblad X2D 100C',
    'XCD 55mm f/2.5 V',
    'f/2.8',
    '1/800s',
    '100',
    '11656 × 8742',
    'fashion',
    'Autumn Couture & Runway',
    97,
    TRUE,
    'selected',
    ARRAY['Texture on wool is exceptional. High tonal depth.'],
    TRUE,
    2,
    FALSE
  ),
  (
    'p-03',
    'Profile in Chiaroscuro',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V',
    'FE 85mm f/1.4 GM II',
    'f/1.4',
    '1/500s',
    '100',
    '9504 × 6336',
    'fashion',
    'Autumn Couture & Runway',
    98,
    TRUE,
    'selected',
    ARRAY['Rembrandt lighting angle works marvelously.'],
    TRUE,
    3,
    FALSE
  ),
  (
    'p-04',
    'Studio Chiaroscuro Portrait',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V',
    'FE 50mm f/1.2 GM',
    'f/2.0',
    '1/640s',
    '100',
    '9504 × 6336',
    'fashion',
    'Autumn Couture & Runway',
    94,
    FALSE,
    'selected',
    ARRAY[]::TEXT[],
    TRUE,
    4,
    FALSE
  ),
  (
    'p-05',
    'Studio Light Elena V. (Near Duplicate)',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V',
    'FE 50mm f/1.2 GM',
    'f/2.0',
    '1/640s',
    '100',
    '9504 × 6336',
    'fashion',
    'Autumn Couture & Runway',
    91,
    FALSE,
    'needs_review',
    ARRAY['Check similarity against Plate 04. Consider environmental wide.'],
    TRUE,
    5,
    FALSE
  ),
  (
    'p-06',
    'Bridal Preparation Window Spill',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V',
    'FE 50mm f/1.2 GM',
    'f/1.4',
    '1/500s',
    '100',
    '9504 × 6336',
    'wedding',
    'Sharma & Mehta Ceremony',
    98,
    TRUE,
    'selected',
    ARRAY['Mother of the bride loved the backlighting here.'],
    TRUE,
    6,
    FALSE
  ),
  (
    'p-07',
    'Palace Colonnade Golden Hour',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    'Sony A7R V',
    'FE 85mm f/1.4 GM II',
    'f/1.4',
    '1/1000s',
    '100',
    '9504 × 6336',
    'wedding',
    'Sharma & Mehta Ceremony',
    99,
    TRUE,
    'selected',
    ARRAY['Full spread recommendation for central album page.'],
    TRUE,
    7,
    FALSE
  ),
  (
    'p-08',
    'Raw Tweed Weave Macro',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
    'Canon EOS R5',
    'RF 100mm f/2.8L Macro',
    'f/5.6',
    '1/250s',
    '100',
    '8192 × 5464',
    'fashion',
    'Autumn Couture & Runway',
    92,
    FALSE,
    'needs_review',
    ARRAY[]::TEXT[],
    TRUE,
    8,
    FALSE
  ),
  (
    'p-09',
    'Brutalist Concrete Pavilion Shadows',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    'Hasselblad X2D 100C',
    'XCD 38mm f/2.5 V',
    'f/8.0',
    '1/400s',
    '64',
    '11656 × 8742',
    'arch',
    'Urban Geometries & Brutalism',
    96,
    TRUE,
    'selected',
    ARRAY[]::TEXT[],
    TRUE,
    9,
    FALSE
  ),
  (
    'p-10',
    'Silk Organza in Wind Tunnel',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85',
    'Leica M11',
    'Summilux-M 35mm f/1.4',
    'f/1.4',
    '1/2000s',
    '125',
    '9528 × 6328',
    'fashion',
    'Autumn Couture & Runway',
    97,
    FALSE,
    'selected',
    ARRAY[]::TEXT[],
    TRUE,
    10,
    FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  camera = EXCLUDED.camera,
  lens = EXCLUDED.lens,
  aperture = EXCLUDED.aperture,
  shutter = EXCLUDED.shutter,
  iso = EXCLUDED.iso,
  dimensions = EXCLUDED.dimensions,
  shoot = EXCLUDED.shoot,
  shoot_label = EXCLUDED.shoot_label,
  score = EXCLUDED.score,
  is_favorite = EXCLUDED.is_favorite,
  client_status = EXCLUDED.client_status,
  client_notes = EXCLUDED.client_notes,
  in_active_portfolio = EXCLUDED.in_active_portfolio,
  plate_number = EXCLUDED.plate_number,
  is_cover_hero = EXCLUDED.is_cover_hero;

-- 6. Seed Entries into public.portfolios Table
INSERT INTO public.portfolios (
  id,
  title,
  purpose,
  target_audience,
  target_count,
  curation_strategy,
  candidate_pool_count,
  updated_at
) VALUES (
  'brief-main',
  'Fashion Photography Internship (Aarav Patel)',
  'job',
  'Recruiter',
  15,
  'For a fashion recruiter brief, we recommend establishing a strong architectural opener, followed by high-contrast chiaroscuro character studies, intercut with tactile macro fabric details to demonstrate versatility.',
  247,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  purpose = EXCLUDED.purpose,
  target_audience = EXCLUDED.target_audience,
  target_count = EXCLUDED.target_count,
  curation_strategy = EXCLUDED.curation_strategy,
  candidate_pool_count = EXCLUDED.candidate_pool_count,
  updated_at = NOW();
