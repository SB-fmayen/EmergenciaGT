
import type { Timestamp, GeoPoint } from "firebase/firestore";

export type EmergencyContact = {
  name: string;
  phone: string;
  relation: string;
};

export type MedicalData = {
  fullName: string;
  age: string;
  bloodType: string;
  emergencyContacts: EmergencyContact[];
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
    isAnonymous?: boolean;
    cancellationReason?: string;
}
