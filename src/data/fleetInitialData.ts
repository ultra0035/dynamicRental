import { 
  Driver, 
  Vehicle, 
  PartsInventoryItem, 
  RepairAndService, 
  TrafficFine, 
  YocoTransaction, 
  RentalAgreement, 
  DriverReferral 
} from '../types';

// Empty default collections - UI reflects live database content directly
export const INITIAL_VEHICLES: Vehicle[] = [];
export const INITIAL_DRIVERS: Driver[] = [];
export const INITIAL_PARTS: PartsInventoryItem[] = [];
export const INITIAL_SERVICES: RepairAndService[] = [];
export const INITIAL_FINES: TrafficFine[] = [];
export const INITIAL_YOCO_TRANSACTIONS: YocoTransaction[] = [];
export const INITIAL_AGREEMENTS: RentalAgreement[] = [];
export const INITIAL_REFERRALS: DriverReferral[] = [];
