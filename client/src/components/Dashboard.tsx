import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  wallet_balance: number
  created_at: string
}

export default function Dashboard({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
  }, [user])

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">PARLAYZ</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-xl font-bold text-yellow-400">
                ${profile?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-4xl font-bold mb-4">
            Welcome, {profile?.username}! 🎉
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Your account is set up. Let's start building pools!
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-gray-300 mb-4">
              You have <span className="text-yellow-400 font-bold">${profile?.wallet_balance?.toFixed(2)}</span> in mock money
            </p>
            <p className="text-sm text-gray-500">
              (This is fake money for testing. We'll add real payments later.)
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
