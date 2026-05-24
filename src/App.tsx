import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Home from "./components/pages/Home";
import SymptomChecker from "./components/pages/SymptomChecker";
import MedicineScanner from "./components/pages/MedicineScanner";
import VoiceInput from "./components/pages/VoiceInput";
import FactChecker from "./components/pages/FactChecker";
import Emergency from "./components/pages/Emergency";
import NearbyHospitalsMap from "./components/pages/NearbyHospitalsMap";
import AIAssistant from "./components/AIAssistant";
import { useLanguage, LANGUAGES } from "./context/LanguageContext";
import { useTheme } from "./context/ThemeContext";

import { BodyRegion } from "./types";
import { BODY_REGIONS } from "./components/3d/HumanBodyCanvas";
import {
  Pill, Activity, ShieldAlert, Speech, HelpCircle,
  Siren, Globe, Sun, Moon, MapPin, ChevronDown
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const { language, setLanguage, t, activeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [selectedTriageRegion, setSelectedTriageRegion] = useState<BodyRegion | null>(null);

  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartTriage = (region?: BodyRegion) => {
    setSelectedTriageRegion(region || BODY_REGIONS[0]);
    setActiveTab("symptom");
  };

  const handleTriageRegionSelect = (region: BodyRegion) => {
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
      case "hospitals":
        return <NearbyHospitalsMap />;
      case "fact":
        return <FactChecker />;
      default:
        return <Home onStartTriage={handleStartTriage} onNavigateToTab={handleNavigateToTab} />;
    }
  };

  const navItems = [
    { id: "home",      label: t("home"),           icon: Activity },
    { id: "symptom",   label: t("nav_triage_check"), icon: ShieldAlert },
    { id: "hospitals", label: t("nav_hospitals_map"), icon: MapPin },
    { id: "medicine",  label: t("nav_rx_scanner"), icon: Pill },
    { id: "voice",     label: t("nav_vocal_synth"), icon: Speech },
    { id: "fact",      label: t("nav_fact_audit"),   icon: HelpCircle },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-mesh-glow" />

      {/* ── Wide Modern Header ────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-blur h-24 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.1)] border-b border-white/5">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Logo Section */}
          <button
            onClick={() => handleNavigateToTab("home")}
            className="flex items-center gap-4 cursor-pointer border-none bg-transparent group"
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-accent to-blue rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:rotate-6 transition-all duration-300">
              <Activity className="w-7 h-7 text-black" />
            </div>
            <div className="text-left hidden md:block">
              <span className="font-display font-black text-2xl tracking-tighter text-text-primary block leading-none">
                MediGuide
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-black mt-1 block">
                {t("portal_subtitle")}
              </span>
            </div>
          </button>

          {/* Navigation Section */}
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[22px] hidden lg:flex border border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateToTab(item.id)}
                  className={`relative flex items-center gap-2.5 px-5 py-3 rounded-[18px] font-bold text-sm transition-all border-none cursor-pointer group ${
                    active
                    ? "bg-accent text-black shadow-xl shadow-accent/10"
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`} />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-accent rounded-[18px] -z-10 blur-sm opacity-20"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Utility Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-secondary border-none cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-amber-warn" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-3 bg-accent/10 p-1.5 rounded-2xl border border-accent/20 hover:border-accent/40 transition-all group">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                <Globe className="w-4 h-4 text-black" />
              </div>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="language-select bg-transparent text-sm font-black text-accent uppercase tracking-widest outline-none border-none cursor-pointer appearance-none pr-8 font-display"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-bg-surface text-white py-2">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-accent pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
              </div>
            </div>

            <button
              onClick={() => handleNavigateToTab("emergency")}
              className={`px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all shadow-lg border-none cursor-pointer group ${
                activeTab === "emergency"
                ? "bg-white text-red-alert"
                : "bg-red-alert text-white shadow-red-alert/30 hover:brightness-110 active:scale-95"
              }`}
            >
              <Siren className="w-5 h-5 animate-pulse group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline uppercase tracking-widest">108 SOS</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-36 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderActivePage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AIAssistant />

      {/* ── Modern Bottom Nav (Mobile) ─────────────────────────── */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="nav-blur rounded-[32px] p-2.5 flex items-center justify-around shadow-2xl border border-white/10 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigateToTab(item.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-none bg-transparent cursor-pointer ${
                  active ? "text-accent" : "text-text-dim"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? "scale-125" : ""} transition-all duration-300`} />
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-0 h-0 data-[active=true]:opacity-100 data-[active=true]:h-auto transition-all" data-active={active}>
                  {item.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
