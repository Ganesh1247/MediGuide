import { useState } from "react";
import { Phone, Siren, AlertTriangle, Clock, Search, ChevronDown, X, Activity, ShieldCheck, Zap } from "lucide-react";
import NearbyHospitalsMap from "./NearbyHospitalsMap";
import { motion, AnimatePresence } from "framer-motion";

const HOTLINES = [
  { provider: "National Emergency (Ambulance)", number: "108", type: "Government CATS", eta: "8–12 min", urgent: true },
  { provider: "National Health Helpline", number: "1075", type: "Ministry of Health", eta: "10–15 min", urgent: false },
  { provider: "Apollo ALS Ambulance", number: "1066", type: "Advanced Life Support", eta: "5–8 min", urgent: true },
  { provider: "Fortis Trauma Transport", number: "105010", type: "Advanced Trauma Support", eta: "6–10 min", urgent: false },
  { provider: "Women Helpline", number: "181", type: "National Safety", eta: "Immediate", urgent: false },
  { provider: "Child Helpline", number: "1098", type: "Childline India", eta: "Immediate", urgent: false },
];

const FIRST_AID = [
  {
    scenario: "Heart Attack",
    icon: "❤️",
    urgency: "CRITICAL: Call 108 Now",
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.15)",
    steps: [
      "Immediately call 108 or 1066. Do not wait for symptoms to pass.",
      "Help the person sit or lie down in a comfortable position.",
      "Loosen any restrictive clothing (belts, ties, collars).",
      "Give 325mg Aspirin to chew slowly (if no known allergies).",
      "Monitor breathing; begin CPR if they lose consciousness and stop breathing."
    ],
  },
  {
    scenario: "Choking (Airway Block)",
    icon: "🫁",
    urgency: "Immediate Action Required",
    color: "#FB923C",
    bg: "rgba(251, 146, 60, 0.15)",
    steps: [
      "Verify if they can speak or cough. If not, act immediately.",
      "Perform 5 back blows between shoulder blades with heel of hand.",
      "If unsuccessful, perform 5 abdominal thrusts (Heimlich Maneuver).",
      "Repeat 5-and-5 until object is expelled or person becomes unconscious.",
      "If they collapse, call 108 and start CPR immediately."
    ],
  },
  {
    scenario: "Severe Bleeding",
    icon: "🩸",
    urgency: "Apply Pressure Now",
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.15)",
    steps: [
      "Put on gloves if available and find source of bleeding.",
      "Apply FIRM, DIRECT pressure using a clean cloth or sterile gauze.",
      "If cloth soaks through, add more on top—do NOT remove original cloth.",
      "Elevate the wound above heart level if no fracture is suspected.",
      "If life-threatening bleeding doesn't stop, apply a tourniquet."
    ],
  },
  {
    scenario: "Stroke (Brain Attack)",
    icon: "🧠",
    urgency: "FAST Protocol - Urgent",
    color: "#818CF8",
    bg: "rgba(129, 140, 248, 0.15)",
    steps: [
      "FACE: Ask them to smile. Does one side droop?",
      "ARMS: Ask them to raise both arms. Does one drift downward?",
      "SPEECH: Ask them to repeat a simple phrase. Is it slurred?",
      "TIME: If any signs are present, call 108 immediately.",
      "Keep the person lying on their side with head slightly raised."
    ],
  }
];

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
    { id: "map" as const, label: "Medical Map", icon: Siren },
    { id: "hotlines" as const, label: "SOS Numbers", icon: Phone },
    { id: "firstaid" as const, label: "Fast Help", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-slideUp pb-12">

      {/* ── SOS Header ── */}
      <section className="rounded-[48px] p-10 lg:p-20 bg-red-alert/10 border-2 border-red-alert/20 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-alert/10 rounded-full blur-[150px] -mr-48 -mt-48" />

        <div className="relative z-10 space-y-8 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-alert text-white rounded-2xl shadow-2xl">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.25em]">Emergency Response Active</span>
          </div>
          <h1 className="font-display text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
            Emergency <br/> <span className="text-red-alert uppercase">Command</span>
          </h1>
          <p className="text-xl text-text-secondary font-medium leading-relaxed">
            Real-time hospital intelligence and life-saving protocols—synced directly with national emergency dispatchers.
          </p>
        </div>

        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="tel:108"
          className="relative z-10 w-full md:w-auto px-16 py-10 bg-red-alert text-white rounded-[40px] font-display font-black text-6xl flex flex-col items-center justify-center gap-4 shadow-[0_20px_80px_rgba(255,77,77,0.4)] transition-all border-none cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <Siren className="w-16 h-16 animate-pulse" />
            <span>108</span>
          </div>
          <span className="text-xs uppercase tracking-[0.4em] font-black opacity-70">Initiate Rescue</span>
        </motion.a>
      </section>

      {/* ── Nav ── */}
      <div className="flex p-2 bg-bg-surface border border-white/5 rounded-[28px] w-full max-w-lg mx-auto shadow-2xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all border-none cursor-pointer ${
                active
                ? "bg-red-alert text-white shadow-xl"
                : "text-text-secondary hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "map" && <NearbyHospitalsMap />}

          {activeTab === "hotlines" && (
            <div className="space-y-12 max-w-6xl mx-auto">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-text-dim" />
                <input
                  type="text"
                  placeholder="Filter emergency providers..."
                  className="input !h-16 !pl-16 !text-lg !rounded-[24px]"
                  value={hotlineSearch}
                  onChange={(e) => setHotlineSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredHotlines.map((h) => (
                  <div key={h.number} className={`card !p-10 flex flex-col justify-between group rounded-[40px] border-2 transition-all duration-500 ${h.urgent ? 'border-red-alert/40 bg-red-alert/5 shadow-red-alert/5' : 'border-white/5 bg-bg-elevated/30'}`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`badge ${h.urgent ? 'bg-red-alert text-white' : 'bg-bg-void text-text-dim border border-white/5'}`}>
                          {h.urgent ? "Priority Dispatch" : h.type}
                        </span>
                        <Clock className="w-5 h-5 text-text-dim" />
                      </div>
                      <h4 className="font-black text-2xl text-white tracking-tight leading-tight">{h.provider}</h4>
                    </div>

                    <div className="flex items-end justify-between mt-12">
                      <div>
                        <p className={`text-4xl font-mono font-black tracking-tighter ${h.urgent ? 'text-red-alert' : 'text-accent'}`}>{h.number}</p>
                        <p className="text-[10px] text-text-dim font-black uppercase tracking-widest mt-2">Avg. Response: {h.eta}</p>
                      </div>
                      <motion.a
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        href={`tel:${h.number}`}
                        className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all ${h.urgent ? 'bg-red-alert text-white shadow-2xl shadow-red-alert/30' : 'bg-bg-void text-white border border-white/10 hover:border-accent'}`}
                      >
                        <Phone className="w-7 h-7" />
                      </motion.a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "firstaid" && (
            <div className="space-y-12 max-w-4xl mx-auto">
              <div className="card !p-10 !bg-amber-warn/5 !border-amber-warn/20 rounded-[40px] flex items-start gap-8 shadow-2xl">
                <div className="w-20 h-20 rounded-[32px] bg-amber-warn/10 flex items-center justify-center shrink-0 border border-amber-warn/20 shadow-inner">
                  <AlertTriangle className="w-10 h-10 text-amber-warn" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-white text-2xl uppercase tracking-tighter">Emergency Protocol</h4>
                  <p className="text-lg text-text-secondary font-medium leading-relaxed">
                    Perform these steps <span className="text-white font-black underline underline-offset-8">immediately</span> while waiting for responders. Stay calm and follow every instruction carefully.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {FIRST_AID.map((guide, idx) => {
                  const isExpanded = expandedGuide === idx;
                  return (
                    <div
                      key={guide.scenario}
                      onClick={() => setExpandedGuide(isExpanded ? null : idx)}
                      className={`card !p-0 overflow-hidden cursor-pointer transition-all duration-500 rounded-[40px] border-2 ${isExpanded ? 'border-accent shadow-2xl ring-8 ring-accent/5' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <div className={`p-10 flex items-center justify-between ${isExpanded ? 'bg-bg-elevated/50' : ''} transition-colors`}>
                        <div className="flex items-center gap-8">
                          <div className="text-5xl w-24 h-24 bg-bg-void rounded-[32px] flex items-center justify-center border border-white/5 shadow-inner">
                            {guide.icon}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: guide.color }}>{guide.urgency}</p>
                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter">{guide.scenario}</h4>
                          </div>
                        </div>
                        <ChevronDown className={`w-8 h-8 text-text-dim transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                            className="bg-bg-void/50 border-t border-white/5"
                          >
                            <div className="p-10 space-y-10">
                              <div className="space-y-6">
                                {guide.steps.map((step, sIdx) => (
                                  <div key={sIdx} className="flex gap-8 items-start group">
                                    <div className="w-10 h-10 rounded-2xl bg-accent text-bg-void flex items-center justify-center font-black text-lg shrink-0 group-hover:scale-110 transition-transform">
                                      {sIdx + 1}
                                    </div>
                                    <p className="text-xl text-text-secondary font-medium leading-relaxed pt-1 group-hover:text-white transition-colors">
                                      {step}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-white/5">
                                <a
                                  href="tel:108"
                                  className="flex-1 btn-danger !py-8 !text-2xl justify-center shadow-2xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="w-8 h-8" />
                                  CALL 108 NOW
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="max-w-4xl mx-auto text-center space-y-4 pt-20">
        <Activity className="w-8 h-8 text-accent mx-auto animate-pulse" />
        <p className="text-xs text-text-dim font-black uppercase tracking-[0.4em]">Clinical Integrity Matrix v3.0</p>
        <p className="text-sm text-text-secondary font-medium leading-relaxed max-w-2xl mx-auto italic">
          MediGuide SOS Center uses real-time encrypted data feeds and verified emergency protocols. Information provided is for high-speed triage assistance during medical crises.
        </p>
      </footer>
    </div>
  );
}
