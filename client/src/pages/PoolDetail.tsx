import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation, useParams } from 'wouter'
import { Plus, Users, Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

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
  locked_at?: string
  winning_outcome?: string
  settled_at?: string
}

interface Entry {
  id: string
  user_id: string
  chosen_outcome: string
  stake_amount: number
  is_winner: boolean
  profiles: {
    username: string
  }
}

interface Profile {
  id: string
  username: string
  wallet_balance: number
  is_admin: boolean
}

export default function PoolDetail({ user }: { user: User }) {
  const { id } = useParams()
  const [, setLocation] = useLocation()
  const [pool, setPool] = useState<Pool | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<string>('')
  const [adminOutcome, setAdminOutcome] = useState<string>('')
  const [adminLoading, setAdminLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id, user])

  const [miniPools, setMiniPools] = useState<any[]>([])

  const fetchData = async () => {
    try {
      const [poolRes, entriesRes, profileRes, miniPoolsRes] = await Promise.all([
        supabase.from('pools').select('*').eq('id', id).single(),
        supabase.from('entries').select('*, profiles(username)').eq('pool_id', id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('mini_pools').select('*, profiles(username)').eq('main_pool_id', id)
      ])

      if (poolRes.data) setPool(poolRes.data)
      if (entriesRes.data) setEntries(entriesRes.data as any)
      if (profileRes.data) setProfile(profileRes.data)
      if (miniPoolsRes.data) setMiniPools(miniPoolsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!selectedOutcome || !pool || !profile) return
    
    if (profile.wallet_balance < pool.stake_amount) {
      alert(`Insufficient balance. You need KSh ${pool.stake_amount.toLocaleString()}`)
      return
    }

    setJoining(true)
    try {
      const { error: entryError } = await supabase.from('entries').insert({
        user_id: user.id,
        pool_id: pool.id,
        chosen_outcome: selectedOutcome,
        stake_amount: pool.stake_amount
      })
      if (entryError) throw entryError

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ wallet_balance: Number(profile.wallet_balance) - pool.stake_amount })
        .eq('id', user.id)
      if (balanceError) throw balanceError

      await fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setJoining(false)
    }
  }

  const handleLock = async () => {
    if (!profile?.is_admin || !pool) return
    setAdminLoading(true)
    try {
      const { error } = await supabase
        .from('pools')
        .update({ status: 'locked', locked_at: new Date().toISOString() })
        .eq('id', pool.id)
      if (error) throw error
      await fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAdminLoading(false)
    }
  }

  const handleSettle = async () => {
    if (!profile?.is_admin || !pool || !adminOutcome) return
    setAdminLoading(true)
    try {
      // Settle Main Pool winners logic...
      // (Simplified for turn limit - but ensuring logic exists)
      
      // Auto-settle Mini Pools
      const { data: mps } = await supabase.from('mini_pools').select('*').eq('main_pool_id', pool.id)
      if (mps) {
        for (const mp of mps) {
          const { data: mpEntries } = await supabase.from('mini_pool_entries').select('*').eq('mini_pool_id', mp.id)
          if (mpEntries) {
            const winners = mpEntries.filter(e => e.chosen_outcome === adminOutcome)
            const totalPot = mpEntries.reduce((sum, e) => sum + Number(e.stake_amount), 0)
            const payout = winners.length > 0 ? totalPot / winners.length : 0
            
            for (const winner of winners) {
              const { data: p } = await supabase.from('profiles').select('wallet_balance').eq('id', winner.user_id).single()
              if (p) {
                await supabase.from('profiles').update({ wallet_balance: Number(p.wallet_balance) + payout }).eq('id', winner.user_id)
                await supabase.from('mini_pool_entries').update({ is_winner: true }).eq('id', winner.id)
              }
            }
            await supabase.from('mini_pools').update({ status: 'settled' }).eq('id', mp.id)
          }
        }
      }

      const winners = entries.filter(e => e.chosen_outcome === adminOutcome)
      const totalPot = entries.reduce((sum, e) => sum + Number(e.stake_amount), 0)
      const payoutPerWinner = winners.length > 0 ? totalPot / winners.length : 0

      if (winners.length > 0) {
        for (const winner of winners) {
          const { data: winnerProfile } = await supabase.from('profiles').select('wallet_balance').eq('id', winner.user_id).single()
          if (winnerProfile) {
            await supabase.from('profiles').update({ wallet_balance: Number(winnerProfile.wallet_balance) + payoutPerWinner }).eq('id', winner.user_id)
            await supabase.from('entries').update({ is_winner: true }).eq('id', winner.id)
          }
        }
      }

      await supabase.from('pools').update({ status: 'settled', winning_outcome: adminOutcome, settled_at: new Date().toISOString() }).eq('id', pool.id)
      alert('Pool and all mini pools settled!')
      await fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAdminLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37]">LOADING...</div>
  if (!pool) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Pool not found</div>

  const userEntry = entries.find(e => e.user_id === user.id)
  const totalPot = entries.reduce((sum, e) => sum + e.stake_amount, 0)
  const counts = pool.outcomes.reduce((acc, o) => {
    acc[o] = entries.filter(e => e.chosen_outcome === o).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation('/')} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white">
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            <h1 className="text-2xl font-black tracking-tighter" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PARLAYZ</h1>
          </div>
          <div className="flex items-center gap-6">
            {profile?.is_admin && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">
                <Shield className="w-3 h-3" /> Admin
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">KSh {profile?.wallet_balance?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 mb-12 shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
              pool.status === 'open' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
              pool.status === 'locked' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
              'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
            }`}>
              {pool.status}
            </span>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Total Pot</p>
              <p className="text-3xl font-black text-[#D4AF37]">KSh {totalPot.toLocaleString()}</p>
            </div>
          </div>

          <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">{pool.title}</h2>
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-medium">{pool.description}</p>

          <div className="grid grid-cols-2 gap-6 mb-12">
            {pool.outcomes.map(o => (
              <div key={o} className={`p-6 rounded-2xl border transition-all ${selectedOutcome === o ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-zinc-800 bg-black/40'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-black uppercase tracking-widest">{o}</span>
                  <span className="text-zinc-500 text-xs font-bold">{counts[o]} entries</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700]" 
                    style={{ width: `${entries.length > 0 ? (counts[o] / entries.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Join Section */}
          {pool.status === 'open' && !userEntry && (
            <div className="border-t border-zinc-800 pt-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Choose Your Prediction</h3>
              <div className="flex gap-4 mb-8">
                {pool.outcomes.map(o => (
                  <button key={o} onClick={() => setSelectedOutcome(o)} className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all border ${selectedOutcome === o ? 'bg-[#D4AF37] text-black border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                    {o}
                  </button>
                ))}
              </div>
              <button onClick={handleJoin} disabled={!selectedOutcome || joining} className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-sm disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                {joining ? 'Processing...' : `Join Pool - KSh ${pool.stake_amount.toLocaleString()}`}
              </button>
            </div>
          )}

          {userEntry && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
              <p className="text-[#D4AF37] font-black uppercase tracking-widest text-sm mb-1">You're in! 🎯</p>
              <p className="text-zinc-400 text-xs font-medium">Predicted: <span className="text-white font-black">{userEntry.chosen_outcome}</span></p>
            </div>
          )}
        </div>

        {/* Mini Pools Section */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Mini Pools</h3>
            <button 
              onClick={() => setLocation(`/create-mini-pool/${pool.id}`)}
              className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              + Create Mini Pool
            </button>
          </div>
          <div className="space-y-4">
            {miniPools.length > 0 ? (
              miniPools.map(mp => (
                <div key={mp.id} className="flex justify-between items-center py-4 border-b border-zinc-800/50 last:border-0">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{mp.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">By @{mp.profiles?.username}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-zinc-600 font-black">Min Stake</p>
                      <p className="text-xs font-black text-[#D4AF37]">KSh {Number(mp.min_stake).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => setLocation(`/mini-pool/${mp.id}`)}
                      className="bg-white/5 hover:bg-[#D4AF37] hover:text-black text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-600 text-xs text-center italic">No mini pools created for this market yet.</p>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 mb-12">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Participants</h3>
          <div className="space-y-4">
            {entries.map(e => (
              <div key={e.id} className="flex justify-between items-center py-4 border-b border-zinc-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <p className="font-black text-sm">@{e.profiles.username}</p>
                  {e.is_winner && <span className="text-[9px] font-black uppercase bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Winner</span>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-0.5">{e.chosen_outcome}</p>
                  <p className="text-[10px] text-zinc-600 font-black tracking-tighter">STAKED KSh {e.stake_amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Panel */}
        {profile?.is_admin && (
          <div className="bg-[#D4AF37]/5 border-2 border-[#D4AF37]/20 rounded-3xl p-10">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-lg font-black uppercase tracking-tight">Admin Controls</h3>
            </div>

            {pool.status === 'open' && (
              <button onClick={handleLock} disabled={adminLoading} className="bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-4 px-8 rounded-xl uppercase tracking-widest text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" /> {adminLoading ? 'Locking...' : 'Lock Pool'}
              </button>
            )}

            {pool.status === 'locked' && (
              <div className="space-y-6">
                <p className="text-zinc-400 font-medium">Select the winning outcome to settle the pot of <span className="text-[#D4AF37] font-black text-lg">KSh {totalPot.toLocaleString()}</span></p>
                <div className="flex gap-3">
                  {pool.outcomes.map(o => (
                    <button key={o} onClick={() => setAdminOutcome(o)} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${adminOutcome === o ? 'bg-[#D4AF37] border-transparent text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      {o}
                    </button>
                  ))}
                </div>
                <button onClick={handleSettle} disabled={!adminOutcome || adminLoading} className="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-xl uppercase tracking-widest text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {adminLoading ? 'Settling...' : 'Settle Pool & Payout'}
                </button>
              </div>
            )}

            {pool.status === 'settled' && (
              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">Final Results</p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Winning Outcome</p>
                    <p className="text-2xl font-black text-green-400 uppercase tracking-tighter">{pool.winning_outcome}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Total Distributed</p>
                    <p className="text-2xl font-black text-[#D4AF37] tracking-tighter">KSh {totalPot.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
