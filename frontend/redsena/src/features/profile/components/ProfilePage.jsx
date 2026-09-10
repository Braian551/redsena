import { useMemo, useState } from 'react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { getProfile, loadPosts, saveProfile } from '../../posts/model/postRepository.js'

function ProfilePage({ user }) {
  const [profile, setProfile] = useState(() => getProfile(user))
  const [draftBio, setDraftBio] = useState(() => getProfile(user).bio)
  const [posts] = useState(() => loadPosts())
  const [isEditing, setIsEditing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const userKey = user?.uid || user?.email
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Miembro RedSENA'
  const userPosts = useMemo(() => posts.filter((post) => post.authorId === userKey), [posts, userKey])
  const likesReceived = useMemo(() => userPosts.reduce((total, post) => total + (post.likedBy?.length || 0), 0), [userPosts])

  const handleSave = (event) => {
    event.preventDefault()
    const nextProfile = saveProfile(user, { bio: draftBio })
    setProfile(nextProfile)
    setDraftBio(nextProfile.bio)
    setIsEditing(false)
    setIsSaved(true)
    window.setTimeout(() => setIsSaved(false), 2400)
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-9 lg:pt-12" aria-labelledby="profile-heading">
      <div className="mb-7">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet">Tu identidad en RedSENA</p>
        <h1 id="profile-heading" className="font-serif text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-none tracking-[-0.055em] text-ink">Mi perfil</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_18px_45px_rgba(38,55,102,0.06)]">
          <div className="h-28 bg-ink [background-image:radial-gradient(circle_at_88%_15%,rgba(137,240,199,0.38),transparent_28%),linear-gradient(120deg,#111a36,#30417d)]" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <UserAvatar user={user} className="size-20 border-4 border-white text-xl" label={`Avatar de ${displayName}`} />
              {!isEditing && <button className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line px-4 text-sm font-bold text-ink transition hover:bg-paper focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2" type="button" onClick={() => setIsEditing(true)}>Editar perfil</button>}
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">{displayName}</h2>
              <p className="mt-1 text-sm text-muted">{user?.email}</p>
              {isEditing ? (
                <form className="mt-5" onSubmit={handleSave}>
                  <label className="grid gap-2" htmlFor="profile-bio">
                    <span className="text-sm font-bold text-ink">Tu bio</span>
                    <textarea id="profile-bio" className="min-h-24 resize-none rounded-xl border border-line bg-paper px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-violet focus:ring-4 focus:ring-violet/10" value={draftBio} onChange={(event) => setDraftBio(event.target.value)} maxLength={180} />
                  </label>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-muted">{draftBio.length}/180 caracteres</span>
                    <div className="flex gap-2">
                      <button className="min-h-10 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-paper focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2" type="button" onClick={() => { setDraftBio(profile.bio); setIsEditing(false) }}>Cancelar</button>
                      <button className="min-h-10 rounded-xl bg-ink px-4 text-sm font-bold text-white transition hover:bg-[#1b2852] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2" type="submit">Guardar cambios</button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted">{profile.bio}</p>
              )}
              {isSaved && <p className="mt-3 text-sm font-bold text-[#26735a]" role="status">Perfil actualizado.</p>}
            </div>
          </div>
        </article>

        <aside className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[24px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(38,55,102,0.045)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet">Tu actividad</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div><strong className="block text-2xl font-extrabold text-ink">{userPosts.length}</strong><span className="mt-1 block text-xs text-muted">Publicaciones</span></div>
              <div><strong className="block text-2xl font-extrabold text-ink">{likesReceived}</strong><span className="mt-1 block text-xs text-muted">Me gusta</span></div>
              <div><strong className="block text-2xl font-extrabold text-ink">0</strong><span className="mt-1 block text-xs text-muted">Seguidores</span></div>
            </div>
          </div>
          <div className="rounded-[24px] border border-mint/40 bg-mint/25 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#26735a]">Tu espacio</p>
            <p className="mt-3 text-sm leading-6 text-[#315e50]">Tu perfil se conecta con Firebase para la identidad y queda listo para sincronizarse con el backend social.</p>
          </div>
        </aside>
      </div>

      <section className="mt-8" aria-labelledby="profile-posts-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="profile-posts-heading" className="text-xl font-extrabold tracking-tight text-ink">Tus publicaciones</h2>
          <span className="text-xs font-bold text-muted">{userPosts.length} en total</span>
        </div>
        {userPosts.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-dashed border-line bg-white p-7 text-center">
            <p className="font-bold text-ink">Todavía no has publicado.</p>
            <p className="mt-1 text-sm text-muted">Vuelve al feed y comparte tu primera idea.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {userPosts.slice(0, 4).map((post) => <article className="rounded-2xl border border-line bg-white p-4" key={post.id}><p className="line-clamp-3 text-sm leading-6 text-[#2b3657]">{post.content}</p><p className="mt-3 text-xs text-muted">{post.likedBy?.length || 0} me gusta · {post.comments?.length || 0} comentarios</p></article>)}
          </div>
        )}
      </section>
    </section>
  )
}

export { ProfilePage }
