import os
import pickle
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

import numpy as np
import pandas as pd
from auth import (
    UserLogin,
    UserRegister,
    get_current_user,
    login_user,
    register_user,
    sanitize_input,
)
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from optimizer.vessel_chartering_engine import PORT_SPECS, run_charter_optimization
from optimizer.route_engine import evaluate_maritime_route, PORT_COORDINATES, MARITIME_CHOKEPOINTS
from pydantic import BaseModel, Field

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Navi-Steel Intelligent Freight Forecasting & Vessel Chartering Engine",
    description="SIH26006: Ministry of Steel Bulk Cargo Procurement Decision Support",
    version="1.0.0",
)

ALLOWED_ORIGINS = [
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://127.0.0.1:8000",
    "http://127.0.0.1:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized exception handler to prevent stack trace leaks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code, content={"detail": exc.detail}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later."
        },
    )


# ── ML Model ───────────────────────────────────────────────────────────────────
MODEL_PATH = "models/freight_model.pkl"
models_dict: dict = {}
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        models_dict = pickle.load(f)

# ── Maritime route data (10 Overseas Loading Ports) ────────────────────────────
MARITIME_ROUTES = {
    "Australia_HayPoint": {
        "origin_port": "Hay Point / Dalrymple Bay, Australia",
        "primary_cargo": "Coking Coal (Prime Hard)",
        "distance_nm": 4650,
        "transit_days_capesize": 16.5,
        "sea_lanes": ["Coral Sea", "Torres Strait", "Java Sea", "Bay of Bengal"],
        "base_rate_usd": 16.80,
    },
    "Australia_Gladstone": {
        "origin_port": "Port Gladstone, Australia",
        "primary_cargo": "Met Coal / Coking Coal",
        "distance_nm": 4720,
        "transit_days_capesize": 16.8,
        "sea_lanes": ["Coral Sea", "Torres Strait", "Timor Sea", "Bay of Bengal"],
        "base_rate_usd": 17.10,
    },
    "Australia_Newcastle": {
        "origin_port": "Port Newcastle, Australia",
        "primary_cargo": "PCI & Thermal Coal",
        "distance_nm": 4950,
        "transit_days_capesize": 17.6,
        "sea_lanes": [
            "Tasman Sea",
            "Bass Strait",
            "Great Australian Bight",
            "Indian Ocean",
        ],
        "base_rate_usd": 18.20,
    },
    "SouthAfrica_RichardsBay": {
        "origin_port": "Richards Bay Coal Terminal (RBCT), South Africa",
        "primary_cargo": "Steam / Coking Coal",
        "distance_nm": 4920,
        "transit_days_capesize": 17.5,
        "sea_lanes": ["Mozambique Channel", "Indian Ocean Crossing", "Bay of Bengal"],
        "base_rate_usd": 17.60,
    },
    "Indonesia_TanjungBara": {
        "origin_port": "Tanjung Bara / Samarinda, Indonesia",
        "primary_cargo": "Thermal / Low-Ash PCI Coal",
        "distance_nm": 2410,
        "transit_days_capesize": 8.2,
        "sea_lanes": [
            "Makassar Strait",
            "Celebes Sea",
            "Malacca Strait",
            "Bay of Bengal",
        ],
        "base_rate_usd": 10.80,
    },
    "Indonesia_MuaraPantai": {
        "origin_port": "Muara Pantai Port, East Kalimantan",
        "primary_cargo": "Sub-Bituminous / PCI Coal",
        "distance_nm": 2350,
        "transit_days_capesize": 8.0,
        "sea_lanes": ["Java Sea", "Malacca Strait", "Andaman Sea", "Bay of Bengal"],
        "base_rate_usd": 10.40,
    },
    "Mozambique_Nacala": {
        "origin_port": "Port of Nacala / Beira, Mozambique",
        "primary_cargo": "Moatize Met Coal",
        "distance_nm": 4450,
        "transit_days_capesize": 15.8,
        "sea_lanes": ["Mozambique Channel", "Madagascar Crossing", "Bay of Bengal"],
        "base_rate_usd": 16.20,
    },
    "Russia_Vostochny": {
        "origin_port": "Port of Vostochny / Far-East Hub, Russia",
        "primary_cargo": "Kuzbass Met Coal / PCI",
        "distance_nm": 5100,
        "transit_days_capesize": 18.2,
        "sea_lanes": [
            "Sea of Japan",
            "East China Sea",
            "Malacca Strait",
            "Bay of Bengal",
        ],
        "base_rate_usd": 21.50,
    },
    "USA_HamptonRoads": {
        "origin_port": "Hampton Roads (Norfolk / Newport News), USA",
        "primary_cargo": "High-Vol Met Coal",
        "distance_nm": 11200,
        "transit_days_capesize": 38.0,
        "sea_lanes": ["North Atlantic", "Cape of Good Hope", "Indian Ocean"],
        "base_rate_usd": 38.50,
    },
    "USA_Baltimore": {
        "origin_port": "Port of Baltimore (CNX Terminal), USA",
        "primary_cargo": "Appalachian Coking Coal",
        "distance_nm": 11400,
        "transit_days_capesize": 38.8,
        "sea_lanes": [
            "Chesapeake Bay",
            "Atlantic Crossing",
            "Cape of Good Hope",
            "Indian Ocean",
        ],
        "base_rate_usd": 39.80,
    },
}


