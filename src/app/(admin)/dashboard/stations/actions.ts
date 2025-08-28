
"use server";

import { firestore } from "@/lib/firebase";
import type { StationData } from "@/lib/types";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";

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
      createdAt: serverTimestamp(),
    };
    
    await addDoc(collection(firestore, "stations"), stationData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error creating station:", error);
    // Devuelve un mensaje de error más específico para ayudar a depurar
    return { success: false, error: `Error de Firestore: ${error.message}` };
  }
}
