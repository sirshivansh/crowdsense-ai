<p align="center">
  <h1 align="center">CrowdSense AI</h1>
  <p align="center"><strong>Predictive Crowd Intelligence for Live Stadium Operations</strong></p>
</p>

<p align="center">
  <a href="./tests"><img src="https://img.shields.io/badge/tests-35%20passing-brightgreen" alt="Tests"></a>
  <a href="https://firebase.google.com"><img src="https://img.shields.io/badge/pipeline-Firebase%20Firestore-FFCA28?logo=firebase" alt="Firebase"></a>
  <a href="https://vitest.dev"><img src="https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest" alt="Vitest"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/built_with-Vite_5-646CFF?logo=vite" alt="Vite"></a>
</p>

---

## What This Is

CrowdSense AI is a real-time crowd management system that **predicts congestion before it happens** and **reroutes foot traffic automatically**.

It ingests live zone-level density data, runs it through a trend analysis engine that scores congestion velocity and confidence, feeds those scores into a penalty-weighted Dijkstra router, and persists every decision to Firebase Firestore for audit and analytics.

The system doesn't wait for a crowd crush to form. It identifies the trajectory and acts.

---

## Why It Matters

Stadiums hosting 50,000+ people manage crowd flow reactively — cameras, radios, manual gate closures. By the time an operator sees a problem, it's already a safety incident.

CrowdSense AI closes that gap:

| Traditional Approach | CrowdSense AI |
|---|---|
| Operator sees congestion on camera | System detects density trend 30s earlier |
| Manual radio call to redirect staff | Automatic reroute computed and displayed |
| Post-event incident report | Real-time prediction audit log in Firestore |
| Static signage | Dynamic routing overlay on live map |

---

## Architecture

```
 ┌──────────────┐     events      ┌──────────────────┐    penalties    ┌────────────────┐
 │  Simulator   │────────────────▶│  AI Predictor    │───────────────▶│  Dijkstra      │
 │  (3s ticks)  │                 │  (WRC Engine)    │                │  Router        │
 └──────┬───────┘                 └────────┬─────────┘                └────────────────┘
        │                                  │
        │          ┌───────────────────────┐│
        └─────────▶│  Firebase Firestore   │◀┘
                   │  crowdLogs            │
                   │  predictionLogs       │
                   │  activeAlerts         │
                   └───────────────────────┘
```

Every component is decoupled. The simulator emits events. The predictor consumes them. The router queries the predictor at weight-calculation time. Firebase persists asynchronously without blocking the render loop.

### Project Structure

```
src/
├── ai/               CongestionPredictor — trend scoring, confidence, proactive alerts
├── algorithms/       Dijkstra shortest path with dynamic edge weight injection
├── components/       Heatmap, Routing, Flow particles, WaitTimes, Chatbot
├── services/         Firebase service layer — saveCrowdData, logPrediction, triggerAlert
├── simulation/       Event-driven crowd data simulator (density, wait times, alerts)
└── utils/            TTL-based route cache
```

---

## AI Intelligence Layer

The prediction engine doesn't use simple thresholds. It computes a **Weighted Rate of Change** over a rolling density window, where recent data points carry linearly increasing weight.

```
trendScore = Σ(Δᵢ × wᵢ) / Σ(wᵢ)     where wᵢ = i + 1
confidence = clamp(consistency × dataVolume / 10, 0.20, 0.99)
```

Every call to `getTrendAnalysis()` returns a structured decision object:

```javascript
{
  isIncreasing : true,        // trend direction
  confidence   : 0.84,        // how reliable the signal is
  trendScore   : 0.032,       // raw velocity — feeds directly into routing penalties
  message      : "Increasing congestion."
}
```

**What the system does with each signal:**

| Trend Score | Classification | Action |
|---|---|---|
| > 0.04 | 🔴 Severe spike | Firebase HIGH alert + maximum routing penalty |
| > 0.01 | 🟡 Rising | Proactive reroute + prediction logged to Firestore |
| < −0.01 | 🟢 Dissipating | No penalty — crowd is thinning |
| else | ⚪ Stable | Baseline distance-only routing |

### Proactive vs. Reactive — The Core Differentiator

