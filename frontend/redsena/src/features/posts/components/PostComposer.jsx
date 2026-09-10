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
  const [files, setFiles] = useState([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Cuéntale algo a tu comunidad antes de publicar.')
      return
    }

    setIsPublishing(true)
    const operationKey = idempotencyKey || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    try {
      await onSubmit(content, files, operationKey)
      setContent('')
      setFiles([])
      setIdempotencyKey(null)
    } catch (publishError) {
      setIdempotencyKey(operationKey)
      setError(publishError.message || 'No se pudo publicar. Inténtalo de nuevo.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleFiles = (event) => {
    const nextFiles = Array.from(event.target.files || [])
    event.target.value = ''
    const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (nextFiles.length > 4 || nextFiles.some((file) => !validTypes.has(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Adjunta hasta cuatro imágenes JPG, PNG o WebP de máximo 5 MB cada una.')
      return
    }
    setError('')
    setFiles(nextFiles)
    setIdempotencyKey(null)
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
              setIdempotencyKey(null)
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
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-paper hover:text-ink focus-within:outline-3 focus-within:outline-violet/30 focus-within:outline-offset-2" htmlFor="post-media">
            <span aria-hidden="true">▧</span> Imagen
            <input id="post-media" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} />
          </label>
          {files.length > 0 && <span className="max-w-[180px] truncate text-xs text-muted" title={files.map((file) => file.name).join(', ')}>{files.length} imagen{files.length > 1 ? 'es' : ''} seleccionada{files.length > 1 ? 's' : ''}</span>}
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
