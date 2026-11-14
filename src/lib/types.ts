export const WORK_TYPES = [
  'mason',
  'helper',
  'plumber',
  'painter',
  'carpenter',
  'electrician',
  'other',
] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface WorkPhoto {
  id: string;
  takenAt: string;
  gps?: GeoPoint;
}

export interface Confirmation {
  confirmedAt: string;
  contractorName: string;
}

export interface WorkEntry {
  id: string;
  date: string;
  workType: WorkType;
  site: string;
  gps?: GeoPoint;
  contractorName: string;
  contractorPhone: string;
  wageAgreed: number;
  wagePaid: number;
  confirmation?: Confirmation;
  photo?: WorkPhoto;
  createdAt: string;
}

export interface Profile {
  name: string;
  phone: string;
}

export type EvidenceLevel = 'reported' | 'confirmed' | 'photo';
