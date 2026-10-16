import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DonorLocationMap } from '@/components/ui/DonorLocationMap'

// Mock react-leaflet to run cleanly inside jsdom test runner
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-popup">{children}</div>
  ),
  Circle: () => <div data-testid="map-circle" />,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}))

describe('DonorLocationMap', () => {
  const mockRequest = {
    hospital_name: 'City General Hospital',
    city: 'Gwalior',
    blood_group: 'O+',
    units_requested: 2,
    urgency: 'urgent',
    latitude: 26.2183,
    longitude: 78.1828,
  }

  const mockDonors = [
    {
      donor_id: 'donor-1',
      display_name: 'Rahul Verma',
      blood_group: 'O+',
      city: 'Gwalior',
      distance_km: 1.2,
      availability: 'available',
      approximate_latitude: 26.22,
      approximate_longitude: 78.18,
    },
    {
      donor_id: 'donor-2',
      display_name: 'Anita Singh',
      blood_group: 'O+',
      city: 'Gwalior',
      distance_km: 2.5,
      availability: 'available',
      approximate_latitude: 26.23,
      approximate_longitude: 78.19,
    },
  ]

  it('renders fallback when no coordinates exist for request and donors', () => {
    render(
      <DonorLocationMap
        request={{
          hospital_name: 'Remote Clinic',
          city: 'UnknownTown123',
          blood_group: 'B-',
          units_requested: 1,
          latitude: null,
          longitude: null,
        }}
        donors={[]}
      />
    )

    expect(screen.getByText(/Geographic Coordinates Unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/Donor home addresses remain strictly private/i)).toBeInTheDocument()
  })

  it('renders map with hospital and approximate donor markers', () => {
    render(<DonorLocationMap request={mockRequest} donors={mockDonors} />)

    expect(screen.getByText('Coordination Map')).toBeInTheDocument()
    expect(screen.getByText(/Approximate \(~1km\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Donor Match \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText('OpenStreetMap tiles (Free / No API Key)')).toBeInTheDocument()

    // Map container and markers
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getAllByTestId('map-marker')).toHaveLength(3) // 1 hospital + 2 donors
  })

  it('toggles privacy note banner on click', () => {
    render(<DonorLocationMap request={mockRequest} donors={mockDonors} />)

    const privacyBtn = screen.getByRole('button', { name: /Privacy Note/i })
    expect(screen.queryByText(/Donor Privacy Protection/i)).not.toBeInTheDocument()

    // Click to open privacy notice
    fireEvent.click(privacyBtn)
    expect(screen.getByText(/Donor Privacy Protection/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Donor markers are displayed with rounded coordinates \(~1.1 km radius\)/i)
    ).toBeInTheDocument()

    // Click to close
    fireEvent.click(privacyBtn)
    expect(screen.queryByText(/Donor Privacy Protection/i)).not.toBeInTheDocument()
  })
})
