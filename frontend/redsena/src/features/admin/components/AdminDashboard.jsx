import { useEffect, useMemo, useState } from 'react'
import { deleteAdminPost, loadAdminPosts } from '../model/adminRepository.js'

function formatDate(value) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminPostMedia({ media }) {
  if (!media.length) {
    return <span className="text-xs text-muted">Sin medios</span>
  }

  return (
    <div className="flex items-center gap-1.5" aria-label={`${media.length} medio${media.length === 1 ? '' : 's'} adjunto${media.length === 1 ? '' : 's'}`}>
      {media.slice(0, 3).map((item) => (
        <img className="size-10 rounded-lg border border-line bg-paper object-cover" key={item.id} src={item.url} alt="" />
      ))}
      {media.length > 3 && <span className="text-xs font-bold text-muted">+{media.length - 3}</span>}
    </div>
  )
}

function AdminDashboard({ user }) {
  const [posts, setPosts] = useState([])
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    loadAdminPosts(user)
      .then((result) => {
        if (!isActive) return
        setPosts(result.nodes)
        setPageInfo(result.pageInfo)
      })
      .catch((loadError) => {
        if (isActive) setError(loadError.message || 'No se pudo cargar la administración.')
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => { isActive = false }
  }, [user])

  const mediaCount = useMemo(() => posts.reduce((total, post) => total + post.media.length, 0), [posts])
  const interactionCount = useMemo(() => posts.reduce((total, post) => total + post.likeCount + post.commentCount, 0), [posts])

  const handleLoadMore = async () => {
    if (!pageInfo.hasNextPage || isLoadingMore) return
    setIsLoadingMore(true)
    setError('')
    try {
      const result = await loadAdminPosts(user, { after: pageInfo.endCursor })
      setPosts((current) => [...current, ...result.nodes])
      setPageInfo(result.pageInfo)
    } catch (loadError) {
      setError(loadError.message || 'No se pudo cargar la siguiente página.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleDelete = async (post) => {
    const confirmed = window.confirm(`¿Eliminar la publicación de ${post.author?.displayName || 'este usuario'}? También se eliminarán sus imágenes asociadas.`)
    if (!confirmed) return

    setDeletingId(post.id)
    setError('')
    try {
      await deleteAdminPost(post.id, user)
      setPosts((current) => current.filter((item) => item.id !== post.id))
    } catch (deleteError) {
      setError(deleteError.message || 'No se pudo eliminar la publicación.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-9 lg:pt-12" aria-labelledby="admin-heading">
      <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet">Control de comunidad</p>
          <h1 id="admin-heading" className="font-serif text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-none tracking-[-0.055em] text-ink">Administración</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Revisa publicaciones, medios e interacciones desde una vista protegida para el equipo administrador.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-mint/50 bg-mint/25 px-3 py-1.5 text-xs font-extrabold text-[#26735a]"><span className="size-2 rounded-full bg-[#40b98d]" aria-hidden="true" /> Rol administrador</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_12px_30px_rgba(38,55,102,0.04)]"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-violet">Publicaciones</p><strong className="mt-2 block text-2xl font-extrabold text-ink">{posts.length}</strong><span className="text-xs text-muted">en la página actual</span></div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_12px_30px_rgba(38,55,102,0.04)]"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-violet">Medios</p><strong className="mt-2 block text-2xl font-extrabold text-ink">{mediaCount}</strong><span className="text-xs text-muted">imágenes visibles</span></div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_12px_30px_rgba(38,55,102,0.04)]"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-violet">Interacciones</p><strong className="mt-2 block text-2xl font-extrabold text-ink">{interactionCount}</strong><span className="text-xs text-muted">me gusta y comentarios</span></div>
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_18px_45px_rgba(38,55,102,0.06)]">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-lg font-extrabold text-ink">Publicaciones recientes</h2><p className="mt-1 text-xs text-muted">Ordenadas de la más reciente a la más antigua.</p></div>
          <span className="text-xs font-bold text-muted">Los cambios son permanentes</span>
        </div>

        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted" role="status" aria-live="polite">Cargando publicaciones…</div>
        ) : posts.length === 0 ? (
          <div className="px-5 py-12 text-center"><p className="font-bold text-ink">No hay publicaciones para revisar.</p><p className="mt-1 text-sm text-muted">Cuando exista actividad aparecerá aquí.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <caption className="sr-only">Publicaciones administrables</caption>
              <thead className="border-b border-line bg-paper/70 text-xs font-extrabold uppercase tracking-[0.1em] text-muted">
                <tr><th className="px-5 py-3 sm:px-6" scope="col">Publicación</th><th className="px-5 py-3" scope="col">Autor</th><th className="px-5 py-3" scope="col">Medios</th><th className="px-5 py-3" scope="col">Actividad</th><th className="px-5 py-3 sm:px-6" scope="col"><span className="sr-only">Acción</span></th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {posts.map((post) => (
                  <tr key={post.id} className="align-top transition hover:bg-paper/60">
                    <td className="max-w-sm px-5 py-4 sm:px-6"><p className="line-clamp-3 text-sm leading-6 text-ink">{post.content}</p><time className="mt-2 block text-xs text-muted" dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></td>
                    <td className="whitespace-nowrap px-5 py-4"><p className="text-sm font-bold text-ink">{post.author?.displayName || 'Miembro RedSENA'}</p><p className="mt-1 max-w-44 truncate text-xs text-muted">{post.author?.email}</p></td>
                    <td className="px-5 py-4"><AdminPostMedia media={post.media} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted"><p><strong className="text-ink">{post.likeCount}</strong> me gusta</p><p className="mt-1"><strong className="text-ink">{post.commentCount}</strong> comentarios</p></td>
                    <td className="px-5 py-4 text-right sm:px-6"><button className="min-h-10 rounded-xl border border-red-200 px-3 text-xs font-extrabold text-red-700 transition hover:bg-red-50 focus-visible:outline-3 focus-visible:outline-red-200 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => handleDelete(post)} disabled={deletingId === post.id}>{deletingId === post.id ? 'Eliminando…' : 'Eliminar'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && pageInfo.hasNextPage && <div className="flex justify-center border-t border-line px-5 py-5"><button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-[#1b2852] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60" type="button" onClick={handleLoadMore} disabled={isLoadingMore}>{isLoadingMore ? 'Cargando…' : 'Cargar más publicaciones'}</button></div>}
      </div>
    </section>
  )
}

export { AdminDashboard }
