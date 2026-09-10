const POSTS_STORAGE_KEY = 'redsena.posts.v1'

const seedPosts = [
  {
    id: 'seed-post-01',
    authorId: 'seed-lina',
    author: { displayName: 'Lina Torres', email: 'lina@redsena.local', photoURL: '' },
    content: 'Hoy aprendí que avanzar también puede verse como hacer una pausa, escuchar y volver a intentarlo con más claridad.',
    createdAt: '2026-09-09T14:18:00.000Z',
    likedBy: ['seed-ana', 'seed-mateo'],
    comments: [
      {
        id: 'seed-comment-01',
        author: { displayName: 'Mateo Ruiz', email: 'mateo@redsena.local', photoURL: '' },
        content: 'Qué buen recordatorio para esta semana.',
        createdAt: '2026-09-09T16:02:00.000Z',
      },
    ],
  },
  {
    id: 'seed-post-02',
    authorId: 'seed-mateo',
    author: { displayName: 'Mateo Ruiz', email: 'mateo@redsena.local', photoURL: '' },
    content: 'Compartir una idea temprano ayuda a que la comunidad la haga crecer. ¿Qué proyecto estás construyendo?',
    createdAt: '2026-09-08T09:40:00.000Z',
    likedBy: ['seed-lina'],
    comments: [],
  },
]

function getStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function clonePosts(posts) {
  return posts.map((post) => ({
    ...post,
    author: { ...post.author },
    likedBy: [...(post.likedBy || [])],
    comments: (post.comments || []).map((comment) => ({ ...comment, author: { ...comment.author } })),
  }))
}

function readPosts() {
  const storage = getStorage()

  if (!storage) {
    return clonePosts(seedPosts)
  }

  try {
    const savedPosts = JSON.parse(storage.getItem(POSTS_STORAGE_KEY) || 'null')
    return Array.isArray(savedPosts) && savedPosts.length > 0 ? savedPosts : clonePosts(seedPosts)
  } catch {
    return clonePosts(seedPosts)
  }
}

function writePosts(posts) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  try {
    storage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // The feed remains usable if browser storage is unavailable or full.
  }
}

function createId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function getUserKey(user) {
  return user?.uid || user?.email || 'anonymous'
}

function toAuthor(user) {
  return {
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Miembro RedSENA',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
  }
}

function loadPosts() {
  return readPosts().sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
}

function createPost({ user, content }) {
  const cleanContent = content.trim()

  if (!cleanContent) {
    throw new Error('Escribe algo antes de publicar.')
  }

  const post = {
    id: createId('post'),
    authorId: getUserKey(user),
    author: toAuthor(user),
    content: cleanContent,
    createdAt: new Date().toISOString(),
    likedBy: [],
    comments: [],
  }
  const posts = [post, ...readPosts()]
  writePosts(posts)
  return post
}

function toggleLike(postId, user) {
  const userKey = getUserKey(user)
  let nextPost
  const posts = readPosts().map((post) => {
    if (post.id !== postId) {
      return post
    }

    const likedBy = post.likedBy || []
    const isLiked = likedBy.includes(userKey)
    nextPost = { ...post, likedBy: isLiked ? likedBy.filter((id) => id !== userKey) : [...likedBy, userKey] }
    return nextPost
  })
  writePosts(posts)
  return nextPost
}

function addComment(postId, user, content) {
  const cleanContent = content.trim()

  if (!cleanContent) {
    throw new Error('Escribe un comentario antes de enviarlo.')
  }

  const comment = {
    id: createId('comment'),
    author: toAuthor(user),
    content: cleanContent,
    createdAt: new Date().toISOString(),
  }
  let nextPost
  const posts = readPosts().map((post) => {
    if (post.id !== postId) {
      return post
    }

    nextPost = { ...post, comments: [...(post.comments || []), comment] }
    return nextPost
  })
  writePosts(posts)
  return { post: nextPost, comment }
}

function getProfile(user) {
  const storage = getStorage()
  const key = `redsena.profile.${getUserKey(user)}`
  const defaultProfile = { bio: 'Construyendo ideas y comunidad desde RedSENA.' }

  if (!storage) {
    return defaultProfile
  }

  try {
    return { ...defaultProfile, ...(JSON.parse(storage.getItem(key) || 'null') || {}) }
  } catch {
    return defaultProfile
  }
}

function saveProfile(user, profile) {
  const storage = getStorage()
  const key = `redsena.profile.${getUserKey(user)}`
  const nextProfile = { bio: profile.bio.trim().slice(0, 180) }

  try {
    storage?.setItem(key, JSON.stringify(nextProfile))
  } catch {
    // Keep the optimistic profile in the current view even if persistence fails.
  }

  return nextProfile
}

export { addComment, createPost, getProfile, loadPosts, saveProfile, toggleLike }
