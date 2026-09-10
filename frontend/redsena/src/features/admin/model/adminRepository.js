import { graphqlRequest, SOCIAL_BACKEND_ENABLED } from '../../../shared/api/graphqlClient.js'

const USER_FIELDS = 'id displayName email photoURL bio role'

function mapAdminPost(post) {
  return {
    ...post,
    author: post.author
      ? {
          id: post.author.id,
          displayName: post.author.displayName,
          email: post.author.email,
          photoURL: post.author.photoURL || '',
          role: post.author.role,
        }
      : null,
    media: post.media || [],
  }
}

async function loadCurrentUser(user) {
  if (!SOCIAL_BACKEND_ENABLED) {
    return null
  }

  const data = await graphqlRequest(`query CurrentUser { me { ${USER_FIELDS} } }`, {}, { user })
  return data?.me || null
}

async function loadAdminPosts(user, { first = 20, after = null } = {}) {
  if (!SOCIAL_BACKEND_ENABLED) {
    throw new Error('El panel de administración necesita el backend social activo.')
  }

  const data = await graphqlRequest(
    `query AdminPosts($first: Int!, $after: String) {
      adminPosts(first: $first, after: $after) {
        nodes {
          id
          author { ${USER_FIELDS} }
          content
          createdAt
          media { id url contentType size }
          likeCount
          commentCount
        }
        pageInfo { hasNextPage endCursor }
      }
    }`,
    { first, after },
    { user },
  )

  return {
    nodes: (data?.adminPosts?.nodes || []).map(mapAdminPost),
    pageInfo: data?.adminPosts?.pageInfo || { hasNextPage: false, endCursor: null },
  }
}

async function deleteAdminPost(postId, user) {
  const data = await graphqlRequest(
    'mutation AdminDeletePost($id: ID!) { adminDeletePost(id: $id) }',
    { id: postId },
    { user },
  )
  return Boolean(data?.adminDeletePost)
}

export { deleteAdminPost, loadAdminPosts, loadCurrentUser }
