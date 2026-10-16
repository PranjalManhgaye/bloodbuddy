import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Hospital, Info, MapPin, Navigation, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export interface MapRequestLocation {
  hospital_name: string
  city: string
  blood_group: string
  units_requested: number
  urgency?: string
  latitude?: number | null
  longitude?: number | null
}

export interface MapDonorLocation {
  donor_id: string
  display_name: string
  blood_group: string
  city?: string
  distance_km?: number
  availability: string
  approximate_latitude?: number | null
  approximate_longitude?: number | null
}

export interface DonorLocationMapProps {
  request: MapRequestLocation
  donors: MapDonorLocation[]
  className?: string
}

// Fallback coordinate mapping for common coordination hub cities
export const KNOWN_CITY_COORDINATES: Record<string, [number, number]> = {
  gwalior: [26.2183, 78.1828],
  morena: [26.4969, 77.9900],
  delhi: [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  bhopal: [23.2599, 77.4126],
  indore: [22.7196, 75.8577],
  jaipur: [26.9124, 75.7873],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
}

// Controller component to smoothly fit map bounds when locations change
function MapBoundsController({
  bounds,
  center,
}: {
  bounds: L.LatLngBoundsExpression | null
  center?: [number, number]
}) {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    } else if (center) {
      map.setView(center, 12)
    }
  }, [bounds, center, map])

  return null
}

