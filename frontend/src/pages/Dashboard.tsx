import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Clock, ArrowRight, Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api, type BloodRequest, type Invitation } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils'

export function Dashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [reqs, invs] = await Promise.all([
          api.getRequests(),
          api.getInvitations(),
        ])
        setRequests(reqs)
        setInvitations(invs)
      } catch { /* empty */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (user?.role === 'donor') {
    const pending = invitations.filter((i) => i.status === 'pending')
    const accepted = invitations.filter((i) => i.status === 'accepted')

    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold mb-1">Donor Dashboard</h2>
          <p className="text-muted text-sm">Review incoming donation requests and manage your availability.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">{pending.length}</p>
            <p className="text-sm text-muted">Pending invitations</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-2xl font-bold text-success">{accepted.length}</p>
            <p className="text-sm text-muted">Accepted</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-2xl font-bold">{invitations.length}</p>
            <p className="text-sm text-muted">Total invitations</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Incoming Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No pending invitations"
                description="When a requester invites you to donate, you'll see the request here."
              />
            ) : (
              <div className="space-y-3">
                {pending.map((inv) => (
                  <DonorInvitationRow key={inv.id} invitation={inv} onUpdate={() => {
                    api.getInvitations().then(setInvitations)
                  }} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {accepted.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Accepted Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accepted.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{inv.request_details?.hospital_name}</p>
                      <p className="text-xs text-muted">{inv.request_details?.blood_group} · {inv.request_details?.city}</p>
                    </div>
                    <StatusBadge status="accepted" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Requests</h2>
          <p className="text-muted text-sm">Track blood donation requests and donor responses.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/request/ai"><Button variant="outline" size="sm"><Upload className="w-4 h-4" />AI Upload</Button></Link>
          <Link to="/request"><Button size="sm"><FileText className="w-4 h-4" />New Request</Button></Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No requests yet"
            description="Create a blood donation request manually or upload a document for AI-assisted extraction."
            action={() => window.location.href = '/request'}
            actionLabel="Create Request"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} to={`/requests/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{req.blood_group}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{req.hospital_name}</p>
                        <p className="text-xs text-muted flex items-center gap-2">
                          <Clock className="w-3 h-3" />{formatDateTime(req.created_at)}
                          · {req.city} · {req.units_requested} unit{req.units_requested > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={req.status} />
                      <ArrowRight className="w-4 h-4 text-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function DonorInvitationRow({ invitation, onUpdate }: { invitation: Invitation; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false)
  const req = invitation.request_details

  const respond = async (status: 'accepted' | 'declined') => {
    setLoading(true)
    try {
      await api.updateInvitation(invitation.id, status, status === 'accepted')
      onUpdate()
    } catch { /* empty */ }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{req?.hospital_name || 'Blood Request'}</p>
        <p className="text-xs text-muted">
          {req?.blood_group} · {req?.units_requested} units · {req?.city}
          {req?.urgency && req.urgency !== 'routine' && ` · ${req.urgency}`}
        </p>
        {invitation.message && <p className="text-xs text-muted mt-1">{invitation.message}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" loading={loading} onClick={() => respond('declined')}>Decline</Button>
        <Button size="sm" loading={loading} onClick={() => respond('accepted')}>Accept</Button>
      </div>
    </div>
  )
}
