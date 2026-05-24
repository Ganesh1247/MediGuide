import { useState } from "react";
import { Phone, MapPin, Siren, AlertTriangle, Clock, Search } from "lucide-react";
import NearbyHospitalsMap from "./NearbyHospitalsMap";

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOTLINES = [
  { provider: "National Emergency (Ambulance)", number: "108", type: "Government CATS", eta: "8–12 min", urgent: true },
  { provider: "National Health Helpline", number: "1075", type: "Ministry of Health", eta: "10–15 min", urgent: false },
  { provider: "Apollo ALS Ambulance", number: "1066", type: "Advanced Life Support Fleet", eta: "5–8 min", urgent: true },
  { provider: "Fortis Trauma Transport", number: "105010", type: "Advanced Trauma Support", eta: "6–10 min", urgent: false },
  { provider: "Max Healthcare Emergency", number: "011-40554055", type: "Paramedic Road Corps", eta: "5–9 min", urgent: false },
  { provider: "Air Ambulance (Charter)", number: "+91 9540561561", type: "Helicopter Rescues", eta: "35–50 min", urgent: false },
  { provider: "Women Helpline", number: "181", type: "National Women Safety", eta: "Immediate", urgent: false },
  { provider: "Child Helpline", number: "1098", type: "CHILDLINE India", eta: "Immediate", urgent: false },
  { provider: "Poison Control Centre", number: "1800-11-6117", type: "AIIMS Poison Helpline", eta: "Immediate", urgent: false },
  { provider: "Disaster Management", number: "1078", type: "National Disaster Response", eta: "Varies", urgent: false },
];

