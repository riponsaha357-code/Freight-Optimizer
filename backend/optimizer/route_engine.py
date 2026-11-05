import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# ── Geo Coordinates Database for Major Global Bulk Ports ─────────────────────────
PORT_COORDINATES: Dict[str, Dict[str, Any]] = {
    # 10 Overseas Loading Ports
    "Australia_HayPoint": {
        "name": "Hay Point / Dalrymple Bay",
        "country": "Australia",
        "lat": -21.28,
        "lon": 149.30,
        "type": "origin",
        "berth_depth_m": 19.5,
        "max_vessel": "Capesize (220,000 DWT)",
    },
    "Australia_Gladstone": {
        "name": "Port Gladstone (RG Tanna)",
        "country": "Australia",
        "lat": -23.83,
        "lon": 151.27,
        "type": "origin",
        "berth_depth_m": 18.8,
        "max_vessel": "Capesize (200,000 DWT)",
    },
    "Australia_Newcastle": {
        "name": "Port Newcastle (PWCS / NCIG)",
        "country": "Australia",
        "lat": -32.92,
        "lon": 151.78,
        "type": "origin",
        "berth_depth_m": 16.8,
        "max_vessel": "Capesize (180,000 DWT)",
    },
    "SouthAfrica_RichardsBay": {
        "name": "Richards Bay Coal Terminal (RBCT)",
        "country": "South Africa",
        "lat": -28.80,
        "lon": 32.08,
        "type": "origin",
        "berth_depth_m": 19.0,
        "max_vessel": "Capesize (200,000 DWT)",
    },
    "Indonesia_TanjungBara": {
        "name": "Tanjung Bara / Samarinda",
        "country": "Indonesia",
        "lat": 0.55,
        "lon": 117.63,
        "type": "origin",
        "berth_depth_m": 17.5,
        "max_vessel": "Capesize (180,000 DWT)",
    },
    "Indonesia_MuaraPantai": {
        "name": "Muara Pantai Port",
        "country": "Indonesia",
        "lat": 2.18,
        "lon": 117.65,
        "type": "origin",
        "berth_depth_m": 16.0,
        "max_vessel": "Panamax / Capesize",
    },
    "Mozambique_Nacala": {
        "name": "Port of Nacala (Moatize Met Coal)",
        "country": "Mozambique",
        "lat": -14.54,
        "lon": 40.67,
        "type": "origin",
        "berth_depth_m": 20.0,
        "max_vessel": "Capesize (220,000 DWT)",
    },
    "Russia_Vostochny": {
        "name": "Port of Vostochny (PPK-3)",
        "country": "Russia",
        "lat": 42.74,
        "lon": 133.08,
        "type": "origin",
        "berth_depth_m": 16.5,
        "max_vessel": "Capesize (150,000 DWT)",
    },
    "USA_HamptonRoads": {
        "name": "Hampton Roads (Norfolk / Pier 6)",
        "country": "USA",
        "lat": 36.96,
        "lon": -76.35,
        "type": "origin",
        "berth_depth_m": 16.0,
        "max_vessel": "Capesize (160,000 DWT)",
    },
    "USA_Baltimore": {
        "name": "Port of Baltimore (CNX Marine)",
        "country": "USA",
        "lat": 39.27,
        "lon": -76.58,
        "type": "origin",
        "berth_depth_m": 15.2,
        "max_vessel": "Capesize (140,000 DWT)",
    },

    # Indian Discharge Ports
    "Paradip": {
        "name": "Paradip Port Trust (Deep Draft Iron/Coal Terminal)",
        "country": "India",
        "lat": 20.26,
        "lon": 86.67,
        "type": "destination",
        "max_draft_m": 17.5,
        "max_vessel_dwt": 180000,
        "discharge_tpd": 28000,
    },
    "Visakhapatnam": {
        "name": "Visakhapatnam Port (RINL / Outer Harbour)",
        "country": "India",
        "lat": 17.68,
        "lon": 83.21,
        "type": "destination",
        "max_draft_m": 18.1,
        "max_vessel_dwt": 200000,
        "discharge_tpd": 32000,
    },
    "Dhamra": {
        "name": "Dhamra Port (Adani Deep Water Terminal)",
        "country": "India",
        "lat": 20.80,
        "lon": 86.97,
        "type": "destination",
        "max_draft_m": 18.0,
        "max_vessel_dwt": 180000,
        "discharge_tpd": 30000,
    },
    "Krishnapatnam": {
        "name": "Krishnapatnam Port",
        "country": "India",
        "lat": 14.25,
        "lon": 80.12,
        "type": "destination",
        "max_draft_m": 18.5,
        "max_vessel_dwt": 200000,
        "discharge_tpd": 29000,
    },
    "Haldia": {
        "name": "Haldia Dock Complex (Riverine Draft Limited)",
        "country": "India",
        "lat": 22.02,
        "lon": 88.06,
        "type": "destination",
        "max_draft_m": 8.5,
        "max_vessel_dwt": 45000,
        "discharge_tpd": 12000,
    },
    "Gopalpur": {
        "name": "Gopalpur Port",
        "country": "India",
        "lat": 19.30,
        "lon": 84.97,
        "type": "destination",
        "max_draft_m": 12.5,
        "max_vessel_dwt": 75000,
        "discharge_tpd": 20000,
    },
    "Kakinada": {
        "name": "Kakinada Deep Water Port",
        "country": "India",
        "lat": 16.98,
        "lon": 82.28,
        "type": "destination",
        "max_draft_m": 12.0,
        "max_vessel_dwt": 70000,
        "discharge_tpd": 18000,
    },
    "Jaigad": {
        "name": "JSW Jaigad Port (West Coast)",
        "country": "India",
        "lat": 17.30,
        "lon": 73.20,
        "type": "destination",
        "max_draft_m": 14.5,
        "max_vessel_dwt": 100000,
        "discharge_tpd": 22000,
    },
    "Ennore": {
        "name": "Kamarajar Port (Ennore)",
        "country": "India",
        "lat": 13.26,
        "lon": 80.33,
        "type": "destination",
        "max_draft_m": 16.0,
        "max_vessel_dwt": 150000,
        "discharge_tpd": 25000,
    },
    "Mumbai": {
        "name": "Mumbai Port / JNPT",
        "country": "India",
        "lat": 18.95,
        "lon": 72.95,
        "type": "destination",
        "max_draft_m": 14.0,
        "max_vessel_dwt": 100000,
        "discharge_tpd": 20000,
    },
}

