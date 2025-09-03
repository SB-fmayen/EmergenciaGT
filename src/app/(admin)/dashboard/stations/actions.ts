
"use server";

import { revalidatePath } from "next/cache";
import { firestore } from "@/lib/firebase-admin"; // Usar el SDK de Admin
import type { StationData, UnitData } from "@/lib/types";
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
    
    // Crear la estación
    await firestore.collection("stations").add(stationData);

    revalidatePath("/dashboard/stations"); // Actualiza la vista
    return { success: true };
  } catch (error: any) {
    console.error("Error creating station (admin action):", error);
    return { success: false, error: `Error de Servidor/Firestore: ${error.message}` };
  }
}

export async function updateStation(stationId: string, formData: FormData) {
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
        return { success: false, error: "Latitud y longitud deben ser números válidos." };
    }

    try {
        const stationRef = firestore.collection("stations").doc(stationId);
        await stationRef.update({
            name,
            address,
            location: new GeoPoint(latitude, longitude),
        });
        
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating station ${stationId}:`, error);
        return { success: false, error: "No se pudo actualizar la estación." };
    }
}


export async function deleteStation(stationId: string) {
    try {
        const unitsSnapshot = await firestore.collection("stations").doc(stationId).collection("unidades").get();
        const batch = firestore.batch();
        unitsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await firestore.collection("stations").doc(stationId).delete();
        
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting station ${stationId}:`, error);
        return { success: false, error: "No se pudo eliminar la estación y sus unidades." };
    }
}


// --- Acciones para Unidades ---

export async function createUnit(stationId: string, formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const tipo = formData.get("tipo") as string;

    if (!nombre || !tipo) {
        return { success: false, error: "El nombre y el tipo son requeridos." };
    }

    try {
        const newUnit: Omit<UnitData, 'id'> = {
            nombre,
            tipo: tipo as UnitData['tipo'],
            disponible: true,
        };
        await firestore.collection("stations").doc(stationId).collection("unidades").add(newUnit);
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: `Error creando la unidad: ${error.message}` };
    }
}

export async function updateUnit(stationId: string, unitId: string, formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const tipo = formData.get("tipo") as string;

    if (!nombre || !tipo) {
        return { success: false, error: "El nombre y el tipo son requeridos." };
    }

    try {
        await firestore.collection("stations").doc(stationId).collection("unidades").doc(unitId).update({
            nombre,
            tipo,
        });
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: `Error actualizando la unidad: ${error.message}` };
    }
}

export async function deleteUnit(stationId: string, unitId: string) {
    try {
        await firestore.collection("stations").doc(stationId).collection("unidades").doc(unitId).delete();
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: `Error eliminando la unidad: ${error.message}` };
    }
}
