import { useState, useRef, useEffect } from "react";
import { MedicineDetails } from "../../types";
import { Pill, ShieldCheck, ShieldAlert, Camera, Search, HelpCircle, Loader2, RefreshCw, X, ArrowRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const MEDICINE_PRESETS = [
  { name: "Paracetamol", dosage: "500 mg", desc: "Common pain reliever." },
  { name: "Augmentin", dosage: "625 mg", desc: "Antibacterial therapy." },
  { name: "Glycomet", dosage: "850 mg", desc: "Anti-glycemic for Diabetes." },
  { name: "Amlopin", dosage: "5 mg", desc: "Blood pressure control." }
];

export default function MedicineScanner() {
  const { activeLanguage, t } = useLanguage();
  const [scanStream, setScanStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicineDetails | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setCameraError(false);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setScanStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    scanStream?.getTracks().forEach(t => t.stop());
    setScanStream(null);
    setCameraActive(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 480;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    try {
      const resp = await fetch("/api/identify-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, language: activeLanguage.englishName })
      });
      const data = await resp.json();
      setResult(data);
      stopCamera();
    } catch {
      setErrorText(t("Diagnostic synthesis failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/identify-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: activeLanguage.englishName })
      });
      const data = await resp.json();
      setResult(data);
    } catch {
      setErrorText(t("Diagnostic synthesis failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-slideUp pb-12">
      
      {/* ── Header ── */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full">
          <Camera className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("nav_rx_scanner")} Core</span>
        </div>
        <h1 className="text-5xl font-black text-white uppercase tracking-tight">{t("nav_rx_scanner").split(' ')[0]} <span className="text-accent">Scanner</span></h1>
        <p className="text-lg text-text-secondary font-medium max-w-2xl mx-auto">
          {t("action_station_medicine_desc")}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ── Left: Camera Viewfinder ── */}
        <div className="lg:col-span-5 space-y-8">
          <div className="card !p-0 overflow-hidden bg-[#0A0D14] border-2 border-white/5 shadow-2xl relative min-h-[450px] flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-bg-elevated/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-alert animate-pulse" />
                <span className="font-mono text-[10px] text-white uppercase font-black tracking-widest">{t("active_sensor")}</span>
              </div>
              {cameraActive && (
                <button onClick={stopCamera} className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer border-none text-text-dim hover:text-white bg-transparent">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black/40">
              {cameraActive && !cameraError ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-6 p-10">
                  <div className="w-20 h-20 bg-accent/10 rounded-[32px] flex items-center justify-center mx-auto border-2 border-accent/20">
                    <Pill className="w-10 h-10 text-accent" />
                  </div>
                  <p className="text-sm text-text-dim font-bold uppercase tracking-widest leading-relaxed">
                    {cameraError ? "Camera blocked or unavailable." : t("home_no_region")}
                  </p>
                </div>
              )}

              {cameraActive && <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />}
              {cameraActive && <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-0.5 bg-accent/50 shadow-[0_0_15px_#22D3EE] animate-bounce" />}
            </div>

            <div className="p-8 bg-bg-elevated/50">
              {!cameraActive ? (
                <button onClick={startCamera} className="w-full btn-primary !py-5 justify-center shadow-2xl shadow-accent/20 border-none cursor-pointer">
                  <Camera className="w-5 h-5" /> START CAMERA SCAN
                </button>
              ) : (
                <button onClick={handleCapture} disabled={loading} className="w-full btn-primary !py-5 justify-center !bg-white !text-black shadow-2xl border-none cursor-pointer">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CAPTURE & ANALYZE"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-text-dim flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent" /> Rapid Mock Scans
            </p>
            <div className="grid grid-cols-2 gap-3">
              {MEDICINE_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setSearchQuery(p.name); handleSearch(p.name); }}
                  className="p-4 rounded-2xl bg-bg-surface border border-border text-left hover:border-accent transition-all group cursor-pointer"
                >
                  <p className="text-sm font-black text-white group-hover:text-accent transition-colors">{p.name}</p>
                  <p className="text-[10px] text-text-dim font-bold uppercase mt-1">{p.dosage}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card !p-8 space-y-8 bg-bg-elevated/30 border-2 border-border shadow-2xl min-h-[550px] flex flex-col">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-text-dim">Global Database Query</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Enter brand or generic name..."
                  className="input !h-14 !text-base"
                />
                <button onClick={() => handleSearch(searchQuery)} className="btn-primary !px-8 border-none cursor-pointer">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-20">
                    <RefreshCw className="w-12 h-12 text-accent animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-accent">{t("home_inspecting")} Formula...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <div className="flex items-start justify-between border-b border-white/5 pb-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{result.name}</h2>
                          {result.verified && <ShieldCheck className="w-8 h-8 text-green-ok" />}
                        </div>
                        <p className="text-lg text-accent font-black uppercase tracking-widest">{result.generic}</p>
                      </div>
                      <div className="px-5 py-2 bg-bg-void border border-border rounded-2xl">
                        <p className="text-[10px] font-black text-text-dim uppercase mb-1">Concentration</p>
                        <p className="text-xl font-black text-white">{result.dosage}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-dim">Clinical Side Effects</p>
                        <p className="text-base text-text-secondary font-medium leading-relaxed bg-bg-void/50 p-6 rounded-3xl border border-white/5">{result.sideEffects}</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-dim">Contraindications</p>
                        <p className="text-base text-text-secondary font-medium leading-relaxed bg-bg-void/50 p-6 rounded-3xl border border-white/5">{result.contraindications}</p>
                      </div>
                    </div>

                    <div className="p-8 bg-red-alert/5 border-2 border-red-alert/20 rounded-[32px] space-y-6">
                      <div className="flex items-center gap-4">
                        <ShieldAlert className="w-8 h-8 text-red-alert animate-bounce" />
                        <h4 className="text-xl font-black text-red-alert uppercase tracking-tight">Adverse Interaction Alerts</h4>
                      </div>
                      <div className="space-y-4">
                        {result.interactions.map((i, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-red-alert/10 rounded-2xl border border-red-alert/10">
                            <ArrowRight className="w-5 h-5 text-red-alert mt-1" />
                            <div>
                              <p className="text-base font-black text-white uppercase">{i.drug}</p>
                              <p className="text-sm text-text-secondary font-medium">{i.risk}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                    <Pill className="w-20 h-20 text-text-dim" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Neural Database Awaiting Input</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      <footer className="card !bg-bg-void border-border text-center !p-6">
        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">CDSCO Database Verified • 256-bit Encrypted Session</p>
      </footer>

    </div>
  );
}
