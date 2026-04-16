import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect('/login')

  // If already onboarded, skip back to the app
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profile?.onboarding_complete) redirect('/')

  return <>{children}</>
}
