# ⚡ GridVision AI

> 🤖 **Autonomous AI-Powered Power Grid Inspection & Maintenance Intelligence Platform**

### 🚁 From Aerial Inspection → 🧠 Intelligent Decision → 🔧 Proactive Maintenance

GridVision AI is an AI-powered infrastructure monitoring platform designed to help electricity utilities **inspect, analyze, prioritize, and manage critical power-grid assets** such as transmission towers and transformers.

Instead of simply detecting infrastructure defects, GridVision AI aims to understand **asset health, defect severity, operational risk, and required maintenance action**.

---

## 🏆 PRISM Hackathon 2026

| 🏷️ Category | 📌 Details |
|---|---|
| 🚀 **Project** | GridVision AI |
| 👥 **Team** | InnovTex |
| 🎯 **Domain** | AI + Computer Vision + Smart Grid Infrastructure |
| 🤖 **Core Concept** | Autonomous AI-Powered Infrastructure Inspection |
| 🚁 **Inspection** | Drone / Aerial Inspection |
| 🧠 **Intelligence** | AI Vision + Risk Analysis + Decision Support |

---

## 📖 Problem Statement

Power-grid infrastructure requires regular inspection to identify defects and prevent failures. Traditional inspection methods often depend on manual inspection and analysis, making the process **time-consuming, expensive, difficult to scale, and reactive**.

Common challenges include:

- ❌ Manual inspection and visual analysis
- ❌ Difficult monitoring of large infrastructure networks
- ❌ Delayed identification of critical defects
- ❌ Lack of centralized asset health information
- ❌ Difficulty prioritizing maintenance activities
- ❌ Reactive rather than proactive maintenance

GridVision AI addresses these challenges by combining **aerial inspection, computer vision, asset health analysis, risk assessment, and AI-powered decision support**.

---

## 💡 Proposed Solution

GridVision AI transforms raw inspection data into actionable infrastructure intelligence.

```text
🚁 Drone / Aerial Inspection
            ↓
📥 Image / Video Collection
            ↓
👁️ AI Computer Vision
            ↓
🔍 Asset & Defect Detection
            ↓
📊 Severity Analysis
            ↓
❤️ Asset Health Assessment
            ↓
⚠️ Risk Evaluation
            ↓
🧠 AI Decision Engine
            ↓
📋 Maintenance Prioritization
            ↓
🔧 Recommended Action
            ↓
🖥️ Operations Dashboard
```

---

## ✨ Key Features

### 🤖 AI Control Center

Centralized dashboard for monitoring the overall condition of the power-grid infrastructure.

**Provides:**

- ❤️ Grid Health Score
- 🏗️ Total Assets Monitored
- 🚨 Critical Alerts
- 🔎 Inspection Statistics
- 🧠 AI Executive Summary
- 🤖 AI Agent Status
- ⚠️ Risk Analytics
- 🔧 Maintenance Priority Queue
- 🗺️ Interactive Grid Map

---

### 👁️ AI Vision & Defect Detection

GridVision AI is designed to use computer vision models such as **YOLOv8** to analyze infrastructure inspection imagery.

Potential findings include:

- 🟤 Corrosion / rust
- 🔩 Damaged components
- 🧱 Structural abnormalities
- 📐 Structural deformation
- 🔗 Broken or missing components
- ⚠️ Other visual infrastructure anomalies

---

### ❤️ Asset Health Monitoring

Each monitored asset can have a health score representing its current condition.

Example:

```text
⚡ Tower 45

Health Score: 68 / 100
Status: 🟠 Attention Required
Risk: High

AI Recommendation:
🔧 Schedule Maintenance
```

This allows operators to quickly identify assets requiring attention.

---

### ⚠️ Severity & Risk Analysis

Detected issues can be classified according to severity:

| Level | Meaning | Recommended Action |
|---|---|---|
| 🟢 **Low** | Minor finding | Continue Monitoring |
| 🟡 **Medium** | Requires attention | Increased Monitoring |
| 🟠 **High** | Significant risk | Schedule Maintenance |
| 🔴 **Critical** | Immediate concern | Immediate Action |

---

### 🧠 AI Decision Engine

Instead of simply reporting:

> "Defect detected."

GridVision AI aims to answer:

> **"What should happen because of this defect?"**

The decision engine considers factors such as:

