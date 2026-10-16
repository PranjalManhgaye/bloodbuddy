import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotificationPreviewModal } from '@/components/ui/NotificationPreviewModal'

// Mock the API client
vi.mock('@/lib/api', () => ({
  api: {
    getRequestShareMessage: vi.fn().mockResolvedValue({
      channel: 'whatsapp',
      message: 'Urgent blood request at City General Hospital',
      share_url: 'https://wa.me/?text=Urgent',
      recipient_phone: null,
      contact_shared: false,
      is_demo_mode: true,
      disclaimer: 'DEMO MODE: External messaging is not automated.',
      provider_status: 'demo_manual',
    }),
    getInvitationPreviewMessage: vi.fn().mockResolvedValue({
      channel: 'whatsapp',
      message: 'Donation invitation for O+ blood',
      share_url: 'https://wa.me/?text=Invitation',
      recipient_phone: null,
      contact_shared: false,
      is_demo_mode: true,
      disclaimer: 'DEMO MODE: External messaging is not automated.',
      provider_status: 'demo_manual',
    }),
  },
}))

describe('NotificationPreviewModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <NotificationPreviewModal isOpen={false} onClose={vi.fn()} requestId="req-123" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders modal with Demo Mode badge and disclaimer banner', async () => {
    render(
      <NotificationPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        title="Share Blood Request"
        requestId="req-123"
      />
    )

    // Demo Mode badge
    expect(screen.getByText('Demo Mode')).toBeInTheDocument()
    expect(screen.getByText('Share Blood Request')).toBeInTheDocument()

    // Explicit disclaimer that delivery is manual
    expect(screen.getByText(/Manual Message Preview/i)).toBeInTheDocument()
    expect(screen.getByText(/External messaging is never automated/i)).toBeInTheDocument()

    // Channel selectors
    expect(screen.getByRole('button', { name: /WhatsApp Share/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SMS Format/i })).toBeInTheDocument()

    // Action buttons
    expect(screen.getByRole('button', { name: /Copy Text/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open in WhatsApp/i })).toBeInTheDocument()
  })
})
