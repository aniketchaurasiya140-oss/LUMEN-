import { supabase, mapPhotoToRow, mapRowToPhoto, SupabasePhotoRow } from '../lib/supabase';
import { Photo, PortfolioBrief } from '../types';

export interface SupabaseHealthStatus {
  isConnected: boolean;
  tableExists: boolean;
  photoCount: number;
  error?: string | null;
}

export const supabaseService = {
  // Test connection & table existence
  async checkHealth(): Promise<SupabaseHealthStatus> {
    try {
      const { data, error, count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        // Code PGRST205 indicates table does not exist in schema cache
        const isMissingTable =
          error.code === 'PGRST205' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist');

        return {
          isConnected: true,
          tableExists: !isMissingTable,
          photoCount: 0,
          error: error.message
        };
      }

      return {
        isConnected: true,
        tableExists: true,
        photoCount: count ?? (data ? data.length : 0),
        error: null
      };
    } catch (err: any) {
      return {
        isConnected: false,
        tableExists: false,
        photoCount: 0,
        error: err.message || 'Network error connecting to Supabase'
      };
    }
  },

  // Fetch all photos from Supabase
  async getPhotos(): Promise<{ photos: Photo[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('plate_number', { ascending: true, nullsFirst: false });

      if (error) {
        return { photos: null, error: error.message };
      }

      const mapped = (data as SupabasePhotoRow[]).map(mapRowToPhoto);
      return { photos: mapped, error: null };
    } catch (err: any) {
      return { photos: null, error: err.message };
    }
  },

  // Fetch active curation brief from Supabase
  async getBrief(): Promise<{ brief: PortfolioBrief | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', 'brief-main')
        .maybeSingle();

      if (error || !data) {
        return { brief: null, error: error?.message || null };
      }

      return {
        brief: {
          title: data.title,
          purpose: data.purpose as any,
          targetAudience: data.target_audience as any,
          targetCount: data.target_count,
          curationStrategy: data.curation_strategy,
          candidatePoolCount: data.candidate_pool_count
        },
        error: null
      };
    } catch (err: any) {
      return { brief: null, error: err.message };
    }
  },

  // Subscribe to real-time changes
  subscribeToPhotos(onUpdate: () => void) {
    const channel = supabase
      .channel('public:photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Seed default LUMEN master plates into Supabase
  async seedPhotos(photos: Photo[]): Promise<{ count: number; error: string | null }> {
    try {
      const rows = photos.map(mapPhotoToRow);
      const { error, data } = await supabase
        .from('photos')
        .upsert(rows, { onConflict: 'id' })
        .select('id');

      if (error) {
        return { count: 0, error: error.message };
      }

      return { count: data ? data.length : photos.length, error: null };
    } catch (err: any) {
      return { count: 0, error: err.message };
    }
  },

  // Add/Upsert a new photo
  async upsertPhoto(photo: Photo): Promise<{ success: boolean; error: string | null }> {
    try {
      const row = mapPhotoToRow(photo);
      const { error } = await supabase.from('photos').upsert([row], { onConflict: 'id' });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Update specific fields of a photo (e.g., favorite, clientStatus, clientNotes)
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
      if (updates.inActivePortfolio !== undefined) payload.in_active_portfolio = updates.inActivePortfolio;
      if (updates.plateNumber !== undefined) payload.plate_number = updates.plateNumber;
      if (updates.isCoverHero !== undefined) payload.is_cover_hero = updates.isCoverHero;

      const { error } = await supabase.from('photos').update(payload).eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Delete a photo
  async deletePhoto(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('photos').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Save / Sync brief
  async saveBrief(brief: PortfolioBrief): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('portfolios').upsert([
        {
          id: 'brief-main',
          title: brief.title,
          purpose: brief.purpose,
          target_audience: brief.targetAudience,
          target_count: brief.targetCount,
          curation_strategy: brief.curationStrategy,
          candidate_pool_count: brief.candidatePoolCount,
          updated_at: new Date().toISOString()
        }
      ]);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};
