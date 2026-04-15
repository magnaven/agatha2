import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // getUser() validates the JWT server-side (not getSession() which is unvalidated)
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) redirect('/login')

  return <>{children}</>
}
