export type MedicalData = {
  name: string;
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
