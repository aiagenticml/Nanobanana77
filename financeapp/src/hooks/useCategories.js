import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { requireUser } from '../lib/authGuard'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const user = await requireUser()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .limit(100)
      if (!error) setCategories(data ?? [])
    } catch {
      // Not authenticated — leave empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addCategory(cat) {
    const user = await requireUser()
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0)
    const { error } = await supabase.from('categories').insert([{
      ...cat,
      user_id: user.id,
      keywords: cat.keywords ?? [],
      sort_order: cat.sort_order ?? maxOrder + 1,
    }])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateCategory(id, data) {
    const user = await requireUser()
    const { error } = await supabase.from('categories').update(data).eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteCategory(id) {
    const user = await requireUser()
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  const categoryNames = categories.map(c => c.name)

  const keywordMap = {}
  for (const cat of categories) {
    for (const kw of (cat.keywords ?? [])) {
      keywordMap[kw.toLowerCase()] = cat.name
    }
  }

  const colorMap = {}
  for (const cat of categories) {
    colorMap[cat.name] = `${cat.color_bg} ${cat.color_text}`
  }

  return {
    categories, loading, addCategory, updateCategory, deleteCategory,
    categoryNames, keywordMap, colorMap, refetch: fetch,
  }
}
