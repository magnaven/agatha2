import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <div className="onboard" style={{ minHeight: '100dvh' }}>
      <div className="onboard__logo">Agatha</div>
      <p className="onboard__tagline">Your health investigation starts here.</p>

      {params.error && (
        <p
          style={{
            color: 'var(--status-high-text)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {params.error}
        </p>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          className="input-field input-field--dark"
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
        />
        <input
          className="input-field input-field--dark"
          name="password"
          type="password"
          placeholder="Password (min. 6 characters)"
          required
          minLength={6}
          autoComplete="current-password"
        />
        <button className="btn btn--primary btn--full" formAction={login}>
          Log in
        </button>
        <button className="btn btn--ghost btn--full" formAction={signup}>
          Create account
        </button>
      </form>
    </div>
  )
}
