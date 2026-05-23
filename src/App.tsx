import { useState } from "react";
import Home from "./components/pages/Home";
import SymptomChecker from "./components/pages/SymptomChecker";
import MedicineScanner from "./components/pages/MedicineScanner";
import VoiceInput from "./components/pages/VoiceInput";
import FindDoctor from "./components/pages/FindDoctor";
import FactChecker from "./components/pages/FactChecker";
import Emergency from "./components/pages/Emergency";
import AIAssistant from "./components/AIAssistant";
import { useLanguage, LANGUAGES } from "./context/LanguageContext";

import { BodyRegion } from "./types";
import { BODY_REGIONS } from "./components/3d/HumanBodyCanvas";
import { Pill, Activity, ShieldAlert, Heart, CalendarPlus, Speech, HelpCircle, Siren, Globe } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const { language, setLanguage, t } = useLanguage();
  
  // Contextual params shared among pages
  const [selectedTriageRegion, setSelectedTriageRegion] = useState<BodyRegion | null>(null);
  const [initialClinicSpecialty, setInitialClinicSpecialty] = useState<string | null>(null);

  // Transitions Tab with extra state
  const handleNavigateToTab = (tabId: string, extraState?: any) => {
    if (extraState?.specialty) {
      setInitialClinicSpecialty(extraState.specialty);
    } else {
      setInitialClinicSpecialty(null);
    }
    setActiveTab(tabId);
  };

  // Launch symptom checker immediately for a region
  const handleStartTriage = (region?: BodyRegion) => {
    setSelectedTriageRegion(region || BODY_REGIONS[0]);
    setActiveTab("symptom");
  };

  const handleTriageRegionSelect = (region: BodyRegion, customSymptom: string) => {
    setSelectedTriageRegion(region);
    setActiveTab("symptom");
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case "home":
        return <Home onStartTriage={handleStartTriage} onNavigateToTab={handleNavigateToTab} />;
      case "symptom":
        return (
          <SymptomChecker 
            initialRegion={selectedTriageRegion} 
            onNavigateToTab={handleNavigateToTab} 
          />
        );
      case "emergency":
        return <Emergency />;
      case "medicine":
        return <MedicineScanner />;
      case "voice":
        return <VoiceInput onTriageRegionSelect={handleTriageRegionSelect} />;
      case "doctors":
        return <FindDoctor initialSpecialtyFilter={initialClinicSpecialty} />;
      case "fact":
        return <FactChecker />;
      default:
        return <Home onStartTriage={handleStartTriage} onNavigateToTab={handleNavigateToTab} />;
    }
  };

  const navigationItems = [
    { id: "home", label: t("nav_scanner_hub"), icon: Activity },
    { id: "symptom", label: t("nav_triage_check"), icon: ShieldAlert },
    { id: "emergency", label: t("nav_emergency_er"), icon: Siren },
    { id: "medicine", label: t("nav_rx_scanner"), icon: Pill },
    { id: "voice", label: t("nav_vocal_synth"), icon: Speech },
    { id: "doctors", label: t("nav_schedules"), icon: CalendarPlus },
    { id: "fact", label: t("nav_fact_audit"), icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-bg-void overflow-x-hidden relative flex flex-col justify-between select-none">
      
      {/* Background ambient medical visual waves */}
      <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full ambient-glow-mesh-teal filter blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] rounded-full ambient-glow-mesh-center filter blur-[100px] pointer-events-none select-none z-0" />

      <header className="w-full max-w-7xl mx-auto px-4 py-4 relative z-50">
        
        {/* Holographic glowing translucency Navigation bar */}
        <nav className="navbar glass-panel px-6 py-3.5 flex items-center justify-between rounded-2xl bg-white/70 shadow-sm gap-4">
          
          <button 
            id="logo-button"
            onClick={() => handleNavigateToTab("home")}
            className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02] cursor-pointer text-left bg-transparent border-0"
          >
            {/* Animated electrocardiogram pulse SVG branding block */}
            <div className="w-9 h-9 rounded-xl bg-teal-glow/10 border border-teal-glow/30 flex items-center justify-center animate-pulse">
              <svg viewBox="0 0 50 50" className="w-[22px] h-[22px] stroke-teal-glow fill-none stroke-[2.5]">
                <path d="M 0,25 L 12,25 L 18,10 L 22,40 L 26,25 L 50,25" />
              </svg>
            </div>
            
            <div className="leading-none">
              <span className="font-orbitron font-black text-lg tracking-wider bg-gradient-to-r from-text-primary via-teal-glow to-blue-electric bg-clip-text text-transparent block">
                MediGuide
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0ea5e9] mt-1 block font-semibold">
                {t("portal_subtitle")}
              </span>
            </div>
          </button>

          {/* Scrolling visual indicators for desktops */}
          <div className="hidden lg:flex items-center gap-1 bg-bg-void/45 border border-border-dim rounded-xl p-1 shrink-0 bg-white shadow-sm">
            {navigationItems.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              const isEmergency = tab.id === "emergency";
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigateToTab(tab.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-orbitron font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? isEmergency 
                        ? "bg-red-alert text-white font-bold shadow-[0_4px_10px_rgba(220,38,38,0.25)]"
                        : "bg-teal-glow text-white font-bold shadow-[0_4px_10px_rgba(8,145,178,0.2)]"
                      : isEmergency
                      ? "text-red-alert hover:bg-red-alert/10"
                      : "bg-transparent text-[#475569] hover:text-text-primary hover:bg-bg-surface/50"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isEmergency && !isSelected ? "animate-pulse" : ""}`} />
                  <span className="hidden xl:inline text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            
            {/* Holographic Glowing Language Dropdown Selector */}
            <div className="flex items-center gap-1.5 border border-border-dim rounded-xl p-1 px-2.5 bg-white shadow-sm font-sans shrink-0 hover:border-teal-glow/50 transition-colors">
              <Globe className="w-3.5 h-3.5 text-[#475569]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent border-none text-[11px] font-bold text-[#475569] hover:text-[#0f172a] focus:outline-none cursor-pointer p-0.5"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white text-text-primary font-semibold text-xs">
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="emergency-btn-header"
              onClick={() => handleNavigateToTab("emergency")}
              className="px-3.5 py-2 rounded-xl bg-red-alert hover:bg-red-alert/95 border-0 text-white font-orbitron font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(220,38,38,0.2)] flex items-center gap-1.5"
            >
              <Siren className="w-3.5 h-3.5 text-white animate-pulse animate-duration-1000" />
              <span>{t("emergencies_btn")}</span>
            </button>
          </div>

        </nav>

        {/* Small screen navigation drop-downs */}
        <div className="lg:hidden flex items-center gap-1 mt-3 overflow-x-auto py-1.5 px-0.5 no-scrollbar scroll-smooth">
          {navigationItems.map((tab) => {
            const isSelected = activeTab === tab.id;
            const isEmergency = tab.id === "emergency";
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigateToTab(tab.id)}
                className={`flex-1 py-2 px-3 whitespace-nowrap rounded-xl text-[10px] font-orbitron font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? isEmergency
                      ? "bg-red-alert text-white shadow-md"
                      : "bg-teal-glow text-white shadow-md"
                    : isEmergency
                    ? "bg-red-alert/10 text-red-alert border border-red-alert/20"
                    : "bg-bg-surface/50 text-[#475569] border border-border-dim"
                }`}
              >
                <tab.icon className="w-3 h-3 text-current shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </header>

      {/* Primary responsive page view */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 relative z-10">
        {renderActivePage()}
      </main>

      {/* Real-time floating AI Assistant Co-Pilot panel */}
      <AIAssistant />

      {/* Styled futuristic footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-6 text-center relative z-20 border-t border-border-dim/20">
        <p className="text-xs text-[#64748b]">
          {t("footer_text_1")}
        </p>
        <p className="text-[11px] text-[#94a3b8] mt-1.5">
          {t("footer_text_2")}
        </p>
      </footer>

    </div>
  );
}
