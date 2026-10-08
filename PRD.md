# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Project: Livekeeping Open — Enterprise ERP, GST Billing & Real-Time Tally Bridge
**Version:** 2.0.0  
**Status:** Active / Production Ready  
**Target Market:** Indian MSMEs, Wholesalers, Distributors, Retailers & Accounting Firms  
**Repository:** `https://github.com/sp25126/livekeep-OPEN`  
**Live Production Engine:** Next.js 16 (Turbopack) + Supabase Realtime + Node.js Tally Bridge + NIC GST IRP Gateway  

---

## 1. Executive Summary & Problem Statement
Small and medium businesses (MSMEs) in India heavily rely on **Tally Prime / Tally.ERP 9** for accounting, but face massive friction:
1. **Desktop Lock-in:** Tally runs locally on Windows PCs in the office; business owners and field sales reps cannot access ledgers, create invoices, or collect payments on the road.
2. **Lack of Dual-Control (Fraud Risk):** Field reps make manual billing mistakes without approval workflows.
3. **Complex Government E-Invoicing:** Businesses with turnover exceeding ₹5 Cr struggle with NIC JSON schema generation, AES-256 encryption, and manual portal uploads.
4. **Slow Receivables Collection:** Accountants spend hours calling customers for payments instead of automated 1-tap WhatsApp reminders.

**Livekeeping Open** solves these problems by providing an open-source, mobile-first, cloud-synchronized ERP that integrates bi-directionally with local Tally Prime instances, automates Government E-Invoicing (IRN) and E-Way Bills, dispatches WhatsApp bills with PDF attachments, and implements strict Maker-Checker authorization.

---

## 2. Target User Personas & User Journeys

| Persona | Role in System | Key Needs & Pain Points | Core Features Used |
| :--- | :--- | :--- | :--- |
| **Business Owner / Director** | `admin` | Real-time sales visibility, profit margins, outstanding cash collections, team governance. | Executive Dashboard, P&L Reports, Aging Matrix, Team RBAC. |
| **Head Accountant** | `checker` | Audit verification, ledger accuracy, Tally sync confirmation, GST compliance. | Daybook Approvals, 1-Click IRN Generation, Tally XML Sync, Reconciliation. |
| **Field Sales Executive** | `maker` | Quick invoice creation on mobile during shop visits, GPS check-in, offline billing. | Mobile Voucher Creation, GPS Check-in, WhatsApp bill sharing, Offline Cache. |
| **Operations Manager** | `manager` | Stock tracking, sales dispatch monitoring, staff productivity. | Reports, GPS Field Logs, Sales Metrics. |

---

## 3. Core Functional Modules & Requirements

### 3.1. Maker-Checker Authorization Engine
- **Requirement:** Vouchers created by field reps (`maker`) remain in `pending` status.
- **Workflow:** An authorized `checker` or `admin` reviews line items, prices, and tax breakdown.
- **Trigger Actions on Approval:**
  1. Status changes to `approved`.
  2. PDF Tax Invoice is dynamically generated via `/api/invoices/[id]/pdf`.
  3. WhatsApp Meta Cloud API message with PDF link is dispatched to customer mobile.
  4. Real-time Supabase payload flags voucher for local Windows Tally XML bridge consumption.

### 3.2. Local Windows Tally Prime XML HTTP Bridge
- **Requirement:** Bi-directional sync between Supabase PostgreSQL and local Tally Prime running on Windows `localhost:9000`.
- **Bridge Architecture (`src/scripts/tally-bridge/`):**
  - Subscribes to Supabase Realtime channel `vouchers-realtime`.
  - When a voucher status changes to `approved`, constructs standard Tally XML envelope (`<ENVELOPE><HEADER>...<BODY><DATA><TALLYMESSAGE>`).
  - Sends HTTP POST request to `http://localhost:9000`.
  - Parses Tally XML response (`<CREATED>1</CREATED>`, `<ERRORS>0</ERRORS>`) and updates Supabase sync status.

### 3.3. Government NIC E-Invoice (IRN) & E-Way Bill Integration
- **Requirement:** 1-Click generation of 64-character Invoice Registration Number (IRN), QR Code hash, and 12-digit E-Way Bill number directly via Indian Government Sandbox/Production NIC APIs.
- **Security & Crypto:**
  - AES-256-ECB encryption/decryption using Symmetric Encryption Key (SEK) and App Key.
  - Automated authentication token caching (6-hour expiry).
  - Validation of mandatory GST INV-01 payload schema: `TranDtls`, `DocDtls`, `SellerDtls`, `BuyerDtls`, `ItemList`, `ValDtls`.

### 3.4. WhatsApp Cloud API & Native PDF Generation
- **Requirement:** Dispatch official tax invoice PDF and payment reminders to customer WhatsApp numbers without external SaaS dependencies.
- **Endpoints:**
  - `POST /api/vouchers/approve` -> triggers Meta WhatsApp Cloud API template `payment_reminder_v1` or custom direct message.
  - `GET /api/invoices/[id]/pdf` -> Dynamic serverless HTML-to-PDF rendering with QR code, HSN breakdown, CGST/SGST/IGST calculation, bank details, and terms.

### 3.5. Receivables & Aging Breakdown ("Money to Collect")
- **Requirement:** Group outstanding customer dues into standard aging intervals (0–30 Days, 31–60 Days, 61–90 Days, 90+ Days Overdue).
- **1-Tap Action:** One-tap button opens WhatsApp with pre-formatted reminder text quoting overdue invoice number, amount, and payment details.

### 3.6. GPS Sales Force Field Check-In
- **Requirement:** Allow field reps to record their GPS coordinates during customer site visits.
- **Storage:** Persisted in `sales_field_logs` table in Supabase with latitude, longitude, accuracy, and timestamps.

### 3.7. Offline-First PWA & Mutation Queue
- **Requirement:** Full functionality on Android Chrome and iOS Safari even in low or zero internet connectivity.
- **Implementation:**
  - Web App Manifest (`src/app/manifest.ts`) and Service Worker (`public/sw.js`).
  - Local mutation queue (`src/lib/services/offlineSync.ts`) using LocalStorage / IndexedDB.
  - Online listener automatically syncs queued vouchers to Supabase once connectivity is restored.

### 3.8. Enterprise Role-Based Access Control (RBAC) & User Management
- **Requirement:** Dedicated Admin portal (`/dashboard/users`) to create users, assign roles (`admin`, `manager`, `checker`, `maker`), reset passwords, and revoke access using the Supabase Service Role Key.

---

## 4. Non-Functional & Design Requirements
1. **Design Theme:** Warm Sand & Platinum Canvas (`#ECEBE6`), Deep Matte Carbon Sidebar (`#242628`), Pastel Sage Green (`#D4DFC7`), Buttercup Peach (`#FCE7A6`), and Periwinkle Purple (`#9B9EF8`) cards with smooth sparkline micro-charts.
2. **Non-Tech Friendly:** Clear plain-English labels, prominent Indian Rupee (`₹`) typography, minimum 48px touch targets, zero clutter.
3. **Responsiveness:** 100% fluid across 375px mobile viewports up to 1920px 4K monitors.
4. **Performance:** Sub-100ms API response times, sub-2s initial page load on 4G networks.
