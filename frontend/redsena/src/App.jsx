import { useEffect, useState } from 'react'
import './App.css'
import { useAuth } from './context/useAuth.js'
import { FeedPage } from './features/posts/components/FeedPage.jsx'
import { ProfilePage } from './features/profile/components/ProfilePage.jsx'
import { AdminDashboard } from './features/admin/components/AdminDashboard.jsx'
import { loadCurrentUser } from './features/admin/model/adminRepository.js'

function BrandMark() {
  return (
    <span
      className="grid size-10 shrink-0 rotate-[-7deg] place-items-center rounded-[14px] bg-mint text-lg font-black text-ink shadow-[0_10px_24px_rgba(137,240,199,0.24)]"
      aria-hidden="true"
    >
      <span className="rotate-[7deg]">R</span>
    </span>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.74-.07-1.45-.21-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.02H3.3v2.53A9.75 9.75 0 0 0 12 21.67Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.77A5.86 5.86 0 0 1 6.23 12c0-.61.11-1.2.31-1.77V7.7H3.3A9.74 9.74 0 0 0 2.25 12c0 1.56.37 3.03 1.05 4.3l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.21c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.31 14.63 2.33 12 2.33a9.75 9.75 0 0 0-8.7 5.37l3.24 2.53C7.31 7.93 9.46 6.21 12 6.21Z"
      />
    </svg>
  )
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-paper">
      <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
        <BrandMark />
        <span className="size-6 animate-spin rounded-full border-[3px] border-mint/20 border-t-mint" aria-hidden="true" />
        <p className="m-0 text-sm text-lavender">Preparando tu espacio…</p>
      </div>
    </main>
  )
}

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="min-h-12 rounded-xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet focus:ring-4 focus:ring-violet/10"
      />
    </label>
  )
}

function AuthMessage({ message }) {
  if (!message) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-6 text-red-800" role="alert">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-red-600 text-xs font-bold text-white" aria-hidden="true">
        !
      </span>
      <span>{message}</span>
    </div>
  )
}

