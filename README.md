# Dynamic Rental - Rent-to-Own Motorbikes Web Application 🏍️
**Randburg Showroom & Logistics Hub (304 Tungsten Road, Strijdom Park, Gauteng)**

> **"Ride Today. Own Tomorrow."**  
> Fast 2-minute rent-to-own motorbike applications for delivery riders (Checkers Sixty60, Uber Eats, Takealot, Mr D, Bolt) in Johannesburg & Gauteng. Eliminating WhatsApp paperwork chasing with instant digital verification.

---

## 🌟 Vision & Mission
Delivery drivers in Gauteng often face significant friction trying to acquire reliable motorbikes—getting lost in unstructured WhatsApp chats, manual paper forms, delayed document verification, and unclear deposit requirements.

**Dynamic Rental** digitizes the entire rent-to-own onboarding pipeline:
1. **Riders** select their bike (Brand New vs Pre-Owned, flexible 15/18/20-month terms), fill out their delivery profile, upload required verification documents (with built-in validation for South African ID vs Foreign Driver License & Traffic Register Number / TRN), sign digitally, and receive an instant reference code with a direct 1-click WhatsApp approval link.
2. **Dealership Managers** manage incoming applications from a single dashboard ("sorted and ready to approve"), inspect high-resolution documents in a zoomable lightbox, verify checklists, dispatch 1-click WhatsApp approvals or missing document notices, print legally formatted rent-to-own contracts, and manage bike inventory/stock in real time.
3. **Seamless Cloud & Local Architecture**: Powered by Supabase for real-time cloud data with automatic local persistence fallback.

---

## 📱 Page & Feature Guide

### 1. 🏍️ Bikes & Pricing (`/fleet` tab)
- **Fleet Showcase**: Browse the most popular commercial delivery bikes in Johannesburg:
  - **Bajaj Boxer 150 HD**: The #1 delivery workhorse (150cc, 550km fuel range, heavy-duty suspension).
  - **Big Boy Velocity 150 Delivery**: High agility, USB phone charger, commercial rack.
  - **Dynamic E-Delivery Moto Pro**: 100% electric with 60s battery swapping, saving couriers ~R1,800/month on petrol.
  - **Hero Eco Hunter 150**: Ultra-durable African road cruiser (Waitlist).
- **Interactive Courier Profitability Calculator**:
  - Sliders for gross weekly delivery earnings (e.g. R3,500 – R6,000/wk).
  - Calculates weekly bike installment (R650 or R750), estimated fuel/battery costs, and displays **Net Weekly Take-Home Earnings**.
- **1-Click "Apply for this Bike"**: Prefills the chosen model, condition (New vs Pre-Owned), and lease duration into the application form.

### 2. ⚡ Fast-Track 2-Minute Application (`/apply` tab)
- **Step 1: Bike & Lease Configuration**:
  - Switch between **Brand New** (R750/wk, R1,000 contract deposit, 15 or 18 month terms) and **Pre-Owned** (R650/wk, R650 deposit, 20 month term).
  - Live summary of weekly obligation, deposit due at contract signing, and path to 100% full ownership.
- **Step 2: Rider Details & Delivery Experience**:
  - Full Name, Phone, WhatsApp, Email, Suburb in Gauteng, Primary Delivery Platform (Checkers Sixty60, Uber Eats, Takealot, Mr D, Bolt), and approximate weekly earnings.
- **Step 3: Document Verification Checklist**:
  - **Nationality Selection**:
    - 🇿🇦 **South African Citizens**: Requires Smart ID Card (Front/Back) or Green ID Book + Motorcycle Driver's License (Code A / A1).
    - 🌍 **Foreign Nationals**: Requires Passport info page, Valid Work Permit / Asylum / Visa, Foreign Driver's License, and **Mandatory Traffic Register Number (TRN Certificate)** issued by the traffic department. Clear on-screen policy explanation prevents delays.
  - **Proof of Earnings**: Optional upload of delivery app payout screenshot for 1-hour expedited approval.
  - Interactive file dropzone and camera capture with live thumbnail preview.
- **Step 4: Agreement & Digital Touch Signature**:
  - Clear deposit policy reminder (deposit due upon contract signing at showroom before bike handover).
  - Interactive canvas touch signature pad (Draw, Clear, Undo).
- **Submission Confirmation**:
  - Unique reference number (e.g., `DR-9482-JHB`).
  - **1-Click WhatsApp Button** to send the dealership a pre-formatted message.
  - Direct links to track status or print agreement.

