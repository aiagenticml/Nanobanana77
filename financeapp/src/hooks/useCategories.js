import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (!error) setCategories(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addCategory(cat) {
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0)
    const { error } = await supabase.from('categories').insert([{
      ...cat,
      keywords: cat.keywords ?? [],
      sort_order: cat.sort_order ?? maxOrder + 1,
    }])
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function updateCategory(id, data) {
    const { error } = await supabase.from('categories').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetch()
  }

  // Helper: list of category names
  const categoryNames = categories.map(c => c.name)

  // Helper: build keyword → category map
  const keywordMap = {}
  for (const cat of categories) {
    for (const kw of (cat.keywords ?? [])) {
      keywordMap[kw.toLowerCase()] = cat.name
    }
  }

  // Helper: build color map
  const colorMap = {}
  for (const cat of categories) {
    colorMap[cat.name] = `${cat.color_bg} ${cat.color_text}`
  }

  return {
    categories, loading, addCategory, updateCategory, deleteCategory,
    categoryNames, keywordMap, colorMap, refetch: fetch,
  }
}
