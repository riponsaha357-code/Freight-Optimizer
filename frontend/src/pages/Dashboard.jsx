import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Ship, TrendingUp, Anchor, AlertTriangle, ShieldCheck, 
  DollarSign, ArrowRight, Compass, Gauge, Clock, 
  CheckCircle2, AlertOctagon, HelpCircle, Layers,
  User, LogOut, Lock, Key, Building, X, UserPlus, Info, Calendar,
  Cloud, CloudRain, Sun, Wind, CloudLightning, Waves, RefreshCw, Leaf, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, AreaChart, Area 
} from 'recharts';
import VesselTrackerMap from '../components/VesselTrackerMap';
import { useLiveExchangeRate } from '../hooks/useLiveExchangeRate';

// Authentic Metallurgical & Energy Bulk Cargo Grades (15 Types)
const CARGO_GRADES = [
  "Coking Coal (Prime Hard)",
  "Semi-Soft Coking Coal (SSCC)",
  "PCI Coal (Pulverized Injection)",
  "Thermal Coal (Steam Coal)",
  "Anthracite Coal",
  "Petcoke (Petroleum Coke)",
  "Iron Ore Fines (Sinter Feed)",
  "Iron Ore Lump (Direct Charge)",
  "Iron Ore Pellets / Direct Charge",
  "DRI / HBI (Hot Briquetted Iron)",
  "Limestone / Flux Mineral",
  "Dolomite / Calcined Flux",
  "Bauxite (Aluminum Ore)",
  "Ferro Alloys / Chrome",
  "Steel Scrap (HMS 1&2)"
];

// Active Capesize & Newcastlemax Dry Bulk Carrier Vessel Fleet (8 Vessels)
const VESSEL_OPTIONS = [
  "Gargantua (209,529 DWT)",
  "Goliath (209,537 DWT)",
  "Cape Destiny (180,000 DWT)",
  "Oldendorff Friedrich (208,000 DWT)",
  "Berge Athene (225,200 DWT)",
  "Golden Confidence (180,000 DWT)",
  "Star Gina 2GR (209,475 DWT)",
  "Navios Happiness (180,000 DWT)"
];

// Precision Metadata for Port Draft Feasibility & Safety Check
const VESSEL_METADATA = {
  "Gargantua (209,529 DWT)": { name: "Gargantua", dwt: 209529, draft_m: 18.5, type: "Newcastlemax" },
  "Goliath (209,537 DWT)": { name: "Goliath", dwt: 209537, draft_m: 18.4, type: "Newcastlemax" },
  "Cape Destiny (180,000 DWT)": { name: "Cape Destiny", dwt: 180000, draft_m: 17.8, type: "Capesize" },
  "Oldendorff Friedrich (208,000 DWT)": { name: "Oldendorff Friedrich", dwt: 208000, draft_m: 18.3, type: "Newcastlemax" },
  "Berge Athene (225,200 DWT)": { name: "Berge Athene", dwt: 225200, draft_m: 18.5, type: "Newcastlemax" },
  "Golden Confidence (180,000 DWT)": { name: "Golden Confidence", dwt: 180000, draft_m: 17.5, type: "Capesize" },
  "Star Gina 2GR (209,475 DWT)": { name: "Star Gina 2GR", dwt: 209475, draft_m: 18.4, type: "Newcastlemax" },
  "Navios Happiness (180,000 DWT)": { name: "Navios Happiness", dwt: 180000, draft_m: 17.6, type: "Capesize" }
};

const PORT_METADATA = {
  "Paradip": { name: "Paradip Port", max_draft_m: 17.5, max_dwt: 180000, avg_wait_days: 3.5, queue_vessels: 12, daily_demurrage_usd: 25000, congestion_risk: "Moderate", weather_risk: "Moderate (Monsoon Buffer)" },
  "Visakhapatnam": { name: "Visakhapatnam (Vizag)", max_draft_m: 18.1, max_dwt: 200000, avg_wait_days: 2.0, queue_vessels: 6, daily_demurrage_usd: 25000, congestion_risk: "Low", weather_risk: "Low" },
  "Dhamra": { name: "Dhamra Port", max_draft_m: 18.0, max_dwt: 180000, avg_wait_days: 1.2, queue_vessels: 3, daily_demurrage_usd: 25000, congestion_risk: "Low", weather_risk: "Low" },
  "Krishnapatnam": { name: "Krishnapatnam Port", max_draft_m: 18.5, max_dwt: 200000, avg_wait_days: 1.5, queue_vessels: 4, daily_demurrage_usd: 25000, congestion_risk: "Low", weather_risk: "Low" },
  "Haldia": { name: "Haldia Dock Complex", max_draft_m: 8.5, max_dwt: 45000, avg_wait_days: 4.8, queue_vessels: 16, daily_demurrage_usd: 25000, congestion_risk: "High", weather_risk: "High (Tidal/Siltation)" },
  "Gopalpur": { name: "Gopalpur Port", max_draft_m: 12.5, max_dwt: 75000, avg_wait_days: 2.2, queue_vessels: 5, daily_demurrage_usd: 25000, congestion_risk: "Low", weather_risk: "Moderate" },
  "Kakinada": { name: "Kakinada Deepwater Port", max_draft_m: 12.0, max_dwt: 70000, avg_wait_days: 2.5, queue_vessels: 7, daily_demurrage_usd: 25000, congestion_risk: "Low", weather_risk: "Low" },
  "Jaigad": { name: "Jaigad / Mormugao Port", max_draft_m: 14.5, max_dwt: 100000, avg_wait_days: 1.0, queue_vessels: 2, daily_demurrage_usd: 25000, congestion_risk: "Low", weather_risk: "Low" }
};

// Overseas Maritime Route Standard Transit Specifications
const ROUTE_TRANSIT_METADATA = {
  "Australia_HayPoint": { distance_nm: 4650, transit_days: 16.5 },
  "Australia_Gladstone": { distance_nm: 4720, transit_days: 16.8 },
  "Australia_Newcastle": { distance_nm: 4950, transit_days: 17.6 },
  "SouthAfrica_RichardsBay": { distance_nm: 4920, transit_days: 17.5 },
  "Indonesia_TanjungBara": { distance_nm: 2410, transit_days: 8.2 },
  "Indonesia_MuaraPantai": { distance_nm: 2350, transit_days: 8.0 },
  "Mozambique_Nacala": { distance_nm: 4450, transit_days: 15.8 },
  "Russia_Vostochny": { distance_nm: 5100, transit_days: 18.2 },
  "USA_HamptonRoads": { distance_nm: 8400, transit_days: 38.0 },
  "USA_Baltimore": { distance_nm: 8550, transit_days: 38.8 },
};