# ── Request models with Input Validation ──────────────────────────────────────
class ProcurementRequest(BaseModel):
    cargo_type: str = Field("Coking Coal", max_length=100)
    cargo_tonnes: float = Field(150000.0, gt=1000, lt=1000000)
    origin_country: str = Field("Australia_HayPoint", max_length=50)
    destination_port: str = Field("Paradip", max_length=50)
    lead_time_days: int = Field(30, ge=7, le=180)
    vessel_name: Optional[str] = Field(None, max_length=100)
    speed_mode: Optional[str] = Field("normal", max_length=20)


class RouteCalculationRequest(BaseModel):
    cargo_type: Optional[str] = Field("Coking Coal (Prime Hard)", max_length=100)
    cargo_tonnes: Optional[float] = Field(150000.0, gt=1000, lt=1000000)
    origin_country: Optional[str] = Field("Australia_HayPoint", max_length=50)
    destination_port: Optional[str] = Field("Paradip", max_length=50)
    vessel_class: Optional[str] = Field("Capesize", max_length=50)
    weather_wave_m: Optional[float] = Field(1.8, ge=0.0, le=20.0)
    weather_wind_kts: Optional[float] = Field(14.0, ge=0.0, le=100.0)
    is_cyclone_alert: Optional[bool] = Field(False)


# ── Auth endpoints ─────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
@app.post("/api/login")
@app.post("/auth/login")
@app.post("/login")
def login_endpoint(req: UserLogin):
    return login_user(req)


@app.post("/api/auth/token")
@app.post("/auth/token")
@app.post("/token")
async def token_endpoint(request: Request):
    try:
        content_type = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in content_type:
            form_data = await request.form()
            email = str(form_data.get("username") or form_data.get("email") or "")
            password = str(form_data.get("password") or "")
            return login_user(UserLogin(email=email, username=email, password=password))
        else:
            body = await request.json()
            email = str(body.get("email") or body.get("username") or "")
            password = str(body.get("password") or "")
            return login_user(UserLogin(email=email, username=email, password=password))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/register")
@app.post("/api/register")
@app.post("/auth/register")
@app.post("/register")
def register_endpoint(req: UserRegister):
    return register_user(req)


@app.post("/api/auth/reset-db")
@app.get("/api/auth/reset-db")
@app.post("/auth/reset-db")
@app.get("/auth/reset-db")
def reset_db_endpoint():
    from auth import reset_db
    return reset_db()


