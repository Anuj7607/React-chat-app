// IMPORTANT: Replace the firebaseConfig object below with your project's config from Firebase Console.
// You can also put these values in environment variables and import them here.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBP0g0ReHyog_B3msbuaJaF16uVahq3od8",
  authDomain: "react-chat-app-20be8.firebaseapp.com",
  projectId: "react-chat-app-20be8",
  storageBucket: "react-chat-app-20be8.firebasestorage.app",
  messagingSenderId: "955106837076",
  appId: "1:955106837076:web:3de1a6e800ac8ef3cba3c1",
  measurementId: "G-91GFYTTP0R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
