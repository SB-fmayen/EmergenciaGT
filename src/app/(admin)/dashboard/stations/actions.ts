
"use server";

import { firestore } from "@/lib/firebase";
import type { StationData } from "@/lib/types";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function createStation(formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
    return { success: false, error: "Todos los campos son requeridos." };
  }

  try {
    const stationData: Omit<StationData, 'id'> = {
      name,
      address,
      location: new GeoPoint(latitude, longitude),
      createdAt: serverTimestamp(),
    };
    
    await addDoc(collection(firestore, "stations"), stationData);
    
    revalidatePath("/dashboard/stations"); // Actualiza la cache para que se muestre la nueva estación
    return { success: true };
  } catch (error) {
    console.error("Error creating station:", error);
    return { success: false, error: "No se pudo crear la estación." };
  }
}

    