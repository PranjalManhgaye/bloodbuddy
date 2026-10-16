# BloodBuddy Frontend

The user-facing web application for **BloodBuddy**, built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS 4**. It provides an intuitive, responsive interface for emergency blood requests, AI document extraction, donor matching, and coordination workflows.

---

## Tech Stack

| Tool / Library | Version / Role |
| -------------- | -------------- |
| **React** | `v19.2.x` — Modern component model with Hooks |
| **TypeScript** | `~v6.0.x` — Strict end-to-end type safety |
| **Vite** | `v8.x` — High-speed development server and bundler |
| **Tailwind CSS** | `v4.x` — Modern utility-first CSS framework |
| **Radix UI** | Headless accessible UI primitives (Dialog, Select, Dropdown, Toast) |
| **Lucide React** | Consistent, modern icon system |
| **Leaflet & React-Leaflet** | Interactive geospatial mapping for donor coordination |
| **Vitest & Testing Library** | Unit testing with JSDOM environment |
| **Oxlint** | High-performance Rust-based JavaScript/TypeScript linter |

---

## Directory Structure

```
frontend/src/
├── assets/                  # Static assets and illustration graphics
├── components/
│   ├── layout/              # Shared navigation, Navbar, and DashboardLayout
│   └── ui/                  # Reusable UI primitives: Badge, Button, Card, Input, Select, EmptyState, NotificationPreviewModal, DonorLocationMap
├── context/
│   └── AuthContext.tsx       # Authentication state, JWT persistence, and demo persona switching
├── lib/
│   ├── api.ts               # Typed client for all backend REST endpoints
│   └── utils.ts             # Tailwind class merging (clsx + tailwind-merge)
├── pages/
│   ├── AIUpload.tsx         # Document upload, extraction preview, and verification
│   ├── Admin.tsx            # Platform metrics and one-click demo data reset
│   ├── Dashboard.tsx        # Role-based dashboard with coordination sharing
│   ├── Landing.tsx          # Public landing page with features, CTA, and FAQs
│   ├── Login.tsx            # Sign in with credentials or one-click demo personas
│   ├── Profile.tsx          # Manage personal details, blood group, and availability status
│   ├── RequestBlood.tsx     # Manual blood request creation form
│   └── RequestDetail.tsx    # Live request tracking, location map, matching donors, and WhatsApp share previews
├── test/
│   ├── setup.ts             # Test setup and jest-dom matchers
│   ├── Badge.test.tsx       # Component tests
│   ├── DonorLocationMap.test.tsx # Location map and privacy tests
│   ├── NotificationPreviewModal.test.tsx # Notification preview modal tests
│   └── utils.test.ts        # Utility tests
├── App.tsx                  # Application routing and theme wrappers
└── main.tsx                 # React entry point
```

---

## Available Scripts

From the `frontend/` directory:

### `npm run dev`
Starts the Vite development server with Hot Module Replacement (HMR).
- Default address: [http://localhost:5173](http://localhost:5173)

### `npm run build`
Runs TypeScript type-checking (`tsc -b`) and compiles production assets into `dist/`.

### `npm test`
Runs the unit test suite once using Vitest.

### `npm run test:watch`
Runs Vitest in interactive watch mode for test-driven development.

### `npm run lint`
Runs Oxlint across all TypeScript and TSX source files for static code analysis.

### `npm run preview`
Locally serves the compiled `dist/` directory for production verification.

---

## Environment Configuration

Configure frontend behavior using environment variables. You can set them in a root `.env` or `frontend/.env`:

| Variable | Default Value | Description |
| -------- | ------------- | ----------- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Target URL for the FastAPI backend API |

---

## Core Frontend Workflows

1. **AI Document Extraction (`/ai-upload`)**:
   - Supports uploading hospital requisition forms (TXT, PDF scans, PNG/JPG images).
   - Renders field-level confidence indicators (`high`, `medium`, `low`, `missing`).
   - Requires human review and confirmation before submission.

2. **Role-Adaptive Authentication (`/login`)**:
   - In demo mode, provides one-click instant sign-in buttons for **Priya Sharma (Requester)**, **Rahul Verma (Donor O+)**, and **Admin**.
   - Syncs JWT tokens in memory and local storage.

3. **Consent-Driven Coordination (`/requests/:id`)**:
   - Displays real-time status tracker (Draft → Active → Matched → Fulfilled).
   - Lists eligible matching donors with distance estimates.
   - Hides sensitive donor contact info until an invitation is accepted.

4. **External Notification Sharing (WhatsApp & SMS Demo)**:
   - Uses `NotificationPreviewModal` for manual WhatsApp and SMS share generation.
   - Displays a prominent **Demo Mode (Manual Share)** badge.
   - Generates pre-filled coordination links without automating dispatch.
   - Keeps donor contact details private until explicit mutual consent is given.

5. **Donor Location Map (Leaflet & OpenStreetMap)**:
   - Uses `DonorLocationMap` for geospatial visualization on the request detail page.
   - Powered by OpenStreetMap tiles via Leaflet with **no paid API keys required**.
   - Safeguards donor privacy by showing rounded approximate coordinates (~1.1 km radius) and radius circles rather than exact home addresses.
   - Features responsive mobile and desktop support with graceful fallback when tiles or coordinates are unavailable.
