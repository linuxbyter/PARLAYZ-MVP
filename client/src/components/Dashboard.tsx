import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'

interface Profile {
  id: string
  username: string
  wallet_balance: number
  created_at: string
}

export default function Dashboard({ user }: { user: User }) {
  const [, setLocation] = useLocation()
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
        <div className="text-[#D4AF37] text-xl animate-pulse font-bold tracking-widest">LOADING PARLAYZ...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            className="text-2xl font-bold tracking-tighter cursor-pointer select-none"
            style={{ 
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
            }}
            onClick={() => setLocation('/')}
          >
            PARLAYZ
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">
                KSh {profile?.wallet_balance?.toLocaleString() || '0.00'}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-5xl font-black mb-6 tracking-tight">
            Welcome, {profile?.username}! 🎉
          </h2>
          <p className="text-zinc-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Your account is premium. Let's start building your prediction markets today.
          </p>
          <button
            onClick={() => setLocation('/create-pool')}
            className="bg-gradient-to-br from-[#D4AF37] to-[#FFD700] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] text-black font-black py-5 px-10 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-lg uppercase tracking-widest"
          >
            Create Pool
          </button>
          
          <div className="mt-16 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-10 max-w-lg mx-auto backdrop-blur-sm">
            <p className="text-zinc-300 text-lg mb-4">
              You have <span className="text-[#D4AF37] font-black">KSh {profile?.wallet_balance?.toLocaleString()}</span> in demo credits
            </p>
            <p className="text-sm text-zinc-500 font-medium">
              Use these credits to test the platform. Real-world payments coming soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
