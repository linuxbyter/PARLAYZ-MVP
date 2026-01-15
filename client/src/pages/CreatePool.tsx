import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'

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
      setError('Insufficient balance')
      setLoading(false)
      return
    }

    try {
      // 1. Create Pool
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .insert({
          creator_id: user.id,
          title,
          description,
          stake_amount: stake,
          pool_type: poolType,
          outcomes: [outcome1, outcome2],
          max_entries: poolType === '1v1' ? 2 : null,
          status: 'open'
        })
        .select()
        .single()

      if (poolError) throw poolError

      // 2. Create Entry
      const { error: entryError } = await supabase.from('entries').insert({
        user_id: user.id,
        pool_id: pool.id,
        chosen_outcome: myChoice,
        stake_amount: stake
      })

      if (entryError) throw entryError

      // 3. Update Balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ wallet_balance: profile!.wallet_balance - stake })
        .eq('id', user.id)

      if (balanceError) throw balanceError

      setLocation('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400 cursor-pointer" onClick={() => setLocation('/')}>PARLAYZ</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-xl font-bold text-yellow-400">
                ${profile?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-white">Create New Pool</h2>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Title</label>
            <input maxLength={60} value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-400 outline-none" placeholder="Will it rain tomorrow?" required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea maxLength={200} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-400 outline-none h-24" placeholder="Predict if it will rain in NYC tomorrow" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Stake Amount</label>
              <input type="number" step="0.01" min="0.01" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-400 outline-none" placeholder="10.00" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pool Type</label>
              <div className="flex gap-4 py-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={poolType === 'pool'} onChange={() => setPoolType('pool')} className="accent-yellow-400" /> Open
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={poolType === '1v1'} onChange={() => setPoolType('1v1')} className="accent-yellow-400" /> 1v1
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Outcome 1</label>
              <input value={outcome1} onChange={e => { setOutcome1(e.target.value); if(myChoice === outcome1) setMyChoice(e.target.value); }} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-400 outline-none" placeholder="Yes" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Outcome 2</label>
              <input value={outcome2} onChange={e => { setOutcome2(e.target.value); if(myChoice === outcome2) setMyChoice(e.target.value); }} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-400 outline-none" placeholder="No" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">My Choice</label>
            <div className="flex gap-4 py-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={myChoice === outcome1} onChange={() => setMyChoice(outcome1)} className="accent-yellow-400" /> {outcome1}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={myChoice === outcome2} onChange={() => setMyChoice(outcome2)} className="accent-yellow-400" /> {outcome2}
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-xl transition disabled:opacity-50 mt-4">
            {loading ? 'Creating...' : 'Create Pool'}
          </button>
        </form>
      </main>
    </div>
  )
}
