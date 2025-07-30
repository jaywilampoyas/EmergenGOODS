import { initializeApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDppKTBkiMhTWnhr7fl18itRT1Cbv7m4to",
  authDomain: "emergengoods.firebaseapp.com",
  projectId: "emergengoods",
  storageBucket: "emergengoods.appspot.com",
  messagingSenderId: "466981396051",
  appId: "1:466981396051:web:49afa045721621cac630a6",
  measurementId: "G-HMNK5VK37C",
};

// Initialize Firebase app and services
let app;
let auth;
let db;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  // Initialize authentication with persistence for mobile platforms
  auth = Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

  // Initialize Firestore
  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

// Export initialized services
export { auth, db };
