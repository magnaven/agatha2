import { createClient } from '@supabase/supabase-js'

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test.local'
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const email = process.env.TEST_USER_EMAIL ?? 'playwright@test.agatha.dev'
  const password = process.env.TEST_USER_PASSWORD ?? 'PlaywrightTest123!'

  // Attempt to create the user; if it already exists that's fine
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error && !error.message.toLowerCase().includes('already been registered')) {
    throw new Error(`Failed to seed test user: ${error.message}`)
  }
}
