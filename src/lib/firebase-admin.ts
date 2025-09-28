
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
let adminApp: App | undefined;

// Function to log debug info
const logDebugInfo = () => {
  console.log("--- Firebase Admin Debug ---");
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    console.log("✔️ Variable FIREBASE_ADMIN_CREDENTIALS encontrada.");
    try {
      // Intentamos ver los primeros 50 caracteres para no exponer la clave privada
      const partialCredentials = process.env.FIREBASE_ADMIN_CREDENTIALS.substring(0, 50);
      console.log("Contenido parcial:", partialCredentials + "...");
    } catch (e) {
      console.log("No se pudo mostrar el contenido parcial de la variable.");
    }
  } else {
    console.log("❌ Variable FIREBASE_ADMIN_CREDENTIALS NO encontrada.");
    console.log("Asegúrate de que el archivo .env.local existe y la variable está definida.");
  }
  console.log("--------------------------");
};

if (getApps().length === 0) {
    logDebugInfo(); // Imprimimos la información de depuración
    try {
        // CORREGIDO: Usamos la variable de entorno correcta
        if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS) as ServiceAccount;
            adminApp = initializeApp({ credential: cert(serviceAccount) });
            console.log("✔️✔️ Firebase Admin SDK inicializado correctamente. ✔️✔️");
        } 
        else {
            // Este error ahora es más claro
            throw new Error("Credenciales de Firebase Admin no encontradas en la variable de entorno FIREBASE_ADMIN_CREDENTIALS.");
        }
    } catch (e: any) {
        // Este mensaje te dirá si el JSON es inválido
        console.error("❌ ERROR al inicializar Firebase Admin:", e.message);
    }
} else {
    adminApp = getApps()[0];
}

const checkAdminApp = (): App => {
    if (!adminApp) {
        // Este es el error que veías en el navegador
        throw new Error("Firebase Admin SDK no está inicializado. Verifica las credenciales del servidor y los logs de la consola de la terminal.");
    }
    return adminApp;
}

const auth = getAuth(checkAdminApp());
const firestore = getFirestore(checkAdminApp());

export { auth, firestore };
