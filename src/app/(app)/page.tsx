import { signOut } from '@/app/(auth)/login/actions'
import { createClient } from '@/lib/supabase/server'

export default async function AppPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <div className="screen" style={{ padding: '44px 24px 32px' }}>
      <h1 className="h1" style={{ marginBottom: '8px' }}>
        Welcome to Agatha
      </h1>
      <p className="text-sm text-mid" style={{ marginBottom: '32px' }}>
        Signed in as {data?.user?.email}
      </p>
      <form>
        <button
          className="btn btn--muted btn--sm"
          formAction={signOut}
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