# ── Strategic Maritime Choke Points & Navigational Passages ─────────────────────
MARITIME_CHOKEPOINTS = [
    {
        "id": "torres_strait",
        "name": "Torres Strait (Prince of Wales Channel)",
        "lat": -10.55,
        "lon": 142.15,
        "max_draft_m": 12.2,
        "capesize_restricted": True,
        "description": "Tidal draft restricted (12.2m). Fully laden Capesize must use deep Lombok/Ombai route.",
        "risk_type": "Draft Constraint",
    },
    {
        "id": "malacca_strait",
        "name": "Strait of Malacca (Singapore - One Fathom Bank)",
        "lat": 1.45,
        "lon": 103.00,
        "max_draft_m": 20.5,
        "capesize_restricted": False,
        "description": "Busiest global shipping lane. Traffic Separation Scheme (TSS) & Under-Keel Clearance (UKC) rules apply.",
        "risk_type": "Congestion & Density",
    },
    {
        "id": "lombok_strait",
        "name": "Lombok Strait Deep Water Corridor",
        "lat": -8.75,
        "lon": 115.75,
        "max_draft_m": 150.0,
        "capesize_restricted": False,
        "description": "Primary deep-water (>150m) route for fully loaded Capesize bulk carriers from Australia.",
        "risk_type": "Deep Sea Transit",
    },
    {
        "id": "sunda_strait",
        "name": "Sunda Strait Passage",
        "lat": -5.90,
        "lon": 105.80,
        "max_draft_m": 24.0,
        "capesize_restricted": False,
        "description": "Alternate Indonesian archipelago passage avoiding Singapore Strait congestion.",
        "risk_type": "Volcanic / Current Swells",
    },
    {
        "id": "bob_cyclone_corridor",
        "name": "Bay of Bengal Monsoon Corridor",
        "lat": 15.50,
        "lon": 87.50,
        "max_draft_m": 500.0,
        "capesize_restricted": False,
        "description": "Monsoon swell & cyclonic low-pressure formation zone (June-October & Oct-Dec).",
        "risk_type": "Weather & Wave Swell Risk",
    },
    {
        "id": "mozambique_channel",
        "name": "Mozambique Channel",
        "lat": -18.00,
        "lon": 41.50,
        "max_draft_m": 1000.0,
        "capesize_restricted": False,
        "description": "Agulhas current & southwest swell corridor from South Africa/Mozambique.",
        "risk_type": "Heavy Swells",
    },
    {
        "id": "cape_good_hope",
        "name": "Cape of Good Hope Passage",
        "lat": -34.80,
        "lon": 18.50,
        "max_draft_m": 2000.0,
        "capesize_restricted": False,
        "description": "Atlantic-Indian Ocean junction. Winter storm swells require southern leeway.",
        "risk_type": "Rough Seas / Roaring Forties",
    },
]

