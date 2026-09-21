import { Bike } from '../types';

// Showroom & Dealership Motorbike Inventory
// Clean initial state - all data is loaded exclusively from your Supabase/PostgreSQL database or added via the Admin Portal.
export const BIKES: Bike[] = [];

export const COMPANY_DETAILS = {
  name: 'Dynamic Rental',
  legalName: 'Dynamic Rental (Pty) Ltd',
  tagline: 'Ride Today. Own Tomorrow.',
  subTagline: 'Rent-to-own motorbikes with flexible payment options in Randburg',
  address: '304 Tungsten Road, Strijdom Park, Randburg, South Africa, 2169',
  phone: '+27 71 054 2015',
  phoneDisplay: '071 054 2015',
  whatsappNumber: '+27 71 054 2015',
  whatsappDirectUrl: 'https://wa.me/27710542015',
  hours: 'Mon - Fri: 08:00 - 17:00 | Sat: 08:30 - 13:00 | Sun: Closed',
  googleMapsUrl: 'https://maps.google.com/?q=304+Tungsten+Road+Strijdom+Park+Randburg+South+Africa+2169',
  email: 'info@dynamicrental.co.za',
  bankName: 'Standard Bank',
  bankAccountNumber: '023456789',
  bankBranchCode: '051001',
};