// Custom DivIcons for hospital and donors (bypasses Vite broken static asset paths for Leaflet)
function createHospitalIcon() {
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: rgba(165, 29, 53, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 32px; height: 32px; background: #A51D35; color: white; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 16px;">
          🏥
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

function createDonorIcon(bloodGroup: string, isAvailable: boolean) {
  const bg = isAvailable ? '#059669' : '#D97706'
  return L.divIcon({
    className: 'custom-donor-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 28px; height: 28px; background: ${bg}; color: white; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 2px solid white; font-weight: 700; font-size: 11px; line-height: 1;">
          ${bloodGroup}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

export function DonorLocationMap({ request, donors, className = '' }: DonorLocationMapProps) {
  const [tileError, setTileError] = useState(false)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  // Determine hospital coordinates: explicit coords or known city centroid
  const explicitCoords = Boolean(
    request.latitude != null &&
    request.longitude != null &&
    !isNaN(request.latitude) &&
    !isNaN(request.longitude)
  )

  const cityCoords = request.city ? KNOWN_CITY_COORDINATES[request.city.toLowerCase().trim()] : null

  const hasRequestCoords = explicitCoords || cityCoords != null

  const requestPos: [number, number] = explicitCoords
    ? [request.latitude as number, request.longitude as number]
    : (cityCoords || [26.2183, 78.1828])

  // Filter valid approximate donor points
  const validDonors = useMemo(() => {
    return donors.filter(
      (d) =>
        d.approximate_latitude != null &&
        d.approximate_longitude != null &&
        !isNaN(d.approximate_latitude) &&
        !isNaN(d.approximate_longitude)
    )
  }, [donors])

  // Calculate bounding box containing request and all approximate donors
  const mapBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    const points: [number, number][] = []
    if (hasRequestCoords) {
      points.push(requestPos)
    }
    for (const d of validDonors) {
      points.push([d.approximate_latitude as number, d.approximate_longitude as number])
    }
    if (points.length < 2) return null
    return L.latLngBounds(points.map(([lat, lon]) => L.latLng(lat, lon)))
  }, [hasRequestCoords, requestPos, validDonors])

  const hospitalIcon = useMemo(() => createHospitalIcon(), [])

  // If no coordinates available at all
  if (!hasRequestCoords && validDonors.length === 0) {
    return (
      <div
        className={`bg-card rounded-xl border border-border p-6 text-center flex flex-col items-center justify-center min-h-[220px] ${className}`}
        role="region"
        aria-label="Location Map Fallback"
      >
        <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center text-muted mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold mb-1">Geographic Coordinates Unavailable</h4>
        <p className="text-xs text-muted max-w-md mb-3">
          Exact coordinates have not been recorded for {request.hospital_name} in {request.city}.
          Donors are matched by city ({request.city}) and blood group ({request.blood_group}).
        </p>
        <div className="flex items-center gap-2 text-xs text-muted bg-muted-bg px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Donor home addresses remain strictly private and unexposed.</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-card rounded-xl border border-border shadow-xs overflow-hidden flex flex-col ${className}`}
      role="region"
      aria-label="Donor and Request Location Map"
    >
      {/* Map Header & Privacy Ribbon */}
      <div className="px-4 py-3 border-b border-border bg-muted-bg/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Coordination Map</span>
              <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1 inline" /> Approximate (~1km)
              </Badge>
            </div>
            <p className="text-[11px] text-muted">
              Hospital location & approximate donor areas in {request.city}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted">
            <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block"></span>
            <span>Donor Match ({validDonors.length})</span>
          </div>
          <button
            onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
            className="text-muted hover:text-foreground text-[11px] underline flex items-center gap-1 cursor-pointer"
            title="Privacy Details"
          >
            <Info className="w-3 h-3" />
            <span>Privacy Note</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner (Collapsible/Toggleable) */}
      {showPrivacyDetails && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in duration-150">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Donor Privacy Protection</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Donor markers are displayed with rounded coordinates (~1.1 km radius) and do not represent exact home
              addresses. Contact details and specific coordinates remain private until mutual confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Tile Error Fallback Notice */}
      {tileError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-800 flex items-center justify-between">
          <span>Map tiles could not be retrieved from OpenStreetMap. Markers remain active.</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTileError(false)}
            className="h-6 text-xs px-2 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Retry Tiles
          </Button>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] z-0">
        <MapContainer
          center={requestPos}
          zoom={12}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <MapBoundsController bounds={mapBounds} center={requestPos} />

          {/* OpenStreetMap Tile Layer (Free, no API key required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileError(true),
            }}
          />

          {/* Hospital Location Marker */}
          {hasRequestCoords && (
            <Marker position={requestPos} icon={hospitalIcon}>
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                    <Hospital className="w-3.5 h-3.5" />
                    <span>{request.hospital_name}</span>
                  </div>
                  <p className="text-xs text-gray-700 mb-1">
                    <strong>Need:</strong> {request.units_requested} unit(s) of{' '}
                    <span className="font-semibold text-primary">{request.blood_group}</span> blood
                  </p>
                  <p className="text-[11px] text-gray-500 mb-2">City: {request.city}</p>
                  {request.urgency && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-primary-light text-primary">
                      {request.urgency}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Matching Donor Approximate Location Markers & Circles */}
          {validDonors.map((donor) => {
            const donorPos: [number, number] = [
              donor.approximate_latitude as number,
              donor.approximate_longitude as number,
            ]
            const isAvailable = donor.availability === 'available'
            const donorIcon = createDonorIcon(donor.blood_group, isAvailable)

            return (
              <div key={donor.donor_id}>
                {/* 1km Privacy Buffer Circle */}
                <Circle
                  center={donorPos}
                  radius={1000}
                  pathOptions={{
                    color: isAvailable ? '#059669' : '#D97706',
                    fillColor: isAvailable ? '#10B981' : '#F59E0B',
                    fillOpacity: 0.12,
                    weight: 1,
                    dashArray: '4, 4',
                  }}
                />

                {/* Donor Marker */}
                <Marker position={donorPos} icon={donorIcon}>
                  <Popup>
                    <div className="p-1 min-w-[170px]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900">{donor.display_name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {donor.blood_group}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {donor.distance_km != null ? `~${donor.distance_km} km away` : donor.city || 'Nearby'}
                      </p>
                      <p className="text-[10px] text-gray-500 capitalize mb-1.5">
                        Status: <strong className={isAvailable ? 'text-emerald-700' : 'text-amber-700'}>{donor.availability}</strong>
                      </p>
                      <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 inline shrink-0" />
                        <span>Approximate location (~1km radius)</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            )
          })}
        </MapContainer>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-border bg-card flex flex-wrap items-center justify-between text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted" />
          <span>
            Showing <strong>{validDonors.length}</strong> approximate donor locations out of{' '}
            <strong>{donors.length}</strong> matches.
          </span>
        </div>
        <span>OpenStreetMap tiles (Free / No API Key)</span>
      </div>
    </div>
  )
}
