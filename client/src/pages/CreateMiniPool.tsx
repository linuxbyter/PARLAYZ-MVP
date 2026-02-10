import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation, useParams } from 'wouter'
import { Plus, ArrowLeft, Shield } from 'lucide-react'

export default function CreateMiniPool({ user }: { user: User }) {
  const { mainPoolId } = useParams()
  const [, setLocation] = useLocation()
  const [name, setName] = useState('')
  const [minStake, setMinStake] = useState('200')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: miniPool, error: mpError } = await supabase
        .from('mini_pools')
        .insert({
          main_pool_id: mainPoolId,
          creator_id: user.id,
          name,
          min_stake: parseFloat(minStake)
        })
        .select()
        .single()

      if (mpError) throw mpError
      setLocation(`/pool/${mainPoolId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation(`/pool/${mainPoolId}`)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black tracking-tighter" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PARLAYZ</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-4xl font-black tracking-tight uppercase">Create Mini Pool</h2>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-8 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/40 p-10 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Mini Pool Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700 font-medium" placeholder="E.g. Sunday Squad" required />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Minimum Stake (KSh)</label>
            <input type="number" step="1" min="200" value={minStake} onChange={e => setMinStake(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700 font-black" placeholder="200" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-sm disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {loading ? 'Processing...' : 'Launch Mini Pool'}
          </button>
        </form>
      </main>
    </div>
  )
}
