import { useState } from "react";
import Home from "./components/pages/Home";
import SymptomChecker from "./components/pages/SymptomChecker";
import MedicineScanner from "./components/pages/MedicineScanner";
import VoiceInput from "./components/pages/VoiceInput";
import HospitalFinder from "./components/pages/HospitalFinder";
import FactChecker from "./components/pages/FactChecker";
import Emergency from "./components/pages/Emergency";
import AIAssistant from "./components/AIAssistant";
import { useLanguage, LANGUAGES } from "./context/LanguageContext";
import { useTheme } from "./context/ThemeContext";

import { BodyRegion } from "./types";
import { BODY_REGIONS } from "./components/3d/HumanBodyCanvas";
import {
  Pill, Activity, ShieldAlert, Speech, HelpCircle,
  Siren, Globe, Sun, Moon, Hospital
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [selectedTriageRegion, setSelectedTriageRegion] = useState<BodyRegion | null>(null);

  const handleNavigateToTab = (tabId: string, _extraState?: any) => {
    setActiveTab(tabId);
  };

  const handleStartTriage = (region?: BodyRegion) => {
    setSelectedTriageRegion(region || BODY_REGIONS[0]);
    setActiveTab("symptom");
  };

  const handleTriageRegionSelect = (region: BodyRegion, _customSymptom: string) => {
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
      case "hospitals-map":
        return <Emergency />;
      case "medicine":
        return <MedicineScanner />;
      case "voice":
        return <VoiceInput onTriageRegionSelect={handleTriageRegionSelect} />;
      case "hospitals":
        return <HospitalFinder />;
      case "fact":
        return <FactChecker />;
      default:
        return <Home onStartTriage={handleStartTriage} onNavigateToTab={handleNavigateToTab} />;
    }
  };

  const navItems = [
    { id: "home",      label: "Dashboard",       icon: Activity },
    { id: "symptom",   label: "Symptom Check",   icon: ShieldAlert },
    { id: "emergency", label: "Emergency",        icon: Siren, danger: true },
    { id: "hospitals", label: "Find Hospital",    icon: Hospital },
    { id: "medicine",  label: "Medicine Info",    icon: Pill },
    { id: "voice",     label: "Voice Symptoms",   icon: Speech },
    { id: "fact",      label: "Fact Checker",     icon: HelpCircle },
  ];

  const isActiveTab = (id: string) =>
    activeTab === id || (id === "emergency" && activeTab === "hospitals-map");

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-void)",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Ambient glows */}
      <div style={{
        position: "fixed", top: "5%", left: "5%", width: 500, height: 500,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 65%)",
        filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "5%", right: "5%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.03) 0%, transparent 65%)",
        filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "16px 20px", position: "relative", zIndex: 50 }}>
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "10px 16px", boxShadow: "var(--shadow-md)", gap: 12,
        }}>

          {/* Logo */}
          <button
            onClick={() => handleNavigateToTab("home")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--accent-muted)", border: "1px solid var(--border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 50 50" style={{ width: 20, height: 20, stroke: "var(--accent)", fill: "none", strokeWidth: 2.5 }}>
                <path d="M 0,25 L 12,25 L 18,10 L 22,40 L 26,25 L 50,25" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18,
                color: "var(--text-primary)", display: "block", lineHeight: 1,
              }}>
                MediGuide
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "var(--accent)", display: "block", marginTop: 2,
              }}>
                {t("portal_subtitle")}
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div style={{
            display: "none", alignItems: "center", gap: 2,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 4,
          }} className="lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveTab(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateToTab(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
                    transition: "all 0.2s",
                    background: active
                      ? item.danger ? "var(--red-alert)" : "var(--accent)"
                      : "transparent",
                    color: active ? "white" : item.danger ? "var(--red-alert)" : "var(--text-secondary)",
                    boxShadow: active && item.danger ? "0 2px 10px rgba(239,68,68,0.3)"
                      : active ? "var(--shadow-accent)" : "none",
                  }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  <span style={{ display: "none" }} className="xl:block">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              {theme === "dark"
                ? <Sun style={{ width: 16, height: 16, color: "var(--amber-warn)" }} />
                : <Moon style={{ width: 16, height: 16 }} />
              }
            </button>

            {/* Language */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "1px solid var(--border-strong)", borderRadius: 10, padding: "6px 10px",
              background: "var(--bg-elevated)",
            }}>
              <Globe style={{ width: 14, height: 14, color: "var(--text-dim)", flexShrink: 0 }} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                style={{
                  background: "transparent", border: "none", fontSize: 12,
                  fontWeight: 600, color: "var(--text-secondary)", outline: "none",
                  cursor: "pointer",
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}
                    style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency CTA */}
            <a
              href="tel:108"
              className="btn-danger"
              style={{ padding: "8px 16px", fontSize: 12, borderRadius: 10, gap: 6 }}
            >
              <Siren style={{ width: 14, height: 14 }} />
              <span>108</span>
            </a>
          </div>
        </nav>

        {/* Mobile Nav */}
        <div style={{
          display: "flex", gap: 6, marginTop: 10, overflowX: "auto",
          paddingBottom: 4, scrollbarWidth: "none",
        }} className="lg:hidden no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveTab(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigateToTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11,
                  whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
                  background: active
                    ? item.danger ? "var(--red-alert)" : "var(--accent)"
                    : "var(--bg-surface)",
                  color: active ? "white"
                    : item.danger ? "var(--red-alert)" : "var(--text-secondary)",
                  border: active ? "none" : "1px solid var(--border)",
                }}
              >
                <Icon style={{ width: 13, height: 13 }} />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1, width: "100%", maxWidth: 1280,
        margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 10,
      }}>
        {renderActivePage()}
      </main>

      <AIAssistant />

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        width: "100%", maxWidth: 1280, margin: "0 auto",
        padding: "24px 20px", textAlign: "center", position: "relative", zIndex: 20,
        borderTop: "1px solid var(--border)",
      }}>
        <p style={{ fontSize: 12, color: "var(--text-dim)" }}>{t("footer_text_1")}</p>
        <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{t("footer_text_2")}</p>
      </footer>
    </div>
  );
}
