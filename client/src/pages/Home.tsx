import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'
import { Plus, Users, X } from 'lucide-react'

// Define the shape of a Pool
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

// Define the shape of a P2P Offer
interface P2POffer {
  id: string
  side: string
  stake_amount: number
  profiles: { username: string } | null
  pools: { title: string } | null
}

interface Profile {
  wallet_balance: number
  username: string
}

export default function Home({ user }: { user: User }) {
  const ADMIN_EMAIL = "makau1.peter@gmail.com"; 
  const [, setLocation] = useLocation()
  const [pools, setPools] = useState<Pool[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [offers, setOffers] = useState<P2POffer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // --- Modal & Challenge States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [stakeInput, setStakeInput] = useState<number>(0);
  const [sideSelection, setSideSelection] = useState<'Yes' | 'No'>('Yes');

  useEffect(() => {
    if (user?.id) {
      fetchData()
      fetchLobby()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [poolsRes, profileRes] = await Promise.all([
        supabase.from('pools').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('wallet_balance, username').eq('id', user.id).maybeSingle()
      ])

      if (poolsRes.data) {
        const poolsWithCount = poolsRes.data.map((p: any) => ({ 
          ...p, 
          entries_count: Math.floor(Math.random() * 10) + 1 
        }))
        setPools(poolsWithCount)
      }
      if (profileRes.data) setProfile(profileRes.data)
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLobby = async () => {
    try {
      const { data } = await supabase
        .from('p2p_offers')
        .select('*, profiles(username), pools(title)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (data) setOffers(data as unknown as P2POffer[]);
    } catch (err) {
      console.error("Lobby error:", err)
    }
  };

  const handleMatch = async (offerId: string, amount: number) => {
    if (!profile || profile.wallet_balance < amount) {
      alert("Insufficient balance!");
      return;
    }
    
    const { error } = await supabase.rpc('match_p2p_wager', {
      target_offer_id: offerId,
      taker_id: user.id,
      match_amount: amount
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Wager Matched!");
      fetchLobby();
      fetchData();
    }
  };

  const handleCreateOffer = async () => {
    if (!selectedPool || stakeInput <= 0) {
      alert("Please enter a valid stake amount");
      return;
    }
    if (profile && profile.wallet_balance < stakeInput) {
      alert("Insufficient balance to create this wager!");
      return;
    }

    const { error } = await supabase.rpc('create_p2p_offer', {
      p_pool_id: selectedPool.id,
      p_creator_id: user.id,
      p_side: sideSelection,
      p_stake_amount: stakeInput
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Offer Posted to Lobby!");
      setIsModalOpen(false);
      setStakeInput(0);
      fetchLobby();
      fetchData();
    }
  };

  const filteredPools = pools.filter(p => filter === 'all' || p.status === filter)

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            className="text-2xl font-black tracking-tighter cursor-pointer"
            style={{ 
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            onClick={() => setLocation('/')}
          >
            PARLAYZ
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">
                KSh {profile?.wallet_balance?.toLocaleString() || '0'}
              </p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-zinc-800 px-4 py-2 rounded-lg text-xs font-bold uppercase">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase italic tracking-tight">Marketplace</h2>
            <p className="text-zinc-500 font-medium">Challenge the community or join the global pot.</p>
          </div>
          {user?.email === ADMIN_EMAIL && (
            <button 
              onClick={() => setLocation('/create-pool')} 
              className="flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-4 px-8 rounded-xl uppercase text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              <Plus className="w-5 h-5" /> Admin: New Pool
            </button>
          )}
        </div>

        {/* P2P Lobby */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Live Challenges</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.length === 0 ? (
              <div className="col-span-full py-12 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                No active challenges in the lobby.
              </div>
            ) : (
              offers.map((offer) => (
                <div key={offer.id} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-[#D4AF37]/50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#D4AF37] font-black text-[10px] uppercase">@{offer.profiles?.username || 'User'}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${offer.side === 'Yes' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {offer.side}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-sm line-clamp-1">{offer.pools?.title || 'Prediction'}</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-zinc-500 font-bold tracking-tighter">Stake</p>
                      <p className="font-black text-white">KSh {offer.stake_amount.toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleMatch(offer.id, offer.stake_amount)} className="bg-white text-black font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] transition-all active:scale-95">
                      Match
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Filters */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'open', 'locked', 'settled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filter === f ? 'bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black border-transparent shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Global Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-20 text-zinc-500 uppercase font-black tracking-widest animate-pulse">Loading Markets...</div>
          ) : filteredPools.map(pool => (
            <div key={pool.id} className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-7 flex flex-col h-full hover:border-[#D4AF37]/40 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${pool.status === 'open' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-zinc-800 text-zinc-500'}`}>
                  {pool.status}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase">
                  <Users className="w-3.5 h-3.5" /> {pool.entries_count}
                </div>
              </div>

              <h3 className="text-xl font-black mb-3 line-clamp-2 uppercase cursor-pointer group-hover:text-[#FFD700] transition-colors" onClick={() => setLocation(`/pool/${pool.id}`)}>
                {pool.title}
              </h3>
              <p className="text-zinc-500 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">{pool.description}</p>

              <div className="mt-auto pt-6 border-t border-zinc-800/50">
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Global Pot</p>
                    <p className="text-lg font-black text-[#D4AF37]">KSh {(pool.stake_amount * (pool.entries_count || 1)).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setLocation(`/pool/${pool.id}`)} className="w-full bg-white/5 text-white font-black py-3 rounded-2xl text-[10px] uppercase border border-zinc-800 hover:bg-zinc-800 transition-all">
                    Join Global
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedPool(pool);
                      setIsModalOpen(true);
                    }} 
                    className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-3 rounded-2xl text-[10px] uppercase hover:scale-[1.02] transition-transform"
                  >
                    Wager a Friend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- CREATE CHALLENGE MODAL --- */}
      {isModalOpen && selectedPool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-[0_0_50px_rgba(0,0,0,1)]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-black uppercase italic mb-1 tracking-tighter">Create a Challenge</h3>
            <p className="text-zinc-500 text-xs mb-8 font-bold uppercase tracking-widest">{selectedPool.title}</p>

            <div className="space-y-8">
              {/* Prediction Toggle */}
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-4 block">Your Prediction</label>
                <div className="grid grid-cols-2 gap-3 bg-black p-1.5 rounded-2xl border border-zinc-800">
                  <button 
                    onClick={() => setSideSelection('Yes')}
                    className={`py-4 rounded-xl font-black text-xs transition-all ${sideSelection === 'Yes' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-transparent text-zinc-600'}`}
                  >
                    YES
                  </button>
                  <button 
                    onClick={() => setSideSelection('No')}
                    className={`py-4 rounded-xl font-black text-xs transition-all ${sideSelection === 'No' ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-transparent text-zinc-600'}`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {/* Stake Amount */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Stake Amount</label>
                  <span className="text-[10px] text-zinc-500 font-bold">Bal: KSh {profile?.wallet_balance?.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-zinc-500">KSh</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-black border border-zinc-800 rounded-2xl p-5 pl-14 text-xl font-black text-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-800"
                    value={stakeInput || ''}
                    onChange={(e) => setStakeInput(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={handleCreateOffer}
                disabled={stakeInput <= 0}
                className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] disabled:opacity-50 disabled:grayscale text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Post Challenge to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
