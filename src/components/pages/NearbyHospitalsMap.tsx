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
  Hospital,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_OPTIONS = [
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

function createHospitalPin(selected: boolean): string {
  const fill = selected ? "#22D3EE" : "#FF4D4D";
  return `
    <div style="position:relative;width:42px;height:42px;">
      <div style="
        width:42px;height:42px;
        background:${fill};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 10px 25px rgba(0,0,0,0.3);
      "></div>
      <span style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-62%);
        font-size:18px;
      ">🏥</span>
    </div>`;
}

export default function NearbyHospitalsMap() {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const userDotRef      = useRef<L.CircleMarker | null>(null);
  const markersRef      = useRef<Map<number, L.Marker>>(new Map());

  const [userLoc,       setUserLoc]       = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals,     setHospitals]     = useState<NearbyHospital[]>([]);
  const [selected,      setSelected]      = useState<NearbyHospital | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [radius,        setRadius]        = useState(5000);
  const [mapReady,      setMapReady]      = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [20.5937, 78.9629], zoom: 5, zoomControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    setMapReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const fetchHospitals = useCallback(async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    const q = `[out:json][timeout:30];(node["amenity"="hospital"](around:${rad},${lat},${lng});way["amenity"="hospital"](around:${rad},${lat},${lng});node["amenity"="clinic"](around:${rad},${lat},${lng}););out body center;`;
    try {
      const resp = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: `data=${encodeURIComponent(q)}` });
      const json = await resp.json();
      const parsed: NearbyHospital[] = json.elements.filter((el: any) => el.tags?.name).map((el: any) => ({
        id: el.id,
        name: el.tags.name,
        lat: el.lat ?? el.center?.lat,
        lng: el.lon ?? el.center?.lon,
        type: el.tags.amenity || "hospital",
        phone: el.tags.phone || el.tags["contact:phone"],
        address: el.tags["addr:full"] || el.tags["addr:street"],
        distance: haversineKm(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
      })).sort((a: any, b: any) => a.distance - b.distance);
      setHospitals(parsed);
      if (mapRef.current) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current.clear();
        parsed.forEach(h => {
          const m = L.marker([h.lat, h.lng], {
            icon: L.divIcon({ className: "", html: createHospitalPin(false), iconSize: [42, 42], iconAnchor: [21, 42] })
          }).addTo(mapRef.current!);
          m.on("click", () => setSelected(h));
          markersRef.current.set(h.id, m);
        });
      }
    } catch { setError(t("Diagnostic synthesis failed.")); }
    finally { setLoading(false); }
  }, []);

  const locateUser = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setLocating(false);
        if (mapRef.current) {
          userDotRef.current?.remove();
          userDotRef.current = L.circleMarker([loc.lat, loc.lng], { radius: 12, fillColor: "#22D3EE", color: "#fff", weight: 4, fillOpacity: 1 }).addTo(mapRef.current);
          mapRef.current.setView([loc.lat, loc.lng], 13);
        }
        fetchHospitals(loc.lat, loc.lng, radius);
      },
      () => { setLocating(false); setError("Location permission denied."); },
      { timeout: 10000 }
    );
  }, [radius, fetchHospitals]);

  useEffect(() => { if (mapReady) locateUser(); }, [mapReady, locateUser]);

  const filtered = hospitals.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

      {/* ── Wide Header ── */}
      <div className="card !p-10 !bg-bg-elevated/50 border-2 border-accent/20 rounded-[40px] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -ml-32 -mt-32" />
        <div className="relative z-10 space-y-3">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{t("nav_hospitals_map").split(' ')[0]} <span className="text-accent">Intelligence</span> Map</h2>
          <p className="text-lg text-text-secondary font-medium">{t("home_desc")}</p>
        </div>
        <button onClick={locateUser} disabled={locating} className="btn-primary relative z-10 !py-5 !px-10 group shadow-2xl shadow-accent/20 border-none cursor-pointer">
          <Locate className={`w-6 h-6 ${locating ? "animate-spin" : "group-hover:rotate-90 transition-transform"}`} />
          <span className="text-base uppercase tracking-widest">{locating ? t("home_inspecting") + "..." : t("sync_location")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 min-h-[700px]">
        {/* ── Map ── */}
        <div className="xl:col-span-8 card !p-0 overflow-hidden relative border-2 border-white/5 rounded-[40px] shadow-2xl group">
          <div ref={mapContainerRef} className="w-full h-full z-0 grayscale-[0.5] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700" />
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-bg-void/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.4em] text-accent animate-pulse">Scanning Grid...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-10 left-10 z-10 space-y-4">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-[32px] shadow-2xl space-y-1">
              <p className="text-[10px] font-black uppercase text-text-dim tracking-widest">{t("active_sensor")}</p>
              <p className="text-xl font-black text-white">OSM Real-time</p>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="xl:col-span-4 flex flex-col gap-6 overflow-hidden">
          <div className="card !p-8 space-y-6 !bg-bg-elevated/30 border-2 border-white/5 rounded-[40px]">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-text-dim" />
              <input
                type="text"
                placeholder="Search result matrix..."
                className="input !h-16 !pl-16 !text-lg !rounded-3xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              {RADIUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRadius(opt.value)}
                  className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${radius === opt.value ? "bg-accent text-black shadow-xl shadow-accent/20" : "bg-bg-void text-text-secondary hover:text-white"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filtered.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelected(h);
                    mapRef.current?.setView([h.lat, h.lng], 16, { animate: true });
                  }}
                  className={`card !p-8 cursor-pointer transition-all duration-500 border-2 rounded-[40px] relative overflow-hidden group ${selected?.id === h.id ? "border-accent bg-accent/5 shadow-2xl ring-4 ring-accent/5 scale-[1.02]" : "border-white/5 hover:border-white/10"}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Hospital className={`w-4 h-4 ${selected?.id === h.id ? 'text-accent' : 'text-text-dim group-hover:text-white'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-dim group-hover:text-white transition-colors">{h.type}</span>
                      </div>
                      <h4 className="font-black text-2xl text-white leading-tight group-hover:text-accent transition-colors">{h.name}</h4>
                    </div>
                    <span className="text-2xl font-black text-accent tracking-tighter whitespace-nowrap">{h.distance?.toFixed(1)} <small className="text-xs uppercase opacity-60">km</small></span>
                  </div>
                  <p className="text-sm text-text-secondary font-medium mt-4 line-clamp-1 group-hover:text-text-primary transition-colors">{h.address || "Medical grid location detected"}</p>
                  <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`} target="_blank" className="flex-1 btn-primary !py-4 !text-xs justify-center shadow-xl group-hover:scale-105 transition-transform border-none cursor-pointer">{t("initialize_route")}</a>
                    {h.phone && (
                      <a href={`tel:${h.phone}`} className="w-14 h-14 bg-bg-void rounded-2xl flex items-center justify-center text-accent border border-white/5 hover:border-accent hover:shadow-xl transition-all">
                        <Phone className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
