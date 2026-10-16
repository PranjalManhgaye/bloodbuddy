import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui/Badge'

describe('StatusBadge', () => {
  it('renders matching status label', () => {
    render(<StatusBadge status="matching" />)
    expect(screen.getByText('Matching')).toBeInTheDocument()
  })

  it('renders accepted status', () => {
    render(<StatusBadge status="accepted" />)
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })
})
