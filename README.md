# Navi-Steel Freight AI (HTTPS Secure)
### Intelligent Freight Forecasting Model for Optimized Vessel Chartering & Bulk Cargo Procurement
**Smart India Hackathon (SIH 2026) | Problem ID: SIH26006 | Ministry of Steel**
**Theme:** Transportation & Logistics

---

## 1. Project Overview
Indian steel manufacturers (SAIL, Tata Steel, JSW, JSPL, RINL/Vizag Steel) import high volumes of bulk raw materials (Coking Coal, PCI Coal, Limestone) across international maritime routes to Indian East Coast ports (**Paradip, Visakhapatnam, Dhamra, Haldia, Krishnapatnam**). 

This platform operates fully over **secure HTTPS**:
1. **AI Forward Freight Rate Forecaster:** Predicts dry bulk ocean freight rates 15 to 90 days ahead using Baltic Dry Index (BDI), Capesize/Panamax sub-indices, Singapore VLSFO bunker fuel prices, and seasonality.
2. **Vessel Chartering Optimizer:** Recommends optimal vessel classes (**Capesize 160k DWT, Panamax 75k DWT, Supramax 55k DWT**) while strictly enforcing port draft limits (e.g. Haldia's shallow 8.5m draft vs Paradip's 17.5m deep draft).
3. **Demurrage & Landed Cost Ledger:** Computes demurrage risk exposure, bunker fuel surcharges, and advises whether to lock in a **Period/Time Charter** or procure on the **Spot Market**.
4. **Interactive Dashboard:** Modern React + Tailwind CSS interface featuring interactive Recharts forward curves, port draft clearance matrices, and maritime corridor intelligence.

---

## 2. Directory Structure
```
freight-optimizer/
├── backend/
│   ├── certs/
│   │   ├── cert.pem                  # SSL Certificate
│   │   └── key.pem                   # SSL Private Key
│   ├── data/
│   │   ├── generate_dataset.py       # Maritime index and route generator
│   │   └── raw_freight_data.csv      # 1,600+ historical freight records
│   ├── models/
│   │   ├── train_forecaster.py       # ML Random Forest / lag forecaster
│   │   └── freight_model.pkl         # Trained model binary
│   ├── optimizer/
│   │   └── vessel_chartering_engine.py # Draft limits & charter optimizer
│   ├── generate_ssl_certs.py         # Self-signed certificate generator
│   ├── main.py                       # FastAPI application & REST endpoints
│   ├── requirements.txt
│   └── venv/                         # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Main executive procurement dashboard (HTTPS API calls)
│   │   ├── index.css                 # Tailwind CSS styles
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js                # Configured with @vitejs/plugin-basic-ssl
│   └── tailwind.config.js
│
├── start_all.bat                     # One-click launcher for HTTPS backend & frontend
└── README.md
```

---

## 3. How to Run in VS Code (HTTPS)

### Quick Start (One-Click)
Double-click `start_all.bat` or run in terminal:
```powershell
.\start_all.bat
```

### Manual Run

#### Terminal 1 - Backend (FastAPI with SSL):
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000 --ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem
```
- Secure API Docs & Swagger UI: **`https://127.0.0.1:8000/docs`**

#### Terminal 2 - Frontend (Vite with SSL):
```powershell
cd frontend
npm run dev
```
- Secure Web Application: **`https://localhost:5173`**

> **Browser Note for Local HTTPS:** 
> When opening `https://localhost:5173` or `https://127.0.0.1:8000/docs` for the first time in Chrome/Edge, click **Advanced $\rightarrow$ Proceed to localhost (unsafe)** to accept the local developer certificate.