### 3. 🔍 Application Status Tracker (`/status` tab)
- Search by Application Reference Number or Phone Number.
- **Visual Progress Stepper**:
  1. Application Submitted
  2. Document Vetting & Background Check
  3. Approved for Collection & Contract Signing
  4. Handover & Key Collection
- Shows assigned showroom pickup location (**304 Tungsten Rd, Strijdom Park**), deposit amount payable at signing, and exact checklist of what original documents to bring on collection day.

### 4. 📍 Randburg Showroom & Collection Hub (`/location` tab)
- Full physical dealership details:
  - **Address**: 304 Tungsten Road, Strijdom Park, Randburg, 2169.
  - **Operating Hours**: Monday–Friday 08:00–17:00, Saturday 08:30–13:00.
  - **Google Maps Navigation**: 1-click link to route to the showroom.
  - **Direct Hotline**: +27 71 054 2015 / WhatsApp.
  - Collection Day Checklist for riders.

### 5. 🔐 Dealership Staff Portal (Admin & Stock Manager)
*Accessible from the footer login ("Dealership Staff Portal") using PIN: `dynamic2026`.*
- **Applications Pipeline**:
  - Filter by status (`Pending Review`, `Ready for Collection`, `Needs Info / Missing TRN`, `Contract Signed`).
  - Search by applicant name, reference code, phone number, or bike model.
  - Document Lightbox: Click any uploaded ID, TRN certificate, or work permit to inspect in full-resolution zoom.
  - Interactive verification checklist toggles.
  - **1-Click WhatsApp Actions**:
    - 📲 *Send Approval & Pickup Notice*: Pre-fills instant WhatsApp message with collection address and deposit terms.
    - ⚠️ *Request Missing TRN Notice*: Prompts foreign license holders to submit their official Traffic Register certificate.
  - **Printable Rent-to-Own Legal Agreement**: Formats a formal contract schedule with lessor/lessee details, payment schedule, and digital signatures for printing.
  - **Export to CSV**: 1-click download of all pipeline data.
- **Bike Inventory & Stock Manager**:
  - Add new motorbike models to the catalog.
  - Edit pricing (weekly rates, deposits, term options), specs (engine, fuel range), badges, and image URLs.
  - Toggle stock availability (`In Stock`, `Out of Stock`, `Coming Soon`).
  - Delete or archive discontinued bikes.
- **Supabase Cloud Sync Status & SQL Runner**:
  - Live indicator of Supabase database connection.
  - 1-Click "Copy SQL Schema" to initialize your Supabase PostgreSQL tables instantly.

---

## 🗄️ Backend & Supabase Database Setup

This app includes built-in support for **Supabase**. It automatically falls back to persistent local storage so the application works 100% out of the box, and syncs to Supabase as soon as credentials are provided!

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Navigate to **Project Settings -> API** and copy:
   - **Project URL**
   - **anon / public key**

### Step 2: Set Environment Variables
In your project's `.env` file (or Google AI Studio settings):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Step 3: Run Database Migration in Supabase SQL Editor
Navigate to the **SQL Editor** in your Supabase dashboard, paste the following SQL, and click **Run**:

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

## 🚀 How to Load & Push to GitHub

To push this codebase to your own GitHub account:

### Option A: Export via AI Studio / Download ZIP
1. In Google AI Studio, click the **Settings / Export** icon in the top navigation bar.
2. Select **Export to GitHub** or **Download ZIP**.
3. If downloading ZIP:
   ```bash
   unzip dynamic-rental.zip
   cd dynamic-rental
   git init
   git add .
   git commit -m "Initial commit: Dynamic Rental Rent-to-Own Web App"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dynamic-rental.git
   git push -u origin main
   ```

### Option B: Push directly using Git CLI
```bash
# Verify status
git status

# Add all files
git add .

# Commit changes
git commit -m "feat: Dynamic Rental Web App with Supabase backend and inventory management"

# Add your GitHub repository remote
git remote add origin https://github.com/YOUR_USERNAME/dynamic-rental.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🛠️ Local Development & Scripts

```bash
# Install dependencies
npm install

# Start local development server (binds to http://localhost:3000)
npm run dev

# Lint & type check
npm run lint

# Production build
npm run build
```

---

## 🏢 Dealership Contact & Details
- **Company**: Dynamic Rental (Pty) Ltd
- **Showroom Address**: 304 Tungsten Road, Strijdom Park, Randburg, South Africa, 2169
- **Phone / WhatsApp**: +27 71 054 2015 (`071 054 2015`)
- **Hours**: Mon – Fri (08:00 – 17:00), Sat (08:30 – 13:00)
- **Tagline**: *Ride Today. Own Tomorrow.*