The routing engine applies **two independent penalty layers** at weight-calculation time:

```javascript
weight(A, B) = distance(A, B)
             + reactivePenalty(density)              // +2000 if > 80%, +500 if > 60%
             + proactivePenalty(trendScore × confidence × 1000)   // applied even at 50% density
```

This means a zone at 55% density with a climbing trend and 80% confidence gets a +800 penalty — the router steers traffic away *before* it hits 80%.

---

## Decision Intelligence & Observability

Every routing evaluation produces a structured console log:

```
[Routing Decision] Zone: Main Food Court
 - Congestion Predicted: true
 - Confidence: 84.0%
 - Action: Applied +1340 weight penalty
────────────────────────────────────
```

Every significant system event flows into Firebase:

| Firestore Collection | Trigger | Payload |
|---|---|---|
| `crowdLogs` | Every heatmap tick (3s) | Zone densities + `serverTimestamp()` |
| `predictionLogs` | AI confidence > 60% AND trend rising | Trend score, confidence, message |
| `activeAlerts` | Any zone density ≥ 85% | Zone ID, name, density, priority: `HIGH` |

The Firebase pipeline is fully async and error-isolated — a Firestore write failure never crashes the simulation loop.

---

## Google Cloud Integration

**Firebase Firestore** serves as the real-time data backbone:

- `saveCrowdData()` — persists zone snapshots every 3 seconds
- `getCrowdData()` — retrieves recent logs ordered by timestamp, with configurable limit
- `logPrediction()` — archives AI trend analyses for post-event model evaluation
- `triggerAlertIfHighDensity()` — writes HIGH-priority alerts when zones breach 85%

All entries use `serverTimestamp()` for timezone-consistent ordering. All functions are wrapped in isolated `try/catch` blocks with descriptive error context.

---

## Testing

35 test cases across 5 files. Full suite runs in ~500ms.

```
 ✓ tests/ai.test.js           13 tests — trend detection, confidence, edge cases
 ✓ tests/algorithms.test.js    9 tests — shortest path, custom weights, disconnected graphs
 ✓ tests/routing.test.js       4 tests — reactive penalties, proactive penalties, integration
 ✓ tests/robustness.test.js    8 tests — cache TTL, null inputs, missing DOM, empty edges
 ✓ test/basic.test.js          1 test  — baseline sanity check
```

```bash
npm test
```

---

## Performance

| Technique | What It Does |
|---|---|
| **Route Cache (30s TTL)** | Second request for same origin/destination is near-instant |
| **DOM Diffing** | Text content compared before write — no unnecessary reflows |
| **Bounded History** | Rolling 10-point window keeps AI analysis O(n) with fixed memory |
| **Async Persistence** | Firebase writes are fire-and-forget — UI thread never blocks |
| **Vite ES Modules** | Tree-shaken production bundles, sub-second HMR in development |

---

## Setup

```bash
npm install
npm run dev        # → http://localhost:5173
npm test           # 35 tests, ~500ms
```

Admin dashboard: `http://localhost:5173/admin.html`

---

## 🔮 Future Scope

CrowdSense AI is designed as an extensible intelligence platform. The current system establishes a real-time decision pipeline, which can be further enhanced in the following directions:

| Direction | Evolution |
|----------|----------|
| **Computer Vision Integration** | Replace simulated inputs with real-time crowd detection using CCTV and edge-based inference |
| **Advanced Sequence Forecasting** | Extend short-term trend analysis to LSTM or gradient-boosted models for multi-minute horizon prediction |
| **Emergency Evacuation Mode** | Introduce priority-based routing for rapid evacuation with dynamic zone overrides |
| **Vertex AI Deployment** | Migrate prediction engine to Google Cloud Vertex AI for scalable, production-grade inference |
| **Operational Integration APIs** | Enable real-time alert delivery to on-ground staff via mobile and control dashboards |
| **Multi-Venue Architecture** | Extend Firestore design to support multi-stadium deployments with tenant isolation |

These enhancements build directly on the existing event-driven architecture, allowing CrowdSense AI to evolve from a simulation system into a fully deployable intelligent infrastructure.

---

<p align="center">
  <em>Built to think ahead. Designed for venues where every second of crowd delay is a liability.</em>
</p>