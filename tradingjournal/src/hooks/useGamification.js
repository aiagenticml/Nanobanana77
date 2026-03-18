import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LEVELS = [
  { level: 1, name: 'Beginner', xpNeeded: 0 },
  { level: 2, name: 'Apprentice', xpNeeded: 50 },
  { level: 3, name: 'Journeyman', xpNeeded: 150 },
  { level: 4, name: 'Analyst', xpNeeded: 300 },
  { level: 5, name: 'Strategist', xpNeeded: 500 },
  { level: 6, name: 'Expert', xpNeeded: 800 },
  { level: 7, name: 'Master', xpNeeded: 1200 },
  { level: 8, name: 'Grandmaster', xpNeeded: 1800 },
  { level: 9, name: 'Legend', xpNeeded: 2500 },
  { level: 10, name: 'Mythic', xpNeeded: 3500 },
]

const PET_STAGES = [
  { minHealth: 0, name: 'Egg', emoji: '🥚' },
  { minHealth: 20, name: 'Hatching', emoji: '🐣' },
  { minHealth: 40, name: 'Baby', emoji: '🐥' },
  { minHealth: 60, name: 'Growing', emoji: '🐤' },
  { minHealth: 80, name: 'Thriving', emoji: '🦅' },
]

// Points awarded for actions
const XP_REWARDS = {
  trade_journal: 10,
  daily_journal: 15,
  weekly_journal: 25,
  screenshot_added: 5,
  streak_bonus_3: 20,
  streak_bonus_7: 50,
  streak_bonus_14: 100,
  streak_bonus_30: 250,
}

const DEFAULT_STATE = {
  xp: 0,
  journal_streak: 0,
  longest_streak: 0,
  pet_health: 50,
  pet_name: 'Trading Buddy',
  last_journal_date: null,
  total_trade_journals: 0,
  total_daily_journals: 0,
  total_weekly_journals: 0,
}

export function useGamification() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('gamification').select('*').eq('id', 1).limit(1)
    if (data && data.length > 0) {
      setState(data[0].state || DEFAULT_STATE)
    } else {
      // Seed default
      await supabase.from('gamification').insert({ id: 1, state: DEFAULT_STATE })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function save(newState) {
    setState(newState)
    await supabase.from('gamification').update({ state: newState, updated_at: new Date().toISOString() }).eq('id', 1)
  }

  function getLevel() {
    let current = LEVELS[0]
    for (const l of LEVELS) {
      if (state.xp >= l.xpNeeded) current = l
      else break
    }
    const nextLevel = LEVELS.find(l => l.xpNeeded > state.xp) || null
    const xpInLevel = state.xp - current.xpNeeded
    const xpForNext = nextLevel ? nextLevel.xpNeeded - current.xpNeeded : 0
    return { ...current, next: nextLevel, xpInLevel, xpForNext, progress: xpForNext > 0 ? xpInLevel / xpForNext : 1 }
  }

  function getPetStage() {
    let current = PET_STAGES[0]
    for (const s of PET_STAGES) {
      if (state.pet_health >= s.minHealth) current = s
      else break
    }
    return current
  }

  async function awardXP(action) {
    const amount = XP_REWARDS[action] || 0
    if (amount === 0) return

    const today = new Date().toISOString().split('T')[0]
    let newStreak = state.journal_streak
    let newHealth = Math.min(100, state.pet_health + 5)

    // Update streak
    if (state.last_journal_date !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      if (state.last_journal_date === yesterdayStr) {
        newStreak = state.journal_streak + 1
      } else if (state.last_journal_date && state.last_journal_date < yesterdayStr) {
        // Streak broken but starting fresh
        newStreak = 1
        newHealth = Math.max(20, state.pet_health - 10)
      } else {
        newStreak = 1
      }
    }

    // Streak bonus XP
    let bonusXP = 0
    if (newStreak === 3) bonusXP = XP_REWARDS.streak_bonus_3
    else if (newStreak === 7) bonusXP = XP_REWARDS.streak_bonus_7
    else if (newStreak === 14) bonusXP = XP_REWARDS.streak_bonus_14
    else if (newStreak === 30) bonusXP = XP_REWARDS.streak_bonus_30

    const totalJournals = {
      total_trade_journals: state.total_trade_journals + (action === 'trade_journal' ? 1 : 0),
      total_daily_journals: state.total_daily_journals + (action === 'daily_journal' ? 1 : 0),
      total_weekly_journals: state.total_weekly_journals + (action === 'weekly_journal' ? 1 : 0),
    }

    const newState = {
      ...state,
      ...totalJournals,
      xp: state.xp + amount + bonusXP,
      journal_streak: newStreak,
      longest_streak: Math.max(state.longest_streak, newStreak),
      pet_health: newHealth,
      last_journal_date: today,
    }

    await save(newState)
    return { xpGained: amount + bonusXP, streakBonus: bonusXP > 0, newStreak }
  }

  async function renamePet(name) {
    await save({ ...state, pet_name: name })
  }

  // Decay pet health if no journaling for 2+ days
  async function checkPetDecay() {
    if (!state.last_journal_date) return
    const today = new Date()
    const last = new Date(state.last_journal_date)
    const daysSince = Math.floor((today - last) / 86400000)
    if (daysSince >= 2 && state.pet_health > 10) {
      const decay = Math.min(state.pet_health - 10, daysSince * 5)
      await save({ ...state, pet_health: Math.max(10, state.pet_health - decay) })
    }
  }

  useEffect(() => {
    if (!loading) checkPetDecay()
  }, [loading])

  return {
    state,
    loading,
    getLevel,
    getPetStage,
    awardXP,
    renamePet,
    LEVELS,
    PET_STAGES,
    XP_REWARDS,
  }
}
