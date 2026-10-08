# Livekeeping Open - ERP & Real-time B2B GST Accounting PWA

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-emerald.svg)
![PWA](https://img.shields.io/badge/PWA-Offline--First-purple.svg)

**Livekeeping Open** is an open-source, cross-device ERP & GST billing web platform designed for micro, small, and medium enterprises (MSMEs). It combines real-time multi-device WebSocket synchronization, a Maker-Checker authorization workflow, GPS field force tracking, native Meta WhatsApp notifications, and direct Tally Prime XML synchronization.

---

## 🏗️ System Architecture

```
                                 +-----------------------------------+
                                 |   Next.js 16 App Router PWA       |
                                 | (Desktop, Mobile & Tablet Web)    |
                                 +-----------------+-----------------+
                                                   |
                        +--------------------------+--------------------------+
                        |                                                     |
             [WebSocket / REST]                                       [HTTP / Serverless]
                        |                                                     |
                        v                                                     v
        +---------------+---------------+                   +-----------------+-----------------+
        | Supabase Realtime & PostgreSQL|                   | Meta WhatsApp Cloud API Service |
        | - Row Level Security (RLS)    |                   | - Document Template Dispatch    |
        | - Maker-Checker Auth Models   |                   | - Dynamic PDF Invoice Renderer  |
        | - GPS Field Tracking Logs     |                   +-----------------+-----------------+
        +---------------+---------------+                                     |
                        |                                                     v
                        +--------------------------+--------------------------+
                                                   |
                                       [Local HTTP Bridge :9000]
                                                   |
                                                   v
                                 +-----------------+-----------------+
                                 |  Tally Prime Local XML Bridge     |
                                 |  - Voucher XML Envelope Imports   |
                                 +-----------------------------------+
```

---

## 🔥 Key Features & Capabilities

- **Cross-Device Real-Time Sync**: Instant WebSocket synchronization powered by Supabase Realtime Engine.
- **Maker-Checker Authorization Model**: Structured approval flow where Makers create sales vouchers and Checkers/Admins review and approve.
- **PWA & Offline-First Resilience**: Service Worker caching (`public/sw.js`), native manifest (`src/app/manifest.ts`), and an offline mutation queue (`src/lib/services/offlineSync.ts`) for zero-connectivity field entry.
- **Native PDF Invoice Generator**: Serverless Route Handler (`GET /api/invoices/[id]/pdf`) generating B2B GST tax invoices with HSN itemization, tax breakdown, and 64-character IRN hashes.
- **Meta WhatsApp Cloud API Service**: Native integration (`src/lib/services/whatsapp.ts`) sending PDF invoice reminders directly to customer phones upon approval.
- **Local Tally Prime XML HTTP Bridge**: Node.js listener (`scripts/tally_bridge.js`) converting approved vouchers into Tally XML format and syncing on `http://localhost:9000`.
- **GPS Sales Force Location Log**: Real-time sales team visit tracking with coordinate logging.

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wvxtoqeblnornkovpaep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_pp3HOHd4Spr3RUNQcU8fFw_YRSgxRn7

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Meta WhatsApp Cloud API Configuration
META_PHONE_NUMBER_ID=your_meta_phone_number_id
META_WHATSAPP_TOKEN=your_meta_bearer_token
WHATSAPP_TEMPLATE_NAME=payment_reminder_v1
```

---

## 🗄️ Supabase Database Setup & RLS Migration

Execute the migration script at `supabase/schema.sql` inside your [Supabase SQL Editor](https://supabase.com/dashboard/project/wvxtoqeblnornkovpaep/sql/new):

```sql
-- Enable Extensions & Custom Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE user_role AS ENUM ('admin', 'maker', 'checker');
CREATE TYPE voucher_type AS ENUM ('sales_bill', 'quotation', 'credit_note');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- Create Tables
CREATE TABLE public.profiles (...);
CREATE TABLE public.vouchers (...);
CREATE TABLE public.sales_field_logs (...);

-- Enable RLS & Realtime
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_field_logs;
```

---

## 🚀 Local Development & Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Local Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Start Local Tally Prime XML Bridge**:
   ```bash
   node scripts/tally_bridge.js
   ```
   The Tally bridge listener will start on `http://localhost:9000`.

---

## 🐳 Docker Deployment

Build and run using Docker Compose:

```bash
docker-compose up --build -d
```

Or build manually:

```bash
docker build -t livekeep-open .
docker run -d -p 3000:3000 --env-file .env.local --name livekeep_app livekeep-open
```

---

## ⚡ API Endpoint Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/invoices/[id]/pdf` | `GET` | Renders standard B2B GST Tax Invoice HTML/PDF stream |
| `/api/vouchers/approve` | `POST` | Approves voucher, generates PDF link & dispatches WhatsApp reminder |
| `/manifest.webmanifest` | `GET` | PWA manifest metadata |
| `http://localhost:9000/api/tally/sync` | `POST` | Accepts voucher JSON & posts Tally XML Envelope |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
