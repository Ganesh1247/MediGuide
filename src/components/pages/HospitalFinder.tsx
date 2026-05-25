import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  MapPin, Phone, Navigation, RefreshCw, ExternalLink,
  Search, Locate, X, AlertCircle, ChevronRight, Loader2,
  Heart, Brain, Bone, Baby, Eye, Smile, Filter
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Hospital {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: string;
  phone?: string;
  website?: string;
  address?: string;
  distance?: number;
}

interface HospitalType {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  description: string;
  overpassFilter: string;
}

// ─── Hospital Type Definitions ───────────────────────────────────────────────
const HOSPITAL_TYPES: HospitalType[] = [
  {
    id: "general",
    label: "General / Emergency",
    emoji: "🏥",
    color: "var(--red-alert)",
    bg: "var(--red-muted)",
    description: "24/7 emergency departments & multi-specialty hospitals",
    overpassFilter: `node["amenity"="hospital"](around:{RADIUS},{LAT},{LNG});way["amenity"="hospital"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "cardiology",
    label: "Cardiology / Heart",
    emoji: "❤️",
    color: "var(--red-alert)",
    bg: "var(--red-muted)",
    description: "Heart hospitals, cardiac care centres & cath labs",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"cardiology|cardiac"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Cc]ardiac|[Hh]eart|[Cc]ardio"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "neurology",
    label: "Neurology / Brain",
    emoji: "🧠",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    description: "Neuro hospitals, stroke centres & brain surgery",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"neurology|neurosurgery"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Nn]euro|[Bb]rain|[Ss]troke"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "orthopedic",
    label: "Orthopedic / Bone",
    emoji: "🦴",
    color: "var(--amber-warn)",
    bg: "var(--amber-muted)",
    description: "Bone & joint hospitals, fracture care & sports medicine",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"orthopaedics|orthopedics"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Oo]rtho|[Bb]one|[Jj]oint"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "maternity",
    label: "Maternity / Women",
    emoji: "👶",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.1)",
    description: "Maternity hospitals, gynaecology & women's health",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"gynaecology|maternity|obstetrics"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Mm]ater|[Ww]omen|[Gg]yne|[Ll]ady"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "cancer",
    label: "Cancer / Oncology",
    emoji: "🎗️",
    color: "#6EE7B7",
    bg: "rgba(110,231,183,0.1)",
    description: "Cancer hospitals, chemotherapy & radiation centres",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"oncology|cancer"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Cc]ancer|[Oo]nco"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "eye",
    label: "Eye Care / Ophthalmic",
    emoji: "👁️",
    color: "var(--blue)",
    bg: "var(--blue-muted)",
    description: "Eye hospitals, lasik centres & ophthalmic surgery",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"ophthalmology"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Ee]ye|[Oo]phthal|[Vv]ision|[Ss]ankar"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "dental",
    label: "Dental / Oral",
    emoji: "🦷",
    color: "var(--blue)",
    bg: "var(--blue-muted)",
    description: "Dental hospitals, orthodontics & oral surgery",
    overpassFilter: `node["amenity"="dentist"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Dd]ental|[Oo]ral"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "psychiatric",
    label: "Psychiatric / Mental",
    emoji: "🧘",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    description: "Mental health hospitals, psychiatric care & rehabilitation",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"psychiatry|mental_health"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Mm]ental|[Pp]sychi|[Rr]ehab"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "dialysis",
    label: "Dialysis / Kidney",
    emoji: "💧",
    color: "var(--blue)",
    bg: "var(--blue-muted)",
    description: "Nephrology hospitals, dialysis centres & kidney care",
    overpassFilter: `node["amenity"="hospital"]["healthcare:speciality"~"nephrology|dialysis"](around:{RADIUS},{LAT},{LNG});node["amenity"="hospital"]["name"~"[Kk]idney|[Nn]ephro|[Dd]ialys"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "pharmacy",
    label: "Pharmacy / Chemist",
    emoji: "💊",
    color: "var(--green-ok)",
    bg: "var(--green-muted)",
    description: "24-hour pharmacies, medical stores & drug dispensaries",
    overpassFilter: `node["amenity"="pharmacy"](around:{RADIUS},{LAT},{LNG});`
  },
  {
    id: "clinic",
    label: "Clinic / Outpatient",
    emoji: "🩺",
    color: "var(--green-ok)",
    bg: "var(--green-muted)",
    description: "General clinics, primary health centres & outpatient facilities",
    overpassFilter: `node["amenity"="clinic"](around:{RADIUS},{LAT},{LNG});node["amenity"="health_post"](around:{RADIUS},{LAT},{LNG});`
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildOverpassQuery(filter: string, radius: number, lat: number, lng: number) {
  const filled = filter
    .replaceAll("{RADIUS}", String(radius))
    .replaceAll("{LAT}", String(lat))
    .replaceAll("{LNG}", String(lng));
  return `[out:json][timeout:30];(${filled});out body;>;out skel qt;`;
}

function makeIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="28" height="36">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="${color}" opacity="0.9"/>
    <circle cx="16" cy="15" r="7" fill="white" opacity="0.92"/>
    <text x="16" y="19" text-anchor="middle" fill="${color}" font-size="9" font-weight="bold" font-family="system-ui">+</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

function userIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
    <circle cx="16" cy="16" r="14" fill="#F97316" opacity="0.9" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
}

const RADIUS_OPTIONS = [
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function HospitalFinder() {
  const [selectedType, setSelectedType] = useState<HospitalType | null>(null);
  const [radius, setRadius] = useState(5000);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsState, setGpsState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // ── Init Map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Update markers when hospitals change ─────────────────────────────────
  useEffect(() => {
    if (!markersLayerRef.current || !mapRef.current) return;
    markersLayerRef.current.clearLayers();

    if (userCoords) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const um = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon(), zIndexOffset: 1000 })
        .addTo(mapRef.current)
        .bindPopup("<b style='color:var(--accent)'>📍 Your Location</b>");
      userMarkerRef.current = um;
    }

    hospitals.forEach((h) => {
      const color = selectedType?.color ?? "var(--accent)";
      const marker = L.marker([h.lat, h.lng], { icon: makeIcon(color) })
        .addTo(markersLayerRef.current!)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:180px">
            <p style="font-weight:700;font-size:14px;color:var(--text-primary);margin:0 0 4px">${h.name}</p>
            ${h.address ? `<p style="font-size:12px;color:var(--text-secondary);margin:0 0 6px">${h.address}</p>` : ""}
            ${h.distance != null ? `<span style="font-size:11px;font-weight:600;color:var(--accent)">📍 ${h.distance.toFixed(1)} km away</span>` : ""}
            ${h.phone ? `<br/><a href="tel:${h.phone}" style="font-size:12px;color:var(--blue)">📞 ${h.phone}</a>` : ""}
          </div>`
        );
      marker.on("click", () => setSelectedHospital(h));
    });

    if (hospitals.length > 0 && userCoords) {
      const group = L.featureGroup([
        ...hospitals.map((h) => L.marker([h.lat, h.lng])),
        L.marker([userCoords.lat, userCoords.lng])
      ]);
      mapRef.current?.fitBounds(group.getBounds().pad(0.15));
    }
  }, [hospitals, userCoords, selectedType]);

  // ── Request GPS ─────────────────────────────────────────────────────────────
  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState("denied");
      setError("Your browser doesn't support geolocation.");
      return;
    }
    setGpsState("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGpsState("granted");
        mapRef.current?.setView([coords.lat, coords.lng], 13);
        if (userMarkerRef.current) userMarkerRef.current.remove();
        const um = L.marker([coords.lat, coords.lng], { icon: userIcon(), zIndexOffset: 1000 })
          .addTo(mapRef.current!)
          .bindPopup("<b>📍 Your Location</b>")
          .openPopup();
        userMarkerRef.current = um;
      },
      (err) => {
        setGpsState("denied");
        setError(
          err.code === 1
            ? "Location access denied. Please enable GPS in your browser settings and try again."
            : "Unable to get your location. Please check your device GPS."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // ── Fetch Hospitals ─────────────────────────────────────────────────────────
  const fetchHospitals = useCallback(async (type: HospitalType) => {
    if (!userCoords) return;
    setLoading(true);
    setError(null);
    setHospitals([]);
    setSelectedHospital(null);

    try {
      const query = buildOverpassQuery(type.overpassFilter, radius, userCoords.lat, userCoords.lng);
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!res.ok) throw new Error("Overpass API error");
      const data = await res.json();

      const seen = new Set<number>();
      const results: Hospital[] = [];

      for (const el of data.elements) {
        if (!el.lat || !el.lng) continue;
        if (seen.has(el.id)) continue;
        seen.add(el.id);

        const name = el.tags?.name || el.tags?.["name:en"] || "Unnamed Facility";
        if (name === "Unnamed Facility" && !el.tags?.["amenity"]) continue;

        const dist = haversineKm(userCoords.lat, userCoords.lng, el.lat, el.lng);
        results.push({
          id: el.id,
          name,
          lat: el.lat,
          lng: el.lng,
          type: el.tags?.amenity || "hospital",
          phone: el.tags?.phone || el.tags?.["contact:phone"],
          website: el.tags?.website || el.tags?.["contact:website"],
          address: [
            el.tags?.["addr:housenumber"],
            el.tags?.["addr:street"],
            el.tags?.["addr:city"],
          ].filter(Boolean).join(", ") || el.tags?.["addr:full"],
          distance: dist,
        });
      }

      results.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
      setHospitals(results.slice(0, 40));

      if (results.length === 0) {
        setError(`No ${type.label} facilities found within ${radius / 1000} km of your location. Try increasing the search radius.`);
      }
    } catch (e: any) {
      setError("Failed to fetch hospitals. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [userCoords, radius]);

  // Re-fetch when radius changes and a type is already selected
  useEffect(() => {
    if (selectedType && userCoords && gpsState === "granted") {
      fetchHospitals(selectedType);
    }
  }, [radius]);

  const handleTypeSelect = (type: HospitalType) => {
    setSelectedType(type);
    if (gpsState !== "granted") {
      requestGPS();
    } else {
      fetchHospitals(type);
    }
  };

  // Trigger fetch once GPS granted (after type was already selected)
  useEffect(() => {
    if (gpsState === "granted" && selectedType && hospitals.length === 0 && !loading) {
      fetchHospitals(selectedType);
    }
  }, [gpsState]);

  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 py-6 animate-fadeIn">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span style={{ color: "var(--accent)" }}>🏥</span> Hospital Finder
          </h1>
          <p className="section-subtitle">
            Select the type of care you need — we'll find the nearest facilities using your live GPS location.
          </p>
        </div>

        {/* Radius selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5" style={{ color: "var(--text-dim)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Radius:</span>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRadius(r.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: radius === r.value ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                  background: radius === r.value ? "var(--accent-muted)" : "var(--bg-surface)",
                  color: radius === r.value ? "var(--accent)" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GPS Status Banner ───────────────────────────────────────────────── */}
      {gpsState === "idle" && (
        <div
          className="card p-4 flex items-center gap-3 cursor-pointer"
          style={{ borderColor: "var(--border-accent)", background: "var(--accent-muted)" }}
          onClick={requestGPS}
        >
          <Locate className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Enable GPS Location</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              We need your location to find hospitals near you. Tap to enable — then select a hospital type below.
            </p>
          </div>
          <button className="btn-primary" style={{ fontSize: 12 }}>
            <Locate className="w-3.5 h-3.5" /> Allow Location
          </button>
        </div>
      )}

      {gpsState === "requesting" && (
        <div className="card p-4 flex items-center gap-3" style={{ borderColor: "var(--border-accent)" }}>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: "var(--accent)" }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Requesting location access — please allow GPS in your browser popup…
          </p>
        </div>
      )}

      {gpsState === "denied" && (
        <div className="card p-4 flex items-start gap-3" style={{ borderColor: "var(--red-alert)", background: "var(--red-muted)" }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--red-alert)" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--red-alert)" }}>Location Access Denied</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
              {error || "Please enable location permissions in your browser settings, then try again."}
            </p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={requestGPS}>
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {gpsState === "granted" && (
        <div className="card p-3 flex items-center gap-2.5"
          style={{ borderColor: "var(--green-ok)", background: "var(--green-muted)" }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--green-ok)", flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "var(--green-ok)", fontWeight: 600 }}>
            GPS Active — Location acquired
          </p>
          <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: "auto" }}>
            {userCoords?.lat.toFixed(4)}°N, {userCoords?.lng.toFixed(4)}°E
          </span>
        </div>
      )}

      {/* ── Hospital Type Grid ───────────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Select the type of hospital you need:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {HOSPITAL_TYPES.map((type) => {
            const isActive = selectedType?.id === type.id;
            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                  border: isActive ? `2px solid ${type.color}` : "1px solid var(--border)",
                  background: isActive ? type.bg : "var(--bg-surface)",
                  boxShadow: isActive ? `0 4px 18px ${type.color}25` : "var(--shadow-sm)",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{type.emoji}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: isActive ? type.color : "var(--text-secondary)",
                  textAlign: "center", lineHeight: 1.3
                }}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Type Details ────────────────────────────────────────────── */}
      {selectedType && (
        <div className="card p-4 flex items-center gap-4" style={{ borderColor: selectedType.color + "40", background: selectedType.bg }}>
          <span style={{ fontSize: 32 }}>{selectedType.emoji}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{selectedType.label}</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{selectedType.description}</p>
          </div>
          {loading && <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: selectedType.color }} />}
          {!loading && hospitals.length > 0 && (
            <span className="badge" style={{
              background: selectedType.bg,
              color: selectedType.color,
              border: `1px solid ${selectedType.color}40`,
              fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100
            }}>
              {hospitals.length} found
            </span>
          )}
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && !loading && gpsState === "granted" && (
        <div className="card p-4 flex items-start gap-3" style={{ borderColor: "var(--amber-warn)", background: "var(--amber-muted)" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--amber-warn)" }} />
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{error}</p>
        </div>
      )}

      {/* ── Map + Results ────────────────────────────────────────────────────── */}
      {(selectedType || hospitals.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* Map */}
          <div
            className="lg:col-span-7 card overflow-hidden"
            style={{ height: 480, padding: 0, position: "relative" }}
          >
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
            {loading && (
              <div style={{
                position: "absolute", inset: 0, background: "rgba(10,10,15,0.7)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                zIndex: 1000, borderRadius: 16,
              }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
                <p style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 600 }}>
                  Searching hospitals near you…
                </p>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search className="w-4 h-4" style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-dim)"
              }} />
              <input
                type="text"
                className="input"
                placeholder="Search in results…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Hospital Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}
              className="no-scrollbar"
            >
              {filtered.length === 0 && !loading && selectedType && gpsState === "granted" && !error && (
                <div className="card p-8 text-center" style={{ color: "var(--text-dim)", fontSize: 13 }}>
                  No results found for your search.
                </div>
              )}

              {filtered.map((h) => {
                const isSelected = selectedHospital?.id === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHospital(h);
                      mapRef.current?.setView([h.lat, h.lng], 15);
                    }}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      cursor: "pointer",
                      border: isSelected ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--accent-muted)" : "var(--bg-surface)",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: selectedType?.bg ?? "var(--accent-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>
                      {selectedType?.emoji ?? "🏥"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 700, fontSize: 13, color: "var(--text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {h.name}
                      </p>
                      {h.address && (
                        <p style={{
                          fontSize: 11, color: "var(--text-secondary)", marginTop: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {h.address}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                        {h.distance != null && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                            📍 {h.distance.toFixed(1)} km
                          </span>
                        )}
                        {h.phone && (
                          <a
                            href={`tel:${h.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 11, color: "var(--blue)", display: "flex", alignItems: "center", gap: 3 }}
                          >
                            <Phone className="w-3 h-3" /> {h.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn-primary"
                        style={{ padding: "5px 10px", fontSize: 11, gap: 4, borderRadius: 8 }}
                      >
                        <Navigation className="w-3 h-3" /> Go
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {!selectedType && gpsState !== "idle" && (
        <div className="card p-12 text-center">
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏥</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
            Select a hospital type above
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
            Choose what kind of care you need and we'll find the nearest facilities on the map.
          </p>
        </div>
      )}

    </div>
  );
}
