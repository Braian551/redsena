const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || '/graphql'
const SOCIAL_BACKEND_ENABLED = import.meta.env.VITE_SOCIAL_BACKEND_ENABLED === 'true'

class GraphqlRequestError extends Error {
  constructor(message, code = 'GRAPHQL_ERROR') {
    super(message)
    this.name = 'GraphqlRequestError'
    this.code = code
  }
}

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function getAuthorizationHeaders(user) {
  const token = await user?.getIdToken?.()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function graphqlRequest(query, variables, { user, idempotencyKey } = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Request-ID': createRequestId(),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(await getAuthorizationHeaders(user)),
    },
    body: JSON.stringify({ query, variables }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.errors?.length) {
    const error = payload?.errors?.[0]
    const code = error?.extensions?.code || (response.status === 401 ? 'UNAUTHENTICATED' : 'GRAPHQL_ERROR')
    throw new GraphqlRequestError(error?.message || 'No se pudo completar la operación.', code)
  }
  return payload?.data
}

async function uploadMedia(file, user, idempotencyKey) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Request-ID': createRequestId(),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(await getAuthorizationHeaders(user)),
    },
    body: formData,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new GraphqlRequestError(payload?.message || 'No se pudo guardar la imagen.', payload?.code || 'UPLOAD_FAILED')
  return payload
}

export { GraphqlRequestError, SOCIAL_BACKEND_ENABLED, graphqlRequest, uploadMedia }
