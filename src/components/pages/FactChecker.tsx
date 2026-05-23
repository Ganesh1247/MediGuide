import { useState } from "react";
import { FactCheckResult } from "../../types";
import { Search, Loader2, Sparkles, AlertTriangle, ExternalLink, BookmarkCheck, FileText } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const STANDARD_MYTH_PRESETS = [
  { claim: "Do carrots physically improve night vision?", topic: "Optical Health" },
  { claim: "Does turmeric help relieve heavy knee joint arthritis?", topic: "Inflammation" },
  { claim: "Is drinking hot water after meals helpful for biological fat burning?", topic: "Metabolic Metabolism" },
  { claim: "Can cold showers trigger a surge in white blood cells and immunity?", topic: "Immunological Response" }
];

export default function FactChecker() {
  const { activeLanguage } = useLanguage();
  const [claimText, setClaimText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleRunFactCheck = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setErrorText(null);

    try {
      const resp = await fetch("/api/factcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          claim: text,
          language: activeLanguage.englishName 
        })
      });

      if (!resp.ok) {
        throw new Error("Unable to complete search validation at this time.");
      }

      const data: FactCheckResult = await resp.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to search authoritative registers. Try searching again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] py-3 relative z-10">
      
      {/* LEFT SECTION: Search input and quick preset selectors (5 cols) */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between glass-panel p-5 bg-bg-surface/30 min-h-[420px]">
        <div className="absolute inset-0 cyber-grid-overlay opacity-35 select-none pointer-events-none rounded-2xl" />
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 border-b border-border-dimpb-2.5 pb-2.5">
            <BookmarkCheck className="w-4 h-4 text-teal-glow animate-pulse" />
            <h3 className="font-orbitron font-extrabold text-xs uppercase text-text-primary">Medical Myth Auditor</h3>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            Submit any clinical health claim, viral bio-hack, or medical assertion. MediGuide queries our live search-grounded database index to separate legitimate science from speculative placebo myths.
          </p>

          <div className="space-y-2.5">
            <textarea
              id="fact-claim-textarea"
              name="claim"
              placeholder="E.g., Does drinking celery extract daily detoxify hepatic liver lipids?"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              rows={4}
              className="w-full bg-bg-void/40 border border-border-dim focus:border-teal-glow focus:outline-none text-xs rounded-xl p-3 placeholder:text-text-dim/80 text-text-primary transition-colors resize-none font-sans"
            />

            <button
              onClick={() => handleRunFactCheck(claimText)}
              disabled={loading || !claimText.trim()}
              className="w-full p-3 rounded-lg btn-primary text-xs uppercase font-orbitron font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:shadow-[0_0_15px_rgba(0,255,208,0.25)] transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 text-bg-void animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-bg-void" />
              )}
              <span>Audit Health Claim</span>
            </button>
          </div>
        </div>

        {/* Quick query presets */}
        <div className="space-y-3 relative z-10 pt-4">
          <span className="font-orbitron text-[10px] uppercase font-bold text-text-secondary tracking-widest flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-blue-electric" /> Click Quick Presets to Analyze:
          </span>
          <div className="grid grid-cols-1 gap-2">
            {STANDARD_MYTH_PRESETS.map((item) => (
              <button
                key={item.claim}
                onClick={() => {
                  setClaimText(item.claim);
                  handleRunFactCheck(item.claim);
                }}
                className="p-2.5 rounded-xl bg-bg-surface/50 border border-border-dim hover:border-teal-glow/30 text-left transition-all duration-300 flex items-center justify-between text-xs hover:bg-bg-surface cursor-pointer"
              >
                <div className="space-y-0.5 max-w-[82%]">
                  <div className="text-[11px] font-bold text-text-primary truncate">{item.claim}</div>
                  <div className="text-[9px] font-mono text-text-secondary uppercase">{item.topic}</div>
                </div>
                <span className="text-teal-glow shrink-0">→</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT SECTION: Search Grounded findings, references index (7 cols) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6">
        
        {/* Error notification */}
        {errorText && (
          <div className="p-4 bg-red-alert/15 border border-red-alert/30 rounded-xl text-xs text-red-alert font-mono">
            ⚠ {errorText}
          </div>
        )}

        {/* Loading facts audit */}
        {loading && !result && (
          <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4 flex-1 py-20">
            {/* Spinning core rings */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border border-dashed border-teal-glow rotate-slow" />
              <div className="absolute inset-2 rounded-full border border-dashed border-blue-electric rotate-slow-counter" />
              <Loader2 className="w-6 h-6 text-teal-glow animate-spin absolute inset-0 m-auto" />
            </div>

            <div className="space-y-1">
              <h3 className="font-orbitron font-bold text-text-primary uppercase text-sm">Querying Authoritative Databases</h3>
              <p className="text-xs text-text-secondary italic">Executing live Google search-grounded scientific lookup matches...</p>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="glass-panel p-6 space-y-5 animate-fadeIn flex-1 flex flex-col justify-between">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border-dim/20 pb-3">
                <BookmarkCheck className="w-5 h-5 text-teal-glow" />
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] text-text-secondary uppercase">Clinical Audit Status: Verified</span>
                  <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase">Scientific Consensus Analysis</h3>
                </div>
              </div>

              {/* Scanned query echo */}
              <div className="p-3.5 bg-bg-void/40 border border-border-dim rounded-xl font-mono text-xs text-text-secondary">
                <b className="text-teal-glow uppercase text-[10px]">Claim Checked:</b> "{result.claim}"
              </div>

              {/* Verified Analysis core body */}
              <div className="prose prose-invert prose-xs text-xs text-text-secondary leading-relaxed font-sans space-y-3">
                {result.analysis.split("\n\n").map((para, i) => {
                  if (para.trim() === "") return null;
                  return (
                    <p key={i} className="leading-relaxed">
                      {para}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Authoritative links grounding citations */}
            <div className="space-y-3 pt-4 border-t border-border-dim/30">
              <h4 className="font-orbitron text-xs font-semibold uppercase text-blue-electric tracking-widest flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-blue-electric" /> Authoritative Grounding Citations:
              </h4>

              {result.citations && result.citations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.citations.map((cit, idx) => (
                    <a
                      key={idx}
                      href={cit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-bg-surface/50 border border-border-dim hover:border-blue-electric/40 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-bg-surface text-text-secondary hover:text-text-primary shrink-0"
                    >
                      <div className="space-y-0.5 truncate max-w-[85%]">
                        <span className="font-bold text-text-primary block truncate">{cit.title || "Peer-Reviewed Study Source"}</span>
                        <span className="font-mono text-[9px] text-text-dim uppercase text-ellipsis overflow-hidden block">{cit.url}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-electric shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-bg-surface border border-border-dim/50 rounded-xl text-[11px] text-text-dim font-mono text-center">
                  Citations are natively structured inside the scientific analysis consensus body above.
                </div>
              )}
            </div>

            <div className="p-3 border border-border-dim/40 rounded-xl bg-bg-void/40 text-[9px] text-text-dim text-center">
              Scientific Grounding matches are powered by Google Search. Claims are continuously updated as clinical trial results register. Check active medication changes with primary physio-caretakers.
            </div>

          </div>
        )}

        {!loading && !result && (
          <div className="glass-panel p-10 bg-bg-surface/20 flex flex-col justify-center items-center text-center py-20 text-text-dim border-dashed border-border-dim flex-1">
            <BookmarkCheck className="w-12 h-12 mb-3.5 text-text-dim/50" />
            <p className="font-orbitron text-xs font-semibold uppercase tracking-wider">Awaiting dynamic health claims verify...</p>
            <p className="text-xs text-text-dim mt-1 max-w-sm">Type any medical folklore, ingredient claims or click on one of the quick preset questions below to explore.</p>
          </div>
        )}

      </div>

    </div>
  );
}
export { STANDARD_MYTH_PRESETS };
