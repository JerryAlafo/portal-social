import api from './api'

export type UploadBucket = 'avatars' | 'covers' | 'posts' | 'gallery'

interface UploadResponse {
  data: { url: string } | null
  error: string | null
}

/**
 * Uploads an image file to Supabase Storage via the /api/upload route.
 * Returns the public URL to store in the database.
 *
 * @param file   - File object from an <input type="file"> or drag-drop
 * @param bucket - Storage bucket: 'avatars' | 'covers' | 'posts' | 'gallery'
 */
export async function uploadImage(file: File, bucket: UploadBucket): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('bucket', bucket)

  const { data } = await api.post<UploadResponse>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  if (data.error || !data.data) throw new Error(data.error ?? 'Erro ao fazer upload.')
  return data.data.url
}

/**
 * Convenience: creates a local object URL for instant preview before upload.
 * Call URL.revokeObjectURL(preview) when done to free memory.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}