// Coordinates & Fallbacks for 5 Key Maritime Locations
const WEATHER_LOCATIONS = [
  { id: "paradip", name: "Paradip Port", lat: 20.26, lon: 86.67, fallbackTemp: 29, fallbackWind: 14, fallbackWave: 1.8 },
  { id: "vizag", name: "Visakhapatnam (Vizag)", lat: 17.68, lon: 83.21, fallbackTemp: 31, fallbackWind: 11, fallbackWave: 1.4 },
  { id: "dhamra", name: "Dhamra Anchorage", lat: 20.80, lon: 86.97, fallbackTemp: 28, fallbackWind: 18, fallbackWave: 2.2 },
  { id: "bay_of_bengal", name: "Bay of Bengal Corridor", lat: 15.00, lon: 88.00, fallbackTemp: 27, fallbackWind: 24, fallbackWave: 2.9 },
  { id: "malacca", name: "Malacca Strait Passage", lat: 2.50, lon: 101.50, fallbackTemp: 30, fallbackWind: 8, fallbackWave: 0.9 },
];

// Dynamic Weather Impact Calculation Helper
const calculateWeatherImpact = (tempC, windKts, waveM) => {
  if (waveM < 1.5 && windKts < 15) {
    return {
      status: "Clear / Favorable",
      condition: "Calm Seas",
      delay_impact: "Normal Ops / Calm Berthing",
      alert: false,
      badgeColor: "bg-emerald-50 text-[#16A34A] border border-emerald-200",
      icon: "sun"
    };
  } else if (waveM <= 2.5 || windKts <= 22) {
    return {
      status: "Moderate Swell",
      condition: "Breezy / Choppy",
      delay_impact: "Minor Chop / Caution",
      alert: false,
      badgeColor: "bg-sky-50 text-[#0EA5E9] border border-sky-200",
      icon: "wind"
    };
  } else {
    return {
      status: "Monsoon Swell Warning",
      condition: "Heavy Swells",
      delay_impact: "+0.5 Days Transit Delay",
      alert: true,
      badgeColor: "bg-amber-50 text-[#F97316] border border-amber-200",
      icon: "cloud-lightning"
    };
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [routesMeta, setRoutesMeta] = useState({});
  const [ports, setPorts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [selectedRouteKey, setSelectedRouteKey] = useState("Australia_HayPoint");
  
  // Forecast Horizon Filter State ('7', '14', '30', '60')
  const [forecastHorizon, setForecastHorizon] = useState('30');

  // Live Weather Feed State & Background Refresh Loop
  const [weatherFeed, setWeatherFeed] = useState([]);
  const [weatherUpdating, setWeatherUpdating] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);

  const [formData, setFormData] = useState({
    cargo_type: "Coking Coal (Prime Hard)",
    cargo_tonnes: 150000,
    origin_country: "Australia_HayPoint",
    destination_port: "Paradip",
    lead_time_days: 30
  });

  const [optimization, setOptimization] = useState(null);
  const [routeIntelligence, setRouteIntelligence] = useState(null);
  const [routeMapData, setRouteMapData] = useState(null);
  const [routeMapLoading, setRouteMapLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Dynamic user profile state loaded from JWT / localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("navi_steel_user");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const token = localStorage.getItem("navi_steel_token") || localStorage.getItem("token");

  // Helper for authenticated API calls with JWT Bearer Token
  const fetchApi = async (method, path, data = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (method === 'get') {
      return await axios.get(path, { headers });
    } else {
      return await axios.post(path, data, { headers });
    }
  };

  const isDemo = Boolean(user.is_demo || user.isDemoMode);

  // Live Open-Meteo Weather Fetching Logic
  const fetchLiveWeather = async () => {
    setWeatherUpdating(true);
    try {
      const updatedFeed = await Promise.all(
        WEATHER_LOCATIONS.map(async (loc) => {
          try {
            const res = await axios.get(
              `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`,
              { timeout: 5000 }
            );
            const cw = res.data?.current_weather;
            if (cw) {
              const temp_c = Math.round(cw.temperature);
              const wind_kts = Math.round(cw.windspeed * 0.539957); // km/h to knots
              const wave_m = Number((wind_kts * 0.11 + 0.3).toFixed(1));
              const impact = calculateWeatherImpact(temp_c, wind_kts, wave_m);

              return {
                location: loc.name,
                temp_c,
                wind_kts,
                wave_m,
                ...impact
              };
            }
          } catch (e) {
            // Silently fall back to location default if single fetch fails
          }
          
          const impact = calculateWeatherImpact(loc.fallbackTemp, loc.fallbackWind, loc.fallbackWave);
          return {
            location: loc.name,
            temp_c: loc.fallbackTemp,
            wind_kts: loc.fallbackWind,
            wave_m: loc.fallbackWave,
            ...impact
          };
        })
      );

      setWeatherFeed(updatedFeed);
      setLastWeatherUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Live weather fetch failed, using realistic fallback:", err);
    } finally {
      setWeatherUpdating(false);
    }
  };

  useEffect(() => {
    // Health check
    axios.get('/api/health')
      .then(() => setBackendStatus("Online"))
      .catch(() => setBackendStatus("Offline"));

    // Verify & populate user profile dynamically from JWT session (/api/auth/me)
    if (token) {
      fetchApi('get', '/api/auth/me')
        .then(res => {
          if (res.data) {
            const isDemoUser = Boolean(res.data.is_demo || res.data.isDemoMode);
            const profileData = {
              email: res.data.sub || res.data.email,
              name: res.data.name || 'Official User',
              role: res.data.role || 'Logistics Officer',
              organization: res.data.organization || 'Ministry of Steel',
              avatar: res.data.avatar || (res.data.name ? res.data.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'US'),
              is_demo: isDemoUser,
              isDemoMode: isDemoUser,
            };
            setUser(profileData);
            localStorage.setItem("navi_steel_user", JSON.stringify(profileData));
          }
        })
        .catch(err => {
          if (err.response?.status === 401) {
            handleLogout();
          }
        });
    }

    // Routes metadata
    fetchApi('get', '/api/routes-meta')
      .then(res => setRoutesMeta(res.data))
      .catch(err => console.error(err));

    // Indian ports status
    fetchApi('get', '/api/ports-status')
      .then(res => setPorts(res.data))
      .catch(err => console.error(err));

    // Live weather initial fetch & 5-minute background refresh loop (300,000 ms)
    fetchLiveWeather();
    const weatherInterval = setInterval(() => {
      fetchLiveWeather();
    }, 300000);

    // Initial trend load & initial run optimization & route tracking map
    fetchTrends("Australia_HayPoint");
    runOptimization("Australia_HayPoint", "Paradip", 150000, 30);
    fetchRouteMap("Australia_HayPoint", "Paradip", 150000, "Coking Coal (Prime Hard)");

    return () => clearInterval(weatherInterval);
  }, []);

  const fetchTrends = (routeKey) => {
    fetchApi('get', `/api/forecast-trends?origin=${routeKey}`)
      .then(res => setTrends(res.data.series || []))
      .catch(err => console.error(err));
  };

  const fetchRouteMap = async (origin, destination, tonnes, cargo, vessel) => {
    setRouteMapLoading(true);
    try {
      const orig = origin || formData.origin_country;
      const dest = destination || formData.destination_port;
      const t = tonnes || formData.cargo_tonnes;
      const c = cargo || formData.cargo_type;
      const v = vessel || (Number(t) > 120000 ? "Capesize" : "Panamax");

      const res = await fetchApi('post', '/api/calculate-safe-route', {
        origin_country: orig,
        destination_port: dest,
        cargo_tonnes: Number(t),
        cargo_type: c,
        vessel_class: v,
        weather_wave_m: 1.8,
        weather_wind_kts: 14.0,
        is_cyclone_alert: false,
      });
      if (res.data) {
        setRouteMapData(res.data);
      }
    } catch (err) {
      console.error("Failed to load AIS route map:", err);
    } finally {
      setRouteMapLoading(false);
    }
  };

  const runOptimization = async (origin, destination, tonnes, leadTime) => {
    if (isDemo && loading) return;

    setLoading(true);
    try {
      const orig = origin || formData.origin_country;
      const dest = destination || formData.destination_port;
      const t = tonnes || formData.cargo_tonnes;
      const lt = leadTime || formData.lead_time_days;

      const payload = {
        cargo_type: formData.cargo_type,
        cargo_tonnes: t,
        origin_country: orig,
        destination_port: dest,
        lead_time_days: lt,
        vessel_name: selectedVessel,
        speed_mode: speedMode
      };
      const res = await fetchApi('post', '/api/optimize-procurement', payload);
      setOptimization(res.data.optimization);
      setRouteIntelligence(res.data.route_intelligence);

      // Trigger synchronized Route Tracking Map update
      fetchRouteMap(orig, dest, t, formData.cargo_type, selectedVessel);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizerClick = () => {
    if (isDemo) {
      setShowDemoModal(true);
    } else {
      runOptimization();
    }
  };

  const handleRouteChange = (routeKey) => {
    if (isDemo) {
      setShowDemoModal(true);
      return;
    }
    setSelectedRouteKey(routeKey);
    setFormData(prev => ({ ...prev, origin_country: routeKey }));
    fetchTrends(routeKey);
  };

  const handleLogout = () => {
    localStorage.removeItem("navi_steel_token");
    localStorage.removeItem("token");
    localStorage.removeItem("navi_steel_user");
    navigate('/login');
  };

  // FX Live Exchange Rate Custom Hook Integration
  const { 
    selectedCurrency, 
    setSelectedCurrency, 
    rates, 
    currentRate, 
    formatCurrency, 
    loading: fxLoading 
  } = useLiveExchangeRate();

  // Active Capesize vessel selection state
  const [selectedVessel, setSelectedVessel] = useState("Gargantua (209,529 DWT)");

  // Eco-Speed Mode Toggle State ('normal' | 'eco')
  const [speedMode, setSpeedMode] = useState('normal');

  // Filter trends based on selected horizon (starting from TODAY's date)
  const activeSeries = (trends || []).slice(0, Number(forecastHorizon));
  const todayFormatted = activeSeries.length > 0 ? activeSeries[0].date : new Date().toISOString().split('T')[0];

  // Dynamic financial totals calculation based on active series average rates & Eco-Speed carbon formulas
  const financialTotals = useMemo(() => {
    const tonnes = Number(formData.cargo_tonnes) || 150000;
    let avgRate = 16.80;

    if (activeSeries && activeSeries.length > 0) {
      const totalRate = activeSeries.reduce((sum, item) => sum + (item.rate || 16.80), 0);
      avgRate = totalRate / activeSeries.length;
    } else if (optimization?.rate_per_tonne_usd) {
      avgRate = optimization.rate_per_tonne_usd;
    }

    const baseOceanFreight = Math.round(tonnes * avgRate);
    
    // Real-World Maritime Speed & Fuel Engine (Cubic Law: 14 kts @ 55 TPD vs 11 kts @ 32 TPD)
    const routeMeta = ROUTE_TRANSIT_METADATA[formData.origin_country] || ROUTE_TRANSIT_METADATA["Australia_HayPoint"];
    const standardVoyageDays = routeMeta.transit_days || 16.5;
    const extraTransitDays = Number((standardVoyageDays * (14.0 / 11.0 - 1.0)).toFixed(1));
    const ecoVoyageDays = Number((standardVoyageDays + extraTransitDays).toFixed(1));

    const normalTotalFuelMT = Math.round(standardVoyageDays * 55);
    const ecoTotalFuelMT = Math.round(ecoVoyageDays * 32);

    const isEco = speedMode === 'eco';
    const currentTotalFuelMT = isEco ? ecoTotalFuelMT : normalTotalFuelMT;
    const savedFuelMT = Math.max(0, normalTotalFuelMT - ecoTotalFuelMT);

    // Baseline Bunker Fuel Expense (27.5% of Base Ocean Freight for 14.0 kts Normal Speed)
    const normalBunkerExpense = Math.round(baseOceanFreight * 0.275);
    const bunkerFuelExpense = isEco 
      ? Math.round(normalBunkerExpense * (ecoTotalFuelMT / normalTotalFuelMT))
      : normalBunkerExpense;
    const bunkerSavingsUSD = Math.max(0, normalBunkerExpense - bunkerFuelExpense);

    // EU ETS / IMO Carbon Tax ($85/Tonne CO2, 1 MT VLSFO = 3.114 MT CO2)
    const CO2_FACTOR = 3.114;
    const CARBON_TAX_RATE = 85;
    const normalCarbonTax = Math.round(normalTotalFuelMT * CO2_FACTOR * CARBON_TAX_RATE);
    const ecoCarbonTax = Math.round(ecoTotalFuelMT * CO2_FACTOR * CARBON_TAX_RATE);
    const carbonTax = isEco ? ecoCarbonTax : normalCarbonTax;
    const carbonTaxSavingsUSD = Math.max(0, normalCarbonTax - ecoCarbonTax);

    const totalSavingsUSD = bunkerSavingsUSD + carbonTaxSavingsUSD;

    // Dynamic Demurrage Risk = Port Wait Days × Daily Demurrage Rate ($25,000/day)
    const portKey = formData.destination_port || "Paradip";
    const portData = PORT_METADATA[portKey] || PORT_METADATA["Paradip"];
    const avgWaitDays = portData.avg_wait_days || 3.5;
    const dailyDemurrageRate = portData.daily_demurrage_usd || 25000;
    const demurrageRisk = Math.round(avgWaitDays * dailyDemurrageRate);

    const totalLandedCost = baseOceanFreight + bunkerFuelExpense + demurrageRisk + carbonTax;

    return {
      ratePerTonne: Number(avgRate.toFixed(2)),
      baseOceanFreight,
      bunkerFuelExpense,
      normalBunkerExpense,
      demurrageRisk,
      avgWaitDays,
      dailyDemurrageRate,
      carbonTax,
      normalCarbonTax,
      ecoCarbonTax,
      totalLandedCost,
      speedMode,
      isEco,
      standardVoyageDays,
      extraTransitDays,
      ecoVoyageDays,
      normalTotalFuelMT,
      ecoTotalFuelMT,
      currentTotalFuelMT,
      savedFuelMT,
      bunkerSavingsUSD,
      carbonTaxSavingsUSD,
      totalSavingsUSD
    };
  }, [formData.cargo_tonnes, formData.origin_country, formData.destination_port, activeSeries, optimization, speedMode]);

  // Real-Time Port Congestion & Demurrage Risk Predictor Hook
  const portCongestion = useMemo(() => {
    const portKey = formData.destination_port || "Paradip";
    const port = PORT_METADATA[portKey] || PORT_METADATA["Paradip"];
    const waitDays = port.avg_wait_days || 3.5;
    const queue = port.queue_vessels || 12;
    const dailyRate = port.daily_demurrage_usd || 25000;
    const totalDemurrageUsd = Math.round(waitDays * dailyRate);
    const riskLevel = port.congestion_risk || (waitDays > 4 ? "High" : waitDays >= 2.5 ? "Moderate" : "Low");
    const weatherRisk = port.weather_risk || "Low";

    return {
      portKey,
      portName: port.name,
      waitDays,
      queue,
      dailyRate,
      totalDemurrageUsd,
      riskLevel,
      weatherRisk,
      badgeColor: riskLevel === "High" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  riskLevel === "Moderate" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-emerald-50 text-[#16A34A] border-emerald-200"
    };
  }, [formData.destination_port]);

  // Real-Time Port Draft Feasibility & Safety Check Hook
  const draftCheck = useMemo(() => {
    const vessel = VESSEL_METADATA[selectedVessel] || { name: selectedVessel, draft_m: 17.8, dwt: 180000, type: "Capesize" };
    const portKey = formData.destination_port || "Paradip";
    const port = PORT_METADATA[portKey] || { name: portKey, max_draft_m: 17.5, max_dwt: 180000 };

    const currentCargoTonnes = Number(formData.cargo_tonnes) || 150000;
    
    // Absolute max safe cargo intake to clear max_draft_m (based on TPC ~11,500 MT per 1.0m draft excess)
    const fullDraft = vessel.draft_m;
    const maxPortDraft = port.max_draft_m;
    const fullDraftExcess = Math.max(0, fullDraft - maxPortDraft);

    // Safe cargo intake threshold: full vessel DWT minus draft excess tonnage
    const maxSafeCargoTonnes = fullDraftExcess > 0
      ? Math.max(10000, Math.round(vessel.dwt - fullDraftExcess * 11500))
      : vessel.dwt;

    // Operating draft based on current nominated cargo volume
    const currentOperatingDraft = Number(
      (fullDraft - Math.max(0, (vessel.dwt - currentCargoTonnes) / 11500)).toFixed(1)
    );

    // Warning triggers ONLY IF current nominated volume exceeds safe cargo intake threshold
    const isUnsafe = currentCargoTonnes > maxSafeCargoTonnes;
    const excessDraftM = isUnsafe ? Number((currentOperatingDraft - maxPortDraft).toFixed(1)) : 0;
    const suggestedReductionMT = isUnsafe ? Math.max(0, currentCargoTonnes - maxSafeCargoTonnes) : 0;

    // Deep-water alternative ports capable of accommodating this vessel's full draft
    const recommendedDeepWaterPorts = Object.keys(PORT_METADATA).filter(
      p => PORT_METADATA[p].max_draft_m >= fullDraft
    );

    return {
      isUnsafe,
      vesselName: vessel.name,
      vesselDraft: fullDraft,
      operatingDraft: currentOperatingDraft,
      vesselType: vessel.type,
      vesselDwt: vessel.dwt,
      portName: port.name,
      portMaxDraft: maxPortDraft,
      excessDraftM,
      suggestedReductionMT,
      maxSafeCargoTonnes,
      recommendedDeepWaterPorts,
    };
  }, [selectedVessel, formData.destination_port, formData.cargo_tonnes]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#16A34A] selection:text-white">
      
      {/* Clean White Executive Header */}
      <header className="border-b border-[#E2E8F0] bg-white px-8 py-4 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#16A34A] text-white rounded-xl shadow-md shadow-emerald-600/20 border border-emerald-500/30">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">NAVI-STEEL FREIGHT FORECASTER</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200">
                v1.0 AI
              </span>
            </div>
            <p className="text-xs text-[#64748B]">Intelligent Bulk Cargo Procurement & Vessel Chartering Engine | Ministry of Steel Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          
          {/* Demo Mode Badge */}
          {isDemo ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-[#F97316] border border-amber-200 shadow-sm animate-pulse">
              <Lock className="w-3.5 h-3.5 text-[#F97316]" />
              <span>DEMO MODE: READ-ONLY PREVIEW</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'Online' ? 'bg-[#16A34A] animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-[#64748B] font-medium">FastAPI Engine: <strong className="text-[#0F172A]">{backendStatus}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-[#16A34A] border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> SIH26006: Ministry of Steel
          </div>

          {/* Dynamic User Profile Pill */}
          <div className="flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center border border-emerald-500/30">
              {user.avatar || 'US'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#0F172A] leading-none">{user.name || 'Official User'}</p>
              <p className="text-[10px] text-[#16A34A] leading-none mt-0.5">{user.role || 'Logistics Officer'}</p>
            </div>
            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="ml-1 text-[#64748B] hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
        
        {/* Read-Only Demo Notice Banner */}
        {isDemo && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-[#F97316] rounded-xl border border-amber-200 flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#F97316] uppercase tracking-wider">Demo Mode (Read-Only Preview) Active</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  You are exploring using a demo official profile. Parameter inputs and custom optimization runs are locked. Register a full account for interactive control.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 flex-shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register Full Account
            </button>
          </div>
        )}

        {/* Top Operational Metrics Ribbon (With Accent Color Rounded Circle Icons) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Strategic Cargo</span>
              <div className="text-base font-extrabold text-[#0F172A] mt-0.5">Coking Coal / Flux</div>
              <div className="text-[11px] text-[#64748B]">High-Grade Feedstock</div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0EA5E9] border border-sky-200 flex items-center justify-center flex-shrink-0">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Indian Ports</span>
              <div className="text-base font-extrabold text-[#0F172A] mt-0.5">8 Terminals</div>
              <div className="text-[11px] text-[#16A34A] font-medium">Paradip, Vizag, Dhamra + 5</div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center flex-shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Baltic Dry Index</span>
              <div className="text-base font-extrabold text-[#0F172A] mt-0.5">1,740 pts</div>
              <div className="text-[11px] text-[#F97316] font-medium">+4.2% MoM Cycle</div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Charter Savings</span>
              <div className="text-base font-extrabold text-[#16A34A] mt-0.5">
                {optimization ? `$${optimization.projected_savings_usd?.toLocaleString()}` : "$240,000"}
              </div>
              <div className="text-[11px] text-[#64748B]">
                {optimization ? `${optimization.projected_savings_pct} vs Spot` : "AI Allocation"}
              </div>
            </div>
          </div>

        </div>

        {/* Core Workspace: Inputs & Optimization Advisory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Shipment Parameters Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4 relative">
            
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-semibold flex items-center gap-2 text-[#16A34A]">
                <Compass className="w-5 h-5 text-[#16A34A]" /> Procurement Parameters
              </h2>
              <span className="text-[11px] text-[#64748B]">Charter Specification</span>
            </div>

            {/* Cargo Type */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Cargo Grade / Type</label>
              <select 
                disabled={isDemo}
                className={`w-full mt-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] ${isDemo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                value={formData.cargo_type}
                onChange={e => setFormData({...formData, cargo_type: e.target.value})}
              >
                {CARGO_GRADES.map((grade, idx) => (
                  <option key={idx} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            {/* Chartered Vessel Select */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Chartered Vessel / Capacity Class</label>
              <select 
                disabled={isDemo}
                className={`w-full mt-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] ${isDemo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                value={selectedVessel}
                onChange={e => {
                  const newVessel = e.target.value;
                  setSelectedVessel(newVessel);
                  fetchRouteMap(formData.origin_country, formData.destination_port, formData.cargo_tonnes, formData.cargo_type, newVessel);
                }}
              >
                {VESSEL_OPTIONS.map((v, idx) => (
                  <option key={idx} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Volume & Horizon */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Volume (MT)</label>
                <input 
                  type="number" 
                  step="5000"
                  disabled={isDemo}
                  className={`w-full mt-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] ${isDemo ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={formData.cargo_tonnes}
                  onChange={e => setFormData({...formData, cargo_tonnes: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Planning Horizon</label>
                <select 
                  disabled={isDemo}
                  className={`w-full mt-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] ${isDemo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  value={forecastHorizon}
                  onChange={e => {
                    const horizon = e.target.value;
                    setForecastHorizon(horizon);
                    setFormData(prev => ({ ...prev, lead_time_days: Number(horizon) }));
                  }}
                >
                  <option value="7">7 Days (Short Horizon)</option>
                  <option value="14">14 Days (Prompt Spot)</option>
                  <option value="30">30 Days (Standard Forward)</option>
                  <option value="60">60 Days (Quarterly)</option>
                </select>
              </div>
            </div>

            {/* Real-World Eco-Speed Mode Toggle Switch (Fuel & Carbon Tax Saver) */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-[#16A34A]" /> Eco-Speed Mode (IMO Carbon Tax Saver)
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase transition ${
                  speedMode === 'eco' 
                    ? 'bg-emerald-50 text-[#16A34A] border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {speedMode === 'eco' ? '🌱 11.0 Kts (Eco)' : '14.0 Kts (Normal)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  disabled={isDemo}
                  onClick={() => setSpeedMode('normal')}
                  className={`py-2 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    speedMode === 'normal'
                      ? 'bg-white text-[#0F172A] shadow-xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5 text-slate-500" />
                  <span>Normal (14.0 kts)</span>
                </button>
                <button
                  type="button"
                  disabled={isDemo}
                  onClick={() => setSpeedMode('eco')}
                  className={`py-2 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    speedMode === 'eco'
                      ? 'bg-[#16A34A] text-white shadow-xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5 text-white" />
                  <span>Eco-Speed (11.0 kts)</span>
                </button>
              </div>

              <div className="text-[11px] text-[#64748B] leading-tight">
                {speedMode === 'eco' ? (
                  <span className="text-[#16A34A] font-bold flex items-center gap-1">
                    🌱 Eco-Speed Active: Saves {financialTotals.savedFuelMT} MT Fuel ({formatCurrency(financialTotals.totalSavingsUSD)}) | +{financialTotals.extraTransitDays} Days
                  </span>
                ) : (
                  <span>
                    🌱 Eco-Speed (11.0 kts): Saves ~{financialTotals.savedFuelMT} MT VLSFO & {formatCurrency(financialTotals.totalSavingsUSD)} Carbon Tax
                  </span>
                )}
              </div>
            </div>

            {/* Overseas Loading Port Dropdown */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Overseas Loading Port</label>
              <select 
                disabled={isDemo}
                className={`w-full mt-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] ${isDemo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                value={selectedRouteKey}
                onChange={e => handleRouteChange(e.target.value)}
              >
                <option value="Australia_HayPoint">Australia: Hay Point / Dalrymple Bay (Coking Coal)</option>
                <option value="Australia_Gladstone">Australia: Port Gladstone (Met Coal)</option>
                <option value="Australia_Newcastle">Australia: Port Newcastle (PCI & Thermal Coal)</option>
                <option value="SouthAfrica_RichardsBay">South Africa: Richards Bay Coal Terminal</option>
                <option value="Indonesia_TanjungBara">Indonesia: Tanjung Bara / Samarinda Bulk Terminal</option>
                <option value="Indonesia_MuaraPantai">Indonesia: Muara Pantai Port</option>
                <option value="Mozambique_Nacala">Mozambique: Port of Nacala / Beira</option>
                <option value="Russia_Vostochny">Russia: Port of Vostochny / Far-East Hub</option>
                <option value="USA_HamptonRoads">USA: Hampton Roads / Norfolk (High-Vol Met Coal)</option>
                <option value="USA_Baltimore">USA: Port of Baltimore</option>
              </select>
            </div>

            {/* Indian Discharge Port Dropdown */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Discharge Port (India)</label>
              <select 
                disabled={isDemo}
                className={`w-full mt-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] ${isDemo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                value={formData.destination_port}
                onChange={e => setFormData({...formData, destination_port: e.target.value})}
              >
                <option value="Paradip">Paradip Port (Deep Draft 17.5m - SAIL/Tata/JSW)</option>
                <option value="Visakhapatnam">Visakhapatnam / Vizag Port (Deep Draft 18.1m - RINL)</option>
                <option value="Dhamra">Dhamra Port (Deep Draft 18.0m - Capesize Terminal)</option>
                <option value="Krishnapatnam">Krishnapatnam Port (Deep Draft 18.5m - Deep Draft Capesize)</option>
                <option value="Haldia">Haldia Dock Complex (Shallow Draft 8.5m - Barging Caution)</option>
                <option value="Gopalpur">Gopalpur Port (Draft 12.5m - Bulk Terminal)</option>
                <option value="Kakinada">Kakinada Deepwater Port (Draft 12.0m)</option>
                <option value="Jaigad">Jaigad / Mormugao Port (West/East Coast Feeder)</option>
              </select>
            </div>

            {/* Real-Time Port Congestion & Live Traffic Indicator */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5 text-xs text-[#0F172A] shadow-2xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-[#0F172A]">
                  <Clock className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  Port Congestion & Traffic Index
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${portCongestion.badgeColor}`}>
                  {portCongestion.riskLevel} Congestion Risk
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] text-center">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">Est. Wait Time</span>
                  <span className="font-extrabold text-[#0F172A] text-xs">{portCongestion.waitDays} Days</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] text-center">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">Anchorage Queue</span>
                  <span className="font-extrabold text-[#0EA5E9] text-xs">{portCongestion.queue} Vessels</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] text-center">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">Demurrage Risk</span>
                  <span className="font-extrabold text-rose-600 text-xs">${portCongestion.totalDemurrageUsd.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0] text-[10px] text-[#64748B]">
                <span>Penalty Rate: <b>${portCongestion.dailyRate.toLocaleString()}/day</b> ({portCongestion.waitDays}d = ${portCongestion.totalDemurrageUsd.toLocaleString()})</span>
                <span>Weather Risk: <b>{portCongestion.weatherRisk}</b></span>
              </div>
            </div>

            {/* Real-Time Port Draft Feasibility & Safety Warning Component */}
            {draftCheck.isUnsafe && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2 text-xs text-[#0F172A] shadow-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ⚠️ DRAFT WARNING: Operating Draft ({draftCheck.operatingDraft}m) exceeds Port Limit ({draftCheck.portMaxDraft}m)
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200 uppercase whitespace-nowrap">
                    +{draftCheck.excessDraftM}m Excess
                  </span>
                </div>

                <p className="text-[11px] text-[#475569] leading-snug">
                  Vessel <strong className="text-[#0F172A]">{draftCheck.vesselName}</strong> operating draft at current cargo volume is <strong>{draftCheck.operatingDraft}m</strong> (full design draft: {draftCheck.vesselDraft}m), exceeding <strong>{draftCheck.portName}</strong> berth limit (<strong>{draftCheck.portMaxDraft}m</strong>).
                </p>

                <div className="p-2 bg-white/90 rounded-lg border border-amber-200 text-[11px] text-slate-700 space-y-1">
                  <div className="font-semibold text-amber-900 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-600" /> Actionable Safety Recommendations:
                  </div>
                  <p className="text-[11px]">
                    • Reduce cargo volume by ~<strong className="text-rose-600">{draftCheck.suggestedReductionMT.toLocaleString()} MT</strong> (to max safe intake ~<strong className="text-emerald-700">{draftCheck.maxSafeCargoTonnes.toLocaleString()} MT</strong>) to clear berth depth.
                  </p>
                  {draftCheck.recommendedDeepWaterPorts.length > 0 && (
                    <p className="text-[11px]">
                      • Or select a deep-water port capable of receiving {draftCheck.vesselDraft}m full draft (e.g., <strong className="text-emerald-700">{draftCheck.recommendedDeepWaterPorts.join(' / ')}</strong>).
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={isDemo}
                    onClick={() => setFormData(prev => ({ ...prev, cargo_tonnes: draftCheck.maxSafeCargoTonnes }))}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Auto-Adjust Volume ({draftCheck.maxSafeCargoTonnes.toLocaleString()} MT)
                  </button>

                  {draftCheck.recommendedDeepWaterPorts.length > 0 && (
                    <button
                      type="button"
                      disabled={isDemo}
                      onClick={() => setFormData(prev => ({ ...prev, destination_port: draftCheck.recommendedDeepWaterPorts[0] }))}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Anchor className="w-3.5 h-3.5" />
                      Switch Port ({draftCheck.recommendedDeepWaterPorts[0]})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Optimization Trigger Button */}
            <button 
              onClick={handleOptimizerClick} 
              disabled={loading}
              className={`w-full mt-3 font-semibold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer border ${
                isDemo 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20' 
                  : 'bg-[#16A34A] hover:bg-[#15803D] text-white border-[#16A34A] shadow-emerald-600/20'
              }`}
            >
              {loading ? (
                <>Computing Port Draft & Demurrage...</>
              ) : isDemo ? (
                <>
                  <Lock className="w-4 h-4 text-white" />
                  <span>Run AI Optimizer (Locked in Demo Mode)</span>
                </>
              ) : (
                <>
                  <span>Run AI Charter & Procurement Optimizer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </div>

          {/* Right Column: AI Optimization Advisory (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            {optimization ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                    <h2 className="text-base font-semibold text-[#0F172A]">AI Chartering Advisory Output</h2>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    draftCheck.isUnsafe || optimization.draft_warning
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                  }`}>
                    {draftCheck.isUnsafe || optimization.draft_warning 
                      ? '⚠️ Draft Restricted / Lightering Active' 
                      : 'Optimized Strategy Active'}
                  </span>
                </div>

                {/* Recommendation Banner */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> Actionable Charter Strategy
                  </div>
                  <p className="text-base font-medium text-[#0F172A] mt-1.5 leading-snug">
                    {optimization.action_advisory}
                  </p>
                </div>

                {/* Draft Constraint Warning if triggered */}
                {optimization.draft_warning && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                    <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Port Draft Restriction Alert:</span> {optimization.draft_warning}
                    </div>
                  </div>
                )}

                {/* Key Spec Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] uppercase font-semibold">Vessel Class</span>
                    <p className="text-sm font-bold text-[#0F172A] mt-1 truncate">{optimization.vessel_recommended}</p>
                    <span className="text-[10px] text-[#64748B]">Draft: {optimization.vessel_draft_m}m</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] uppercase font-semibold">Contract Mode</span>
                    <p className="text-sm font-bold text-[#0EA5E9] mt-1">{optimization.recommended_strategy}</p>
                    <span className="text-[10px] text-[#16A34A] font-semibold">{optimization.projected_savings_pct} Saving</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] uppercase font-semibold">Landed Freight</span>
                    <p className="text-sm font-bold text-[#16A34A] mt-1">{formatCurrency(financialTotals.ratePerTonne)} / MT</p>
                    <span className="text-[10px] text-[#64748B]">CIF India Port</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B] uppercase font-semibold">Port Wait Risk</span>
                    <p className="text-sm font-bold text-[#F97316] mt-1">{optimization.port_avg_wait_days} Days</p>
                    <span className="text-[10px] text-[#64748B]">{optimization.port_congestion} Congestion</span>
                  </div>
                </div>

                {/* Financial Ledger Breakdown with Live FX Integration */}
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2 mb-1">
                    <span className="font-bold text-[#0F172A] text-xs flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#16A34A]" /> Financial Summary ({forecastHorizon}D Horizon)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#64748B] font-semibold">Currency:</span>
                      <select
                        value={selectedCurrency}
                        onChange={e => setSelectedCurrency(e.target.value)}
                        className="bg-white border border-[#E2E8F0] rounded-md text-xs font-bold px-2 py-0.5 text-[#0F172A] focus:outline-none cursor-pointer"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="SGD">SGD (S$)</option>
                      </select>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        1 USD = {currentRate} {selectedCurrency} (Live)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>Base Ocean Freight Cost:</span>
                    <span className="font-semibold text-[#0F172A]">{formatCurrency(financialTotals.baseOceanFreight)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>Estimated Bunker Fuel (VLSFO) Expense {financialTotals.isEco ? '(32 MT/day Eco)' : '(55 MT/day Normal)'}:</span>
                    <span className="font-medium text-[#F97316]">{formatCurrency(financialTotals.bunkerFuelExpense)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>Carbon Tax / EU ETS Allowance ($85/t CO2):</span>
                    <span className="font-medium text-emerald-700">{formatCurrency(financialTotals.carbonTax)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>Demurrage Risk Exposure (Congestion Buffer):</span>
                    <span className="font-medium text-rose-600">{formatCurrency(financialTotals.demurrageRisk)}</span>
                  </div>
                  {optimization.lightering_cost_usd > 0 && (
                    <div className="flex justify-between text-xs text-[#64748B]">
                      <span>Anchor Lightering / Barging Surcharge:</span>
                      <span className="font-medium text-purple-600">{formatCurrency(optimization.lightering_cost_usd)}</span>
                    </div>
                  )}

                  {/* Actionable Green Eco-Speed Active Badge */}
                  {financialTotals.isEco && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-[#16A34A] flex items-center gap-2 shadow-2xs">
                      <Leaf className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span>
                        🌱 Eco-Speed Active: Saves {financialTotals.savedFuelMT} Tonnes Fuel ({formatCurrency(financialTotals.totalSavingsUSD)}) | +{financialTotals.extraTransitDays} Days Transit Time
                      </span>
                    </div>
                  )}

                  <div className="border-t border-[#E2E8F0] pt-2 flex justify-between text-sm font-bold">
                    <span className="text-[#0F172A]">Total Landed Freight Cost:</span>
                    <span className="text-[#16A34A] text-base font-extrabold">{formatCurrency(financialTotals.totalLandedCost)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-[#64748B]">
                <Ship className="w-12 h-12 mb-3 opacity-30 animate-pulse text-[#16A34A]" />
                <p className="text-sm font-medium">Configure procurement parameters on the left to run AI optimization</p>
              </div>
            )}
          </div>
        </div>

        {/* Freight Forecasting Predictive Curve (Multi-Horizon Dynamic TODAY Timeline) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                  AI Freight Rate Forward Curve ($/Metric Tonne)
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#16A34A]" /> Starts Today ({todayFormatted})
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Dynamic forward predictions starting from today ({todayFormatted}) combining Baltic Indices & VLSFO Bunker Fuel
              </p>
            </div>

            {/* Timeline Horizon Filter Controls + Legend */}
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Horizon Selector Pill Buttons */}
              <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setForecastHorizon('7')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                    forecastHorizon === '7' 
                      ? 'bg-[#16A34A] text-white font-bold shadow-sm' 
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHorizon('14')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                    forecastHorizon === '14' 
                      ? 'bg-[#16A34A] text-white font-bold shadow-sm' 
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  14 Days
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHorizon('30')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                    forecastHorizon === '30' 
                      ? 'bg-[#16A34A] text-white font-bold shadow-sm' 
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  30 Days Forward
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHorizon('60')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                    forecastHorizon === '60' 
                      ? 'bg-[#16A34A] text-white font-bold shadow-sm' 
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  60 Days
                </button>
              </div>

              {/* Legend Indicators */}
              <div className="flex items-center gap-3 text-xs font-medium border-l border-[#E2E8F0] pl-4">
                <span className="flex items-center gap-1.5 text-[#16A34A]">
                  <span className="w-3 h-0.5 bg-[#16A34A] inline-block"></span> Ocean Freight ($/MT)
                </span>
                <span className="flex items-center gap-1.5 text-[#F97316]">
                  <span className="w-3 h-0.5 bg-[#F97316] inline-block"></span> Bunker Fuel Index ($/MT)
                </span>
              </div>

            </div>
          </div>

          {/* Recharts Area & Line Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSeries}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" tick={{fontSize: 11}} minTickGap={20} />
                <YAxis yAxisId="left" stroke="#16A34A" tick={{fontSize: 11}} domain={['auto', 'auto']} unit="$" />
                <YAxis yAxisId="right" orientation="right" stroke="#F97316" tick={{fontSize: 11}} domain={['auto', 'auto']} unit="$" />
                <Tooltip 
                  contentStyle={{backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '10px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                  formatter={(value, name) => [
                    `$${value} / MT`, 
                    name === 'rate' || name === 'Ocean Freight ($/MT)' ? 'Ocean Freight ($/MT)' : 'Bunker Fuel Index ($/MT)'
                  ]}
                />
                <Area yAxisId="left" type="monotone" dataKey="rate" name="Ocean Freight ($/MT)" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#rateGradient)" />
                <Line yAxisId="right" type="monotone" dataKey="fuel" name="Bunker Fuel Index ($/MT)" stroke="#F97316" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LIVE OPEN-METEO MARITIME WEATHER INTELLIGENCE WIDGET */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#0EA5E9]" />
              <h3 className="text-base font-bold text-[#0F172A]">Port & Maritime Weather Intelligence</h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-[#64748B] font-normal">
                {lastWeatherUpdate ? `Refreshed: ${lastWeatherUpdate}` : 'Fetching Doppler Live...'}
              </span>
              <button
                onClick={fetchLiveWeather}
                disabled={weatherUpdating}
                className="text-[#16A34A] hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer font-bold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${weatherUpdating ? 'animate-spin' : ''}`} />
                <span>Live Feed Active</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {weatherFeed.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                  item.alert 
                    ? 'bg-amber-50 border-amber-200 shadow-sm' 
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                    <span className="truncate">{item.location}</span>
                    {item.alert ? (
                      <CloudLightning className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                    ) : item.icon === 'sun' ? (
                      <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <Wind className="w-4 h-4 text-[#0EA5E9] flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-[#0F172A]">{item.temp_c}°C</span>
                    <span className="text-xs text-[#64748B] font-medium">{item.condition}</span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-[#64748B]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Wind:</span>
                      <span className="font-semibold text-[#0EA5E9]">{item.wind_kts} kts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Wave Height:</span>
                      <span className="font-semibold text-[#16A34A]">{item.wave_m} m</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E2E8F0]">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block ${item.badgeColor}`}>
                    {item.delay_impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time AIS Maritime Route & GPS Vessel Tracking Map */}
        <VesselTrackerMap 
          routeData={routeMapData} 
          loading={routeMapLoading} 
          onRefreshRoute={() => fetchRouteMap()} 
          vesselName={selectedVessel}
          destinationPort={formData.destination_port}
        />

        {/* Indian Ports Status & Maritime Route Network */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Indian Ports Discharge Matrix with Non-Overlapping Badges & Custom Scrollbar */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F97316]" /> Indian Port Discharge Matrix
              </h3>
              <span className="text-xs text-[#64748B]">Berth & Demurrage Feed</span>
            </div>

            {/* pr-3.5 and custom-scrollbar prevent scrollbar badge collision */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-3.5 custom-scrollbar">
              {ports.map((port, idx) => (
                <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#0F172A]">{port.port}</span>
                      {port.transshipment_needed && (
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded border border-rose-200 whitespace-nowrap flex-shrink-0 font-medium">
                          Shallow Draft Limit
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Max Draft: <span className="text-[#0F172A] font-medium">{port.max_draft_m}m</span> | 
                      Discharge: <span className="text-[#0F172A] font-medium">{port.discharge_rate_tpd?.toLocaleString() || '28,000'} TPD</span> | 
                      Demurrage: <span className="text-[#0F172A] font-medium">${port.daily_demurrage_usd?.toLocaleString() || '25,000'}/day</span>
                    </div>
                  </div>

                  {/* whitespace-nowrap & flex-shrink-0 ensures risk badge never wraps or gets cut off */}
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold whitespace-nowrap inline-block ${
                      port.congestion === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      port.congestion === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                    }`}>
                      {port.congestion} Risk ({port.avg_wait_days}d wait)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maritime Route Intelligence & Transit Calculator */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
                <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0EA5E9]" /> Maritime Route Transit Profile
                </h3>
                <span className="text-xs text-[#64748B]">Sea Corridor Intelligence</span>
              </div>

              {routeIntelligence ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B] uppercase font-semibold">Origin Terminal</span>
                    <p className="text-base font-bold text-[#0F172A] mt-0.5">{routeIntelligence.origin_port}</p>
                    <p className="text-xs text-[#0EA5E9] mt-1 font-medium">Cargo Fit: {routeIntelligence.primary_cargo}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-xs text-[#64748B]">Voyage Distance</span>
                      <p className="text-lg font-bold text-[#0F172A] mt-0.5">{routeIntelligence.distance_nm?.toLocaleString()} NM</p>
                      <span className="text-[10px] text-[#64748B]">Nautical Miles</span>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-xs text-[#64748B]">Capesize Sea Transit</span>
                      <p className="text-lg font-bold text-[#16A34A] mt-0.5">~{routeIntelligence.transit_days_capesize} Days</p>
                      <span className="text-[10px] text-[#F97316] font-semibold flex items-center gap-1 mt-0.5">
                        <CloudLightning className="w-3 h-3" /> +0.5d Monsoon Weather Buffer
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-xs font-semibold text-[#64748B]">Sea Corridors & Chokepoints:</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {routeIntelligence.sea_lanes?.map((lane, i) => (
                        <span key={i} className="text-xs px-2.5 py-0.5 rounded-md bg-sky-50 text-[#0EA5E9] border border-sky-200 font-medium">
                          {lane}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[#64748B] text-sm">Select route to see nautical distance and transit days</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs text-[#64748B]">
              <span>Bunker Fuel Benchmark: VLSFO 0.5% S</span>
              <span className="text-[#16A34A] font-medium">IMO 2020 Compliant</span>
            </div>
          </div>

        </div>

      </main>

      {/* Demo Mode Action Locked Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-[#F97316] rounded-xl border border-amber-200">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-base">Actions Disabled in Demo Mode</h3>
                  <p className="text-xs text-[#F97316] font-medium">Read-Only Preview Active</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              You are currently logged in with a demo official profile (<span className="font-semibold text-[#0F172A]">{user.name}</span>). Parameter modifications and custom AI optimization triggers are locked in preview mode.
            </p>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] space-y-1">
              <p className="font-semibold text-[#0F172A]">To customize parameters and run custom AI models:</p>
              <p className="text-[#64748B]">• Register a free official account (takes 10 seconds)</p>
              <p className="text-[#64748B]">• Full access to all 10 Overseas & 8 Indian port parameters</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDemoModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#64748B] font-semibold text-xs rounded-xl cursor-pointer transition border border-[#E2E8F0]"
              >
                Continue Previewing
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5 border border-[#16A34A]"
              >
                <UserPlus className="w-4 h-4" />
                Register Full Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white px-8 py-4 text-center text-xs text-[#64748B]">
        SIH26006 Intelligent Freight Forecasting Model & Optimized Vessel Chartering Platform • Developed for Ministry of Steel Bulk Cargo Supply Chains
      </footer>

    </div>
  );
}
