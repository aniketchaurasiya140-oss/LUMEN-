import { Photo, User, PortfolioBrief, Category, Album } from '../types';

export const USERS: Record<string, User> = {
  OWNER: {
    id: 'usr-owner-01',
    name: 'Madhura Dhoke',
    email: 'madhura@lumen.studio',
    role: 'OWNER',
    title: 'Studio Founder & Master Photographer',
    avatar: '', // Clean neutral monogram by default; custom portrait uploadable in Profile Settings
    studioRoleLabel: 'Studio Owner (Full Access)',
    bio: 'Leica Hall of Fame honoree, specializes in brutalist high-contrast fashion and chiaroscuro editorial spreads.'
  },
  EDITOR: {
    id: 'usr-editor-01',
    name: 'Rahul Verma',
    email: 'rahul@lumen.studio',
    role: 'EDITOR',
    title: 'Curatorial Associate & Senior Editor',
    avatar: '', // Clean neutral monogram by default
    studioRoleLabel: 'Curatorial Associate (Editor)',
    bio: 'Oversees monograph sequencing, RAW grading, and client selection drafts.'
  },
  CLIENT: {
    id: 'usr-client-01',
    name: 'Anita & Vikram',
    email: 'anita.vikram@sharmagroup.com',
    role: 'CLIENT',
    title: 'Wedding & Monograph Commissioners',
    avatar: '', // Clean neutral monogram by default
    studioRoleLabel: 'Private Client (Proofing Only)',
    bio: 'Private commissioners reviewing 60 plates from the Udaipur Palace Colonnade ceremony.'
  },
  VIEWER: {
    id: 'usr-viewer-01',
    name: 'Sarah Lin',
    email: 'sarah.lin@xyzmagazine.com',
    role: 'VIEWER',
    title: 'Senior Photo Editor & Recruiter (XYZ Magazine)',
    avatar: '', // Clean neutral monogram by default
    studioRoleLabel: 'External Reviewer (Read Only)',
    bio: 'Evaluating the fashion monograph for the 2026 XYZ International Fashion Fellowship.'
  }
};

