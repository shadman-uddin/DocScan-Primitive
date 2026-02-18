import { supabase } from '../lib/supabase';
import { deleteFileFromStorage } from './storage';
import type {
  DatabaseUpload,
  UploadInsert,
  UploadUpdate,
} from '../types/database';

export async function insertUpload(
  upload: UploadInsert
): Promise<DatabaseUpload> {
  const { data, error } = await supabase
    .from('uploads')
    .insert(upload)
    .select()
    .single();

  if (error) {
    console.error('Error inserting upload:', error);
    throw new Error('Failed to save upload to database');
  }

  return data;
}

export async function updateUpload(
  id: string,
  updates: UploadUpdate
): Promise<DatabaseUpload> {
  const { data, error } = await supabase
    .from('uploads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating upload:', error);
    throw new Error('Failed to update upload');
  }

  return data;
}

export async function deleteUpload(id: string): Promise<void> {
  const upload = await getUploadById(id);

  if (upload?.file_url) {
    try {
      await deleteFileFromStorage(upload.file_url);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }
  }

  const { error } = await supabase.from('uploads').delete().eq('id', id);

  if (error) {
    console.error('Error deleting upload:', error);
    throw new Error('Failed to delete upload');
  }
}

export async function getUploadById(
  id: string
): Promise<DatabaseUpload | null> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching upload:', error);
    return null;
  }

  return data;
}

export async function getPendingUploads(): Promise<DatabaseUpload[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('status', 'pending_review')
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending uploads:', error);
    return [];
  }

  return data || [];
}

export async function getRecentUploads(
  limit: number = 5
): Promise<DatabaseUpload[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent uploads:', error);
    return [];
  }

  return data || [];
}

export async function getTodayStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('uploads')
    .select('status')
    .gte('uploaded_at', today.toISOString());

  if (error) {
    console.error('Error fetching today stats:', error);
    return { total: 0, pending: 0, approved: 0 };
  }

  const stats = {
    total: data?.length || 0,
    pending: data?.filter((u) => u.status === 'pending_review').length || 0,
    approved: data?.filter((u) => u.status === 'approved').length || 0,
  };

  return stats;
}

export async function getAllUploads(): Promise<DatabaseUpload[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching all uploads:', error);
    return [];
  }

  return data || [];
}
