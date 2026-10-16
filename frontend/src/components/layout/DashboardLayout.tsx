import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Upload, User, Droplets,
  Heart, Shield, Menu, LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const { user, profile, logout, loading } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const requesterLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/request', icon: FileText, label: 'Request Blood' },
    { to: '/request/ai', icon: Upload, label: 'AI Document Upload' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  const donorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  const adminLinks = [
    { to: '/admin', icon: Shield, label: 'Admin Overview' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  const links = user.role === 'donor' ? donorLinks : user.role === 'admin' ? adminLinks : requesterLinks

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">BloodBuddy</span>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((l) => {
            const active = location.pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-primary-light text-primary font-medium'
                    : 'text-muted hover:text-foreground hover:bg-muted-bg',
                )}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.display_name}</p>
              <p className="text-xs text-muted capitalize">{user.role}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-muted-bg text-muted" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-8 gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted-bg" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold capitalize">
              {links.find((l) => l.to === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          {profile?.blood_group && (
            <span className="text-sm font-medium text-primary bg-primary-light px-3 py-1 rounded-lg">
              {profile.blood_group}
            </span>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
