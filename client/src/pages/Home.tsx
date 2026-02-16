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

export default function Home({ user }: { user: User }) {
  const ADMIN_EMAIL = "makau1.peter@gmail.com"; 
  const [, setLocation] = useLocation()
  const [pools, setPools] = useState<Pool[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [offers, setOffers] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchData()
      fetchLobby()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [poolsRes, profileRes] = await Promise.all([
        supabase.from('pools').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      ])

      if (poolsRes.data) {
        const poolsWithCount = poolsRes.data.map(p => ({ 
          ...p, 
          entries_count: Math.floor(Math.random() * 10) + 1 
        }))
        setPools(poolsWithCount)
      }
      if (profileRes.data) setProfile(profileRes.data)
    } catch (err) {
      console.error("Fetch Data Error:", err)
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
      
      if (data) setOffers(data);
    } catch (err) {
      console.error("Lobby Fetch Error:", err)
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

    if (error) alert(error.message);
    else {
      alert("Matched!");
      fetchLobby();
      fetchData();
    }
  };

  const filteredPools = pools.filter(p => filter === 'all' || p.status === filter)

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter" style={{ color: '#D4AF37' }}>PARLAYZ</h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase text-zinc-500 font-bold">Credits</p>
              <p className="text-xl font-black text-[#D4AF37]">
                KSh {profile?.wallet_balance?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* P2P Lobby */}
        <section className="mb-12">
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-6">Live P2P Lobby</h3>
          <div className="grid gap-4">
            {offers?.map((offer) => (
              <div key={offer.id} className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-[#D4AF37]">@{offer.profiles?.username}</p>
                  <p className="text-sm font-bold">{offer.pools?.title}</p>
                </div>
                <button 
                  onClick={() => handleMatch(offer.id, offer.stake_amount)}
                  className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Match {offer.stake_amount}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Global Pools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPools.map(pool => (
            <div key={pool.id} className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="text-lg font-black mb-4 uppercase">{pool.title}</h3>
              <button 
                onClick={() => setLocation(`/pool/${pool.id}`)}
                className="w-full bg-zinc-800 text-white py-3 rounded-xl text-[10px] font-black uppercase"
              >
                Join Pool
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
