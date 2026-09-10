import { useState } from 'react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'

function SendIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function PostComposer({ user, onSubmit }) {
  const [content, setContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Cuéntale algo a tu comunidad antes de publicar.')
      return
    }

    setIsPublishing(true)
    try {
      await onSubmit(content)
      setContent('')
    } catch (publishError) {
      setError(publishError.message || 'No se pudo publicar. Inténtalo de nuevo.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <form className="rounded-[24px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(38,55,102,0.06)] sm:p-6" onSubmit={handleSubmit}>
      <div className="flex items-start gap-3">
        <UserAvatar user={user} className="size-11 shrink-0" label="Tu avatar" />
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="post-content">¿Qué quieres compartir?</label>
          <textarea
            id="post-content"
            className="min-h-24 w-full resize-none border-0 bg-transparent px-0 py-1 text-[16px] leading-7 text-ink outline-none placeholder:text-slate-400"
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              setError('')
            }}
            maxLength={500}
            placeholder="¿Qué quieres compartir hoy?"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="grid size-6 place-items-center rounded-full bg-mint/50 text-[#246a55]" aria-hidden="true">✦</span>
          <span>{content.length}/500 caracteres</span>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {error && <p className="text-xs font-semibold text-red-700" role="alert">{error}</p>}
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1b2852] focus-visible:outline-3 focus-visible:outline-violet/30 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={isPublishing || !content.trim()}
          >
            <SendIcon />
            {isPublishing ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>
    </form>
  )
}

export { PostComposer }
