import { useState, useEffect } from "react";
import { Phone, MapPin, ShieldAlert, Heart, Siren, Flame, AlertTriangle, ChevronRight, Activity, Clock, HeartPulse, Search, Map } from "lucide-react";
import LiveGoogleMap, { HospitalPlace } from "./LiveGoogleMap";

// Waypoints linear interpolation helper for route transit tracking
function getPointOnRoute(waypoints: number[][], progress: number) {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1) return { x: waypoints[0][0], y: waypoints[0][1] };
  if (progress <= 0) return { x: waypoints[0][0], y: waypoints[0][1] };
  if (progress >= 1) return { x: waypoints[waypoints.length - 1][0], y: waypoints[waypoints.length - 1][1] };

  const totalSegments = waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const localProgress = segmentProgress - segmentIndex;

  const start = waypoints[segmentIndex];
  const end = waypoints[segmentIndex + 1];

  return {
    x: start[0] + (end[0] - start[0]) * localProgress,
    y: start[1] + (end[1] - start[1]) * localProgress
  };
}

const AMBULANCES = [
  {
    id: 0,
    name: "Apollo ALS Fleet Support-1",
    driver: "Paramedic S. Rao, Advanced Cardiac Rescuer",
    speed: 84,
    equipment: ["Defibrillator", "Ventilator Support", "Advanced Trauma Drug Kit"],
    eta: "5 mins",
    hotline: "1066",
    color: "#DC2626",
    waypoints: [[70, 70], [150, 100], [180, 140], [250, 150]]
  },
  {
    id: 1,
    name: "Fortis Trauma Transport-3",
    driver: "Officer Swaminathan, Emergency Paramedic",
    speed: 76,
    equipment: ["Oxygen Resuscitator", "Intubation Cart", "Spine immobilization board"],
    eta: "9 mins",
    hotline: "105010",
    color: "#2563EB",
    waypoints: [[420, 90], [350, 110], [300, 140], [250, 150]]
  },
  {
    id: 2,
    name: "AIIMS CATS Response Unit-4",
    driver: "Officer Harpreet Singh, Trauma Dispatcher",
    speed: 92,
    equipment: ["Laceration control bundle", "Patient vital signs monitor", "Blood transfuser"],
    eta: "4 mins",
    hotline: "011-26588500",
    color: "#059669",
    waypoints: [[100, 240], [150, 220], [200, 180], [250, 150]]
  }
];

interface EmergencyHospital {
  name: string;
  distance: number;
  bedsAvailable: number;
  hotline: string;
  occupancyStatus: "Low Load" | "Normal Load" | "High Load" | "Critical Load";
  specialties: string[];
  address: string;
}

const EMERGENCY_HOSPITALS: EmergencyHospital[] = [
  {
    name: "Apollo Speciality Trauma Hospital",
    distance: 1.1,
    bedsAvailable: 4,
    hotline: "040-23607777",
    occupancyStatus: "High Load",
    specialties: ["24/7 ICU & Stroke Center", "Cardiac Cath Lab", "Neuro ICU"],
    address: "Film Nagar, Jubilee Hills, Hyderabad"
  },
  {
    name: "Fortis Multispeciality Emergency Care",
    distance: 2.5,
    bedsAvailable: 9,
    hotline: "011-42776222",
    occupancyStatus: "Normal Load",
    specialties: ["Advanced Cardiac Unit", "Major Burn Facility", "Pediatric Trauma"],
    address: "Sector 62, Phase VIII, Industrial Area, Mohali"
  },
  {
    name: "AIIMS Medical Trauma Center",
    distance: 3.9,
    bedsAvailable: 1,
    hotline: "011-26588500",
    occupancyStatus: "Critical Load",
    specialties: ["Toxicology & Poison Control", "Organ Re-implantation", "Polytrauma ICU"],
    address: "Ansari Nagar, New Delhi"
  },
  {
    name: "Max Super Speciality Emergency ER",
    distance: 4.8,
    bedsAvailable: 12,
    hotline: "011-40554055",
    occupancyStatus: "Low Load",
    specialties: ["Respiratory Support Vent Squad", "Hyperbaric Oxygen Therapy", "Acute Ortho Care"],
    address: "Press Enclave Marg, Saket, New Delhi"
  }
];

