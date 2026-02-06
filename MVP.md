# Franchise Subscription Platform – MVP Specification

This document outlines the MVP for a **multi-tenant subscription management platform** designed for franchise or local stores (e.g., an ice cream shop) that do not traditionally offer subscriptions.

The MVP supports:
- Stripe-powered subscriptions
- One QR-code redemption per **Stripe billing period**
- No POS integration
- Staff-operated in-store QR scanning
- Multi-store, multi-tenant architecture

---

## 1. MVP Scope

### Core Features
- Public branded signup page per store
- Stripe subscription checkout
- Customer portal with a **stable signed QR code**
- Staff web-based QR scanner
- Hard enforcement: **1 redemption per billing period**
- Store owner dashboard (basic metrics)

### Non-Goals (for MVP)
- POS integration
- Offline redemption
- Complex entitlement logic (beyond 1 redemption / period)
- Multi-plan bundles or add-ons

---

## 2. Tech Stack

- **Frontend / Backend Framework**: Next.js (App Router)
- **Auth + Database**: Supabase (Postgres + RLS)
- **Payments**: Stripe Subscriptions
- **Hosting**: Vercel (or equivalent)
- **QR Security**: HMAC-signed stable QR payloads

---

## 3. Application Folder Structure (Next.js App Router)

/app
/(public)
/[storeSlug]
page.tsx # Store landing / plan picker
subscribe/page.tsx # Start Stripe checkout
success/page.tsx # Checkout success
cancel/page.tsx # Checkout cancel

/(auth)
/login/page.tsx # Staff / owner login

/(customer)
/account/page.tsx # Customer portal (QR, status, history)

/(staff)
/scan/page.tsx # Camera-based QR scanner
/redeem/[token]/page.tsx # Optional manual redeem view

/(owner)
/dashboard/page.tsx
/dashboard/[storeSlug]/page.tsx
/dashboard/[storeSlug]/subscribers/page.tsx
/dashboard/[storeSlug]/redemptions/page.tsx
/dashboard/[storeSlug]/plans/page.tsx

/api
/stripe
checkout/route.ts # Create checkout session
webhook/route.ts # Stripe webhooks
/redeem/route.ts # Redemption validation
/qr/route.ts # Generate signed QR payload
/me/route.ts # Current user + role

/lib
supabase/
client.ts
server.ts
stripe/
stripe.ts
webhook.ts
auth/
roles.ts
tenancy/
resolveStore.ts
qr/
sign.ts

/components
StoreLanding.tsx
PlanCards.tsx
QrCodeCard.tsx
Scanner.tsx
DashboardWidgets.tsx

/migrations
/types
/middleware.ts


---

## 4. Stripe Integration (MVP)

### Stripe Objects
- Product + Price per plan
- Checkout Session (`mode=subscription`)
- Webhooks as the source of truth

### Metadata Convention
Attach the following to Checkout Sessions:
- `store_id`
- `plan_id`
- `customer_ref` (Supabase user ID or internal ID)

### Webhooks to Handle
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Persist:
- Stripe customer ID
- Stripe subscription ID
- `current_period_start`
- `current_period_end`
- Subscription status

---

## 5. Database Schema (Supabase Postgres)

### stores
- `id` (uuid, pk)
- `slug` (text, unique)
- `name` (text)
- `timezone` (text, default `'America/New_York'`)
- `branding` (jsonb)
- `created_at` (timestamptz)

---

### store_domains (optional MVP)
- `id` (uuid, pk)
- `store_id` (uuid, fk)
- `hostname` (text, unique)
- `verified` (boolean)

---

### profiles
- `user_id` (uuid, pk – Supabase auth)
- `email` (text)
- `name` (text)
- `created_at` (timestamptz)

---

### store_staff
- `id` (uuid, pk)
- `store_id` (uuid, fk)
- `user_id` (uuid, fk)
- `role` (`owner` | `staff`)
- `active` (boolean)
- `created_at` (timestamptz)

**Unique**: `(store_id, user_id)`

---

### customers
- `id` (uuid, pk)
- `store_id` (uuid, fk)
- `user_id` (uuid, fk)
- `email` (text)
- `name` (text)
- `created_at` (timestamptz)

**Unique**: `(store_id, user_id)` or `(store_id, email)`

---

### plans
- `id` (uuid, pk)
- `store_id` (uuid, fk)
- `name` (text)
- `description` (text)
- `benefit_type` (text)
- `redemptions_per_period` (int, default 1)
- `stripe_price_id` (text)
- `active` (boolean)
- `created_at` (timestamptz)

---

### subscriptions
- `id` (uuid, pk)
- `store_id` (uuid, fk)
- `customer_id` (uuid, fk)
- `plan_id` (uuid, fk)
- `provider` (text, default `'stripe'`)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text, unique)
- `status` (text)
- `current_period_start` (timestamptz)
- `current_period_end` (timestamptz)
- `cancel_at_period_end` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

### redemptions
- `id` (uuid, pk)
- `store_id` (uuid, fk)
- `subscription_id` (uuid, fk)
- `customer_id` (uuid, fk)
- `period_start` (timestamptz)
- `redeemed_at` (timestamptz, default now())
- `staff_user_id` (uuid, fk)
- `note` (text)

**Critical Unique Constraint**  
`(subscription_id, period_start)`

This enforces **1 redemption per billing period**.

---

## 6. QR Code Design

- Stable QR code per subscription
- Encodes:
  - `subscription_id`
  - `store_id`
  - HMAC signature
- No DB storage required for QR codes
- Signature prevents forgery

---

## 7. API Endpoints (MVP)

### POST `/api/stripe/checkout`
- Creates Stripe Checkout Session
- Returns redirect URL

### POST `/api/stripe/webhook`
- Verifies Stripe signature
- Syncs subscription state into DB
- Idempotent processing required

### POST `/api/redeem`
- Staff-authenticated
- Validates QR signature
- Checks active subscription
- Inserts redemption row
- Fails on unique constraint if already redeemed

---

## 8. Access Control & RLS (Supabase)

### Roles
- **Public**: read store branding + active plans
- **Customer**: read own subscription + redemption history
- **Staff/Owner**: read store-scoped data, create redemptions

Use:
- Supabase Auth
- Row Level Security policies
- `store_staff` table as authorization source

---

## 9. MVP Screens

### Public
- Store landing page
- Plan selection
- Subscribe CTA

### Customer
- Subscription status
- QR code
- Redemption history

### Staff
- QR scanner
- Redemption success / failure feedback

### Owner
- Active subscriber count
- Redemptions this period
- Recent redemption log

---

## 10. Environment Variables

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
QR_HMAC_SECRET
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY


---

## 11. Key MVP Guarantees

- One redemption per Stripe billing period
- Server-side enforcement via DB constraint
- No POS dependency
- Screenshot sharing allowed but ineffective after first use
- Fully auditable redemption trail

---

## 12. Next Steps (Post-MVP)

- Multiple plans per store
- Custom domains per store
- Offline / fallback redemption
- POS integrations
- Advanced entitlement rules
- Analytics & churn reporting

---
