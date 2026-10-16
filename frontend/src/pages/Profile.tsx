import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CheckCircle } from 'lucide-react'

const BLOOD_GROUPS = [{ value: '', label: 'Not set' }, ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g }))]
const AVAILABILITY = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited availability' },
  { value: 'unavailable', label: 'Unavailable' },
]

export function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    blood_group: profile?.blood_group || '',
    city: profile?.city || '',
    availability: profile?.availability || 'available',
    contact_method: profile?.contact_method || 'in_app',
    phone: profile?.phone || '',
    share_contact_on_accept: profile?.share_contact_on_accept ?? false,
    consent_notifications: profile?.consent_notifications ?? true,
  })

  const update = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.updateProfile({
        display_name: form.display_name,
        blood_group: form.blood_group || undefined,
        city: form.city,
        availability: form.availability,
        contact_method: form.contact_method,
        phone: form.phone || undefined,
        share_contact_on_accept: form.share_contact_on_accept,
        consent_notifications: form.consent_notifications,
      })
      await refreshProfile()
      setSaved(true)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Profile Settings</h2>
        <p className="text-muted text-sm">Manage your account and donor preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your display name and location are used for donor matching.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="name"
            label="Display Name"
            value={form.display_name}
            onChange={(e) => update('display_name', e.target.value)}
          />
          <Input
            id="email"
            label="Email"
            value={profile?.email || ''}
            disabled
            hint="Email cannot be changed in demo mode"
          />
          <Input
            id="city"
            label="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            hint="Approximate location for matching. Exact address is never shown"
          />

          {profile?.role === 'donor' && (
            <>
              <Select
                id="blood_group"
                label="Blood Group"
                options={BLOOD_GROUPS}
                value={form.blood_group}
                onChange={(e) => update('blood_group', e.target.value)}
              />
              <Select
                id="availability"
                label="Availability"
                options={AVAILABILITY}
                value={form.availability}
                onChange={(e) => update('availability', e.target.value)}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & Privacy</CardTitle>
          <CardDescription>Control how others can reach you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="phone"
            label="Phone (optional)"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            hint="Never shown publicly. Shared only with explicit consent."
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.share_contact_on_accept}
              onChange={(e) => update('share_contact_on_accept', e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-muted">
              Share my contact information when I accept a donation invitation
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consent_notifications}
              onChange={(e) => update('consent_notifications', e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-muted">
              Receive in-app notifications about donation requests
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} loading={loading}>Save Changes</Button>
        {saved && (
          <span className="text-sm text-success flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />Saved
          </span>
        )}
      </div>
    </div>
  )
}
