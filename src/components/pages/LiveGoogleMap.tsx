import React, { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  Pin
} from "@vis.gl/react-google-maps";
import { Locate } from "lucide-react";

export interface HospitalPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  distance?: number;
  bedsAvailable?: number;
  occupancyStatus?: string;
  specialties?: string[];
  hotline?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY !== "";

// Simple direct geometry haversine calculation
function getHaversineDistance(pt1: { lat: number; lng: number }, pt2: { lat: number; lng: number }) {
  const R = 6371; // Earth's radius in km
  const dLat = ((pt2.lat - pt1.lat) * Math.PI) / 180;
  const dLng = ((pt2.lng - pt1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pt1.lat * Math.PI) / 180) *
      Math.cos((pt2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate realistic mock beds & metadata for Google Maps results
function decorateGooglePlaceWithEmergencyMetadata(placeId: string, name: string) {
  // Use character hashing to stay deterministic for the same placeId
  let charSum = 0;
  for (let i = 0; i < placeId.length; i++) {
    charSum += placeId.charCodeAt(i);
  }

  const bedsAvailable = (charSum % 14) + 1; // 1 to 14 beds
  
  const statusArray: ("Low Load" | "Normal Load" | "High Load" | "Critical Load")[] = [
    "Low Load", "Normal Load", "High Load", "Critical Load"
  ];
  const occupancyStatus = statusArray[charSum % statusArray.length];

  const specialtiesPool = [
    ["24/7 ICU & Stroke Center", "Cardiac Cath Lab", "Neuro ICU"],
    ["Advanced Cardiac Unit", "Major Burn Facility", "Pediatric Trauma"],
    ["Toxicology & Poison Control", "Organ Re-implantation", "Polytrauma ICU"],
    ["Respiratory Support Vent Squad", "Hyperbaric Oxygen Therapy", "Acute Ortho Care"]
  ];
  const specialties = specialtiesPool[charSum % specialtiesPool.length];

  const hotline = `040-236${(charSum % 9000) + 1000}`;

  return { bedsAvailable, occupancyStatus, specialties, hotline };
}

function InnerGoogleMap({
  onPlacesFound,
  onSelectPlace,
  selectedPlace
}: {
  onPlacesFound: (places: HospitalPlace[]) => void;
  onSelectPlace: (place: HospitalPlace | null) => void;
  selectedPlace: HospitalPlace | null;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number }>({
    lat: 17.4085,
    lng: 78.4712
  }); // Default Hyderabad
  const [places, setPlaces] = useState<HospitalPlace[]>([]);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [activeMarkerPoint, setActiveMarkerPoint] = useState<HospitalPlace | null>(null);

  // Sync current user location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserCenter(loc);
          if (map) {
            map.setCenter(loc);
            map.setZoom(13);
          }
        },
        (err) => {
          console.warn("Geolocation fetch failed, using default center.", err);
        }
      );
    }
  }, [map]);

  const locateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserCenter(loc);
        if (map) {
          map.panTo(loc);
          map.setZoom(14);
        }
      });
    }
  };

  // Perform a Places search when Places Library loads and Center is determined
  useEffect(() => {
    if (!placesLib || !map) return;

    try {
      const service = new google.maps.places.PlacesService(map);
      service.nearbySearch(
        {
          location: userCenter,
          radius: 5000, // 5km radius
          type: "hospital"
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const formatted: HospitalPlace[] = results.slice(0, 10).map((r, index) => {
              const lat = r.geometry?.location?.lat() || 0;
              const lng = r.geometry?.location?.lng() || 0;
              const meta = decorateGooglePlaceWithEmergencyMetadata(r.place_id || `${index}`, r.name || "");
              
              return {
                id: r.place_id || `place_${index}`,
                name: r.name || "Emergency Medical Clinic",
                lat,
                lng,
                address: r.vicinity || "No nearby street address registered",
                rating: r.rating,
                distance: parseFloat(getHaversineDistance(userCenter, { lat, lng }).toFixed(1)),
                ...meta
              };
            });

            // Sort by nearest
            formatted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setPlaces(formatted);
            onPlacesFound(formatted);
          }
        }
      );
    } catch (e) {
      console.error("Failed to fetch nearby places:", e);
    }
  }, [placesLib, map, userCenter, onPlacesFound]);

  // Handle outside selections (e.g. from the lists below)
  useEffect(() => {
    if (selectedPlace && map) {
      map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      map.setZoom(15);
      setActiveMarkerPoint(selectedPlace);
      setInfoWindowOpen(true);
    }
  }, [selectedPlace, map]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Search overlay & Action HUD */}
      <div className="absolute top-3 left-3 z-[100] flex gap-2">
        <button
          type="button"
          onClick={locateMe}
          className="px-4 py-2.5 bg-white/95 backdrop-blur hover:bg-white text-slate-800 hover:text-teal-600 shadow-md hover:shadow-lg rounded-xl flex items-center gap-1.5 text-xs font-orbitron font-extrabold transition-all border border-slate-200/50 cursor-pointer"
        >
          <Locate className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>Real-time Geolocation Sync</span>
        </button>
      </div>

      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={userCenter}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI={false}
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        className="w-full h-full rounded-2xl overflow-hidden border border-slate-100"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Real-time self location marker */}
        <AdvancedMarker position={userCenter} title="Real-time Incident Location">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-8 h-8 rounded-full bg-teal-500/35 border border-teal-400 animate-ping" />
            <div className="w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-[0_2px_8px_rgba(20,184,166,0.6)] z-10" />
          </div>
        </AdvancedMarker>

        {/* Dynamic nearby hospital locations */}
        {places.map((place) => {
          const isSelected = activeMarkerPoint?.id === place.id;
          return (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.lat, lng: place.lng }}
              title={place.name}
              onClick={() => {
                setActiveMarkerPoint(place);
                onSelectPlace(place);
                setInfoWindowOpen(true);
              }}
            >
              <Pin
                background={isSelected ? "#EF4444" : "#DC2626"}
                borderColor={isSelected ? "#7F1D1D" : "#991B1B"}
                glyphColor="#fff"
                scale={isSelected ? 1.2 : 0.95}
              >
                <span className="text-[10px] leading-zero select-none">🚨</span>
              </Pin>
            </AdvancedMarker>
          );
        })}

        {/* Custom Hospital Information Window */}
        {infoWindowOpen && activeMarkerPoint && (
          <InfoWindow
            position={{ lat: activeMarkerPoint.lat, lng: activeMarkerPoint.lng }}
            onCloseClick={() => {
              setInfoWindowOpen(false);
              onSelectPlace(null);
            }}
            pixelOffset={new google.maps.Size(0, -35)}
          >
            <div className="p-1 max-w-[240px] text-left text-slate-800 font-sans">
              <span className="text-[8px] uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 font-mono font-bold px-1.5 py-0.5 rounded-md block w-fit mb-1">
                🏥 Real-time ER Hub
              </span>
              <h4 className="font-orbitron font-extrabold text-xs text-slate-900 leading-tight mb-1">
                {activeMarkerPoint.name}
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight mb-1.5">
                {activeMarkerPoint.address}
              </p>
              
              {activeMarkerPoint.rating && (
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-amber-500 text-xs">★</span>
                  <span className="text-[10px] font-mono font-bold">{activeMarkerPoint.rating}</span>
                </div>
              )}

              <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <span className="text-[10px] font-mono font-bold text-teal-600">
                  📍 {activeMarkerPoint.distance} km away
                </span>
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${activeMarkerPoint.lat},${activeMarkerPoint.lng}`,
                      "_blank"
                    );
                  }}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-orbitron font-bold text-[9px] uppercase tracking-wider rounded transition-colors cursor-pointer border-0"
                >
                  Get Route
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}

export default function LiveGoogleMap({
  onPlacesFound,
  onSelectPlace,
  selectedPlace
}: {
  onPlacesFound: (places: HospitalPlace[]) => void;
  onSelectPlace: (place: HospitalPlace | null) => void;
  selectedPlace: HospitalPlace | null;
}) {
  if (!hasValidKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-6 min-h-[350px]">
        <div className="max-w-md w-full text-center space-y-4 py-6 bg-white shadow-md border border-slate-200/50 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center mx-auto text-xl">
            🗺️
          </div>
          <div className="space-y-1">
            <h3 className="font-orbitron font-extrabold text-[#0f172a] text-sm uppercase tracking-wide">
              Live Google Maps API Key Required
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Connect Google Maps Platform safely to access real-time GPS sync and discover actual hospitals near you instantly.
            </p>
          </div>

          <div className="text-left bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2 text-slate-700">
            <p className="text-[11px] font-sans leading-snug">
              <b>Step 1:</b> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-teal-600 font-bold underline hover:text-teal-500">Get Google Maps API Key</a>
            </p>
            <p className="text-[11px] font-sans leading-snug">
              <b>Step 2:</b> Paste your secret key when prompt appears, or do it manually:
            </p>
            <ul className="text-[10px] text-[#64748b] pl-4 list-decimal space-y-1 font-mono">
              <li>Open <b>Settings</b> (⚙️ gear icon, <b>top-right corner</b>)</li>
              <li>Select <b>Secrets</b> menu</li>
              <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as name, press <b>Enter</b></li>
              <li>Paste actual Google API key into value, press <b>Enter</b></li>
            </ul>
          </div>

          <p className="text-[9px] text-[#94a3b8] italic">
            The app automatically rebuilds - no page refresh required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <InnerGoogleMap
        onPlacesFound={onPlacesFound}
        onSelectPlace={onSelectPlace}
        selectedPlace={selectedPlace}
      />
    </APIProvider>
  );
}
