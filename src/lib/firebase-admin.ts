
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

let adminApp: App;

// This function ensures the Admin App is initialized, but only once.
function initializeAdminApp(): App {
    // If the app is already initialized, return it.
    const existingApps = getApps();
    if (existingApps.length > 0) {
        return existingApps[0];
    }

    // Try to get credentials from environment variables.
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    try {
        if (serviceAccountKey) {
            // FIX: The JSON string from the .env file might be malformed or contain escaped newlines.
            // This will parse it robustly.
            const parsedKey = serviceAccountKey.startsWith('{') 
                ? JSON.parse(serviceAccountKey)
                : JSON.parse(`"${serviceAccountKey}"`);

            const serviceAccount = typeof parsedKey === 'string' ? JSON.parse(parsedKey) : parsedKey;

            return initializeApp({ credential: cert(serviceAccount) });
        } else if (googleAppCreds) {
            // This is for deployments (e.g., Cloud Run) where credentials are automatically provided.
            return initializeApp();
        } else {
            // If neither is found, we throw a clear error.
            throw new Error("CRITICAL: Firebase Admin credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local file or GOOGLE_APPLICATION_CREDENTIALS in your environment.");
        }
    } catch (e: any) {
        // Catch parsing errors or other initialization issues and provide a more helpful message.
        console.error("Firebase Admin Init Raw Error:", e);
        throw new Error(`Failed to initialize Firebase Admin SDK. There is likely an issue with the format of your FIREBASE_SERVICE_ACCOUNT_KEY in the .env.local file. Ensure it is a valid, single-line JSON string. Original error: ${e.message}`);
    }
}

// Initialize the app. This will be a singleton.
adminApp = initializeAdminApp();

// Export the initialized services.
const auth = getAuth(adminApp);
const firestore = getFirestore(adminApp);

export { auth, firestore };
