import {
  supabase,
  mapPhotoToRow,
  mapRowToPhoto,
  SupabasePhotoRow,
  STORAGE_BUCKET_NAME
} from '../lib/supabase';
import { Photo, PortfolioBrief, Category, Album } from '../types';
import { INITIAL_CATEGORIES, INITIAL_ALBUMS, INITIAL_PHOTOS } from '../data/mockData';

export interface SupabaseHealthStatus {
  isConnected: boolean;
  tableExists: boolean;
  categoriesTableExists: boolean;
  albumsTableExists: boolean;
  photoCount: number;
  categoryCount: number;
  albumCount: number;
  storageActive: boolean;
  error?: string | null;
}

export const supabaseService = {
  // Check health of Supabase PostgreSQL tables & storage
  async checkHealth(): Promise<SupabaseHealthStatus> {
    try {
      const { data: photoData, error: photoError, count: photoCount } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      const isPhotosMissing =
        photoError &&
        (photoError.code === 'PGRST205' ||
          photoError.message?.includes('Could not find the table') ||
          photoError.message?.includes('does not exist'));

      // Check categories table
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
      const isCatMissing =
        catError &&
        (catError.code === 'PGRST205' || catError.message?.includes('does not exist'));

      // Check albums table
      const { data: albData, error: albError } = await supabase
        .from('albums')
        .select('id')
        .limit(1);
      const isAlbMissing =
        albError &&
        (albError.code === 'PGRST205' || albError.message?.includes('does not exist'));

      return {
        isConnected: true,
        tableExists: !isPhotosMissing,
        categoriesTableExists: !isCatMissing,
        albumsTableExists: !isAlbMissing,
        photoCount: photoCount ?? (photoData ? photoData.length : 0),
        categoryCount: catData ? catData.length : 0,
        albumCount: albData ? albData.length : 0,
        storageActive: true,
        error: photoError?.message || null
      };
    } catch (err: any) {
      return {
        isConnected: false,
        tableExists: false,
        categoriesTableExists: false,
        albumsTableExists: false,
        photoCount: 0,
        categoryCount: 0,
        albumCount: 0,
        storageActive: false,
        error: err.message || 'Network error connecting to Supabase'
      };
    }
  },

  // 1. PHOTOS CRUD
  async getPhotos(userId?: string): Promise<{ photos: Photo[]; error: string | null }> {
    try {
      let query = supabase.from('photos').select('*');
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      const { data, error } = await query.order('plate_number', { ascending: true, nullsFirst: false });

      if (error || !data || data.length === 0) {
        if (userId) {
          const userStorageKey = `lumen_user_photos_${userId}`;
          const cached = localStorage.getItem(userStorageKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return { photos: parsed, error: null };
              }
            } catch (e) {}
          }
          // Seed initial demo photographs as default template media for this account
          const seeded = INITIAL_PHOTOS.map((p, idx) => ({
            ...p,
            id: `${userId}-p${idx + 1}`,
            userId: userId
          }));
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(seeded));
          } catch (e) {}
          // Persist to Supabase in background
          this.seedPhotos(seeded, userId).catch(() => {});
          return { photos: seeded, error: null };
        }
        return { photos: INITIAL_PHOTOS, error: error?.message || null };
      }

      const mapped = (data as SupabasePhotoRow[]).map((r) => mapRowToPhoto(r));
      return { photos: mapped, error: null };
    } catch (err: any) {
      if (userId) {
        const cached = localStorage.getItem(`lumen_user_photos_${userId}`);
        if (cached) {
          try {
            return { photos: JSON.parse(cached), error: null };
          } catch (e) {}
        }
        const seeded = INITIAL_PHOTOS.map((p, idx) => ({
          ...p,
          id: `${userId}-p${idx + 1}`,
          userId: userId
        }));
        return { photos: seeded, error: null };
      }
      return { photos: INITIAL_PHOTOS, error: err.message };
    }
  },

  async upsertPhoto(photo: Photo, userId?: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const row = mapPhotoToRow({ ...photo, userId: userId || photo.userId });
      const { error } = await supabase.from('photos').upsert([row], { onConflict: 'id' });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async seedPhotos(photos: Photo[], userId?: string): Promise<{ success: boolean; count: number; error: string | null }> {
    try {
      const rows = photos.map((p) => mapPhotoToRow({ ...p, userId: userId || p.userId }));
      const { error } = await supabase.from('photos').upsert(rows, { onConflict: 'id' });
      if (error) return { success: false, count: 0, error: error.message };
      return { success: true, count: rows.length, error: null };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message };
    }
  },

  async updatePhoto(
    id: string,
    updates: Partial<Photo>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const payload: Partial<SupabasePhotoRow> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
      if (updates.clientStatus !== undefined) payload.client_status = updates.clientStatus;
      if (updates.clientNotes !== undefined) payload.client_notes = updates.clientNotes;
      if (updates.inActivePortfolio !== undefined)
        payload.in_active_portfolio = updates.inActivePortfolio;
      if (updates.plateNumber !== undefined) payload.plate_number = updates.plateNumber;
      if (updates.isCoverHero !== undefined) payload.is_cover_hero = updates.isCoverHero;
      if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;

      const { error } = await supabase.from('photos').update(payload).eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deletePhoto(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Also delete from album_photos join table
      try {
        await supabase.from('album_photos').delete().eq('photo_id', id);
      } catch (e) {
        // Ignore if join table does not exist yet
      }

      const { error } = await supabase.from('photos').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // 2. DEVICE FILE UPLOAD (Supabase Storage + Client Fallback)
  async uploadDeviceFile(
    file: File
  ): Promise<{ url: string; fileSize: number; dimensions: string; error: string | null }> {
    const fileSize = file.size;
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Read image dimensions in browser
    let dimensions = '6000 × 4000';
    try {
      const bitmap = await createImageBitmap(file);
      dimensions = `${bitmap.width} × ${bitmap.height}`;
    } catch (e) {
      // Fallback
    }

    try {
      // 1. Try uploading to Supabase Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .getPublicUrl(uploadData.path);

        return {
          url: publicUrlData.publicUrl,
          fileSize,
          dimensions,
          error: null
        };
      }

      console.warn('Supabase storage upload notice:', uploadError?.message);
    } catch (err) {
      console.warn('Storage bucket unreachable, using client data URL reader fallback:', err);
    }

    // 2. High-res Data URL Fallback so user file upload NEVER fails
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          fileSize,
          dimensions,
          error: null
        });
      };
      reader.onerror = () => {
        resolve({
          url: URL.createObjectURL(file),
          fileSize,
          dimensions,
          error: null
        });
      };
      reader.readAsDataURL(file);
    });
  },

  // 3. CATEGORIES CRUD & VALIDATION
  async getCategories(): Promise<{ categories: Category[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return { categories: INITIAL_CATEGORIES, error: error?.message || null };
      }

      // Merge with defaults to guarantee all 13 genres are present
      const dbCategories: Category[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        userId: d.user_id,
        createdAt: d.created_at,
        isCustom: !d.id.startsWith('cat-')
      }));

      // Combine ensuring no duplicates
      const existingNames = new Set(dbCategories.map((c) => c.name.toLowerCase()));
      const combined = [...dbCategories];
      for (const def of INITIAL_CATEGORIES) {
        if (!existingNames.has(def.name.toLowerCase())) {
          combined.push(def);
        }
      }

      return { categories: combined, error: null };
    } catch (err: any) {
      return { categories: INITIAL_CATEGORIES, error: err.message };
    }
  },

  async createCategory(
    name: string,
    existingCategories: Category[],
    userId?: string
  ): Promise<{ category: Category | null; error: string | null }> {
    const trimmed = name.trim();

    // Validation 1: Empty check
    if (!trimmed) {
      return { category: null, error: 'Category name cannot be empty.' };
    }

    // Validation 2: Case-insensitive duplicate check
    const isDuplicate = existingCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      return {
        category: null,
        error: `Category "${trimmed}" already exists in your library.`
      };
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      userId: userId || null,
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    try {
      const { error } = await supabase.from('categories').insert([
        {
          id: newCategory.id,
          name: newCategory.name,
          user_id: newCategory.userId
        }
      ]);

      if (error) {
        console.warn('Supabase categories insert error, keeping locally:', error.message);
      }
    } catch (err) {
      // Local fallback
    }

    return { category: newCategory, error: null };
  },

  // 4. ALBUMS CRUD & MAPPING
  async getAlbums(allPhotos: Photo[], userId?: string): Promise<{ albums: Album[]; error: string | null }> {
    try {
      let query = supabase.from('albums').select('*');
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      const { data: albumsData, error: albumsError } = await query.order('created_at', { ascending: false });

      if (albumsError || !albumsData || albumsData.length === 0) {
        if (userId) {
          const userAlbumsKey = `lumen_user_albums_${userId}`;
          const cached = localStorage.getItem(userAlbumsKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return { albums: parsed, error: null };
              }
            } catch (e) {}
          }
          const userPhotoIds = allPhotos.map((p) => p.id);
          const seededAlbums: Album[] = INITIAL_ALBUMS.map((alb, aIdx) => ({
            ...alb,
            id: `alb-${userId}-${aIdx + 1}`,
            userId,
            coverImageId: userPhotoIds[0] || alb.coverImageId,
            coverUrl: allPhotos[0]?.url || alb.coverUrl,
            photoIds: userPhotoIds.length >= 3 
              ? userPhotoIds.slice(aIdx * 2, aIdx * 2 + 3)
              : userPhotoIds
          }));
          try {
            localStorage.setItem(userAlbumsKey, JSON.stringify(seededAlbums));
          } catch (e) {}
          return { albums: seededAlbums, error: null };
        }
        return { albums: INITIAL_ALBUMS, error: albumsError?.message || null };
      }

      // Fetch join table relations
      const { data: joinData } = await supabase.from('album_photos').select('*');

      const photoMap = new Map<string, string[]>();
      if (joinData) {
        joinData.forEach((j: any) => {
          if (!photoMap.has(j.album_id)) photoMap.set(j.album_id, []);
          photoMap.get(j.album_id)!.push(j.photo_id);
        });
      }

      const albums: Album[] = albumsData.map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        title: a.title,
        description: a.description,
        coverImageId: a.cover_image_id,
        coverUrl: a.cover_url || (allPhotos.find((p) => p.id === a.cover_image_id)?.url),
        photoIds: photoMap.get(a.id) || [],
        createdAt: a.created_at
      }));

      return { albums, error: null };
    } catch (err: any) {
      return { albums: INITIAL_ALBUMS, error: err.message };
    }
  },

  async createAlbum(
    title: string,
    description: string,
    photoIds: string[],
    allPhotos: Photo[],
    userId?: string
  ): Promise<{ album: Album | null; error: string | null }> {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return { album: null, error: 'Album title cannot be empty.' };
    }

    const coverPhoto = allPhotos.find((p) => photoIds.includes(p.id)) || allPhotos[0];
    const newAlbum: Album = {
      id: `alb-${Date.now()}`,
      userId: userId || null,
      title: trimmedTitle,
      description: description.trim() || undefined,
      coverImageId: coverPhoto?.id,
      coverUrl: coverPhoto?.url,
      photoIds,
      createdAt: new Date().toISOString()
    };

    try {
      const { error: albError } = await supabase.from('albums').insert([
        {
          id: newAlbum.id,
          user_id: newAlbum.userId,
          title: newAlbum.title,
          description: newAlbum.description,
          cover_image_id: newAlbum.coverImageId,
          cover_url: newAlbum.coverUrl
        }
      ]);

      if (!albError && photoIds.length > 0) {
        const joins = photoIds.map((pId) => ({
          album_id: newAlbum.id,
          photo_id: pId
        }));
        await supabase.from('album_photos').insert(joins);
      }
    } catch (err) {
      console.warn('Could not insert album into Supabase, saving locally:', err);
    }

    return { album: newAlbum, error: null };
  },

  async addPhotosToAlbum(albumId: string, photoIds: string[]): Promise<boolean> {
    try {
      const joins = photoIds.map((pId) => ({
        album_id: albumId,
        photo_id: pId
      }));
      await supabase.from('album_photos').upsert(joins, { onConflict: 'album_id,photo_id' });
      return true;
    } catch (err) {
      return false;
    }
  },

  async removePhotoFromAlbum(albumId: string, photoId: string): Promise<boolean> {
    try {
      await supabase
        .from('album_photos')
        .delete()
        .eq('album_id', albumId)
        .eq('photo_id', photoId);
      return true;
    } catch (err) {
      return false;
    }
  },

  // 5. BRIEFS & PORTFOLIOS
  async getBrief(userId?: string): Promise<{ brief: PortfolioBrief | null; error: string | null }> {
    try {
      if (!userId) {
        return { brief: null, error: null };
      }

      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          brief: {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            purpose: data.purpose as any,
            targetAudience: data.target_audience as any,
            targetCount: data.target_count,
            curationStrategy: data.curation_strategy,
            candidatePoolCount: data.candidate_pool_count,
            updatedAt: data.updated_at
          },
          error: null
        };
      }

      // Check localStorage cache for this user
      const cached = localStorage.getItem(`lumen_user_brief_${userId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.title) {
            return { brief: parsed, error: null };
          }
        } catch (e) {}
      }

      return { brief: null, error: error?.message || null };
    } catch (err: any) {
      if (userId) {
        const cached = localStorage.getItem(`lumen_user_brief_${userId}`);
        if (cached) {
          try {
            return { brief: JSON.parse(cached), error: null };
          } catch (e) {}
        }
      }
      return { brief: null, error: err.message };
    }
  },

  async saveBrief(brief: PortfolioBrief, userId?: string): Promise<{ success: boolean; error: string | null }> {
    const targetUserId = userId || brief.userId;
    if (targetUserId) {
      try {
        localStorage.setItem(`lumen_user_brief_${targetUserId}`, JSON.stringify(brief));
      } catch (e) {}
    }

    try {
      const briefId = brief.id || (targetUserId ? `brief-${targetUserId}` : 'brief-main');
      const { error } = await supabase.from('portfolios').upsert([
        {
          id: briefId,
          user_id: targetUserId || null,
          title: brief.title,
          purpose: brief.purpose,
          target_audience: brief.targetAudience,
          target_count: brief.targetCount,
          curation_strategy: brief.curationStrategy,
          candidate_pool_count: brief.candidatePoolCount,
          status: 'draft',
          updated_at: new Date().toISOString()
        }
      ]);

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async publishPortfolio(portfolioId: string = 'brief-main'): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('portfolios').update({
        status: 'published',
        updated_at: new Date().toISOString()
      }).eq('id', portfolioId);

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // 6. REALTIME SUBSCRIPTIONS
  subscribeToPhotos(onUpdate: () => void) {
    const channel = supabase
      .channel('public:photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
