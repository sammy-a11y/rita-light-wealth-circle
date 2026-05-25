import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user:    null,
  profile: null,
  loading: true,

  // Theme: 'dark' | 'light' | 'system'
  theme: localStorage.getItem('rlwc-theme') || 'system',

  setTheme: (theme) => {
    localStorage.setItem('rlwc-theme', theme)
    set({ theme })
  },

  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) set({ profile: data })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))
