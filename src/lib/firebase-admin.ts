
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
let adminApp: App;
if (!getApps().length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
            adminApp = initializeApp({ credential: cert(serviceAccount) });
        } 
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            adminApp = initializeApp();
        }
        else {
            throw new Error("Firebase Admin SDK credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.");
        }
    } catch (e: any) {
        console.error("Firebase Admin Init Error:", e.message);
    }
} else {
    adminApp = getApps()[0];
}

const checkAdminApp = () => {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK no está inicializado. Verifica las credenciales del servidor.");
    }
    return adminApp;
}

const auth = getAuth(checkAdminApp());
const firestore = getFirestore(checkAdminApp());

export { auth, firestore };
