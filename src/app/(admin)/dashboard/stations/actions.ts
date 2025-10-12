
"use server";

import { revalidatePath } from "next/cache";
import { firestore } from "@/lib/firebase-admin"; // Usar el SDK de Admin para operaciones de backend
import type { StationData, UnitData } from "@/lib/types";
import { GeoPoint, Timestamp } from "firebase-admin/firestore";

/**
 * Intenta resolver una URL de Google Maps (corta o larga) a sus coordenadas.
 * @param {string} url - La URL de Google Maps.
 * @returns {Promise<{latitude: number, longitude: number} | null>} - Un objeto con latitud y longitud, o null si no se puede resolver.
 */
async function resolveMapLink(url: string): Promise<{latitude: number, longitude: number} | null> {
    if (!url) return null;

    // Primero, intenta extraer de una URL larga directamente.
    const longUrlMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (longUrlMatch) {
        return { latitude: parseFloat(longUrlMatch[1]), longitude: parseFloat(longUrlMatch[2]) };
    }

    // Si es una URL corta, intenta seguir la redirección.
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
        const locationHeader = response.headers.get('location');

        if (response.status >= 300 && response.status < 400 && locationHeader) {
            const finalUrl = locationHeader;
            const finalMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (finalMatch) {
                return { latitude: parseFloat(finalMatch[1]), longitude: parseFloat(finalMatch[2]) };
            }
        }
        return null;
    } catch (error) {
        console.error("Error resolving Google Maps link:", error);
        return null;
    }
}


/**
 * Server Action para crear una nueva estación en Firestore.
 * @param {FormData} formData - Datos del formulario con la información de la estación.
 * @returns {Promise<{success: boolean, error?: string}>} - Objeto con el resultado de la operación.
 */
export async function createStation(formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const latitudeStr = formData.get("latitude") as string;
  const longitudeStr = formData.get("longitude") as string;
  const mapLink = formData.get("mapLink") as string;

  // Validación básica de campos.
  if (!name || !address) {
    return { success: false, error: "El nombre y la dirección son requeridos." };
  }

  let latitude = parseFloat(latitudeStr);
  let longitude = parseFloat(longitudeStr);

  // Si no se proveyeron coordenadas, intenta resolverlas desde el link
  if ((isNaN(latitude) || isNaN(longitude)) && mapLink) {
      const coords = await resolveMapLink(mapLink);
      if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
      }
  }

  // Si después de todo, las coordenadas no son válidas, devuelve un error.
  if (isNaN(latitude) || isNaN(longitude)) {
    return { success: false, error: "Las coordenadas no son válidas. Proporciona latitud/longitud o un enlace de Google Maps válido." };
  }

  try {
    const stationData: Omit<StationData, 'id'> = {
      name,
      address,
      location: new GeoPoint(latitude, longitude),
      createdAt: Timestamp.now(),
    };
    
    // Añade el nuevo documento a la colección "stations".
    await firestore.collection("stations").add(stationData);

    // Invalida el caché de la ruta para que Next.js la vuelva a renderizar con los datos actualizados.
    revalidatePath("/dashboard/stations"); 
    return { success: true };
  } catch (error: any) {
    console.error("Error creating station (admin action):", error);
    return { success: false, error: `Error de Servidor/Firestore: ${error.message}` };
  }
}

/**
 * Server Action para actualizar una estación existente en Firestore.
 * @param {string} stationId - ID del documento de la estación a actualizar.
 * @param {FormData} formData - Datos del formulario con la nueva información.
 * @returns {Promise<{success: boolean, error?: string}>} - Objeto con el resultado de la operación.
 */
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
        // Actualiza los campos especificados del documento.
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

/**
 * Server Action para eliminar una estación y todas sus unidades asociadas.
 * @param {string} stationId - ID de la estación a eliminar.
 * @returns {Promise<{success: boolean, error?: string}>} - Objeto con el resultado.
 */
export async function deleteStation(stationId: string) {
    try {
        // Primero, elimina todas las unidades en la subcolección para evitar documentos huérfanos.
        const unitsSnapshot = await firestore.collection("stations").doc(stationId).collection("unidades").get();
        const batch = firestore.batch(); // Usa un batch para eliminar múltiples documentos en una sola operación atómica.
        unitsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Luego, elimina el documento de la estación principal.
        await firestore.collection("stations").doc(stationId).delete();
        
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting station ${stationId}:`, error);
        return { success: false, error: "No se pudo eliminar la estación y sus unidades." };
    }
}


// --- Acciones para Unidades ---

/**
 * Server Action para crear una nueva unidad dentro de una estación.
 * @param {string} stationId - ID de la estación a la que pertenece la unidad.
 * @param {FormData} formData - Datos del formulario con la información de la unidad.
 * @returns {Promise<{success: boolean, error?: string}>} - Resultado de la operación.
 */
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
            disponible: true, // Por defecto, una nueva unidad está disponible.
        };
        // Añade la nueva unidad a la subcolección "unidades" de la estación correspondiente.
        await firestore.collection("stations").doc(stationId).collection("unidades").add(newUnit);
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: `Error creando la unidad: ${error.message}` };
    }
}

/**
 * Server Action para actualizar una unidad existente.
 * @param {string} stationId - ID de la estación.
 * @param {string} unitId - ID de la unidad a actualizar.
 * @param {FormData} formData - Nuevos datos para la unidad.
 * @returns {Promise<{success: boolean, error?: string}>} - Resultado.
 */
export async function updateUnit(stationId: string, unitId: string, formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const tipo = formData.get("tipo") as string;

    if (!nombre || !tipo) {
        return { success: false, error: "El nombre y el tipo son requeridos." };
    }

    try {
        // Actualiza el documento de la unidad en la subcolección.
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

/**
 * Server Action para eliminar una unidad de una estación.
 * @param {string} stationId - ID de la estación.
 * @param {string} unitId - ID de la unidad a eliminar.
 * @returns {Promise<{success: boolean, error?: string}>} - Resultado.
 */
export async function deleteUnit(stationId: string, unitId: string) {
    try {
        await firestore.collection("stations").doc(stationId).collection("unidades").doc(unitId).delete();
        revalidatePath("/dashboard/stations");
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting unit ${unitId} from station ${stationId}:`, error);
        return { success: false, error: `Error eliminando la unidad: ${error.message}` };
    }
}
