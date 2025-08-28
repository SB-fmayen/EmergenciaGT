
"use server";

import { headers } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { auth } from '@/lib/firebase'; // Client auth

// This is a type for the data we send to the client to avoid sending the whole UserRecord
export type UserRecordWithRole = {
    uid: string;
    email?: string;
    displayName?: string;
    role: 'admin' | 'operator';
    disabled: boolean;
    creationTime: string;
    lastSignInTime: string;
}

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    // IMPORTANT: This relies on GOOGLE_APPLICATION_CREDENTIALS being set in the deployment environment.
    // In local development, you need to set this environment variable to the path of your service account key file.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);


/**
 * A server action to get a list of all users from Firebase Authentication.
 * Only an admin can perform this action.
 */
export async function getUsers(): Promise<{ success: boolean, users?: UserRecordWithRole[], error?: string }> {
    try {
        const idToken = headers().get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return { success: false, error: 'No se proporcionó token de autenticación. Acceso denegado.' };
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.admin !== true) {
            return { success: false, error: 'No tienes permisos de administrador para ver los usuarios.' };
        }

        const userRecords = await adminAuth.listUsers();
        
        const users = userRecords.users.map(user => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: user.customClaims?.admin === true ? 'admin' : 'operator' as 'admin' | 'operator',
            disabled: user.disabled,
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
        }));
        
        return { success: true, users };

    } catch (error: any) {
        console.error("Error fetching users:", error);
        return { success: false, error: `Error del servidor: ${error.message}` };
    }
}


/**
 * A server action to set a user's role (admin or operator).
 * Only an admin can perform this action, with a special exception for the first admin.
 */
export async function setUserRole(uid: string, role: 'admin' | 'operator'): Promise<{ success: boolean, error?: string }> {
     try {
        const idToken = headers().get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return { success: false, error: 'No se proporcionó token de autenticación. Acceso denegado.' };
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Special logic: Allow a user to make themselves the first admin if no admins exist
        const listUsersResult = await adminAuth.listUsers(1000); // Check up to 1000 users
        const admins = listUsersResult.users.filter(user => user.customClaims?.admin === true);
        const isFirstAdminSetup = admins.length === 0 && decodedToken.uid === uid && role === 'admin';
        
        // Regular check: Only allow if the caller is an admin
        if (decodedToken.admin !== true && !isFirstAdminSetup) {
             return { success: false, error: 'No tienes permisos de administrador para cambiar roles.' };
        }
        
        // Set the custom claim
        await adminAuth.setCustomUserClaims(uid, { admin: role === 'admin' });

        return { success: true };

    } catch (error: any)        {
        console.error(`Error setting role for UID ${uid}:`, error);
        return { success: false, error: `Error del servidor: ${error.code || error.message}` };
    }
}

    