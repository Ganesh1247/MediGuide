import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import HumanBodyCanvas from "../3d/HumanBodyCanvas";
import { BodyRegion } from "../../types";
import {
  ShieldAlert,
  Cpu,
  Pill,
  Speech,
  HelpCircle,
  Siren,
  AlertTriangle,
  X,
  Activity,
  Play,
  Info,
  ChevronRight,
  MapPin,
  Heart,
  Hospital
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface HomeProps {
  onStartTriage: (region?: BodyRegion) => void;
  onNavigateToTab: (tabId: string, extraState?: any) => void;
}

export default function Home({ onStartTriage, onNavigateToTab }: HomeProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [selectedRegionForTriage, setSelectedRegionForTriage] = useState<BodyRegion | null>(null);
  const { t } = useLanguage();

  const services = [
    {
      id: "symptom",
      title: "Symptom Checker",
      desc: "Tap body parts to identify clinical concerns and get instant triage guidelines.",
      image: "/symptom_triage.png",
      tag: "Trending",
      icon: ShieldAlert,
      accent: "#EF4444",
    },
    {
      id: "hospitals",
      title: "Hospital Finder",
      desc: "Find hospitals by specialty type near your GPS location — cardiology, neurology, maternity and more.",
      image: "/er_dispatch.png",
      tag: "GPS Live",
      icon: Hospital,
      accent: "#F97316",
    },
    {
      id: "medicine",
      title: "Medicine Scanner",
      desc: "Scan prescription labels to instantly extract compounds, dosage and interaction warnings.",
      image: "/rx_scanner.png",
      tag: "New",
      icon: Pill,
      accent: "#38BDF8",
    },
    {
      id: "fact",
      title: "Health Fact Checker",
      desc: "Verify wellness myths and viral health claims against official scientific evidence.",
      image: "/myth_auditor.png",
      tag: "AI Checked",
      icon: HelpCircle,
      accent: "#22C55E",
    },
  ];

  const quickStats = [
    { label: "Pulmonary Rate", value: "72 bpm", status: "Normal", color: "text-red-alert", bg: "bg-red-alert/10" },
    { label: "SpO2 Saturation", value: "98%", status: "Normal", color: "text-green-ok", bg: "bg-green-ok/10" },
    { label: "Core Temp", value: "98.4 °F", status: "Normal", color: "text-amber-warn", bg: "bg-amber-warn/10" }
  ];

  return (
    <div className="space-y-12 py-6 relative z-10 animate-fadeIn font-sans">
      
      {/* ── 1. CINEMATIC BILLBOARD / SPOTLIGHT HERO ── */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-border-dim/40 shadow-2xl h-[450px] md:h-[480px] flex flex-col justify-end p-6 md:p-12">
        {/* Billboard cinematic backdrop overlay */}
        <div className="absolute inset-0 bg-cover bg-center z-0 opacity-40 mix-blend-overlay transition-all duration-500 scale-105 hover:scale-100" style={{ backgroundImage: "url('/symptom_triage.png')" }} />
        
        {/* Smooth cinematic bottom gradient fading into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void via-bg-void/60 to-transparent z-1" />
        
        {/* Animated grid aesthetic in hero */}
        <div className="absolute inset-0 cyber-grid-overlay opacity-15 pointer-events-none z-1" />

        <div className="relative z-10 max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-alert/15 border border-red-alert/30 text-red-alert rounded-full">
            <span className="w-1.5 h-1.5 bg-red-alert rounded-full animate-ping" />
            <span className="font-mono text-[9px] uppercase tracking-widest font-black">
              Featured Clinical System
            </span>
          </div>

          <h1 className="font-orbitron text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-text-primary">
            {t("home_title").split(" ")[0]} <span className="bg-gradient-to-r from-teal-glow to-blue-electric bg-clip-text text-transparent">{t("home_title").split(" ").slice(1).join(" ")}</span>
          </h1>

          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-xl">
            {t("home_desc")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onStartTriage()}
              className="px-6 py-3.5 rounded-xl bg-teal-glow hover:bg-teal-mid text-white font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_18px_rgba(124,58,237,0.3)] flex items-center gap-2 cursor-pointer border-0"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>{t("home_start_quick_triage")}</span>
            </button>
            <button
              onClick={() => onNavigateToTab("emergency")}
              className="px-6 py-3.5 rounded-xl bg-red-alert hover:bg-red-alert/90 text-white font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_18px_rgba(220,38,38,0.25)] flex items-center gap-2 cursor-pointer border-0"
            >
              <Siren className="w-4 h-4 text-white animate-pulse" />
              <span>Emergency Services</span>
            </button>
            <button
              onClick={() => onNavigateToTab("fact")}
              className="px-5 py-3.5 rounded-xl bg-bg-surface border border-border-dim hover:border-teal-glow/50 text-text-primary font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-4 h-4 text-text-secondary" />
              <span>Truth Auditor</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. DIAGNOSTICS THEATER (3D MODEL widescreen panel) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="font-orbitron font-extrabold text-lg md:text-xl uppercase tracking-wider text-text-primary">
              3D Interactive Diagnostic Theater
            </h2>
            <p className="text-xs text-text-dim font-sans mt-0.5">
              Interact with the cybernetic clinical avatar to locate symptoms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left / Torso metadata feedback block */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6 glass-panel rounded-3xl p-6 bg-bg-surface shadow-sm">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-glow/10 border border-teal-glow/20 rounded-full">
                <Cpu className="w-3.5 h-3.5 text-teal-glow" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-teal-glow">Holographic Feedback</span>
              </div>

              <h3 className="font-orbitron text-xl font-bold tracking-tight text-text-primary leading-tight">
                Anatomical Region Classification
              </h3>
              
              <p className="text-xs text-text-secondary leading-relaxed">
                Clicking on different sections of the 3D clinical model will isolate symptom profiles, localized pain matrices, and let you launch specialized triage audits instantly.
              </p>
            </div>

            {/* Dynamic Region details display box */}
            <div className="p-4 bg-bg-void border border-border-dim rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-glow/5 to-transparent rounded-tr-xl pointer-events-none" />
              
              <h4 className="font-orbitron text-[10px] font-bold uppercase text-text-dim tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-glow animate-ping" />
                Sensors Status: Active
              </h4>

              {hoveredRegion ? (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{hoveredRegion.icon}</span>
                    <span className="text-sm font-extrabold text-teal-glow font-orbitron uppercase tracking-wide">{hoveredRegion.label}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">{hoveredRegion.description}</p>
                  
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-teal-glow font-semibold">
                    <span className="inline-block w-1.5 h-1.5 bg-teal-glow rounded-full" />
                    <span>Symptoms Indexed: {hoveredRegion.symptoms.length}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-text-dim text-xs font-mono select-none">
                  [ WAITING_FOR_BODY_TAP ]
                </div>
              )}
            </div>

            {/* Micro stats indicators */}
            <div className="grid grid-cols-2 gap-4 border-t border-border-dim/20 pt-4 font-mono">
              <div>
                <div className="text-xl font-bold text-teal-glow leading-none">98.2%</div>
                <span className="text-[8.5px] text-text-dim uppercase tracking-wider mt-1 block">Triage Match Rate</span>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-electric leading-none">CDSCO</div>
                <span className="text-[8.5px] text-text-dim uppercase tracking-wider mt-1 block">Regulated Library</span>
              </div>
            </div>
          </div>

          {/* Right/Center 3D Canvas Box - Grid Matrix/Scanlines removed for a clean clinical viewport */}
          <div className="lg:col-span-8 glass-panel rounded-3xl p-4 bg-bg-surface relative min-h-[450px] shadow-sm flex items-center justify-center overflow-hidden">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <span className="font-mono text-[9px] text-text-dim tracking-wider uppercase block">RENDER_VIEW: HIGH_FIDELITY_ANATOMY</span>
              <span className="text-[10px] text-text-secondary">Tap body parts for diagnosis</span>
            </div>

            <div className="w-full h-full min-h-[400px] flex items-center justify-center relative">
              <HumanBodyCanvas
                onRegionHover={setHoveredRegion}
                onRegionSelect={(reg) => setSelectedRegionForTriage(reg)}
                selectedRegionId={hoveredRegion?.id || null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. NETFLIX-STYLE CATEGORY ROW: TRENDING DIAGNOSTIC SERVICES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="font-orbitron font-extrabold text-lg md:text-xl uppercase tracking-wider text-text-primary">
              Trending Services
            </h2>
            <p className="text-xs text-text-dim mt-0.5">
              Select one of our secure digital health screening suites
            </p>
          </div>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((svc) => {
            const SvcIcon = svc.icon;
            return (
              <div
                key={svc.id}
                onClick={() => onNavigateToTab(svc.id)}
                style={{
                  borderRadius: 18, overflow: "hidden",
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)", cursor: "pointer",
                  display: "flex", flexDirection: "column", height: 300,
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)";
                  (e.currentTarget as HTMLElement).style.borderColor = svc.accent + "50";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                {/* Image header */}
                <div style={{ width: "100%", height: 140, overflow: "hidden", position: "relative", flexShrink: 0 }}>
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: "linear-gradient(to bottom, transparent 30%, var(--bg-surface) 100%)"
                  }} />
                  <img src={svc.image} alt={svc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{
                    position: "absolute", top: 10, left: 10, zIndex: 2,
                    padding: "3px 9px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                    background: svc.accent, color: "white",
                    fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {svc.tag}
                  </span>
                </div>

                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <SvcIcon style={{ width: 16, height: 16, color: svc.accent, flexShrink: 0 }} />
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
                        color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {svc.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{svc.desc}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: 10, borderTop: "1px solid var(--border)", marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: svc.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>Open</span>
                    <ChevronRight style={{ width: 14, height: 14, color: svc.accent }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. EMERGENCY & QUICK ACTIONS ROW ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text-primary)" }}>
              Emergency & Quick Access
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
              Immediate access to emergency services and hospital finder
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Emergency */}
          <div
            onClick={() => onNavigateToTab("emergency")}
            style={{
              borderRadius: 16, padding: "20px",
              background: "var(--red-muted)", border: "1px solid var(--red-alert)",
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, marginBottom: 14,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Siren style={{ width: 18, height: 18, color: "var(--red-alert)" }} />
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", marginBottom: 6 }}>
              Emergency Center
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Nearby hospitals map, emergency hotlines, and first aid guides.
            </p>
          </div>

          {/* Hospital Finder */}
          <div
            onClick={() => onNavigateToTab("hospitals")}
            style={{
              borderRadius: 16, padding: "20px",
              background: "var(--accent-muted)", border: "1px solid var(--border-accent)",
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, marginBottom: 14,
              background: "var(--accent-muted)", border: "1px solid var(--border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Hospital style={{ width: 18, height: 18, color: "var(--accent)" }} />
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", marginBottom: 6 }}>
              Hospital Finder
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Find cardiology, neurology, maternity & other specialist hospitals near you.
            </p>
          </div>

          {/* 108 Direct Dial */}
          <div style={{
            borderRadius: 16, padding: "20px",
            background: "var(--amber-muted)", border: "1px solid var(--amber-warn)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, marginBottom: 14,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "var(--amber-warn)" }} />
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", marginBottom: 6 }}>
              National Emergency: 108
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
              Free government ambulance, available 24/7 across all Indian states.
            </p>
            <a href="tel:108" className="btn-danger" style={{ fontSize: 13, padding: "9px 18px", borderRadius: 10 }}>
              Call 108 Now
            </a>
          </div>
        </div>
      </div>

      {/* ── 5. REAL-TIME WELLNESS FEED (Live generated vitals ticker) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="font-orbitron font-extrabold text-lg md:text-xl uppercase tracking-wider text-text-primary">
              Live Patient Telemetries
            </h2>
            <p className="text-xs text-text-dim mt-0.5">
              Simulated clinical readings of basic cardiorespiratory signs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quickStats.map((st) => (
            <div key={st.label} className="glass-panel p-5 rounded-2xl bg-bg-surface flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 text-left">
                <span className="font-mono text-[9px] uppercase tracking-widest text-text-dim">{st.label}</span>
                <div className="text-2xl font-orbitron font-extrabold text-text-primary">{st.value}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-ok animate-ping" />
                  <span className="text-[10px] text-green-ok font-mono uppercase font-bold">{st.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-text-dim shrink-0">
                <Heart className={`w-8 h-8 ${st.label.includes("Pulmonary") ? "animate-pulse text-red-alert" : "text-teal-glow opacity-30"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. DISCLAIMER & PATIENT COMPLIANCE HUD ── */}
      <div className="glass-panel p-5 rounded-2xl bg-bg-surface flex items-start gap-4 border-l-4 border-l-amber-warn text-left shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-warn shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1">
          <h4 className="font-orbitron text-xs font-black uppercase text-text-primary tracking-wide">
            {t("clinical_integrity_title")}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {t("clinical_integrity_desc")} {t("safety_advisory_desc")}
          </p>
        </div>
      </div>

      {/* Central Dialog for Region Triage */}
      <AnimatePresence>
        {selectedRegionForTriage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-bg-glass border border-teal-glow/25 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-glow/10 to-transparent rounded-tr-xl pointer-events-none" />
              
              <button
                onClick={() => setSelectedRegionForTriage(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 text-text-secondary transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-4 border-b border-border-dim/30 pb-4 text-left">
                <span className="text-3xl p-2 bg-teal-glow/10 rounded-xl inline-block">{selectedRegionForTriage.icon}</span>
                <div>
                  <h3 className="font-orbitron font-extrabold text-lg text-text-primary uppercase tracking-wide">
                    {selectedRegionForTriage.label}
                  </h3>
                  <p className="text-[10px] font-mono uppercase text-teal-glow/85 tracking-widest">Body Area Selected</p>
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1 font-mono">Area Description / వివరాలు:</p>
                  <p className="text-xs text-text-primary leading-relaxed bg-bg-void/70 p-3 rounded-xl border border-border-dim/30">
                    {selectedRegionForTriage.description}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1.5 font-mono">Indexed Symptom Profile / లక్షణాలు:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedRegionForTriage.symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-teal-glow/5 border border-border-dim hover:border-teal-glow/30 text-text-primary font-medium px-2.5 py-1 rounded-md transition-colors duration-200"
                      >
                        • {symptom}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border-dim/30 text-center text-xs font-sans text-text-secondary italic">
                  Would you like to check symptoms for this body part? / ఈ భాగం యొక్క లక్షణాలను తనిఖీ చేయాలా?
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      onStartTriage(selectedRegionForTriage);
                      setSelectedRegionForTriage(null);
                    }}
                    className="w-full py-3 rounded-xl bg-teal-glow hover:bg-teal-mid text-white font-orbitron font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Check Symptoms
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToTab("voice");
                      setSelectedRegionForTriage(null);
                    }}
                    className="w-full py-3 rounded-xl bg-blue-electric hover:bg-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    <Speech className="w-3.5 h-3.5 animate-pulse" />
                    Speak Symptoms
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onNavigateToTab("fact");
                      setSelectedRegionForTriage(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-transparent border border-green-ok/30 hover:bg-green-ok/5 text-green-ok font-orbitron font-medium text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Verify Health Claims
                  </button>
                  <button
                    onClick={() => setSelectedRegionForTriage(null)}
                    className="px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-void border border-border-dim text-text-primary font-orbitron font-medium text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel / రద్దు చేయి
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