- 🔍 Defect severity
- ❤️ Asset health
- ⚠️ Risk level
- 📈 Health trend
- 🏗️ Asset importance
- ⏱️ Maintenance urgency

Example:

```text
High Severity Defect
        ↓
Asset Health Degraded
        ↓
Operational Risk Increased
        ↓
Maintenance Priority Increased
        ↓
🔧 Schedule Maintenance
```

---

### 🗺️ Interactive Grid Map

The platform provides a geographical view of monitored infrastructure using **Leaflet and OpenStreetMap**.

The map can display:

- 📍 Asset locations
- 🗼 Transmission towers
- ⚡ Transformers
- 🟢 Healthy assets
- 🟠 Assets requiring attention
- 🔴 High-risk assets

This connects AI findings with their real-world location.

---

### 🔧 Maintenance Priority Queue

GridVision AI converts inspection findings into an actionable maintenance queue.

Example:

| Priority | Asset | Health | Severity | Action |
|---|---|---:|---|---|
| 🔴 P1 | Tower 45 | 68/100 | High | Schedule Maintenance |
| 🟠 P2 | Tower 24 | 73/100 | Medium | Monitor |
| 🟡 P3 | Tower 23 | 78/100 | Medium | Monitor |

This helps maintenance teams focus on the most important assets first.

---

### 🔮 Predictive Health Monitoring

The platform includes a predictive health timeline concept for tracking asset condition over time.

```text
Historical Inspection
        ↓
Health Trend
        ↓
Degradation Detection
        ↓
Risk Prediction
        ↓
Predictive Maintenance
```

The long-term goal is to move from **reactive maintenance to proactive and predictive maintenance**.

---

## 🧠 Autonomous AI Workflow

GridVision AI follows an intelligent inspection-to-action workflow:

```text
👁️ PERCEIVE
     ↓
🔍 DETECT
     ↓
📊 ANALYZE
     ↓
🧠 REASON
     ↓
⚠️ ASSESS RISK
     ↓
📋 PRIORITIZE
     ↓
🎯 DECIDE
     ↓
🔔 NOTIFY
```

The system is designed as a **decision-support platform**, where AI assists engineers and operators rather than replacing human decision-making.

---

## 🏗️ System Architecture

```text
                    🚁 DRONE / UAV
                         │
                         ▼
                 📥 DATA INGESTION
                         │
                         ▼
                 👁️ COMPUTER VISION
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       🏗️ ASSET DETECTION    🔍 DEFECT DETECTION
              │                     │
              └──────────┬──────────┘
                         ▼
                 📊 SEVERITY ANALYSIS
                         │
                         ▼
                  ❤️ HEALTH SCORE
                         │
                         ▼
                    ⚠️ RISK ENGINE
                         │
                         ▼
                 🧠 AI DECISION ENGINE
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          🔧 REPAIR   👁️ MONITOR  🚨 ALERT
              │          │          │
              └──────────┼──────────┘
                         ▼
                 🖥️ CONTROL CENTER
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           🗺️ MAP    📊 ANALYTICS  🔔 ALERTS
```

---

## 🛠️ Technology Stack

### 🎨 Frontend

| Technology | Purpose |
|---|---|
| ⚛️ React | User Interface |
| ⚡ Vite | Build Tool |
| 🎨 Tailwind CSS | Styling |
| 🗺️ Leaflet | Interactive Maps |
| 📊 Recharts | Data Visualization |
| 🔗 React Router | Navigation |
| 💻 JavaScript | Application Logic |

### 🤖 AI / Computer Vision

- YOLOv8
- Computer Vision
- Image Analysis
- Object Detection
- Defect Classification
- Severity Analysis
- Asset Health Intelligence

### 🧰 Development

- Git
- GitHub
- npm
- VS Code / Antigravity IDE

---

## 📂 Project Structure

```text
GridVision-AI-Project/
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   ├── 📁 pages/
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   └── tailwind.config.js
│
├── 📄 README.md
└── 📄 .gitignore
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yuvanesh2356/GridVision-AI-Project.git
```

### 2. Navigate to the Project

```bash
cd GridVision-AI-Project
```

### 3. Navigate to Frontend

