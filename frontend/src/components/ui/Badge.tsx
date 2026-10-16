import { cn } from '@/lib/utils'

const variants: Record<string, string> = {
  default: 'bg-muted-bg text-foreground',
  primary: 'bg-primary-light text-primary',
  success: 'bg-emerald-50 text-success',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  outline: 'border border-border text-muted',
}

export function Badge({ variant = 'default', className, children }: {
  variant?: keyof typeof variants
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    draft: { variant: 'outline', label: 'Draft' },
    submitted: { variant: 'primary', label: 'Submitted' },
    matching: { variant: 'warning', label: 'Matching' },
    donors_contacted: { variant: 'warning', label: 'Donors Contacted' },
    response_received: { variant: 'primary', label: 'Response Received' },
    coordination: { variant: 'success', label: 'Coordination' },
    closed: { variant: 'default', label: 'Closed' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    pending: { variant: 'warning', label: 'Pending' },
    accepted: { variant: 'success', label: 'Accepted' },
    declined: { variant: 'danger', label: 'Declined' },
    available: { variant: 'success', label: 'Available' },
    unavailable: { variant: 'outline', label: 'Unavailable' },
    limited: { variant: 'warning', label: 'Limited' },
    routine: { variant: 'default', label: 'Routine' },
    urgent: { variant: 'warning', label: 'Urgent' },
    critical: { variant: 'danger', label: 'Critical' },
  }
  const s = map[status] || { variant: 'default' as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
