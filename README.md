# 🏟️ CrowdSense AI

### **Intelligent Stadium Management & Crowd Orchestration System**

CrowdSense AI is a performance-optimized, high-fidelity stadium management platform. It transforms raw sensor data into actionable crowd intelligence, leveraging a data-driven engine to optimize fan flow, minimize wait times, and maximize operational safety.

---

## 🚀 Technical Highlights

- **Pure Performance**: Built with zero-framework Vanilla JavaScript (ES Modules) for near-instant execution and minimal bundle size.
- **Dynamic Pathfinding**: Implements a weighted Dijkstra algorithm that considers both distance and real-time crowd density ("congestion penalty") to find truly optimal routes.
- **Event-Driven Simulation**: Features a centralized `DataSimulator` using the Observer pattern to synchronize state across the heatmap, routing, and UI components.
- **Premium UI/UX**: Custom-crafted glassmorphism design system using CSS variables, ensuring a state-of-the-art visual experience without the bloat of external UI libraries.

---

## ✨ Key Features (New Enhancements)

- 🔥 **Real-Time Crowd Sync** using Firebase Firestore (Google Cloud integration)
- ♿ **Accessibility First Design** (ARIA roles, semantic HTML, keyboard navigation, screen-reader support)
- 🛡️ **Security Hardened Backend** (Helmet, Rate Limiting, CSP protection)
- 🧪 **Robust Testing Suite** using Vitest (edge cases + deterministic validation)
- ⚡ **Smart Routing Engine** using congestion-aware Dijkstra algorithm

---

## 🏗️ System Architecture

The project follows a modular, component-based architecture where each system manages its own lifecycle while remaining synchronized via a core simulator.

```mermaid
graph TD
    subgraph "Core Engine"
        DS[Data Simulator] -- "State Updates (Density/Wait)" --> ME[Main Controller]
    end

    subgraph "Logic Systems"
        ME -- "Compute Path" --> RT[Routing Engine]
        ME -- "Extract Insights" --> AI[AI Recommendation Layer]
    end

    subgraph "Visualization Layer"
        ME -- "Render SVG" --> HM[Heatmap Component]
        ME -- "Animation Path" --> FL[Flow Component]
        ME -- "Live Lists" --> WT[WaitTimes Component]
    end

    style DS fill:#10b981,stroke:#059669,color:#fff
    style ME fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style RT fill:#8b5cf6,stroke:#7c3aed,color:#fff
````

---

## 🧠 Software Components

### 1. Routing Engine (`Routing.js`)

* Congestion-aware pathfinding using weighted Dijkstra
* Dynamic edge weights: `Weight = Distance + (Density × Sensitivity)`
* Smooth animated SVG path rendering

### 2. Adaptive Heatmap (`Heatmap.js`)

* Real-time density visualization using CSS variables
* Efficient updates without full re-render
* Interactive tooltips with contextual insights

### 3. AI Recommendation Layer

* Suggests optimal routes and zones
* Predictive alerts for congestion hotspots
* Time-saving insights based on live data

### 4. Real-Time Cloud Sync (NEW)

* Firebase Firestore integration
* Live crowd density updates stored and synced across sessions
* Scalable backend using Google Cloud

---

## ⚙️ Tech Stack & Tooling

| Layer      | Technology                 | Rationale          |
| ---------- | -------------------------- | ------------------ |
| Bundler    | Vite 5.x                   | Fast builds & HMR  |
| Language   | Vanilla JavaScript (ES6+)  | Zero overhead      |
| Styling    | Vanilla CSS                | High performance   |
| Backend    | Node.js + Express          | Lightweight server |
| Cloud      | Firebase Firestore         | Real-time database |
| Security   | Helmet, Rate Limiting, CSP | Production safety  |
| Testing    | Vitest                     | Fast unit testing  |
| Deployment | Google Cloud Run           | Scalable hosting   |

---

## ♿ Accessibility

* ARIA labels for all interactive elements
* Semantic HTML structure (`main`, `section`, `nav`, etc.)
* Keyboard navigation support
* Screen-reader friendly alerts (`aria-live`)
* Accessible SVG regions for heatmap zones

---

## 🛡️ Security

* Secure HTTP headers via Helmet
* Rate limiting to prevent abuse
* Content Security Policy (CSP) configured
* Safe handling of external resources (Firebase, Fonts)

---

## 🧪 Testing

* Unit tests implemented using Vitest
* Covers shortest path, edge cases, deterministic output
* Ensures routing engine reliability

---

## 🛠️ Local Development

### Prerequisites

* Node.js 18+
* npm 9+

### Setup

```bash
git clone https://github.com/sirshivansh/crowdsense-ai.git
cd crowdsense-ai
npm install
npm run dev
```

### Scripts

* `npm run dev` → Start dev server
* `npm run build` → Build production
* `npm run preview` → Preview build
* `npm start` → Run Express server

---

## ☁️ Deployment

```bash
gcloud run deploy crowdsense-ai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

---

## 📊 Impact

* Reduces congestion bottlenecks
* Improves fan experience
* Enhances stadium safety
* Enables data-driven decisions

---

## 👨‍💻 Author

**Shivansh Mishra**
*Building the future of smart stadium orchestration.*

---

## 🛡️ License

MIT License