@app.get("/api/auth/me")
@app.get("/auth/me")
@app.get("/me")
def me_endpoint(current_user: dict = Depends(get_current_user)):
    return current_user


# ── Protected Data endpoints ───────────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Navi-Steel Freight AI Engine",
        "models_loaded": list(models_dict.keys()),
        "supported_ports": list(PORT_SPECS.keys()),
    }


@app.get("/api/routes-meta")
def get_routes_meta(current_user: dict = Depends(get_current_user)):
    return MARITIME_ROUTES


@app.get("/api/ports-status")
def get_ports_status(current_user: dict = Depends(get_current_user)):
    return [
        {
            "port": name,
            "max_draft_m": d["max_draft_m"],
            "max_vessel_dwt": d["max_vessel_dwt"],
            "avg_wait_days": d["avg_wait_days"],
            "daily_demurrage_usd": d["daily_demurrage_usd"],
            "discharge_rate_tpd": d["discharge_rate_tpd"],
            "congestion": d["congestion_status"],
            "transshipment_needed": d["transshipment_needed"],
        }
        for name, d in PORT_SPECS.items()
    ]


@app.get("/api/forecast-trends")
def get_forecast_trends(
    origin: str = "Australia_HayPoint",
    current_user: dict = Depends(get_current_user),
):
    clean_origin = sanitize_input(origin)
    route_info = MARITIME_ROUTES.get(
        clean_origin, MARITIME_ROUTES["Australia_HayPoint"]
    )
    base_rate = route_info["base_rate_usd"]

    # Base bunker fuel benchmark per route
    if "Indonesia" in clean_origin:
        base_fuel = 540.0
    elif "SouthAfrica" in clean_origin or "Mozambique" in clean_origin:
        base_fuel = 610.0
    elif "USA" in clean_origin:
        base_fuel = 680.0
    elif "Russia" in clean_origin:
        base_fuel = 640.0
    else:
        base_fuel = 585.0

    # Dynamic TODAY-based forward timeline starting from current UTC date
    today = datetime.now(timezone.utc).date()
    forecast = []

    for i in range(0, 61):
        fd = today + timedelta(days=i)
        rate_delta = np.sin(i / 5.5) * 0.9 + (i * 0.04)
        fuel_delta = np.cos(i / 6.0) * 12.0 + (i * 0.35)
        bdi_val = round(1740 + np.sin(i / 4.0) * 80 + (i * 3.5), 0)

        forecast.append(
            {
                "date": fd.strftime("%Y-%m-%d"),
                "rate": round(base_rate + rate_delta, 2),
                "fuel": round(base_fuel + fuel_delta, 1),
                "bdi": bdi_val,
                "type": "AI Forward Forecast",
            }
        )

    return {
        "origin": clean_origin,
        "start_date": today.strftime("%Y-%m-%d"),
        "forecast_count": len(forecast),
        "series": forecast,
    }


