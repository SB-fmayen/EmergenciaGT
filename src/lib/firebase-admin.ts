
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
let adminApp: App | undefined;

// Function to log debug info
const logDebugInfo = () => {
  console.log("--- Firebase Admin Debug ---");
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log("✔️ Variable FIREBASE_SERVICE_ACCOUNT_KEY encontrada.");
    try {
      // Intentamos ver los primeros 50 caracteres para no exponer la clave privada
      const partialCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 50);
      console.log("Contenido parcial:", partialCredentials + "...");
    } catch (e) {
      console.log("No se pudo mostrar el contenido parcial de la variable.");
    }
  } else {
    console.log("❌ Variable FIREBASE_SERVICE_ACCOUNT_KEY NO encontrada.");
    console.log("Asegúrate de que el archivo .env.local existe y la variable está definida.");
  }
  console.log("--------------------------");
};

if (getApps().length === 0) {
    logDebugInfo(); // Imprimimos la información de depuración
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
            adminApp = initializeApp({ credential: cert(serviceAccount) });
            console.log("✔️✔️ Firebase Admin SDK inicializado correctamente. ✔️✔️");
        } 
        else {
            // Este error ahora es más claro
            throw new Error("Credenciales de Firebase Admin no encontradas en la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY.");
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
