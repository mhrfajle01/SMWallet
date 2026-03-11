import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
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

// Enable offline persistence
enableIndexedDbPersistence(db).then(() => {
  console.log("Firestore persistence enabled!");
}).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.warn("Persistence failed: Multiple tabs open");
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("Persistence failed: Browser not supported");
  } else {
    console.error("Persistence error:", err);
  }
});
