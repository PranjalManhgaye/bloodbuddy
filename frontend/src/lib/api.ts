const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) localStorage.setItem('bb_token', token)
    else localStorage.removeItem('bb_token')
  }

  getToken() {
    if (!this.token) this.token = localStorage.getItem('bb_token')
    return this.token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    }
    if (this.getToken()) headers['Authorization'] = `Bearer ${this.getToken()}`
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Request failed')
    }
    if (res.status === 204) return {} as T
    return res.json()
  }

  login(email: string, password: string) {
    return this.request<{ access_token: string; user: User }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  getProfile() { return this.request<Profile>('/api/profile') }
  updateProfile(data: Partial<Profile>) {
    return this.request<Profile>('/api/profile', { method: 'PATCH', body: JSON.stringify(data) })
  }

  createRequest(data: CreateRequestData) {
    return this.request<BloodRequest>('/api/requests', { method: 'POST', body: JSON.stringify(data) })
  }
  getRequests() { return this.request<BloodRequest[]>('/api/requests') }
  getRequest(id: string) { return this.request<BloodRequest>(`/api/requests/${id}`) }
  cancelRequest(id: string) {
    return this.request<BloodRequest>(`/api/requests/${id}/cancel`, { method: 'POST' })
  }
  getMatches(id: string) { return this.request<DonorMatch[]>(`/api/requests/${id}/matches`) }
  getTracking(id: string) { return this.request<TrackingData>(`/api/requests/${id}/tracking`) }

  extractDocument(file: File) {
    const form = new FormData()
    form.append('file', file)
    return this.request<AIExtraction>('/api/requests/extract-document', { method: 'POST', body: form })
  }
  confirmExtraction(id: string) {
    return this.request<AIExtraction>(`/api/requests/extractions/${id}/confirm`, { method: 'POST' })
  }

  createInvitation(requestId: string, donorId: string, message?: string) {
    return this.request<Invitation>(`/api/requests/${requestId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ donor_id: donorId, message }),
    })
  }
  getInvitations() { return this.request<Invitation[]>('/api/invitations') }
  updateInvitation(id: string, status: 'accepted' | 'declined', shareContact = false) {
    return this.request<Invitation>(`/api/invitations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, share_contact: shareContact }),
    })
  }

  getDemoStats() { return this.request<DemoStats>('/api/demo/stats') }
  resetDemo() { return this.request<{ message: string }>('/api/demo/reset', { method: 'POST' }) }
  getNotifications() { return this.request<Notification[]>('/api/demo/notifications') }
  health() { return this.request<{ status: string; ai_provider: string }>('/health') }
}

export const api = new ApiClient()

export interface User {
  id: string
  email: string
  role: 'requester' | 'donor' | 'admin'
  display_name: string
}

export interface Profile {
  id: string
  user_id: string
  display_name: string
  email: string
  role: 'requester' | 'donor' | 'admin'
  blood_group?: string
  city?: string
  latitude?: number
  longitude?: number
  availability: string
  contact_method: string
  phone?: string
  share_contact_on_accept: boolean
  consent_notifications: boolean
}

export interface BloodRequest {
  id: string
  requester_id: string
  reference_id?: string
  blood_group: string
  units_requested: number
  hospital_name: string
  city: string
  latitude?: number
  longitude?: number
  required_date?: string
  urgency: string
  notes?: string
  contact_preference: string
  consent_confirmed: boolean
  status: string
  confirmed_from_ai: boolean
  ai_extraction_id?: string
  created_at: string
  updated_at: string
  invitation_counts?: { total: number; pending: number; accepted: number; declined: number }
}

export interface CreateRequestData {
  reference_id?: string
  blood_group: string
  units_requested: number
  hospital_name: string
  city: string
  latitude?: number
  longitude?: number
  required_date?: string
  urgency?: string
  notes?: string
  contact_preference?: string
  consent_confirmed: boolean
  ai_extraction_id?: string
  confirmed_from_ai?: boolean
}

export interface DonorMatch {
  donor_id: string
  display_name: string
  blood_group: string
  city?: string
  distance_km?: number
  availability: string
  match_type: string
}

export interface AIExtraction {
  id: string
  provider: string
  provider_label: string
  filename?: string
  extracted_data: Record<string, unknown>
  field_confidence?: Record<string, string>
  needs_confirmation: boolean
  confirmed: boolean
  created_at: string
}

export interface Invitation {
  id: string
  request_id: string
  donor_id: string
  donor_name?: string
  status: string
  message?: string
  contact_shared: boolean
  responded_at?: string
  created_at: string
  request_details?: BloodRequest
}

export interface TrackingData {
  request: BloodRequest
  status_history: { id: string; from_status?: string; to_status: string; note?: string; created_at: string }[]
  invitations: Invitation[]
  response_summary: { total_invited: number; pending: number; accepted: number; declined: number }
}

export interface DemoStats {
  total_donors: number
  active_requests: number
  pending_invitations: number
  completed_coordinations: number
  is_demo_data: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  event_type: string
  related_id?: string
  read: boolean
  created_at: string
}
