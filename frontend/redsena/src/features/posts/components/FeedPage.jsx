import { useState } from 'react'
import { PostCard } from './PostCard.jsx'
import { PostComposer } from './PostComposer.jsx'
import { addComment, createPost, loadPosts, toggleLike } from '../model/postRepository.js'

function FeedPage({ user }) {
  const [initialFeed] = useState(() => {
    try {
      return { posts: loadPosts(), error: '' }
    } catch {
      return { posts: [], error: 'No se pudo cargar tu feed. Recarga la página para intentarlo de nuevo.' }
    }
  })
  const [posts, setPosts] = useState(initialFeed.posts)
  const [error] = useState(initialFeed.error)

  const handleCreatePost = async (content) => {
    const nextPost = createPost({ user, content })
    setPosts((currentPosts) => [nextPost, ...currentPosts])
  }

  const handleLike = (postId) => {
    const nextPost = toggleLike(postId, user)
    if (!nextPost) return
    setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? nextPost : post)))
  }

  const handleComment = async (postId, content) => {
    const result = addComment(postId, user, content)
    if (!result?.post) return
    setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? result.post : post)))
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-7 px-5 pb-16 pt-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 lg:pt-12" aria-labelledby="feed-heading">
      <div className="min-w-0">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet">Tu comunidad</p>
            <h1 id="feed-heading" className="font-serif text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-none tracking-[-0.055em] text-ink">Tu feed</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Ideas, avances y conversaciones de las personas que hacen parte de RedSENA.</p>
          </div>
          <span className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted sm:inline-flex">{posts.length} historias</span>
        </div>

        <PostComposer user={user} onSubmit={handleCreatePost} />

        {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}

        {posts.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white p-8 text-center">
            <p className="text-lg font-bold text-ink">Tu feed está esperando una historia.</p>
            <p className="mt-2 text-sm text-muted">Sé la primera persona en compartir algo con tu comunidad.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {posts.map((post) => <PostCard key={post.id} post={post} user={user} onLike={handleLike} onComment={handleComment} />)}
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
