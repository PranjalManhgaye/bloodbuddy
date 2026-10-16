import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g }))
const URGENCY = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
]

export function RequestBlood() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    reference_id: '',
    blood_group: 'O+',
    units_requested: '1',
    hospital_name: '',
    city: '',
    required_date: '',
    urgency: 'routine',
    notes: '',
    contact_preference: 'in_app',
    consent_confirmed: false,
  })

  const update = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.consent_confirmed) {
      setError('You must confirm consent to proceed')
      return
    }
    setLoading(true)
    try {
      const req = await api.createRequest({
        reference_id: form.reference_id || undefined,
        blood_group: form.blood_group,
        units_requested: parseInt(form.units_requested),
        hospital_name: form.hospital_name,
        city: form.city,
        required_date: form.required_date || undefined,
        urgency: form.urgency,
        notes: form.notes || undefined,
        contact_preference: form.contact_preference,
        consent_confirmed: true,
      })
      setSuccess(true)
      setTimeout(() => navigate(`/requests/${req.id}`), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Request Submitted</h2>
        <p className="text-muted text-sm">Redirecting to matching dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Request Blood</h2>
        <p className="text-muted text-sm">Fill in the details for your blood donation request.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>All fields marked with context help ensure accurate donor matching.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="reference_id"
              label="Reference ID (optional)"
              value={form.reference_id}
              onChange={(e) => update('reference_id', e.target.value)}
              hint="Patient or hospital reference number"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                id="blood_group"
                label="Blood Group Required"
                options={BLOOD_GROUPS}
                value={form.blood_group}
                onChange={(e) => update('blood_group', e.target.value)}
              />
              <Input
                id="units"
                label="Units Requested"
                type="number"
                min="1"
                max="10"
                value={form.units_requested}
                onChange={(e) => update('units_requested', e.target.value)}
              />
            </div>

            <Input
              id="hospital"
              label="Hospital / Blood Bank"
              value={form.hospital_name}
              onChange={(e) => update('hospital_name', e.target.value)}
              required
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                id="city"
                label="City"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                required
              />
              <Input
                id="date"
                label="Date Needed"
                type="date"
                value={form.required_date}
                onChange={(e) => update('required_date', e.target.value)}
              />
            </div>

            <Select
              id="urgency"
              label="Urgency Level"
              options={URGENCY}
              value={form.urgency}
              onChange={(e) => update('urgency', e.target.value)}
            />

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1.5">Notes (optional)</label>
              <textarea
                id="notes"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Additional details for donors..."
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent_confirmed}
                onChange={(e) => update('consent_confirmed', e.target.checked)}
                className="mt-1 rounded border-border"
              />
              <span className="text-sm text-muted">
                I confirm this request is accurate and I consent to BloodBuddy coordinating with registered donors.
                I understand this platform does not replace medical services.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-sm text-danger bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
