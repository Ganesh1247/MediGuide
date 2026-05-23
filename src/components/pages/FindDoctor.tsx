import { useState } from "react";
import { NEARBY_DOCTORS } from "../../data/mockData";
import { Doctor } from "../../types";
import { MapPin, Navigation, Star, Phone, MessageSquare, Calendar, Check, Search, ShieldAlert } from "lucide-react";

interface FindDoctorProps {
  initialSpecialtyFilter?: string | null;
}

export default function FindDoctor({ initialSpecialtyFilter }: FindDoctorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(NEARBY_DOCTORS);
  const [activeSpecialty, setActiveSpecialty] = useState<string>(
    initialSpecialtyFilter || "all"
  );
  const [searchDistrict, setSearchDistrict] = useState("");
  
  // States to manage futuristic booking confirmations
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmDate, setConfirmDate] = useState("2026-05-24");
  const [confirmTime, setConfirmTime] = useState("10:00 AM");

  const [activeDocOnMap, setActiveDocOnMap] = useState<string | null>(null);

  const specialtiesList = [
    { id: "all", label: "All Specialists" },
    { id: "Emergency", label: "Emergency Medicine" },
    { id: "Neurologist", label: "Neurology" },
    { id: "Cardiologist", label: "Cardiology" },
    { id: "Gastroenterologist", label: "Gastroenterology" }
  ];

  const handleBookingTrigger = (doc: Doctor) => {
    setSelectedDoctorForBooking(doc);
    setBookingSuccess(false);
  };

  const executeBookingConfirm = () => {
    setBookingSuccess(true);
    // Auto reset confirmation modal after some time
    setTimeout(() => {
      setSelectedDoctorForBooking(null);
      setBookingSuccess(false);
    }, 4000);
  };

  const filteredDoctors = doctors.filter((doc) => {
    const queryMatches = doc.name.toLowerCase().includes(searchDistrict.toLowerCase()) || 
                         doc.specialty.toLowerCase().includes(searchDistrict.toLowerCase());
    
    if (activeSpecialty === "all") return queryMatches;
    
    // Check if doctor's specialty contains the category ID
    return doc.specialty.toLowerCase().includes(activeSpecialty.toLowerCase()) && queryMatches;
  });

  // Coordinates array to display beacons on our vector SVG map
  const MapPoints = [
    { id: "user", x: 60, y: 55, label: "Your Location (GPS Sync)", color: "#00f3ff" },
    { id: "doc_01", x: 45, y: 35, label: "Dr. Vikram Sarabhai (1.4km)", color: "#ff3d3d" },
    { id: "doc_02", x: 80, y: 25, label: "Dr. Ananya Iyer (2.8km)", color: "#00f3ff" },
    { id: "doc_03", x: 30, y: 75, label: "Dr. Joseph Cardoza (3.1km)", color: "#fbbf24" },
    { id: "doc_04", x: 75, y: 70, label: "Dr. Sunita Deshmukh (4.2km)", color: "#10b981" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-3 relative z-10">
      
      {/* LEFT AREA: Holographic Dark Vector Scanning Map (5 cols) */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between glass-panel p-5 bg-bg-surface/30 min-h-[440px] relative overflow-hidden">
        
        {/* Animated Background scan radar sweeps */}
        <div className="absolute inset-0 cyber-grid-overlay opacity-35 select-none pointer-events-none" />
        <div className="absolute top-2 left-2 flex flex-col font-mono text-[9px] text-text-secondary">
          <span>COORDINATE LOCK: 17.4085° N, 78.4712° E</span>
          <span>RANGE_INDEX: RADAR_ONLINE</span>
        </div>

        {/* Vector SVG Telemetry map viewport */}
        <div className="w-full flex-1 min-h-[280px] flex items-center justify-center relative my-4 border border-border-dim/40 rounded-xl bg-bg-void overflow-hidden">
          
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[350px] relative z-10">
            {/* Draw grid metrics axes lines */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0, 255, 208, 0.05)" strokeWidth="0.5" strokeDasharray="1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0, 255, 208, 0.05)" strokeWidth="0.5" strokeDasharray="1" />
            
            {/* Draw concentric diagnostic radar rings */}
            <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(0, 255, 208, 0.08)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0, 255, 208, 0.06)" strokeWidth="0.5" strokeDasharray="2" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0, 255, 208, 0.04)" strokeWidth="0.5" />

            {/* Scanning radar sweep vector line (re-rotates dynamically) */}
            <line x1="50" y1="50" x2="90" y2="20" stroke="rgba(0, 255, 208, 0.25)" strokeWidth="0.5" className="origin-center animate-spin" style={{ animationDuration: "12s" }} />

            {/* Draw clinical beacons and points */}
            {MapPoints.map((pt) => {
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
                        y={pt.y - 10}
                        width="44"
                        height="6.8"
                        rx="1"
                        fill="rgba(7, 21, 32, 0.9)"
                        stroke={pt.color}
                        strokeWidth="0.3"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 5.5}
                        textAnchor="middle"
                        fill="#e8f4f0"
                        fontSize="3"
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
          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] font-mono text-text-secondary bg-bg-surface/80 border border-border-dim px-2 py-0.5 rounded">
            <Navigation className="w-3.5 h-3.5 text-teal-glow animate-bounce" />
            <span>GPS Tracking: Locked & Calibrated</span>
          </div>

        </div>

        {/* Legend status indicators */}
        <div className="flex justify-around bg-bg-void border border-border-dim p-2.5 rounded-xl font-mono text-[9px] text-text-secondary relative z-10">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-glow" /> User Sync
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-alert" /> Emergency Medicine
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-electric" /> Specialist Clinics
          </span>
        </div>

      </div>

      {/* RIGHT AREA: Doctors lists and booking selectors (7 cols) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6">
        
        {/* District Filter search bars */}
        <div className="glass-panel p-5 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-text-primary font-orbitron uppercase tracking-widest leading-none">
              Specialist Physician Location Directories:
            </p>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-2 w-3.5 h-3.5 text-text-dim" />
              <input
                id="doctor-search-input"
                type="text"
                placeholder="Search name or clinic specialty..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="bg-bg-void/40 border border-border-dim hover:border-border-glow focus:border-blue-electric text-xs placeholder:text-text-dim font-sans rounded-xl py-1.5 pl-9 pr-3 focus:outline-none w-52 max-w-full text-text-primary transition-colors"
              />
            </div>
          </div>

          {/* Quick Specialties Tag Row */}
          <div className="flex flex-wrap gap-1.5">
            {specialtiesList.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveSpecialty(tag.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-sans transition-all duration-300 cursor-pointer ${
                  activeSpecialty === tag.id || (tag.id === "all" && activeSpecialty === "all")
                    ? "bg-blue-electric/20 text-blue-electric border border-blue-electric/40 font-bold"
                    : "bg-transparent border border-border-dim/40 text-text-secondary hover:border-border-glow/20"
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
            return (
              <div
                key={doc.id}
                onMouseEnter={() => setActiveDocOnMap(doc.id)}
                onMouseLeave={() => setActiveDocOnMap(null)}
                className={`p-4 rounded-2xl glass-panel transition-all duration-300 grid grid-cols-1 md:grid-cols-4 items-center gap-4 ${
                  isHoveredOnMapObj 
                    ? "border-hover border-teal-glow shadow-[0_0_12px_rgba(0,255,208,0.1)] bg-bg-surface/65" 
                    : "bg-bg-surface/20"
                }`}
              >
                
                {/* Doctor Initial Avatar */}
                <div className="flex items-center gap-3.5 md:col-span-2">
                  <div className="w-12 h-12 rounded-full bg-blue-electric/15 border border-blue-electric/30 flex items-center justify-center font-orbitron font-extrabold text-blue-electric shrink-0 text-sm">
                    {doc.initials}
                  </div>
                  <div className="space-y-0.5 truncate">
                    <h4 className="font-orbitron font-bold text-sm text-text-primary uppercase truncate">{doc.name}</h4>
                    <p className="text-[11px] text-teal-glow font-mono uppercase font-semibold text-ellipsis overflow-hidden">{doc.specialty}</p>

                    <div className="flex items-center gap-3 text-[10px] text-text-secondary pt-0.5">
                      <span className="inline-flex items-center gap-0.5 font-mono text-amber-warn font-semibold">
                        <Star className="w-3 h-3 fill-amber-warn text-amber-warn shrink-0" /> {doc.rating}
                      </span>
                      <span>•</span>
                      <span className="font-mono">📍 {doc.distance} km</span>
                    </div>
                  </div>
                </div>

                <div className="text-left font-sans text-xs space-y-1">
                  <span className="text-[10px] text-text-dim block uppercase font-mono">Earliest Availability</span>
                  <p className={`font-semibold ${doc.available ? "text-green-ok" : "text-text-secondary"}`}>
                    {doc.available ? "● Available Now" : `● ${doc.nextSlot}`}
                  </p>
                </div>

                <div className="flex items-center justify-end md:justify-end gap-2.5">
                  <a
                    href={`tel:${doc.phone}`}
                    title="Dial Specialist"
                    className="p-2.5 rounded-xl border border-border-dim hover:border-border-glow/40 bg-bg-void/40 transition-colors cursor-pointer text-text-secondary hover:text-text-primary flex items-center justify-center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  
                  <button
                    onClick={() => handleBookingTrigger(doc)}
                    className="px-4 py-2.5 rounded-xl bg-teal-glow hover:bg-teal-glow/90 font-orbitron font-extrabold text-[10px] tracking-wider uppercase text-bg-void transition-all cursor-pointer"
                  >
                    Book Appt
                  </button>
                </div>

              </div>
            );
          })}

          {filteredDoctors.length === 0 && (
            <div className="glass-panel p-12 text-center text-text-dim font-mono text-xs">
              [ No certified specialists matching criteria ]
            </div>
          )}
        </div>

      </div>

      {/* DETAILED BOOKING MODAL OVERLAY CONFIRMATION (REUSABLE MODAL PANEL) */}
      {selectedDoctorForBooking && (
        <div className="fixed inset-0 bg-bg-void/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-panel p-6 max-w-sm w-full bg-bg-surface space-y-4 border-teal-glow/40 shadow-[0_0_30px_rgba(0,255,208,0.2)]">
            
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="font-mono text-[9px] text-teal-glow uppercase">ENCRYPTED PATIENT GATEWAY</span>
                <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase">Confirm Clinical Appointment</h3>
              </div>
              <button 
                onClick={() => setSelectedDoctorForBooking(null)}
                className="text-text-dim hover:text-text-primary font-bold font-mono text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-bg-void/50 border border-border-dim/80 rounded-xl space-y-1 text-xs">
              <p className="font-mono text-[10px] text-text-secondary uppercase">Consultant Practitioner:</p>
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
                  <label htmlFor="appt-date-input" className="font-mono text-[10px] text-text-secondary uppercase">Target Sync Date:</label>
                  <input
                    id="appt-date-input"
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full bg-bg-void border border-border-dim text-text-primary text-xs font-mono rounded-lg p-2 focus:outline-none focus:border-teal-glow"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="appt-time-input" className="font-mono text-[10px] text-text-secondary uppercase">Select Tele-synapse Slot:</label>
                  <select
                    id="appt-time-input"
                    value={confirmTime}
                    onChange={(e) => setConfirmTime(e.target.value)}
                    className="w-full bg-bg-void border border-border-dim text-text-primary text-xs font-mono rounded-lg p-2 focus:outline-none focus:border-teal-glow"
                  >
                    <option value="10:00 AM">10:00 AM (Earliest Available)</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 text-[9px] text-text-dim font-mono pt-1">
                  <span className="w-1 h-1 bg-amber-warn rounded-full animate-ping" />
                  <span>Verified via secure CDSCO gateway protocols</span>
                </div>

                <button
                  onClick={executeBookingConfirm}
                  className="w-full p-2.5 rounded-lg btn-primary text-xs uppercase font-orbitron font-bold tracking-wider cursor-pointer shadow-[0_0_12px_rgba(0,255,208,0.2)]"
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
