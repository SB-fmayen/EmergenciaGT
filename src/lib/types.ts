
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

export type AlertStatus = 'new' | 'dispatched' | 'resolved' | 'cancelled';

export type AlertData = {
    id: string;
    userId: string;
    timestamp: Timestamp | Date | any; // Any para permitir serverTimestamp()
    location: GeoPoint;
    status: AlertStatus;
}
