import { useState } from 'react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'

function HeartIcon({ filled = false }) {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.18 9.18 0 0 1-4-.9L3 21l1.9-4.2A8.22 8.22 0 0 1 3 11.5 8.38 8.38 0 0 1 12 3a8.38 8.38 0 0 1 9 8.5Z" />
    </svg>
  )
}

function formatRelativeTime(dateString) {
  const seconds = Math.round((new Date(dateString).getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  const absoluteSeconds = Math.abs(seconds)

  if (absoluteSeconds < 60) return formatter.format(seconds, 'second')
  if (absoluteSeconds < 3600) return formatter.format(Math.round(seconds / 60), 'minute')
  if (absoluteSeconds < 86400) return formatter.format(Math.round(seconds / 3600), 'hour')
  return formatter.format(Math.round(seconds / 86400), 'day')
}

function PostCard({ post, user, onLike, onComment }) {
  const [comment, setComment] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [error, setError] = useState('')
  const userKey = user?.uid || user?.email
  const isLiked = (post.likedBy || []).includes(userKey)
  const comments = post.comments || []
  const authorLabel = post.author?.displayName || post.author?.email || 'Miembro RedSENA'

  const handleComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return

    setError('')
    setIsSendingComment(true)
    try {
      await onComment(post.id, comment)
      setComment('')
    } catch (commentError) {
      setError(commentError.message || 'No se pudo enviar el comentario.')
    } finally {
      setIsSendingComment(false)
    }
  }

  return (
    <article className="rounded-[24px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(38,55,102,0.045)] transition hover:shadow-[0_20px_45px_rgba(38,55,102,0.08)] sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={post.author} className="size-11 shrink-0" label={`Avatar de ${authorLabel}`} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-ink">{authorLabel}</h3>
            <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>
        <button className="grid size-8 place-items-center rounded-lg text-xl leading-none text-muted transition hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2" type="button" aria-label="Más opciones" title="Más opciones">···</button>
      </header>

      <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-[#2b3657]">{post.content}</p>

      <div className="mt-5 flex items-center gap-1 border-t border-line pt-3">
        <button
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 ${isLiked ? 'bg-[#fff0f2] text-[#c44963]' : 'text-muted hover:bg-paper hover:text-[#c44963]'}`}
          type="button"
          onClick={() => onLike(post.id)}
          aria-pressed={isLiked}
        >
          <HeartIcon filled={isLiked} />
          <span>{post.likedBy?.length || 0}</span>
          <span className="sr-only">{isLiked ? 'Me gusta quitado' : 'Me gusta'} esta publicación</span>
        </button>
        <a className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2" href={`#comments-${post.id}`}>
          <MessageIcon />
          <span>{comments.length}</span>
          <span className="sr-only">comentarios</span>
        </a>
      </div>

      {comments.length > 0 && (
        <div id={`comments-${post.id}`} className="mt-2 grid gap-2 border-t border-line pt-4">
          {comments.slice(-2).map((item) => (
            <div className="rounded-2xl bg-paper px-3.5 py-3" key={item.id}>
              <p className="text-xs font-extrabold text-ink">{item.author?.displayName || 'Miembro RedSENA'}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.content}</p>
            </div>
          ))}
        </div>
      )}

      <form className="mt-4 flex items-center gap-2" onSubmit={handleComment}>
        <UserAvatar user={user} className="size-8 shrink-0" label="Tu avatar" />
        <label className="sr-only" htmlFor={`comment-${post.id}`}>Escribe un comentario</label>
        <input
          id={`comment-${post.id}`}
          className="min-h-10 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-violet focus:ring-4 focus:ring-violet/10"
          value={comment}
          onChange={(event) => {
            setComment(event.target.value)
            setError('')
          }}
          placeholder="Añade un comentario…"
          maxLength={280}
        />
        <button className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-[#1b2852] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={isSendingComment || !comment.trim()} aria-label="Enviar comentario">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
        </button>
      </form>
      {error && <p className="mt-2 pl-10 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </article>
  )
}

export { PostCard }
