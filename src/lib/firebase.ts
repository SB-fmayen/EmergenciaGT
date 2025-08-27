
// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: This object is generated automatically and should not be modified.
const firebaseConfig = {
  projectId: "emergenciagt",
  appId: "1:567733974529:web:4569e5ff79a80d8baff200",
  storageBucket: "emergenciagt.firebasestorage.app",
  apiKey: "AIzaSyAacNRFMDBJVHL26EtvZUxh8rXWRDMZuCo",
  authDomain: "emergenciagt.firebaseapp.com",
  messagingSenderId: "567733974529",
};

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

export { firebaseApp, auth, firestore };
