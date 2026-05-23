import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import HumanBodyCanvas from "../3d/HumanBodyCanvas";
import { BodyRegion } from "../../types";
import { ShieldAlert, Cpu, Pill, Speech, HelpCircle, Siren, AlertTriangle, X, Activity, Eye } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface HomeProps {
  onStartTriage: (region?: BodyRegion) => void;
  onNavigateToTab: (tabId: string) => void;
}

export default function Home({ onStartTriage, onNavigateToTab }: HomeProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [selectedRegionForTriage, setSelectedRegionForTriage] = useState<BodyRegion | null>(null);
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-4 relative z-10">
      
      {/* LEFT AREA: Editorial Clinical Statement (4 cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between space-y-8 glass-panel rounded-2xl p-6 shadow-sm">
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-glow/10 border border-teal-glow/20 rounded-full">
            <Cpu className="w-3.5 h-3.5 text-teal-glow" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-teal-glow">Interactive Body Assistant</span>
          </div>

          <h1 className="font-orbitron text-4xl font-extrabold tracking-tight leading-[1.1] text-text-primary">
            {t("home_title").split(" ")[0]}<br />
            <span className="text-teal-glow">{t("home_title").split(" ").slice(1).join(" ")}</span>
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed font-sans">
            {t("home_desc")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="btn-trigger-analyzer"
              onClick={() => onStartTriage()}
              className="px-5 py-2.5 rounded-lg bg-teal-glow hover:bg-teal-glow/90 text-[#f8fafc] font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(8,145,178,0.2)] hover:shadow-[0_4px_20px_rgba(8,145,178,0.35)] cursor-pointer"
            >
              {t("home_start_quick_triage")}
            </button>
            <button
              onClick={() => onNavigateToTab("fact")}
              className="px-4 py-2.5 rounded-lg bg-transparent border border-teal-glow/30 hover:bg-teal-glow/5 text-text-primary font-orbitron font-medium text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer"
            >
              Check Health Myths
            </button>
          </div>
        </div>

        {/* Dynamic Holographic Mesh Indicator Panel */}
        <div className="p-4 bg-white/40 border border-border-dim rounded-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-glow/5 to-transparent rounded-tr-xl pointer-events-none" />
          <h3 className="font-orbitron text-xs font-semibold uppercase text-text-secondary tracking-widest flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-glow animate-ping" />
            Scanner Feedback:
          </h3>

          {hoveredRegion ? (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-xl">{hoveredRegion.icon}</span>
                <span className="text-sm font-semibold text-teal-glow font-orbitron">{hoveredRegion.label}</span>
              </div>
              <p className="text-xs text-text-secondary line-clamp-2">{hoveredRegion.description}</p>
              <div className="flex items-center gap-1 pt-1.5 text-[10px] font-mono text-teal-glow/90">
                <span className="inline-block w-1.5 h-1.5 bg-teal-glow rounded-full" />
                <span>Active Symptoms: {hoveredRegion.symptoms.length} indexed</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-text-dim text-xs font-mono">
              [ {t("home_no_region").toUpperCase()} ]
            </div>
          )}
        </div>

        {/* Real-time stats ticker */}
        <div className="grid grid-cols-2 gap-4 border-t border-border-dim/20 pt-4 font-mono">
          <div>
            <div className="text-2xl font-bold text-teal-glow">98.2%</div>
            <div className="text-[10px] text-text-secondary uppercase">Assessment Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-electric">Official</div>
            <div className="text-[10px] text-text-secondary uppercase">Medicine DB</div>
          </div>
        </div>

      </div>

      {/* CENTER AREA: Full Floating 3D Human Body Model (4 cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between items-center glass-panel rounded-2xl p-4 relative min-h-[450px] shadow-sm">
        {/* Animated matrix background grid overlay */}
        <div className="absolute inset-0 cyber-grid-overlay opacity-30 select-none pointer-events-none rounded-2xl" />
        
        {/* Floating Scanner beam overlay decoration */}
        <div className="absolute inset-x-0 laser-scan-line pointer-events-none select-none z-10" />

        <div className="w-full text-center relative z-20">
          <p className="font-mono text-[9px] text-teal-glow tracking-widest uppercase mb-1">Interactive Body Helper</p>
          <p className="text-xs text-text-secondary font-sans">[ Tap any body part to check symptoms ]</p>
        </div>

        <div className="w-full h-full min-h-[400px] flex items-center justify-center relative">
          <HumanBodyCanvas
            onRegionHover={setHoveredRegion}
            onRegionSelect={(reg) => setSelectedRegionForTriage(reg)}
            selectedRegionId={hoveredRegion?.id || null}
          />
        </div>

      </div>

      {/* RIGHT AREA: Core Safety Guard & Clinical Navigator (4 cols) */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        {/* Panel 1: Essential Medical Disclaimer & Patient Safety Panel */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-warn animate-pulse" />
            <h2 className="font-orbitron font-semibold text-sm uppercase tracking-wide text-text-primary">{t("clinical_integrity_title")}</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {t("clinical_integrity_desc")}
          </p>
          <div className="p-3 bg-amber-warn/5 border border-amber-warn/15 rounded-xl space-y-2">
            <p className="text-[10px] font-semibold text-amber-warn uppercase tracking-wider font-mono">{t("safety_advisory_title")}</p>
            <p className="text-[10px] text-text-secondary leading-normal">
              {t("safety_advisory_desc")}
            </p>
          </div>
        </div>

        {/* Panel 2: Clinical Interactive Action Hub */}
        <div className="glass-panel p-5 space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-teal-glow" />
              <h2 className="font-orbitron font-semibold text-sm uppercase tracking-wide text-text-primary">{t("action_station_title")}</h2>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {/* Emergency Dispatch Shortcut */}
              <div 
                onClick={() => onNavigateToTab("emergency")}
                className="p-3 bg-red-alert/5 border border-red-alert/20 hover:border-red-alert/40 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="text-base text-red-alert group-hover:scale-110 transition-transform w-5 text-center">🚨</div>
                <div className="space-y-0.5">
                  <p className="font-bold text-red-alert uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    {t("action_station_dispatch_title")} <span className="text-[9px] font-mono font-medium text-red-alert/70 group-hover:translate-x-0.5 transition-transform">→</span>
                  </p>
                  <p className="text-text-secondary text-[10px] leading-snug">
                    {t("action_station_dispatch_desc")}
                  </p>
                </div>
              </div>

              {/* Rx Medicine Scanner Shortcut */}
              <div 
                onClick={() => onNavigateToTab("medicine")}
                className="p-3 bg-bg-surface border border-border-dim hover:border-teal-glow/30 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="text-base text-teal-glow group-hover:rotate-12 transition-transform w-5 text-center">💊</div>
                <div className="space-y-0.5">
                  <p className="font-bold text-text-primary uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    {t("action_station_medicine_title")} <span className="text-[9px] font-mono text-teal-glow group-hover:translate-x-0.5 transition-transform">→</span>
                  </p>
                  <p className="text-text-secondary text-[10px] leading-snug">
                    {t("action_station_medicine_desc")}
                  </p>
                </div>
              </div>

              {/* Vocal Synthesizer Shortcut */}
              <div 
                onClick={() => onNavigateToTab("voice")}
                className="p-3 bg-bg-surface border border-border-dim hover:border-blue-electric/30 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="text-base text-blue-electric group-hover:scale-110 transition-transform w-5 text-center">🎙️</div>
                <div className="space-y-0.5">
                  <p className="font-bold text-text-primary uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    {t("action_station_voice_title")} <span className="text-[9px] font-mono text-blue-electric group-hover:translate-x-0.5 transition-transform">→</span>
                  </p>
                  <p className="text-text-secondary text-[10px] leading-snug">
                    {t("action_station_voice_desc")}
                  </p>
                </div>
              </div>

              {/* Consensus Auditor Shortcut */}
              <div 
                onClick={() => onNavigateToTab("fact")}
                className="p-3 bg-bg-surface border border-border-dim hover:border-green-ok/30 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="text-base text-green-ok group-hover:scale-110 transition-transform w-5 text-center">🔍</div>
                <div className="space-y-0.5">
                  <p className="font-bold text-text-primary uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    {t("action_station_claim_title")} <span className="text-[9px] font-mono text-green-ok group-hover:translate-x-0.5 transition-transform">→</span>
                  </p>
                  <p className="text-text-secondary text-[10px] leading-snug">
                    {t("action_station_claim_desc")}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-border-dim/20 text-center font-mono text-[9px] text-text-dim">
            {t("compliance_footer")}
          </div>

        </div>

      </div>

      {/* Central Interactive Dialogue asking user about selected somatic nodes */}
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
              className="w-full max-w-lg bg-white/95 backdrop-blur-lg border border-teal-glow/25 rounded-2xl p-6 shadow-[0_20px_50px_rgba(8,145,178,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-glow/10 to-transparent rounded-tr-xl pointer-events-none" />
              
              <button
                onClick={() => setSelectedRegionForTriage(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 text-text-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-4 border-b border-border-dim/30 pb-4">
                <span className="text-3xl p-2 bg-teal-glow/10 rounded-xl inline-block">{selectedRegionForTriage.icon}</span>
                <div>
                  <h3 className="font-orbitron font-extrabold text-lg text-text-primary uppercase tracking-wide">
                    {selectedRegionForTriage.label}
                  </h3>
                  <p className="text-[10px] font-mono uppercase text-teal-glow/85 tracking-widest">Body Area Selected</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 font-mono">Area Description / వివరాలు:</p>
                  <p className="text-xs text-text-primary leading-relaxed bg-black/5 p-3 rounded-xl border border-border-dim/10">
                    {selectedRegionForTriage.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 font-mono">Indexed Symptom Profile / లక్షణాలు:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedRegionForTriage.symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-teal-glow/5 border border-teal-glow/10 hover:border-teal-glow/30 text-text-primary font-medium px-2.5 py-1 rounded-md shadow-sm transition-colors duration-200"
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
                    className="w-full py-3 rounded-xl bg-teal-glow hover:bg-teal-glow/90 text-white font-orbitron font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Check Symptoms
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToTab("voice");
                      setSelectedRegionForTriage(null);
                    }}
                    className="w-full py-3 rounded-xl bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-orbitron font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
                    className="flex-1 py-2 rounded-lg bg-transparent border border-green-600/30 hover:bg-green-600/5 text-green-700 font-orbitron font-medium text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Verify Health Claims
                  </button>
                  <button
                    onClick={() => setSelectedRegionForTriage(null)}
                    className="px-4 py-2 rounded-lg bg-black/5 hover:bg-black/10 text-text-primary font-orbitron font-medium text-[10px] uppercase tracking-wider transition-all cursor-pointer"
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
