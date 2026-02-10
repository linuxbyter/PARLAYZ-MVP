import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation, useParams } from 'wouter'
import { ArrowLeft, Users, CheckCircle2, Shield, Share2 } from 'lucide-react'

export default function MiniPoolDetail({ user }: { user: User }) {
  const { id } = useParams()
  const [, setLocation] = useLocation()
  const [miniPool, setMiniPool] = useState<any>(null)
  const [mainPool, setMainPool] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id, user])

  const fetchData = async () => {
    try {
      const { data: mp } = await supabase.from('mini_pools').select('*, profiles(username)').eq('id', id).single()
      if (mp) {
        setMiniPool(mp)
        const [pRes, eRes, prRes] = await Promise.all([
          supabase.from('pools').select('*').eq('id', mp.main_pool_id).single(),
          supabase.from('mini_pool_entries').select('*, profiles(username)').eq('mini_pool_id', id),
          supabase.from('profiles').select('*').eq('id', user.id).single()
        ])
        if (pRes.data) setMainPool(pRes.data)
        if (eRes.data) setEntries(eRes.data)
        if (prRes.data) {
            setProfile(prRes.data)
            setStakeAmount(mp.min_stake.toString())
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!selectedOutcome || !miniPool || !profile) return
    const stake = parseFloat(stakeAmount)
    if (stake < Number(miniPool.min_stake)) {
        alert(`Minimum stake is KSh ${Number(miniPool.min_stake).toLocaleString()}`)
        return
    }
    if (profile.wallet_balance < stake) {
      alert(`Insufficient balance.`)
      return
    }

    setJoining(true)
    try {
      await supabase.from('mini_pool_entries').insert({
        mini_pool_id: miniPool.id,
        user_id: user.id,
        chosen_outcome: selectedOutcome,
        stake_amount: stake
      })
      await supabase.from('profiles').update({ wallet_balance: Number(profile.wallet_balance) - stake }).eq('id', user.id)
      await fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37]">LOADING...</div>
  if (!miniPool) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Mini Pool not found</div>

  const userEntry = entries.find(e => e.user_id === user.id)
  const totalPot = entries.reduce((sum, e) => sum + Number(e.stake_amount), 0)

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation(`/pool/${miniPool.main_pool_id}`)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black tracking-tighter" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PARLAYZ</h1>
          </div>
          <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">KSh {profile?.wallet_balance?.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 mb-12 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-2">
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em]">Mini Pool</span>
                <h2 className="text-4xl font-black uppercase tracking-tight">{miniPool.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Pot Size</p>
              <p className="text-3xl font-black text-[#D4AF37]">KSh {totalPot.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 mb-10 flex items-center justify-between">
            <div>
                <p className="text-[10px] uppercase text-zinc-500 font-black mb-1">Linked to Market</p>
                <p className="font-black uppercase tracking-tight text-white">{mainPool?.title}</p>
            </div>
            <button onClick={() => setLocation(`/pool/${mainPool?.id}`)} className="text-[#D4AF37] text-xs font-black uppercase tracking-widest hover:underline">View Market</button>
          </div>

          {miniPool.status === 'open' && !userEntry && (
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Predict Outcome</label>
                    <div className="flex gap-4">
                        {mainPool?.outcomes.map((o: string) => (
                            <button key={o} onClick={() => setSelectedOutcome(o)} className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-sm border transition-all ${selectedOutcome === o ? 'bg-[#D4AF37] text-black border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                                {o}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Stake Amount (Min KSh {Number(miniPool.min_stake).toLocaleString()})</label>
                    <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all font-black" />
                </div>
                <button onClick={handleJoin} disabled={!selectedOutcome || joining} className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-sm disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {joining ? 'Joining...' : 'Join Mini Pool'}
                </button>
            </div>
          )}

          {userEntry && (
             <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
                <p className="text-[#D4AF37] font-black uppercase tracking-widest text-sm">You're in this Mini Pool! 🎯</p>
                <p className="text-zinc-400 text-xs mt-2 font-medium">Staked <span className="text-white font-black">KSh {Number(userEntry.stake_amount).toLocaleString()}</span> on <span className="text-white font-black">{userEntry.chosen_outcome}</span></p>
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Participants</h3>
                <div className="space-y-4">
                    {entries.map(e => (
                        <div key={e.id} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0">
                            <p className="font-black text-sm">@{e.profiles?.username}</p>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{e.chosen_outcome}</p>
                                <p className="text-[10px] text-[#D4AF37] font-black">KSh {Number(e.stake_amount).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Invite Friends</h3>
                    <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-[#D4AF37] transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-4">
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">Share this unique link with your friends to invite them to this private mini pool:</p>
                    <div className="bg-black/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between overflow-hidden">
                        <code className="text-[10px] text-zinc-400 truncate mr-2">{window.location.origin}/mini-pool/{id}</code>
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/mini-pool/${id}`); alert('Link copied!'); }} className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Copy</button>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  )
}
