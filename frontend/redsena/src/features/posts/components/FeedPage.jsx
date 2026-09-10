import { useEffect, useState } from 'react'
import { PostCard } from './PostCard.jsx'
import { PostComposer } from './PostComposer.jsx'
import { addComment, createPost, deletePost, loadFeedVersion, loadPosts, reportPost, toggleLike, updatePost } from '../model/postRepository.js'

const LIVE_FEED_POLL_MS = 15000

function FeedPage({ user }) {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [liveError, setLiveError] = useState('')

  useEffect(() => {
    let isActive = true
    let timerId
    let requestInFlight = false
    let currentVersion = ''

    const refreshFeed = async (initial = false) => {
      if (!isActive || requestInFlight) return
      if (!initial && document.visibilityState === 'hidden') {
        timerId = window.setTimeout(() => refreshFeed(false), LIVE_FEED_POLL_MS)
        return
      }

      requestInFlight = true
      if (!initial) setIsRefreshing(true)
      try {
        const nextVersion = await loadFeedVersion(user)
        if (!initial && nextVersion === currentVersion) return

        const nextPosts = await loadPosts(user, { force: !initial })
        if (!isActive) return
        currentVersion = nextVersion
        setPosts(nextPosts)
        setLiveError('')
      } catch (loadError) {
        if (isActive) {
          const message = loadError.message || 'No se pudo actualizar el feed.'
          if (initial) setError(`${message} Puedes intentarlo de nuevo sin recargar la página.`)
          else setLiveError(message)
        }
      } finally {
        requestInFlight = false
        if (isActive) {
          if (initial) setIsLoading(false)
          else setIsRefreshing(false)
          timerId = window.setTimeout(() => refreshFeed(false), LIVE_FEED_POLL_MS)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(timerId)
      refreshFeed(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    refreshFeed(true)
    return () => {
      isActive = false
      window.clearTimeout(timerId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const handleCreatePost = async (content, files, idempotencyKey) => {
    const nextPost = await createPost({ user, content, files, idempotencyKey })
    setPosts((currentPosts) => [nextPost, ...currentPosts])
  }

  const handleLike = async (postId, liked) => {
    const nextPost = await toggleLike(postId, user, liked)
    if (!nextPost) return
    setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? { ...post, ...nextPost } : post)))
  }

  const handleComment = async (postId, content, idempotencyKey) => {
    const result = await addComment(postId, user, content, idempotencyKey)
    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post
      if (result.post) return result.post
      return { ...post, comments: [...(post.comments || []), result.comment], commentCount: (post.commentCount || 0) + 1 }
    }))
  }

  const handleUpdatePost = async (postId, content) => {
    const nextPost = await updatePost(postId, user, content)
    setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? nextPost : post)))
  }

  const handleDeletePost = async (postId) => {
    await deletePost(postId, user)
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId))
  }

  const handleReportPost = async (postId, reason) => {
    await reportPost(postId, user, reason)
  }

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-7xl gap-7 px-5 pb-16 pt-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 lg:pt-12" aria-labelledby="feed-heading">
      <div className="min-w-0">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet">Tu comunidad</p>
            <h1 id="feed-heading" className="font-serif text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-none tracking-[-0.055em] text-ink">Tu feed</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Ideas, avances y conversaciones de las personas que hacen parte de RedSENA.</p>
            <p className="mt-2 text-xs font-semibold text-violet" role="status" aria-live="polite">{isRefreshing ? 'Buscando nuevas publicaciones…' : 'Se actualiza automáticamente sin recargar.'}</p>
          </div>
          <span className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted sm:inline-flex">{posts.length} historias</span>
        </div>

        <PostComposer user={user} onSubmit={handleCreatePost} />

        {error && <p className="mt-5 min-w-0 break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
        {liveError && <p className="mt-3 min-w-0 break-words rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{liveError} Seguiremos intentando actualizar.</p>}

        {isLoading ? (
          <div className="mt-6 rounded-[24px] border border-line bg-white p-8 text-center" role="status" aria-live="polite">Cargando tu feed…</div>
        ) : posts.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white p-8 text-center">
            <p className="text-lg font-bold text-ink">Tu feed está esperando una historia.</p>
            <p className="mt-2 text-sm text-muted">Sé la primera persona en compartir algo con tu comunidad.</p>
          </div>
        ) : (
          <div className="mt-6 grid min-w-0 gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                onLike={handleLike}
                onComment={handleComment}
                onEdit={handleUpdatePost}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-8 rounded-[24px] border border-line bg-ink p-6 text-paper shadow-[0_20px_50px_rgba(17,26,54,0.12)]">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-mint">Un espacio para avanzar</p>
          <h2 className="mt-4 font-serif text-2xl font-semibold leading-tight">Las buenas ideas crecen cuando se comparten.</h2>
          <p className="mt-4 text-sm leading-6 text-lavender">Publica un avance, pregunta algo o celebra el trabajo de alguien más.</p>
          <div className="mt-7 flex items-center gap-2 text-xs font-bold text-mint"><span className="size-2 rounded-full bg-mint" aria-hidden="true" /> Comunidad activa</div>
        </div>
      </aside>
    </section>
  )
}

export { FeedPage }