# ── Maritime Waypoint Corridors (GeoJSON Nautical Tracks) ───────────────────────
WAYPOINT_CORRIDORS: Dict[str, Dict[str, List[List[float]]]] = {
    # Australia (Hay Point / Gladstone) -> Indian East Coast
    "Australia_EastCoast_Standard": {
        "track": [
            [-21.28, 149.30],  # Hay Point
            [-18.50, 150.50],  # Great Barrier Reef passage
            [-14.50, 145.80],  # Coral Sea
            [-10.55, 142.15],  # Torres Strait
            [-9.80, 135.50],   # Arafura Sea
            [-10.20, 128.00],  # Timor Sea
            [-8.50, 116.00],   # Lombok Approach
            [-5.50, 106.50],   # Java Sea
            [1.25, 103.80],    # Singapore Strait
            [2.88, 101.00],    # Malacca Strait
            [5.80, 95.50],     # Northern Sumatra / Andaman Sea
            [10.50, 90.00],    # Bay of Bengal entry
            [15.50, 87.50],    # Central Bay of Bengal
            [20.26, 86.67],    # Paradip Port
        ]
    },
    "Australia_EastCoast_Capesize_DeepWater": {
        "track": [
            [-21.28, 149.30],  # Hay Point
            [-22.00, 153.00],  # Outer Coral Sea (Deep Water)
            [-16.00, 154.00],  # Coral Sea Deep Passage
            [-10.80, 148.00],  # South of Papua New Guinea
            [-10.50, 130.00],  # Timor Sea Deep Trench
            [-8.75, 115.75],   # Lombok Strait (Deep Water >150m)
            [-9.50, 110.00],   # Indian Ocean South of Java
            [-6.50, 95.00],    # Indian Ocean South of Sumatra (Wide Ocean)
            [6.00, 88.00],     # Bay of Bengal Southern Safe Approach
            [12.00, 85.50],    # Direct Deep Water Approach to East Coast India
            [17.68, 83.21],    # Vizag / Paradip Junction
            [20.26, 86.67],    # Paradip Port
        ]
    },
    "Australia_EastCoast_Monsoon_Safe": {
        "track": [
            [-21.28, 149.30],  # Hay Point
            [-24.00, 154.00],  # Southern Swell Avoidance
            [-15.00, 152.00],  # East Coral Sea
            [-9.00, 130.00],   # Deep Timor Trench
            [-8.75, 115.75],   # Lombok Strait
            [-10.50, 105.00],  # Southern Indian Ocean Corridors
            [2.00, 90.00],     # Equator Crossing
            [8.00, 84.00],     # South of Sri Lanka Corridor
            [14.00, 83.00],    # Western Bay of Bengal Coastal Corridor (Calmer waters)
            [20.26, 86.67],    # Paradip Port
        ]
    },

    # South Africa (Richards Bay) -> India
    "SouthAfrica_Standard": {
        "track": [
            [-28.80, 32.08],  # Richards Bay
            [-24.00, 37.00],  # Mozambique Channel entrance
            [-18.00, 41.50],  # Central Mozambique Channel
            [-12.00, 47.00],  # North of Madagascar
            [-4.00, 58.00],   # Western Indian Ocean
            [4.00, 72.00],    # Arabian Sea / Maldives Crossing
            [8.00, 78.50],    # Cape Comorin (South India)
            [11.00, 82.00],   # Coromandel Coast
            [17.68, 83.21],   # Vizag
            [20.26, 86.67],   # Paradip
        ]
    },

    # Indonesia (Tanjung Bara / Samarinda) -> India
    "Indonesia_Standard": {
        "track": [
            [0.55, 117.63],   # Tanjung Bara
            [-1.50, 117.00],  # Makassar Strait
            [-4.50, 114.50],  # Java Sea
            [1.25, 103.80],   # Singapore Strait
            [2.88, 101.00],   # Malacca Strait
            [5.80, 95.50],    # Andaman Sea
            [12.00, 88.00],   # Central Bay of Bengal
            [20.26, 86.67],   # Paradip
        ]
    },

    # Russia (Vostochny) -> India
    "Russia_Vostochny_Standard": {
        "track": [
            [42.74, 133.08],  # Vostochny
            [35.50, 130.00],  # Sea of Japan
            [33.50, 128.50],  # Tsushima Strait
            [28.00, 124.00],  # East China Sea
            [22.00, 119.50],  # Taiwan Strait
            [12.00, 113.00],  # South China Sea
            [1.25, 103.80],   # Singapore Strait
            [2.88, 101.00],   # Malacca Strait
            [5.80, 95.50],    # Andaman Sea
            [15.50, 87.50],   # Bay of Bengal
            [20.26, 86.67],   # Paradip
        ]
    },

    # USA (Hampton Roads / Baltimore) -> India via Cape of Good Hope
    "USA_HamptonRoads_Standard": {
        "track": [
            [36.96, -76.35],  # Hampton Roads
            [32.00, -65.00],  # North Atlantic
            [15.00, -40.00],  # Mid Atlantic
            [-5.00, -25.00],  # Equatorial Atlantic
            [-22.00, -5.00],  # South Atlantic
            [-34.80, 18.50],  # Cape of Good Hope
            [-32.00, 35.00],  # Agulhas Current
            [-18.00, 45.00],  # Madagascar East Corridor
            [-2.00, 65.00],   # Central Indian Ocean
            [6.00, 80.00],    # South Sri Lanka
            [15.00, 84.00],   # Bay of Bengal
            [20.26, 86.67],   # Paradip
        ]
    }
}