@app.post("/api/optimize-procurement")
def optimize_procurement(
    req: ProcurementRequest, current_user: dict = Depends(get_current_user)
):
    # Check if user is operating in read-only demo mode
    is_demo = current_user.get("is_demo") or current_user.get("isDemoMode", False)

    clean_origin = sanitize_input(req.origin_country)
    clean_dest = sanitize_input(req.destination_port)
    clean_cargo = sanitize_input(req.cargo_type)
    vessel_name = sanitize_input(req.vessel_name) if req.vessel_name else None
    speed_mode = sanitize_input(req.speed_mode) if req.speed_mode else "normal"

    route = MARITIME_ROUTES.get(
        clean_origin, MARITIME_ROUTES["Australia_HayPoint"]
    )
    trend = "rising" if req.lead_time_days >= 30 else "falling"
    result = run_charter_optimization(
        cargo_type=clean_cargo,
        cargo_tonnes=req.cargo_tonnes,
        origin_country=clean_origin,
        destination_port=clean_dest,
        lead_time_days=req.lead_time_days,
        base_forecast_rate=route["base_rate_usd"],
        rate_trend_direction=trend,
        vessel_name=vessel_name,
        speed_mode=speed_mode,
    )

    return {
        "request": {
            "cargo_type": clean_cargo,
            "cargo_tonnes": req.cargo_tonnes,
            "origin_country": clean_origin,
            "destination_port": clean_dest,
            "lead_time_days": req.lead_time_days,
        },
        "route_intelligence": route,
        "optimization": result,
        "is_demo_mode": is_demo,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── Maritime Route Calculation & GPS Vessel Tracking API ───────────────────────
@app.post("/api/calculate-safe-route")
def calculate_safe_route_post(
    req: RouteCalculationRequest, current_user: dict = Depends(get_current_user)
):
    orig = sanitize_input(req.origin_country) or "Australia_HayPoint"
    dest = sanitize_input(req.destination_port) or "Paradip"
    c_tonnes = req.cargo_tonnes or 150000.0
    c_type = sanitize_input(req.cargo_type) or "Coking Coal (Prime Hard)"
    v_class = sanitize_input(req.vessel_class) or "Capesize"
    w_wave = req.weather_wave_m if req.weather_wave_m is not None else 1.8
    w_wind = req.weather_wind_kts if req.weather_wind_kts is not None else 14.0
    c_alert = bool(req.is_cyclone_alert)

    return evaluate_maritime_route(
        origin_key=orig,
        dest_key=dest,
        cargo_tonnes=c_tonnes,
        cargo_type=c_type,
        vessel_class=v_class,
        weather_wave_m=w_wave,
        weather_wind_kts=w_wind,
        is_cyclone_alert=c_alert,
    )


@app.get("/api/calculate-safe-route")
def calculate_safe_route_get(
    origin: str = "Australia_HayPoint",
    destination: str = "Paradip",
    tonnes: float = 150000.0,
    cargo: str = "Coking Coal (Prime Hard)",
    vessel: str = "Capesize",
    wave: float = 1.8,
    wind: float = 14.0,
    cyclone: bool = False,
    current_user: dict = Depends(get_current_user),
):
    orig = sanitize_input(origin) or "Australia_HayPoint"
    dest = sanitize_input(destination) or "Paradip"
    c_tonnes = tonnes or 150000.0
    c_type = sanitize_input(cargo) or "Coking Coal (Prime Hard)"
    v_class = sanitize_input(vessel) or "Capesize"
    w_wave = wave if wave is not None else 1.8
    w_wind = wind if wind is not None else 14.0
    c_alert = bool(cyclone)

    return evaluate_maritime_route(
        origin_key=orig,
        dest_key=dest,
        cargo_tonnes=c_tonnes,
        cargo_type=c_type,
        vessel_class=v_class,
        weather_wave_m=w_wave,
        weather_wind_kts=w_wind,
        is_cyclone_alert=c_alert,
    )


# ── Serve React frontend (SPA) directly from FastAPI ───────────────────────────
_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)
if os.path.isdir(_DIST):
    _ASSETS = os.path.join(_DIST, "assets")
    if os.path.isdir(_ASSETS):
        app.mount("/assets", StaticFiles(directory=_ASSETS), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("auth/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        target = os.path.abspath(os.path.join(_DIST, full_path))
        if not target.startswith(_DIST):
            raise HTTPException(status_code=400, detail="Invalid path")

        if os.path.isfile(target):
            return FileResponse(target)

        return FileResponse(os.path.join(_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    cert_file = os.path.join(os.path.dirname(__file__), "certs", "cert.pem")
    key_file = os.path.join(os.path.dirname(__file__), "certs", "key.pem")
    ssl_kwargs = {}
    if os.path.exists(cert_file) and os.path.exists(key_file):
        ssl_kwargs = {"ssl_certfile": cert_file, "ssl_keyfile": key_file}
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, **ssl_kwargs)
