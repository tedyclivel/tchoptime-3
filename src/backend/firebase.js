import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase (à remplacer avec vos propres clés)
const firebaseConfig = {
  apiKey: "AIzaSyBudH50BbvZTrIaCh7gICAcVdUe33fFatk",
  authDomain: "tchoptime-2.firebaseapp.com",
  projectId: "tchoptime-2",
  storageBucket: "tchoptime-2.appspot.com",
  messagingSenderId: "207700638516",
  appId: "1:207700638516:android:87fe7fb92cf39f375c8361"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Export des services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
