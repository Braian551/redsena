import { graphqlRequest, SOCIAL_BACKEND_ENABLED } from '../../../shared/api/graphqlClient.js'

const PROFILE_STORAGE_PREFIX = 'redsena.profile.'
const DEFAULT_BIO = 'Construyendo ideas y comunidad desde RedSENA.'

function getStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function profileKey(user) {
  return `${PROFILE_STORAGE_PREFIX}${user?.uid || user?.email || 'anonymous'}`
}

function normalizeProfile(profile, user) {
  return {
    displayName: typeof profile?.displayName === 'string' && profile.displayName.trim()
      ? profile.displayName.trim().slice(0, 120)
      : user?.displayName || user?.email?.split('@')[0] || 'Miembro RedSENA',
    bio: typeof profile?.bio === 'string' ? profile.bio.slice(0, 180) : DEFAULT_BIO,
  }
}

function getLocalProfile(user) {
  const storage = getStorage()

  if (!storage) {
    return normalizeProfile(null, user)
  }

  try {
    return normalizeProfile(JSON.parse(storage.getItem(profileKey(user)) || 'null'), user)
  } catch {
    return normalizeProfile(null, user)
  }
}

async function loadProfile(user) {
  if (!SOCIAL_BACKEND_ENABLED) {
    return getLocalProfile(user)
  }

  const data = await graphqlRequest(
    `query CurrentProfile {
      me { displayName bio }
    }`,
    {},
    { user },
  )

  return normalizeProfile(data?.me, user)
}

async function saveProfile(user, profile) {
  const nextProfile = normalizeProfile({
    displayName: profile?.displayName?.trim(),
    bio: profile?.bio?.trim(),
  }, user)

  if (SOCIAL_BACKEND_ENABLED) {
    const data = await graphqlRequest(
      `mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) { displayName bio }
      }`,
      { input: nextProfile },
      { user },
    )
    return normalizeProfile(data?.updateProfile, user)
  }

  try {
    getStorage()?.setItem(profileKey(user), JSON.stringify(nextProfile))
  } catch {
    // Keep the optimistic profile in the current view if storage is unavailable.
  }

  return nextProfile
}

export { getLocalProfile, loadProfile, saveProfile }
