import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_CATEGORIES = [
  { name: 'Food', color_bg: 'bg-orange-100', color_text: 'text-orange-700', color_hex: '#c47a5a', sort_order: 1, keywords: ['lunch','dinner','breakfast','hawker','makan','coffee','tea','snack','supper','brunch','grab','foodpanda','deliveroo','mcdonalds','kfc','bubble','boba','rice','noodle','noodles'] },
  { name: 'Transport', color_bg: 'bg-blue-100', color_text: 'text-blue-700', color_hex: '#5a7a94', sort_order: 2, keywords: ['mrt','bus','taxi','fuel','petrol','parking','ezlink','uber','toll','train'] },
  { name: 'Shopping', color_bg: 'bg-pink-100', color_text: 'text-pink-700', color_hex: '#94707a', sort_order: 3, keywords: ['clothes','shoes','shirt','pants','online','shopee','lazada','amazon'] },
  { name: 'Entertainment', color_bg: 'bg-purple-100', color_text: 'text-purple-700', color_hex: '#7a6a94', sort_order: 4, keywords: ['movie','movies','netflix','concert','game','games','karaoke','spotify'] },
  { name: 'Health', color_bg: 'bg-green-100', color_text: 'text-green-700', color_hex: '#7a8c6e', sort_order: 5, keywords: ['doctor','clinic','medicine','pharmacy','dental','dentist','gym','vitamin'] },
  { name: 'Education', color_bg: 'bg-yellow-100', color_text: 'text-yellow-700', color_hex: '#c9a040', sort_order: 6, keywords: ['book','books','course','tuition','udemy','class'] },
  { name: 'Utilities', color_bg: 'bg-gray-100', color_text: 'text-gray-700', color_hex: '#6b6058', sort_order: 7, keywords: ['electric','water','internet','phone','wifi','bill','mobile'] },
  { name: 'Groceries', color_bg: 'bg-lime-100', color_text: 'text-lime-700', color_hex: '#8c946e', sort_order: 8, keywords: ['grocery','groceries','supermarket','fairprice','coldstore','sheng'] },
  { name: 'Travel', color_bg: 'bg-cyan-100', color_text: 'text-cyan-700', color_hex: '#5a8c8c', sort_order: 9, keywords: ['hotel','flight','airbnb','luggage','visa','airport'] },
  { name: 'Other', color_bg: 'bg-gray-100', color_text: 'text-gray-600', color_hex: '#9a8e80', sort_order: 10, keywords: [] },
]

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && (!data || data.length === 0)) {
      // Seed defaults
      await supabase.from('categories').insert(DEFAULT_CATEGORIES)
      // Refetch after seeding
      const { data: seeded } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
      setCategories(seeded ?? [])
      setLoading(false)
      return
    }

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
    // If name is changing, cascade rename to related tables
    if (data.name) {
      const oldName = categories.find(c => c.id === id)?.name
      if (oldName && oldName !== data.name) {
        // Cascade rename in expenses
        await supabase.from('expenses').update({ category: data.name }).eq('category', oldName)
        // Cascade rename in budget_items
        await supabase.from('budget_items').update({ linked_expense_category: data.name }).eq('linked_expense_category', oldName)
      }
    }
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

  // Helper: build color map (returns object with bg, text, hex)
  const colorMap = {}
  for (const cat of categories) {
    colorMap[cat.name] = {
      bg: cat.color_bg,
      text: cat.color_text,
      hex: cat.color_hex || '#9a8e80',
    }
  }

  return {
    categories, loading, addCategory, updateCategory, deleteCategory,
    categoryNames, keywordMap, colorMap, refetch: fetch,
  }
}
