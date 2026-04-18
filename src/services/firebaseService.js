import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

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

/**
 * Firebase Service for CrowdSense AI.
 * Handles persistence for crowd metrics, AI predictions, and system alerts.
 */
export const firebaseService = {
  /**
   * Persists real-time crowd data (zone-specific densities).
   */
  async saveCrowdData(zones) {
    try {
      const docRef = await addDoc(collection(db, "crowdLogs"), {
        zones,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Firebase Error (saveCrowdData):", error);
      throw error;
    }
  },

  /**
   * Fetches latest crowd data logs.
   */
  async getCrowdData(count = 10) {
    try {
      const q = query(collection(db, "crowdLogs"), orderBy("timestamp", "desc"), limit(count));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Firebase Error (getCrowdData):", error);
      return [];
    }
  },

  /**
   * Logs AI trend predictions for future audit and model refinement.
   */
  async logPrediction(prediction) {
    try {
      await addDoc(collection(db, "predictionLogs"), {
        ...prediction,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Firebase Error (logPrediction):", error);
    }
  },

  /**
   * Triggers a system alert in Firestore if high density thresholds are breached.
   */
  async triggerAlertIfHighDensity(zones, threshold = 0.85) {
    const congestedZones = zones.filter(z => z.density >= threshold);
    if (congestedZones.length === 0) return;

    try {
      for (const zone of congestedZones) {
        await addDoc(collection(db, "activeAlerts"), {
          zoneId: zone.id,
          zoneName: zone.name,
          density: zone.density,
          priority: "HIGH",
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Firebase Error (triggerAlert):", error);
    }
  }
};
