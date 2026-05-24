import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  Clock,
  ExternalLink,
  Locate,
  X,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NearbyHospital {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: string;
  phone?: string;
  website?: string;
  emergency?: string;
  speciality?: string;
  address?: string;
  openingHours?: string;
  distance?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

const RADIUS_OPTIONS = [
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

function getTypeLabel(type: string): string {
  switch (type) {
    case "hospital": return "🏥 Hospital";
    case "clinic":   return "🩺 Clinic";
    case "doctors":  return "👨‍⚕️ Doctors";
    default:         return "🏥 Medical";
  }
}

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case "hospital": return "bg-red-alert/10 text-red-alert border-red-alert/25";
    case "clinic":   return "bg-teal-glow/10 text-teal-glow border-teal-glow/25";
    default:         return "bg-blue-electric/10 text-blue-electric border-blue-electric/20";
  }
}

function createHospitalPin(selected: boolean): string {
  const fill = selected ? "#7C3AED" : "#DC2626";
  const glow = selected
    ? "0 4px 18px rgba(124,58,237,0.55)"
    : "0 4px 14px rgba(220,38,38,0.45)";
  return `
    <div style="position:relative;width:38px;height:38px;">
      <div style="
        width:38px;height:38px;
        background:${fill};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:${glow};
      "></div>
      <span style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-62%);
        font-size:16px;
        pointer-events:none;user-select:none;
      ">🏥</span>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function NearbyHospitalsMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const userDotRef      = useRef<L.CircleMarker | null>(null);
  const userRingRef     = useRef<L.CircleMarker | null>(null);
  const markersRef      = useRef<Map<number, L.Marker>>(new Map());

  const [userLoc,       setUserLoc]       = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals,     setHospitals]     = useState<NearbyHospital[]>([]);
  const [selected,      setSelected]      = useState<NearbyHospital | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [radius,        setRadius]        = useState(5000);
  const [fetchedAt,     setFetchedAt]     = useState<Date | null>(null);
  const [mapReady,      setMapReady]      = useState(false);

  // ── Initialize Leaflet map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
    });

    // CARTO Voyager – clean, modern, premium style tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    // Position zoom control in bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Fetch hospitals from Overpass API ────────────────────────────────────
  const fetchHospitals = useCallback(async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    setError(null);

    const q = `
      [out:json][timeout:30];
      (
        node["amenity"="hospital"](around:${rad},${lat},${lng});
        way["amenity"="hospital"](around:${rad},${lat},${lng});
        relation["amenity"="hospital"](around:${rad},${lat},${lng});
        node["amenity"="clinic"](around:${rad},${lat},${lng});
        way["amenity"="clinic"](around:${rad},${lat},${lng});
        node["healthcare"="hospital"](around:${rad},${lat},${lng});
        node["amenity"="doctors"](around:${rad},${lat},${lng});
      );
      out body center;
    `;

    try {
      const resp = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(q)}`,
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      const parsed: NearbyHospital[] = json.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const elLat = el.lat ?? el.center?.lat ?? 0;
          const elLng = el.lon ?? el.center?.lon ?? 0;
          return {
            id: el.id,
            name: el.tags.name,
            lat: elLat,
            lng: elLng,
            type: el.tags.amenity || el.tags.healthcare || "hospital",
            phone:
              el.tags.phone ||
              el.tags["contact:phone"] ||
              el.tags["phone:in"] ||
              undefined,
            website:
              el.tags.website ||
              el.tags["contact:website"] ||
              undefined,
            emergency: el.tags.emergency,
            speciality: el.tags.speciality || el.tags.healthcare,
            address: [
              el.tags["addr:housenumber"],
              el.tags["addr:street"],
              el.tags["addr:city"] || el.tags["addr:district"],
            ]
              .filter(Boolean)
              .join(", ") || undefined,
            openingHours: el.tags.opening_hours,
            distance: haversineKm(lat, lng, elLat, elLng),
          };
        })
        .sort(
          (a: NearbyHospital, b: NearbyHospital) =>
            (a.distance ?? 0) - (b.distance ?? 0)
        );

      setHospitals(parsed);
      setFetchedAt(new Date());

      // ── Drop map markers ──────────────────────────────────────────────
      const map = mapRef.current;
      if (map) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();

        parsed.forEach((hosp) => {
          const icon = L.divIcon({
            className: "",
            html: createHospitalPin(false),
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -42],
          });

          const marker = L.marker([hosp.lat, hosp.lng], { icon }).addTo(map);

          marker.bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;min-width:190px;padding:2px">
              <div style="font-weight:800;font-size:13px;color:#1E1B4B;margin-bottom:3px;">${hosp.name}</div>
              <div style="font-size:10px;color:#64748b;">📍 ${hosp.distance?.toFixed(2)} km away</div>
              ${hosp.phone ? `<div style="font-size:10px;color:#059669;margin-top:4px;">📞 ${hosp.phone}</div>` : ""}
              <a href="https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}" target="_blank"
                style="display:inline-block;margin-top:8px;padding:4px 10px;background:#7C3AED;color:white;font-size:10px;font-weight:700;border-radius:6px;text-decoration:none;">
                🧭 Get Directions
              </a>
            </div>
          `);

          marker.on("click", () => setSelected(hosp));
          markersRef.current.set(hosp.id, marker);
        });

        // Fit map to include user + top hospitals
        if (parsed.length > 0) {
          const bounds = L.latLngBounds([
            [lat, lng],
            ...parsed.slice(0, 8).map((h) => [h.lat, h.lng] as [number, number]),
          ]);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    } catch (err) {
      console.error("Overpass fetch failed:", err);
      setError(
        "Could not load nearby hospitals. The map data service may be busy — please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Locate user via Geolocation API ─────────────────────────────────────
  const locateUser = useCallback(() => {
    setLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setLocating(false);

        const map = mapRef.current;
        if (map) {
          // Remove previous user indicators
          userRingRef.current?.remove();
          userDotRef.current?.remove();

          // Outer pulsing ring
          const ring = L.circleMarker([loc.lat, loc.lng], {
            radius: 22,
            fillColor: "#7C3AED",
            color: "#7C3AED",
            weight: 1.5,
            fillOpacity: 0.12,
            opacity: 0.4,
          }).addTo(map);

          // Inner solid dot
          const dot = L.circleMarker([loc.lat, loc.lng], {
            radius: 9,
            fillColor: "#7C3AED",
            color: "#ffffff",
            weight: 3,
            fillOpacity: 1,
          })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:'DM Sans',sans-serif;font-weight:800;color:#1E1B4B;">
                📍 You are here
                <div style="font-size:10px;color:#7C3AED;font-weight:600;margin-top:2px;">
                  ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}
                </div>
              </div>`
            );

          userRingRef.current = ring;
          userDotRef.current = dot;

          map.setView([loc.lat, loc.lng], 13, { animate: true });
        }

        fetchHospitals(loc.lat, loc.lng, radius);
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location access was denied. Please allow location permission in your browser/device settings, then try again."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Your location could not be determined. Please check GPS is enabled.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while retrieving your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [radius, fetchHospitals]);

  // ── Pan & highlight selected hospital ───────────────────────────────────
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.setView([selected.lat, selected.lng], 16, { animate: true });

    // Update all marker icons to show selection
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selected.id;
      const icon = L.divIcon({
        className: "",
        html: createHospitalPin(isSelected),
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -42],
      });
      marker.setIcon(icon);
    });
  }, [selected]);

  // ── Auto-locate on first mount ───────────────────────────────────────────
  useEffect(() => {
    if (mapReady) locateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // ── Re-fetch when radius changes (with location) ─────────────────────────
  useEffect(() => {
    if (userLoc) {
      fetchHospitals(userLoc.lat, userLoc.lng, radius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.address && h.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 py-4 animate-fadeIn">

      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border-l-4 border-l-teal-glow flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-glow/10 border border-teal-glow/25 text-teal-glow rounded-full">
            <span className="w-2 h-2 bg-teal-glow rounded-full animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold">
              Real-Time GPS &bull; OpenStreetMap Data
            </span>
          </div>
          <h1 className="font-orbitron font-extrabold text-3xl text-text-primary tracking-tight leading-tight">
            NEARBY <span className="text-teal-glow">HOSPITALS</span> MAP
          </h1>
          <p className="text-xs text-text-secondary font-sans leading-relaxed max-w-xl">
            Live GPS detects your location and searches OpenStreetMap for real hospitals, clinics,
            and emergency care centres nearby. No API key required — 100% free data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            id="locate-me-btn"
            type="button"
            onClick={locateUser}
            disabled={locating}
            className="px-5 py-2.5 bg-teal-glow hover:bg-teal-mid text-white font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_14px_rgba(124,58,237,0.22)] hover:shadow-[0_4px_22px_rgba(124,58,237,0.42)] flex items-center justify-center gap-2 cursor-pointer border-0 disabled:opacity-60"
          >
            {locating ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Locate className="w-4 h-4 text-white" />
            )}
            <span>{locating ? "Locating…" : "Locate Me Now"}</span>
          </button>

          {userLoc && (
            <button
              type="button"
              onClick={() => fetchHospitals(userLoc.lat, userLoc.lng, radius)}
              disabled={loading}
              className="px-4 py-2.5 bg-white border border-border-dim hover:border-teal-glow/40 text-text-secondary hover:text-teal-glow font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-alert/5 border border-red-alert/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-alert shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-alert">Error</p>
            <p className="text-xs text-text-secondary mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-text-dim hover:text-text-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── MAIN GRID: Map | List ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ── MAP PANEL ── */}
        <div className="xl:col-span-7 glass-panel rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">

          {/* Map controls bar */}
          <div className="p-4 border-b border-border-dim/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-teal-glow rounded-full animate-ping" />
              <div>
                <h3 className="font-orbitron font-extrabold text-sm text-text-primary uppercase tracking-wide leading-none">
                  Live Location Map
                </h3>
                <p className="text-[9px] font-mono text-text-dim mt-0.5">
                  OpenStreetMap · Overpass API · Leaflet
                </p>
              </div>
            </div>

            {/* Radius selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRadius(opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-orbitron font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                    radius === opt.value
                      ? "bg-teal-glow text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet map container */}
          <div
            ref={mapContainerRef}
            style={{ height: "520px", width: "100%" }}
            className="relative z-0 flex-1"
          />

          {/* Status bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-[10px] font-mono text-slate-500">
              {userLoc
                ? `📍 ${userLoc.lat.toFixed(5)}, ${userLoc.lng.toFixed(5)}`
                : "📍 Waiting for GPS…"}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {loading
                ? "⏳ Fetching hospitals…"
                : fetchedAt
                ? `🔄 Updated at ${fetchedAt.toLocaleTimeString()}`
                : "© OpenStreetMap contributors · CARTO"}
            </span>
          </div>
        </div>

        {/* ── SIDEBAR: Search + Hospital Cards ── */}
        <div className="xl:col-span-5 flex flex-col gap-4">

          {/* Stats + Search */}
          <div className="glass-panel rounded-2xl p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-orbitron font-extrabold text-sm text-text-primary uppercase">
                  Hospitals Found
                </h3>
                <span className="text-[10px] font-mono text-text-dim">
                  {loading
                    ? "Scanning area…"
                    : `${hospitals.length} facilities · ${RADIUS_OPTIONS.find((r) => r.value === radius)?.label} radius`}
                </span>
              </div>

              <div className="w-14 h-14 rounded-xl bg-teal-glow/10 border border-teal-glow/20 flex items-center justify-center font-orbitron font-extrabold text-teal-glow text-xl">
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-teal-glow" />
                ) : (
                  hospitals.length
                )}
              </div>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-text-dim pointer-events-none" />
              <input
                id="hospital-nearby-search"
                type="text"
                placeholder="Search by name, type, or address…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-teal-glow/40 focus:border-teal-glow text-xs placeholder:text-text-dim font-sans rounded-xl py-2.5 pl-10 pr-9 focus:outline-none text-text-primary transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-text-dim hover:text-text-primary cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick stats row */}
            {hospitals.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  {
                    label: "Hospitals",
                    count: hospitals.filter((h) => h.type === "hospital").length,
                    color: "text-red-alert",
                    bg: "bg-red-alert/5",
                  },
                  {
                    label: "Clinics",
                    count: hospitals.filter((h) => h.type === "clinic").length,
                    color: "text-teal-glow",
                    bg: "bg-teal-glow/5",
                  },
                  {
                    label: "Nearest",
                    count: hospitals[0]?.distance?.toFixed(1) + " km",
                    color: "text-green-ok",
                    bg: "bg-green-ok/5",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`${stat.bg} rounded-xl p-2.5 text-center border border-border-dim/30`}
                  >
                    <div className={`font-orbitron font-extrabold text-base ${stat.color}`}>
                      {stat.count}
                    </div>
                    <div className="font-mono text-[9px] text-text-dim uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospital cards list */}
          <div className="space-y-3 max-h-[490px] overflow-y-auto pr-1 pb-1">

            {/* No location yet */}
            {!userLoc && !loading && (
              <div className="glass-panel rounded-2xl p-10 bg-white text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-glow/10 border border-teal-glow/20 flex items-center justify-center mx-auto text-3xl">
                  📍
                </div>
                <div>
                  <h4 className="font-orbitron font-bold text-sm text-text-primary uppercase">
                    GPS Location Required
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Click "Locate Me Now" to enable GPS and discover real hospitals near you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={locateUser}
                  className="mx-auto px-6 py-2.5 bg-teal-glow text-white font-orbitron font-bold text-xs uppercase rounded-xl cursor-pointer border-0 flex items-center gap-2 shadow-sm hover:bg-teal-mid transition-colors"
                >
                  <Locate className="w-3.5 h-3.5" />
                  Enable Location
                </button>
              </div>
            )}

            {/* Loading spinner */}
            {loading && (
              <div className="glass-panel rounded-2xl p-10 bg-white text-center space-y-3">
                <RefreshCw className="w-9 h-9 text-teal-glow animate-spin mx-auto" />
                <p className="font-orbitron font-bold text-xs text-text-dim uppercase tracking-wider">
                  Scanning nearby facilities…
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  Querying OpenStreetMap · Overpass API
                </p>
              </div>
            )}

            {/* Hospital cards */}
            {!loading &&
              filtered.map((hosp) => {
                const isSelected = selected?.id === hosp.id;

                return (
                  <div
                    key={hosp.id}
                    id={`hospital-card-${hosp.id}`}
                    onClick={() => setSelected(isSelected ? null : hosp)}
                    className={`glass-panel rounded-2xl p-4 bg-white border transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? "border-teal-glow shadow-[0_4px_22px_rgba(124,58,237,0.13)] translate-y-[-1px]"
                        : "border-border-dim/60 hover:border-teal-glow/30 hover:shadow-sm"
                    }`}
                  >
                    {/* Top row: name + distance */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${getTypeBadgeClass(hosp.type)}`}
                          >
                            {getTypeLabel(hosp.type)}
                          </span>
                          {hosp.emergency === "yes" && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-red-alert/10 text-red-alert border border-red-alert/20">
                              🚨 24/7 ER
                            </span>
                          )}
                        </div>
                        <h4
                          className="font-orbitron font-extrabold text-sm text-text-primary leading-tight truncate"
                          title={hosp.name}
                        >
                          {hosp.name}
                        </h4>
                        {hosp.address && (
                          <p
                            className="text-[10px] text-text-secondary mt-0.5 truncate font-sans"
                            title={hosp.address}
                          >
                            <MapPin className="w-2.5 h-2.5 inline mr-0.5 text-text-dim" />
                            {hosp.address}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-orbitron font-extrabold text-xl text-teal-glow block leading-none">
                          {hosp.distance?.toFixed(1)}
                        </span>
                        <span className="text-[9px] font-mono text-text-dim">km away</span>
                      </div>
                    </div>

                    {/* Meta info row */}
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      {hosp.phone && (
                        <a
                          href={`tel:${hosp.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] font-mono text-green-ok hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {hosp.phone}
                        </a>
                      )}
                      {hosp.openingHours && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-text-dim">
                          <Clock className="w-3 h-3" />
                          {hosp.openingHours.length > 22
                            ? hosp.openingHours.slice(0, 22) + "…"
                            : hosp.openingHours}
                        </span>
                      )}
                      {hosp.speciality && (
                        <span className="text-[10px] font-mono text-text-dim truncate max-w-[120px]">
                          🩺 {hosp.speciality}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border-dim/30">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2 bg-teal-glow hover:bg-teal-mid text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        Directions
                      </a>

                      {hosp.phone ? (
                        <a
                          href={`tel:${hosp.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 bg-red-alert/10 hover:bg-red-alert hover:text-white text-red-alert font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-alert/20"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.name)}`,
                              "_blank"
                            );
                          }}
                          className="flex-1 py-2 border border-border-dim hover:border-teal-glow/40 text-text-secondary hover:text-teal-glow font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          Find More
                        </button>
                      )}

                      {hosp.website && (
                        <a
                          href={hosp.website.startsWith("http") ? hosp.website : `https://${hosp.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Visit Website"
                          className="py-2 px-3 border border-border-dim hover:border-teal-glow/40 text-text-dim hover:text-teal-glow rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* View on map pin */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(hosp);
                        }}
                        title="Show on map"
                        className={`py-2 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer border ${
                          isSelected
                            ? "bg-teal-glow text-white border-teal-glow"
                            : "border-border-dim hover:border-teal-glow/40 text-text-dim hover:text-teal-glow"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* No results */}
            {!loading && userLoc && filtered.length === 0 && hospitals.length > 0 && (
              <div className="glass-panel rounded-2xl p-10 bg-white text-center space-y-2">
                <p className="text-3xl">🔍</p>
                <p className="font-orbitron font-bold text-sm text-text-dim uppercase">
                  No results match
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-teal-glow underline text-xs cursor-pointer font-mono"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* No hospitals in area */}
            {!loading && userLoc && hospitals.length === 0 && !error && (
              <div className="glass-panel rounded-2xl p-10 bg-white text-center space-y-3">
                <p className="text-3xl">🏥</p>
                <h4 className="font-orbitron font-bold text-sm text-text-primary uppercase">
                  No hospitals found
                </h4>
                <p className="text-xs text-text-secondary font-sans">
                  Try increasing the search radius or check your internet connection.
                </p>
                <button
                  type="button"
                  onClick={() => setRadius(10000)}
                  className="mx-auto px-5 py-2 bg-teal-glow text-white font-mono font-bold text-xs uppercase rounded-xl cursor-pointer border-0 hover:bg-teal-mid transition-colors"
                >
                  Expand to 10 km
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SELECTED HOSPITAL DETAIL PANEL ── */}
      {selected && (
        <div className="glass-panel rounded-2xl p-6 bg-white border border-teal-glow/20 shadow-[0_8px_32px_rgba(124,58,237,0.08)] space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getTypeBadgeClass(selected.type)}`}
                >
                  {getTypeLabel(selected.type)}
                </span>
                {selected.emergency === "yes" && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-alert/10 text-red-alert border border-red-alert/20 animate-pulse">
                    🚨 24/7 Emergency
                  </span>
                )}
              </div>
              <h2 className="font-orbitron font-extrabold text-xl text-text-primary">
                {selected.name}
              </h2>
              {selected.address && (
                <p className="text-sm text-text-secondary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-dim shrink-0" />
                  {selected.address}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="font-orbitron font-extrabold text-3xl text-teal-glow">
                {selected.distance?.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-text-dim">km from you</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
            {[
              {
                label: "Phone",
                value: selected.phone || "—",
                icon: <Phone className="w-4 h-4 text-green-ok" />,
                link: selected.phone ? `tel:${selected.phone}` : undefined,
              },
              {
                label: "Hours",
                value: selected.openingHours || "—",
                icon: <Clock className="w-4 h-4 text-text-dim" />,
              },
              {
                label: "Speciality",
                value: selected.speciality || "General",
                icon: <ChevronRight className="w-4 h-4 text-teal-glow" />,
              },
              {
                label: "Coordinates",
                value: `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`,
                icon: <MapPin className="w-4 h-4 text-teal-glow" />,
              },
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="text-[9px] font-mono text-text-dim uppercase">{item.label}</span>
                </div>
                {item.link ? (
                  <a
                    href={item.link}
                    className="text-[11px] font-bold text-green-ok hover:underline block truncate"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-[11px] font-bold text-text-primary truncate" title={item.value}>
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-teal-glow hover:bg-teal-mid text-white font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>

            {selected.phone && (
              <a
                href={`tel:${selected.phone}`}
                className="px-6 py-2.5 bg-red-alert hover:bg-red-alert/90 text-white font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            )}

            {selected.website && (
              <a
                href={
                  selected.website.startsWith("http")
                    ? selected.website
                    : `https://${selected.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 border border-border-dim hover:border-teal-glow/40 text-text-secondary hover:text-teal-glow font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="px-6 py-2.5 border border-border-dim hover:border-red-alert/30 text-text-dim hover:text-red-alert font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
