# ARCHITECTURE & CODEBASE NAVIGATION GUIDE
## Project: Livekeeping Open
**Repository:** `https://github.com/sp25126/livekeep-OPEN`  
**Primary Language:** TypeScript / Next.js 16 App Router  
**Backend:** Supabase PostgreSQL + Serverless Route Handlers + Node.js Tally Bridge  

---

## 1. Quick Context Recovery Guide (For Agents & Engineers)
If context is refreshed, lost, or compacted, follow this 4-step checklist:
1. **Read `PRD.md`**: Understand the product scope, business logic, and roles (`admin`, `manager`, `checker`, `maker`).
2. **Read `SD.md`**: Understand the database tables, API payloads, and Tally XML integration specs.
3. **Read `ARCHITECTURE.md` (this file)**: Understand the directory tree, active files, and environment configuration.
4. **Run Verification Command**: `npx tsc --noEmit` and `npm run dev` to ensure clean execution.

---

## 2. Directory Tree & File Inventory

```plaintext
live-keeping_open/
├── .env.local                       # Active local environment secrets (Supabase, Meta, NIC)
├── .env.example                     # Reference template for all required variables
├── Dockerfile                       # Production multi-stage Docker build for Next.js App Router
├── docker-compose.yml               # Local containerized orchestration
├── next.config.ts                   # Next.js configuration (Turbopack, standalone output)
├── package.json                     # Dependencies, scripts, and package metadata
├── tsconfig.json                    # TypeScript compiler configuration
├── PRD.md                           # Product Requirement Document
├── SD.md                            # System Design Document
├── ARCHITECTURE.md                  # This architecture and codebase guide
│
├── public/                          # Static web assets and PWA icons
│   ├── favicon.ico
│   ├── sw.js                        # Service worker for offline asset caching
│   └── icons/
│       ├── icon-192x192.png         # PWA icon 192px
│       └── icon-512x512.png         # PWA icon 512px
│
├── src/
│   ├── app/                         # Next.js App Router root
│   │   ├── globals.css              # Design tokens, palette variables, luxe card styling
│   │   ├── layout.tsx               # Root layout with font imports, PWA provider, and metadata
│   │   ├── manifest.ts              # Web App Manifest generator for PWA installation
│   │   ├── page.tsx                 # Main Executive Dashboard (Daybook, KPI metrics, dynamic modals)
│   │   │
│   │   ├── api/                     # Serverless API Route Handlers
│   │   │   ├── admin/
│   │   │   │   └── users/
│   │   │   │       └── route.ts     # User CRUD & RBAC provisioning using Supabase Service Key
│   │   │   ├── auth/
│   │   │   │   ├── verify-pin/
│   │   │   │   │   └── route.ts     # 6-Digit Master Security PIN SHA-256 validation & rate limiting
│   │   │   │   └── update-pin/
│   │   │   │       └── route.ts     # Admin Master PIN rotation & inactivity timeout update
│   │   │   ├── cron/
│   │   │   │   └── process-reminders/
│   │   │   │       └── route.ts     # Background CRON endpoint to fire scheduled WhatsApp reminders
│   │   │   ├── invoices/
│   │   │   │   └── [id]/
│   │   │   │       └── pdf/
│   │   │   │           └── route.ts # Serverless dynamic HTML-to-PDF invoice rendering
│   │   │   ├── reminders/
│   │   │   │   └── schedule/
│   │   │   │       └── route.ts     # Schedule payment reminder API route
│   │   │   ├── vouchers/
│   │   │   │   ├── approve/
│   │   │   │   │   └── route.ts     # Maker-Checker status change + WhatsApp dispatch trigger
│   │   │   │   └── [id]/
│   │   │   │       └── generate-irn/
│   │   │   │           └── route.ts # 1-Click Government NIC E-Invoice (IRN) API route
│   │   │
│   │   └── dashboard/
│   │       ├── inventory/
│   │       │   └── page.tsx         # Inventory tracking & Negative Stock Alert Dashboard
│   │       ├── reports/
│   │       │   ├── page.tsx         # Categorized Reports Hub (Accounting Reports & My Entries)
│   │       │   └── inactive/
│   │       │       └── page.tsx     # Inactive Customer Analytics (30-180+ Days) & WhatsApp Re-engagement
│   │       └── users/
│   │           └── page.tsx         # Admin Staff & Roles management UI portal
│   │
│   ├── components/                  # Modular React UI Components
│   │   ├── Navigation.tsx           # Responsive Dual Navigation (Desktop Sidebar + Mobile Bottom Tabs)
│   │   ├── Sidebar.tsx              # Standalone RBAC Sidebar for admin pages
│   │   ├── DashboardHeader.tsx      # Multi-Company Switcher, Sync Health Banner & Financial Date Range Picker
│   │   ├── MetricsGrid.tsx          # 8 Standard Financial Metric Cards (Sales, Receivables, Purchase, etc.)
│   │   ├── CreateTransactionSheet.tsx # 11-Voucher Class Creation Bottom Sheet / Modal
│   │   ├── forms/
│   │   │   └── vouchers/
│   │   │       ├── OrderForm.tsx    # Sales & Purchase Order builder with terms & delivery dates
│   │   │       ├── AdjustmentForm.tsx # Journal (multi-Dr/Cr), Credit Note & Debit Note with reason codes
│   │   │       ├── ContraForm.tsx   # Restricted Cash ⇋ Bank internal transfer form
│   │   │       └── CashFlowForm.tsx # Receipt & Payment with 1-click invoice settlement selector
│   │   ├── VoucherList.tsx          # Responsive Daybook (Desktop multi-column + Mobile card stack)
│   │   ├── VoucherDrawer.tsx        # Slide-over invoice drawer on desktop / Bottom sheet on mobile
│   │   ├── ReportsView.tsx          # Receivables Aging ("Money to Collect"), Scheduler Modal, P&L & Balance Sheet
│   │   ├── SecurityPinModal.tsx     # Full-screen touch Numpad Master PIN lock overlay
│   │   ├── SecurityLayoutWrapper.tsx# Client wrapper enforcing DOM blur and Zero-Trust session lock
│   │   └── PWAProvider.tsx          # Service worker registration and online/offline sync listener
│   │
│   ├── context/
│   │   └── SecurityContext.tsx      # Global security state provider (inactivity timer, lock/unlock)
│   │
│   ├── data/
│   │   └── sample_invoices.json     # Comprehensive seed dataset of B2B GST invoices & ledgers
│   │
│   ├── lib/                         # Shared utilities and services
│   │   ├── supabase.ts              # Standard client-side Supabase client (Anon Key)
│   │   ├── supabaseAdmin.ts         # Server-side Supabase Admin client (Service Role Key)
│   │   │
│   │   ├── billing/
│   │   │   └── taxEngine.ts         # Automated Intra/Inter-State GST tax engine & rounding utility
│   │   │
│   │   └── services/
│   │       ├── auditLogger.ts       # Zero-Trust security event logger (system_audit_logs)
│   │       ├── scheduler.ts         # Payment reminder scheduler & cron processor engine
│   │       ├── whatsapp.ts          # 100% Free Option A wa.me direct dispatcher + Option B Meta fallback
│   │       ├── offlineSync.ts       # LocalStorage/IndexedDB offline voucher mutation queue
│   │       │
│   │       └── nic-gst/             # Indian Government E-Invoice (IRN) Engine
│   │           ├── crypto.ts        # AES-256-ECB encryption/decryption & SEK session caching
│   │           └── payloadBuilder.ts# GST INV-01 JSON schema constructor
│   │
│   ├── scripts/
│   │   └── tally-bridge/            # Local Windows Tally XML HTTP Bridge Module
│   │       ├── index.js             # Supabase Realtime WebSocket listener & HTTP bridge
│   │       ├── xml-parser.js        # Dynamic Debit/Credit accounting parser for all voucher types
│   │       ├── extract.js           # Tally Stock Summary extractor & Supabase inventory sync
│   │       ├── dispatch.js          # HTTP POST dispatcher to Tally Prime Port 9000
│   │       ├── start-tally-sync.bat # 1-Click Windows batch script to launch bridge
│   │       └── package.json         # Standalone dependencies for local PC deployment
│   │
│   └── types/
│       └── database.ts              # Strict TypeScript definitions for database, profiles, stock & vouchers
│
└── supabase/
    └── schema.sql                   # Full PostgreSQL DDL, views, RLS policies, triggers & enum types
```

