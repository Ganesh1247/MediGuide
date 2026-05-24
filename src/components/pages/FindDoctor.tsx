import { useState, useEffect } from "react";
import { NEARBY_DOCTORS } from "../../data/mockData";
import { Doctor } from "../../types";
import { 
  MapPin, 
  Navigation, 
  Star, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Check, 
  Search, 
  ShieldAlert, 
  Clock, 
  RefreshCw,
  UserCheck,
  Activity
} from "lucide-react";

interface FindDoctorProps {
  initialSpecialtyFilter?: string | null;
}

interface DoctorWithLiveState extends Doctor {
  queueSize: number;
  consultTimeRemaining: number; // in seconds
  liveStatus: "Available Now" | "In Consultation" | "In Surgery";
}

export default function FindDoctor({ initialSpecialtyFilter }: FindDoctorProps) {
  const [doctors, setDoctors] = useState<DoctorWithLiveState[]>(() => 
    NEARBY_DOCTORS.map((doc, idx) => ({
      ...doc,
      queueSize: (idx % 3) + 1,
      consultTimeRemaining: (idx + 1) * 120, // countdown starting from 120s, 240s, etc.
      liveStatus: idx === 0 ? "Available Now" : idx % 2 === 0 ? "In Consultation" : "In Surgery"
    }))
  );

  const [activeSpecialty, setActiveSpecialty] = useState<string>(
    initialSpecialtyFilter || "all"
  );
  const [searchDistrict, setSearchDistrict] = useState("");
  
  // States to manage futuristic booking confirmations
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorWithLiveState | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmDate, setConfirmDate] = useState("2026-05-24");
  const [confirmTime, setConfirmTime] = useState("10:00 AM");

  const [activeDocOnMap, setActiveDocOnMap] = useState<string | null>(null);
  const [secondsTick, setSecondsTick] = useState(0);

  const specialtiesList = [
    { id: "all", label: "All Specialists" },
    { id: "Emergency", label: "Emergency Medicine" },
    { id: "Neurologist", label: "Neurology" },
    { id: "Cardiologist", label: "Cardiology" },
    { id: "Gastroenterologist", label: "Gastroenterology" }
  ];

  // ── Real-time Ticker: Updates countdowns, doctor statuses and queue sizes ──
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsTick((t) => t + 1);
      setDoctors((prevDoctors) => 
        prevDoctors.map((doc) => {
          let nextTime = doc.consultTimeRemaining - 1;
          let nextStatus = doc.liveStatus;
          let nextQueue = doc.queueSize;

          if (nextTime <= 0) {
            // Consultation completed, reset timer and fluctuate queue size
            nextTime = Math.floor(Math.random() * 180) + 90; // reset to 90s - 270s
            
            if (doc.liveStatus === "In Consultation") {
              if (doc.queueSize > 1) {
                nextQueue = doc.queueSize - 1;
              } else {
                nextStatus = "Available Now";
                nextQueue = 0;
              }
            } else if (doc.liveStatus === "Available Now") {
              nextStatus = "In Consultation";
              nextQueue = Math.floor(Math.random() * 3) + 1;
            } else {
              // Surgery completed
              nextStatus = "Available Now";
              nextQueue = 0;
            }
          }

          // Random micro fluctuation in queue sizes every 12 seconds
          if (secondsTick > 0 && secondsTick % 12 === 0) {
            const queueDiff = Math.random() > 0.5 ? 1 : -1;
            nextQueue = Math.max(0, Math.min(6, nextQueue + queueDiff));
            
            // Adjust status to match queue size
            if (nextQueue === 0 && nextStatus === "In Consultation") {
              nextStatus = "Available Now";
            } else if (nextQueue > 0 && nextStatus === "Available Now") {
              nextStatus = "In Consultation";
            }
          }

          return {
            ...doc,
            consultTimeRemaining: nextTime,
            liveStatus: nextStatus,
            queueSize: nextQueue
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsTick]);

  const handleBookingTrigger = (doc: DoctorWithLiveState) => {
    setSelectedDoctorForBooking(doc);
    setBookingSuccess(false);
  };

  const executeBookingConfirm = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedDoctorForBooking(null);
      setBookingSuccess(false);
    }, 3500);
  };

  const filteredDoctors = doctors.filter((doc) => {
    const queryMatches = doc.name.toLowerCase().includes(searchDistrict.toLowerCase()) || 
                         doc.specialty.toLowerCase().includes(searchDistrict.toLowerCase());
    
    if (activeSpecialty === "all") return queryMatches;
    return doc.specialty.toLowerCase().includes(activeSpecialty.toLowerCase()) && queryMatches;
  });

  // Animated doctor coordinates drifting slightly over time
  const getMapPoints = () => {
    const timeFactor = secondsTick * 0.1;
    return [
      { id: "user", x: 60, y: 55, label: "Your Location (GPS Sync)", color: "#10B981" },
      { id: "doc_01", x: 45 + Math.sin(timeFactor * 0.3) * 0.8, y: 35 + Math.cos(timeFactor * 0.2) * 0.8, label: "Dr. Vikram Sarabhai (1.4km)", color: "#EF4444" },
      { id: "doc_02", x: 80 + Math.cos(timeFactor * 0.4) * 0.8, y: 25 + Math.sin(timeFactor * 0.3) * 0.8, label: "Dr. Ananya Iyer (2.8km)", color: "#8B5CF6" },
      { id: "doc_03", x: 30 + Math.sin(timeFactor * 0.2) * 0.8, y: 75 + Math.cos(timeFactor * 0.4) * 0.8, label: "Dr. Joseph Cardoza (3.1km)", color: "#3B82F6" },
      { id: "doc_04", x: 75 + Math.cos(timeFactor * 0.3) * 0.8, y: 70 + Math.sin(timeFactor * 0.2) * 0.8, label: "Dr. Sunita Deshmukh (4.2km)", color: "#F59E0B" }
    ];
  };

  const mapPoints = getMapPoints();
  const activePoint = mapPoints.find(pt => pt.id === activeDocOnMap);
  const userPoint = mapPoints.find(pt => pt.id === "user")!;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-3 relative z-10 font-sans">
      
      {/* LEFT AREA: Holographic Dark Vector Scanning Map (5 cols) */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between glass-panel p-5 bg-bg-surface/30 min-h-[440px] relative overflow-hidden rounded-2xl">
        
        {/* Animated Background scan radar sweeps */}
        <div className="absolute inset-0 cyber-grid-overlay opacity-25 select-none pointer-events-none" />
        
        <div className="absolute top-2 left-2 flex flex-col font-mono text-[9px] text-text-dim text-left">
          <span>COORDINATE LOCK: 17.4085° N, 78.4712° E</span>
          <span>RANGE_INDEX: RADAR_ONLINE (Real-time Drift)</span>
        </div>

        {/* Vector SVG Telemetry map viewport */}
        <div className="w-full flex-1 min-h-[280px] flex items-center justify-center relative my-4 border border-border-dim/40 rounded-2xl bg-bg-surface/10 overflow-hidden">
          
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[350px] relative z-10">
            {/* Draw grid metrics axes lines */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="var(--teal-glow)" strokeOpacity="0.08" strokeWidth="0.5" strokeDasharray="1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--teal-glow)" strokeOpacity="0.08" strokeWidth="0.5" strokeDasharray="1" />
            
            {/* Draw concentric diagnostic radar rings */}
            <circle cx="50" cy="50" r="15" fill="none" stroke="var(--teal-glow)" strokeOpacity="0.06" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="var(--teal-glow)" strokeOpacity="0.04" strokeWidth="0.5" strokeDasharray="2" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--teal-glow)" strokeOpacity="0.02" strokeWidth="0.5" />

            {/* Scanning radar sweep vector line (re-rotates dynamically) */}
            <line 
              x1="50" 
              y1="50" 
              x2={50 + Math.sin(secondsTick * 0.08) * 45} 
              y2={50 + Math.cos(secondsTick * 0.08) * 45} 
              stroke="var(--teal-glow)" 
              strokeOpacity="0.3" 
              strokeWidth="0.7" 
            />

            {/* Real-time connecting ray overlay if a doctor is selected/hovered */}
            {activePoint && activePoint.id !== "user" && (
              <g>
                <line
                  x1={userPoint.x}
                  y1={userPoint.y}
                  x2={activePoint.x}
                  y2={activePoint.y}
                  stroke={activePoint.color}
                  strokeWidth="0.75"
                  strokeDasharray="2,2"
                  className="animate-pulse"
                />
                <circle
                  cx={(userPoint.x + activePoint.x) / 2}
                  cy={(userPoint.y + activePoint.y) / 2}
                  r="1.5"
                  fill={activePoint.color}
                  className="animate-bounce"
                />
              </g>
            )}

            {/* Draw clinical beacons and points */}
            {mapPoints.map((pt) => {
              const isActive = activeDocOnMap === pt.id;
              const isUser = pt.id === "user";

              return (
                <g 
                  key={pt.id}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    if (!isUser) setActiveDocOnMap(pt.id);
                  }}
                  onMouseLeave={() => setActiveDocOnMap(null)}
                >
                  {/* Outer pulsing ring for active beacons */}
                  {(isActive || isUser) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isUser ? "4" : "5"}
                      fill="none"
                      stroke={pt.color}
                      strokeWidth="1"
                      className="animate-ping"
                      style={{ transformOrigin: `${pt.x}px ${pt.y}px`, animationDuration: isUser ? "2s" : "1.5s" }}
                    />
                  )}

                  {/* Beacon Core Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isUser ? "1.8" : "2.2"}
                    fill={pt.color}
                    className="shadow-md"
                  />

                  {/* Beacon Hover Tooltip Indicator Badge */}
                  {(isActive || isUser) && (
                    <g className="animate-fadeIn">
                      <rect
                        x={pt.x - 22}
                        y={pt.y - 11}
                        width="44"
                        height="7.5"
                        rx="1"
                        fill="rgba(15, 12, 22, 0.9)"
                        stroke={pt.color}
                        strokeWidth="0.3"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 6}
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="2.5"
                        fontWeight="bold"
                        fontFamily="var(--font-mono)"
                      >
                        {pt.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* User coordinates anchor indicator overlay */}
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[9px] font-mono text-text-secondary bg-bg-glass border border-border-dim px-2.5 py-1 rounded-xl">
            <Navigation className="w-3 h-3 text-teal-glow animate-bounce" />
            <span>GPS Tracking Sync Active</span>
          </div>

        </div>

        {/* Legend status indicators */}
        <div className="flex justify-around bg-bg-glass border border-border-dim p-2.5 rounded-xl font-mono text-[9px] text-text-secondary relative z-10">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-ok" /> User Sync
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-alert" /> Emergency
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-electric" /> Clinic Doctors
          </span>
        </div>

      </div>

      {/* RIGHT AREA: Doctors lists and booking selectors (7 cols) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6 text-left">
        
        {/* District Filter search bars */}
        <div className="glass-panel p-5 space-y-4 rounded-2xl bg-bg-surface">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-text-primary font-orbitron uppercase tracking-wider leading-none">
              Specialist Physician directories:
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-dim" />
              <input
                id="doctor-search-input"
                type="text"
                placeholder="Search name or clinic specialty..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="bg-bg-void/60 border border-border-dim hover:border-border-glow focus:border-blue-electric text-xs placeholder:text-text-dim font-sans rounded-xl py-2 pl-9 pr-3 focus:outline-none w-56 max-w-full text-text-primary transition-colors"
              />
            </div>
          </div>

          {/* Quick Specialties Tag Row */}
          <div className="flex flex-wrap gap-1.5">
            {specialtiesList.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveSpecialty(tag.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-sans transition-all duration-300 cursor-pointer border ${
                  activeSpecialty === tag.id
                    ? "bg-blue-electric/15 text-blue-electric border-blue-electric/40 font-bold"
                    : "bg-transparent border-border-dim/40 text-text-secondary hover:border-border-glow/20"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

        </div>

        {/* Dynamic Medical clinic Doctor Cards list */}
        <div className="space-y-3.5 overflow-y-auto max-h-[460px] pr-1 flex-1">
          {filteredDoctors.map((doc) => {
            const isHoveredOnMapObj = activeDocOnMap === doc.id;
            
            // Map statuses to glowing text colors
            const statusStyles = {
              "Available Now": "text-green-ok bg-green-ok/10 border-green-ok/20",
              "In Consultation": "text-blue-electric bg-blue-electric/10 border-blue-electric/20",
              "In Surgery": "text-red-alert bg-red-alert/10 border-red-alert/20"
            };

            return (
              <div
                key={doc.id}
                onMouseEnter={() => setActiveDocOnMap(doc.id)}
                onMouseLeave={() => setActiveDocOnMap(null)}
                className={`p-4 rounded-2xl glass-panel transition-all duration-300 grid grid-cols-1 md:grid-cols-4 items-center gap-4 border ${
                  isHoveredOnMapObj 
                    ? "border-teal-glow shadow-[0_0_12px_rgba(168,85,247,0.12)] bg-bg-surface" 
                    : "bg-bg-surface/50 border-border-dim"
                }`}
              >
                
                {/* Doctor Avatar + Info */}
                <div className="flex items-center gap-3.5 md:col-span-2 text-left">
                  <div className="w-12 h-12 rounded-full bg-blue-electric/15 border border-blue-electric/30 flex items-center justify-center font-orbitron font-extrabold text-blue-electric shrink-0 text-sm">
                    {doc.initials}
                  </div>
                  <div className="space-y-0.5 truncate">
                    <h4 className="font-orbitron font-bold text-sm text-text-primary uppercase truncate">{doc.name}</h4>
                    <p className="text-[11px] text-teal-glow font-mono uppercase font-semibold truncate">{doc.specialty}</p>

                    <div className="flex items-center gap-3 text-[10px] text-text-secondary pt-0.5">
                      <span className="inline-flex items-center gap-0.5 font-mono text-amber-warn font-semibold">
                        <Star className="w-3 h-3 fill-amber-warn text-amber-warn shrink-0" /> {doc.rating}
                      </span>
                      <span>•</span>
                      <span className="font-mono">📍 {doc.distance} km</span>
                    </div>
                  </div>
                </div>

                {/* Real-time availability info column */}
                <div className="text-left font-sans text-xs space-y-1.5">
                  <span className="text-[9px] text-text-dim block uppercase font-mono tracking-wider">Live Availability</span>
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold w-fit border ${statusStyles[doc.liveStatus]}`}>
                      ● {doc.liveStatus}
                    </span>
                    {doc.liveStatus === "In Consultation" && (
                      <span className="text-[10px] text-text-secondary font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-text-dim animate-spin" />
                        Next: {formatTime(doc.consultTimeRemaining)}
                      </span>
                    )}
                    {doc.queueSize > 0 && (
                      <span className="text-[10px] text-text-dim font-mono">
                        Queue: {doc.queueSize} patients waiting
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <a
                    href={`tel:${doc.phone}`}
                    title="Dial Specialist"
                    className="p-2.5 rounded-xl border border-border-dim hover:border-teal-glow bg-bg-surface transition-colors cursor-pointer text-text-secondary hover:text-text-primary flex items-center justify-center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  
                  <button
                    onClick={() => handleBookingTrigger(doc)}
                    className="px-4 py-2.5 rounded-xl bg-teal-glow hover:bg-teal-mid font-orbitron font-extrabold text-[10px] tracking-wider uppercase text-white transition-all cursor-pointer border-0 shadow-sm"
                  >
                    Book Consultation
                  </button>
                </div>

              </div>
            );
          })}

          {filteredDoctors.length === 0 && (
            <div className="glass-panel p-12 text-center text-text-dim font-mono text-xs bg-bg-surface">
              [ No certified specialists matching criteria ]
            </div>
          )}
        </div>

      </div>

      {/* DETAILED BOOKING MODAL OVERLAY CONFIRMATION (REUSABLE MODAL PANEL) */}
      {selectedDoctorForBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-panel p-6 max-w-sm w-full bg-bg-glass space-y-4 border border-teal-glow/40 shadow-2xl rounded-2xl text-left">
            
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="font-mono text-[9px] text-teal-glow uppercase tracking-wider block">Encrypted Synapse Link</span>
                <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase">Confirm Consultation</h3>
              </div>
              <button 
                onClick={() => setSelectedDoctorForBooking(null)}
                className="text-text-dim hover:text-text-primary font-bold font-mono text-xs p-1 border-0 bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-bg-void border border-border-dim rounded-xl space-y-1 text-xs">
              <p className="font-mono text-[9px] text-text-dim uppercase">Consultant Practitioner:</p>
              <p className="font-bold text-text-primary">{selectedDoctorForBooking.name}</p>
              <p className="text-[10px] text-teal-glow font-mono uppercase font-semibold">{selectedDoctorForBooking.specialty}</p>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-green-ok/10 border border-green-ok/30 rounded-xl text-center space-y-2 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-green-ok/15 text-green-ok flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-orbitron font-extrabold text-green-ok text-xs uppercase tracking-wider">BOOKING ENCRYPTED & ISSUED</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                  Video teleconsultation link sent to registered email. Secure synapse gate lock active.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 font-sans text-xs">
                
                <div className="space-y-1.5">
                  <label htmlFor="appt-date-input" className="font-mono text-[9px] text-text-dim uppercase block">Target Sync Date:</label>
                  <input
                    id="appt-date-input"
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full bg-bg-void border border-border-dim text-text-primary text-xs font-mono rounded-lg p-2 focus:outline-none focus:border-teal-glow"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="appt-time-input" className="font-mono text-[9px] text-text-dim uppercase block">Select Tele-synapse Slot:</label>
                  <select
                    id="appt-time-input"
                    value={confirmTime}
                    onChange={(e) => setConfirmTime(e.target.value)}
                    className="w-full bg-bg-void border border-border-dim text-text-primary text-xs font-mono rounded-lg p-2 focus:outline-none focus:border-teal-glow cursor-pointer"
                  >
                    <option value="10:00 AM">10:00 AM (Earliest Available)</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] text-text-dim font-mono pt-1">
                  <span className="w-1.5 h-1.5 bg-amber-warn rounded-full animate-ping" />
                  <span>Verified via secure CDSCO gateway protocols</span>
                </div>

                <button
                  onClick={executeBookingConfirm}
                  className="w-full py-3 rounded-xl bg-teal-glow hover:bg-teal-mid text-white font-orbitron font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md transition-colors"
                >
                  Confirm Synapse Block
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
