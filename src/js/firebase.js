import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLB3y2cn8tqo5G10y9K6kglyzfjBj54h4",
  authDomain: "crowdsense-ai-7d584.firebaseapp.com",
  projectId: "crowdsense-ai-7d584",
  storageBucket: "crowdsense-ai-7d584.firebasestorage.app",
  messagingSenderId: "328672963147",
  appId: "1:328672963147:web:3d93493202ee7163ae7bce"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);