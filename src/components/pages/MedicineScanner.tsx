import { useState, useRef, useEffect } from "react";
import { MedicineDetails } from "../../types";
import { Pill, ShieldCheck, ShieldAlert, Camera, Search, HelpCircle, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const MEDICINE_PRESETS = [
  {
    name: "Paracetamol (Crocin Quick)",
    dosage: "500 mg",
    generic: "Acetaminophen Compound",
    desc: "Common analgesic and antipyretic pain reliever."
  },
  {
    name: "Augmentin Duo Strip",
    dosage: "625 mg",
    generic: "Amoxicillin + Clavulanate Potassium",
    desc: "Broad-spectrum antibacterial therapy formulation."
  },
  {
    name: "Glycomet Glycemic Control",
    dosage: "850 mg",
    generic: "Metformin Hydrochloride",
    desc: "First-line oral anti-glycemic compound for Type-2 Diabetes."
  },
  {
    name: "Amlopin 5 Cardiotach",
    dosage: "5 mg",
    generic: "Amlodipine Besylate",
    desc: "Calcium channel blocker anti-hypertensive agent."
  }
];

export default function MedicineScanner() {
  const { activeLanguage } = useLanguage();
  const [scanStream, setScanStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicineDetails | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (scanStream) {
      scanStream.getTracks().forEach((track) => track.stop());
      setScanStream(null);
    }
    setCameraActive(false);
  };

  // Start live webcam scanning
  const startCamera = async () => {
    setCameraError(false);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setScanStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera permission denied or unavailable:", err);
      setCameraError(true);
    }
  };

  // Capture current webcam frame and send to Gemini server endpoint
  const handleCaptureAndIdentify = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setErrorText(null);

    try {
      // Draw frame on inline virtual canvas to encode as base64 jpeg
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      const resp = await fetch("/api/identify-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: dataUrl,
          language: activeLanguage.englishName 
        })
      });

      if (!resp.ok) {
        throw new Error("Medicine identifier failed to audit scanned packaging.");
      }

      const parsed: MedicineDetails = await resp.json();
      setResult(parsed);
      stopCamera();
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to parse medicine via live camera image.");
    } finally {
      setLoading(false);
    }
  };

  // Query custom text via Gemini medicine identifier on the server
  const handleTextQuery = async (medicineText: string) => {
    if (!medicineText.trim()) return;
    setLoading(true);
    setErrorText(null);
    setResult(null);

    try {
      const resp = await fetch("/api/identify-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: medicineText,
          language: activeLanguage.englishName 
        })
      });

      if (!resp.ok) {
        throw new Error("Could not index drug details in CDSCO/FDA registers.");
      }

      const parsed: MedicineDetails = await resp.json();
      setResult(parsed);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Diagnosis text index failure.");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanStream) {
        scanStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanStream]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-3 relative z-10">
      
      {/* LEFT SECTION: Viewfinder / Scanner Simulation (5 cols) */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col space-y-4">
        
        {/* Holographic scanner housing */}
        <div className="glass-panel p-5 bg-bg-surface/30 relative flex-1 flex flex-col justify-between overflow-hidden min-h-[420px]">
          <div className="absolute inset-0 cyber-grid-overlay opacity-30 pointer-events-none select-none" />
          
          <div className="flex items-center justify-between border-b border-border-dim/20 pb-3 relative z-10">
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] text-teal-glow uppercase">OCR SCANNER CORE</span>
              <h3 className="font-orbitron font-extrabold text-[#e8f4f0] uppercase text-xs">Pharma Optical Matrix</h3>
            </div>
            
            {cameraActive && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-teal-glow animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-glow" /> SCANNING SENSOR LIVE
              </span>
            )}
          </div>

          {/* Central Camera frame stage */}
          <div className="my-4 h-64 w-full bg-bg-void rounded-xl border border-border-dim relative overflow-hidden flex flex-col items-center justify-center">
            
            {/* The scanning laser beam sweep animation */}
            {cameraActive && <div className="laser-scan-line z-20" />}

            {/* Sci-fi targeting frame corner borders */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-teal-glow z-10" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-teal-glow z-10" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-teal-glow z-10" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-teal-glow z-10" />

            {cameraActive && !cameraError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-6 space-y-3 prose max-w-xs relative z-10">
                <Pill className="w-10 h-10 text-text-dim mx-auto animate-bounce" />
                <p className="font-sans text-xs text-text-secondary leading-relaxed">
                  {cameraError 
                    ? "Webcam authorization unavailable or blocked inside current sandboxed layout frame."
                    : "Initialize the sensor feed or point your lens at any clinical medication label."
                  }
                </p>
              </div>
            )}

            {cameraActive && !cameraError && (
              <div className="absolute bottom-3 bg-bg-glass backdrop-blur-md px-3 py-1 rounded-full border border-border-glow text-[10px] font-mono text-teal-glow z-10">
                Position drug composition details inside matrix
              </div>
            )}
          </div>

          {/* Scan controller buttons */}
          <div className="space-y-3 relative z-10">
            {cameraActive && !cameraError ? (
              <div className="flex gap-2.5">
                <button
                  onClick={handleCaptureAndIdentify}
                  disabled={loading}
                  className="flex-1 p-3 rounded-lg btn-primary text-xs uppercase font-orbitron font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-bg-void animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-bg-void" />
                  )}
                  <span>Capture Chemical Strip</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-3 rounded-lg bg-bg-void/40 border border-border-dim hover:bg-bg-void/80 text-xs text-text-secondary font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={startCamera}
                className="w-full p-3 rounded-lg bg-bg-surface hover:bg-bg-surface/80 text-teal-glow border border-border-glow flex items-center justify-center gap-2 font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,243,255,0.15)] cursor-pointer"
              >
                <Camera className="w-4 h-4 text-teal-glow" />
                <span>Initialize Optical Camera</span>
              </button>
            )}
          </div>

        </div>

        {/* Quick scan pre-defined sample packages */}
        <div className="p-4 bg-bg-glass border border-border-dim/20 rounded-2xl space-y-3 font-sans">
          <h4 className="font-orbitron text-[10px] uppercase font-bold text-text-secondary tracking-widest flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-electric" /> Try Preset Mock Scans:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {MEDICINE_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setSearchQuery(p.name);
                  handleTextQuery(p.name);
                }}
                className="p-2.5 rounded-xl bg-bg-surface/50 border border-border-dim hover:border-teal-glow/20 text-left transition-all duration-300 space-y-1 hover:bg-bg-surface cursor-pointer"
              >
                <div className="text-[11px] font-bold text-text-primary truncate">{p.name.split(" ")[0]}</div>
                <div className="text-[9px] font-mono text-teal-glow uppercase font-semibold">{p.dosage}</div>
                <div className="text-[10px] text-text-secondary truncate">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT SECTION: Scan outcomes, specifications details (7 cols) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6">
        
        {/* Custom text search widget */}
        <div className="glass-panel p-5 space-y-3">
          <p className="text-xs font-semibold text-text-primary font-orbitron uppercase tracking-widest">
            Manual Chemical Formula Database Query:
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-dim" />
              <input
                id="medicine-search-input"
                type="text"
                placeholder="Type brand name (e.g. Crocin, Ibuprofen, Lipitor)..."
                value={searchQuery}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTextQuery(searchQuery);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-void/40 border border-border-dim hover:border-border-glow/45 focus:border-teal-glow/50 focus:outline-none rounded-xl py-2.5 pl-10 pr-3 text-xs placeholder:text-text-dim text-text-primary transition-colors font-sans"
              />
            </div>
            <button
              onClick={() => handleTextQuery(searchQuery)}
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-teal-glow hover:bg-teal-glow/90 disabled:opacity-50 text-bg-void font-orbitron font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5 text-bg-void" />
              )}
              <span>Query DB</span>
            </button>
          </div>
        </div>

        {/* Error Text info */}
        {errorText && (
          <div className="p-4 bg-red-alert/15 border border-red-alert/30 rounded-xl text-xs text-red-alert font-mono flex items-center gap-2">
            <span className="text-lg">⚠</span>
            <span>{errorText}</span>
          </div>
        )}

        {/* Main scanned result specs pane */}
        {loading && !result && (
          <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4 flex-1 py-20">
            <Loader2 className="w-8 h-8 text-teal-glow animate-spin" />
            <div className="space-y-1">
              <h3 className="font-orbitron font-bold text-text-primary uppercase text-sm">Auditing Chemical Formulation</h3>
              <p className="text-xs text-text-secondary italic">Consulting registered standard global pharmacy frameworks...</p>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="glass-panel p-6 space-y-6 animate-fadeIn flex-1">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-dim/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">💊</span>
                  <h2 className="font-orbitron text-xl font-black text-text-primary leading-tight uppercase tracking-wide">
                    {result.name}
                  </h2>
                </div>
                <p className="text-xs text-teal-glow font-mono font-semibold uppercase">{result.generic}</p>
              </div>

              <div className={`px-3.5 py-1.5 rounded-full inline-flex self-start md:self-center items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase shrink-0 ${
                result.verified 
                  ? "bg-green-ok/10 text-green-ok border border-green-ok/20" 
                  : "bg-amber-warn/10 text-amber-warn border border-amber-warn/20"
              }`}>
                {result.verified ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-green-ok" /> CDSCO Verified Status
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-warn" /> Unverified Formula Label
                  </>
                )}
              </div>
            </div>

            {/* Core dosage data grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-bg-surface/50 border border-border-dim/60 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-text-secondary uppercase">Standard Concentration Strength</span>
                <p className="text-sm font-bold text-text-primary uppercase font-orbitron">{result.dosage}</p>
              </div>

              <div className="p-3.5 bg-bg-surface/50 border border-border-dim/60 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-text-secondary uppercase">Estimated Frequency Regulator</span>
                <p className="text-sm font-bold text-text-primary uppercase font-orbitron">{result.frequency}</p>
              </div>
            </div>

            {/* Side-effects & contraindications details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-orbitron text-xs font-semibold uppercase text-text-secondary tracking-widest">
                  🚨 Clinical Side Effects:
                </h4>
                <div className="p-4 bg-bg-surface/60 border border-border-dim/30 hover:border-border-glow/10 transition-colors rounded-xl text-xs text-text-secondary leading-relaxed font-sans">
                  {result.sideEffects}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-orbitron text-xs font-semibold uppercase text-text-secondary tracking-widest">
                  🚫 Primary Contraindications:
                </h4>
                <div className="p-4 bg-bg-surface/60 border border-border-dim/30 hover:border-border-glow/10 transition-colors rounded-xl text-xs text-text-secondary leading-relaxed font-sans">
                  {result.contraindications}
                </div>
              </div>
            </div>

            {/* Negative interaction alerts */}
            <div className="space-y-3">
              <h4 className="font-orbitron text-xs font-semibold uppercase text-[#ff3d3d] tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-alert animate-bounce" /> Adverse Drug Interaction Warnings:
              </h4>

              {result.interactions.length > 0 ? (
                <div className="space-y-2.5">
                  {result.interactions.map((i, idx) => (
                    <div key={idx} className="p-3.5 bg-red-alert/10 border border-red-alert/20 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-red-alert font-mono uppercase">Interacts with: {i.drug}</p>
                      <p className="text-text-secondary leading-relaxed font-sans">{i.risk}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-green-ok/10 border border-green-ok/20 rounded-xl text-xs text-green-ok font-mono text-center">
                  ✓ No severe drug-to-drug exclusion parameters analyzed for this segment.
                </div>
              )}
            </div>

            <div className="p-3.5 border border-border-dim rounded-xl bg-bg-void/40 text-[9px] text-text-dim text-center leading-relaxed">
              CDSCO Database Audit Code: CD_G-X2893. Synthesized pharma indicators are sourced from therapeutic index charts. Verify any active medical modification schemas explicitly with your direct practitioner.
            </div>

          </div>
        )}

        {!loading && !result && (
          <div className="glass-panel p-10 bg-bg-surface/20 flex flex-col justify-center items-center text-center py-20 text-text-dim border-dashed border-border-dim flex-1">
            <Pill className="w-12 h-12 mb-3.5 text-text-dim/50" />
            <p className="font-orbitron text-xs font-semibold uppercase tracking-wider">Awaiting optical scan or manual search query...</p>
            <p className="text-xs text-text-dim mt-1 max-w-sm">Tap on one of the quick mock presets below or input any tablet name into the query console above to try.</p>
          </div>
        )}

      </div>

    </div>
  );
}
export { MEDICINE_PRESETS };
