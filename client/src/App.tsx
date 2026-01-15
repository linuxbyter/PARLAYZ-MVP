import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import CreatePool from './pages/CreatePool'
import type { User } from '@supabase/supabase-js'
import { Switch, Route } from 'wouter'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">Loading Parlayz...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard user={user} />} />
      <Route path="/create-pool" component={() => <CreatePool user={user} />} />
    </Switch>
  )
}

export default App
