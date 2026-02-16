import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useLocation } from 'wouter'
import { Plus, Users, Swords, Activity } from 'lucide-react'

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
  username: string
}

export default function Home({ user }: { user: User }) {
  const ADMIN_EMAIL = "makau1.peter@gmail.com"; 
  const [, setLocation] = useLocation()
  const [pools, setPools] = useState<Pool[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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
        supabase.from('profiles').select('wallet_balance, username').eq('id', user.id).maybeSingle()
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
    if (data) setOffers(data);
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
      alert("Wager Matched!");
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
              Web
