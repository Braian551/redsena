import { graphqlRequest, SOCIAL_BACKEND_ENABLED, uploadMedia } from '../../../shared/api/graphqlClient.js'

const POSTS_STORAGE_KEY = 'redsena.posts.v1'

const POST_FIELDS = `
  id
  author { id displayName email photoURL }
  content
  createdAt
  media { id url contentType size }
  likeCount
  commentCount
  likedByViewer
  comments { id content createdAt author { id displayName email photoURL } }
`

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

function mapAuthor(author) {
  return author
    ? {
        id: author.id,
        displayName: author.displayName || author.email?.split('@')[0] || 'Miembro RedSENA',
        email: author.email || '',
        photoURL: author.photoURL || '',
      }
    : { displayName: 'Miembro RedSENA', email: '', photoURL: '' }
}

function mapComment(comment) {
  return {
    id: comment.id,
    authorId: comment.author?.id,
    author: mapAuthor(comment.author),
    content: comment.content,
    createdAt: comment.createdAt,
  }
}

function mapPost(post) {
  return {
    id: post.id,
    authorId: post.author?.id,
    author: mapAuthor(post.author),
    content: post.content,
    createdAt: post.createdAt,
    media: post.media || [],
    likeCount: post.likeCount || 0,
    commentCount: post.commentCount || 0,
    likedByViewer: Boolean(post.likedByViewer),
    comments: (post.comments || []).map(mapComment),
  }
}

async function loadRemotePosts(user) {
  const data = await graphqlRequest(
    `query Feed($first: Int!, $after: String) {
      feed(first: $first, after: $after) {
        nodes { ${POST_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }`,
    { first: 20, after: null },
    { user },
  )
  return (data?.feed?.nodes || []).map(mapPost)
}

async function loadPosts(user) {
  if (SOCIAL_BACKEND_ENABLED) {
    return loadRemotePosts(user)
  }

  return readPosts().sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
}

async function createRemotePost({ user, content, files = [], idempotencyKey }) {
  const operationKey = idempotencyKey || `post-${user?.uid || 'session'}-${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random()}`
  const mediaIds = []
  for (const [index, file] of files.entries()) {
    const media = await uploadMedia(file, user, `${operationKey}-upload-${index}`)
    mediaIds.push(media.id)
  }

  const data = await graphqlRequest(
    `mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) { ${POST_FIELDS} }
    }`,
    { input: { content, mediaIds } },
    {
      user,
      idempotencyKey: operationKey,
    },
  )
  return mapPost(data.createPost)
}

async function createPost({ user, content, files = [], idempotencyKey }) {
  const cleanContent = content.trim()

  if (!cleanContent) {
    throw new Error('Escribe algo antes de publicar.')
  }

  if (SOCIAL_BACKEND_ENABLED) {
    return createRemotePost({ user, content: cleanContent, files, idempotencyKey })
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

async function toggleLike(postId, user, liked) {
  if (SOCIAL_BACKEND_ENABLED) {
    const data = await graphqlRequest(
      `mutation SetPostLike($postId: ID!, $liked: Boolean!) {
        setPostLike(postId: $postId, liked: $liked) { liked likeCount }
      }`,
      { postId, liked },
      { user },
    )
    return { likedByViewer: data.setPostLike.liked, likeCount: data.setPostLike.likeCount }
  }

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

async function addComment(postId, user, content, idempotencyKey) {
  const cleanContent = content.trim()

  if (!cleanContent) {
    throw new Error('Escribe un comentario antes de enviarlo.')
  }

  if (SOCIAL_BACKEND_ENABLED) {
    const data = await graphqlRequest(
      `mutation AddComment($input: AddCommentInput!) {
        addComment(input: $input) { id content createdAt author { id displayName email photoURL } }
      }`,
      { input: { postId, content: cleanContent } },
      {
        user,
        idempotencyKey: idempotencyKey || `comment-${user?.uid || 'session'}-${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random()}`,
      },
    )
    return { comment: mapComment(data.addComment) }
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