export const INITIAL_CATEGORIES: Category[] = [
  // Original default categories
  { id: 'cat-fashion', name: 'Fashion & Runway', isCustom: false },
  { id: 'cat-wedding', name: 'Wedding & Ceremony', isCustom: false },
  { id: 'cat-arch', name: 'Urban & Architecture', isCustom: false },
  // 10 Requested Expanded Genres
  { id: 'cat-portrait', name: 'Editorial & Portraiture', isCustom: false },
  { id: 'cat-fine-art', name: 'Fine Art & Monograph', isCustom: false },
  { id: 'cat-landscape', name: 'Landscape & Environmental', isCustom: false },
  { id: 'cat-street', name: 'Street & Documentary', isCustom: false },
  { id: 'cat-still-life', name: 'Still Life & Product', isCustom: false },
  { id: 'cat-commercial', name: 'Commercial & Campaign', isCustom: false },
  { id: 'cat-interior', name: 'Architectural & Interior', isCustom: false },
  { id: 'cat-photojournalism', name: 'Photojournalism & Storytelling', isCustom: false },
  { id: 'cat-wildlife', name: 'Wildlife & Nature Conservation', isCustom: false },
  { id: 'cat-conceptual', name: 'Experimental & Conceptual', isCustom: false }
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'alb-01',
    title: 'Autumn Paris Couture & Monograph',
    description: 'High-contrast monochrome plates for European fashion edition.',
    coverImageId: 'p-01',
    coverUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    photoIds: ['p-01', 'p-02', 'p-03', 'p-04', 'p-05', 'p-08', 'p-10'],
    createdAt: '2026-10-18T10:00:00Z'
  },
  {
    id: 'alb-02',
    title: 'Heritage Royal Ceremony & Monograph',
    description: 'Palace Colonnade golden hour ceremony and private client proofing suite.',
    coverImageId: 'p-07',
    coverUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    photoIds: ['p-06', 'p-07'],
    createdAt: '2026-10-21T14:30:00Z'
  },
  {
    id: 'alb-03',
    title: 'Brutalist Geometries & Concrete Pavilion',
    description: 'Architectural shadows, textured facades, and spatial studies.',
    coverImageId: 'p-09',
    coverUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    photoIds: ['p-02', 'p-09'],
    createdAt: '2026-10-23T09:15:00Z'
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'p-01',
    title: 'Monolith & Scaffolding — Carrara Light',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    camera: 'Leica M11',
    lens: 'Noctilux-M 50mm f/0.95',
    aperture: 'f/1.4',
    shutter: '1/1000s',
    iso: '64',
    dimensions: '9528 × 6328',
    fileSize: 52428800, // 50 MB
    categoryId: 'cat-fashion',
    categoryName: 'Fashion & Runway',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 99,
    isFavorite: true,
    inActivePortfolio: true,
    plateNumber: 1,
    isCoverHero: true,
    clientStatus: 'selected',
    clientNotes: ['Sublime architectural framing and drapery fall. Must be hero plate.'],
    createdAt: '2026-10-25T08:00:00Z'
  },
  {
    id: 'p-02',
    title: 'Brutalist Flâneur — Charcoal Wool',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
    camera: 'Hasselblad X2D 100C',
    lens: 'XCD 55mm f/2.5 V',
    aperture: 'f/2.8',
    shutter: '1/800s',
    iso: '100',
    dimensions: '11656 × 8742',
    fileSize: 89128960, // 85 MB
    categoryId: 'cat-fashion',
    categoryName: 'Fashion & Runway',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 97,
    isFavorite: true,
    inActivePortfolio: true,
    plateNumber: 2,
    clientStatus: 'selected',
    clientNotes: ['Texture on wool is exceptional. High tonal depth.'],
    createdAt: '2026-10-25T08:05:00Z'
  },
  {
    id: 'p-03',
    title: 'Profile in Chiaroscuro',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    camera: 'Sony A7R V',
    lens: 'FE 85mm f/1.4 GM II',
    aperture: 'f/1.4',
    shutter: '1/500s',
    iso: '100',
    dimensions: '9504 × 6336',
    fileSize: 62914560, // 60 MB
    categoryId: 'cat-portrait',
    categoryName: 'Editorial & Portraiture',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 98,
    isFavorite: true,
    inActivePortfolio: true,
    plateNumber: 3,
    clientStatus: 'selected',
    clientNotes: ['Rembrandt lighting angle works marvelously.'],
    createdAt: '2026-10-25T08:10:00Z'
  },
  {
    id: 'p-04',
    title: 'Studio Chiaroscuro Portrait',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    camera: 'Sony A7R V',
    lens: 'FE 50mm f/1.2 GM',
    aperture: 'f/2.0',
    shutter: '1/640s',
    iso: '100',
    dimensions: '9504 × 6336',
    fileSize: 61865984, // 59 MB
    categoryId: 'cat-portrait',
    categoryName: 'Editorial & Portraiture',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 94,
    isFavorite: false,
    inActivePortfolio: true,
    plateNumber: 4,
    clientStatus: 'selected',
    createdAt: '2026-10-25T08:15:00Z'
  },
  {
    id: 'p-05',
    title: 'Studio Light Elena V. (Near Duplicate)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    camera: 'Sony A7R V',
    lens: 'FE 50mm f/1.2 GM',
    aperture: 'f/2.0',
    shutter: '1/640s',
    iso: '100',
    dimensions: '9504 × 6336',
    fileSize: 61341696, // 58.5 MB
    categoryId: 'cat-portrait',
    categoryName: 'Editorial & Portraiture',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 91,
    isFavorite: false,
    inActivePortfolio: true,
    plateNumber: 5,
    clientStatus: 'needs_review',
    clientNotes: ['Check similarity against Plate 04. Consider environmental wide.'],
    createdAt: '2026-10-25T08:20:00Z'
  },
  {
    id: 'p-06',
    title: 'Bridal Preparation Window Spill',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    camera: 'Sony A7R V',
    lens: 'FE 50mm f/1.2 GM',
    aperture: 'f/1.4',
    shutter: '1/500s',
    iso: '100',
    dimensions: '9504 × 6336',
    fileSize: 65011712, // 62 MB
    categoryId: 'cat-wedding',
    categoryName: 'Wedding & Ceremony',
    shoot: 'wedding',
    shootLabel: 'Heritage Royal Ceremony',
    score: 98,
    isFavorite: true,
    inActivePortfolio: true,
    plateNumber: 6,
    clientStatus: 'selected',
    clientNotes: ['Mother of the bride loved the backlighting here.'],
    createdAt: '2026-10-25T08:25:00Z'
  },
  {
    id: 'p-07',
    title: 'Palace Colonnade Golden Hour',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    camera: 'Sony A7R V',
    lens: 'FE 85mm f/1.4 GM II',
    aperture: 'f/1.4',
    shutter: '1/1000s',
    iso: '100',
    dimensions: '9504 × 6336',
    fileSize: 66060288, // 63 MB
    categoryId: 'cat-wedding',
    categoryName: 'Wedding & Ceremony',
    shoot: 'wedding',
    shootLabel: 'Heritage Royal Ceremony',
    score: 99,
    isFavorite: true,
    inActivePortfolio: true,
    plateNumber: 7,
    clientStatus: 'selected',
    clientNotes: ['Full spread recommendation for central album page.'],
    createdAt: '2026-10-25T08:30:00Z'
  },
  {
    id: 'p-08',
    title: 'Raw Tweed Weave Macro',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
    camera: 'Canon EOS R5',
    lens: 'RF 100mm f/2.8L Macro',
    aperture: 'f/5.6',
    shutter: '1/250s',
    iso: '100',
    dimensions: '8192 × 5464',
    fileSize: 49283072, // 47 MB
    categoryId: 'cat-still-life',
    categoryName: 'Still Life & Product',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 92,
    isFavorite: false,
    inActivePortfolio: true,
    plateNumber: 8,
    clientStatus: 'needs_review',
    createdAt: '2026-10-25T08:35:00Z'
  },
  {
    id: 'p-09',
    title: 'Brutalist Concrete Pavilion Shadows',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    camera: 'Hasselblad X2D 100C',
    lens: 'XCD 38mm f/2.5 V',
    aperture: 'f/8.0',
    shutter: '1/400s',
    iso: '64',
    dimensions: '11656 × 8742',
    fileSize: 91226112, // 87 MB
    categoryId: 'cat-arch',
    categoryName: 'Urban & Architecture',
    shoot: 'arch',
    shootLabel: 'Urban Geometries & Brutalism',
    score: 96,
    isFavorite: true,
    inActivePortfolio: true,
    plateNumber: 9,
    clientStatus: 'selected',
    createdAt: '2026-10-25T08:40:00Z'
  },
  {
    id: 'p-10',
    title: 'Silk Organza in Wind Tunnel',
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85',
    camera: 'Leica M11',
    lens: 'Summilux-M 35mm f/1.4',
    aperture: 'f/1.4',
    shutter: '1/2000s',
    iso: '125',
    dimensions: '9528 × 6328',
    fileSize: 53477376, // 51 MB
    categoryId: 'cat-fine-art',
    categoryName: 'Fine Art & Monograph',
    shoot: 'fashion',
    shootLabel: 'Autumn Couture & Runway',
    score: 97,
    isFavorite: false,
    inActivePortfolio: true,
    plateNumber: 10,
    clientStatus: 'selected',
    createdAt: '2026-10-25T08:45:00Z'
  }
];

export const INITIAL_BRIEF: PortfolioBrief = {
  id: 'brief-main',
  title: 'Fashion & Editorial Monograph Edition',
  purpose: 'job',
  targetAudience: 'Recruiter',
  targetCount: 15,
  curationStrategy: 'For a fashion recruiter brief, we recommend establishing a strong architectural opener, followed by high-contrast chiaroscuro character studies, intercut with tactile macro fabric details to demonstrate versatility.',
  candidatePoolCount: 247
};
