# 🌍 Quantified Surplus Intelligence Platform

A **Self-Organizing AI System** that predicts food surplus, optimizes redistribution, and reduces waste in real-time. Built with a Multi-Output Random Forest Regressor and a dual-track simulation engine to prove economic and social impact.

![Dashboard Preview](frontend/public/dashboard-preview.png)

## 🚀 Key Features

### 🧠 Predictive Intelligence
- **Multi-Output Regression**: Predicts demand for 5 menu items simultaneously based on:
  - Time of Day (Hourly peaks)
  - Weather (Rain/Heat sensitivity)
  - Special Events (Demand spikes)
- **Uncertainty Quantification**: Calculates dynamic confidence intervals to inform risk-aware decisions.

### ⚙️ Decision Engine
- **Economic Optimization**: Weighs Waste Cost vs. Opportunity Cost vs. Social Value.
- **Food Safety Intelligence**: Monitors ambient temp and calculates spoilage risk (Arrhenius equation).
- **Safety Overrides**: Forces redistribution during high heat events (>35°C) to prevent spoilage.

### 📊 Impact Metrics
- **Carbon Saved**: Tracks CO₂e reduction (2.5kg CO₂/kg waste).
- **Financial Impact**: Compares AI performance against a static "Baseline" strategy.
- **Social Impact**: Tracks meals donated to shelters.

---

## 🛠️ Tech Stack

- **ML Core**: Python (scikit-learn, pandas, numpy)
- **Backend**: Node.js, Express
- **Frontend**: React, Vite, Recharts, CSS Variables
- **Data**: Synthetic historical sales + OpenWeatherMap API

---

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Akshatb2006/Quantified-Surplus-Intelligence-Platform.git
cd Quantified-Surplus-Intelligence-Platform
```

### 2. Setup Backend & ML
```bash
cd backend
npm install
# Create .env file with OPENWEATHER_API_KEY
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Setup Python Environment
```bash
cd ..
python3 -m venv venv
source venv/bin/activate
pip install -r model/requirements.txt
```

---

## 🎮 Usage

1. Open `http://localhost:5173` in your browser.
2. Toggle **"Special Event Today"** to see the AI handle demand spikes.
3. Select **"Burger King (CP)"** or **"Domino's (Hauz Khas)"** to simulate different locations.
4. Watch the **Carbon Saved** metric rise as the AI optimizes production!

---

## 📜 License

MIT License. Built for impact. 🌍
