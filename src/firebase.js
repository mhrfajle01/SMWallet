import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCEDGZTShWZstM11zs3LqpzSe6XWbZdh_A",
  authDomain: "savings-fb5bd.firebaseapp.com",
  projectId: "savings-fb5bd",
  storageBucket: "savings-fb5bd.firebasestorage.app",
  messagingSenderId: "286488250140",
  appId: "1:286488250140:web:6962beca73f2c2dd689cd9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
