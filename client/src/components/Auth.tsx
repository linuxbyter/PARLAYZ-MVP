import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        // Validate username
        if (username.length < 3 || username.length > 20) {
          throw new Error('Username must be 3-20 characters')
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          throw new Error('Username can only contain letters, numbers, and underscores')
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: username
            }
          }
        })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-['Inter']">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 
            className="text-6xl font-black tracking-tighter mb-3 select-none"
            style={{ 
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(212, 175, 55, 0.4)'
            }}
          >
            PARLAYZ
          </h1>
          <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-bold">Peer-to-peer predictions. No house edge.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900/50 backdrop-blur-lg rounded-3xl p-10 border border-zinc-800/50 shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-zinc-500 mb-8 font-medium">
            {isSignUp ? 'Start your premium experience' : 'Sign in to your account'}
          </p>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Username - Only show on signup */}
            {isSignUp && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-700 font-medium"
                  placeholder="premium_user"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-700 font-medium"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-700 font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-black font-black py-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-sm mt-4"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setMessage('')
                setUsername('')
              }}
              className="text-xs text-zinc-500 font-bold uppercase tracking-widest hover:text-zinc-300 transition-colors"
            >
              {isSignUp ? 'Member already?' : "New to Parlayz?"}{' '}
              <span className="text-[#D4AF37] ml-1">
                {isSignUp ? 'Sign in' : 'Join now'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
