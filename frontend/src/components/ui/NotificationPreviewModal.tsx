import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, MessageSquare, ShieldAlert, X } from 'lucide-react'
import { api, type NotificationChannel, type NotificationPreview } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface NotificationPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  invitationId?: string
  requestId?: string
  recipientName?: string
}

export function NotificationPreviewModal({
  isOpen,
  onClose,
  title = 'Share Coordination Message',
  invitationId,
  requestId,
  recipientName,
}: NotificationPreviewModalProps) {
  const [channel, setChannel] = useState<NotificationChannel>('whatsapp')
  const [preview, setPreview] = useState<NotificationPreview | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const fetchPreview = async () => {
      setLoading(true)
      setError(null)
      try {
        let res: NotificationPreview
        if (invitationId) {
          res = await api.getInvitationPreviewMessage(invitationId, channel)
        } else if (requestId) {
          res = await api.getRequestShareMessage(requestId, channel)
        } else {
          return
        }
        setPreview(res)
        setMessageText(res.message)
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate message preview'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [isOpen, channel, invitationId, requestId])

  if (!isOpen) return null

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      setCopied(false)
    }
  }

  const openExternalApp = () => {
    if (channel === 'whatsapp') {
      const cleanPhone = preview?.recipient_phone ? preview.recipient_phone.replace(/\D/g, '') : ''
      const targetUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
        : `https://wa.me/?text=${encodeURIComponent(messageText)}`
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    } else {
      const phone = preview?.recipient_phone || ''
      window.open(`sms:${phone}?body=${encodeURIComponent(messageText)}`, '_self')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted-bg/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="notification-modal-title" className="text-base font-semibold">
                  {title}
                </h3>
                <Badge variant="warning" className="font-bold text-[10px] tracking-wide uppercase">
                  Demo Mode
                </Badge>
              </div>
              {recipientName && (
                <p className="text-xs text-muted">Recipient: {recipientName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Demo disclaimer notice */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Manual Message Preview (No Automated Delivery)</span>
            </div>
            <p className="text-muted leading-relaxed">
              BloodBuddy generates this pre-filled message for you to review and send manually.
              External messaging is never automated without your explicit review and click.
            </p>
          </div>

          {/* Channel Selector */}
          <div className="flex gap-2 p-1 bg-muted-bg rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                channel === 'whatsapp'
                  ? 'bg-card text-emerald-700 shadow-xs border border-border font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Share
            </button>
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                channel === 'sms'
                  ? 'bg-card text-primary shadow-xs border border-border font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              SMS Format
            </button>
          </div>

          {/* Message Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Review or edit message:</span>
              <span>{messageText.length} characters</span>
            </div>
            {loading ? (
              <div className="h-36 flex items-center justify-center bg-muted-bg/30 rounded-lg border border-border">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-red-50 text-danger text-xs">{error}</div>
            ) : (
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                className="w-full text-xs font-mono p-3 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y leading-relaxed"
                placeholder="Message preview..."
              />
            )}
          </div>

          {/* Consent / Privacy status indicator */}
          <div className="text-[11px] text-muted flex items-center gap-1.5 bg-muted-bg/50 p-2.5 rounded-md border border-border/50">
            <span>🔒</span>
            <span>
              {preview?.contact_shared
                ? 'Contact information shared with donor\'s explicit mutual consent.'
                : 'Recipient contact info is protected. The recipient will open the link to coordinate safely.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted-bg/20">
          <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={loading || !messageText}>
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Text
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={openExternalApp}
              disabled={loading || !messageText}
              className={channel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {channel === 'whatsapp' ? (
                <>
                  <MessageCircle className="w-3.5 h-3.5" />
                  Open in WhatsApp
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open SMS App
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