```bash
cd frontend
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

Open the application at:

```text
http://localhost:5173
```

---

## 🧪 Current Prototype

The current prototype demonstrates the **complete operational workflow and user experience** of GridVision AI.

| Module | Status |
|---|---|
| 🤖 AI Control Center | ✅ Implemented |
| ❤️ Grid Health | ✅ Implemented |
| 🏗️ Asset Monitor | ✅ Implemented |
| 🗺️ Interactive Grid Map | ✅ Implemented |
| 📊 Risk Analytics | ✅ Implemented |
| 🧠 AI Decision Engine UI | ✅ Implemented |
| 🔧 Maintenance Priority Queue | ✅ Implemented |
| 🔮 Predictive Timeline Concept | ✅ Implemented |
| 🚁 Drone Upload Interface | ✅ Prototype |
| 👁️ Real AI Model Inference | 🔜 Future Phase |
| 🗄️ Production Backend | 🔜 Future Phase |
| 🚁 Live Drone Integration | 🔜 Future Phase |
| 🔔 Real-time Notifications | 🔜 Future Phase |

> **Note:** The current version focuses on demonstrating the product workflow, interface, AI decision concept, and infrastructure intelligence architecture. Real-world deployment would require trained models, production backend services, validated inspection data, drone integration, and engineering verification.

---

## 🗺️ Future Roadmap

### 🟢 Phase 1 — Prototype
- [x] Operations Dashboard
- [x] Asset Monitoring
- [x] Interactive Map
- [x] Risk Analytics
- [x] AI Decision Engine UI
- [x] Maintenance Priority Queue

### 🟡 Phase 2 — Real AI
- [ ] YOLOv8 Integration
- [ ] Real Image Processing
- [ ] Defect Detection
- [ ] Severity Classification
- [ ] Automated Health Scoring

### 🟠 Phase 3 — Backend
- [ ] REST APIs
- [ ] Asset Database
- [ ] Inspection Database
- [ ] Historical Data
- [ ] Authentication

### 🔵 Phase 4 — Drone Integration
- [ ] Drone Image Ingestion
- [ ] Video Processing
- [ ] GPS Metadata
- [ ] Automated Inspection Workflow

### 🟣 Phase 5 — Predictive Intelligence
- [ ] Failure Prediction
- [ ] Health Trend Analysis
- [ ] Predictive Maintenance
- [ ] Remaining Useful Life Estimation

---

## 🌍 Potential Applications

GridVision AI can potentially be adapted for:

- ⚡ Power transmission networks
- 🔌 Distribution infrastructure
- 🗼 Transmission towers
- ⚙️ Substations
- 🔋 Renewable energy infrastructure
- 🌞 Solar farms
- 🌬️ Wind energy infrastructure
- 🏭 Industrial infrastructure

---

## 🎯 Key Innovation

GridVision AI goes beyond **"detecting a defect"**.

Its core idea is:

```text
🚁 Inspect
   ↓
👁️ Detect
   ↓
❤️ Understand Asset Health
   ↓
⚠️ Assess Risk
   ↓
🧠 Reason
   ↓
📋 Prioritize
   ↓
🔧 Recommend Action
```

This transforms infrastructure inspection from a **detection-focused process** into an **intelligent maintenance decision-support system**.

---

## 🏆 Expected Impact

GridVision AI aims to help infrastructure operators achieve:

- ⏱️ Faster inspection analysis
- 💰 Better maintenance resource allocation
- 🛡️ Improved infrastructure safety
- 📊 Centralized asset visibility
- 🧠 Better operational decision-making
- 🔧 Proactive maintenance planning
- 🔮 Future predictive infrastructure management

---

## 👥 Team InnovTex

### 🚀 Building Intelligent Infrastructure Solutions

**GridVision AI** combines:

```text
🤖 Artificial Intelligence
        +
👁️ Computer Vision
        +
🚁 Aerial Inspection
        +
🗺️ Geospatial Intelligence
        +
⚡ Smart Grid Infrastructure
        +
🧠 Decision Intelligence
```

---

## 🏆 PRISM Hackathon 2026

> **GridVision AI — From Aerial Inspection to Intelligent Infrastructure Decisions. ⚡🤖**

---

## 📜 License

This project was developed as a prototype for **PRISM Hackathon 2026** by **Team InnovTex**.

---

## ❤️ Built With

**React • Vite • Tailwind CSS • Leaflet • Recharts • Computer Vision • AI**

### ⚡ GridVision AI
**Inspect Smarter. Detect Earlier. Decide Better. Maintain Proactively.**
