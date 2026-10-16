import { Link, useNavigate } from 'react-router-dom'
import { Droplets, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = user
    ? user.role === 'donor'
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/profile', label: 'Profile' },
        ]
      : user.role === 'admin'
      ? [
          { to: '/admin', label: 'Admin' },
          { to: '/dashboard', label: 'Dashboard' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/request', label: 'Request Blood' },
          { to: '/request/ai', label: 'AI Upload' },
        ]
    : []

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Droplets className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">BloodBuddy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 text-sm text-muted hover:text-foreground rounded-lg hover:bg-muted-bg transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted">{user.display_name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>Sign out</Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/login?role=donor">
                  <Button size="sm">Become a Donor</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted-bg"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-2">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block px-3 py-2 text-sm rounded-lg hover:bg-muted-bg"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleLogout}>
              Sign out
            </Button>
          ) : (
            <div className="flex gap-2 mt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Sign in</Button>
              </Link>
              <Link to="/login?role=donor" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Donor</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