const FIRST_AID = [
  {
    scenario: "Heart Attack",
    icon: "❤️",
    urgency: "Call 108 immediately",
    color: "var(--red-alert)",
    bg: "var(--red-muted)",
    steps: [
      "Call 108 / 1066 at once — do NOT wait.",
      "Have the patient sit or lie still and rest. Loosen tight clothing.",
      "Give 1 adult aspirin (325 mg) to chew slowly if they are not allergic.",
      "If they lose consciousness and stop breathing, begin CPR at 100–120 compressions per minute.",
    ],
  },
  {
    scenario: "Choking (Airway Blocked)",
    icon: "🫁",
    urgency: "Act within seconds",
    color: "var(--amber-warn)",
    bg: "var(--amber-muted)",
    steps: [
      "Ask 'Are you choking?' — if they cannot speak or cry, act immediately.",
      "Stand behind them, wrap arms around their waist.",
      "Make a fist and place it just above the navel. Deliver firm upward thrusts (Heimlich).",
      "Repeat until the object is expelled or they become unconscious.",
    ],
  },
  {
    scenario: "Severe Bleeding",
    icon: "🩸",
    urgency: "Immediate pressure",
    color: "var(--red-alert)",
    bg: "var(--red-muted)",
    steps: [
      "Apply firm direct pressure using a clean cloth or gauze.",
      "Elevate the injured limb above heart level if possible.",
      "Do NOT remove the cloth — add more on top if it soaks through.",
      "If bleeding is from an arm or leg and won't stop, apply a tourniquet 2–3 inches above the wound.",
    ],
  },
  {
    scenario: "Heat Stroke",
    icon: "🌡️",
    urgency: "Cool rapidly — life-threatening",
    color: "var(--blue)",
    bg: "var(--blue-muted)",
    steps: [
      "Move the person out of the sun into shade or cool air immediately.",
      "Remove excess clothing. Fan them vigorously.",
      "Apply ice packs or cold wet cloths to neck, armpits, and groin.",
      "Do NOT give fluids if the person is unconscious. Call 108.",
    ],
  },
  {
    scenario: "Stroke (Brain Attack)",
    icon: "🧠",
    urgency: "FAST — every minute counts",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    steps: [
      "Use FAST: Face drooping, Arm weakness, Speech slurred, Time to call 108.",
      "Lay the person on their side to prevent choking.",
      "Do not give food, water, or medication.",
      "Note the time symptoms started — doctors need this to treat effectively.",
    ],
  },
  {
    scenario: "Fracture / Broken Bone",
    icon: "🦴",
    urgency: "Stabilise, don't move",
    color: "var(--amber-warn)",
    bg: "var(--amber-muted)",
    steps: [
      "Do NOT try to straighten the bone. Immobilise in the position you find it.",
      "Use a splint — a rigid object (ruler, board) tied above and below the break.",
      "Apply ice wrapped in cloth to reduce swelling. Do not apply ice directly.",
      "Call for help or transport carefully to the nearest orthopaedic emergency.",
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Emergency() {
  const [activeTab, setActiveTab] = useState<"map" | "hotlines" | "firstaid">("map");
  const [hotlineSearch, setHotlineSearch] = useState("");
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const filteredHotlines = HOTLINES.filter(
    (h) =>
      h.provider.toLowerCase().includes(hotlineSearch.toLowerCase()) ||
      h.number.includes(hotlineSearch)
  );

  const TABS = [
    { id: "map" as const, label: "Nearby Hospitals", emoji: "🏥" },
    { id: "hotlines" as const, label: "Emergency Hotlines", emoji: "📞" },
    { id: "firstaid" as const, label: "First Aid Guide", emoji: "🩺" },
  ];

  return (
    <div className="space-y-6 py-6 animate-fadeIn">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
        style={{ borderLeft: "4px solid var(--red-alert)", borderLeftColor: "var(--red-alert)" }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--red-alert)" }}
            />
            <span
              style={{ fontSize: 11, fontWeight: 700, color: "var(--red-alert)",
                textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}
            >
              Emergency Services Active
            </span>
          </div>
          <h1
            style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)",
              fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            Emergency Center
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 520 }}>
            Find nearby hospitals, call emergency hotlines, and access first aid guides when seconds matter.
          </p>
        </div>

        <a
          href="tel:108"
          className="btn-danger"
          style={{ fontSize: 15, padding: "14px 28px", borderRadius: 12, flexShrink: 0 }}
        >
          <Siren className="w-5 h-5 animate-pulse" />
          Call 108 Now
        </a>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: 6,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          width: "fit-content",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "var(--font-display)",
                transition: "all 0.2s",
                background: isActive ? "var(--red-alert)" : "transparent",
                color: isActive ? "white" : "var(--text-secondary)",
                boxShadow: isActive ? "0 2px 12px rgba(239,68,68,0.3)" : "none",
              }}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab: Nearby Hospitals Map ─────────────────────────────────────────── */}
      {activeTab === "map" && (
        <div className="animate-fadeIn">
          <NearbyHospitalsMap />
        </div>
      )}

      {/* ── Tab: Emergency Hotlines ───────────────────────────────────────────── */}
      {activeTab === "hotlines" && (
        <div className="animate-fadeIn space-y-4">

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 360 }}>
            <Search className="w-4 h-4" style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-dim)"
            }} />
            <input
              type="text"
              className="input"
              placeholder="Search by provider or number…"
              value={hotlineSearch}
              onChange={(e) => setHotlineSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Hotline grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHotlines.map((h) => (
              <div
                key={h.number}
                className="card"
                style={{
                  padding: "18px 20px",
                  borderColor: h.urgent ? "var(--red-alert)" : "var(--border)",
                  background: h.urgent ? "var(--red-muted)" : "var(--bg-surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    {h.urgent && (
                      <span className="badge badge-red" style={{ marginBottom: 6, display: "inline-flex" }}>
                        ⚡ Priority
                      </span>
                    )}
                    <p style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.3 }}>
                      {h.provider}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{h.type}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{
                      fontSize: 22, fontWeight: 900, fontFamily: "var(--font-mono)",
                      color: h.urgent ? "var(--red-alert)" : "var(--text-primary)", lineHeight: 1
                    }}>
                      {h.number}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>
                      ETA: {h.eta}
                    </p>
                  </div>

                  <a
                    href={`tel:${h.number}`}
                    className={h.urgent ? "btn-danger" : "btn-secondary"}
                    style={{ padding: "9px 16px", fontSize: 13, gap: 6, borderRadius: 10 }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div
            className="card p-4 flex items-start gap-3"
            style={{ borderColor: "var(--amber-warn)", background: "var(--amber-muted)" }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--amber-warn)" }} />
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--amber-warn)" }}>Disclaimer:</strong> ETAs are average estimates based on typical traffic conditions. 
              Always call 108 first — it's free, government-operated, and prioritised nationwide.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab: First Aid Guide ─────────────────────────────────────────────── */}
      {activeTab === "firstaid" && (
        <div className="animate-fadeIn space-y-4">
          <div className="card p-4 flex items-start gap-3" style={{ borderColor: "var(--accent)", background: "var(--accent-muted)" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--accent)" }}>These are first-response guidelines only.</strong> Always call
              emergency services (108) immediately for any life-threatening situation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIRST_AID.map((guide, idx) => {
              const isExpanded = expandedGuide === idx;
              return (
                <div
                  key={guide.scenario}
                  className="card"
                  style={{
                    padding: "20px",
                    borderColor: isExpanded ? guide.color : "var(--border)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setExpandedGuide(isExpanded ? null : idx)}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: isExpanded ? 16 : 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: guide.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, border: `1px solid ${guide.color}30`,
                    }}>
                      {guide.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", color: guide.color,
                        fontFamily: "var(--font-mono)", display: "block", marginBottom: 3
                      }}>
                        {guide.urgency}
                      </span>
                      <h3 style={{
                        fontSize: 15, fontWeight: 800, color: "var(--text-primary)",
                        fontFamily: "var(--font-display)"
                      }}>
                        {guide.scenario}
                      </h3>
                    </div>

                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: isExpanded ? guide.bg : "var(--bg-elevated)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isExpanded ? guide.color : "var(--text-dim)",
                      fontSize: 14, flexShrink: 0, transition: "all 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}>
                      ↓
                    </div>
                  </div>

                  {/* Expanded steps */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: `1px solid ${guide.color}20`,
                        paddingTop: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {guide.steps.map((step, sIdx) => (
                        <div key={sIdx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: guide.bg, color: guide.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)",
                          }}>
                            {sIdx + 1}
                          </span>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                            {step}
                          </p>
                        </div>
                      ))}

                      <a
                        href="tel:108"
                        className="btn-danger"
                        style={{ marginTop: 8, fontSize: 13, justifyContent: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" /> Call 108 — Emergency
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
