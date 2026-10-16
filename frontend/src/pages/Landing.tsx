import { Link } from 'react-router-dom'
import { Droplets, FileSearch, Users, Shield, ArrowRight, AlertTriangle, Heart, MapPin, CheckCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-primary mb-4">Community Blood Donor Coordination</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
              Every donor counts.<br />
              <span className="text-primary">Every connection matters.</span>
            </h1>
            <p className="text-lg text-muted mb-8 max-w-lg leading-relaxed">
              BloodBuddy helps communities organize blood donation requests, connect with willing donors,
              and coordinate safely with AI-assisted document processing and privacy-first design.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login?role=requester">
                <Button size="lg">
                  Find Blood Donors
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login?role=donor">
                <Button variant="outline" size="lg">Become a Donor</Button>
              </Link>
            </div>
          </div>

          {/* Product preview mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="bg-muted-bg px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-muted ml-2">BloodBuddy | Donor Matching</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Request #BR-2026-0042</p>
                    <p className="text-xs text-muted">O+ · 2 units · City General Hospital</p>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">Matching</span>
                </div>
                {[
                  { name: 'Rahul V.', group: 'O+', dist: '2.1 km', status: 'Available' },
                  { name: 'Anita S.', group: 'O+', dist: '3.4 km', status: 'Available' },
                  { name: 'Vikram P.', group: 'O+', dist: '28 km', status: 'Limited' },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between py-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{d.dist}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{d.group}</span>
                      <Button size="sm" variant="secondary">Invite</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency banner */}
      <section className="bg-primary-light border-y border-[#EDD5DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <strong>Need blood urgently?</strong> Create a request and we'll help find matching donors in your area.
            </p>
          </div>
          <Link to="/login?role=requester">
            <Button size="sm">Emergency Request</Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">How BloodBuddy works</h2>
          <p className="text-muted max-w-lg mx-auto">Three simple steps to connect requesters with willing donors in your community.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: FileSearch, title: 'Create or upload a request', desc: 'Fill out a form or upload a blood request document. Our AI extracts key details for your review.' },
            { icon: Users, title: 'Find matching donors', desc: 'BloodBuddy identifies registered donors with matching blood groups near your location.' },
            { icon: Shield, title: 'Coordinate with consent', desc: 'Donors accept or decline invitations. Contact details are shared only with explicit consent.' },
          ].map((step, i) => (
            <div key={step.title} className="relative">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium text-primary mb-2">Step {i + 1}</p>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for trust and privacy</h2>
              <div className="space-y-5">
                {[
                  'AI-assisted document extraction with mandatory human confirmation',
                  'Same-blood-group coordination matching (not medical compatibility)',
                  'Donor locations shown as approximate city-level only',
                  'Contact sharing requires explicit consent from both parties',
                  'Open-source AI with verifiable model licensing',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-primary" />
                <span className="font-semibold">Open-Source AI</span>
              </div>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                BloodBuddy uses Qwen2.5-VL (Apache 2.0) via Ollama for document understanding,
                with a clearly labeled demo provider for development. Extracted data is never
                treated as verified without your confirmation.
              </p>
              <p className="text-xs text-muted border-t border-border pt-4">
                Model: qwen2.5vl · License: Apache 2.0 · Provider abstraction supports swapping models
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-border bg-muted-bg p-6">
          <p className="text-sm text-muted leading-relaxed">
            <strong className="text-foreground">Important:</strong> BloodBuddy is a community coordination platform.
            It does not replace hospitals, blood banks, or emergency medical services. Blood-group matching
            is for coordination purposes only. Final transfusion compatibility decisions belong to qualified
            medical professionals. In a medical emergency, call your local emergency number immediately.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              <span className="font-semibold">BloodBuddy</span>
            </div>
            <p className="text-sm text-muted">
              Hacktoberfest Hack Day Gwalior × ITM University · Open Source
            </p>
            <a href="https://github.com/PranjalManhgaye/bloodbuddy" className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
