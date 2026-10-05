import { supabase } from '../../lib/supabase';

export async function resolveStorageUrl(storagePath?: string | null): Promise<string | null> {
  if (!storagePath || !storagePath.trim()) return null;
  const path = storagePath.trim();
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('file://')
  ) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from('pet-media')
      .createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch {
  }

  try {
    const { data } = supabase.storage.from('pet-media').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

export async function fetchPetsAvatarMap(petIds: string[]): Promise<Record<string, string>> {
  if (!petIds || petIds.length === 0) return {};

  const cleanIds = Array.from(new Set(petIds.filter(Boolean)));
  if (cleanIds.length === 0) return {};

  try {
    const petMediaFrom = supabase.from('pet_media');
    if (!petMediaFrom || typeof petMediaFrom.select !== 'function') {
      return {};
    }

    let query: any = petMediaFrom
      .select('id, pet_id, storage_path, photo_type, created_at')
      .in('pet_id', cleanIds);
    if (typeof query?.order === 'function') {
      query = query.order('created_at', { ascending: false });
    }
    const { data: mediaRows, error } = await query;

    if (error || !mediaRows || !Array.isArray(mediaRows)) {
      return {};
    }

    const bestMediaByPet: Record<string, string> = {};

    for (const petId of cleanIds) {
      const petRows = mediaRows.filter((row: any) => row?.pet_id === petId);
      if (petRows.length === 0) continue;

      const general = petRows.find((r: any) => r?.photo_type === 'general');
      const after = petRows.find((r: any) => r?.photo_type === 'after');
      const before = petRows.find((r: any) => r?.photo_type === 'before');
      const chosen = general || after || before || petRows[0];

      if (chosen && chosen.storage_path) {
        bestMediaByPet[petId] = chosen.storage_path;
      }
    }

    const entries = Object.entries(bestMediaByPet);
    const resolvedPairs = await Promise.all(
      entries.map(async ([petId, storagePath]) => {
        const url = await resolveStorageUrl(storagePath);
        return [petId, url] as const;
      })
    );

    const resultMap: Record<string, string> = {};
    for (const [petId, url] of resolvedPairs) {
      if (url) {
        resultMap[petId] = url;
      }
    }

    return resultMap;
  } catch {
    return {};
  }
}

export async function fetchPetAvatarUrl(petId?: string | null): Promise<string | null> {
  if (!petId) return null;
  const map = await fetchPetsAvatarMap([petId]);
  return map[petId] || null;
}

export async function uploadPetMediaFromUri(
  petId: string,
  localUri: string,
  photoType: 'general' | 'before' | 'after' = 'general',
  userId?: string
): Promise<string | null> {
  if (!petId || !localUri) return null;
  try {
    const extMatch = localUri.split('.').pop()?.toLowerCase();
    let fileExt = extMatch && extMatch.length <= 4 ? extMatch : 'jpg';
    if (fileExt === 'jpeg') fileExt = 'jpg';
    const storagePath = `${petId}/${Date.now()}.${fileExt}`;

    const response = await fetch(localUri);
    const blob = await response.blob();
    const contentType = blob.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg');

    const { error: uploadError } = await supabase.storage
      .from('pet-media')
      .upload(storagePath, blob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return null;
    }

    const insertPayload: any = {
      pet_id: petId,
      storage_path: storagePath,
      photo_type: photoType,
    };
    if (userId) {
      insertPayload.created_by = userId;
    }

    await supabase.from('pet_media').insert(insertPayload);

    return await resolveStorageUrl(storagePath);
  } catch {
    return null;
  }
}
