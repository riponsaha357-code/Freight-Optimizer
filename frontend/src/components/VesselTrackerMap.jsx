import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, Circle, useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Ship, Navigation, Play, Pause, RotateCcw, FastForward, 
  ShieldCheck, AlertTriangle, Compass, Wind, Waves, 
  Layers, MapPin, Anchor, Eye, EyeOff, Info, CheckCircle2,
  Maximize2, CloudRain, Flame, Radio, Activity
} from 'lucide-react';

// Fix Leaflet's default icon path issues in bundlers
try {
  const IconDefault = L?.Icon?.Default || L?.default?.Icon?.Default;
  if (IconDefault && IconDefault.prototype) {
    delete IconDefault.prototype._getIconUrl;
    IconDefault.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }
} catch (e) {
  console.warn("Leaflet default icon patch skipped:", e);
}

// ── Active Bulk Carrier Fleet Specifications for Dynamic Route Interpolation ────
const FLEET_VESSEL_SPECS = [
  { name: "Gargantua", fullName: "Gargantua (209,529 DWT)", dwt: 209529, class: "Newcastlemax", baseOffset: 12, sog: 13.8, status: "Underway using engine", operatingDraft: 17.2, maxDraft: 18.5 },
  { name: "Goliath", fullName: "Goliath (209,537 DWT)", dwt: 209537, class: "Newcastlemax", baseOffset: 28, sog: 14.1, status: "Underway using engine", operatingDraft: 17.5, maxDraft: 18.4 },
  { name: "Cape Destiny", fullName: "Cape Destiny (180,000 DWT)", dwt: 180000, class: "Capesize", baseOffset: 45, sog: 11.0, status: "Underway (Eco-Speed)", operatingDraft: 15.2, maxDraft: 17.8 },
  { name: "Oldendorff Friedrich", fullName: "Oldendorff Friedrich (208,000 DWT)", dwt: 208000, class: "Newcastlemax", baseOffset: 62, sog: 13.5, status: "Underway using engine", operatingDraft: 16.8, maxDraft: 18.3 },
  { name: "Berge Athene", fullName: "Berge Athene (225,200 DWT)", dwt: 225200, class: "Newcastlemax", baseOffset: 76, sog: 12.5, status: "Underway using engine", operatingDraft: 18.0, maxDraft: 18.5 },
  { name: "Golden Confidence", fullName: "Golden Confidence (180,000 DWT)", dwt: 180000, class: "Capesize", baseOffset: 89, sog: 10.5, status: "Approaching Berth", operatingDraft: 16.8, maxDraft: 17.5 },
  { name: "Navios Happiness", fullName: "Navios Happiness (180,000 DWT)", dwt: 180000, class: "Capesize", baseOffset: 97, sog: 0.2, status: "Anchored at Outer Berth", operatingDraft: 15.6, maxDraft: 17.6 }
];

// Helper: Calculate Nautical Bearing (Heading in degrees 0-360) between two coordinates
function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return Math.round((toDeg(brng) + 360) % 360);
}

// Helper: Calculate point & heading angle along polyline coords given progress percentage (0-100)
function getPointAlongPolyline(coords, progressPct) {
  if (!coords || coords.length === 0) return { lat: 0, lon: 0, heading: 0 };
  if (coords.length === 1) return { lat: coords[0][0], lon: coords[0][1], heading: 0 };

  const pct = Math.max(0, Math.min(100, progressPct));
  if (pct === 0) {
    const heading = calculateBearing(coords[0][0], coords[0][1], coords[1][0], coords[1][1]);
    return { lat: coords[0][0], lon: coords[0][1], heading };
  }
  if (pct === 100) {
    const n = coords.length;
    const heading = calculateBearing(coords[n - 2][0], coords[n - 2][1], coords[n - 1][0], coords[n - 1][1]);
    return { lat: coords[n - 1][0], lon: coords[n - 1][1], heading };
  }

  // Calculate segment lengths
  let totalDist = 0;
  const segDists = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversineDistanceMeters(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    segDists.push(d);
    totalDist += d;
  }

  const targetDist = totalDist * (pct / 100);
  let accumDist = 0;

  for (let i = 0; i < segDists.length; i++) {
    const d = segDists[i];
    if (accumDist + d >= targetDist || i === segDists.length - 1) {
      const segFrac = d > 0 ? (targetDist - accumDist) / d : 0;
      const p1 = coords[i];
      const p2 = coords[i + 1] || coords[i];
      const lat = p1[0] + (p2[0] - p1[0]) * segFrac;
      const lon = p1[1] + (p2[1] - p1[1]) * segFrac;
      const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      return { lat, lon, heading };
    }
    accumDist += d;
  }

  const lastIdx = coords.length - 1;
  const heading = calculateBearing(coords[lastIdx - 1][0], coords[lastIdx - 1][1], coords[lastIdx][0], coords[lastIdx][1]);
  return { lat: coords[lastIdx][0], lon: coords[lastIdx][1], heading };
}

