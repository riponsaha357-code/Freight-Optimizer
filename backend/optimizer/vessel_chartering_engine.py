from typing import Dict, Any, List

# Port Draft and Demurrage Specifications for India Discharge Ports
PORT_SPECS = {
    "Paradip": {
        "max_draft_m": 17.5,
        "max_vessel_dwt": 180000,
        "avg_wait_days": 3.5,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 28000,
        "congestion_status": "Moderate",
        "transshipment_needed": False,
        "queue_vessels": 12,
        "weather_risk": "Moderate (Monsoon Buffer)",
    },
    "Visakhapatnam": {
        "max_draft_m": 18.1,
        "max_vessel_dwt": 200000,
        "avg_wait_days": 2.0,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 32000,
        "congestion_status": "Low",
        "transshipment_needed": False,
        "queue_vessels": 6,
        "weather_risk": "Low",
    },
    "Dhamra": {
        "max_draft_m": 18.0,
        "max_vessel_dwt": 180000,
        "avg_wait_days": 1.2,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 30000,
        "congestion_status": "Low",
        "transshipment_needed": False,
        "queue_vessels": 3,
        "weather_risk": "Low",
    },
    "Krishnapatnam": {
        "max_draft_m": 18.5,
        "max_vessel_dwt": 200000,
        "avg_wait_days": 1.5,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 29000,
        "congestion_status": "Low",
        "transshipment_needed": False,
        "queue_vessels": 4,
        "weather_risk": "Low",
    },
    "Haldia": {
        "max_draft_m": 8.5,
        "max_vessel_dwt": 45000,
        "avg_wait_days": 4.8,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 12000,
        "congestion_status": "High",
        "transshipment_needed": True,
        "queue_vessels": 16,
        "weather_risk": "High (Tidal/Siltation)",
    },
    "Gopalpur": {
        "max_draft_m": 12.5,
        "max_vessel_dwt": 75000,
        "avg_wait_days": 2.2,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 20000,
        "congestion_status": "Low",
        "transshipment_needed": False,
        "queue_vessels": 5,
        "weather_risk": "Moderate",
    },
    "Kakinada": {
        "max_draft_m": 12.0,
        "max_vessel_dwt": 70000,
        "avg_wait_days": 2.5,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 18000,
        "congestion_status": "Low",
        "transshipment_needed": False,
        "queue_vessels": 7,
        "weather_risk": "Low",
    },
    "Jaigad": {
        "max_draft_m": 14.5,
        "max_vessel_dwt": 100000,
        "avg_wait_days": 1.0,
        "daily_demurrage_usd": 25000,
        "discharge_rate_tpd": 22000,
        "congestion_status": "Low",
        "transshipment_needed": False,
        "queue_vessels": 2,
        "weather_risk": "Low",
    },
}

VESSEL_CLASSES = [
    {
        "class": "Capesize",
        "capacity_dwt": 160000,
        "draft_m": 17.2,
        "base_rate_multiplier": 1.0,  # Most economical per tonne
        "daily_hire_rate": 24000,
        "bunker_consumption_tpd": 42,
    },
    {
        "class": "Panamax",
        "capacity_dwt": 75000,
        "draft_m": 13.8,
        "base_rate_multiplier": 1.16,
        "daily_hire_rate": 15500,
        "bunker_consumption_tpd": 28,
    },
    {
        "class": "Supramax",
        "capacity_dwt": 55000,
        "draft_m": 11.2,
        "base_rate_multiplier": 1.28,
        "daily_hire_rate": 13000,
        "bunker_consumption_tpd": 22,
    },
    {
        "class": "Handymax",
        "capacity_dwt": 35000,
        "draft_m": 8.4,
        "base_rate_multiplier": 1.42,
        "daily_hire_rate": 10500,
        "bunker_consumption_tpd": 16,
    },
]


