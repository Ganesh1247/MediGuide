import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { MedicineDetails } from "../../types";
import { Pill, ShieldCheck, ShieldAlert, Camera, Search, HelpCircle, Loader2, RefreshCw, X, ArrowRight, Upload, FileText, Sparkles, Activity, Clock } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    processImage(dataUrl);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const processImage = async (dataUrl: string) => {
    setLoading(true);
    setErrorText(null);
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
      setErrorText("Diagnostic synthesis failed.");
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
      setErrorText("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-slideUp pb-12">

      {/* ── Header ── */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-accent/10 border border-accent/20 text-accent rounded-2xl mb-2">
          <Camera className="w-5 h-5" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Optical Pharma Matrix</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tight">Medicine <span className="text-accent italic">Scanner</span></h1>
        <p className="text-xl text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
          Initialize a clinical scan of your doctor prescription or pharmacological packaging for immediate compound analysis.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* ── Left: Scanner UI ── */}
        <div className="lg:col-span-5 space-y-8">
          <div className="card !p-0 overflow-hidden bg-[#0A0D14] border-2 border-white/5 shadow-2xl relative min-h-[500px] flex flex-col group">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-bg-elevated/50">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-alert animate-pulse" />
                <span className="font-mono text-xs text-white uppercase font-black tracking-widest">Active_Optical_Link</span>
              </div>
              {cameraActive && (
                <button onClick={stopCamera} className="p-3 hover:bg-white/10 rounded-2xl transition-all cursor-pointer border-none text-text-dim hover:text-white bg-transparent">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black/40 overflow-hidden">
              {cameraActive && !cameraError ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-8 p-12 relative z-10">
                  <div className="w-24 h-24 bg-accent/10 rounded-[40px] flex items-center justify-center mx-auto border-2 border-accent/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <FileText className="w-12 h-12 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Scan Prescription</p>
                    <p className="text-sm text-text-dim font-bold uppercase tracking-widest">Awaiting intake link...</p>
                  </div>
                </div>
              )}

              {/* Scan Overlay UI */}
              {cameraActive && (
                <>
                  <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none" />
                  <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-1 bg-accent/50 shadow-[0_0_30px_#22D3EE] animate-bounce" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-accent/30 rounded-[48px]" />
                </>
              )}
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

            <div className="p-10 bg-bg-elevated/50 border-t border-white/5 flex flex-col sm:flex-row gap-4">
              {!cameraActive ? (
                <>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 btn-secondary !py-6 justify-center border-none cursor-pointer">
                    <Upload className="w-6 h-6 text-accent" /> <span className="font-black text-accent">UPLOAD FILE</span>
                  </button>
                  <button onClick={startCamera} className="flex-1 sm:mr-2 btn-primary !py-6 justify-center shadow-2xl shadow-accent/20 border-none cursor-pointer">
                    <Camera className="w-6 h-6" /> <span className="font-black">LIVE CAMERA</span>
                  </button>
                </>
              ) : (
                <button onClick={handleCapture} disabled={loading} className="w-full btn-primary !py-6 justify-center !bg-white !text-black shadow-2xl border-none cursor-pointer transition-all active:scale-95">
                  {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <><Sparkles className="w-7 h-7" /> <span className="text-lg font-black">ANALYZE NOW</span></>}
                </button>
              )}
            </div>
          </div>

          <div className="card !p-8 space-y-6 !bg-bg-elevated/20">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-text-dim flex items-center gap-3">
              <div className="w-6 h-[2px] bg-accent" /> Quick Calibration Hub
            </p>
            <div className="grid grid-cols-2 gap-4">
              {MEDICINE_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setSearchQuery(p.name); handleSearch(p.name); }}
                  className="p-6 rounded-3xl bg-bg-surface border-2 border-white/5 text-left hover:border-accent hover:bg-accent/5 transition-all group cursor-pointer shadow-lg"
                >
                  <p className="text-lg font-black text-white group-hover:text-accent transition-colors leading-none">{p.name}</p>
                  <p className="text-[10px] font-black text-text-dim uppercase mt-3 tracking-widest">{p.dosage}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Results Feed ── */}
        <div className="lg:col-span-7 space-y-8">
          <div className="card !p-10 space-y-10 bg-bg-elevated/30 border-2 border-border shadow-2xl min-h-[600px] flex flex-col">
            <div className="space-y-6">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-text-dim">Molecular Database Query</p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Enter branding or clinical generic name..."
                  className="input !h-20 !text-xl !pl-8 !bg-bg-void/50 !border-none shadow-inner"
                />
                <button onClick={() => handleSearch(searchQuery)} className="btn-primary !px-10 border-none cursor-pointer shadow-xl">
                  <Search className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-10 py-20">
                    <div className="relative">
                      <RefreshCw className="w-24 h-24 text-accent animate-spin opacity-20" />
                      <Activity className="absolute inset-0 m-auto w-10 h-10 text-accent animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-black uppercase tracking-[0.5em] text-accent animate-pulse">Auditing Chemical Matrix</p>
                      <p className="text-xs text-text-dim font-mono">CROSS_REFERENCING_CDSCO_DATABASE</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-white/5 pb-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-5">
                          <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{result.name}</h2>
                          {result.verified && (
                            <div className="px-4 py-2 bg-green-ok/10 border border-green-ok/20 rounded-xl flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-green-ok" />
                              <span className="text-[10px] font-black text-green-ok uppercase tracking-widest">Verified</span>
                            </div>
                          )}
                        </div>
                        <p className="text-2xl text-accent font-black uppercase tracking-[0.2em] italic">{result.generic}</p>
                      </div>
                      <div className="px-8 py-4 bg-bg-void border-2 border-white/5 rounded-[32px] shadow-inner text-center">
                        <p className="text-[10px] font-black text-text-dim uppercase mb-1 tracking-widest">Strength</p>
                        <p className="text-3xl font-black text-white">{result.dosage}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-text-dim">Clinical Interactions</p>
                        <p className="text-lg text-text-secondary font-medium leading-relaxed bg-bg-void/50 p-8 rounded-[48px] border border-white/5 shadow-inner">{result.sideEffects}</p>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-text-dim">Contraindications</p>
                        <p className="text-lg text-text-secondary font-medium leading-relaxed bg-bg-void/50 p-8 rounded-[48px] border border-white/5 shadow-inner">{result.contraindications}</p>
                      </div>
                    </div>

                    <div className="p-10 bg-red-alert/5 border-2 border-red-alert/20 rounded-[48px] space-y-8 shadow-2xl">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-red-alert/10 flex items-center justify-center border border-red-alert/20">
                          <ShieldAlert className="w-8 h-8 text-red-alert animate-bounce" />
                        </div>
                        <h4 className="text-3xl font-black text-red-alert uppercase tracking-tighter">Adverse Interaction Hub</h4>
                      </div>
                      <div className="space-y-6">
                        {result.interactions.map((i, idx) => (
                          <div key={idx} className="flex items-start gap-6 p-6 bg-red-alert/5 rounded-3xl border border-red-alert/10 group hover:bg-red-alert/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-red-alert/20 flex items-center justify-center shrink-0 mt-1">
                               <ArrowRight className="w-5 h-5 text-red-alert" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xl font-black text-white uppercase tracking-tight">{i.drug}</p>
                              <p className="text-base text-text-secondary font-medium">{i.risk}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-8 py-32 opacity-20 group">
                    <div className="relative">
                       <Pill className="w-40 h-40 text-text-dim group-hover:rotate-45 transition-transform duration-700" />
                       <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-accent animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-2xl font-black uppercase tracking-[0.4em] text-white">System Idle</p>
                       <p className="text-lg font-bold">Awaiting optical Rx link or manual database index</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      <footer className="card !bg-bg-void/40 border-white/5 text-center !p-10 shadow-none rounded-[48px]">
        <div className="flex flex-wrap items-center justify-center gap-12 text-[11px] font-black text-text-dim uppercase tracking-[0.4em]">
          <span className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-ok" /> CDSCO Standards</span>
          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          <span className="flex items-center gap-3"><RefreshCw className="w-5 h-5 text-accent" /> Encrypted Link</span>
          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          <span className="flex items-center gap-3"><Clock className="w-5 h-5 text-blue" /> Real-time Audit</span>
        </div>
      </footer>

    </div>
  );
}
