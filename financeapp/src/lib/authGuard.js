import { supabase } from './supabase'

export async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}
