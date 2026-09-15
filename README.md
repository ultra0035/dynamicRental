# Dynamic Rental - Rent-to-Own Motorbikes Web Application 🏍️
**Randburg Showroom & Logistics Hub (304 Tungsten Road, Strijdom Park, Gauteng)**

> **"Ride Today. Own Tomorrow."**  
> Fast 2-minute rent-to-own motorbike applications for delivery riders (Checkers Sixty60, Uber Eats, Takealot, Mr D, Bolt) in Johannesburg & Gauteng. Eliminating WhatsApp paperwork chasing with instant digital verification and seamless underwriting pipeline management.

---

## 🌟 What's New & Core Platform Features

### 1. 🏁 Clean High-Impact Navigation Header
- **Streamlined Navigation Tabs**: `HOME`, `HOW DYNAMIC RENTAL WORKS` (About), `CONTACT US TODAY`, and the focused call-to-action **`-- APPLY NOW <2MIN --`**.
- **Static & Tamper-Proof Branding**: Clean, permanent brand logo and hero presentation for public visitors. All branding adjustments are safeguarded inside the staff portal.

### 2. 🏍️ Home Page Fleet & Pricing Showcase
- **Hero Showcase**: Displays Johannesburg's leading commercial delivery bikes (Bajaj Boxer 150 HD, Big Boy Velocity 150 Delivery, Dynamic E-Moto Pro, and Hero Eco Hunter 150).
- **Weekly Rent-to-Own Rates**: Transparent terms for **Brand New** (R750/wk, R1,000 deposit, 15/18 months) and **Pre-Owned** (R650/wk, R650 deposit, 20 months).
- **Courier Take-Home Profit Calculator**: Live interactive sliders for gross courier earnings vs weekly bike cost and fuel/battery, calculating true net weekly income.

### 3. ⚡ 2-Minute Digital Application Flow (`/apply`)
- **Rider Profile**: Personal details, Gauteng suburb, and delivery platform selection.
- **Underwriting & Document Upload**:
  - 🇿🇦 **South African Citizens**: Smart ID Card or Green ID Book + Motorcycle Driver's License (Code A/A1).
  - 🌍 **Foreign Nationals**: Passport + Work Permit / Asylum / Visa + Foreign Driver's License + **Mandatory Traffic Register Number (TRN Certificate)**.
- **Digital Touch Signature**: Draw signature directly on mobile/desktop touchpads before submitting.
- **Instant Reference Code & WhatsApp Handshake**: Generates an application code (e.g. `DR-6967-JHB`) with a 1-click WhatsApp message to the dealership.

### 4. 🔍 Live Application Status Tracker (`/status`)
- Drivers can track their progress through 4 visual stages:
  1. Application Submitted
  2. Document Vetting & Background Check
  3. Approved for Collection & Contract Signing
  4. Handover & Key Collection
- Outlines collection requirements, deposit payable, and the exact showroom address.

### 5. 🔐 Dealership Staff Portal (`PIN: dynamic2026`)
- **Modern Left Sidebar Navigation**:
  - Dedicated pages: **Dashboard** (KPI stats & stage breakdown), **Applicants** (5-Stage Kanban & Inspector), **Bikes & Stock** (Inventory manager with device upload), **Branding & Assets** (Logo & Hero live upload), **Supabase Cloud** (DB connection & SQL runner), and **Exit Staff Mode**.
  - Top website header and public widgets are automatically hidden in admin mode for a distraction-free back-office experience.

- **5-Stage Driver Pipeline Tracking**:
  - **Dual View Modes**: Switch between **Pipeline Kanban Board** and **Master List & Inspector**.
  - **Pipeline Stages**:
    1. ⏳ `Pending Review` (Awaiting background vetting)
    2. ⚠️ `Needs Info / Missing TRN` (Foreign license holders missing TRN certificate)
    3. ✅ `Approved for Collection` (Ready for showroom signing & bike pickup)
    4. 🤝 `Contract Signed & Delivered` (Handover completed and active)
    5. ❌ `Declined`
  - **1-Click Quick Move**: Move drivers instantly between stages with dedicated buttons on Kanban cards and inspector steppers.
  - **Automated WhatsApp Dispatches**:
    - 📲 *WhatsApp Approval & Collection Notice*: Sends pickup address, deposit amount, and hours to driver.
    - ⚠️ *WhatsApp Missing TRN Notice*: Direct message explaining the Traffic Register Number requirement.
    - 🤝 *WhatsApp Handover Confirmation*: Sends welcome and weekly payment schedule.
  - **Zoomable Document Lightbox**: High-resolution viewer for inspecting IDs, passports, work permits, and TRN certificates.
  - **Printable Rent-to-Own Legal Agreement**: Generates formal contract schedules with lessor/lessee details and signatures.
  - **CSV Export**: 1-click export of the entire database.

