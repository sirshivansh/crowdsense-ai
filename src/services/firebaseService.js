import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getPerformance, trace } from "firebase/performance";

const firebaseConfig = {
  apiKey: "AIzaSyCLB3y2cn8tqo5G10y9K6kglyzfjBj54h4",
  authDomain: "crowdsense-ai-7d584.firebaseapp.com",
  projectId: "crowdsense-ai-7d584",
  storageBucket: "crowdsense-ai-7d584.firebasestorage.app",
  messagingSenderId: "328672963147",
  appId: "1:328672963147:web:3d93493202ee7163ae7bce",
  measurementId: "G-2LTT2ELKY8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Google Analytics (G4) ──────────────────────────────────────
/** @type {import("firebase/analytics").Analytics | null} */
let analytics = null;
try {
  analytics = getAnalytics(app);
  console.log('[Google Analytics] Initialized');
} catch (e) {
  console.warn('[Google Analytics] Not available in this environment:', e.message);
}

// ── Firebase Performance Monitoring (G3) ───────────────────────
/** @type {import("firebase/performance").FirebasePerformance | null} */
let perf = null;
try {
  perf = getPerformance(app);
  console.log('[Firebase Performance] Initialized — auto-instrumenting page loads & network');
} catch (e) {
  console.warn('[Firebase Performance] Not available in this environment:', e.message);
}

// ── Firebase Anonymous Auth (G2) ───────────────────────────────
const auth = getAuth(app);

/**
 * Current authenticated user ID. Set after anonymous sign-in completes.
 * Used to tag Firestore writes with the operator session.
 * @type {string|null}
 */
let currentUserId = null;

/**
 * Initializes Firebase Anonymous Authentication.
 * Anonymous auth creates a lightweight session without requiring credentials,
 * enabling Firestore security rules and per-session audit trails.
 *
 * @returns {Promise<string|null>} The anonymous user UID, or null on failure.
 */
export async function initAuth() {
  try {
    const userCredential = await signInAnonymously(auth);
    currentUserId = userCredential.user.uid;
    console.log(`[Firebase Auth] Anonymous session: ${currentUserId}`);

    // Log auth event to Google Analytics
    if (analytics) {
      logEvent(analytics, 'login', { method: 'anonymous' });
    }

    return currentUserId;
  } catch (error) {
    console.error('[Firebase Auth] Anonymous sign-in failed:', error);
    return null;
  }
}

/**
 * Listens for auth state changes and updates the local user ID.
 * @param {function} callback - Called with (userId: string|null)
 */
export function onAuthChanged(callback) {
  onAuthStateChanged(auth, (user) => {
    currentUserId = user ? user.uid : null;
    if (callback) callback(currentUserId);
  });
}

/**
 * Returns the current anonymous user ID.
 * @returns {string|null}
 */
export function getSessionUserId() {
  return currentUserId;
}

/**
 * Firebase Service for CrowdSense AI.
 * Handles persistence for crowd metrics, AI predictions, and system alerts.
 * All writes are tagged with the authenticated session UID for audit compliance.
 */
export const firebaseService = {
  /**
   * Persists real-time crowd data (zone-specific densities) to Firestore.
   * Each document is tagged with the operator session UID and a server timestamp.
   *
   * @param {Array<{id: string, name: string, density: number}>} zones - Current zone density snapshot.
   * @returns {Promise<string|null>} The Firestore document ID, or null on validation failure.
   */
  async saveCrowdData(zones) {
    // Basic input validation to prevent invalid state propagation
    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      console.warn('[Firebase] saveCrowdData: invalid zones input, skipping.');
      return null;
    }
    try {
      const docRef = await addDoc(collection(db, "crowdLogs"), {
        zones,
        sessionId: currentUserId || 'anonymous',
        timestamp: serverTimestamp(),
      });

      // Track data persistence event in Google Analytics
      if (analytics) {
        logEvent(analytics, 'crowd_data_saved', { zone_count: zones.length });
      }

      return docRef.id;
    } catch (error) {
      console.error("Firebase Error (saveCrowdData):", error);
      throw error;
    }
  },

  /**
   * Fetches latest crowd data logs from Firestore.
   *
   * @param {number} [count=10] - Number of recent records to retrieve.
   * @returns {Promise<Array<object>>} Array of crowd log documents.
   */
  async getCrowdData(count = 10) {
    // Basic input validation — count must be a positive integer
    if (typeof count !== 'number' || count < 1) count = 10;
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
   * Logs AI trend predictions to Firestore for future audit and model refinement.
   *
   * @param {object} prediction - The prediction result from CongestionPredictor.
   * @returns {Promise<void>}
   */
  async logPrediction(prediction) {
    // Basic input validation to prevent empty or malformed log entries
    if (!prediction || typeof prediction !== 'object') {
      console.warn('[Firebase] logPrediction: invalid prediction input, skipping.');
      return;
    }
    try {
      await addDoc(collection(db, "predictionLogs"), {
        ...prediction,
        sessionId: currentUserId || 'anonymous',
        timestamp: serverTimestamp(),
      });

      // Track prediction event in Google Analytics
      if (analytics) {
        logEvent(analytics, 'ai_prediction_logged', {
          confidence: prediction.confidence || 0,
          is_increasing: prediction.isIncreasing || false,
        });
      }
    } catch (error) {
      console.error("Firebase Error (logPrediction):", error);
    }
  },

  /**
   * Triggers a system alert in Firestore if high density thresholds are breached.
   *
   * @param {Array<{id: string, name: string, density: number}>} zones - Current zones.
   * @param {number} [threshold=0.85] - Density threshold for alert trigger.
   * @returns {Promise<void>}
   */
  async triggerAlertIfHighDensity(zones, threshold = 0.85) {
    if (!zones || !Array.isArray(zones)) return;
    const congestedZones = zones.filter(z => z && typeof z.density === 'number' && z.density >= threshold);
    if (congestedZones.length === 0) return;

    try {
      for (const zone of congestedZones) {
        await addDoc(collection(db, "activeAlerts"), {
          zoneId: zone.id,
          zoneName: zone.name,
          density: zone.density,
          priority: "HIGH",
          sessionId: currentUserId || 'anonymous',
          timestamp: serverTimestamp(),
        });
      }

      // Track alert event in Google Analytics
      if (analytics) {
        logEvent(analytics, 'high_density_alert', {
          zones_affected: congestedZones.length,
          max_density: Math.max(...congestedZones.map(z => z.density)),
        });
      }
    } catch (error) {
      console.error("Firebase Error (triggerAlert):", error);
    }
  },

  /**
   * Logs a structured analytics event to the systemEvents collection.
   * Used for routing decisions, prediction audits, and emergency activations.
   *
   * @param {{ type: string, metadata: object }} event - The event to log.
   * @returns {Promise<void>}
   */
  async logSystemEvent(event) {
    // Basic input validation to prevent malformed analytics entries
    if (!event || !event.type || typeof event.type !== 'string') {
      console.warn('[Firebase] logSystemEvent: invalid event, skipping.');
      return;
    }
    const entry = {
      type: event.type,
      timestamp: Date.now(),
      metadata: event.metadata || {},
      sessionId: currentUserId || 'anonymous',
      serverTimestamp: serverTimestamp(),
    };
    console.log(`[Analytics] ${event.type}`, entry.metadata);
    try {
      await addDoc(collection(db, "systemEvents"), entry);

      // Mirror to Google Analytics for cross-platform visibility
      if (analytics) {
        logEvent(analytics, `system_${event.type}`, event.metadata || {});
      }
    } catch (error) {
      console.error("Firebase Error (logSystemEvent):", error);
    }
  },

  /**
   * Creates a custom Firebase Performance trace for measuring operation latency.
   * Used to instrument route computation, prediction cycles, and UI updates.
   *
   * @param {string} traceName - Unique name for the performance trace.
   * @returns {{ stop: function }|null} A trace handle with a stop() method, or null.
   */
  startPerformanceTrace(traceName) {
    if (!perf) return null;
    try {
      const t = trace(perf, traceName);
      t.start();
      return t;
    } catch (e) {
      console.warn('[Firebase Performance] Trace error:', e.message);
      return null;
    }
  },

  /**
   * Logs a custom event to Google Analytics.
   *
   * @param {string} eventName - The event name (snake_case recommended).
   * @param {object} [params={}] - Optional event parameters.
   */
  logAnalyticsEvent(eventName, params = {}) {
    if (!analytics) return;
    try {
      logEvent(analytics, eventName, params);
    } catch (e) {
      console.warn('[Google Analytics] Event logging error:', e.message);
    }
  }
};