const AMBULANCE_CHANNELS = [
  { provider: "Public Emergency Command Hub", number: "108", type: "State Administered CATS", speed: "8-12 mins", status: "Active Dispatch" },
  { provider: "National Health Helpline Dispatch", number: "1075", type: "Union Ministry Support", speed: "10-15 mins", status: "Active Dispatch" },
  { provider: "Apollo Cardiac Road Ambulance Services", number: "1066", type: "ALS Intensive Support Fleet", speed: "5-8 mins", status: "High Priority Team" },
  { provider: "Fortis Trauma Transport Fleet Support", number: "105010", type: "Advanced Trauma Support", speed: "6-10 mins", status: "Active Dispatch" },
  { provider: "Max Healthcare Care Transit Wing", number: "011-40554055", type: "Paramedic Air & Road Corps", speed: "5-9 mins", status: "Dedicated Transit" },
  { provider: "Air Ambulance Emergency Transit Logistics", number: "+91 9540561561", type: "Charter Air Helicopter Rescues", speed: "35-50 mins", status: "Regional Charter" }
];

const FIRST_AID_GUIDES = [
  {
    scenario: "Cardiovascular Distress (Heart Attack & Arrest)",
    icon: "❤️",
    urgency: "Immediate ALS Required",
    colorClass: "bg-red-alert/5 border-red-alert text-red-alert",
    steps: [
      "Immediately dial 108 or 1066 to activate Advanced Life Support (ALS).",
      "Have the patient sit silently, chewing one full adult aspirin (325mg) to inhibit platelet clots.",
      "Check responsiveness and breathing; if breathing stops, immediately start high-quality CPR (100-120 chest compressions/minute)."
    ]
  },
  {
    scenario: "Airway Obstruction (Choking)",
    icon: "🫁",
    urgency: "Severe / Instant Action",
    colorClass: "bg-amber-warn/5 border-amber-warn text-amber-warn",
    steps: [
      "Ask 'Are you choking?' If unable to verbalize, stand directly behind the patient.",
      "Wrap your arms underneath their rib cage around the midline of the abdomen.",
      "Place your thumb side of a clenched fist above their navel, pull upward and inward in swift thrusts (Heimlich Maneuver)."
    ]
  },
  {
    scenario: "Hemorrhagic Trauma (Severe Bleeding)",
    icon: "🩸",
    urgency: "Immediate Direct Control",
    colorClass: "bg-red-alert/5 border-red-alert text-red-alert",
    steps: [
      "Apply direct force on the bleeding laceration using clean sterile linen or gauze.",
      "Keep the injury site elevated above heart level whenever skeletal continuity allows.",
      "If pressure fails to control major arterial bleeding in a limb, apply a tactical tourniquet 2-3 inches above the wound."
    ]
  },
  {
    scenario: "Heat Stroke & Hyperpyrexia",
    icon: "🌡️",
    urgency: "Rapid Cooling Mandatory",
    colorClass: "bg-sky-500/5 border-sky-400 text-sky-500",
    steps: [
      "Transfer the patient out of solar exposure into cold conditioned air or ventilation.",
      "Strip heavy external clothing and mist or wipe skin with water while fanning them vigorously.",
      "Apply ice wraps or cold damp compresses to high-vascularity areas: neck, armpits, and groin."
    ]
  }
];