- **Motorbike Inventory & Device File Upload**:
  - Add or edit motorbikes in the catalog.
  - **Upload Bike Photos from Device**: Choose image files (PNG, JPG, WEBP) directly from your computer or phone with instant live preview.
  - Configure weekly rates, deposits, engine capacities, and stock availability (`In Stock`, `Out of Stock`).

### 6. 🖼️ Custom Logo & Hero Image Setup (3 Easy Ways)

You can provide your logo and hero banner using any of these methods without any default images overriding them:

- **Method 1: Add to GitHub `/public/` Folder (Recommended for Permanent Deployment)**:
  - Place your official logo file as `public/logo.png`
  - Place your hero banner photo as `public/hero.jpg`
  - When deployed to Vercel or run locally, the website will automatically display your static images across all devices and visitors.

- **Method 2: Upload via Admin Portal (`Branding & Assets` Tab)**:
  - Open the Staff Portal (PIN: `dynamic2026`) and click **Branding & Assets**.
  - Click **Upload Logo from Device** or **Upload Hero Image from Device**.
  - Images are automatically optimized and saved to both local storage and your connected Supabase database.

- **Method 3: Configure via Code (`/src/config/branding.ts`)**:
  - Open `/src/config/branding.ts` to set direct URLs or paths for `logoUrl` and `heroImageUrl`.

---

## 🗄️ Supabase Cloud Database Setup

### Step 1: Set Environment Variables
In your `.env` file or deployment settings:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Step 2: Run Database Migration in Supabase SQL Editor
```sql
-- 1. Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  ref_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_review',
  bike_id TEXT NOT NULL,
  bike_name TEXT NOT NULL,
  bike_condition TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  weekly_rate NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT NOT NULL,
  citizenship TEXT NOT NULL,
  id_or_passport_number TEXT NOT NULL,
  nationality_country TEXT,
  address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  city TEXT DEFAULT 'Randburg / Johannesburg',
  postal_code TEXT,
  primary_platform TEXT NOT NULL,
  delivery_experience TEXT NOT NULL,
  approx_weekly_earnings NUMERIC DEFAULT 0,
  documents JSONB DEFAULT '{}'::jsonb,
  verification JSONB DEFAULT '{"idVerified":false,"licenseVerified":false}'::jsonb,
  signature_data_url TEXT,
  deposit_acknowledged BOOLEAN DEFAULT FALSE,
  terms_agreed BOOLEAN DEFAULT FALSE,
  collection_date TEXT,
  assigned_bike_vin_or_plate TEXT,
  admin_notes TEXT,
  timeline JSONB DEFAULT '[]'::jsonb
);

-- 2. Create bikes inventory table
CREATE TABLE IF NOT EXISTS public.bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_coming_soon BOOLEAN DEFAULT FALSE,
  image TEXT NOT NULL,
  badge TEXT,
  fuel_type TEXT NOT NULL,
  engine_capacity TEXT NOT NULL,
  tank_capacity TEXT,
  range_per_charge TEXT,
  delivery_box_ready BOOLEAN DEFAULT TRUE,
  pricing JSONB NOT NULL,
  key_features JSONB DEFAULT '[]'::jsonb,
  recommended_for TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security & Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on applications" ON public.applications FOR UPDATE USING (true);

CREATE POLICY "Allow public read on bikes" ON public.bikes FOR SELECT USING (true);
CREATE POLICY "Allow public write on bikes" ON public.bikes FOR ALL USING (true);
```

---

## 🚀 Deploying to Vercel

1. Push your code to GitHub.
2. Open **[vercel.com/new](https://vercel.com/new)** and import your repository.
3. Framework preset is automatically detected as **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. *(Optional)* Add Supabase environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Click **Deploy** to go live in under 1 minute.

---

## 🛠️ Local Development & Scripts

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint codebase
npm run lint

# Production build
npm run build
```

---

## 🏢 Dealership Details & Physical Showroom
- **Company**: Dynamic Rental (Pty) Ltd
- **Showroom Address**: 304 Tungsten Road, Strijdom Park, Randburg, South Africa, 2169
- **Direct Phone / WhatsApp**: +27 71 054 2015 (`071 054 2015`)
- **Operating Hours**: Mon – Fri (08:00 – 17:00), Sat (08:30 – 13:00)
- **Staff Access PIN**: `dynamic2026`
- **Tagline**: *Ride Today. Own Tomorrow.*
