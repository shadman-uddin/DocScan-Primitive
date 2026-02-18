import { supabase } from '../lib/supabase';

export async function uploadFileToStorage(file: File, uploadId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uploadId}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file to storage:', error);
    throw new Error('Failed to upload file to storage');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  try {
    const pathMatch = fileUrl.match(/uploads\/(.+)$/);
    if (!pathMatch) {
      throw new Error('Invalid file URL');
    }

    const filePath = pathMatch[1];
    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file from storage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
    throw error;
  }
}
