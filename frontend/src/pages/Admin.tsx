import { useEffect, useState } from 'react'
import { Users, FileText, Mail, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { api, type DemoStats } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function Admin() {
  const [stats, setStats] = useState<DemoStats | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    api.getDemoStats().then(setStats).catch(() => {})
  }, [])

  const handleReset = async () => {
    if (!confirm('Reset all demo requests, invitations, and extractions? Users will remain.')) return
    setResetting(true)
    try {
      await api.resetDemo()
      setResetDone(true)
      const s = await api.getDemoStats()
      setStats(s)
    } catch { /* empty */ }
    finally { setResetting(false) }
  }

  const statCards = stats ? [
    { label: 'Registered Donors', value: stats.total_donors, icon: Users },
    { label: 'Active Requests', value: stats.active_requests, icon: FileText },
    { label: 'Pending Invitations', value: stats.pending_invitations, icon: Mail },
    { label: 'Completed Coordinations', value: stats.completed_coordinations, icon: CheckCircle },
  ] : []

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold">Demo Admin Dashboard</h2>
          <Badge variant="warning">Demo Data</Badge>
        </div>
        <p className="text-muted text-sm">Overview of synthetic demo data for hackathon presentations.</p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          All statistics shown here are from demo/synthetic data. They are not real production metrics.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="w-5 h-5 text-muted" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            Reset all requests, invitations, AI extractions, and notifications to prepare for a fresh demo.
            Demo user accounts and donor profiles are preserved.
          </p>
          <Button variant="outline" onClick={handleReset} loading={resetting}>
            <RotateCcw className="w-4 h-4" />Reset Demo Data
          </Button>
          {resetDone && (
            <p className="text-sm text-success">Demo data reset successfully.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { email: 'requester@demo.bloodbuddy', role: 'Requester' },
              { email: 'donor1@demo.bloodbuddy', role: 'Donor (O+)' },
              { email: 'donor2@demo.bloodbuddy', role: 'Donor (O+)' },
              { email: 'admin@demo.bloodbuddy', role: 'Admin' },
            ].map((a) => (
              <div key={a.email} className="flex justify-between py-2 border-b border-border last:border-0">
                <code className="text-xs">{a.email}</code>
                <span className="text-muted">{a.role}</span>
              </div>
            ))}
            <p className="text-xs text-muted pt-2">Password for all: <code>demo123</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
