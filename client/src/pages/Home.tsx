import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'
import { Plus, Users, X, Briefcase, LayoutGrid, LogOut } from 'lucide-react'

// --- TYPES ---
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

interface P2POffer {
  id: string
  side: string
  stake_amount: number
  status: string
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

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'market' | 'my_wagers'>('market')
  const [pools, setPools] = useState<Pool[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [offers, setOffers] = useState<P2POffer[]>([])
  const [myWagers, setMyWagers] = useState<P2POffer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [stakeInput, setStakeInput] = useState<number>(0)
  const [sideSelection, setSideSelection] = useState<'Yes' | 'No'>('Yes')

  useEffect(() => {
    if (user?.id) {
      fetchData()
      fetchLobby()
      if (activeTab === 'my_wagers') fetchMyWagers()
    }
  }, [user, activeTab])

  const fetchData = async () => {
    try {
      const [poolsRes, profileRes] = await Promise.all([
        supabase.from('pools').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('wallet_balance, username').eq('id', user.id).maybeSingle()
      ])

      if (poolsRes.data) {
        setPools(poolsRes.data.map((p: any) => ({ ...p, entries_count: Math.floor(Math.random() * 10) + 1 })))
      }
      if (profileRes.data) setProfile(profileRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLobby = async () => {
    const { data } = await supabase
      .from('p2p_offers')
      .select('*, profiles(username), pools(title)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (data) setOffers(data as unknown as P2POffer[]);
  };

  const fetchMyWagers = async () => {
    const { data } = await supabase
      .from('p2p_offers')
      .select('*, profiles(username), pools(title)')
      .or(`creator_id.eq.${user.id},taker_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (data) setMyWagers(data as unknown as P2POffer[]);
  };

  const handleMatch = async (offerId: string, amount: number) => {
    if (!profile || profile.wallet_balance < amount) return alert("Insufficient balance!");
    const { error } = await supabase.rpc('match_p2p_wager', {
      target_offer_id: offerId,
      taker_id: user.id,
      match_amount: amount
    });
    if (error) alert(error.message);
    else { alert("Wager Matched! Game on."); fetchLobby(); fetchData(); }
  };

  const handleCreateOffer = async () => {
    if (!selectedPool || stakeInput <= 0) return;
    const { error } = await supabase.rpc('create_p2p_offer', {
      p_pool_id: selectedPool.id,
      p_creator_id: user.id,
      p_side: sideSelection,
      p_stake_amount: stakeInput
    });
    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      setStakeInput(0);
      fetchLobby();
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter cursor-pointer text-[#D4AF37]" onClick={() => setLocation('/')}>PARLAYZ</h1>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">KSh {profile?.wallet_balance?.toLocaleString() || '0'}</p>
            </div>
            {/* --- RESTORED SIGN OUT --- */}
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-500"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Tab Toggle */}
        <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 mb-12 w-fit">
          <button onClick={() => setActiveTab('market')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'market' ? 'bg-zinc-800 text-[#D4AF37] shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
            <LayoutGrid className="w-4 h-4" /> Marketplace
          </button>
          <button onClick={() => setActiveTab('my_wagers')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my_wagers' ? 'bg-zinc-800 text-[#D4AF37] shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
            <Briefcase className="w-4 h-4" /> My Wagers
          </button>
        </div>

        {activeTab === 'market' ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <h2 className="text-4xl font-black uppercase italic tracking-tight">Marketplace</h2>
              {user?.email === ADMIN_EMAIL && (
                <button onClick={() => setLocation('/create-pool')} className="flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-4 px-8 rounded-xl uppercase text-xs">
                  <Plus className="w-5 h-5" /> Admin: New Pool
                </button>
              )}
            </div>

            {/* Lobby List */}
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Live Challenges</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.length === 0 ? (
                  <p className="text-zinc-600 text-[10px] uppercase font-bold">No active challenges yet...</p>
                ) : offers.map((offer) => (
                  <div key={offer.id} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-[#D4AF37]/50 transition-all">
                    <div>
                      <p className="text-[#D4AF37] font-black text-[10px] uppercase mb-1">@{offer.profiles?.username}</p>
                      <h4 className="text-white font-bold text-sm">{offer.pools?.title}</h4>
                      <p className={`text-[10px] font-bold uppercase ${offer.side === 'Yes' ? 'text-green-500' : 'text-red-500'}`}>Backing {offer.side}</p>
                    </div>
                    <button onClick={() => handleMatch(offer.id, offer.stake_amount)} className="bg-white text-black font-black px-6 py-3 rounded-xl text-[10px] uppercase hover:bg-[#D4AF37] transition-all">Match KSh {offer.stake_amount}</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Pool Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pools.map(pool => (
                <div key={pool.id} className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-7 flex flex-col h-full group hover:border-[#D4AF37]/50 transition-all">
                  <div className="flex justify-between mb-4">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{pool.status}</span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-black"><Users className="w-3 h-3"/> {pool.entries_count}</div>
                  </div>
                  <h3 className="text-xl font-black mb-3 uppercase group-hover:text-[#FFD700] transition-colors">{pool.title}</h3>
                  <p className="text-zinc-500 text-sm mb-8 line-clamp-2">{pool.description}</p>
                  <div className="mt-auto space-y-2">
                    <button onClick={() => setLocation(`/pool/${pool.id}`)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 rounded-2xl text-[10px] uppercase transition-all">Join Global</button>
                    <button onClick={() => { setSelectedPool(pool); setIsModalOpen(true); }} className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-3 rounded-2xl text-[10px] uppercase hover:scale-[1.02] transition-all">Wager a Friend</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* My Wagers View */
          <div className="max-w-3xl mx-auto space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 font-black mb-6">Your Open & Matched Bets</h3>
            {myWagers.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl text-zinc-600 uppercase text-[10px] font-black">You haven't made any moves yet.</div>
            ) : (
              myWagers.map((wager) => (
                <div key={wager.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center group">
                  <div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mb-2 inline-block ${wager.status === 'matched' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{wager.status}</span>
                    <h4 className="text-white font-bold">{wager.pools?.title}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-black">Stake: KSh {wager.stake_amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase text-zinc-500 font-black mb-1">Your Side</p>
                    <p className={`text-lg font-black ${wager.side === 'Yes' ? 'text-green-500' : 'text-red-500'}`}>{wager.side}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* --- CREATE CHALLENGE MODAL --- */}
      {isModalOpen && selectedPool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"><X /></button>
            <h3 className="text-xl font-black uppercase italic mb-1 tracking-tighter">New Challenge</h3>
            <p className="text-zinc-500 text-[10px] uppercase font-bold mb-8">{selectedPool.title}</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-500 mb-3 block">Pick Your Side</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSideSelection('Yes')} className={`py-4 rounded-xl font-black text-xs transition-all ${sideSelection === 'Yes' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-zinc-800 text-zinc-500'}`}>YES</button>
                  <button onClick={() => setSideSelection('No')} className={`py-4 rounded-xl font-black text-xs transition-all ${sideSelection === 'No' ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'bg-zinc-800 text-zinc-500'}`}>NO</button>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-500 mb-3 block">Stake (KSh)</label>
                <input type="number" placeholder="0" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xl font-black text-[#D4AF37] outline-none focus:border-[#D4AF37] transition-all" value={stakeInput || ''} onChange={(e) => setStakeInput(Number(e.target.value))} />
              </div>

              <button onClick={handleCreateOffer} className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black font-black py-5 rounded-2xl uppercase text-xs tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all">Post Challenge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
