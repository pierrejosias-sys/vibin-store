import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grbwnjnngzcsjlubcmtp.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnduam5uZ3pjc2psdWJjbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgzMDEsImV4cCI6MjA5MjkzNDMwMX0.SYKFZJ0XVua0JmZ-tkaNhec2M3KtG3tS5vj_1Nl261c'
)

export default supabase