// ── Geographic Geofence Zones (200km Radius) ──────────────────────────────────
const GEOFENCE_ZONES = [
  {
    id: "mozambique_channel",
    name: "Mozambique Channel Passage",
    center: [-18.0, 41.5],
    radiusMeters: 200000, // 200 km
    swells: "1.8m",
    wind: "14 kts",
    current: "Agulhas Current (+0.8 kts boost)",
    status: "Adverse Swell Monitoring Active",
    color: "#F59E0B"
  },
  {
    id: "south_indian_ocean",
    name: "South Indian Ocean / Lombok Corridor",
    center: [-8.75, 115.75],
    radiusMeters: 200000, // 200 km
    swells: "1.4m",
    wind: "11 kts",
    current: "Deep Water Trench (>150m)",
    status: "Capesize Deep Draft Enforced",
    color: "#10B981"
  },
  {
    id: "bay_of_bengal",
    name: "Bay of Bengal Approach",
    center: [15.5, 87.5],
    radiusMeters: 200000, // 200 km
    swells: "2.1m",
    wind: "18 kts",
    current: "Monsoon Swell Sector",
    status: "Port Arrival Pre-Berthing Protocol",
    color: "#0284C7"
  }
];

// Helper: Haversine distance in meters between two lat/lon coordinates
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Custom SVG Marker Creators ──────────────────────────────────────────────────
const createPortIcon = (type = 'origin', name = '') => {
  const isOrigin = type === 'origin';
  const color = isOrigin ? '#10B981' : '#EF4444';
  const iconLetter = isOrigin ? 'ORIGIN' : 'DISCHARGE';

  return L.divIcon({
    className: 'custom-port-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="
          background: ${color}; 
          color: white; 
          font-weight: 800; 
          font-size: 9px; 
          padding: 2px 7px; 
          border-radius: 9999px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          white-space: nowrap;
          border: 1.5px solid white;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        ">
          ${name || iconLetter}
        </div>
        <div style="
          width: 22px; 
          height: 22px; 
          background: ${color}; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 0 14px ${color};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
};

const createChokePointIcon = (name, riskType, status) => {
  const isWarning = status && status.includes('WARNING');
  const isAvoided = status && status.includes('AVOIDED');
  const bg = isWarning ? '#EF4444' : isAvoided ? '#F59E0B' : '#0284C7';

  return L.divIcon({
    className: 'custom-choke-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="
          width: 18px; 
          height: 18px; 
          background: ${bg}; 
          border: 2px solid white; 
          transform: rotate(45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -12],
  });
};

const createShipIcon = (heading = 0, sog = 14.2, isHighlighted = true) => {
  const strokeColor = isHighlighted ? '#10B981' : '#0284C7';
  const pulseColor = isHighlighted ? '#10B981' : 'rgba(2, 132, 199, 0.6)';

  return L.divIcon({
    className: 'custom-vessel-marker',
    html: `
      <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
        <!-- Pulsating Radar Ring -->
        <div style="
          position: absolute;
          top: -12px;
          left: -12px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid ${pulseColor};
          opacity: 0.75;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        
        <!-- Rotating Vessel Silhouette -->
        <div style="
          width: 28px; 
          height: 28px; 
          background: #0F172A; 
          border: 2.5px solid ${strokeColor}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 16px ${strokeColor}80;
          transform: rotate(${heading}deg);
          transition: transform 0.4s ease-out;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
        
        <!-- Speed Over Ground Tag -->
        <div style="
          position: absolute;
          top: 26px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(4px);
          color: ${strokeColor};
          font-family: monospace;
          font-size: 8.5px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid ${strokeColor}40;
          white-space: nowrap;
        ">
          ${sog} kts
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -20],
  });
};

// ── Map Controller Helpers ──────────────────────────────────────────────────
function MapBoundsAdjuster({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6, animate: true });
      } catch (e) {
        // Fallback silently if bounds invalid
      }
    }
  }, [bounds, map]);
  return null;
}

function MapFlyToController({ targetCenter }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter && targetCenter[0] != null && targetCenter[1] != null) {
      try {
        map.flyTo(targetCenter, 5, { animate: true, duration: 1.5 });
      } catch (e) {
        // Fallback silently
      }
    }
  }, [targetCenter, map]);
  return null;
}

export default function VesselTrackerMap({ 
  routeData, 
  loading = false,
  onRefreshRoute,
  vesselName = "Gargantua (209,529 DWT)",
  destinationPort = "Paradip"
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x, 10x
  const [currentStep, setCurrentStep] = useState(0);
  const [tileMode, setTileMode] = useState('carto-dark'); // Default to Carto Dark Ops tile layer!
  
  // Layer visibility toggles
  const [showSafeRoute, setShowSafeRoute] = useState(true);
  const [showStandardRoute, setShowStandardRoute] = useState(true);
  const [showRiskZone, setShowRiskZone] = useState(true);
  const [showChokePoints, setShowChokePoints] = useState(true);
  const [showWeatherRaster, setShowWeatherRaster] = useState(false); // Live Weather Raster Layer Toggle

  const telemetry = routeData?.telemetry_points || [];
  const metrics = routeData?.metrics || {};
  const origin = routeData?.origin_port || {};
  const dest = routeData?.destination_port || {};
  const chokepoints = routeData?.chokepoints || [];

  // Extract Active Route Polyline Coordinates
  const safeRouteCoords = useMemo(() => {
    const feat = routeData?.geojson?.features?.find(f => f.properties?.name?.includes('Optimal'));
    if (feat && feat.geometry?.coordinates?.length > 0) {
      return feat.geometry.coordinates.map(c => [c[1], c[0]]);
    }
    const stdFeat = routeData?.geojson?.features?.find(f => f.properties?.name?.includes('Standard'));
    if (stdFeat && stdFeat.geometry?.coordinates?.length > 0) {
      return stdFeat.geometry.coordinates.map(c => [c[1], c[0]]);
    }
    if (telemetry && telemetry.length > 0) {
      return telemetry.map(t => [t.lat, t.lon]);
    }
    if (origin.lat && origin.lon && dest.lat && dest.lon) {
      return [[origin.lat, origin.lon], [dest.lat, dest.lon]];
    }
    return [];
  }, [routeData, telemetry, origin, dest]);

  const standardRouteCoords = useMemo(() => {
    const feat = routeData?.geojson?.features?.find(f => f.properties?.name?.includes('Standard'));
    return feat ? feat.geometry.coordinates.map(c => [c[1], c[0]]) : [];
  }, [routeData]);

  const riskZoneCoords = useMemo(() => {
    const feat = routeData?.geojson?.features?.find(f => f.properties?.name?.includes('Adverse'));
    return feat ? feat.geometry.coordinates.map(c => [c[1], c[0]]) : [];
  }, [routeData]);

  // Bounding box for automatic framing to selected trade route
  const mapBounds = useMemo(() => {
    const pts = [];
    if (origin.lat != null && origin.lon != null) pts.push([origin.lat, origin.lon]);
    if (dest.lat != null && dest.lon != null) pts.push([dest.lat, dest.lon]);
    if (safeRouteCoords && safeRouteCoords.length > 0) {
      safeRouteCoords.forEach(p => {
        if (p && p[0] != null && p[1] != null && !isNaN(p[0]) && !isNaN(p[1])) {
          pts.push(p);
        }
      });
    }
    const boundsFunc = L?.latLngBounds || L?.default?.latLngBounds;
    return (pts.length >= 2 && boundsFunc) ? boundsFunc(pts) : null;
  }, [origin, dest, safeRouteCoords]);

  // Active current telemetry point
  const activePoint = telemetry[currentStep] || telemetry[0] || {
    lat: origin.lat || -21.28,
    lon: origin.lon || 149.30,
    heading_deg: 310,
    sog_knots: 13.8,
    distance_traveled_nm: 0,
    distance_remaining_nm: metrics.total_distance_nm || 4650,
    progress_percent: 0,
    cargo_load: `${metrics.cargo_tonnes ? metrics.cargo_tonnes.toLocaleString() : '150,000'} MT ${metrics.cargo_type || 'Coking Coal'}`,
  };

  // Dynamic Route-Adapted Fleet Vessel Movement & Bearing Engine
  const dynamicFleetVessels = useMemo(() => {
    if (!safeRouteCoords || safeRouteCoords.length === 0) return [];

    const totalDistNM = metrics.total_distance_nm || 4650;
    const destName = dest.name ? dest.name.split('(')[0].trim() : (destinationPort || 'Discharge Port');
    const origName = origin.name ? origin.name.split('(')[0].trim() : 'Loading Port';

    const maxSteps = Math.max(1, telemetry.length - 1);
    const stepProgress = maxSteps > 0 ? (currentStep / maxSteps) * 100 : 0;

    return FLEET_VESSEL_SPECS.map(spec => {
      const isSelected = spec.fullName === vesselName || spec.name === vesselName;
      // Active selected charter vessel tracks activePoint progress, others follow staggered route offsets
      const progressPct = isSelected 
        ? Math.max(0, Math.min(100, activePoint.progress_percent || stepProgress))
        : (spec.baseOffset + stepProgress) % 100;

      const pos = getPointAlongPolyline(safeRouteCoords, progressPct);
      const remainingNM = Math.round(totalDistNM * (1 - progressPct / 100));

      const hoursLeft = spec.sog > 0 ? remainingNM / spec.sog : 0;
      const etaDate = new Date(Date.now() + hoursLeft * 3600 * 1000);
      const formattedEta = etaDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + 
        ' ' + etaDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';

      return {
        ...spec,
        lat: pos.lat,
        lon: pos.lon,
        heading_deg: pos.heading,
        progressPct: Number(progressPct.toFixed(1)),
        remainingNM,
        destination: destName,
        originPort: origName,
        eta: formattedEta,
        isSelected
      };
    });
  }, [safeRouteCoords, currentStep, telemetry, vesselName, metrics, dest, origin, activePoint, destinationPort]);

  const selectedVesselObj = useMemo(() => {
    return dynamicFleetVessels.find(v => v.isSelected) || dynamicFleetVessels[0];
  }, [dynamicFleetVessels]);

  // FlyTo Target Center when selected vessel changes or updates position
  const targetCenter = useMemo(() => {
    if (selectedVesselObj?.lat != null && selectedVesselObj?.lon != null) {
      return [selectedVesselObj.lat, selectedVesselObj.lon];
    }
    if (dest.lat != null && dest.lon != null) {
      return [dest.lat, dest.lon];
    }
    return null;
  }, [selectedVesselObj, dest]);

  // Simulation Timer Loop
  useEffect(() => {
    if (!isPlaying || telemetry.length === 0) return;

    const intervalTime = Math.max(100, 1000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= telemetry.length - 1) {
          return 0; // Loop voyage
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, telemetry]);

  // Reset to step 0 when route changes
  useEffect(() => {
    setCurrentStep(0);
  }, [routeData]);

  // Dynamic AIS Telemetry Fuel & ESG CO2 Calculations
  const totalSailingDays = metrics.estimated_sailing_days || 16.5;
  const totalFuelMT = Math.round(totalSailingDays * 55);
  const progressPct = activePoint.progress_percent || 0;
  const currentFuelBurnMT = Math.round(totalFuelMT * (progressPct / 100));
  const dynamicCO2EmissionsMT = Math.round(currentFuelBurnMT * 3.114);
  const isApproachingPort = progressPct > 85;
  const destPortName = dest.name ? dest.name.split('(')[0].trim() : (destinationPort || 'Discharge Port');

  const activeGeofence = useMemo(() => {
    if (!activePoint || activePoint.lat == null || activePoint.lon == null) return null;
    return GEOFENCE_ZONES.find(zone => {
      const distM = haversineDistanceMeters(activePoint.lat, activePoint.lon, zone.center[0], zone.center[1]);
      return distM <= zone.radiusMeters;
    }) || null;
  }, [activePoint]);

  // Tile layer URLs
  const tileUrls = {
    'carto-light': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    'carto-dark': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    'osm': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const tileAttributions = {
    'carto-light': '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    'carto-dark': '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    'osm': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
      
      {/* ── Top Header / HUD Bar ────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Live AIS Maritime Route & GPS Vessel Tracking
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#059669] border border-emerald-200">
                Real-Time GIS
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {routeData?.route_mode || "Deep-Water Capesize Weather-Safe Corridor"} • SIH26006 Decision Engine
            </p>
          </div>
        </div>

        {/* Quick Route Intelligence Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center gap-1.5 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-[#0284C7]" />
            <span className="text-[#64748B]">Distance:</span>
            <span className="font-bold text-[#0F172A] font-mono">
              {metrics.total_distance_nm ? `${metrics.total_distance_nm.toLocaleString()} NM` : '4,650 NM'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center gap-1.5 shadow-xs">
            <Waves className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[#64748B]">Est. Sea Transit:</span>
            <span className="font-bold text-[#10B981] font-mono">
              {metrics.estimated_sailing_days ? `~${metrics.estimated_sailing_days} Days` : '~16.5 Days'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center gap-1.5 font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Safety: {metrics.safety_score_percent || 96}%</span>
          </div>
        </div>
      </div>

      {/* ── Main Map Canvas Container ────────────────────────────────────────── */}
      <div className="relative w-full h-[540px] bg-slate-900 overflow-hidden">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-[#0F172A] tracking-wider uppercase">
              Calculating Safe Navigational Corridors...
            </p>
          </div>
        )}

        <MapContainer
          center={[0, 115]}
          zoom={3}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Base Vector Tile Layer */}
          <TileLayer
            url={tileUrls[tileMode]}
            attribution={tileAttributions[tileMode]}
          />

          {/* Smooth FlyTo Controller on Vessel / Destination Change */}
          <MapFlyToController targetCenter={targetCenter} />

          {/* ── Feature 1: Dynamic Weather Raster Layer ────────────────────── */}
          {showWeatherRaster && (
            <TileLayer
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              opacity={0.65}
              zIndex={500}
              attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a>'
            />
          )}

          {/* Auto-Fit View to Waypoints */}
          <MapBoundsAdjuster bounds={mapBounds} />

          {/* ── Feature 3: Geofence Zones (200km Radius Circles) ─────────────── */}
          {GEOFENCE_ZONES.map((zone) => (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radiusMeters}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.12,
                weight: 1.8,
                dashArray: '5, 8',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold text-[#0F172A]">
                  🛡️ {zone.name} (200km Sentinel Geofence)
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Swells: {zone.swells} | Wind: {zone.wind}
                  </div>
                </div>
              </Tooltip>
            </Circle>
          ))}

          {/* ── Polylines: Multi-Route Overlay ──────────────────────────────── */}
          {/* 1. Optimal Weather-Safe Route (Solid Emerald) */}
          {showSafeRoute && safeRouteCoords.length > 0 && (
            <Polyline
              positions={safeRouteCoords}
              pathOptions={{
                color: '#10B981',
                weight: 4.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold text-[#0F172A]">
                  🟢 Optimal Weather-Safe Route ({metrics.total_distance_nm || 4650} NM)
                </div>
              </Tooltip>
            </Polyline>
          )}

          {/* 2. Standard Primary Marine Track (Dashed Blue) */}
          {showStandardRoute && standardRouteCoords.length > 0 && (
            <Polyline
              positions={standardRouteCoords}
              pathOptions={{
                color: '#0284C7',
                weight: 2.5,
                opacity: 0.75,
                dashArray: '6, 8',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold text-[#0F172A]">
                  🔵 Standard Commercial Passage (Via Malacca)
                </div>
              </Tooltip>
            </Polyline>
          )}

          {/* 3. High-Risk / Adverse Weather Zone (Dashed Red) */}
          {showRiskZone && riskZoneCoords.length > 0 && (
            <Polyline
              positions={riskZoneCoords}
              pathOptions={{
                color: '#EF4444',
                weight: 2.5,
                opacity: 0.8,
                dashArray: '4, 8',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold text-[#EF4444]">
                  🔴 Adverse Monsoon Swell / Draft Hazard Corridor
                </div>
              </Tooltip>
            </Polyline>
          )}

          {/* ── Origin Port Marker ────────────────────────────────────────── */}
          {origin.lat && origin.lon && (
            <Marker
              position={[origin.lat, origin.lon]}
              icon={createPortIcon('origin', origin.name || 'Origin Port')}
            >
              <Popup>
                <div className="p-1 space-y-1 font-sans text-xs">
                  <div className="font-bold text-[#10B981] uppercase tracking-wider text-[11px]">
                    📍 Overseas Loading Terminal
                  </div>
                  <div className="font-extrabold text-[#0F172A] text-sm">{origin.name}</div>
                  <div className="text-[#64748B]">Country: <b>{origin.country}</b></div>
                  <div className="text-[#64748B]">Berth Depth: <b>{origin.berth_depth_m || 19.5}m</b></div>
                  <div className="text-[#64748B]">Max Berth Fit: <b>{origin.max_vessel || 'Capesize'}</b></div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Destination Port Marker ───────────────────────────────────── */}
          {dest.lat && dest.lon && (
            <Marker
              position={[dest.lat, dest.lon]}
              icon={createPortIcon('destination', dest.name || 'Discharge Port')}
            >
              <Popup>
                <div className="p-1 space-y-1 font-sans text-xs">
                  <div className="font-bold text-[#EF4444] uppercase tracking-wider text-[11px]">
                    ⚓ Indian Discharge Port
                  </div>
                  <div className="font-extrabold text-[#0F172A] text-sm">{dest.name}</div>
                  <div className="text-[#64748B]">Max Safe Draft: <b>{dest.max_draft_m || 17.5}m</b></div>
                  <div className="text-[#64748B]">Max DWT: <b>{dest.max_vessel_dwt ? `${dest.max_vessel_dwt.toLocaleString()} DWT` : '180,000 DWT'}</b></div>
                  <div className="text-[#64748B]">Discharge Rate: <b>{dest.discharge_tpd ? `${dest.discharge_tpd.toLocaleString()} TPD` : '28,000 TPD'}</b></div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Intermediate Maritime Choke Points ───────────────────────── */}
          {showChokePoints && chokepoints.map((cp) => (
            <Marker
              key={cp.id}
              position={[cp.lat, cp.lon]}
              icon={createChokePointIcon(cp.name, cp.risk_type, cp.status)}
            >
              <Popup>
                <div className="p-1 space-y-1 font-sans text-xs max-w-[220px]">
                  <div className="font-bold text-[#0284C7] uppercase tracking-wider text-[10px]">
                    ⚠️ Strategic Maritime Waypoint
                  </div>
                  <div className="font-bold text-[#0F172A] text-xs">{cp.name}</div>
                  <div className="text-[11px] text-[#475569]">{cp.description}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span className="text-[#64748B]">Status:</span>
                    <span className={`font-bold ${cp.status?.includes('WARNING') ? 'text-[#EF4444]' : cp.status?.includes('AVOIDED') ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                      {cp.status || 'SAFE'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Feature: Dynamic Route-Adapted AIS Fleet Vessel Markers ────────── */}
          {dynamicFleetVessels.map((v) => (
            <Marker
              key={v.fullName}
              position={[v.lat, v.lon]}
              icon={createShipIcon(v.heading_deg, v.sog, v.isSelected)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 font-sans text-xs min-w-[250px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-extrabold text-[#0F172A] text-xs flex items-center gap-1.5">
                      <Ship className="w-4 h-4 text-[#10B981]" />
                      {v.name} ({v.class})
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      v.isSelected ? 'text-[#10B981] bg-emerald-50 border border-emerald-200' : 'text-[#0284C7] bg-sky-50 border border-sky-200'
                    }`}>
                      {v.isSelected ? 'ACTIVE CHARTERED' : 'AIS LIVE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Status:</span>
                      <span className="font-bold text-[#0F172A]">{v.status}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Speed (SOG):</span>
                      <span className="font-mono font-bold text-[#10B981]">{v.sog} Knots</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Heading (COG):</span>
                      <span className="font-mono font-bold text-[#0F172A]">{v.heading_deg}° True</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Coordinates:</span>
                      <span className="font-mono font-bold text-[#0284C7]">{v.lat.toFixed(2)}°, {v.lon.toFixed(2)}°</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-[10px] space-y-1">
                    <div className="text-[#475569]">
                      <b>Trade Route:</b> <span className="font-bold text-[#0F172A]">{v.originPort} → {v.destination}</span>
                    </div>
                    <div className="text-[#475569]">
                      <b>Distance Remaining:</b> <span className="font-mono font-bold text-[#0F172A]">{v.remainingNM.toLocaleString()} NM</span> ({v.progressPct}%)
                    </div>
                    <div className="text-[#475569]">
                      <b>Dynamic ETA:</b> <span className="font-bold text-[#10B981]">{v.eta}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Real-Time Animated Voyage Route Telemetry Marker ──────────────── */}
          {activePoint.lat && activePoint.lon && (
            <Marker
              position={[activePoint.lat, activePoint.lon]}
              icon={createShipIcon(activePoint.heading_deg, activePoint.sog_knots, true)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 font-sans text-xs min-w-[240px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-extrabold text-[#0F172A] text-xs flex items-center gap-1.5">
                      <Ship className="w-4 h-4 text-[#10B981]" />
                      {vesselName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] bg-emerald-50 px-1.5 py-0.5 rounded">
                      VOYAGE ANIMATED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Coordinates:</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {activePoint.lat?.toFixed(2)}°, {activePoint.lon?.toFixed(2)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Speed (SOG):</span>
                      <span className="font-mono font-bold text-[#10B981]">
                        {activePoint.sog_knots} Knots
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Heading:</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {activePoint.heading_deg}° True
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Progress:</span>
                      <span className="font-mono font-bold text-[#0284C7]">
                        {activePoint.progress_percent}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-[10px] space-y-1">
                    <div className="text-[#475569]">
                      <b>Cargo:</b> {activePoint.cargo_load}
                    </div>
                    <div className="text-[#475569]">
                      <b>Distance Left:</b> {activePoint.distance_remaining_nm?.toLocaleString()} NM
                    </div>
                    <div className="text-[#475569]">
                      <b>Demurrage Risk:</b> <span className="font-bold" style={{ color: metrics.demurrage_color || '#10B981' }}>{metrics.demurrage_risk_level || 'LOW'}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* ── Feature 2: Enhanced Floating AIS Telemetry Card (Top Left) ──── */}
        <div className="absolute top-4 left-4 z-[900] bg-white/94 backdrop-blur-md border border-[#E2E8F0] rounded-xl p-3.5 shadow-lg max-w-[280px] text-xs space-y-2.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-[#10B981]" />
              AIS Telemetry
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#059669] bg-emerald-100 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
              LIVE TRACK
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Lat/Lon:</span>
              <span className="font-bold text-[#0F172A]">{activePoint.lat?.toFixed(2)}°, {activePoint.lon?.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Speed (SOG):</span>
              <span className="font-bold text-[#10B981]">{activePoint.sog_knots} kts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Course Heading:</span>
              <span className="font-bold text-[#0F172A]">{activePoint.heading_deg}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Fuel Burn (VLSFO):</span>
              <span className="font-bold text-[#F59E0B]">{currentFuelBurnMT} / {totalFuelMT} MT</span>
            </div>
            
            {/* Dynamic ESG CO2 Emissions Metric */}
            <div className="flex justify-between items-center bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
              <span className="text-[#64748B] flex items-center gap-1 text-[10px]">
                <Flame className="w-3 h-3 text-[#EF4444]" /> CO2 Emissions:
              </span>
              <span className="font-bold text-[#EF4444] font-mono text-[11px]">{dynamicCO2EmissionsMT} MT</span>
            </div>
          </div>

          {/* Dynamic Under-Keel Clearance (UKC) Status Badge */}
          <div className="pt-1.5 border-t border-slate-100">
            <span className="text-[10px] text-[#64748B] block mb-1 font-semibold">Under-Keel Clearance (UKC):</span>
            {!isApproachingPort ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0284C7] bg-sky-50 px-2 py-1 rounded-md border border-sky-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-pulse"></span>
                <span>UKC Status: Ocean Transit (Deep Water)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>UKC Safe: +2.4m Draft Margin ({destPortName} Outer Harbour)</span>
              </div>
            )}
          </div>

          {/* Voyage Progress Bar */}
          <div className="pt-1.5 border-t border-slate-100">
            <div className="flex justify-between text-[10px] text-[#64748B] mb-1">
              <span>Voyage Completion</span>
              <span className="font-bold text-[#0F172A]">{activePoint.progress_percent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#10B981] h-full transition-all duration-300"
                style={{ width: `${activePoint.progress_percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* ── Feature 3: Floating Geofence Waypoint Alert Banner (Bottom Center) ── */}
        {activeGeofence && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[950] bg-slate-900/92 backdrop-blur-md border border-emerald-500/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-lg pointer-events-auto border-l-4 border-l-[#10B981]">
            <div className="w-3 h-3 rounded-full bg-[#10B981] animate-ping shrink-0"></div>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#10B981] uppercase tracking-wider text-[10px]">
                  📍 Geofence Entered: {activeGeofence.name}
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-[#10B981] px-1.5 py-0.2 rounded font-mono font-bold">
                  200km RAD
                </span>
              </div>
              <div className="text-slate-300 text-[11px] mt-0.5">
                Swell: <b className="text-white">{activeGeofence.swells}</b> • Wind: <b className="text-white">{activeGeofence.wind}</b> • Speed: <b className="text-[#10B981]">{activePoint.sog_knots} kts</b> • <span className="text-amber-300 font-medium">{activeGeofence.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Feature 1: Route Layers & Basemap Control (Top Right) ────────── */}
        <div className="absolute top-4 right-4 z-[900] bg-white/94 backdrop-blur-md border border-[#E2E8F0] rounded-xl p-3 shadow-lg text-xs space-y-2 pointer-events-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
            ROUTE LAYERS & BASEMAP
          </div>

          <div className="space-y-1.5 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSafeRoute} 
                onChange={(e) => setShowSafeRoute(e.target.checked)}
                className="rounded text-[#10B981] focus:ring-0"
              />
              <span className="w-3 h-0.5 bg-[#10B981] rounded"></span>
              <span className="text-[#0F172A] font-medium">Optimal Safe Route</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showStandardRoute} 
                onChange={(e) => setShowStandardRoute(e.target.checked)}
                className="rounded text-[#0284C7] focus:ring-0"
              />
              <span className="w-3 h-0.5 bg-[#0284C7] border-dashed border-b rounded"></span>
              <span className="text-[#0F172A] font-medium">Standard Passage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showRiskZone} 
                onChange={(e) => setShowRiskZone(e.target.checked)}
                className="rounded text-[#EF4444] focus:ring-0"
              />
              <span className="w-3 h-0.5 bg-[#EF4444] border-dashed border-b rounded"></span>
              <span className="text-[#0F172A] font-medium">Adverse Weather Zone</span>
            </label>

            {/* Live Weather Raster Layer Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-slate-100">
              <input 
                type="checkbox" 
                checked={showWeatherRaster} 
                onChange={(e) => setShowWeatherRaster(e.target.checked)}
                className="rounded text-[#0EA5E9] focus:ring-0"
              />
              <CloudRain className="w-3 h-3 text-[#0EA5E9]" />
              <span className="text-[#0F172A] font-medium">Live Weather (Wind/Swells)</span>
            </label>
          </div>

          {/* Tile layer selector */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1">
            <button
              onClick={() => setTileMode('carto-light')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${tileMode === 'carto-light' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'}`}
            >
              Light
            </button>
            <button
              onClick={() => setTileMode('carto-dark')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${tileMode === 'carto-dark' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'}`}
            >
              Dark Ops
            </button>
            <button
              onClick={() => setTileMode('osm')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${tileMode === 'osm' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'}`}
            >
              OSM
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Playback & Simulation Control Bar ─────────────────────────── */}
      <div className="px-6 py-3.5 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        
        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Voyage
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume AIS
              </>
            )}
          </button>

          <button
            onClick={() => setCurrentStep(0)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#475569] transition-colors cursor-pointer"
            title="Restart Voyage from Origin Port"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Playback speed selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${playbackSpeed === spd ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'}`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Voyage Timeline Slider */}
        <div className="flex-1 max-w-md flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#64748B] whitespace-nowrap">
            Day {Math.round((activePoint.hours_from_departure || 0) / 24)} / {metrics.estimated_sailing_days || 16.5}
          </span>
          <input
            type="range"
            min="0"
            max={Math.max(0, telemetry.length - 1)}
            value={currentStep}
            onChange={(e) => {
              setCurrentStep(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
          />
          <span className="text-[11px] font-mono font-bold text-[#0F172A] whitespace-nowrap">
            {activePoint.distance_remaining_nm?.toLocaleString()} NM Left
          </span>
        </div>

        {/* Advisory Reason Banner */}
        <div className="text-xs text-[#64748B] flex items-center gap-1.5 max-w-sm truncate">
          <Info className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
          <span className="truncate">{routeData?.safety_reason || "Enforcing deep-water draft-compliant route via Lombok Strait."}</span>
        </div>
      </div>

    </div>
  );
}