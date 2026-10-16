import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { api, type AIExtraction } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g }))
const URGENCY = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
]

type Step = 'upload' | 'processing' | 'review' | 'confirming' | 'success'

function confidenceBadge(level: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'outline'; label: string }> = {
    high: { variant: 'success', label: 'High confidence' },
    medium: { variant: 'warning', label: 'Review suggested' },
    low: { variant: 'danger', label: 'Low confidence' },
    missing: { variant: 'outline', label: 'Not found' },
  }
  const c = map[level] || map.missing
  return <Badge variant={c.variant}>{c.label}</Badge>
}

export function AIUpload() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<AIExtraction | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    blood_group: '',
    units_requested: '',
    hospital_name: '',
    city: '',
    required_date: '',
    notes: '',
    urgency: 'routine',
    consent_confirmed: false,
  })

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setError('')
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const processDocument = async () => {
    if (!file) return
    setStep('processing')
    setError('')
    try {
      const result = await api.extractDocument(file)
      setExtraction(result)
      const data = result.extracted_data
      setForm({
        blood_group: (data.blood_group as string) || '',
        units_requested: data.units_requested ? String(data.units_requested) : '',
        hospital_name: (data.hospital_name as string) || '',
        city: (data.city as string) || '',
        required_date: (data.required_date as string) || '',
        notes: (data.requester_notes as string) || '',
        urgency: 'routine',
        consent_confirmed: false,
      })
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
      setStep('upload')
    }
  }

  const confirmAndCreate = async () => {
    if (!extraction || !form.consent_confirmed) {
      setError('Please review all fields and confirm consent')
      return
    }
    if (!form.blood_group || !form.hospital_name || !form.city) {
      setError('Blood group, hospital, and city are required')
      return
    }
    setStep('confirming')
    setError('')
    try {
      await api.confirmExtraction(extraction.id)
      const req = await api.createRequest({
        blood_group: form.blood_group,
        units_requested: parseInt(form.units_requested) || 1,
        hospital_name: form.hospital_name,
        city: form.city,
        required_date: form.required_date || undefined,
        urgency: form.urgency,
        notes: form.notes || undefined,
        consent_confirmed: true,
        ai_extraction_id: extraction.id,
        confirmed_from_ai: true,
      })
      setStep('success')
      setTimeout(() => navigate(`/requests/${req.id}`), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
      setStep('review')
    }
  }

  const update = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Request Created</h2>
        <p className="text-muted text-sm">AI-extracted data confirmed and request submitted.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">AI Document Assistant</h2>
        <p className="text-muted text-sm">
          Upload a blood request document. AI extracts fields for your review. You must confirm before creating a request.
        </p>
      </div>

      {step === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center transition-colors',
                file ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary/50',
              )}
            >
              {file ? (
                <div className="space-y-4">
                  {preview && <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />}
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button onClick={processDocument}>Extract Information</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-8 h-8 text-muted mx-auto" />
                  <p className="text-sm text-muted">Drag and drop a blood request image or PDF</p>
                  <p className="text-xs text-muted">Supports JPEG, PNG, WebP, PDF (max 10MB)</p>
                  <label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <span className="inline-block px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted-bg cursor-pointer">
                      Browse files
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted-bg flex items-start gap-2">
              <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
              <p className="text-xs text-muted">
                Try the bundled sample: upload any file named <code className="bg-card px-1 rounded">sample_blood_request.png</code> for deterministic demo extraction.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-medium">Processing document...</p>
            <p className="text-xs text-muted mt-1">Extracting fields using configured AI provider</p>
          </CardContent>
        </Card>
      )}

      {step === 'review' && extraction && (
        <>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Review required</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Provider: <strong>{extraction.provider_label}</strong>. Please verify all extracted fields before submitting.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Fields</CardTitle>
              <CardDescription>Edit any incorrect values. Fields marked with low confidence need your attention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: 'blood_group', label: 'Blood Group', type: 'select' },
                { key: 'units_requested', label: 'Units Requested', type: 'number' },
                { key: 'hospital_name', label: 'Hospital', type: 'text' },
                { key: 'city', label: 'City', type: 'text' },
                { key: 'required_date', label: 'Date Needed', type: 'date' },
              ].map((field) => {
                const conf = extraction.field_confidence?.[field.key] || 'missing'
                return (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium">{field.label}</label>
                      {confidenceBadge(conf)}
                    </div>
                    {field.key === 'blood_group' ? (
                      <Select
                        options={[{ value: '', label: 'Select...' }, ...BLOOD_GROUPS]}
                        value={form.blood_group}
                        onChange={(e) => update('blood_group', e.target.value)}
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={form[field.key as keyof typeof form] as string}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    )}
                  </div>
                )
              })}

              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                />
              </div>

              <Select
                id="urgency"
                label="Urgency"
                options={URGENCY}
                value={form.urgency}
                onChange={(e) => update('urgency', e.target.value)}
              />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent_confirmed}
                  onChange={(e) => update('consent_confirmed', e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-muted">
                  I have reviewed the extracted information, corrected any errors, and confirm this request is accurate.
                </span>
              </label>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); setExtraction(null) }}>
                  Re-upload
                </Button>
                <Button className="flex-1" onClick={confirmAndCreate}>
                  Confirm & Create Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {error && step === 'upload' && (
        <p className="text-sm text-danger text-center">{error}</p>
      )}
    </div>
  )
}
