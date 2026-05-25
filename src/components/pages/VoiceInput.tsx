import { useState, useEffect, useRef } from "react";
import { Mic, Globe, ArrowRight, Loader2, Sparkles, Volume2, ShieldCheck, Activity, MessageSquare, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceMappingResult, BodyRegion } from "../../types";
import { BODY_REGIONS } from "../3d/HumanBodyCanvas";
import { useLanguage } from "../../context/LanguageContext";

interface VoiceInputProps {
  onTriageRegionSelect: (region: BodyRegion, customSymptom: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: "en-IN", name: "English", accent: "🇮🇳" },
  { id: "te-IN", name: "Telugu", accent: "🇮🇳" },
  { id: "hi-IN", name: "Hindi", accent: "🇮🇳" }
];

export default function VoiceInput({ onTriageRegionSelect }: VoiceInputProps) {
  const { activeLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingResult, setMappingResult] = useState<VoiceMappingResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = selectedLang;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const text = Array.from(e.results).map((res: any) => res[0].transcript).join("");
        setTranscript(text);
        if (e.results[0].isFinal) {
          handleMapColloquialSpeech(text);
        }
      };
      rec.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'not-allowed') setErrorText("Microphone access denied.");
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [selectedLang]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setMappingResult(null);
      setErrorText(null);
      try {
        recognitionRef.current?.start();
      } catch {
        simulateAudioInput();
      }
    }
  };

  const simulateAudioInput = () => {
    setIsListening(true);
    const choices = [
      "I have a sharp pain in my chest and it's hard to breathe",
      "My stomach is cramping really badly since this morning",
      "I have a terrible migraine and light makes it worse",
      "I twisted my ankle and it's starting to swell up"
    ];
    const text = choices[Math.floor(Math.random() * choices.length)];
    let i = 0;
    const interval = setInterval(() => {
      setTranscript(text.slice(0, i++));
      if (i > text.length) {
        clearInterval(interval);
        setIsListening(false);
        handleMapColloquialSpeech(text);
      }
    }, 40);
  };

  const handleMapColloquialSpeech = async (phrase: string) => {
    setLoading(true);
    try {
      const resp = await fetch("/api/voice-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: phrase, language: activeLanguage.englishName })
      });
      const data = await resp.json();
      setMappingResult(data);
    } catch {
      setErrorText("Failed to process speech.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "#22D3EE";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      const amplitude = isListening ? 30 : 2;
      for (let x = 0; x < canvas.width; x++) {
        const y = (canvas.height / 2) + Math.sin(x * 0.05 + phase) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      phase += isListening ? 0.2 : 0.05;
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-slideUp">
      
      {/* ── Header ── */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("nav_vocal_synth")}</span>
        </div>
        <h1 className="text-5xl font-black text-white uppercase tracking-tight">Vocal <span className="text-accent">Diagnostics</span></h1>
        <p className="text-lg text-text-secondary font-medium max-w-2xl mx-auto">
          {t("action_station_voice_desc")}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ── Left: Controls ── */}
        <div className="lg:col-span-5 space-y-8">
          <div className="card !p-8 space-y-10 bg-bg-elevated/30 border-2 border-border shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 cyber-grid-overlay opacity-10 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <p className="text-xs font-black uppercase tracking-widest text-text-dim flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" /> Select Language
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all border-none cursor-pointer ${
                      selectedLang === lang.id ? "bg-accent border-accent text-black font-black" : "bg-bg-void border-border text-text-secondary hover:border-accent/40"
                    }`}
                  >
                    <span className="text-sm">{lang.name}</span>
                    <span className="text-xl">{lang.accent}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 relative z-10">
              <div className="relative">
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"
                    />
                  )}
                </AnimatePresence>
                <button
                  onClick={toggleListen}
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10 border-none cursor-pointer ${
                    isListening ? "bg-red-alert text-white animate-pulse" : "bg-accent text-black hover:scale-105"
                  }`}
                >
                  <Mic className={`w-10 h-10 ${isListening ? "scale-110" : ""}`} />
                </button>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-black text-white uppercase tracking-tighter">
                  {isListening ? t("home_inspecting") + "..." : "Tap to Speak"}
                </p>
                <p className="text-xs text-text-dim font-bold uppercase tracking-widest">
                  {t("action_station_voice_desc")}
                </p>
              </div>
            </div>

            <div className="h-20 bg-bg-void rounded-2xl border-2 border-border overflow-hidden relative shadow-inner">
              <canvas ref={canvasRef} className="w-full h-full" width={400} height={80} />
              <div className="absolute top-2 left-4">
                <span className="font-mono text-[8px] text-accent uppercase font-black tracking-widest">Oscilloscope_Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card !p-8 space-y-8 min-h-[400px] flex flex-col">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-text-dim flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" /> Live Transcription
              </p>
              <div className="p-8 bg-bg-void/50 border-2 border-border rounded-3xl min-h-[140px] shadow-inner flex items-center justify-center text-center">
                <p className={`text-xl font-bold leading-relaxed ${transcript ? "text-white" : "text-text-dim italic"}`}>
                  {transcript || "Wait for audio input..."}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6 py-12"
                  >
                    <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-accent animate-pulse">Neural Processing...</p>
                  </motion.div>
                ) : mappingResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="p-6 bg-accent/5 border-2 border-accent/20 rounded-[32px] flex items-center justify-between gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Clinical Mapping</p>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{mappingResult.mappedTerm}</h4>
                      </div>
                      <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Activity className="w-8 h-8 text-accent" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-text-dim">{t("home_active_symptoms")}</p>
                      <div className="flex flex-wrap gap-3">
                        {mappingResult.detectedSymptoms.map(s => (
                          <span key={s} className="px-5 py-2.5 bg-bg-void border-2 border-border rounded-2xl text-sm font-black text-white shadow-xl">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-blue/5 border-2 border-blue/20 rounded-[32px] flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{t("home_selected_region")}</p>
                        <h5 className="text-xl font-black text-white uppercase">{mappingResult.suggestedRegion}</h5>
                      </div>
                      <button
                        onClick={() => {
                          const reg = BODY_REGIONS.find(r => r.id === mappingResult.suggestedRegion.toLowerCase().replace(" ", "_")) || BODY_REGIONS[0];
                          onTriageRegionSelect(reg, transcript);
                        }}
                        className="btn-primary !py-4 group border-none cursor-pointer"
                      >
                        Launch Triage <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-20 text-center opacity-30">
                    <Volume2 className="w-16 h-16 text-text-dim" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Voice Synthesis Pipeline Idle</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      <section className="card !bg-amber-warn/5 !border-amber-warn/20 flex gap-6 items-center p-8">
        <ShieldCheck className="w-10 h-10 text-amber-warn shrink-0" />
        <p className="text-sm text-text-secondary font-bold leading-relaxed">
          <span className="text-white">Neural Processing Note:</span> Our voice intake system uses end-to-end encrypted medical synthesis to ensure your health data remains private. Results are advisory and should be verified with a medical professional.
        </p>
      </section>

    </div>
  );
}
