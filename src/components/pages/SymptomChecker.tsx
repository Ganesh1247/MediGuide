import { useState } from "react";
import HumanBodyCanvas, { BODY_REGIONS } from "../3d/HumanBodyCanvas";
import { BodyRegion, SymptomAnalysisResult } from "../../types";
import { ShieldCheck, Loader2, Sparkles, AlertTriangle, ArrowRight, UserCheck, Stethoscope, RefreshCw, X, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface SymptomCheckerProps {
  initialRegion?: BodyRegion | null;
  onNavigateToTab: (tabId: string, extraState?: any) => void;
}

const SEVERITY_LEVELS = (t: any) => [
  { label: t("severity_trace"), icon: "😊", desc: "No core impediment" },
  { label: t("severity_moderate"), icon: "😐", desc: "Noticeable discomfort" },
  { label: t("severity_significant"), icon: "😟", desc: "Interferes with focus" },
  { label: t("severity_severe"), icon: "😣", desc: "Physical distress" },
  { label: t("severity_critical"), icon: "😱", desc: "Seek triage" }
];

const DURATION_CHIPS = (t: any) => [
  t("duration_1h"),
  t("duration_hours"),
  t("duration_12d"),
  t("duration_37d"),
  t("duration_1m")
];

export default function SymptomChecker({ initialRegion, onNavigateToTab }: SymptomCheckerProps) {
  const { activeLanguage, t } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion>(initialRegion || BODY_REGIONS[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [severity, setSeverity] = useState<number>(1);
  const [duration, setDuration] = useState<string>(t("duration_12d"));
  const [apiLoading, setApiLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const severityLevels = SEVERITY_LEVELS(t);
  const durationChips = DURATION_CHIPS(t);

  const toggleSymptom = (s: string) => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleRunAnalysis = async () => {
    if (selectedSymptoms.length === 0 && !customSymptom.trim()) {
      setErrorText(t("Please provide symptom data."));
      return;
    }
    setApiLoading(true);
    setResult(null);
    try {
      const resp = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: selectedRegion.label,
          symptoms: selectedSymptoms,
          severity,
          duration,
          customSymptom,
          language: activeLanguage.englishName
        })
      });
      const data = await resp.json();
      setResult(data);
    } catch {
      setErrorText(t("Diagnostic synthesis failed."));
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 animate-slideUp pb-12">
      
      {/* ── Header ── */}
      <section className="text-center space-y-4 px-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/25 text-accent rounded-full">
          <Stethoscope className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("nav_triage_check")} Matrix</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-text-primary uppercase tracking-tight">{t("nav_triage_check").split(' ')[0]} <span className="text-accent">Audit</span></h1>
        <p className="text-base sm:text-lg text-text-secondary font-medium max-w-2xl mx-auto">
          {t("select_region_desc")}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
        
        {/* ── Left: 3D Viewport ── */}
        <div className="lg:col-span-5 space-y-8">
          <div className="card !p-0 overflow-hidden bg-bg-surface/95 border border-border shadow-2xl relative min-h-[500px] sm:min-h-[550px] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-bg-elevated/45 relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedRegion.icon}</span>
                <h3 className="text-lg sm:text-xl font-black text-text-primary uppercase tracking-tighter">{selectedRegion.label}</h3>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
              <HumanBodyCanvas
                onRegionHover={() => {}}
                onRegionSelect={setSelectedRegion}
                selectedRegionId={selectedRegion.id}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)] pointer-events-none" />
            </div>

            <div className="p-4 sm:p-8 bg-bg-elevated/40 border-t border-border relative z-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {BODY_REGIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRegion(r)}
                    className={`px-3 sm:px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border cursor-pointer ${
                      selectedRegion.id === r.id ? "bg-accent border-accent text-black shadow-xl shadow-accent/20" : "bg-bg-void/60 border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    {r.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Intake Form ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card !p-5 sm:!p-8 lg:!p-10 space-y-8 sm:space-y-10 bg-bg-elevated/35 border border-border shadow-2xl min-h-[560px] sm:min-h-[600px] flex flex-col">
            <AnimatePresence mode="wait">
              {apiLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-8">
                  <div className="w-20 h-20 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-accent animate-pulse">{t("home_inspecting")} Neural Pathways...</p>
                </motion.div>
              ) : result ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6 sm:pb-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary uppercase tracking-tighter">Assessment <span className="text-accent">Output</span></h2>
                    <button onClick={() => setResult(null)} className="btn-secondary !py-3 !px-6 !text-[10px] uppercase tracking-widest border-none cursor-pointer">New Checkup</button>
                  </div>

                  {result.emergency && (
                    <div className="p-5 sm:p-8 bg-red-alert/10 border border-red-alert/40 rounded-[24px] sm:rounded-[32px] space-y-6 animate-glow">
                      <div className="flex items-center gap-5">
                        <AlertTriangle className="w-10 h-10 text-red-alert animate-bounce" />
                        <h3 className="text-2xl font-black text-red-alert uppercase">{t("safety_advisory_title")}</h3>
                      </div>
                      <p className="text-base sm:text-lg text-text-secondary font-medium leading-relaxed">{result.emergencyReason}</p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <a href="tel:108" className="btn-danger !py-5 flex-1 justify-center border-none cursor-pointer">CALL 108 NOW</a>
                        <button onClick={() => onNavigateToTab("emergency")} className="btn-secondary !py-5 flex-1 justify-center !text-red-alert !border-red-alert/40 hover:!bg-red-alert hover:!text-white border-none cursor-pointer">FIND HOSPITAL</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <p className="text-xs font-black uppercase tracking-widest text-text-dim">Potential Conditions Correlation</p>
                    <div className="space-y-4">
                      {result.conditions.map(c => (
                        <div key={c.name} className="p-5 sm:p-6 bg-bg-void/50 border border-border rounded-2xl sm:rounded-3xl space-y-4 hover:border-accent/40 transition-all">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg sm:text-xl font-black text-text-primary uppercase">{c.name}</h4>
                            <span className="text-xl font-mono font-black text-accent">{c.probability}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-bg-surface rounded-full overflow-hidden border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${c.probability}%` }} className="h-full bg-accent shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                          </div>
                          <p className="text-sm text-text-secondary font-medium leading-relaxed">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                  <div className="space-y-6">
                    <p className="text-xs font-black uppercase tracking-widest text-text-dim flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-accent" /> 1. {t("home_active_symptoms")}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedRegion.symptoms.map(s => (
                        <button
                          key={s}
                          onClick={() => toggleSymptom(s)}
                          className={`p-4 sm:p-5 rounded-[18px] sm:rounded-[22px] border text-left flex items-center justify-between group transition-all cursor-pointer ${
                            selectedSymptoms.includes(s) ? "bg-accent border-accent text-black font-black" : "bg-bg-void/50 border-border text-text-secondary hover:border-accent/30 hover:bg-bg-void/70"
                          }`}
                        >
                          <span className="text-sm">{s}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${selectedSymptoms.includes(s) ? "rotate-90" : "group-hover:translate-x-1"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-text-primary flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-accent" /> 2. Intensity Calibration
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {severityLevels.map((l, i) => (
                        <button
                          key={l.label}
                          onClick={() => setSeverity(i)}
                          className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                            severity === i ? "bg-accent border-accent text-black font-black shadow-lg shadow-accent/20" : "bg-bg-void/50 border-border text-text-primary hover:border-accent/40"
                          }`}
                        >
                          <span className="text-3xl">{l.icon}</span>
                          <span className="text-[10px] uppercase font-black">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-text-primary flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-accent" /> 3. Duration
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {durationChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setDuration(chip)}
                          className={`w-full px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border cursor-pointer ${
                            duration === chip ? "bg-accent border-accent text-black shadow-lg shadow-accent/20" : "bg-bg-void/60 border-border text-text-primary hover:border-accent/40"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-accent" /> 4. Contextual Notes
                    </p>
                    <textarea
                      value={customSymptom}
                      onChange={e => setCustomSymptom(e.target.value)}
                      placeholder={t("home_desc")}
                      className="input !h-28 sm:!h-32 !p-4 sm:!p-6 !text-sm sm:!text-base !text-text-primary placeholder:!text-text-dim resize-none"
                    />
                  </div>

                  <button
                    onClick={handleRunAnalysis}
                    className="w-full btn-primary !py-5 sm:!py-7 !text-base sm:!text-lg justify-center shadow-2xl shadow-accent/20 group overflow-hidden relative border-none cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                    <Sparkles className="w-6 h-6" />
                    <span>{t("initialize_checkup")}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
