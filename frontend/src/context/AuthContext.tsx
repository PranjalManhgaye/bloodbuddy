import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, type User, type Profile } from '@/lib/api'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      const p = await api.getProfile()
      setProfile(p)
      setUser({ id: p.user_id, email: p.email, role: p.role, display_name: p.display_name })
    } catch {
      setUser(null)
      setProfile(null)
      api.setToken(null)
    }
  }

  useEffect(() => {
    const token = api.getToken()
    if (token) {
      refreshProfile().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password)
    api.setToken(res.access_token)
    setUser(res.user)
    await refreshProfile()
  }

  const logout = () => {
    api.setToken(null)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