export default function Emergency() {
  const [activeTab, setActiveTab] = useState<"directories" | "procedures">("directories");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);

  const [progress, setProgress] = useState(0.15);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedAmbulance, setSelectedAmbulance] = useState<number>(0);
  const [activeMapPopup, setActiveMapPopup] = useState<{ type: "hospital" | "ambulance"; id: string | number } | null>(null);

  const [mapMode, setMapMode] = useState<"google" | "simulation">("google");
  const [realHospitals, setRealHospitals] = useState<HospitalPlace[]>([]);
  const [selectedRealPlace, setSelectedRealPlace] = useState<HospitalPlace | null>(null);

  // Smooth periodic coordinates increment to simulate vehicle transits
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.0035 * speedMultiplier;
        return next >= 1.0 ? 0.0 : next;
      });
    }, 45);
    return () => clearInterval(timer);
  }, [speedMultiplier]);

  const filteredHospitals = (mapMode === "google" && realHospitals.length > 0 ? realHospitals : EMERGENCY_HOSPITALS).filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.specialties && h.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6 py-4 relative z-10 animate-fadeIn">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border-l-4 border-l-red-alert flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-md bg-white">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-alert/15 border border-red-alert/30 text-red-alert rounded-full">
            <Siren className="w-3.5 h-3.5 animate-bounce" />
            <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold">Active Trauma Protocol</span>
          </div>
          <h1 className="font-orbitron font-extrabold text-3xl text-text-primary tracking-tight">
            CRITICAL HEALTH <span className="text-red-alert">EMERGENCY CENTER</span>
          </h1>
          <p className="text-xs text-text-secondary font-sans leading-relaxed max-w-2xl">
            Locate critical ICU beds, trauma response infrastructure, active dispatch vehicles, and real-time medical instructions in one unified responsive dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <a
            href="tel:108"
            className="px-6 py-3 bg-red-alert hover:bg-red-alert/90 text-white font-orbitron font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:shadow-[0_4px_22px_rgba(220,38,38,0.45)] inline-flex items-center gap-2 cursor-pointer"
          >
            <Siren className="w-4 h-4 text-white" />
            <span>Dial Command Force (108)</span>
          </a>
        </div>
      </div>

      {/* SUB PANELS TOGGLE */}
      <div className="flex items-center gap-2 p-1 bg-white border border-border-dim rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("directories")}
          className={`py-2 px-4 rounded-lg text-xs font-orbitron font-bold uppercase tracking-wider transition-colors ${
            activeTab === "directories"
              ? "bg-red-alert text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
          }`}
        >
          Hospitals & Ambulance
        </button>
        <button
          onClick={() => setActiveTab("procedures")}
          className={`py-2 px-4 rounded-lg text-xs font-orbitron font-bold uppercase tracking-wider transition-colors ${
            activeTab === "procedures"
              ? "bg-red-alert text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
          }`}
        >
          First Aid Walkthroughs
        </button>
      </div>

      {activeTab === "directories" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* TOP SECTION: INTERACTIVE SVG MAP FOR ACTIVE DISPATCHES */}
          <div className="lg:col-span-12 glass-panel p-5 bg-white shadow-sm flex flex-col xl:flex-row gap-6 relative overflow-hidden rounded-2xl">
            {/* Left side: Interactive SVG Map panel */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-dim/40 font-sans">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-alert rounded-full animate-ping" />
                    <h3 className="font-orbitron font-extrabold text-sm text-text-primary uppercase tracking-wide">
                      Interactive Emergency Location Platform
                    </h3>
                  </div>
                  <p className="text-[10px] text-[#64748b]">
                    {mapMode === "google" 
                      ? "Displaying synchronized real-world GPS coordinates and live clinical emergency facilities."
                      : "Plotting live vehicle transits and ETA coordinates heading toward your location (Incident Site)."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Map Mode Selector */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200/65 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMapMode("google")}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-orbitron font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                        mapMode === "google"
                          ? "bg-teal-650 text-white shadow-sm font-black bg-teal-600"
                          : "text-slate-600 hover:text-slate-900 font-semibold"
                      }`}
                    >
                      🗺️ GPS Google Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode("simulation")}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-orbitron font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                        mapMode === "simulation"
                          ? "bg-teal-650 text-white shadow-sm font-black bg-teal-600"
                          : "text-slate-600 hover:text-slate-900 font-semibold"
                      }`}
                    >
                      🚑 Tracker Simulation
                    </button>
                  </div>

                  {mapMode === "simulation" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setProgress(0.15)}
                        className="px-2.5 py-1 bg-white border border-[#fee2e2] text-red-alert hover:bg-red-alert/5 text-[9px] font-mono font-extrabold uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2.5 : 1))}
                        className={`px-2.5 py-1 text-[9px] font-mono font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                          speedMultiplier > 1
                            ? "bg-red-alert text-white shadow-sm"
                            : "border border-border-dim text-[#475569] hover:bg-bg-surface"
                        }`}
                      >
                        {speedMultiplier > 1 ? "Sirens Active" : "Sirens Quiet"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* The Map SVG Viewport */}
              <div id="emergency-map-viewport" className="relative bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-2 aspect-[5/3] min-h-[350px]">
                {mapMode === "google" ? (
                  <LiveGoogleMap
                    onPlacesFound={(places) => setRealHospitals(places)}
                    onSelectPlace={(place) => setSelectedRealPlace(place)}
                    selectedPlace={selectedRealPlace}
                  />
                ) : (
                  <>
                    <svg viewBox="0 0 500 300" className="w-full h-full select-none" style={{ background: "#f8fafc" }}>
                      <defs>
                        <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(124, 58, 237, 0.03)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#mapGrid)" />

                      {/* Concentric waves */}
                      <circle cx="250" cy="150" r="40" fill="none" stroke="rgba(220, 38, 38, 0.04)" strokeWidth="1" strokeDasharray="3,3" />
                      <circle cx="250" cy="150" r="100" fill="none" stroke="rgba(220, 38, 38, 0.03)" strokeWidth="1" strokeDasharray="4,4" />
                      <circle cx="250" cy="150" r="180" fill="none" stroke="rgba(220, 38, 38, 0.02)" strokeWidth="1" strokeDasharray="5,5" />

                      {/* Highways */}
                      {AMBULANCES.map((amb) => {
                        const dStr = amb.waypoints.reduce((accum, curr, idx) => {
                          return accum + (idx === 0 ? "M " : " L ") + curr[0] + "," + curr[1];
                        }, "");
                        return (
                          <g key={amb.id}>
                            <path d={dStr} fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <path 
                              d={dStr} 
                              fill="none" 
                              stroke={amb.color} 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="opacity-20"
                              strokeDasharray="4,4"
                            />
                          </g>
                        );
                      })}

                      {/* Hospital plotted nodes */}
                      {[
                        { name: "Apollo ER Hub", coords: [70, 70] },
                        { name: "Fortis Care Center", coords: [420, 90] },
                        { name: "AIIMS Trauma Wing", coords: [100, 240] }
                      ].map((h) => {
                        const isSelected = activeMapPopup?.type === "hospital" && activeMapPopup.id === h.name;
                        return (
                          <g 
                            key={h.name} 
                            onClick={() => {
                              setActiveMapPopup({ type: "hospital", id: h.name });
                            }}
                            className="cursor-pointer group"
                          >
                            {isSelected && (
                              <circle cx={h.coords[0]} cy={h.coords[1]} r="16" fill="none" stroke="#DC2626" strokeWidth="1.5" className="animate-ping" style={{ animationDuration: "1.5s" }} />
                            )}
                            <circle cx={h.coords[0]} cy={h.coords[1]} r={isSelected ? 11 : 9} fill="white" stroke={isSelected ? "#DC2626" : "#e2e8f0"} strokeWidth="2" className="transition-all" />
                            <circle cx={h.coords[0]} cy={h.coords[1]} r="5" fill="#DC2626" />
                            <text x={h.coords[0]} y={h.coords[1] - (isSelected ? 16 : 13)} textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#1E1B4B]">
                              {h.name}
                            </text>
                          </g>
                        );
                      })}

                      {/* User central site */}
                      <g>
                        <circle cx="250" cy="150" r="14" fill="rgba(220, 38, 38, 0.12)" className="animate-ping" style={{ animationDuration: "3s" }} />
                        <circle cx="250" cy="150" r="8" fill="rgba(220, 38, 38, 0.2)" />
                        <circle cx="250" cy="150" r="4" fill="#DC2626" />
                        <text x="250" y="132" textAnchor="middle" className="text-[9px] font-sans font-bold fill-[#DC2626] uppercase tracking-wider">
                          📍 Incident Site (You)
                        </text>
                      </g>

                      {/* Ambulances markers */}
                      {AMBULANCES.map((amb, idx) => {
                        const individualProgress = (() => {
                          if (idx === 0) return progress;
                          if (idx === 1) return (progress + 0.35) % 1.0;
                          return (progress + 0.7) % 1.0;
                        })();

                        const pos = getPointOnRoute(amb.waypoints, individualProgress);
                        const isSelected = selectedAmbulance === amb.id;
                        const calculatedEta = Math.max(1, Math.round((1 - individualProgress) * parseInt(amb.eta)));

                        return (
                          <g 
                            key={amb.id} 
                            onClick={() => {
                              setSelectedAmbulance(amb.id);
                              setActiveMapPopup({ type: "ambulance", id: amb.id });
                            }} 
                            className="cursor-pointer group"
                          >
                            {isSelected && (
                              <circle cx={pos.x} cy={pos.y} r="15" fill="none" stroke={amb.color} strokeWidth="1.5" className="animate-ping" style={{ animationDuration: "1.5s" }} />
                            )}
                            <rect 
                              x={pos.x - 11} 
                              y={pos.y - 11} 
                              width="22" 
                              height="22" 
                              rx="6" 
                              fill={isSelected ? amb.color : "white"} 
                              stroke={amb.color} 
                              strokeWidth="2"
                            />
                            <text 
                              x={pos.x} 
                              y={pos.y + 3.5} 
                              textAnchor="middle" 
                              className="text-[10px]"
                              fill={isSelected ? "white" : amb.color}
                            >
                              🚑
                            </text>

                            {/* Floating live ETA banner */}
                            <g transform={`translate(${pos.x}, ${pos.y - 17})`}>
                              <rect x="-16" y="-6" width="32" height="12" rx="3" fill="#1e1b4b" />
                              <text x="0" y="2.5" textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-white">
                                {calculatedEta}m ETA
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>

                    {/* DYNAMIC POPUP DETAILS OVERLAY */}
                    {activeMapPopup && (() => {
                      let name = "";
                      let detailsHTML = null;
                      let x = 0;
                      let y = 0;
                      let hotline = "";

                      if (activeMapPopup.type === "hospital") {
                        const mappedHops = [
                          { name: "Apollo ER Hub", coords: [70, 70], hIndex: 0 },
                          { name: "Fortis Care Center", coords: [420, 90], hIndex: 1 },
                          { name: "AIIMS Trauma Wing", coords: [100, 240], hIndex: 2 }
                        ];
                        const matched = mappedHops.find(m => m.name === activeMapPopup.id);
                        if (!matched) return null;
                        
                        const hosp = EMERGENCY_HOSPITALS[matched.hIndex];
                        name = hosp.name;
                        x = matched.coords[0];
                        y = matched.coords[1];
                        hotline = hosp.hotline;

                        detailsHTML = (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#64748b]">Beds Available:</span>
                              <span className={`font-bold ${hosp.bedsAvailable <= 1 ? "text-red-alert" : "text-green-ok"}`}>
                                {hosp.bedsAvailable} Critical Units
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#64748b]">Distance:</span>
                              <span className="font-mono font-bold text-[#1e1b4b]">{hosp.distance} km away</span>
                            </div>
                            <div className="pt-1 text-[9px] text-[#475569] border-t border-slate-100 italic truncate" title={hosp.specialties.join(", ")}>
                              Focus: {hosp.specialties[0]}
                            </div>
                          </div>
                        );
                      } else if (activeMapPopup.type === "ambulance") {
                        const amb = AMBULANCES.find(a => a.id === activeMapPopup.id);
                        if (!amb) return null;

                        const individualProgress = (() => {
                          if (amb.id === 0) return progress;
                          if (amb.id === 1) return (progress + 0.35) % 1.0;
                          return (progress + 0.7) % 1.0;
                        })();

                        const pos = getPointOnRoute(amb.waypoints, individualProgress);
                        x = pos.x;
                        y = pos.y;
                        name = amb.name;
                        hotline = amb.hotline;

                        const calculatedEta = Math.max(1, Math.round((1 - individualProgress) * parseInt(amb.eta)));

                        detailsHTML = (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#64748b]">Est Arrival:</span>
                              <span className="font-bold text-red-alert">{calculatedEta} Mins ETA</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#64748b]">Driver/Crew:</span>
                              <span className="text-[#1e1b4b] font-medium truncate max-w-[120px]">{amb.driver.split(",")[0]}</span>
                            </div>
                            <div className="pt-1 text-[9px] text-[#475569] border-t border-slate-100 italic truncate" title={amb.equipment.join(", ")}>
                              Gear: {amb.equipment[0]}
                            </div>
                          </div>
                        );
                      }

                      // Coordinate percentage translations for responsive alignment
                      const leftPercent = (x / 500) * 100;
                      const topPercent = (y / 300) * 100;

                      return (
                        <div 
                          className="absolute bg-white/95 backdrop-blur-md border border-slate-200/95 shadow-[0_10px_25px_-5px_rgba(30,27,75,0.18)] rounded-xl p-3 z-50 w-56 animate-scaleIn pointer-events-auto text-left"
                          style={{ 
                            left: `${leftPercent}%`, 
                            top: `${topPercent}%`,
                            transform: "translate(-50%, -108%)", // Position above the node
                            marginTop: "-12px"
                          }}
                        >
                          {/* Little stem/pointing triangle at the bottom center */}
                          <div 
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"
                            style={{ filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.05))" }}
                          />

                          <div className="flex items-start justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                            <div className="space-y-0.5 max-w-[80%]">
                              <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                activeMapPopup.type === "hospital" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                              }`}>
                                {activeMapPopup.type === "hospital" ? "🏥 Hospital" : "🚑 Ambulance Rescue"}
                              </span>
                              <h4 className="font-orbitron font-extrabold text-[11px] text-[#1e1b4b] leading-tight truncate" title={name}>
                                {name}
                              </h4>
                            </div>
                            
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMapPopup(null);
                              }}
                              className="hover:bg-slate-100 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded cursor-pointer transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {detailsHTML}

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex gap-2">
                            <a 
                              href={`tel:${hotline}`}
                              className="flex-1 py-1.5 bg-red-alert hover:bg-red-alert/90 text-white font-mono font-bold text-[8.5px] uppercase tracking-wider rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>Call Hotline</span>
                            </a>
                            {activeMapPopup.type === "ambulance" && (
                              <button
                                type="button"
                                onClick={() => setSelectedAmbulance(activeMapPopup.id as number)}
                                className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-[8.5px] font-bold uppercase rounded-lg transition-colors cursor-pointer bg-white"
                              >
                                Track
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Right side: Selected dispatch telemetry metadata */}
            <div className="w-full xl:w-[320px] shrink-0 xl:border-l xl:border-border-dim/40 xl:pl-6 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-border-dim/40">
                  <span className="font-mono text-[9px] font-bold text-red-alert uppercase tracking-wider block">
                    LIVE TELEMETRY
                  </span>
                  <h4 className="font-orbitron font-extrabold text-sm text-text-primary uppercase leading-tight">
                    Transit Crew Dispatcher
                  </h4>
                </div>

                {(() => {
                  const amb = AMBULANCES[selectedAmbulance];
                  const individualProgress = (() => {
                    if (amb.id === 0) return progress;
                    if (amb.id === 1) return (progress + 0.35) % 1.0;
                    return (progress + 0.7) % 1.0;
                  })();
                  const actualEta = Math.max(1, Math.round((1 - individualProgress) * parseInt(amb.eta)));

                  return (
                    <div className="space-y-4 pt-3.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded font-mono font-bold text-[9px] uppercase bg-green-ok/10 text-green-ok">
                          Sirens Echoing
                        </span>
                        <span className="text-[10px] font-mono text-[#64748b] font-bold">
                          LOC: {Math.round(getPointOnRoute(amb.waypoints, individualProgress).x)}px, {Math.round(getPointOnRoute(amb.waypoints, individualProgress).y)}px
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5">
                          <Siren className="w-4 h-4 text-[#ef4444]" style={{ color: amb.color }} />
                          {amb.name}
                        </h5>
                        <p className="text-[10px] text-[#475569] leading-tight">
                          Active Pathway: <b>Central Arterial Grid Line</b>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <div>
                          <span className="text-[8px] font-mono text-[#64748b] block uppercase">Est Arrival</span>
                          <span className="text-base font-orbitron font-extrabold text-red-alert block">
                            {actualEta} Mins
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-[#64748b] block uppercase">Current speed</span>
                          <span className="text-base font-orbitron font-extrabold text-[#111827] block">
                            {speedMultiplier > 1 ? Math.round(amb.speed * 1.35) : amb.speed} km/h
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-[#64748b] block uppercase">Staff in Transit:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-red-alert/5 flex items-center justify-center text-xs border border-red-alert/20">
                            🩺
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-text-primary leading-tight">{amb.driver}</p>
                            <p className="text-[9px] text-[#059669] font-mono uppercase font-semibold">Active ALS Paramedicist</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-[#64748b] block uppercase">Advanced Gear Inventory:</span>
                        <div className="flex flex-wrap gap-1">
                          {amb.equipment.map((eq) => (
                            <span key={eq} className="px-2 py-0.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]/30 font-mono rounded text-[8.5px] uppercase font-semibold">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-border-dim/40 flex flex-col gap-1.5 mt-3">
                <p className="text-[9px] text-center text-[#94a3b8] leading-tight">
                  Connect voice bridge with active rescue vehicle driver:
                </p>
                <a
                  href={`tel:${AMBULANCES[selectedAmbulance].hotline}`}
                  className="w-full py-2 bg-red-alert hover:bg-red-alert/90 text-white font-orbitron font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-[0_2px_8px_rgba(220,38,38,0.15)] flex items-center justify-center gap-1.5 cursor-pointer border-0"
                >
                  <Phone className="w-3.5 h-3.5 text-white" />
                  <span>Call Dispatcher ({AMBULANCES[selectedAmbulance].hotline})</span>
                </a>
              </div>
            </div>
          </div>

          {/* L: AMBULANCE DISPATCH LOGISTICS (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 space-y-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border-dim">
                <Siren className="w-5 h-5 text-red-alert animate-pulse" />
                <div>
                  <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase leading-tight">Ambulance Dispatch lines</h3>
                  <span className="text-[9px] font-mono text-text-dim">TELE-SYNAPSE DIRECT DISPATCH</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {AMBULANCE_CHANNELS.map((amb) => (
                  <div key={amb.number} className="p-3.5 bg-bg-void/40 border border-border-dim hover:border-red-alert/25 rounded-xl transition-colors space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-red-alert uppercase tracking-wide">{amb.status}</span>
                        <h4 className="text-xs font-bold text-text-primary leading-snug">{amb.provider}</h4>
                        <p className="text-[10px] text-text-dim">{amb.type}</p>
                      </div>
                      <span className="bg-red-alert/10 text-red-alert font-mono font-bold text-xs px-2 py-0.5 rounded">
                        Est: {amb.speed}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border-dim/30">
                      <span className="font-mono text-xs font-extrabold text-text-secondary">{amb.number}</span>
                      <a
                        href={`tel:${amb.number}`}
                        className="px-3 py-1.5 bg-red-alert/10 hover:bg-red-alert text-red-alert hover:text-white rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-current" />
                        <span>Call Dispatch</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-amber-warn/10 border border-amber-warn/25 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-warn shrink-0 mt-0.5 animate-bounce" />
              <p className="text-[11px] text-text-secondary leading-normal">
                <b>Emergency Response Disclaimer:</b> Times shown represent local historical routing averages. Adverse regional weather or heavy traffic matrices might delay transit crews. For non-responsive crises, immediately declare coordinates.
              </p>
            </div>
          </div>

          {/* R: HOSPITALS FINDER MAP GRID (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* SEARCH AND FILTERS */}
            <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white shadow-sm">
              <div className="space-y-1">
                <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase leading-tight">Live Hospital ER Status</h3>
                <p className="text-[10px] text-text-dim font-sans leading-none">Dynamic clinical tracking sync</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-2 w-3.5 h-3.5 text-text-dim" />
                <input
                  id="hospital-query-input"
                  type="text"
                  placeholder="Filter by facility or trauma care..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-bg-void/40 border border-border-dim hover:border-red-alert/20 focus:border-red-alert text-xs placeholder:text-text-dim font-sans rounded-lg py-1.5 pl-9 pr-3 focus:outline-none w-52 max-w-full text-text-primary transition-colors"
                />
              </div>
            </div>

            {/* HOSPITALS CARDS LISTING */}
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {filteredHospitals.map((hosp) => {
                const isCritical = hosp.bedsAvailable <= 1;
                const isHighLoad = hosp.occupancyStatus === "High Load" || hosp.occupancyStatus === "Critical Load";
                
                return (
                  <div key={hosp.name} className="glass-panel p-5 bg-white border border-border-dim/60 hover:border-red-alert/30 rounded-2xl transition-all shadow-sm flex flex-col justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-orbitron text-base font-extrabold text-text-primary uppercase leading-snug">
                            {hosp.name}
                          </h4>
                          <span className="font-mono text-[10px] font-bold text-text-dim bg-bg-void border border-border-dim px-2 py-0.5 rounded">
                            📍 {hosp.distance} km
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-none">{hosp.address}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] uppercase leading-none ${
                          isHighLoad ? "bg-red-alert/15 text-red-alert" : "bg-green-ok/15 text-green-ok"
                        }`}>
                          {hosp.occupancyStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-void/40 border border-border-dim/40 rounded-xl p-3.5">
                      <div className="space-y-1">
                        <p className="font-mono text-[9px] text-text-dim uppercase leading-none">Emergency Trauma Focus:</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {hosp.specialties.map((spec) => (
                            <span key={spec} className="px-2 py-0.5 bg-[#fef2f2] border border-[#fee2e2] text-red-alert font-mono rounded text-[9px] uppercase font-bold">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 text-left md:text-right border-t md:border-t-0 md:border-l border-border-dim/40 pt-2.5 md:pt-0 md:pl-4">
                        <span className="font-mono text-[9px] text-text-dim uppercase block leading-none">TRAUMA ICU BEDS</span>
                        <div className="flex items-center md:justify-end gap-1.5 pt-1">
                          <span className={`text-xl font-orbitron font-extrabold ${isCritical ? "text-red-alert" : "text-green-ok"}`}>
                            {hosp.bedsAvailable} Left
                          </span>
                          <span className="text-xs text-text-secondary">available</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-border-dim/20 pt-3">
                      <span className="text-[10px] font-mono text-text-secondary">
                        Hotline: <b className="text-text-primary">{hosp.hotline}</b>
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            if (mapMode === "google") {
                              setSelectedRealPlace(hosp as HospitalPlace);
                              const el = document.getElementById("emergency-map-viewport");
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                              }
                            } else {
                              let label = "";
                              if (hosp.name.includes("Apollo")) label = "Apollo ER Hub";
                              else if (hosp.name.includes("Fortis")) label = "Fortis Care Center";
                              else if (hosp.name.includes("AIIMS")) label = "AIIMS Trauma Wing";
                              
                              if (label) {
                                setActiveMapPopup({ type: "hospital", id: label });
                                const el = document.getElementById("emergency-map-viewport");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                              }
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 border border-border-dim hover:border-red-alert/30 text-text-secondary hover:text-red-alert font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
                        >
                          <MapPin className="w-3.5 h-3.5 animate-pulse" />
                          <span>Locate</span>
                        </button>
                        <a
                          href={`tel:${hosp.hotline}`}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-alert text-white hover:bg-red-alert/90 font-mono font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <Phone className="w-3.5 h-3.5 text-white" />
                          <span>Emergency Call</span>
                        </a>
                        <button
                          onClick={() => {
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.name + " " + hosp.address)}`, "_blank");
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 border border-border-dim hover:border-red-alert/30 text-text-secondary hover:text-red-alert font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
                        >
                          <Map className="w-3.5 h-3.5" />
                          <span>Route Map</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredHospitals.length === 0 && (
                <div className="glass-panel p-12 text-center text-text-dim font-mono text-xs bg-white">
                  [ No hospitals match filters ]
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* FIRST AID PROCEDURES / SCENARIOS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FIRST_AID_GUIDES.map((guide, idx) => {
            const isSelected = selectedScenario === idx;
            
            return (
              <div
                key={guide.scenario}
                className={`glass-panel p-5 bg-white border rounded-2xl transition-all duration-300 shadow-sm flex flex-col justify-between ${
                  isSelected ? "border-red-alert translate-y-[-2px] shadow-md" : "border-border-dim hover:border-red-alert/20"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${guide.colorClass} border`}>
                        {typeof guide.icon === 'string' ? guide.icon : <span className="text-xl">🚑</span>}
                      </div>

                      <div className="space-y-0.5">
                        <span className="font-mono text-[9px] font-bold text-red-alert uppercase tracking-wide">{guide.urgency}</span>
                        <h4 className="font-orbitron text-sm font-extrabold text-text-primary uppercase leading-tight">
                          {guide.scenario}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-border-dim/20">
                    <p className="text-[11px] font-mono text-text-dim uppercase leading-none">Clinical Guidelines Steps:</p>
                    <ol className="space-y-2">
                      {guide.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex gap-2 text-xs text-text-secondary leading-normal">
                          <span className="font-mono font-bold text-red-alert text-[11px] select-none">{sIdx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-dim/20 mt-4">
                  <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-dim/60" /> SECURE LIFECARE
                  </span>
                  <button
                    onClick={() => setSelectedScenario(isSelected ? null : idx)}
                    className="px-3.5 py-1.5 border border-border-dim hover:border-red-alert/30 text-text-secondary hover:text-red-alert text-[10px] font-orbitron font-semibold uppercase rounded-lg transition-all cursor-pointer bg-transparent"
                  >
                    {isSelected ? "Collapse Details" : "Expand Guide"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
