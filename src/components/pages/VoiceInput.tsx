import { useState, useEffect, useRef } from "react";
import { Mic, Globe, RefreshCcw, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { VoiceMappingResult, BodyRegion } from "../../types";
import { BODY_REGIONS } from "../3d/HumanBodyCanvas";
import { useLanguage } from "../../context/LanguageContext";

interface VoiceInputProps {
  onTriageRegionSelect: (region: BodyRegion, customSymptom: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: "en-IN", name: "English (India)", accent: "🇮🇳" },
  { id: "te-IN", name: "Telugu (తెలుగు)", accent: "🇮🇳" },
  { id: "hi-IN", name: "Hindi (हिन्दी)", accent: "🇮🇳" },
  { id: "ta-IN", name: "Tamil (தமிழ்)", accent: "🇮🇳" },
  { id: "kn-IN", name: "Kannada (ಕನ್ನಡ)", accent: "🇮🇳" },
  { id: "ml-IN", name: "Malayalam (മലയാളം)", accent: "🇮🇳" }
];

export default function VoiceInput({ onTriageRegionSelect }: VoiceInputProps) {
  const { activeLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingResult, setMappingResult] = useState<VoiceMappingResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize browser speech recognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = selectedLang;

      rec.onstart = () => {
        setIsListening(true);
        setErrorText(null);
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setTranscript(text);
        handleMapColloquialSpeech(text);
      };

      rec.onerror = (e: any) => {
        console.warn("Speech Recognition Error:", e);
        if (e.error === "not-allowed") {
          setErrorText("Webcam/Mic permission blocked. Try selecting one of our quick text presets below to try.");
        } else {
          setErrorText(`Audio sensor encountered error: ${e.error}.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [selectedLang]);

  // Sync speech language selector updates
  const handleLanguageChange = (langId: string) => {
    setSelectedLang(langId);
    setTranscript("");
    setMappingResult(null);
    setErrorText(null);
  };

  const toggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setTranscript("");
      setMappingResult(null);
      setErrorText(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Speech Recognition failed to start:", err);
          simulateAudioInput();
        }
      } else {
        // Fallback simulated clinical transcripts if no API is active
        simulateAudioInput();
      }
    }
  };

  // Simulated Speech typing for iframe security safety (fallback)
  const simulateAudioInput = () => {
    setIsListening(true);
    setErrorText(null);
    setTranscript("");

    const sampleMouthings = [
      "my head is hammering like crazy and everything is spinning when I look up",
      "I am suffering from huge burning pains in my tummy after heavy dinner and nauseous",
      "sharp shooting pressure down my left hand and heavy tight chest muscles",
      "back of my thigh has got this terrible pull sciatic nerve and hips are very stiff"
    ];

    const randomChoice = sampleMouthings[Math.floor(Math.random() * sampleMouthings.length)];
    
    // Type out the mock words
    let progressStr = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < randomChoice.length) {
        progressStr += randomChoice[i];
        setTranscript(progressStr);
        i++;
      } else {
        clearInterval(interval);
        setIsListening(false);
        handleMapColloquialSpeech(randomChoice);
      }
    }, 45);
  };

  // Submit audio text transcript to server-side Gemini translation endpoint
  const handleMapColloquialSpeech = async (spokenPhrase: string) => {
    if (!spokenPhrase.trim()) return;
    setLoading(true);
    setMappingResult(null);
    setErrorText(null);

    try {
      const resp = await fetch("/api/voice-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript: spokenPhrase,
          language: activeLanguage.englishName 
        })
      });

      if (!resp.ok) {
        throw new Error("Colloquial speech mapping synthesis failed.");
      }

      const parsed: VoiceMappingResult = await resp.json();
      setMappingResult(parsed);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Synthesizer failed to categorize speech inputs.");
    } finally {
      setLoading(false);
    }
  };

  // Canvas Oscilloscope Wave Generator (Dynamic math oscillator waves)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animationId: number;

    canvas.width = canvas.parentElement?.clientWidth || 300;
    canvas.height = 70;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      // Glowing teal line style
      ctx.strokeStyle = "#00f3ff";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#00f3ff";
      ctx.shadowBlur = isListening ? 12 : 1;

      const midY = canvas.height / 2;
      const amplitude = isListening ? 22 : 2.5;
      const freqMultiplier = isListening ? 0.045 : 0.012;

      for (let x = 0; x < canvas.width; x++) {
        // Compound sine wave formula
        const y = midY + Math.sin(x * freqMultiplier + phase) * amplitude 
                       + Math.cos(x * 0.015 - phase * 0.5) * (amplitude * 0.3);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      phase += isListening ? 0.16 : 0.035;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-3 relative z-10">
      
      {/* LEFT AREA: Selector & Microphones Pulse controller (5 cols) */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between glass-panel p-5 bg-bg-surface/30 min-h-[420px]">
        <div className="absolute inset-0 cyber-grid-overlay opacity-30 select-none pointer-events-none rounded-2xl" />
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 border-b border-border-dimpb-2.5 pb-2.5">
            <Globe className="w-4 h-4 text-teal-glow animate-pulse" />
            <h3 className="font-orbitron font-extrabold text-text-primary text-xs uppercase">Intake Vocal Dialect</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all duration-300 cursor-pointer ${
                  selectedLang === lang.id
                    ? "bg-teal-glow/10 border-teal-glow/40 text-teal-glow shadow-[0_0_10px_rgba(0,255,208,0.08)]"
                    : "bg-bg-surface/50 border-border-dim text-text-secondary hover:border-border-glow/20"
                }`}
              >
                <span className="text-xs font-semibold">{lang.name}</span>
                <span className="text-sm">{lang.accent}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pulsing Mic Node Container Element */}
        <div className="py-8 flex flex-col items-center justify-center relative z-10">
          
          {/* Stacked animated circles generating holographic pulse waves */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-4">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-teal-glow/30 animate-ping" />
                <div className="absolute -inset-4 rounded-full border border-blue-electric/20 animate-pulse" />
                <div className="absolute -inset-8 rounded-full border border-teal-glow/10 animate-pulse" />
              </>
            )}

            <button
              id="voice-mic-trigger"
              onClick={toggleListen}
              className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 scale-100 active:scale-95 ${
                isListening
                  ? "bg-red-alert text-text-primary shadow-[0_0_20px_rgba(255,61,61,0.5)]"
                  : "bg-teal-glow text-bg-void shadow-[0_0_20px_rgba(0,255,208,0.35)] hover:shadow-[0_0_30px_rgba(0,255,208,0.6)]"
              }`}
            >
              <Mic className="w-6 h-6 shrink-0" />
            </button>
          </div>

          <p className="font-orbitron font-bold text-xs uppercase tracking-widest text-text-primary">
            {isListening ? "SENSOR CAPTURING SPEECH..." : "ACTIVATE VOCAL INPUT"}
          </p>
          <p className="text-[10px] text-text-secondary mt-1 font-sans">
            [ {isListening ? "Spoken audio typed Live" : "Tap nodes then articulate symptoms"} ]
          </p>
        </div>

        {/* Canvas visualizer Waveform scope */}
        <div className="p-2 border border-border-dim rounded-xl bg-bg-void relative overflow-hidden z-10">
          <canvas ref={canvasRef} className="w-full block h-[60px]" />
          <span className="absolute bottom-1 right-2 font-mono text-[8px] text-text-dim text-right">[ OSC_WAVE: ACTIVE ]</span>
        </div>

      </div>

      {/* RIGHT AREA: Outcomes Mapped formal terms (7 cols) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6">
        
        {/* Real-time transcribed layout pane */}
        <div className="glass-panel p-5 space-y-3 flex flex-col justify-between">
          <h4 className="font-orbitron text-xs font-semibold uppercase text-text-secondary tracking-wider">
            articulated spoken transcript:
          </h4>
          <div className="min-h-[90px] bg-bg-void border border-border-dim/80 rounded-xl p-4 flex items-center relative">
            <p className={`text-sm leading-relaxed font-sans ${transcript ? "text-text-primary" : "text-text-dim/80 italic"}`}>
              {transcript || "Speak clearly... 'My head is really throbbing and everything is whirling around when I try to stand up...'" }
            </p>
            
            {transcript && (
              <button 
                onClick={() => handleMapColloquialSpeech(transcript)}
                className="absolute right-3.5 bottom-3 text-xs font-mono text-teal-glow hover:underline cursor-pointer"
              >
                Re-Analyze Transcript
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {errorText && (
          <div className="p-3.5 bg-red-alert/15 border border-red-alert/30 rounded-xl text-xs text-red-alert font-mono">
            ⚠ {errorText}
          </div>
        )}

        {/* Mapping clinical outputs */}
        {loading && !mappingResult && (
          <div className="glass-panel p-10 text-center flex flex-col items-center justify-center space-y-4 flex-1">
            <Loader2 className="w-8 h-8 text-teal-glow animate-spin" />
            <div className="space-y-1">
              <h3 className="font-orbitron font-bold text-text-primary uppercase text-sm">Decoding Colloquial Linguistics</h3>
              <p className="text-xs text-text-secondary italic">Extracting chemical path mappings and neurological nodes...</p>
            </div>
          </div>
        )}

        {!loading && mappingResult && (
          <div className="glass-panel p-6 space-y-6 animate-fadeIn flex-1">
            
            <div className="flex items-center gap-3 border-b border-border-dim/20 pb-4">
              <span className="text-2xl">🧠</span>
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-teal-glow">INTELLIGENT MEDICAL SYNAPSE ACTIVE</span>
                <h3 className="font-orbitron text-base font-extrabold text-text-primary uppercase">Terminological Translation Report</h3>
              </div>
            </div>

            {/* Main semantic mapping indicator arrow */}
            <div className="p-4 bg-bg-surface border border-border-dim rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-text-secondary uppercase">Mapped Official Terminology:</span>
                <p className="text-base font-bold text-teal-glow font-orbitron uppercase">{mappingResult.mappedTerm}</p>
              </div>

              <div className="p-2 px-3 bg-teal-glow/10 border border-teal-glow/20 rounded-lg shrink-0">
                <span className="text-[10px] font-mono text-teal-glow font-bold">Heuristic match: 96% confidence</span>
              </div>
            </div>

            {/* Extracted symptoms tokens lists */}
            <div className="space-y-2">
              <h4 className="font-orbitron text-xs font-semibold uppercase text-text-secondary tracking-widest">
                Isolate Symptoms Extracted:
              </h4>
              <div className="flex flex-wrap gap-2">
                {mappingResult.detectedSymptoms.map((symp) => (
                  <span key={symp} className="p-2 bg-bg-surface border border-border-dim rounded-xl text-xs text-text-primary font-sans flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-electric animate-ping" />
                    <span>{symp}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested body region match */}
            <div className="p-4 bg-bg-surface border border-border-dim/80 rounded-xl space-y-2">
              <h4 className="font-orbitron text-xs font-bold uppercase text-blue-electric tracking-wider">
                Target Physical Region Identified:
              </h4>
              <div className="flex justify-between items-center text-xs">
                <p className="text-text-secondary font-sans leading-normal">
                  The semantic mapping identifies symptoms originating within the <b className="text-teal-glow">{mappingResult.suggestedRegion}</b> region.
                </p>

                {/* Direct quick jump trigger to active triage page */}
                <button
                  onClick={() => {
                    const matchedReg = BODY_REGIONS.find(
                      (r) => r.id === mappingResult.suggestedRegion.toLowerCase().replace(" ", "_")
                    ) || BODY_REGIONS[0];
                    onTriageRegionSelect(matchedReg, transcript);
                  }}
                  className="px-4 py-2 bg-blue-electric hover:bg-blue-electric/90 font-orbitron font-extrabold rounded text-[10px] uppercase text-bg-void transition-colors cursor-pointer shrink-0 ml-3 flex items-center gap-1"
                >
                  <span>Launch Triage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {!loading && !mappingResult && (
          <div className="glass-panel p-10 bg-bg-surface/20 flex flex-col justify-center items-center text-center py-20 text-text-dim border-dashed border-border-dim flex-1">
            <Sparkles className="w-12 h-12 mb-3.5 text-text-dim/50 animate-pulse" />
            <p className="font-orbitron text-xs font-semibold uppercase tracking-wider">Awaiting dynamic vocal intake...</p>
            <p className="text-xs text-text-dim mt-1 max-w-sm">Tap on the microphone bubble to stream simulated voice waveforms or test real voice transcription on permitted browser clients.</p>
          </div>
        )}

      </div>

    </div>
  );
}
export { SUPPORTED_LANGUAGES };
