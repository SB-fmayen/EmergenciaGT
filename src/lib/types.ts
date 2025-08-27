
import type { Timestamp, GeoPoint } from "firebase/firestore";

export type MedicalData = {
  fullName: string;
  age: string;
  bloodType: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  conditions: string[];
  otherConditions: string;
  medications: { name: string }[];
  additionalNotes: string;
};

export type AlertData = {
    id: string;
    userId: string;
    timestamp: Timestamp | any; // any for serverTimestamp
    location: GeoPoint | { latitude: number, longitude: number } | null;
    status: 'new' | 'dispatched' | 'resolved';
}
