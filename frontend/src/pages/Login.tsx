import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Droplets, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

const DEMO_ACCOUNTS = [
  { email: 'requester@demo.bloodbuddy', label: 'Demo Requester (Priya Sharma)', role: 'requester' },
  { email: 'donor1@demo.bloodbuddy', label: 'Demo Donor (Rahul Verma, O+)', role: 'donor' },
  { email: 'donor2@demo.bloodbuddy', label: 'Demo Donor (Anita Singh, O+)', role: 'donor' },
  { email: 'admin@demo.bloodbuddy', label: 'Demo Admin', role: 'admin' },
]

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const roleHint = params.get('role')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const selectDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">BloodBuddy</span>
          </Link>
          <p className="text-sm text-muted">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demo Sign In</CardTitle>
            <CardDescription>
              Local demo authentication mode. Password for all demo accounts: <code className="text-xs bg-muted-bg px-1 py-0.5 rounded">demo123</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="requester@demo.bloodbuddy"
                required
              />
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div className="flex items-center gap-2 text-sm text-danger bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">Quick demo accounts</p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS
                  .filter((a) => !roleHint || a.role === roleHint)
                  .map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => selectDemo(a.email)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:bg-muted-bg transition-colors text-sm"
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-muted text-center">
              This is demo authentication, not production auth.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