# ── Distance & Geo Calculation Helpers ──────────────────────────────────────────
def haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes Great-Circle Nautical Miles between two lat/lon coordinates."""
    r_nm = 3440.065  # Earth radius in Nautical Miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r_nm * c


def calculate_track_distance_nm(track: List[List[float]]) -> float:
    """Sum total nautical miles along a multi-segment waypoint track."""
    total_dist = 0.0
    for i in range(len(track) - 1):
        total_dist += haversine_distance_nm(
            track[i][0], track[i][1], track[i + 1][0], track[i + 1][1]
        )
    return round(total_dist, 1)


def generate_interpolated_vessel_telemetry(
    track: List[List[float]],
    total_distance_nm: float,
    speed_knots: float = 13.5,
    cargo_tonnes: float = 150000.0,
    cargo_type: str = "Coking Coal (Prime Hard)",
) -> List[Dict[str, Any]]:
    """Generates continuous simulated real-time GPS coordinates along the route."""
    telemetry_points = []
    accumulated_nm = 0.0
    sailing_hours_total = total_distance_nm / speed_knots if speed_knots > 0 else 300.0

    # Linear interpolation between waypoints
    for i in range(len(track) - 1):
        p1 = track[i]
        p2 = track[i + 1]
        seg_dist = haversine_distance_nm(p1[0], p1[1], p2[0], p2[1])
        steps = max(2, int(seg_dist / 60.0))  # 1 telemetry point per ~60 NM

        for s in range(steps):
            frac = s / steps
            lat = p1[0] + (p2[0] - p1[0]) * frac
            lon = p1[1] + (p2[1] - p1[1]) * frac

            # Calculate nautical bearing (heading degrees)
            y = math.sin(math.radians(p2[1] - p1[1])) * math.cos(math.radians(p2[0]))
            x = (math.cos(math.radians(p1[0])) * math.sin(math.radians(p2[0])) -
                 math.sin(math.radians(p1[0])) * math.cos(math.radians(p2[0])) *
                 math.cos(math.radians(p2[1] - p1[1])))
            bearing = (math.degrees(math.atan2(y, x)) + 360) % 360

            cur_nm = accumulated_nm + seg_dist * frac
            pct_complete = min(100.0, round((cur_nm / total_distance_nm) * 100.0, 1))
            hours_elapsed = cur_nm / speed_knots

            telemetry_points.append({
                "index": len(telemetry_points),
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "heading_deg": round(bearing, 1),
                "sog_knots": round(speed_knots + (math.sin(len(telemetry_points)) * 0.4), 1),
                "distance_traveled_nm": round(cur_nm, 1),
                "distance_remaining_nm": round(max(0.0, total_distance_nm - cur_nm), 1),
                "progress_percent": pct_complete,
                "cargo_load": f"{int(cargo_tonnes):,} MT {cargo_type}",
                "hours_from_departure": round(hours_elapsed, 1),
            })
        accumulated_nm += seg_dist

    # Final destination point
    dest = track[-1]
    telemetry_points.append({
        "index": len(telemetry_points),
        "lat": round(dest[0], 4),
        "lon": round(dest[1], 4),
        "heading_deg": 0.0,
        "sog_knots": 0.0,
        "distance_traveled_nm": round(total_distance_nm, 1),
        "distance_remaining_nm": 0.0,
        "progress_percent": 100.0,
        "cargo_load": f"{int(cargo_tonnes):,} MT {cargo_type}",
        "hours_from_departure": round(sailing_hours_total, 1),
    })

    return telemetry_points


# ── Core Safety & Optimal Route Evaluation Engine ──────────────────────────────
def evaluate_maritime_route(
    origin_key: str = "Australia_HayPoint",
    dest_key: str = "Paradip",
    cargo_tonnes: float = 150000.0,
    cargo_type: str = "Coking Coal (Prime Hard)",
    vessel_class: str = "Capesize",
    weather_wave_m: float = 1.8,
    weather_wind_kts: float = 14.0,
    is_cyclone_alert: bool = False,
) -> Dict[str, Any]:
    """
    Evaluates maritime safety, draft restrictions, weather swells, and computes
    Multi-Route GeoJSON geometries (Primary, Optimal-Safe, and Adverse Risk Zone).
    """
    origin_meta = PORT_COORDINATES.get(origin_key, PORT_COORDINATES["Australia_HayPoint"])
    dest_meta = PORT_COORDINATES.get(dest_key, PORT_COORDINATES["Paradip"])

    is_capesize = cargo_tonnes > 120000 or vessel_class.lower() == "capesize"
    has_severe_weather = weather_wave_m > 3.2 or weather_wind_kts > 28.0 or is_cyclone_alert

    # 1. Determine Waypoint Tracks
    if "Australia" in origin_key:
        if has_severe_weather:
            active_track_key = "Australia_EastCoast_Monsoon_Safe"
            safety_reason = "Adverse Monsoon Swells detected in central Bay of Bengal (>3.2m waves). Safe Southern Arc Corridor enforced."
            route_mode = "MONSOON WEATHER AVOIDANCE (Deep Arc)"
        elif is_capesize:
            active_track_key = "Australia_EastCoast_Capesize_DeepWater"
            safety_reason = "Capesize draft constraint (>16.5m). Enforced deep-water Lombok Strait corridor (avoiding Torres Strait 12.2m limit)."
            route_mode = "DEEP-WATER DRAFT COMPLIANT (Lombok Corridor)"
        else:
            active_track_key = "Australia_EastCoast_Standard"
            safety_reason = "Standard commercial transit via Malacca Strait."
            route_mode = "STANDARD COMMERCIAL PASSAGE"
    elif "SouthAfrica" in origin_key or "Mozambique" in origin_key:
        active_track_key = "SouthAfrica_Standard"
        safety_reason = "Trans-Indian Ocean shipping lane via Mozambique Channel."
        route_mode = "TRANS-INDIAN OCEAN BULK HIGHWAY"
    elif "Indonesia" in origin_key:
        active_track_key = "Indonesia_Standard"
        safety_reason = "Makassar & Malacca Strait direct passage."
        route_mode = "ASEAN MARITIME CORRIDOR"
    elif "Russia" in origin_key:
        active_track_key = "Russia_Vostochny_Standard"
        safety_reason = "Sea of Japan, Taiwan Strait & Malacca Straits transit."
        route_mode = "NORTH PACIFIC - MALACCA HIGHWAY"
    else:
        active_track_key = "USA_HamptonRoads_Standard"
        safety_reason = "Atlantic Cape of Good Hope long-haul bulk route."
        route_mode = "GLOBAL CAPE TRANSIT"

    # Base track points
    optimal_track = list(WAYPOINT_CORRIDORS.get(active_track_key, WAYPOINT_CORRIDORS["Australia_EastCoast_Standard"])["track"])
    
    # Adjust track origin and destination exact port coordinates
    optimal_track[0] = [origin_meta["lat"], origin_meta["lon"]]
    optimal_track[-1] = [dest_meta["lat"], dest_meta["lon"]]

    # Standard Primary (Default) Track
    primary_track = list(WAYPOINT_CORRIDORS.get("Australia_EastCoast_Standard" if "Australia" in origin_key else active_track_key)["track"])
    primary_track[0] = [origin_meta["lat"], origin_meta["lon"]]
    primary_track[-1] = [dest_meta["lat"], dest_meta["lon"]]

    # High-Risk / Adverse Route Track (e.g. shallow Torres Strait or direct Storm Zone)
    risk_zone_track = [
        [-10.55, 142.15],  # Torres Strait
        [1.25, 103.80],    # Malacca
        [15.50, 87.50],    # Bay of Bengal Storm Zone
        [dest_meta["lat"], dest_meta["lon"]]
    ]

    # Metrics computation
    total_distance_nm = calculate_track_distance_nm(optimal_track)
    avg_speed_knots = 13.5 if is_capesize else 14.2
    sailing_days = round(total_distance_nm / (avg_speed_knots * 24.0), 1)

    # Fuel burn calculation (VLSFO in Metric Tonnes)
    bunker_rate_tpd = 42.0 if is_capesize else 28.0
    total_fuel_vlsfo_mt = round(sailing_days * bunker_rate_tpd, 1)

    # Safety Rating Calculation (0 - 100)
    safety_score = 96
    if has_severe_weather:
        safety_score -= 8
    if is_capesize and "Torres" in active_track_key:
        safety_score -= 35
    if dest_meta.get("max_draft_m", 18.0) < 13.0 and is_capesize:
        safety_score -= 20  # Port draft incompatibility warning

    safety_score = max(40, min(99, safety_score))

    # Demurrage Risk Level Assessment
    dest_congestion = dest_meta.get("congestion_status", "Low")
    if dest_meta.get("max_draft_m", 18.0) < 12.0 and is_capesize:
        demurrage_risk = "CRITICAL (Lightering / Transshipment Required)"
        demurrage_color = "#EF4444"
    elif has_severe_weather:
        demurrage_risk = "MODERATE (+0.5 Days Monsoon Swell Delay)"
        demurrage_color = "#F59E0B"
    else:
        demurrage_risk = "LOW (Calm Berthing Window)"
        demurrage_color = "#10B981"

    # Generate Real-Time Continuous GPS Telemetry Points
    vessel_telemetry = generate_interpolated_vessel_telemetry(
        track=optimal_track,
        total_distance_nm=total_distance_nm,
        speed_knots=avg_speed_knots,
        cargo_tonnes=cargo_tonnes,
        cargo_type=cargo_type,
    )

    # Chokepoints relevant to this route
    relevant_chokepoints = []
    for cp in MARITIME_CHOKEPOINTS:
        # Check proximity to any waypoint in track
        is_relevant = any(haversine_distance_nm(cp["lat"], cp["lon"], wp[0], wp[1]) < 600 for wp in optimal_track)
        if is_relevant:
            cp_status = "SAFE"
            if cp["id"] == "torres_strait" and is_capesize:
                cp_status = "AVOIDED (Draft Restriction)"
            elif cp["id"] == "bob_cyclone_corridor" and has_severe_weather:
                cp_status = "WARNING (Heavy Swells)"
            
            relevant_chokepoints.append({
                **cp,
                "status": cp_status
            })

    return {
        "status": "success",
        "route_mode": route_mode,
        "safety_reason": safety_reason,
        "metrics": {
            "total_distance_nm": total_distance_nm,
            "estimated_sailing_days": sailing_days,
            "vessel_class": vessel_class,
            "average_sog_knots": avg_speed_knots,
            "total_fuel_vlsfo_mt": total_fuel_vlsfo_mt,
            "safety_score_percent": safety_score,
            "demurrage_risk_level": demurrage_risk,
            "demurrage_color": demurrage_color,
            "cargo_tonnes": cargo_tonnes,
            "cargo_type": cargo_type,
        },
        "origin_port": {
            "key": origin_key,
            **origin_meta
        },
        "destination_port": {
            "key": dest_key,
            **dest_meta
        },
        "geojson": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Optimal Weather-Safe Route",
                        "color": "#10B981",
                        "style": "solid",
                        "weight": 4,
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[p[1], p[0]] for p in optimal_track],
                    }
                },
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Standard Marine Track",
                        "color": "#0284C7",
                        "style": "dashed",
                        "weight": 2.5,
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[p[1], p[0]] for p in primary_track],
                    }
                },
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Adverse Weather / Choke Risk Zone",
                        "color": "#EF4444",
                        "style": "dashed",
                        "weight": 2,
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[p[1], p[0]] for p in risk_zone_track],
                    }
                }
            ]
        },
        "chokepoints": relevant_chokepoints,
        "telemetry_points": vessel_telemetry,
    }
