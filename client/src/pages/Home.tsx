import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'
import { Plus, Users } from 'lucide-react'

interface Pool {
  id: string
  title: string
  description: string
  stake_amount: number
  pool_type: string
  outcomes: string[]
  status: string
  created_at: string
  creator_id: string
  entries_count?: number
}

interface Profile {
  wallet_balance: number
}

export default function Home({ user }: { user: User }) {
  const [, setLocation] = useLocation()
  const [pools, setPools] = useState<Pool[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [poolsRes, profileRes] = await Promise.all([
        supabase.from('pools').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('wallet_balance').eq('id', user.id).single()
      ])

      if (poolsRes.data) {
        // Mock entries count for now
        const poolsWithCount = poolsRes.data.map(p => ({ ...p, entries_count: Math.floor(Math.random() * 10) + 1 }))
        setPools(poolsWithCount)
      }
      if (profileRes.data) setProfile(profileRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPools = pools.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            className="text-2xl font-black tracking-tighter cursor-pointer select-none"
            style={{ 
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(212, 175, 55, 0.4)',
              letterSpacing: '-1px'
            }}
            onClick={() => setLocation('/')}
          >
            PARLAYZ
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">
                KSh {profile?.wallet_balance?.toLocaleString() || '0'}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2 uppercase">Active Prediction Markets</h2>
            <p className="text-zinc-500 font-medium tracking-wide">Practice with virtual currency. Real money coming soon.</p>
          </div>
          <button
            onClick={() => setLocation('/create-pool')}
            className="flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-4 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Create Pool
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'open', 'locked', 'settled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                filter === f 
                ? 'bg-gradient-to-br from-[#D4AF37] to-[#FFD700] border-transparent text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-72 bg-zinc-900/50 rounded-3xl border border-zinc-800 animate-pulse" />
            ))
          ) : filteredPools.length > 0 ? (
            filteredPools.map(pool => (
              <div 
                key={pool.id}
                className="group bg-zinc-900/20 border border-zinc-800 hover:border-[#D4AF37]/40 rounded-3xl p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                    pool.status === 'open' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    pool.status === 'locked' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                    'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                  }`}>
                    {pool.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    <Users className="w-3.5 h-3.5" />
                    {pool.entries_count} entries
                  </div>
                </div>

                <h3 className="text-xl font-black mb-3 line-clamp-2 group-hover:text-[#FFD700] transition-colors uppercase tracking-tight leading-tight flex-grow">
                  {pool.title}
                </h3>
                <p className="text-zinc-500 text-sm mb-8 line-clamp-2 font-medium leading-relaxed">
                  {pool.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {pool.outcomes.map((o, idx) => (
                    <div key={idx} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 text-center group-hover:border-zinc-700 transition-colors">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1.5">{o}</p>
                      <p className="text-base font-black text-zinc-300">{(Math.random() * 5 + 1).toFixed(0)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50 mt-auto">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-black mb-1">Pot Size</p>
                    <p className="text-lg font-black text-[#D4AF37]">KSh {(pool.stake_amount * (pool.entries_count || 1)).toLocaleString()}</p>
                  </div>
                  <button className="bg-white/5 hover:bg-gradient-to-br hover:from-[#D4AF37] hover:to-[#FFD700] hover:text-black text-white font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-xl group-hover:shadow-[#D4AF37]/10">
                    Join KSh {pool.stake_amount.toLocaleString()}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-800/50">
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-sm">No pools live in this category</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
