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
│   └── ui/                  # Reusable UI primitives: Badge, Button, Card, Input, Select, NotificationPreviewModal
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
│   └── RequestDetail.tsx    # Live request tracking, matching donors, and WhatsApp share previews
├── test/
│   ├── setup.ts             # Test setup and jest-dom matchers
│   ├── Badge.test.tsx       # Component tests
│   ├── NotificationPreviewModal.test.tsx # Notification preview modal tests
│   └── utils.test.ts        # Utility tests
├── App.tsx                  # Application routing and theme wrappers
└── main.tsx                 # React entry point
```

---

## Available Scripts

From the `frontend/` directory:

### `npm run dev`
Starts the Vite development server with Hot Module Replacement (HMR) at [http://localhost:5173](http://localhost:5173).

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

## External Notification Sharing (WhatsApp & SMS Demo)

BloodBuddy provides a **manual share demo workflow** via `NotificationPreviewModal`:
- Generates pre-filled coordination messages for **WhatsApp** (`https://wa.me/?text=...`) and **SMS**.
- Clearly displays a **Demo Mode (Manual Share)** badge.
- Never sends automated external messages without user review.
- Protects donor privacy by keeping phone numbers unexposed until explicit mutual consent is recorded.
