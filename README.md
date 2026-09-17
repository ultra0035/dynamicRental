# Dynamic Rental - Commercial Fleet & Rent-to-Own Management System 🏍️
**Randburg Central Logistics Hub & Showroom (304 Tungsten Road, Strijdom Park, Gauteng)**

> **"Ride Today. Own Tomorrow."**  
> An end-to-end commercial motorbike fleet management and rent-to-own underwriting platform built specifically for the South African on-demand delivery courier economy (Checkers Sixty60, Uber Eats, Takealot, Mr D, Bolt Food, and private logistics).

---

## 📑 Table of Contents
1. [Vision & Platform Architecture](#-vision--platform-architecture)
2. [Page-by-Page & Section-by-Section Functional Specifications](#-page-by-page--section-by-section-functional-specifications)
   - [Public Rider Portal](#1-public-rider-portal)
   - [Admin & Dealership Fleet Portal (PIN: `dynamic2026`)](#2-admin--dealership-fleet-portal)
     - [Section I: Dashboard, Applicants & Stock Master](#section-i-dashboard-applicants--stock-master)
     - [Section II: Driver Operations & Risk Registry](#section-ii-driver-operations--risk-registry)
     - [Section III: Vehicle & Asset Telematics](#section-iii-vehicle--asset-telematics)
     - [Section IV: Fleet Agreements & Financial Operations](#section-iv-fleet-agreements--financial-operations)
3. [Connecting Yoco to Verify & Track Driver Payments](#-connecting-yoco-to-verify--track-driver-payments)
   - [Yoco Payment Architecture](#1-yoco-payment-architecture)
   - [Supported Payment Methods](#2-supported-payment-methods)
   - [Step-by-Step Yoco Integration Guide](#3-step-by-step-yoco-integration-guide)
   - [Automated Reconciliation & Balance Allocation Engine](#4-automated-reconciliation--balance-allocation-engine)
   - [Handling Arrears, Late Penalties & WhatsApp Reminders](#5-handling-arrears-late-penalties--whatsapp-reminders)
4. [Complete Production Database Schema (PostgreSQL / Supabase)](#-complete-production-database-schema-postgresql--supabase)
5. [Local Development & Deployment Guide](#-local-development--deployment-guide)
6. [Showroom & Dealership Operations](#-showroom--dealership-operations)

---

## 🌟 Vision & Platform Architecture

### The South African Delivery Challenge
South Africa's on-demand delivery sector is powered by tens of thousands of dedicated two-wheeler couriers. However, traditional vehicle finance and rental operators face significant friction:
- **Paperwork & Fraud Vulnerabilities**: Cumbersome WhatsApp-based vetting, unverified foreign driver licenses, and missing Traffic Register Number (TRN) certificates.
- **Underwriting Bottlenecks**: Inability to quickly assess courier income consistency across multi-platform delivery apps (Checkers Sixty60, Uber Eats, Takealot).
- **Payment Collection & Cash Flow Risks**: High default rates, manual EFT reference matching errors, and unrecorded card taps.
- **Asset Lifecycle Blind Spots**: Untracked routine 5,000 km oil changes, unallocated AARTO traffic fines, and delayed maintenance leading to rapid fleet depreciation.

### The Dynamic Rental Solution
Dynamic Rental solves these challenges with a **seamless 2-phase lifecycle**:
1. **Rider Intake & Instant Underwriting**: 2-minute digital KYC intake, biometric touch signatures, automated foreign TRN enforcement, and rapid WhatsApp status handshakes.
2. **Comprehensive Fleet Lifecycle Management**: Once an applicant signs their contract and collects their bike, they seamlessly transition into an **Active Driver** with an assigned VIN/Plate, automated weekly Yoco billing, GPS telematics monitoring, preventive maintenance tracking, and risk registry scoring.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DYNAMIC RENTAL ECOSYSTEM                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
        │
        ├── 1. PUBLIC RIDER PORTAL
        │     ├── Fleet Showcase & Profit Calculator (Bajaj Boxer 150, Big Boy, E-Moto)
        │     ├── 2-Minute Digital Underwriting Application (ID / Passport / TRN / License)
        │     ├── Touchpad Digital Signature & WhatsApp Handshake (DR-XXXX-JHB)
        │     └── Live 4-Stage Application Status Tracker
        │
        └── 2. DEALERSHIP & FLEET MANAGEMENT PORTAL (PIN: dynamic2026)
              │
              ├── [I] Dashboard, Applicants & Stock Master
              │     ├── Executive KPI Command Center (Active Fleet, Revenue, Arrears)
              │     ├── 5-Stage Kanban & Inspector Pipeline (Pending → TRN → Approved → Delivered)
              │     ├── Walk-In Customer Intake Form (Counter Onboarding)
              │     └── Motorbike Catalog Manager (Device Photo Upload, Weekly Rates)
              │
              ├── [II] Driver Operations & Risk Registry
              │     ├── Active Drivers Directory (Assigned Bikes, Balances, Contract Terms)
              │     ├── Driver Risk Registry (Safety Scores, Speed Alerts, Default History)
              │     └── Driver Referral Program (R350 Payout Reward Lifecycle)
              │
              ├── [III] Vehicle & Asset Telematics
              │     ├── Vehicle Register (VIN, Engine No, Plate, Tracker ID, Odometer)
              │     ├── Live GPS Telemetry & Geofence Simulator (Randburg / Gauteng Routes)
              │     ├── Parts & Consumables Inventory (Helmets, Boxes, Brake Pads, Chains, Oil)
              │     ├── Maintenance, Repairs & 5,000 km Service Logs
              │     └── Traffic Fines & AARTO Infringement Manager (Driver Allocations)
              │
              └── [IV] Fleet Agreements & Financial Reconciliation
                    ├── Rent-to-Own & Pure Rental Product Matrices
                    ├── Legally Enforceable Rental Agreements & Printable Schedules
                    └── Yoco Payment Gateway & Bank Account Reconciliation Engine
```

---

## 🗺️ Page-by-Page & Section-by-Section Functional Specifications

### 1. Public Rider Portal

#### `Home Page` (`/`)
- **Hero & Brand Banner**: Professional presentation featuring Dynamic Rental's commercial bike fleet with high-contrast Randburg branding.
- **Weekly Rent-to-Own Showcase**:
  - **Bajaj Boxer 150 HD**: *The #1 Workhorse* (150cc 4-stroke, 2.2L/100km, dual rear suspension).
  - **Big Boy Velocity 150**: *Agile Commercial Frame* (150cc smooth single cylinder, quick acceleration).
  - **Dynamic E-Moto Pro**: *Zero Fuel Electric* (72V 45Ah swappable lithium, 120km range, 80% fuel cost savings).
  - **Hero Eco Hunter 150**: *Eco Durability* (Heavy-duty cargo rack, extended oil life).
- **Courier Take-Home Profit Calculator**:
  - Interactive sliders adjusting weekly delivery earnings (R2,000 to R7,000/week) vs weekly bike rental and fuel/charging costs.
  - Displays instant calculated **Net Weekly Take-Home Profit** and projected **Monthly Earnings**.
- **Transparent Pricing Matrix**:
  - **Brand New Bikes**: R750/week | R1,000 deposit | 15–18 month rent-to-own term.
  - **Pre-Owned Workhorses**: R650/week | R650 deposit | 20 month rent-to-own term.
- **Direct Showroom Location Card**: Address, Google Maps link, and operating hours.

#### `How Dynamic Rental Works` (`/about`)
- **4-Step Rider Journey**:
  1. *Apply Online in 2 Minutes* (Upload KYC docs & draw touch signature).
  2. *Instant Background & TRN Verification* (Dealership underwriting check).
  3. *Pay Deposit & Sign Contract* (Pay via Yoco card terminal or payment link).
  4. *Drive Away & Own Your Bike* (Fixed weekly payments leading to 100% vehicle ownership).
- **Comprehensive Requirements Guide**:
  - **South African Citizens**: SA Smart ID Card / Green Book + Code A/A1 Motorcycle License + Proof of Residence.
  - **Foreign Nationals**: Valid Passport + Work Permit / Asylum / Visa + Foreign Driver's License + **Mandatory Traffic Register Number (TRN Certificate)**.

#### `Apply Now (< 2 Min Flow)` (`/apply`)
- **Stage 1: Bike Selection & Term**: Choose preferred motorcycle and weekly rental duration.
- **Stage 2: Courier Profile**: Full Name, WhatsApp phone number, email, Gauteng residential address, delivery app experience (Checkers Sixty60, Uber Eats, Mr D, Bolt, Takealot).
- **Stage 3: Underwriting & Document Upload**: High-speed camera/device upload for ID/Passport, Motorcycle Driver's License, TRN Certificate, and Proof of Residence.
- **Stage 4: Digital Touch Signature**: Draw digital signature on touch screens or desktop mice.
- **Stage 5: Instant Reference & WhatsApp Handshake**: Generates unique application code (e.g. `DR-8294-JHB`) and launches a pre-filled WhatsApp message directly to the showroom team.

#### `Live Application Status Tracker` (`/status`)
- Drivers enter their application reference number or WhatsApp phone number to check their live vetting status.
- **Visual Progress Bar**:
  1. *Application Submitted*
  2. *Document Vetting & TRN Verification*
  3. *Approved for Collection & Contract Signing*
  4. *Handover & Key Collection*
- Displays pickup instructions, deposit amount payable, and showroom address.

#### `Contact Us` (`/contact`)
- WhatsApp hotline button, telephone lines, showroom email, and opening hours (Mon–Fri 08:00–17:00, Sat 08:30–13:00).

---

### 2. Admin & Dealership Fleet Portal

> **Secure Access**: Click **Staff Portal** on the header or footer and enter PIN: `dynamic2026`.

#### Section I: Dashboard, Applicants & Stock Master

##### 1. Executive Dashboard
- **Real-Time Fleet KPI Cards**:
  - *Total Fleet Size & Utilization Rate* (% of bikes on the road vs in stock).
  - *Active On-Road Drivers*.
  - *Weekly Projected Revenue* (ZAR).
  - *Arrears Rate & Total Overdue Balances*.
  - *Pending Applications Awaiting Underwriting*.
- **Pipeline Stage Breakdown**: Visual distribution of applicants across review stages.
- **Revenue & Collection Trends**: Weekly rent collection rates and Yoco transaction volume.

##### 2. Applicants Pipeline (Kanban & Master Table)
- **5-Stage Kanban Board**:
  1. ⏳ **Pending Review**: Newly submitted applications awaiting underwriting check.
  2. ⚠️ **Needs Info / Missing TRN**: Foreign license holders requiring Traffic Register certificates.
  3. ✅ **Approved for Collection**: Vetted applicants ready for showroom contract signing & bike collection.
  4. 🤝 **Contract Signed & Delivered**: Bike assigned, keys handed over (auto-converts into Active Driver).
  5. ❌ **Declined**: Failed KYC, fraudulent documents, or invalid licenses.
- **1-Click WhatsApp Automations**:
  - 📲 *WhatsApp Approval & Collection Notice* (Sends showroom address, deposit amount, and pickup hours).
  - ⚠️ *WhatsApp Missing TRN Notice* (Automated explanation of Traffic Register Certificate requirement).
  - 🤝 *WhatsApp Handover Confirmation* (Sends weekly payment schedule and Yoco payment instructions).
- **Zoomable Document Lightbox**: Inspect ID cards, passports, driver licenses, TRNs, and signatures at full resolution.
- **Walk-In Counter Intake Modal**: Add walk-in customers directly into the database from the showroom desk.
- **Printable Rent-to-Own Legal Agreement**: Automatically generate formal rent-to-own lease schedules for printing.

##### 3. Bikes & Stock Master
- **Catalog Management**: View and modify commercial motorcycle models.
- **Device Photo Upload**: Upload high-resolution motorcycle pictures directly from desktop or phone.
- **Pricing & Stock Controls**: Configure weekly rates, deposit amounts, engine capacities, and stock status (`In Stock`, `Out of Stock`, `Coming Soon`).

---

#### Section II: Driver Operations & Risk Registry

##### 1. Active Drivers Directory
- **Driver Profiles**: Full name, contact details, ID/Passport, citizenship, active delivery platforms.
- **Assigned Vehicle Details**: Registration plate, VIN, engine number, and motorcycle model.
- **Financial Balance Ledger**:
  - *Weekly Rate* (e.g. R650 or R750).
  - *Current Balance Due* (Overdue arrears in red, prepaid credits in green).
  - *Total Amount Paid to Date*.
  - *Remaining Contract Term*.
- **Status Controls**: `Active`, `In Arrears`, `Suspended`, `Contract Completed`, `Defaulted`.

##### 2. Driver Risk Registry & Safety Scoring
- **Automated Risk Scoring (0–100)**:
  - **Payment Reliability Score**: % of weekly payments received on time via Yoco.
  - **Traffic Infringement History**: Number of AARTO fines racked up.
  - **Telematics Violations**: Speeding incidents, unauthorized zone entry, and harsh braking events.
  - **Risk Tiers**: 🟢 *Low Risk* (80–100), 🟡 *Medium Risk* (60–79), 🟠 *High Risk* (40–59), 🔴 *Critical Risk* (<40).
- **Incident Logging**: Record accidents, minor scratches, missed check-ins, or customer disputes.

##### 3. Driver Referral Program
- **Referral Tracking**: Record existing drivers who refer new courier applicants.
- **Reward Lifecycle**: `Pending Onboarding` → `Active Driving (30 Days)` → `Bonus Eligible` → `Paid Out (R350)`.
- **Payout Controls**: Mark referral bonuses as paid or credit directly towards the driver's weekly rental balance.

---

#### Section III: Vehicle & Asset Telematics

##### 1. Vehicle Register (Asset Master)
- **Comprehensive Asset Metadata**:
  - Registration Number (e.g. `JH 49 XP GP`).
  - Vehicle Identification Number (VIN) & Engine Number.
  - Odometer Reading (KM) & Next Service Due (KM).
  - Tracker Device ID & Telematics Provider (Cartrack / Netstar / Tracker SA).
  - License Disk Expiry Date & Insurance Policy Number.
- **Asset Status**: `Available`, `Assigned to Driver`, `In Maintenance`, `Impounded`, `Decommissioned`.

##### 2. Live GPS Telemetry & Geofence Simulator
- **Live Location Tracking**: Real-time GPS coordinate mapping across Johannesburg and Gauteng delivery hubs (Randburg, Sandton, Rosebank, Midrand, Soweto, Centurion).
- **Sensor Telemetry**:
  - Ignition Status (`ON` / `OFF`).
  - Battery Health Voltage & Fuel Level %.
  - Current Speed & Over-Speed Alerts (> 80 km/h).
  - Geofence Status (`Inside Safe Operating Zone`, `Outside Gauteng Perimeter Alert`).

##### 3. Parts & Consumables Inventory
- **Stock Management**:
  - Delivery Hot/Cold Boxes (65L insulated).
  - DOT/ECE Certified Delivery Helmets.
  - Waterproof Vibration-Damped Phone Mounts.
  - Brake Pads & Shoes (Front/Rear).
  - Drive Chains & Sprocket Sets.
  - Heavy-Duty Tubeless Tires & Inner Tubes.
  - 4-Stroke 20W-50 / 10W-40 Motorcycle Engine Oil.
- **Low-Stock Alerting**: Automatic warning when stock falls below reorder thresholds (e.g. < 5 units).

##### 4. Maintenance, Repairs & Service History
- **5,000 km Scheduled Service Tracker**: Automatic reminder when an assigned motorcycle approaches its service interval.
- **Repair Logs**: Detailed records of routine oil changes, brake overhauls, accident repairs, and electrical fixes.
- **Workshop Management**: Garage location (Randburg 304 Tungsten Rd), technician name, parts used, cost in ZAR, and invoice upload.

##### 5. Traffic Fines & AARTO Infringement Manager
- **Fine Ledger**: Notice number, infringement date, location, issuing municipality (JMPD, EMPD, TMPD), and amount.
- **Driver Allocation & Nomination**: Automatically associate fine with the driver operating the bike on the infringement date.
- **AARTO Status**: `Notice Issued` → `Courtesy Letter` → `Enforcement Order` → `Paid / Transferred`.
- **Deduction Tracking**: Log whether fine was deducted from driver's weekly earnings or paid directly.

---

#### Section IV: Fleet Agreements & Financial Operations

##### 1. Vehicle Rental Options & Product Matrices
- **Rent-to-Own Structure**:
  - Fixed weekly rental with ownership transfer upon completion.
  - Built-in tracking device and scheduled servicing options.
- **Pure Commercial Rental**:
  - Flexible short-term rental for high-season courier demand (Black Friday, Festive Season).

##### 2. Rental & Sales Agreements
- **Contract Master**: Agreement Number, Driver Name, Vehicle Plate, Term Months, Weekly Rate, Deposit Paid, Start Date, End Date.
- **Digital Signatures**: Store cryptographic signature timestamps and images.
- **Contract Completion Handover**: Formal handover certificate transferring NATIS vehicle ownership once the 15/18/20 month term is fully paid.

##### 3. Bank Account & Yoco Reconciliation Engine
- Integrated dashboard reconciling card swipes, Yoco payment links, and direct bank EFT transfers against driver balance ledgers (see detailed guide below).

---

## 💳 Connecting Yoco to Verify & Track Driver Payments

Dynamic Rental utilizes **Yoco** (South Africa's premier payment gateway) to streamline weekly rent collections, security deposits, and fine settlements.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             YOCO PAYMENT RECONCILIATION                          │
└──────────────────────────────────────────────────────────────────────────────────┘
   [Showroom Terminal]        [WhatsApp Payment Link]      [Recurring Card Token]
   Card Tap / Insert          Sent Every Monday Morning    Auto-Charged Weekly
           │                             │                           │
           └─────────────────────────────┼───────────────────────────┘
                                         ▼
                               [Yoco Payment Engine]
                                         │
                         Webhook: payment.succeeded
                                         │
                                         ▼
                      [Dynamic Rental Backend Reconciliation]
                         • Matches Metadata: driver_id / ref_number
                         • Allocates: Weekly Rent / Deposit / Fine
                         • Updates Driver Balance: (balance_due - amount)
                         • Updates Payment Reliability Score (+1)
                         • Triggers WhatsApp Receipt to Driver
```

### 1. Yoco Payment Architecture
Yoco processes payments across 3 distinct channels:
1. **Showroom Point-of-Sale (Yoco Neo Touch / Khumo Terminals)**: In-person card swipes and chip/PIN taps for walk-in deposits and overdue rent settlements at the Randburg showroom.
2. **Dynamic WhatsApp Payment Links (Yoco Payment Links API)**: Automated payment links dispatched to drivers' WhatsApp numbers every Monday morning for contactless weekly settlement.
3. **Recurring Card Tokenization**: Securely storing driver card tokens during onboarding for automated weekly debiting.

### 2. Supported Payment Methods
- **Debit / Credit Cards**: Visa, Mastercard, American Express, SASSA / Postbank debit cards.
- **Digital Wallets**: Apple Pay, Google Pay, Samsung Pay.
- **Instant EFT via Yoco**: Direct account-to-account payments from Capitec, FNB, Standard Bank, Nedbank, Absa, and TymeBank.

---

### 3. Step-by-Step Yoco Integration Guide

#### Step 1: Obtain Yoco API Keys from Yoco Portal
1. Log in to the **[Yoco Business Portal](https://portal.yoco.com)**.
2. Navigate to **Integrations** → **API Keys**.
3. Copy your:
   - **Public Key** (`pk_live_...` or `pk_test_...`)
   - **Secret Key** (`sk_live_...` or `sk_test_...`)

#### Step 2: Configure Environment Variables
Add your keys to your `.env` file or deployment settings (Vercel / Cloud Run):

```env
# Yoco Payment Gateway Credentials
VITE_YOCO_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
YOCO_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
YOCO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Step 3: Create Webhook in Yoco Portal
1. In the Yoco Portal, go to **Integrations** → **Webhooks**.
2. Set the Webhook URL to your backend endpoint:
   `https://your-domain.com/api/webhooks/yoco`
3. Subscribe to the following events:
   - `payment.succeeded` (Payment completed successfully)
   - `payment.failed` (Card declined, insufficient funds)
   - `refund.succeeded` (Security deposit or adjustment refund)

#### Step 4: Generating Yoco Payment Links with Driver Metadata
When dispatching a payment link to a driver via WhatsApp or SMS, include the driver's unique ID and allocation type in the metadata:

```typescript
// Example: Creating a Yoco Payment Link with Metadata
const response = await fetch('https://payments.yoco.com/api/checkouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 75000, // Amount in cents (R750.00)
    currency: 'ZAR',
    redirectUrl: 'https://dynamicrental.co.za/status?ref=DR-7492-JHB',
    metadata: {
      driverId: 'drv-7492-jhb',
      driverName: 'Sipho Ndlovu',
      applicationRef: 'DR-7492-JHB',
      vehiclePlate: 'JH 49 XP GP',
      allocation: 'weekly_rental', // 'weekly_rental' | 'deposit' | 'traffic_fine'
      weekNumber: 38,
      year: 2026
    }
  }),
});

const data = await response.json();
const paymentUrl = data.redirectUrl; // Send to driver via WhatsApp
```

---

### 4. Automated Reconciliation & Balance Allocation Engine

When Yoco fires the `payment.succeeded` webhook, the system executes an automated 5-step reconciliation:

```typescript
// Webhook Handler Logic (Conceptual Flow)
export async function handleYocoWebhook(payload: any) {
  const { id: yocoChargeId, amount, status, metadata } = payload;
  
  if (status !== 'successful') return;

  const amountZar = amount / 100; // Convert cents to Rands (e.g. 75000 -> R750.00)
  const { driverId, allocation, vehiclePlate } = metadata;

  // 1. Record Transaction in yoco_transactions Table
  await supabase.from('yoco_transactions').insert({
    id: `tx_${Date.now()}`,
    yoco_charge_id: yocoChargeId,
    driver_id: driverId,
    driver_name: metadata.driverName,
    amount_zar: amountZar,
    currency: 'ZAR',
    payment_method: 'yoco_payment_link',
    allocation: allocation || 'weekly_rental',
    status: 'successful',
    yoco_fee_zar: amountZar * 0.0295, // 2.95% Yoco fee
    net_amount_zar: amountZar - (amountZar * 0.0295),
    reconciliation_status: 'reconciled',
    transaction_date: new Date().toISOString(),
    yoco_metadata: metadata
  });

  // 2. Fetch Driver & Update Balance
  const { data: driver } = await supabase.from('drivers').select('*').eq('id', driverId).single();
  if (driver) {
    const newBalance = driver.balance_due - amountZar;
    const newTotalPaid = (driver.total_paid || 0) + amountZar;
    
    // Calculate new on-time payment score
    const newPaymentScore = Math.min(100, (driver.payment_score || 90) + 2);

    await supabase.from('drivers').update({
      balance_due: newBalance,
      total_paid: newTotalPaid,
      payment_score: newPaymentScore,
      status: newBalance <= 0 ? 'active' : 'in_arrears',
      updated_at: new Date().toISOString()
    }).eq('id', driverId);
  }

  // 3. Dispatch Instant WhatsApp Receipt to Driver
  const message = `✅ *Payment Received - Dynamic Rental*\n\nHi ${metadata.driverName},\nWe have successfully received your payment of *R${amountZar.toFixed(2)}* for bike *${vehiclePlate}*.\n\nYour current account balance: *R${(driver.balance_due - amountZar).toFixed(2)}*.\nThank you for riding safely!`;
  // sendWhatsApp(driver.whatsapp_number, message);
}
```

---

### 5. Handling Arrears, Late Penalties & WhatsApp Reminders
- **Grace Period**: 48 hours from due date (Monday 00:00 to Tuesday 23:59).
- **Automated Late Reminder**: Dispatches automated WhatsApp payment link with customized payment notice on Wednesday if unpaid.
- **Tracker Immobilization Warning**: If payment is > 7 days overdue, the system flags the vehicle for remote GPS tracking lockdown.

---

## 🗄️ Complete Production Database Schema (PostgreSQL / Supabase)

Run the following SQL migration script in your **Supabase SQL Editor** to establish all 11 core tables, foreign key constraints, indexes, and Row Level Security (RLS) policies:

```sql
-- ============================================================================
-- DYNAMIC RENTAL - FULL FLEET MANAGEMENT & RECONCILIATION DATABASE SCHEMA
-- PostgreSQL / Supabase Migration (Production-Grade)
-- ============================================================================

-- 1. Applicants / Onboarding Intake Pipeline
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  ref_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_review',
  bike_id TEXT NOT NULL,
  bike_name TEXT NOT NULL,
  bike_condition TEXT NOT NULL,
  term_months INT NOT NULL,
  weekly_rate NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  citizenship TEXT NOT NULL,
  id_or_passport_number TEXT NOT NULL,
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  province TEXT DEFAULT 'Gauteng',
  postal_code TEXT,
  alternative_contact_name TEXT,
  alternative_contact_phone TEXT,
  primary_platform TEXT,
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  delivery_experience TEXT,
  approx_weekly_earnings NUMERIC,
  referred_by TEXT,
  credit_score TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  verification JSONB DEFAULT '{"idVerified":false,"licenseVerified":false}'::jsonb,
  signature_data_url TEXT,
  deposit_acknowledged BOOLEAN DEFAULT true,
  terms_agreed BOOLEAN DEFAULT true,
  collection_date TEXT,
  assigned_bike_vin_or_plate TEXT,
  admin_notes TEXT,
  timeline JSONB DEFAULT '[]'::jsonb
);

-- 2. Motorbike Catalog & Master Stock
CREATE TABLE IF NOT EXISTS public.bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_coming_soon BOOLEAN DEFAULT false,
  image TEXT,
  badge TEXT,
  fuel_type TEXT,
  engine_capacity TEXT,
  tank_capacity TEXT,
  range_per_charge TEXT,
  delivery_box_ready BOOLEAN DEFAULT true,
  pricing JSONB NOT NULL,
  key_features JSONB DEFAULT '[]'::jsonb,
  recommended_for TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Active Drivers & Risk Registry
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
  ref_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  id_or_passport_number TEXT NOT NULL,
  citizenship TEXT NOT NULL,
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'completed', 'in_arrears', 'defaulted'
  assigned_vehicle_id TEXT,
  assigned_bike_vin_or_plate TEXT,
  assigned_bike_name TEXT,
  weekly_rate NUMERIC NOT NULL DEFAULT 650,
  balance_due NUMERIC NOT NULL DEFAULT 0, -- positive = overdue, negative = prepaid
  deposit_paid NUMERIC NOT NULL DEFAULT 0,
  contract_start_date DATE DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  term_months INT DEFAULT 18,
  primary_platform TEXT,
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  risk_tier TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  risk_score INT DEFAULT 85, -- 0 to 100
  payment_score INT DEFAULT 95, -- percentage on-time
  incident_count INT DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  yoco_customer_token TEXT,
  referred_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vehicles & Asset Register
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  engine_number TEXT UNIQUE NOT NULL,
  registration_plate TEXT UNIQUE NOT NULL,
  bike_model_id TEXT REFERENCES public.bikes(id) ON DELETE RESTRICT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'new',
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'assigned', 'in_maintenance', 'impounded', 'retired'
  assigned_driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  assigned_driver_name TEXT,
  odometer_km INT NOT NULL DEFAULT 0,
  next_service_km INT NOT NULL DEFAULT 5000,
  last_service_date DATE,
  tracker_device_id TEXT,
  tracker_provider TEXT DEFAULT 'Cartrack SA',
  battery_health_percent INT DEFAULT 100,
  fuel_level_percent INT DEFAULT 100,
  is_ignition_on BOOLEAN DEFAULT false,
  latitude NUMERIC,
  longitude NUMERIC,
  last_location_address TEXT,
  last_ping_time TIMESTAMPTZ,
  insurance_policy_number TEXT,
  license_disk_expiry_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Parts & Consumables Inventory
CREATE TABLE IF NOT EXISTS public.parts_inventory (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'helmets', 'delivery_boxes', 'phone_mounts', 'brake_pads', 'chains_sprockets', 'tires_tubes', 'engine_oil'
  quantity_in_stock INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 5,
  cost_price_zar NUMERIC NOT NULL,
  selling_price_zar NUMERIC NOT NULL,
  compatible_models JSONB DEFAULT '[]'::jsonb,
  supplier_name TEXT,
  last_restocked_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Maintenance, Repairs & Service History
CREATE TABLE IF NOT EXISTS public.repairs_and_services (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  service_type TEXT NOT NULL, -- 'routine_5000km', 'major_overhaul', 'brake_replacement', 'tire_change', 'accident_repair'
  odometer_km INT NOT NULL,
  cost_zar NUMERIC NOT NULL,
  technician_name TEXT NOT NULL,
  garage_location TEXT DEFAULT 'Randburg Workshop - 304 Tungsten Rd',
  service_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  parts_used JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Traffic Fines & AARTO Infringements
CREATE TABLE IF NOT EXISTS public.traffic_fines (
  id TEXT PRIMARY KEY,
  notice_number TEXT UNIQUE NOT NULL,
  infringement_date DATE NOT NULL,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  location TEXT NOT NULL,
  municipality TEXT DEFAULT 'JMPD - City of Johannesburg',
  infringement_type TEXT NOT NULL,
  amount_zar NUMERIC NOT NULL,
  discounted_amount_zar NUMERIC,
  due_date DATE NOT NULL,
  aarto_status TEXT NOT NULL DEFAULT 'notice_issued', -- 'notice_issued', 'courtesy_letter', 'enforcement_order', 'paid', 'transferred_to_driver'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'allocated_to_driver', 'deducted_from_earnings', 'paid_by_company'
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Yoco Transactions & Bank Reconciliation
CREATE TABLE IF NOT EXISTS public.yoco_transactions (
  id TEXT PRIMARY KEY,
  yoco_charge_id TEXT UNIQUE NOT NULL,
  yoco_payment_link_id TEXT,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT NOT NULL,
  amount_zar NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  payment_method TEXT NOT NULL, -- 'yoco_card_terminal', 'yoco_payment_link', 'yoco_recurring_token', 'instant_eft'
  allocation TEXT NOT NULL DEFAULT 'weekly_rental', -- 'weekly_rental', 'security_deposit', 'traffic_fine', 'repair_deductible'
  status TEXT NOT NULL DEFAULT 'successful', -- 'successful', 'pending', 'failed', 'refunded'
  yoco_fee_zar NUMERIC DEFAULT 0,
  net_amount_zar NUMERIC NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'reconciled', -- 'reconciled', 'unallocated', 'disputed'
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  yoco_metadata JSONB DEFAULT '{}'::jsonb
);

-- 9. Rental & Sales Agreements
CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id TEXT PRIMARY KEY,
  agreement_number TEXT UNIQUE NOT NULL,
  driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_plate TEXT NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'rent_to_own',
  term_months INT NOT NULL DEFAULT 18,
  weekly_rate_zar NUMERIC NOT NULL,
  deposit_amount_zar NUMERIC NOT NULL,
  deposit_paid BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date DATE NOT NULL,
  actual_end_date DATE,
  total_contract_value_zar NUMERIC NOT NULL,
  total_paid_zar NUMERIC DEFAULT 0,
  remaining_balance_zar NUMERIC NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  signature_data_url TEXT,
  contract_pdf_url TEXT,
  terms_version TEXT DEFAULT 'v2026.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Driver Referral Program
CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id TEXT PRIMARY KEY,
  referrer_driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  referrer_driver_name TEXT NOT NULL,
  referred_applicant_name TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referral_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending_onboarding', -- 'pending_onboarding', 'active_driving', 'bonus_eligible', 'paid_out'
  reward_amount_zar NUMERIC NOT NULL DEFAULT 350,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Site Settings & Branding
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs_and_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yoco_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Read & Write Security Policies
CREATE POLICY "Allow read-write on applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on bikes" ON public.bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on parts_inventory" ON public.parts_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on repairs_and_services" ON public.repairs_and_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on traffic_fines" ON public.traffic_fines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on yoco_transactions" ON public.yoco_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on rental_agreements" ON public.rental_agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on driver_referrals" ON public.driver_referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle ON public.drivers(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(registration_plate);
CREATE INDEX IF NOT EXISTS idx_repairs_vehicle ON public.repairs_and_services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_driver ON public.traffic_fines(driver_id);
CREATE INDEX IF NOT EXISTS idx_yoco_tx_driver ON public.yoco_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_driver ON public.rental_agreements(driver_id);
```

---

## 🚀 Local Development & Deployment Guide

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Validate TypeScript & lint
npm run lint

# 4. Production build
npm run build
```

### Deploying to Vercel
1. Push repository to GitHub.
2. Import project into **[vercel.com](https://vercel.com)**.
3. Framework preset: **Vite** (Build: `npm run build`, Output: `dist`).
4. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_YOCO_PUBLIC_KEY`).
5. Click **Deploy**.

---

## 🏢 Showroom & Dealership Operations
- **Company**: Dynamic Rental (Pty) Ltd
- **Showroom & Logistics Center**: 304 Tungsten Road, Strijdom Park, Randburg, South Africa, 2169
- **Phone / WhatsApp**: +27 71 054 2015 (`071 054 2015`)
- **Operating Hours**:
  - Monday – Friday: 08:00 – 17:00
  - Saturday: 08:30 – 13:00
  - Sunday & Public Holidays: Closed (Emergency WhatsApp Available)
- **Staff Portal Access PIN**: `dynamic2026`
