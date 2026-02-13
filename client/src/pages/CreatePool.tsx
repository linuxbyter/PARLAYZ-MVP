import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'
import { Plus } from 'lucide-react'

interface Profile {
  id: string
  username: string
  wallet_balance: number
}

export default function CreatePool({ user }: { user: User }) {
  const [, setLocation] = useLocation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ADMIN_EMAIL = "makau1.peter@gmail.com"; // Replace with your actual email
  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [poolType, setPoolType] = useState<'pool' | '1v1'>('pool')
  const [outcome1, setOutcome1] = useState('Yes')
  const [outcome2, setOutcome2] = useState('No')
  const [myChoice, setMyChoice] = useState('Yes')

  useEffect(() => {
    getProfile()
  }, [user])

  const getProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const stake = parseFloat(stakeAmount)
    if (!title || !description || isNaN(stake) || !outcome1 || !outcome2) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (profile && profile.wallet_balance < stake) {
      setError(`Insufficient balance. You need KSh ${stake.toLocaleString()}`)
      setLoading(false)
      return
    }

    try {
    // STEP 1: Create the actual Pool
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .insert({
        title,
        description,
        stake_amount: stake,
        pool_type: 'binary',
        outcomes: ['Yes', 'No'],
        creator_id: user.id,
        status: 'open'
      })
      .select()
      .single()

    if (poolError) throw poolError

    // --- THE FIX STARTS HERE ---
    // If you are the ADMIN, we skip the part where you have to join and pay
    const ADMIN_EMAIL = "your-email@example.com"; 

    if (user.email !== ADMIN_EMAIL) {
      // 2. Create Entry (Forced Join for regular users)
      const { error: entryError } = await supabase.from('entries').insert({
        user_id: user.id,
        pool_id: pool.id,
        chosen_outcome: outcomes[0], // or your state variable for choice
        stake_amount: stake
      })
      if (entryError) throw entryError

      // 3. Deduct Credits from user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ wallet_balance: (profile?.wallet_balance || 0) - stake })
        .eq('id', user.id)
      if (balanceError) throw balanceError
    }
    // --- THE FIX ENDS HERE ---

    setLocation('/')
  } catch (err: any) {
    alert(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
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
                KSh {profile?.wallet_balance?.toLocaleString() || '0.00'}
              </p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setLocation('/')}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-500 hover:text-white"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </button>
          <h2 className="text-4xl font-black tracking-tight uppercase">Create Pool</h2>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-8 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/40 p-10 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Pool Title</label>
            <input maxLength={60} value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700 font-medium" placeholder="Will it rain tomorrow?" required />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Description</label>
            <textarea maxLength={200} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none h-28 transition-all placeholder:text-zinc-700 font-medium" placeholder="Describe the prediction pool details..." required />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Stake Amount (KSh)</label>
              <input type="number" step="1" min="1" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700 font-black" placeholder="1000" required />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Pool Type</label>
              <div className="flex gap-6 py-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" checked={poolType === 'pool'} onChange={() => setPoolType('pool')} className="accent-[#D4AF37] w-4 h-4" /> 
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Open</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" checked={poolType === '1v1'} onChange={() => setPoolType('1v1')} className="accent-[#D4AF37] w-4 h-4" /> 
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">1v1</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Outcome A</label>
              <input value={outcome1} onChange={e => { setOutcome1(e.target.value); if(myChoice === outcome1) setMyChoice(e.target.value); }} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700 font-bold" placeholder="Yes" required />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Outcome B</label>
              <input value={outcome2} onChange={e => { setOutcome2(e.target.value); if(myChoice === outcome2) setMyChoice(e.target.value); }} className="w-full bg-black/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700 font-bold" placeholder="No" required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">My Selection</label>
            <div className="flex gap-8 py-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" checked={myChoice === outcome1} onChange={() => setMyChoice(outcome1)} className="accent-[#D4AF37] w-4 h-4" /> 
                <span className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{outcome1}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" checked={myChoice === outcome2} onChange={() => setMyChoice(outcome2)} className="accent-[#D4AF37] w-4 h-4" /> 
                <span className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{outcome2}</span>
              </label>
            </div>
          </div>

          

          {user.email === ADMIN_EMAIL ? (
  <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] ...">
    {loading ? 'Processing...' : 'Launch Official Pool'}
  </button>
) : (
  <div className="bg-zinc-800/50 p-6 rounded-2xl text-center border border-zinc-700">
    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
      Official pool creation is restricted to Admins.
    </p>
    <p className="text-[#D4AF37] text-sm mt-2 font-black uppercase">
      Challenge a friend feature coming soon!
    </p>
  </div>
)}

          
          <div className="mt-12 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 max-w-lg mx-auto backdrop-blur-sm text-center">
            <p className="text-zinc-300 text-lg mb-4">
              You have <span className="text-[#D4AF37] font-black">KSh {profile?.wallet_balance?.toLocaleString()}</span> in demo credits
            </p>
            <p className="text-sm text-zinc-500 font-medium">
              Practice with virtual currency. Real money coming soon.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
