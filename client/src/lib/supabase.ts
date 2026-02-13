import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ioozkbjskhxphedlwuwl.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvb3prYmpza2h4cGhlZGx3dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDg5NzksImV4cCI6MjA4MzM4NDk3OX0.K5xrBqhL5gjpB-_A1HQWTgCI5xeLxBM0hj4si477dJQ"
console.log('Supabase Init Check:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlStart: supabaseUrl?.substring(0, 10)
})

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
