
"use server";

import { firestore } from "@/lib/firebase-admin"; // Usar el SDK de Admin
import type { StationData } from "@/lib/types";
import { GeoPoint, Timestamp } from "firebase-admin/firestore";

export async function createStation(formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const latitudeStr = formData.get("latitude") as string;
  const longitudeStr = formData.get("longitude") as string;

  if (!name || !address || !latitudeStr || !longitudeStr) {
    return { success: false, error: "Todos los campos son requeridos." };
  }

  const latitude = parseFloat(latitudeStr);
  const longitude = parseFloat(longitudeStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    return { success: false, error: "La latitud y longitud deben ser números válidos." };
  }

  try {
    const stationData: Omit<StationData, 'id'> = {
      name,
      address,
      location: new GeoPoint(latitude, longitude),
      createdAt: Timestamp.now(),
    };
    
    // La escritura se realiza con privilegios de administrador desde el backend
    await firestore.collection("stations").add(stationData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error creating station (admin action):", error);
    return { success: false, error: `Error de Servidor/Firestore: ${error.message}` };
  }
}
