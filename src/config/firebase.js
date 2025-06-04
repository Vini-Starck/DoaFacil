import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";


const firebaseConfig = {
    apiKey: "AIzaSyDzPFTm55KO8ohVOuKRJVTqVleUgjWbmQg",
    authDomain: "doafacil-ab7e4.firebaseapp.com",
    projectId: "doafacil-ab7e4",
    storageBucket: "doafacil-ab7e4.firebasestorage.app",
    messagingSenderId: "313908830482",
    appId: "1:313908830482:web:f849abf4443f10d8a313cb"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);
export const storage = getStorage(app);

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LcpCVUrAAAAAAaSGGhffl4v_EHkYP-dwxvX3etI'),
  isTokenAutoRefreshEnabled: true
});