---

## 3. Environment Variables Reference (`.env.local`)

| Variable Name | Purpose | Example / Required Format |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project REST URL | `https://wvxtoqeblnornkovpaep.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin secret key for user provisioning & bypass RLS | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_APP_URL` | Application base domain | `http://localhost:3000` or `https://livekeeping.vercel.app` |
| `META_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone ID | `100234567890123` |
| `META_WHATSAPP_TOKEN` | Meta Graph API Bearer Token | `EAAB...` |
| `WHATSAPP_TEMPLATE_NAME` | Approved WhatsApp template | `payment_reminder_v1` |
| `NIC_CLIENT_ID` | Government NIC Sandbox Client ID | `TEST_CLIENT_ID` |
| `NIC_CLIENT_SECRET` | Government NIC Sandbox Client Secret | `TEST_SECRET` |
| `NIC_USER_NAME` | NIC Portal Username | `TEST_USER` |
| `NIC_PASSWORD` | NIC Portal Password | `TEST_PASS` |
| `NIC_GSTIN` | Organization GSTIN for Sandbox | `24AAACL9999P1Z2` |

---

## 4. Development & Production Runbook

### 4.1. Run Locally (Next.js App Router)
```bash
npm run dev
# Starts Turbopack server on http://localhost:3000
```

### 4.2. Run Local Tally XML Bridge
```bash
node src/scripts/tally-bridge/index.js
# Starts Supabase Realtime listener & dispatches to http://localhost:9000
```

### 4.3. Typecheck & Build
```bash
npx tsc --noEmit
npm run build
```

### 4.4. Docker Container Execution
```bash
docker build -t livekeep-open .
docker run -d -p 3000:3000 --env-file .env.local --name livekeep_app livekeep-open
```
