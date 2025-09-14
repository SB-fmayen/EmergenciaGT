
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

export type AlertStatus = 
  | 'new' 
  | 'assigned' 
  | 'en_route' 
  | 'on_scene'
  | 'attending'
  | 'transporting'
  | 'patient_attended'
  | 'resolved' 
  | 'cancelled';

export type AlertData = {
    id: string;
    userId: string;
    timestamp: Timestamp | Date | any; // Any para permitir serverTimestamp()
    location: GeoPoint;
    status: AlertStatus;
    type?: string; // Campo para el tipo de alerta (ej. 'Pánico', 'Incendio')
    isAnonymous?: boolean;
    cancellationReason?: string;
    assignedStationId?: string;
    assignedStationName?: string;
    assignedUnitId?: string;
    assignedUnitName?: string;
}

export type StationData = {
    id: string;
    name: string;
    address: string;
    location: GeoPoint;
    createdAt: Timestamp | Date | any;
}

export type UnitData = {
    id: string;
    nombre: string;
    tipo: "Ambulancia" | "etc...";
    disponible: boolean;
}

export type UserRole = 'admin' | 'operator' | 'unit' | 'citizen';

export type UserProfile = {
    uid: string;
    email: string;
    role: UserRole;
    createdAt: Timestamp | Date | any;
    lastLogin?: Timestamp | Date | any;
    stationId?: string;
};
