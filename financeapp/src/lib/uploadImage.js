import { supabase } from './supabase'

const BUCKET = 'uploads'

/**
 * Upload an image file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(file, folder = 'receipts') {
  const ext = file.name.split('.').pop()
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(name, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name)
  return data.publicUrl
}
