# ⚓ Navi-Steel Freight AI (HTTPS Secure)
### Intelligent Freight Forecasting & Maritime Logistics Optimization Platform
**Smart India Hackathon (SIH 2026) | Problem ID: SIH26006 | Ministry of Steel**  
**Theme:** Transportation & Logistics

---

## 1. Project Overview
Indian steel manufacturers (SAIL, Tata Steel, JSW, JSPL, RINL/Vizag Steel) import high volumes of bulk raw materials (Coking Coal, PCI Coal, Limestone) across international maritime routes to Indian East Coast ports (**Paradip, Visakhapatnam, Dhamra, Haldia, Krishnapatnam**). 

This platform operates fully over **secure HTTPS**:
1. **AI Forward Freight Rate Forecaster:** Predicts dry bulk ocean freight rates 15 to 90 days ahead using Baltic Dry Index (BDI), Capesize/Panamax sub-indices, Singapore VLSFO bunker fuel prices, and seasonality.
2. **Vessel Chartering Optimizer:** Recommends optimal vessel classes (**Capesize 160k DWT, Panamax 75k DWT, Supramax 55k DWT**) while strictly enforcing port draft limits.
3. **Demurrage & Landed Cost Ledger:** Computes demurrage risk exposure, bunker fuel surcharges, and advises whether to lock in a **Period/Time Charter** or procure on the **Spot Market**.
4. **Interactive Dashboard:** Modern React + Tailwind CSS interface featuring interactive Recharts forward curves, port draft clearance matrices, and maritime corridor intelligence.

---

## 2. Key Features & Enterprise Modules

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

## 3. How to Run in VS Code (HTTPS)

### Quick Start (One-Click)
Double-click `start_all.bat` or run in terminal:
```powershell
.\start_all.bat
