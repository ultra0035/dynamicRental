// Static Branding Configuration
// You can set these directly, or place 'logo.png' / 'hero.jpg' in the /public folder,
// or upload them via the Admin Portal > Branding & Assets tab.

export interface StaticBrandingConfig {
  logoUrl: string;
  heroImageUrl: string;
  companyName: string;
  heroTagline: string;
  heroSubtitle: string;
}

export const STATIC_BRANDING: StaticBrandingConfig = {
  // If you add logo.png or hero.jpg to /public, they will be loaded automatically:
  logoUrl: '/logo.png',
  heroImageUrl: '/hero.jpg',
  companyName: 'DYNAMIC RENTAL',
  heroTagline: 'RIDE TODAY. OWN TOMORROW.',
  heroSubtitle: 'Rent-to-own delivery motorbikes with transparent weekly payments for Sixty60, Uber Eats, Takealot & Mr D couriers. Deposit payable on collection.',
};
