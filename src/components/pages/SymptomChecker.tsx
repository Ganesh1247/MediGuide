import { useState, useTransition } from "react";
import HumanBodyCanvas, { BODY_REGIONS } from "../3d/HumanBodyCanvas";
import { BodyRegion, SymptomAnalysisResult } from "../../types";
import { ShieldCheck, Loader2, Sparkles, AlertTriangle, ArrowRight, UserCheck, Stethoscope } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface SymptomCheckerProps {
  initialRegion?: BodyRegion | null;
  onNavigateToTab: (tabId: string, extraState?: any) => void;
}

const SEVERITY_LEVELS = [
  { label: "Mild / Trace", icon: "😊", desc: "No core impediment to routines" },
  { label: "Moderate", icon: "😐", desc: "Noticeable discomfort" },
  { label: "Significant", icon: "😟", desc: "Interferes with focus" },
  { label: "Severe", icon: "😣", desc: "Substantial physical distress" },
  { label: "Critical", icon: "😱", desc: "Extreme physical alert / seek triage" }
];

const DURATION_CHIPS = [
  "< 1 hour",
  "A few hours",
  "1–2 days",
  "3–7 days",
  "1–4 weeks",
  "> 1 month"
];

export default function SymptomChecker({ initialRegion, onNavigateToTab }: SymptomCheckerProps) {
  const { activeLanguage } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion>(
    initialRegion || BODY_REGIONS[0]
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [severity, setSeverity] = useState<number>(1); // default Moderate
  const [duration, setDuration] = useState<string>("1–2 days");

  // Loading/Diagnostic simulation states
  const [apiLoading, setApiLoading] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState(0);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Sync region switches
  const handleRegionSelect = (region: BodyRegion) => {
    setSelectedRegion(region);
    setSelectedSymptoms([]);
    setResult(null);
    setErrorText(null);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleRunAnalysis = async () => {
    const list = [...selectedSymptoms];
    if (customSymptom.trim()) {
      list.push(customSymptom.trim());
    }

    if (list.length === 0) {
      setErrorText("Please check at least one symptom or describe your symptoms below.");
      return;
    }

    setErrorText(null);
    setApiLoading(true);
    setDiagnosticStep(0);
    setResult(null);

    // Step-by-step diagnostic simulation phases for highly polished UX
    const interval = setInterval(() => {
      setDiagnosticStep((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          return 3;
        }
        return prev + 1;
      });
    }, 700);

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

      if (!resp.ok) {
        throw new Error("Failure communicating with the triage processor.");
      }

      const parsed: SymptomAnalysisResult = await resp.json();
      
      // Delay presenting results slightly so user sees the progress step tracker complete
      setTimeout(() => {
        setResult(parsed);
        setApiLoading(false);
      }, 2500);

    } catch (e: any) {
      clearInterval(interval);
      console.error(e);
      setErrorText(e.message || "Triage failed. Verify your connection or try again.");
      setApiLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setCustomSymptom("");
    setSeverity(1);
    setDuration("1–2 days");
    setResult(null);
    setErrorText(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-3 relative z-10">
      
      {/* LEFT: 3D Holographic Model (40%) */}
      <div className="lg:col-span-5 glass-panel bg-bg-surface/30 p-5 flex flex-col justify-between relative min-h-[500px]">
        <div className="absolute inset-0 cyber-grid-overlay opacity-30 select-none pointer-events-none rounded-2xl" />
        <div className="absolute inset-x-0 laser-scan-line pointer-events-none select-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedRegion.icon}</span>
            <span className="font-orbitron font-bold text-base text-teal-glow">{selectedRegion.label}</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {selectedRegion.description}
          </p>
        </div>

        {/* Persistent 3D canvas viewport */}
        <div className="w-full flex-1 flex items-center justify-center relative">
          <HumanBodyCanvas
            onRegionHover={() => {}}
            onRegionSelect={handleRegionSelect}
            selectedRegionId={selectedRegion.id}
          />
        </div>

        <div className="p-3.5 bg-bg-surface/60 border border-border-dim rounded-xl space-y-2 relative z-10">
          <h4 className="font-orbitron text-[10px] uppercase font-semibold tracking-wider text-text-secondary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-electric" /> Fast Region Toggle:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {BODY_REGIONS.map((reg) => (
              <button
                key={reg.id}
                onClick={() => handleRegionSelect(reg)}
                className={`py-1 px-2.5 rounded text-[10px] font-mono transition-all duration-300 cursor-pointer ${
                  selectedRegion.id === reg.id
                    ? "bg-teal-glow/10 text-teal-glow border border-teal-glow/30"
                    : "bg-bg-void border border-border-dim hover:border-border-glow/30 text-text-secondary"
                }`}
              >
                {reg.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Chat & Symptom Details Entry Form (60%) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6">
        
        {/* Main form card */}
        {!apiLoading && !result && (
          <div className="glass-panel p-6 space-y-6 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-border-dim/30 pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-teal-glow uppercase tracking-wider">Clinical Analyzer</span>
                <h2 className="font-orbitron text-xl font-extrabold uppercase text-text-primary">Anatomical Questionnaire</h2>
              </div>
              <button 
                onClick={resetForm}
                className="px-3 py-1 text-[10px] font-mono uppercase bg-bg-void hover:bg-bg-void/80 border border-border-dim hover:border-border-glow text-text-secondary rounded transition-colors cursor-pointer"
              >
                Clear Selections
              </button>
            </div>

            {/* Checklist of symptoms corresponding to anatomical segment */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-primary font-orbitron uppercase tracking-widest flex items-center gap-2">
                <span className="text-teal-glow">1.</span> Select symptoms associated with {selectedRegion.label}:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedRegion.symptoms.map((symptom) => {
                  const isActive = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-all duration-300 ${
                        isActive
                          ? "bg-teal-glow/10 border-teal-glow/40 text-text-primary shadow-[0_0_10px_rgba(0,255,208,0.08)]"
                          : "bg-bg-surface/40 border-border-dim text-text-secondary hover:border-border-glow/20"
                      }`}
                    >
                      <span className="text-xs leading-5">{symptom}</span>
                      <span className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-all ${
                        isActive ? "bg-teal-glow border-teal-glow text-bg-void" : "border-border-glow bg-transparent"
                      }`}>
                        {isActive && "✓"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom description textbox */}
            <div className="space-y-2.5">
              <label htmlFor="custom-symptom-input" className="text-xs font-semibold text-text-primary font-orbitron uppercase tracking-widest flex items-center gap-2">
                <span className="text-teal-glow">2.</span> Describe any additional contextual symptoms/feelings:
              </label>
              <textarea
                id="custom-symptom-input"
                name="customSymptom"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="E.g., dull continuous ache behind breastbone, worse when inhaling, shooting cold triggers..."
                rows={3}
                className="w-full bg-bg-surface/50 border border-border-dim hover:border-border-glow/30 focus:border-teal-glow/50 focus:outline-none rounded-xl p-3 text-xs placeholder:text-text-dim/65 text-text-primary transition-colors resize-none font-sans"
              />
            </div>

            {/* Severity Emoji Selector */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-text-primary font-orbitron uppercase tracking-widest flex items-center gap-2">
                <span className="text-teal-glow">3.</span> Specify Symptoms Severity:
              </span>
              
              <div className="grid grid-cols-5 gap-2">
                {SEVERITY_LEVELS.map((lvl, index) => {
                  const isActive = severity === index;
                  return (
                    <button
                      key={lvl.label}
                      onClick={() => setSeverity(index)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        isActive
                          ? "bg-amber-warn/10 border-amber-warn/40 text-text-primary shadow-[0_0_10px_rgba(255,194,68,0.1)]"
                          : "bg-bg-surface/40 border-border-dim text-text-dim hover:text-text-secondary"
                      }`}
                      title={lvl.desc}
                    >
                      <span className="text-xl md:text-2xl mb-1">{lvl.icon}</span>
                      <span className="text-[9px] font-mono leading-none font-semibold mt-1 truncate max-w-full uppercase">{lvl.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-secondary/70 italic text-center">
                Active Category: <b className="text-amber-warn uppercase font-mono">{SEVERITY_LEVELS[severity].label}</b> — {SEVERITY_LEVELS[severity].desc}
              </p>
            </div>

            {/* Duration picker chips */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-text-primary font-orbitron uppercase tracking-widest flex items-center gap-2">
                <span className="text-teal-glow">4.</span> Ephemeral Duration Period:
              </span>
              
              <div className="flex flex-wrap gap-2">
                {DURATION_CHIPS.map((chip) => {
                  const isActive = duration === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => setDuration(chip)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-sans transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-blue-electric/25 text-text-primary border border-blue-electric/50 shadow-[0_0_10px_rgba(0,153,255,0.12)]"
                          : "bg-bg-surface/40 border border-border-dim text-text-secondary hover:border-border-glow/20"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submissions & Error messages */}
            {errorText && (
              <div className="p-3.5 bg-red-alert/15 border border-red-alert/30 rounded-xl flex items-center gap-2.5 text-xs text-red-alert font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <button
              onClick={handleRunAnalysis}
              className="w-full p-4 rounded-xl btn-primary flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-orbitron transition-all duration-300 shadow-[0_0_15px_rgba(0,255,208,0.25)] hover:shadow-[0_0_30px_rgba(0,255,208,0.5)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-bg-void" />
              <span>Synthesize AI Clinical Assessment</span>
            </button>

          </div>
        )}

        {/* LOADING STATE - CLEAN AND CLINICAL */}
        {apiLoading && (
          <div className="glass-panel p-8 space-y-5 flex flex-col items-center justify-center text-center py-16">
            
            {/* Elegant Loading ring */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#7c3aed] animate-spin" />
              <Loader2 className="w-5 h-5 text-[#7c3aed] animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="font-orbitron font-extrabold text-base text-text-primary">
                Consulting Clinical Database
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm">
                MediGuide AI is analyzing your symptoms against official guidelines...
              </p>
            </div>

            {/* Simple clean progress bar */}
            <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-[#7c3aed] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (diagnosticStep + 1) * 25)}%` }}
              />
            </div>
          </div>
        )}

        {/* RENDER DIAGNOSTI OUTCOMES (RESULTS SECTION) */}
        {!apiLoading && result && (
          <div className="glass-panel p-6 space-y-6 animate-fadeIn">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-dim/30 pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-teal-glow">Triage Outcome Synthesized</span>
                <h2 className="font-orbitron text-xl font-black uppercase text-text-primary flex items-center gap-1.5">
                  🛡️ Health Assessment Records
                </h2>
              </div>
              <button 
                onClick={resetForm}
                className="px-4 py-1.5 rounded bg-bg-void hover:bg-bg-void/80 text-[10px] font-mono uppercase text-teal-glow border border-border-glow transition-colors cursor-pointer"
              >
                New Checkup
              </button>
            </div>

            {/* CRITICAL EMERGENCY ALIGN OVERRIDE WARNING BANNER */}
            {result.emergency && (
              <div className="alert-critical-glow bg-red-alert/15 border border-red-alert rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🚨</span>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-orbitron font-extrabold text-[#ff3d3d] uppercase tracking-wider text-sm leading-tight">
                      POSSIBLE CRITICAL EMERGENCY DETECTED
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {result.emergencyReason}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="tel:108"
                    className="px-4 py-2 bg-red-alert hover:bg-red-alert/90 text-[11px] font-orbitron font-extrabold text-white rounded uppercase tracking-wider transition-colors inline-block text-center"
                  >
                    Call Emergency Services (108)
                  </a>
                  <button
                    onClick={() => onNavigateToTab("emergency")}
                    className="px-4 py-2 bg-transparent border border-red-alert text-red-alert hover:bg-red-alert/10 text-[11px] font-orbitron font-extrabold rounded uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Locate Emergency Hospitals
                  </button>
                  <button
                    onClick={() => onNavigateToTab("doctors", { specialty: result.recommendedSpecialties[0] })}
                    className="px-3.5 py-2 bg-transparent border border-border-dim text-text-secondary hover:text-text-primary hover:bg-bg-surface text-[11px] font-orbitron font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Book Specialist
                  </button>
                </div>
              </div>
            )}

            {/* Conditions probability spectrum charts layout */}
            <div className="space-y-4">
              <h3 className="font-orbitron text-xs font-semibold uppercase text-text-secondary tracking-wider">
                Matched Potential Conditions Matrix:
              </h3>

              <div className="space-y-3.5">
                {result.conditions.map((item) => (
                  <div key={item.name} className="p-3 bg-bg-surface/50 border border-border-dim rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold font-orbitron text-text-primary leading-tight">{item.name}</span>
                      <span className="text-xs font-mono font-bold text-teal-glow">{item.probability}% match</span>
                    </div>

                    {/* Progress Probability bar gauge */}
                    <div className="h-2 w-full bg-bg-void rounded-full overflow-hidden relative border border-border-dim/20">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${item.probability}%`,
                          backgroundColor: item.urgency === "Critical" || item.urgency === "High" ? "#ff3d3d" : item.urgency === "Moderate" ? "#ffc244" : "#0099ff"
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-secondary font-sans leading-relaxed">{item.explanation}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold shrink-0 text-[10px] uppercase ml-3 ${
                        item.urgency === "Critical" || item.urgency === "High"
                          ? "bg-red-alert/15 text-red-alert"
                          : item.urgency === "Moderate"
                          ? "bg-amber-warn/15 text-amber-warn"
                          : "bg-blue-electric/15 text-blue-electric"
                      }`}>
                        Urgency: {item.urgency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live non-prescriptive first-care tips lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 bg-bg-surface border border-border-dim/80 rounded-xl space-y-3">
                <h4 className="font-orbitron text-[11px] font-bold uppercase text-teal-glow tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-glow" /> Safe Self-Care First Guidelines
                </h4>
                <ul className="space-y-2 text-xs text-text-secondary">
                  {result.dynamicTips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-teal-glow shrink-0">✦</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-bg-surface border border-border-dim/80 rounded-xl space-y-3">
                <h4 className="font-orbitron text-[11px] font-bold uppercase text-blue-electric tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-electric" /> Suggested Medical Consultant
                </h4>
                <div className="space-y-2 text-xs text-text-secondary">
                  <p className="leading-tight">Verify symptoms with these certified specialist channels:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedSpecialties.map((spec) => (
                      <span key={spec} className="px-3 py-1 bg-blue-electric/10 text-blue-electric font-mono rounded text-[10px] uppercase font-semibold">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 text-[11px]">
                    <button
                      onClick={() => onNavigateToTab("doctors", { specialty: result.recommendedSpecialties[0] })}
                      className="inline-flex items-center gap-1 text-teal-glow hover:underline text-xs font-mono cursor-pointer"
                    >
                      <span>Locate nearby doctors now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Authoritative Disclaimer constraint validation */}
            <div className="p-3.5 bg-bg-void border border-border-dim/40 rounded-xl text-[10px] text-text-dim text-center space-y-1">
              <p className="font-bold text-text-secondary">⚕️ ADVISORY CLINICAL RECORD DISCLAIMER</p>
              <p>
                MediGuide diagnoses are generated using clinical AI parsing of typical symptomatological profiles. These reviews are for assessment advisory indices only — NOT official medical instructions or formal diagnoses. Always consult a certified physician.
              </p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
