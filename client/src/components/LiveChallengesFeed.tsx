import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface P2POffer {
  id: string;
  event_id: string;
  creator_id: string;
  taker_id: string | null;
  chosen_outcome: string;
  stake_amount: number;
  min_match_amount: number;
  status: string;
  created_at: string;
  // Explicitly typed joins
  creator_profile?: {
    username: string;
    wallet_balance?: number;
  };
  taker_profile?: {
    username: string;
  } | null;
}

interface LiveChallengesFeedProps {
  eventId: string;
  eventOutcomes: string[];
  currentUserId?: string;
}

export default function LiveChallengesFeed({ 
  eventId, 
  eventOutcomes,
  currentUserId 
}: LiveChallengesFeedProps) {
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchingOfferId, setMatchingOfferId] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  // Fetch offers with EXPLICIT foreign key relationships
  useEffect(() => {
    fetchOffers();

    // Real-time subscription
    const subscription = supabase
      .channel(`p2p_offers_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'p2p_offers',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // FIX: Use column names instead of constraint names for disambiguation
      const { data, error: fetchError } = await supabase
        .from('p2p_offers')
        .select(`
          *,
          creator_profile:profiles!creator_id(
            username,wallet_balance
          ),
          taker_profile:profiles!taker_id(
            username
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }

      setOffers(data || []);
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      setError(err.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchOffer = async (offer: P2POffer, matchStake: number) => {
    try {
      setMatchingOfferId(offer.id);
      setError('');

      // Call your Supabase RPC function
      const { data, error: rpcError } = await supabase
        .rpc('match_challenge_v1', {
          p_offer_id: offer.id,
          p_matcher_stake: matchStake
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      // Success - refresh offers
      await fetchOffers();
      
      alert(`Challenge matched! KSh ${(offer.stake_amount + matchStake).toLocaleString()} locked in escrow.`);
      
    } catch (err: any) {
      console.error('Error matching offer:', err);
      setError(err.message || 'Failed to match challenge');
    } finally {
      setMatchingOfferId(null);
    }
  };

  const getOppositeOutcome = (chosenOutcome: string): string => {
    return eventOutcomes.find(outcome => outcome !== chosenOutcome) || '';
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-yellow-400 text-lg">Loading challenges...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
        <div className="font-semibold mb-1">Error loading challenges</div>
        <div className="text-sm">{error}</div>
        <button 
          onClick={fetchOffers}
          className="mt-3 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold text-white mb-2">No Open Challenges</h3>
        <p className="text-gray-400">Be the first to create a challenge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Options */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="text-sm text-gray-400">
          {offers.length} open {offers.length === 1 ? 'challenge' : 'challenges'}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setSelectedOutcome(null)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              selectedOutcome === null
                ? 'bg-yellow-400 text-black'
                : 'bg-zinc-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {eventOutcomes.map(outcome => (
            <button
              key={outcome}
              onClick={() => setSelectedOutcome(outcome)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                selectedOutcome === outcome
                  ? 'bg-yellow-400 text-black'
                  : 'bg-zinc-800 text-gray-400 hover:text-white'
              }`}
            >
              {outcome}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {offers
          .filter(o => selectedOutcome === null || o.chosen_outcome === selectedOutcome)
          .map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              oppositeOutcome={getOppositeOutcome(offer.chosen_outcome)}
              isOwnOffer={offer.creator_id === currentUserId}
              isMatching={matchingOfferId === offer.id}
              onMatch={handleMatchOffer}
              formatTimeAgo={formatTimeAgo}
            />
          ))}
      </div>
    </div>
  );
}

// Offer Card Component
interface OfferCardProps {
  offer: P2POffer;
  oppositeOutcome: string;
  isOwnOffer: boolean;
  isMatching: boolean;
  onMatch: (offer: P2POffer, stake: number) => void;
  formatTimeAgo: (timestamp: string) => string;
}

function OfferCard({
  offer,
  oppositeOutcome,
  isOwnOffer,
  isMatching,
  onMatch,
  formatTimeAgo
}: OfferCardProps) {
  const [customStake, setCustomStake] = useState(offer.stake_amount);

  const handleMatch = () => {
    if (customStake < offer.min_match_amount) {
      alert(`Minimum match amount is KSh ${offer.min_match_amount.toLocaleString()}`);
      return;
    }
    onMatch(offer, customStake);
  };

  const creatorUsername = offer.creator_profile?.username || 'Anonymous';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-yellow-400/50 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-lg">
            {creatorUsername[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-semibold text-white">@{creatorUsername}</div>
            <div className="text-sm text-gray-400">{formatTimeAgo(offer.created_at)}</div>
          </div>
        </div>
        
        {isOwnOffer && (
          <div className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
            Your Challenge
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Bet Details */}
        <div className="bg-black rounded-lg p-4 border border-zinc-800">
          <div className="text-sm text-gray-400 mb-1">Betting on</div>
          <div className="text-2xl font-bold text-yellow-400 mb-3">
            {offer.chosen_outcome}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              KSh {offer.stake_amount.toLocaleString()}
            </span>
            {offer.min_match_amount < offer.stake_amount && (
              <span className="text-sm text-gray-400">
                (min: KSh {offer.min_match_amount.toLocaleString()})
              </span>
            )}
          </div>
        </div>

        {/* Match Section */}
        {!isOwnOffer && (
          <div className="border-t border-zinc-800 pt-4">
            <div className="text-sm text-gray-400 mb-3">
              You'll be betting on: <span className="text-white font-semibold">{oppositeOutcome}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Your stake (min: KSh {offer.min_match_amount.toLocaleString()})
                </label>
                <input
                  type="number"
                  value={customStake}
                  onChange={(e) => setCustomStake(Number(e.target.value))}
                  min={offer.min_match_amount}
                  step={100}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition"
                />
              </div>

              <div className="bg-zinc-800 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Total pot:</span>
                  <span className="text-white font-semibold">
                    KSh {(offer.stake_amount + customStake).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Platform fee (3%):</span>
                  <span className="text-white">
                    KSh {((offer.stake_amount + customStake) * 0.03).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-yellow-400 font-bold pt-2 border-t border-zinc-700">
                  <span>If you win:</span>
                  <span>
                    KSh {((offer.stake_amount + customStake) * 0.97).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleMatch}
                disabled={isMatching}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMatching ? 'Matching...' : 'Match This Challenge'}
              </button>
            </div>
          </div>
        )}

        {isOwnOffer && (
          <div className="text-center py-4 text-gray-400 text-sm">
            Waiting for someone to match your challenge...
          </div>
        )}
      </div>
    </div>
  );
                                  }
      
