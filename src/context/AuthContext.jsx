import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider: Rendering...');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Use onSnapshot for reactive user data
        const docRef = doc(db, 'users', firebaseUser.uid);
        unsubUserDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // Initialize if not exists
            const initialData = { 
              email: firebaseUser.email, 
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              pinnedWalletId: '' 
            };
            setDoc(docRef, initialData);
            setUserData(initialData);
          }
          setLoading(false);
        }, (error) => {
          console.error("User doc snapshot error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        unsubUserDoc();
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        unsubUserDoc();
    };
  }, []);

  const signup = (email, password, displayName) => {
    return createUserWithEmailAndPassword(auth, email, password).then(async (result) => {
      await updateProfile(result.user, { displayName });
      return result;
    });
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserSettings = async (data) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    // onSnapshot will pick up this change automatically
    await setDoc(docRef, data, { merge: true });
  };

  const value = {
    user,
    userData,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserSettings,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};