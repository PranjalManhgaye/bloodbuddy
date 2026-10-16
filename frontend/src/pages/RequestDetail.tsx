import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Send, Users, Clock, XCircle } from 'lucide-react'
import { api, type BloodRequest, type DonorMatch, type TrackingData } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils'

export function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const [request, setRequest] = useState<BloodRequest | null>(null)
  const [matches, setMatches] = useState<DonorMatch[]>([])
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState<string | null>(null)
  const [invited, setInvited] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [req, m, t] = await Promise.all([
          api.getRequest(id),
          api.getMatches(id),
          api.getTracking(id),
        ])
        setRequest(req)
        setMatches(m)
        setTracking(t)
        const alreadyInvited = new Set(t.invitations.map((i) => i.donor_id))
        setInvited(alreadyInvited)
      } catch { /* empty */ }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const inviteDonor = async (donorId: string) => {
    if (!id) return
    setInviting(donorId)
    try {
      await api.createInvitation(id, donorId)
      setInvited((prev) => new Set(prev).add(donorId))
      const t = await api.getTracking(id)
      setTracking(t)
    } catch { /* empty */ }
    finally { setInviting(null) }
  }

  const cancelRequest = async () => {
    if (!id || !confirm('Cancel this request?')) return
    try {
      const req = await api.cancelRequest(id)
      setRequest(req)
    } catch { /* empty */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!request) {
    return <p className="text-center text-muted py-20">Request not found</p>
  }

  const STATUS_STEPS = ['submitted', 'matching', 'donors_contacted', 'response_received', 'coordination', 'closed']

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{request.hospital_name}</h2>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted">
            {request.blood_group} · {request.units_requested} units · {request.city}
            {request.required_date && ` · Needed by ${request.required_date}`}
          </p>
        </div>
        {request.status !== 'cancelled' && request.status !== 'closed' && (
          <Button variant="outline" size="sm" onClick={cancelRequest}>
            <XCircle className="w-4 h-4" />Cancel
          </Button>
        )}
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Request Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUS_STEPS.map((step, i) => {
              const currentIdx = STATUS_STEPS.indexOf(request.status)
              const done = i <= currentIdx
              const active = step === request.status
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex flex-col items-center min-w-[80px] ${done ? 'text-primary' : 'text-muted'}`}>
                    <div className={`w-3 h-3 rounded-full mb-1 ${active ? 'bg-primary ring-4 ring-primary/20' : done ? 'bg-primary' : 'bg-border'}`} />
                    <span className="text-[10px] text-center capitalize leading-tight">{step.replace(/_/g, ' ')}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 ${done && i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {tracking && tracking.response_summary.total_invited > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex gap-6 text-sm">
              <span><strong>{tracking.response_summary.total_invited}</strong> invited</span>
              <span className="text-success"><strong>{tracking.response_summary.accepted}</strong> accepted</span>
              <span className="text-danger"><strong>{tracking.response_summary.declined}</strong> declined</span>
              <span className="text-warning"><strong>{tracking.response_summary.pending}</strong> pending</span>
            </div>
          )}

          {tracking && tracking.response_summary.total_invited === 0 && (
            <p className="mt-4 text-sm text-muted">No donors invited yet. Invite matching donors below.</p>
          )}
        </CardContent>
      </Card>

      {/* Matching donors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />Matching Donors
          </CardTitle>
          <p className="text-xs text-muted mt-1">
            Same-blood-group coordination matches. Not medically approved compatibility.
          </p>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No matching donors found"
              description="No available donors with matching blood group in the database."
            />
          ) : (
            <div className="divide-y divide-border">
              {matches.map((donor) => (
                <div key={donor.donor_id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary">
                      {donor.blood_group}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{donor.display_name}</p>
                      <p className="text-xs text-muted flex items-center gap-2">
                        {donor.city && <><MapPin className="w-3 h-3" />{donor.city}</>}
                        {donor.distance_km != null && ` · ~${donor.distance_km} km`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={donor.availability} />
                    {invited.has(donor.donor_id) ? (
                      <span className="text-xs text-muted font-medium">Invited</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={inviting === donor.donor_id}
                        onClick={() => inviteDonor(donor.donor_id)}
                      >
                        <Send className="w-3.5 h-3.5" />Invite
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status history */}
      {tracking && tracking.status_history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tracking.status_history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium capitalize">{h.to_status.replace(/_/g, ' ')}</p>
                    {h.note && <p className="text-xs text-muted">{h.note}</p>}
                    <p className="text-xs text-muted">{formatDateTime(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Link to="/dashboard" className="text-sm text-primary hover:underline">← Back to dashboard</Link>
    </div>
  )
}
