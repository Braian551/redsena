import { useState } from 'react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'

const reportReasons = [
  ['SPAM', 'Spam o publicidad no deseada'],
  ['HARASSMENT', 'Acoso o hostigamiento'],
  ['HATE_SPEECH', 'Discurso de odio'],
  ['VIOLENCE', 'Violencia o amenazas'],
  ['SEXUAL_CONTENT', 'Contenido sexual'],
  ['MISINFORMATION', 'Información engañosa'],
  ['OTHER', 'Otro motivo'],
]

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

function PostCard({ post, user, onLike, onComment, onEdit, onDelete, onReport }) {
  const [comment, setComment] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [error, setError] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [reportReason, setReportReason] = useState('SPAM')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const userKey = user?.uid || user?.email
  const isLiked = typeof post.likedByViewer === 'boolean' ? post.likedByViewer : (post.likedBy || []).includes(userKey)
  const comments = post.comments || []
  const likeCount = post.likeCount ?? post.likedBy?.length ?? 0
  const commentCount = post.commentCount ?? comments.length
  const isOwner = post.authorId === userKey || post.author?.id === userKey || post.author?.email === user?.email
  const author = isOwner ? user : post.author
  const authorLabel = author?.displayName || author?.email || 'Miembro RedSENA'

  const handleComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return

    setError('')
    setIsSendingComment(true)
    const operationKey = idempotencyKey || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    try {
      await onComment(post.id, comment, operationKey)
      setComment('')
      setIdempotencyKey(null)
    } catch (commentError) {
      setIdempotencyKey(operationKey)
      setError(commentError.message || 'No se pudo enviar el comentario.')
    } finally {
      setIsSendingComment(false)
    }
  }

  const startEditing = () => {
    setEditContent(post.content)
    setIsEditing(true)
    setIsMenuOpen(false)
    setIsDeleteConfirming(false)
    setError('')
    setActionMessage('')
  }

  const handleEdit = async (event) => {
    event.preventDefault()
    if (!editContent.trim()) {
      setError('Escribe algo antes de guardar los cambios.')
      return
    }
    setIsSavingEdit(true)
    setError('')
    try {
      await onEdit(post.id, editContent)
      setIsEditing(false)
      setActionMessage('Publicación actualizada.')
    } catch (editError) {
      setError(editError.message || 'No se pudo actualizar la publicación.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setError('')
    try {
      await onDelete(post.id)
    } catch (deleteError) {
      setError(deleteError.message || 'No se pudo eliminar la publicación.')
      setIsDeleting(false)
    }
  }

  const handleReport = async (event) => {
    event.preventDefault()
    setIsSubmittingReport(true)
    setError('')
    try {
      await onReport(post.id, reportReason)
      setIsReporting(false)
      setActionMessage('Gracias. Recibimos tu reporte.')
    } catch (reportError) {
      setError(reportError.message || 'No se pudo enviar el reporte.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <article className="w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(38,55,102,0.045)] transition hover:shadow-[0_20px_45px_rgba(38,55,102,0.08)] sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={author} className="size-11 shrink-0" label={`Avatar de ${authorLabel}`} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-ink">{authorLabel}</h3>
            <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>
        <div className="relative">
          <button
            className="grid size-8 place-items-center rounded-lg text-xl leading-none text-muted transition hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2"
            type="button"
            aria-label="Más opciones"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            title="Más opciones"
            onClick={() => setIsMenuOpen((open) => !open)}
          >···</button>
          {isMenuOpen && (
            <div className="absolute right-0 z-10 mt-2 grid w-44 gap-1 rounded-xl border border-line bg-white p-1.5 shadow-[0_14px_30px_rgba(38,55,102,0.14)]" role="menu">
              {isOwner ? (
                <>
                  <button className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-paper" type="button" role="menuitem" onClick={startEditing}>Editar</button>
                  <button className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50" type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); setIsDeleteConfirming(true); setActionMessage('') }}>Eliminar</button>
                </>
              ) : (
                <button className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-paper" type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); setIsReporting(true); setActionMessage(''); setError('') }}>Reportar publicación</button>
              )}
            </div>
          )}
        </div>
      </header>

      {isEditing ? (
        <form className="mt-5 grid gap-3" onSubmit={handleEdit}>
          <label className="sr-only" htmlFor={`edit-post-${post.id}`}>Edita tu publicación</label>
          <textarea id={`edit-post-${post.id}`} className="min-h-28 w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] leading-7 text-ink outline-none focus:border-violet focus:ring-4 focus:ring-violet/10" value={editContent} onChange={(event) => { setEditContent(event.target.value); setError('') }} maxLength={500} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">{editContent.length}/500 caracteres</span>
            <div className="flex gap-2">
              <button className="rounded-xl px-3 py-2 text-sm font-bold text-muted hover:bg-paper" type="button" onClick={() => setIsEditing(false)}>Cancelar</button>
              <button className="rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-[#1b2852] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={isSavingEdit || !editContent.trim()}>{isSavingEdit ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mt-5 break-words whitespace-pre-wrap text-[15px] leading-7 text-[#2b3657]">{post.content}</p>
      )}

      {post.media?.length > 0 && (
        <div className={`mt-5 grid min-w-0 gap-2 ${post.media.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {post.media.map((media) => (
            <div className="aspect-[4/3] min-w-0 overflow-hidden rounded-2xl border border-line" key={media.id}>
              <img className="size-full max-w-full object-cover" src={media.url} alt="Imagen adjunta a la publicación" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {isDeleteConfirming && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-words text-sm font-semibold text-red-800">¿Eliminar esta publicación? Esta acción no se puede deshacer.</p>
          <div className="flex shrink-0 gap-2">
            <button className="rounded-xl px-3 py-2 text-sm font-bold text-red-800 hover:bg-white" type="button" onClick={() => setIsDeleteConfirming(false)}>Cancelar</button>
            <button className="rounded-xl bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60" type="button" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
          </div>
        </div>
      )}

      {isReporting && (
        <form className="mt-4 grid min-w-0 gap-3 rounded-2xl border border-line bg-paper px-4 py-3" onSubmit={handleReport}>
          <div>
            <label className="text-sm font-bold text-ink" htmlFor={`report-reason-${post.id}`}>¿Por qué reportas esta publicación?</label>
            <select id={`report-reason-${post.id}`} className="mt-2 min-h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-violet focus:ring-4 focus:ring-violet/10" value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
              {reportReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button className="rounded-xl px-3 py-2 text-sm font-bold text-muted hover:bg-white" type="button" onClick={() => setIsReporting(false)}>Cancelar</button>
            <button className="rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-[#1b2852] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSubmittingReport}>{isSubmittingReport ? 'Enviando…' : 'Enviar reporte'}</button>
          </div>
        </form>
      )}

      <div className="mt-5 flex items-center gap-1 border-t border-line pt-3">
        <button
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 ${isLiked ? 'bg-[#fff0f2] text-[#c44963]' : 'text-muted hover:bg-paper hover:text-[#c44963]'}`}
          type="button"
          onClick={() => onLike(post.id, !isLiked)}
          aria-pressed={isLiked}
        >
          <HeartIcon filled={isLiked} />
          <span>{likeCount}</span>
          <span className="sr-only">{isLiked ? 'Me gusta quitado' : 'Me gusta'} esta publicación</span>
        </button>
        <a className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2" href={`#comments-${post.id}`}>
          <MessageIcon />
          <span>{commentCount}</span>
          <span className="sr-only">comentarios</span>
        </a>
      </div>

      {comments.length > 0 && (
        <div id={`comments-${post.id}`} className="mt-2 grid gap-2 border-t border-line pt-4">
          {comments.slice(-2).map((item) => (
            <div className="min-w-0 overflow-hidden rounded-2xl bg-paper px-3.5 py-3" key={item.id}>
              <p className="text-xs font-extrabold text-ink">{item.author?.displayName || 'Miembro RedSENA'}</p>
              <p className="mt-1 break-words text-sm leading-6 text-muted">{item.content}</p>
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
            setIdempotencyKey(null)
            setError('')
          }}
          placeholder="Añade un comentario…"
          maxLength={280}
        />
        <button className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-[#1b2852] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={isSendingComment || !comment.trim()} aria-label="Enviar comentario">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
        </button>
      </form>
      {actionMessage && <p className="mt-2 pl-10 text-xs font-semibold text-emerald-700" role="status" aria-live="polite">{actionMessage}</p>}
      {error && <p className="mt-2 pl-10 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </article>
  )
}

export { PostCard }
