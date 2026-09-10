import { useContext } from 'react'
import { AuthContext } from './auth-context.js'

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.')
  }

  return context
}

export { useAuth }
