import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, HelpCircle, Loader2, Sparkles, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from "motion/react";

interface FactResult {
  claim: string;
  verdict: "True" | "False" | "Partially True" | "Misleading";
  explanation: string;
  evidenceSource: string;
  safetyAdvisory: string;
}

export default function FactChecker() {
  const { activeLanguage, t } = useLanguage();
  const [query, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactResult | null>(null);

  const handleCheck = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: text, language: activeLanguage.englishName })
      });
      const data = await resp.json();
      setResult(data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-slideUp pb-12">
      
      {/* ── Header ── */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("nav_fact_audit")}</span>
        </div>
        <h1 className="text-5xl font-black text-white uppercase tracking-tight">{t("nav_fact_audit").split(' ')[0]} <span className="text-accent">Auditor</span></h1>
        <p className="text-lg text-text-secondary font-medium max-w-2xl mx-auto">
          {t("action_station_claim_desc")}
        </p>
      </section>

      <div className="space-y-8">
        {/* ── Search Area ── */}
        <div className="card !p-3 !bg-bg-elevated/50 border-2 border-border shadow-2xl rounded-[32px]">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-text-dim" />
              <input
                type="text"
                value={query}
                onChange={e => setClaim(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck(query)}
                placeholder={t("nav_fact_audit") + "..."}
                className="input !h-16 !pl-16 !text-lg !border-none !bg-transparent"
              />
            </div>
            <button
              onClick={() => handleCheck(query)}
              disabled={loading || !query.trim()}
              className="btn-primary !px-12 !h-16 !rounded-3xl shadow-2xl shadow-accent/20 border-none cursor-pointer"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t("begin_analysis")}
            </button>
          </div>
        </div>

        {/* ── Results Area ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-accent animate-pulse">{t("home_inspecting")} Databases...</p>
            </motion.div>
          ) : result ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="card !p-10 space-y-10 relative overflow-hidden bg-bg-elevated/30">
                <div className={`absolute top-0 right-0 p-12 opacity-5 scale-[3]`}>
                  {result.verdict.includes("True") ? <CheckCircle /> : <XCircle />}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-8 relative z-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim">Claim Audited</p>
                    <h2 className="text-3xl font-black text-white leading-tight">"{result.claim}"</h2>
                  </div>
                  <div className={`px-10 py-5 rounded-[24px] text-center border-4 ${
                    result.verdict === "True" ? "bg-green-ok/10 border-green-ok/40 text-green-ok" :
                    result.verdict === "False" ? "bg-red-alert/10 border-red-alert/40 text-red-alert" :
                    "bg-amber-warn/10 border-amber-warn/40 text-amber-warn"
                  }`}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Official Verdict</p>
                    <p className="text-3xl font-black uppercase tracking-tighter">{result.verdict}</p>
                  </div>
                </div>

                <div className="space-y-10 relative z-10">
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-white uppercase flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-accent" /> Scientific Explanation
                    </h4>
                    <p className="text-xl text-text-secondary font-medium leading-relaxed bg-bg-void/50 p-8 rounded-[40px] border border-white/5">
                      {result.explanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-text-dim uppercase tracking-widest flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-ok" /> Evidence Basis
                      </h4>
                      <p className="text-base text-text-secondary font-bold leading-relaxed">{result.evidenceSource}</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-text-dim uppercase tracking-widest flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-red-alert" /> Safety Advisory
                      </h4>
                      <p className="text-base text-text-secondary font-bold leading-relaxed">{result.safetyAdvisory}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-20 flex flex-col items-center gap-6 opacity-20">
              <HelpCircle className="w-24 h-24 text-text-dim" />
              <p className="text-sm font-black uppercase tracking-[0.3em]">Awaiting Clinical Query</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
