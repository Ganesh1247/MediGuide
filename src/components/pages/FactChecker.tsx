import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, HelpCircle, Loader2, Sparkles, CheckCircle, XCircle, ArrowRight, Info, AlertCircle, Clock, Users, ExternalLink, Activity, Star } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface FactResult {
  claim: string;
  verdict: string;
  explanation: string;
  evidenceSource: string;
  safetyAdvisory: string;
}

const COMMON_MYTHS = [
  "Does drinking cold water cause weight gain?",
  "Is sitting close to TV bad for eyes?",
  "Does sugar cause hyperactivity in kids?",
  "Can garlic cure the common cold?",
  "Should we walk 10,000 steps daily?"
];

export default function FactChecker() {
  const { activeLanguage, t } = useLanguage();
  const [query, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleCheck = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setErrorText(null);
    try {
      const resp = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: text, language: activeLanguage.englishName })
      });
      if (!resp.ok) {
        const errorBody = await resp.json().catch(() => null);
        throw new Error(errorBody?.error || "Fact-check service failed to audit claim.");
      }
      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Diagnostic connection failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 animate-slideUp pb-12">
      
      {/* ── Header ── */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-accent/10 border border-accent/20 text-accent rounded-2xl mb-2">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">{t("nav_fact_audit")} AI Hub</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white uppercase tracking-tight">Truth <span className="text-accent italic">Auditor</span></h1>
          <p className="text-xl text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
            {t("action_station_claim_desc")}
          </p>
        </div>
      </section>

      <div className="space-y-10">
        {/* ── Search Area ── */}
        <div className="card !p-3 !bg-bg-elevated/50 border-2 border-border shadow-2xl rounded-[40px]">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-text-dim" />
              <input
                type="text"
                value={query}
                onChange={e => setClaim(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck(query)}
                placeholder={t("nav_fact_audit") + "..."}
                className="input !h-16 md:!h-20 !pl-16 md:!pl-20 !text-base md:!text-xl !border-none !bg-transparent !rounded-none focus:!ring-0"
              />
            </div>
            <button
              onClick={() => handleCheck(query)}
              disabled={loading || !query.trim()}
              className="btn-primary !px-12 md:!px-16 !h-16 md:!h-20 !rounded-[32px] shadow-2xl shadow-accent/20 border-none cursor-pointer group relative overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              <span className="relative z-10 text-lg font-black">{loading ? <Loader2 className="w-8 h-8 animate-spin" /> : t("begin_analysis")}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="text-xs font-black text-text-dim uppercase tracking-widest mr-2">Quick Verify:</p>
          {COMMON_MYTHS.map(m => (
            <button
              key={m}
              onClick={() => { setClaim(m); handleCheck(m); }}
              className="px-6 py-3 rounded-2xl bg-bg-surface border border-white/5 text-sm font-bold text-text-secondary hover:border-accent hover:text-white transition-all cursor-pointer shadow-lg hover:shadow-accent/5"
            >
              {m}
            </button>
          ))}
        </div>

        {/* ── Results Area ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 sm:py-24 flex flex-col items-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <Activity className="absolute inset-0 m-auto w-8 h-8 text-accent animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                 <p className="text-sm font-black uppercase tracking-[0.5em] text-accent animate-pulse">{t("home_inspecting")} Databases</p>
                 <p className="text-xs text-text-dim font-mono">NEURAL_LINK: ACTIVE_SYNTHESIS</p>
              </div>
            </motion.div>
          ) : errorText ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-12 bg-red-alert/5 border-2 border-red-alert/20 rounded-[48px] text-center space-y-6 shadow-2xl">
              <AlertCircle className="w-16 h-16 text-red-alert mx-auto animate-bounce" />
              <div className="space-y-2">
                <p className="text-xl text-red-alert font-black uppercase tracking-widest">Audit System Error</p>
                <p className="text-text-secondary font-medium">{errorText}</p>
              </div>
              <button onClick={() => handleCheck(query)} className="btn-secondary !py-4 !px-10 border-red-alert/20 text-red-alert hover:!bg-red-alert hover:!text-white border-none cursor-pointer">Retry Synthesis</button>
            </motion.div>
          ) : result ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-12">
              <div className="card !p-8 lg:!p-16 space-y-12 relative overflow-hidden bg-bg-elevated/30 border-2 border-white/5 rounded-[60px] shadow-3xl">
                <div className="absolute top-0 right-0 p-16 opacity-5 scale-[5] rotate-12 pointer-events-none">
                  <Sparkles className="text-accent" />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b border-white/5 pb-12 relative z-10">
                  <div className="space-y-4 flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                      <Info className="w-3 h-3 text-accent" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Claim Audited</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">"{result.claim}"</h2>
                  </div>

                  <div className={`shrink-0 px-8 py-6 md:px-12 md:py-8 rounded-[40px] text-center border-4 flex flex-col justify-center gap-2 shadow-2xl transition-all duration-500 hover:scale-105 ${
                    result.verdict.toLowerCase().includes("true") && !result.verdict.toLowerCase().includes("partially") ? "bg-green-ok/10 border-green-ok/40 text-green-ok" :
                    result.verdict.toLowerCase().includes("false") ? "bg-red-alert/10 border-red-alert/40 text-red-alert" :
                    "bg-amber-warn/10 border-amber-warn/40 text-amber-warn"
                  }`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Clinical Verdict</p>
                    <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">{result.verdict}</p>
                  </div>
                </div>

                <div className="space-y-16 relative z-10">
                  <div className="space-y-8">
                    <h4 className="text-2xl font-black text-white uppercase flex items-center gap-5 justify-center lg:justify-start">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center border-2 border-accent/20 shadow-inner">
                        <CheckCircle className="w-7 h-7 text-accent" />
                      </div>
                      {t("scientific_explanation")}
                    </h4>
                    <div className="bg-bg-void/50 p-6 lg:p-14 rounded-[64px] border-2 border-white/5 shadow-inner relative overflow-hidden group text-center lg:text-left">
                      <div className="absolute inset-0 bg-mesh-glow opacity-5" />
                      <p className="text-base lg:text-2xl text-text-secondary font-medium leading-relaxed whitespace-pre-line relative z-10">
                        {result.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card !p-10 !bg-bg-void/40 border-white/5 rounded-[48px] space-y-6 text-center lg:text-left">
                      <h4 className="text-xs font-black text-text-dim uppercase tracking-[0.4em] flex items-center gap-3 justify-center lg:justify-start">
                        <ShieldCheck className="w-4 h-4 text-green-ok" /> Evidence Basis
                      </h4>
                      <p className="text-lg text-text-secondary font-bold leading-relaxed italic">
                        {result.evidenceSource}
                      </p>
                    </div>

                    <div className="card !p-10 !bg-red-alert/5 border-red-alert/20 rounded-[48px] space-y-6 text-center lg:text-left">
                      <h4 className="text-xs font-black text-text-dim uppercase tracking-[0.4em] flex items-center gap-3 justify-center lg:justify-start">
                        <ShieldAlert className="w-4 h-4 text-red-alert" /> {t("safety_advisory")}
                      </h4>
                      <p className="text-lg text-red-alert/80 font-bold leading-relaxed">
                        {result.safetyAdvisory}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-32 flex flex-col items-center gap-10 opacity-30">
              <div className="relative">
                 <HelpCircle className="w-48 h-48 text-text-dim" />
                 <Sparkles className="absolute -top-4 -right-4 w-16 h-16 text-accent animate-pulse" />
              </div>
              <div className="text-center space-y-3">
                <p className="text-2xl font-black uppercase tracking-[0.4em] text-white">System Awaiting Query</p>
                <p className="text-lg font-bold text-text-dim">{t("initialize_claim_audit")}</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <footer className="card !bg-bg-void/40 border-white/5 text-center !p-8 md:!p-12 shadow-none rounded-[48px]">
        <div className="flex flex-wrap items-center justify-center gap-12 text-[11px] font-black text-text-dim uppercase tracking-[0.4em]">
          <span className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-ok" /> EVIDENCE BASED</span>
          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          <span className="flex items-center gap-3"><Star className="w-5 h-5 text-amber-warn" /> PEER VERIFIED</span>
          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          <span className="flex items-center gap-3"><Clock className="w-5 h-5 text-blue" /> REAL-TIME GROUNDING</span>
        </div>
      </footer>
    </div>
  );
}