VESSEL_SPECS_MAP = {
    "Gargantua (209,529 DWT)": {"draft_m": 18.5, "dwt": 209529, "class": "Newcastlemax"},
    "Goliath (209,537 DWT)": {"draft_m": 18.4, "dwt": 209537, "class": "Newcastlemax"},
    "Cape Destiny (180,000 DWT)": {"draft_m": 17.8, "dwt": 180000, "class": "Capesize"},
    "Oldendorff Friedrich (208,000 DWT)": {"draft_m": 18.3, "dwt": 208000, "class": "Newcastlemax"},
    "Berge Athene (225,200 DWT)": {"draft_m": 18.5, "dwt": 225200, "class": "Newcastlemax"},
    "Golden Confidence (180,000 DWT)": {"draft_m": 17.5, "dwt": 180000, "class": "Capesize"},
    "Star Gina 2GR (209,475 DWT)": {"draft_m": 18.4, "dwt": 209475, "class": "Newcastlemax"},
    "Navios Happiness (180,000 DWT)": {"draft_m": 17.6, "dwt": 180000, "class": "Capesize"},
}


def run_charter_optimization(
    cargo_type: str,
    cargo_tonnes: float,
    origin_country: str,
    destination_port: str,
    lead_time_days: int,
    base_forecast_rate: float,
    rate_trend_direction: str = "rising",
    vessel_name: str = None,
    speed_mode: str = "normal",
) -> Dict[str, Any]:
    port_info = PORT_SPECS.get(destination_port, PORT_SPECS["Paradip"])
    port_max_draft = port_info["max_draft_m"]

    # 1. Determine optimal vessel class given cargo size & port draft
    chosen_vessel = None
    draft_warning = None
    lightering_cost = 0.0

    for v in VESSEL_CLASSES:
        if cargo_tonnes >= (v["capacity_dwt"] * 0.75):
            chosen_vessel = v
            break

    if not chosen_vessel:
        chosen_vessel = VESSEL_CLASSES[-1]

    vessel_draft = chosen_vessel["draft_m"]
    vessel_dwt = chosen_vessel["capacity_dwt"]
    vessel_label = f"{chosen_vessel['class']} ({chosen_vessel['capacity_dwt']:,} DWT)"

    if vessel_name and vessel_name in VESSEL_SPECS_MAP:
        v_spec = VESSEL_SPECS_MAP[vessel_name]
        vessel_draft = v_spec["draft_m"]
        vessel_dwt = v_spec["dwt"]
        vessel_label = vessel_name

    # Calculate actual operating draft based on nominated cargo volume (TPC ~11,500 MT / 1.0m draft)
    draft_reduction = max(0.0, (vessel_dwt - cargo_tonnes) / 11500.0)
    operating_draft = round(max(5.0, vessel_draft - draft_reduction), 1)

    # Draft Constraint Evaluation: Evaluate OPERATING DRAFT against port max draft limit
    if operating_draft > port_max_draft:
        excess_draft = round(operating_draft - port_max_draft, 1)
        lightering_cost = round(cargo_tonnes * 4.50, 2)
        if port_info["transshipment_needed"]:
            draft_warning = (
                f"ALERT: {destination_port} has an {port_max_draft}m draft restriction. Vessel {vessel_label} "
                f"operating draft ({operating_draft}m draft, +{excess_draft}m excess) cannot berth directly. Recommendation: Lighter "
                f"at Dhamra or Krishnapatnam deep-water anchorage, then transship by coastal barge."
            )
        else:
            draft_warning = (
                f"ALERT: {destination_port} max draft ({port_max_draft}m) is exceeded by {vessel_label} "
                f"operating draft ({operating_draft}m draft, +{excess_draft}m excess). Anchorage lightering or cargo intake reduction required."
            )

    # 2. Freight Cost Calculation
    effective_rate_per_tonne = round(
        base_forecast_rate * chosen_vessel["base_rate_multiplier"], 2
    )
    ocean_freight_usd = round(cargo_tonnes * effective_rate_per_tonne, 2)

    # Speed & Fuel Engine: Normal (14.0 kts / 55 TPD) vs Eco-Speed (11.0 kts / 32 TPD)
    is_eco = (speed_mode == "eco")
    normal_bunker_usd = round(ocean_freight_usd * 0.275, 2)
    bunker_cost_usd = round(normal_bunker_usd * (32.0 * 14.0 / (55.0 * 11.0)), 2) if is_eco else normal_bunker_usd

    # Route Transit & Carbon Tax Calculation (EU ETS / IMO @ $85/tonne CO2, 1t VLSFO = 3.114t CO2)
    standard_days = 16.5
    extra_days = round(standard_days * (14.0 / 11.0 - 1.0), 1)
    normal_fuel_mt = round(standard_days * 55.0, 1)
    eco_fuel_mt = round((standard_days + extra_days) * 32.0, 1)
    current_fuel_mt = eco_fuel_mt if is_eco else normal_fuel_mt

    carbon_tax_usd = round(current_fuel_mt * 3.114 * 85.0, 2)
    normal_carbon_tax = round(normal_fuel_mt * 3.114 * 85.0, 2)
    eco_carbon_tax = round(eco_fuel_mt * 3.114 * 85.0, 2)

    bunker_savings = max(0.0, normal_bunker_usd - bunker_cost_usd)
    carbon_tax_savings = max(0.0, normal_carbon_tax - eco_carbon_tax)
    total_eco_savings = round(bunker_savings + carbon_tax_savings, 2)

    # 3. Demurrage Risk Exposure
    expected_wait_days = port_info["avg_wait_days"]
    demurrage_risk_usd = round(
        expected_wait_days * port_info["daily_demurrage_usd"], 2
    )

    # 4. Total CIF Landed Freight Cost
    total_landed_freight_cost = (
        ocean_freight_usd + bunker_cost_usd + demurrage_risk_usd + carbon_tax_usd + lightering_cost
    )

    # 5. Charter Contract Strategy Advisory
    if rate_trend_direction == "rising" and lead_time_days >= 30:
        recommended_strategy = "Period / Time Charter (3-6 Months)"
        action_advisory = (
            f"Forward rates show a +{(base_forecast_rate*0.11):.2f} $/MT upward pressure. Lock in a "
            f"Short-term Period Charter now to insulate against Baltic index surges."
        )
        savings_pct = 11.8
    elif rate_trend_direction == "falling":
        recommended_strategy = "Spot Market Charter (Prompt Window)"
        action_advisory = (
            "Ocean freight rates are softening over the next 30-45 days. Procure on the spot charter "
            "market 7-10 days prior to laycan window to capture discounted fixtures."
        )
        savings_pct = 7.4
    else:
        recommended_strategy = "Contract of Affreightment (COA) / Spot Blend"
        action_advisory = (
            "Split procurement: secure 60% volume via index-linked COA and float 40% on spot fixtures."
        )
        savings_pct = 9.2

    benchmark_unoptimized_cost = round(
        total_landed_freight_cost * (1 + (savings_pct / 100)), 2
    )
    projected_savings_usd = round(
        benchmark_unoptimized_cost - total_landed_freight_cost, 2
    )

    return {
        "vessel_recommended": f"{chosen_vessel['class']} ({chosen_vessel['capacity_dwt']:,} DWT)",
        "vessel_draft_m": chosen_vessel["draft_m"],
        "port_max_draft_m": port_max_draft,
        "draft_status": "Compatible"
        if not draft_warning
        else "Draft Restriction / Anchorage Lightering",
        "draft_warning": draft_warning,
        "recommended_strategy": recommended_strategy,
        "action_advisory": action_advisory,
        "rate_per_tonne_usd": effective_rate_per_tonne,
        "ocean_freight_usd": ocean_freight_usd,
        "bunker_fuel_cost_usd": bunker_cost_usd,
        "carbon_tax_usd": carbon_tax_usd,
        "demurrage_risk_usd": demurrage_risk_usd,
        "lightering_cost_usd": lightering_cost,
        "total_landed_freight_cost_usd": total_landed_freight_cost,
        "benchmark_unoptimized_cost_usd": benchmark_unoptimized_cost,
        "projected_savings_usd": projected_savings_usd,
        "projected_savings_pct": f"{savings_pct}%",
        "port_congestion": port_info["congestion_status"],
        "port_avg_wait_days": expected_wait_days,
        "speed_mode": speed_mode,
        "is_eco_speed": is_eco,
        "extra_transit_days": extra_days if is_eco else 0.0,
        "saved_fuel_mt": round(normal_fuel_mt - eco_fuel_mt, 1) if is_eco else 0.0,
        "total_eco_savings_usd": total_eco_savings if is_eco else 0.0,
    }
