# ⚓ Navi-Steel Freight AI (HTTPS Secure)
### Intelligent Freight Forecasting & Maritime Logistics Optimization Platform
**Smart India Hackathon (SIH 2026) | Problem ID: SIH26006 | Ministry of Steel**  
**Theme:** Transportation & Logistics

---

## 🚀 Key Features & Enterprise Modules

1. **AI Forward Freight Rate Forecaster**  
   Predicts 15-to-90-day dry bulk ocean freight rates using the Baltic Dry Index (BDI), bunker fuel prices, and seasonal indices.

2. **Port Draft Safety & Auto-Adjust Check**  
   Validates fully laden vessel drafts against real-world Indian port water depth limits (e.g., Paradip, Haldia, Dhamra) with one-click cargo volume auto-adjustment to prevent grounding risks.

3. **Port Congestion & Demurrage Risk Predictor**  
   Calculates live outer anchorage waiting times, queue counts, and weather risks, automatically adding daily charter demurrage penalties ($25,000+/day) to total landed costs.

4. **Eco-Speed & Decarbonization Mode**  
   Applies maritime cubic fuel consumption laws ($F \propto V^3$) and IMO/EU ETS carbon tax benchmarks ($85/\text{tonne }\text{CO}_2$) to calculate fuel and carbon savings when reducing transit speeds.

5. **Real-Time AIS Maritime Vessel Tracker Map**  
   Interactive dark-mode ocean map displaying live cargo ship coordinates, speed over ground (SOG), heading vectors, and dynamic route tracking from global loading ports to Indian discharge hubs.

---

## 📂 Directory Structure

freight-optimizer/
├── backend/
│   ├── certs/                      # SSL Certificate & Private Key
│   ├── data/                       # Historical freight CSV & dataset generator
│   ├── models/                     # Trained ML Random Forest forecaster (.pkl)
│   ├── optimizer/                  # Draft constraints & charter optimization logic
│   ├── main.py                     # FastAPI application & REST endpoints
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/                        # React executive dashboard & live AIS map components
│   ├── package.json                # Node dependencies & scripts
│   └── vite.config.js              # Vite configuration with HTTPS support
│
├── start_all.bat                   # One-click launcher for HTTPS backend & frontend
└── README.md










