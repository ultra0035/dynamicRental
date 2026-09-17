import { RiderApplication } from '../types';

// Initial state for live production is an empty array.
// Applications will be loaded directly from Supabase / database and online/walk-in submissions.
export const INITIAL_APPLICATIONS: RiderApplication[] = [];
