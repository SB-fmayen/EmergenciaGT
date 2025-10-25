
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

let adminApp: App;

function initializeAdminApp(): App {
    const existingApps = getApps();
    if (existingApps.length > 0) {
        return existingApps[0];
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    try {
        if (serviceAccountKey) {
            const serviceAccount = JSON.parse(serviceAccountKey);

            // Ensure the private key has the correct newline characters.
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\n/g, '\n');
            }

            return initializeApp({ credential: cert(serviceAccount) });
        } else if (googleAppCreds) {
            return initializeApp();
        } else {
            throw new Error("CRITICAL: Firebase Admin credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local file or GOOGLE_APPLICATION_CREDENTIALS in your environment.");
        }
    } catch (e: any) {
        console.error("Firebase Admin Init Raw Error:", e);
        throw new Error(`Failed to initialize Firebase Admin SDK. There is likely an issue with the format of your FIREBASE_SERVICE_ACCOUNT_KEY in the .env.local file. Ensure it is a valid, single-line JSON string. Original error: ${e.message}`);
    }
}

adminApp = initializeAdminApp();

const auth = getAuth(adminApp);
const firestore = getFirestore(adminApp);

export { auth, firestore };