function AuthPage({
  error,
  onClearError,
  onRegister,
  onSignIn,
  onSignInWithGoogle,
}) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [validationError, setValidationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isRegistering = mode === 'register'

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setValidationError('')
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setValidationError('')
    onClearError()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setValidationError('')

    if (isRegistering && form.name.trim().length < 2) {
      setValidationError('Escribe tu nombre para crear la cuenta.')
      return
    }

    if (!form.email.trim()) {
      setValidationError('Escribe tu correo electrónico.')
      return
    }

    if (form.password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (isRegistering && form.password !== form.confirmPassword) {
      setValidationError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isRegistering) {
        await onRegister(form)
      } else {
        await onSignIn(form)
      }
    } catch {
      // AuthContext conserva un mensaje seguro para la vista.
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setValidationError('')
    setIsSubmitting(true)

    try {
      await onSignInWithGoogle()
    } catch {
      // AuthContext conserva un mensaje seguro para la vista.
    } finally {
      setIsSubmitting(false)
    }
  }

  const message = validationError || error

  return (
    <main className="grid min-h-screen bg-paper text-ink lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-ink text-paper lg:flex" aria-label="Información de RedSENA">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(112,230,188,0.18),transparent_25%),radial-gradient(circle_at_10%_80%,rgba(94,126,255,0.2),transparent_30%)]" />
        <div className="absolute -bottom-64 -right-80 size-[640px] rounded-full border border-lavender/10" />
        <div className="absolute -left-64 top-1/4 size-[380px] rounded-full border border-lavender/10" />
        <div className="relative z-10 flex w-full max-w-2xl flex-col p-[clamp(2rem,6vw,4.75rem)]">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <BrandMark />
            <span>RedSENA</span>
          </div>

          <div className="mt-auto max-w-xl">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-mint">Tu red, tus historias</p>
            <h1 className="max-w-lg text-[clamp(2.75rem,5.2vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.075em]">
              Conecta con lo que importa.
            </h1>
            <p className="mt-7 max-w-md text-[17px] leading-7 text-lavender">
              Comparte ideas, descubre nuevas voces y mantén cerca a tu comunidad.
            </p>

            <div className="relative mt-14 h-44 max-w-lg" aria-hidden="true">
              <span className="absolute left-1/2 top-1/2 h-80 w-44 -translate-x-1/2 -translate-y-1/2 rotate-[-13deg] rounded-[50%] border border-mint/25" />
              <span className="absolute left-1/2 top-1/2 h-28 w-80 -translate-x-1/2 -translate-y-1/2 rotate-[-13deg] rounded-[50%] border border-mint/25" />
              <span className="absolute left-[11%] top-[45%] grid size-8 place-items-center rounded-full border border-mint/35 bg-mint/15 text-xs font-extrabold text-mint">R</span>
              <span className="absolute left-[29%] top-[9%] grid size-8 place-items-center rounded-full border border-mint/35 bg-mint/15 text-xs font-extrabold text-mint">S</span>
              <span className="absolute right-[20%] top-[24%] grid size-8 place-items-center rounded-full border border-mint/35 bg-mint/15 text-xs font-extrabold text-mint">N</span>
              <span className="absolute bottom-[5%] right-[6%] grid size-8 place-items-center rounded-full border border-mint/35 bg-mint/15 text-xs font-extrabold text-mint">E</span>
              <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-mint text-2xl font-black text-ink shadow-[0_0_0_12px_rgba(137,240,199,0.08),0_12px_28px_rgba(0,0,0,0.2)]">R</span>
            </div>
          </div>

          <p className="mt-auto text-xs text-slate-400">Una comunidad hecha para avanzar juntos.</p>
        </div>
      </section>

      <section className="grid min-h-screen place-items-center px-6 py-10 sm:px-10 lg:px-[clamp(2rem,6vw,5.75rem)]" aria-labelledby="auth-heading">
        <div className="w-full max-w-[410px]">
          <div className="mb-12 flex items-center gap-3 text-xl font-bold tracking-tight lg:hidden">
            <BrandMark />
            <span>RedSENA</span>
          </div>

          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-violet">{isRegistering ? 'Empieza hoy' : 'Bienvenido de nuevo'}</p>
          <h2 id="auth-heading" className="text-[clamp(2rem,4vw,2.65rem)] font-semibold leading-tight tracking-[-0.06em]">
            {isRegistering ? 'Crea tu cuenta' : 'Entra a tu comunidad'}
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-muted">
            {isRegistering
              ? 'Únete a RedSENA y comparte lo que te mueve.'
              : 'Accede de forma segura con tu correo o cuenta de Google.'}
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit} noValidate>
            {isRegistering && (
              <Field
                id="name"
                label="Nombre"
                value={form.name}
                onChange={updateField}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            )}
            <Field
              id="email"
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
            <Field
              id="password"
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="Mínimo 6 caracteres"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
            {isRegistering && (
              <Field
                id="confirmPassword"
                label="Repite tu contraseña"
                type="password"
                value={form.confirmPassword}
                onChange={updateField}
                placeholder="Vuelve a escribirla"
                autoComplete="new-password"
              />
            )}

            <AuthMessage message={message} />

            <button
              className="mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(17,26,54,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1b2852] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-label="Procesando" />
              ) : isRegistering ? (
                'Crear cuenta'
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span>o continúa con</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <GoogleIcon />
            <span>Continuar con Google</span>
          </button>

          <p className="mt-7 text-center text-sm text-muted">
            {isRegistering ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes cuenta?'}{' '}
            <button
              className="font-bold text-violet underline decoration-violet/30 underline-offset-4 transition hover:text-[#4c5fa7] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2"
              type="button"
              onClick={() => changeMode(isRegistering ? 'login' : 'register')}
            >
              {isRegistering ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>

          <p className="mt-7 text-center text-xs leading-5 text-slate-400">
            Al continuar, aceptas nuestras condiciones de uso y política de privacidad.
          </p>
        </div>
      </section>
    </main>
  )
}

function UserAvatar({ user }) {
  if (user.photoURL) {
    return <img className="size-10 rounded-full bg-mint/30 object-cover" src={user.photoURL} alt="" />
  }

  return (
    <span className="grid size-10 place-items-center rounded-full bg-mint/30 text-sm font-extrabold text-[#276b58]">
      {(user.displayName || user.email || 'R').charAt(0).toUpperCase()}
    </span>
  )
}

function Dashboard({ user, onSignOut }) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [activeView, setActiveView] = useState('feed')
  const [backendUser, setBackendUser] = useState(null)
  const displayName = user.displayName || user.email?.split('@')[0] || 'amigo'

  useEffect(() => {
    let isActive = true
    loadCurrentUser(user)
      .then((nextUser) => {
        if (isActive) setBackendUser(nextUser)
      })
      .catch(() => {
        if (isActive) setBackendUser(null)
      })
    return () => { isActive = false }
  }, [user])

  const isAdmin = backendUser?.role === 'ADMIN'
  const selectView = (view) => setActiveView(view === 'admin' && !isAdmin ? 'feed' : view)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await onSignOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink [background-image:radial-gradient(circle_at_90%_6%,rgba(137,240,199,0.2),transparent_20%)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-line px-5 py-5 sm:px-9" aria-label="Navegación principal">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
          <BrandMark />
          <span>RedSENA</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-1 rounded-xl bg-white p-1 sm:flex">
            <button
              className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 ${activeView === 'feed' ? 'bg-ink text-white' : 'text-muted hover:bg-paper hover:text-ink'}`}
              type="button"
              onClick={() => selectView('feed')}
              aria-current={activeView === 'feed' ? 'page' : undefined}
            >
              Inicio
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 ${activeView === 'profile' ? 'bg-ink text-white' : 'text-muted hover:bg-paper hover:text-ink'}`}
              type="button"
              onClick={() => selectView('profile')}
              aria-current={activeView === 'profile' ? 'page' : undefined}
            >
              Mi perfil
            </button>
            {isAdmin && <button
              className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 ${activeView === 'admin' ? 'bg-ink text-white' : 'text-muted hover:bg-paper hover:text-ink'}`}
              type="button"
              onClick={() => selectView('admin')}
              aria-current={activeView === 'admin' ? 'page' : undefined}
            >Administración</button>}
          </div>
          <div className="hidden text-right sm:block">
            <strong className="block text-sm">{displayName}</strong>
            <span className="block max-w-56 truncate text-xs text-slate-400">{user.email}</span>
          </div>
          <UserAvatar user={user} />
          <button
            className="hidden rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:bg-white hover:text-ink focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 sm:block"
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Saliendo…' : 'Cerrar sesión'}
          </button>
        </div>
      </nav>

      <div className="sm:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 px-5 pt-5" role="tablist" aria-label="Secciones de RedSENA">
          <button className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${activeView === 'feed' ? 'bg-ink text-white' : 'bg-white text-muted'}`} type="button" onClick={() => selectView('feed')} aria-selected={activeView === 'feed'} role="tab">Inicio</button>
          <button className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${activeView === 'profile' ? 'bg-ink text-white' : 'bg-white text-muted'}`} type="button" onClick={() => selectView('profile')} aria-selected={activeView === 'profile'} role="tab">Mi perfil</button>
          {isAdmin && <button className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${activeView === 'admin' ? 'bg-ink text-white' : 'bg-white text-muted'}`} type="button" onClick={() => selectView('admin')} aria-selected={activeView === 'admin'} role="tab">Admin</button>}
        </div>
      </div>

      {activeView === 'feed' ? <FeedPage user={user} /> : activeView === 'profile' ? <ProfilePage user={user} /> : <AdminDashboard user={user} />}
    </main>
  )
}

function App() {
  const {
    clearError,
    user,
    loading,
    error,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <AuthPage
        error={error}
        onClearError={clearError}
        onRegister={registerWithEmail}
        onSignIn={signInWithEmail}
        onSignInWithGoogle={signInWithGoogle}
      />
    )
  }

  return <Dashboard user={user} onSignOut={signOut} />
}

export default App
