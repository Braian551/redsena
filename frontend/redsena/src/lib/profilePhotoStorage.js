import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase.js'

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024
const PROFILE_PHOTO_PATH = (uid) => `profile-photos/${uid}/avatar`
const ALLOWED_PROFILE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function validateProfilePhoto(file) {
  if (!file || !ALLOWED_PROFILE_PHOTO_TYPES.has(file.type)) {
    const error = new Error('Selecciona una imagen válida en formato JPG, PNG o WebP.')
    error.code = 'profile-photo/invalid-type'
    throw error
  }

  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    const error = new Error('La foto debe pesar menos de 5 MB.')
    error.code = 'profile-photo/file-too-large'
    throw error
  }
}

function getProfilePhotoReference(user) {
  if (!storage || !user?.uid) {
    const error = new Error('Firebase Storage no está configurado para guardar fotos.')
    error.code = 'app/firebase-storage-not-configured'
    throw error
  }

  return ref(storage, PROFILE_PHOTO_PATH(user.uid))
}

async function uploadProfilePhoto(user, file) {
  validateProfilePhoto(file)
  const photoReference = getProfilePhotoReference(user)
  const snapshot = await uploadBytes(photoReference, file, {
    cacheControl: 'public,max-age=3600',
    contentType: file.type,
  })

  return getDownloadURL(snapshot.ref)
}

async function deleteProfilePhoto(user) {
  try {
    await deleteObject(getProfilePhotoReference(user))
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') {
      throw error
    }
  }
}

export {
  deleteProfilePhoto,
  uploadProfilePhoto,
}
