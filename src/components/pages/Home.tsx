import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HumanBodyCanvas, { BODY_REGIONS } from "../3d/HumanBodyCanvas";
import { BodyRegion } from "../../types";
import {
  ShieldAlert,
  Pill,
  Speech,
  HelpCircle,
  Siren,
  X,
  Activity,
  Play,
  ChevronRight,
  MapPin,
  Heart,
  Thermometer,
  ShieldCheck,
  Stethoscope,
  Info,
  Clock,
  ArrowRight,
  AlertTriangle,
  Lock as LockIcon
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface HomeProps {
  onStartTriage: (region?: BodyRegion) => void;
  onNavigateToTab: (tabId: string, extraState?: any) => void;
}

export default function Home({ onStartTriage, onNavigateToTab }: HomeProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [selectedRegionForTriage, setSelectedRegionForTriage] = useState<BodyRegion | null>(null);
  const { t } = useLanguage();

  const services = [
    {
      id: "symptom",
      title: t("nav_triage_check"),
      desc: t("home_desc"),
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
      tag: "Clinical",
      icon: ShieldAlert,
      accent: "var(--accent)",
    },
    {
      id: "hospitals",
      title: t("nav_hospitals_map"),
      desc: t("action_station_dispatch_desc"),
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
      tag: "Live Map",
      icon: MapPin,
      accent: "var(--blue)",
    },
    {
      id: "medicine",
      title: t("nav_rx_scanner"),
      desc: t("action_station_medicine_desc"),
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800",
      tag: "Smart Rx",
      icon: Pill,
      accent: "var(--green-ok)",
    },
    {
      id: "fact",
      title: t("nav_fact_audit"),
      desc: t("action_station_claim_desc"),
      image: "/myth_auditor.png",
      tag: "AI Verified",
      icon: HelpCircle,
      accent: "var(--amber-warn)",
    },
  ];

  const quickStats = [
    { label: t("home_active_symptoms").split(' ')[0] + " Rate", value: "72 bpm", color: "var(--red-alert)", icon: Heart },
    { label: "Oxygen", value: "98%", color: "var(--accent)", icon: Activity },
    { label: "Temp", value: "98.4 °F", color: "var(--amber-warn)", icon: Thermometer }
  ];

  return (
    <div className="space-y-24 animate-fadeIn">
      
      {/* ── 1. Cinematic Hero Section ── */}
      <section className="relative rounded-[36px] overflow-hidden bg-bg-surface/95 border border-white/5 shadow-2xl min-h-[520px] flex items-center p-6 lg:p-12 group">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-bg-surface via-bg-surface/80 to-transparent z-10" />
          <motion.img
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="/symptom_triage.png"
            className="hero-bg-img w-full h-full object-cover brightness-70"
            alt="Clinical healthcare background"
          />
          <div className="absolute inset-0 hero-image-mask z-20" />
          <div className="absolute inset-0 cyber-grid-overlay opacity-20" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 bg-accent/10 border border-accent/30 text-accent rounded-2xl shadow-xl backdrop-blur-md"
          >
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">MediGuide Intelligence v3.0</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl lg:text-5xl font-black tracking-tighter text-text-primary leading-tight"
            >
              Your Health, <br/> <span className="text-accent italic">Reimagined.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-text-secondary font-medium leading-relaxed max-w-lg"
            >
              {t("home_desc")}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button onClick={() => onStartTriage()} className="btn-primary !py-4 !px-8 group relative overflow-hidden border-none">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Play className="w-5 h-5 fill-current relative z-10" />
              <span className="relative z-10 text-sm">{t("initialize_checkup")}</span>
            </button>
            <button onClick={() => onNavigateToTab("emergency")} className="btn-danger !py-4 !px-8 group border-none">
              <Siren className="w-5 h-5 animate-pulse group-hover:rotate-12 transition-transform" />
              <span className="text-sm uppercase tracking-widest">{t("sos_center")}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Interactive 3D Hub ── */}
      <section className="space-y-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                <Stethoscope className="w-6 h-6 text-accent" />
              </div>
              {t("interactive_3d_hub")}
            </h2>
            <p className="text-text-secondary font-medium max-w-xl">
              {t("select_region_desc")}
            </p>
          </div>
          <div className="flex gap-3">
            {BODY_REGIONS.slice(0, 3).map(r => (
              <button
                key={r.id}
                onClick={() => onStartTriage(r)}
                className="px-6 py-2.5 rounded-2xl bg-bg-surface border border-border text-xs font-black uppercase text-text-dim hover:border-accent hover:text-white transition-all cursor-pointer shadow-lg"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card !p-0 min-h-[520px] relative overflow-hidden bg-[#0A0D14] border-2 border-white/5 flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.03)_0%,transparent_70%)]" />

          <HumanBodyCanvas
            onRegionHover={setHoveredRegion}
            onRegionSelect={(reg) => setSelectedRegionForTriage(reg)}
            selectedRegionId={hoveredRegion?.id || null}
          />

          <AnimatePresence>
            {hoveredRegion && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className="absolute z-10 w-full max-w-sm bottom-6 left-4 sm:top-10 sm:right-10 sm:left-auto sm:bottom-auto sm:w-80 bg-bg-elevated/95 border border-accent/40 p-5 sm:p-6 rounded-[32px] shadow-3xl backdrop-blur-3xl"
              >
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-4xl p-3 bg-accent/10 rounded-3xl border border-accent/20 shadow-inner">{hoveredRegion.icon}</span>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{hoveredRegion.label}</h3>
                    <p className="text-[10px] uppercase font-black text-accent tracking-[0.3em] mt-2">{t("region_active")}</p>
                  </div>
                </div>
                <p className="text-base text-text-secondary font-medium leading-relaxed mb-6">{hoveredRegion.description}</p>
                <button
                  onClick={() => setSelectedRegionForTriage(hoveredRegion)}
                  className="w-full btn-primary !py-4 justify-center shadow-2xl shadow-accent/20 group border-none"
                >
                  <span className="group-hover:scale-110 transition-transform">{t("begin_analysis")}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Viewport HUD decoration */}
          <div className="absolute bottom-8 left-8 p-6 bg-black/40 backdrop-blur-md rounded-[32px] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-ok animate-ping" />
              <span className="font-mono text-[10px] text-white uppercase font-black tracking-widest">{t("active_sensor")}</span>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <p className="text-[8px] uppercase font-black text-text-dim">Resolution</p>
                <p className="text-xs font-mono font-bold text-accent">8K HDR</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase font-black text-text-dim">Latency</p>
                <p className="text-xs font-mono font-bold text-accent">12ms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Health Services Matrix ── */}
      <section className="space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-black text-white tracking-tight uppercase">Specialized <span className="text-accent">Clinical Modules</span></h2>
          <p className="text-xl text-text-secondary font-medium leading-relaxed">
            Our diagnostic suites utilize state-of-the-art neural networks to provide accurate and personalized healthcare assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((svc) => (
            <motion.div
              key={svc.id}
              whileHover={{ y: -10 }}
              onClick={() => onNavigateToTab(svc.id)}
              className="group cursor-pointer rounded-[32px] overflow-hidden bg-bg-surface border border-white/5 hover:border-accent/40 shadow-xl transition-all duration-500"
            >
              <div className="h-52 relative overflow-hidden">
                <img src={svc.image} alt={svc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent opacity-60" />
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-black text-white uppercase tracking-widest border border-white/10 shadow-xl">
                    {svc.tag}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-bg-void border border-white/5 group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-300 shadow-inner">
                    <svc.icon className="w-6 h-6 text-text-secondary group-hover:text-accent group-hover:scale-110 transition-all duration-300" />
                  </div>
                  <h4 className="text-xl font-black text-white group-hover:text-accent transition-colors tracking-tighter leading-none">{svc.title}</h4>
                </div>
                <p className="text-sm text-text-secondary font-medium leading-relaxed">{svc.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-accent opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">{t("initialize_module")}</span>
                  <ChevronRight className="w-6 h-6 text-text-dim group-hover:text-accent transition-all duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. Live Body Telemetrics ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((st) => (
          <div key={st.label} className="card !p-6 flex items-center justify-between !bg-bg-surface/50 border border-white/5 group hover:border-accent/30 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <st.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim">{st.label}</p>
              <p className="text-4xl font-display font-black text-white group-hover:text-accent transition-colors tracking-tighter">{st.value}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: st.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 group-hover:opacity-100 transition-opacity">{t("active_sensor")}</span>
              </div>
            </div>
            <div className="relative z-10 w-16 h-16 rounded-[28px] bg-bg-void flex items-center justify-center border border-white/5 shadow-2xl group-hover:scale-110 transition-all duration-500">
              <st.icon className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-all" style={{ color: st.color }} />
            </div>
          </div>
        ))}
      </section>

      {/* ── 5. Information & Safety Sections ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
        <div className="card !p-6 bg-accent/5 border-accent/20 flex gap-6 items-start shadow-accent/5">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 shadow-inner">
            <Info className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t("how_it_works_title")}</h3>
            <p className="text-base text-text-secondary font-medium leading-relaxed">
              {t("how_it_works_desc")}
            </p>
          </div>
        </div>

        <div className="card !p-6 bg-amber-warn/5 border-amber-warn/20 flex gap-6 items-start shadow-amber-warn/5">
          <div className="w-16 h-16 rounded-3xl bg-amber-warn/10 flex items-center justify-center shrink-0 border border-amber-warn/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-warn" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t("clinical_safety_title")}</h3>
            <p className="text-base text-text-secondary font-medium leading-relaxed">
              {t("clinical_safety_desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. Emergency Reminder Banner ── */}
      <section className="rounded-[32px] p-8 bg-red-alert/5 border border-red-alert/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-alert/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-[28px] bg-red-alert/10 flex items-center justify-center shrink-0 border border-red-alert/20 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-red-alert animate-bounce" />
          </div>
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t("emergency_title")}</h4>
            <p className="text-base text-text-secondary font-medium leading-relaxed max-w-xl">
              {t("emergency_desc")}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab("emergency")}
          className="relative z-10 btn-danger !py-3 !px-8 !text-sm group whitespace-nowrap border-none cursor-pointer"
        >
          <Siren className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <span>{t("launch_emergency_btn")}</span>
        </button>
      </section>

      {/* ── 7. Modern Footer ── */}
      <footer className="pt-24 pb-12 border-t border-white/5 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 px-4">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                <Activity className="w-6 h-6 text-black" />
              </div>
              <span className="font-display font-black text-2xl tracking-tighter text-white">MediGuide</span>
            </div>
            <p className="text-text-secondary font-medium leading-relaxed">
              {t("footer_tagline")}
            </p>
            <div className="flex gap-4 pt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-center group">
                  <div className="w-4 h-4 bg-text-dim group-hover:bg-accent transition-colors rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Nav Column */}
          <div className="space-y-6">
            <h5 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t("action_station_title")}</h5>
            <ul className="space-y-4 list-none p-0">
              {services.map(s => (
                <li key={s.id}>
                  <button onClick={() => onNavigateToTab(s.id)} className="text-text-secondary hover:text-accent font-medium transition-colors cursor-pointer border-none bg-transparent flex items-center gap-2 group p-0">
                    <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-6">
            <h5 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t("resources")}</h5>
            <ul className="space-y-4 list-none p-0">
              {[
                { key: 'safety_center', label: t('safety_center') },
                { key: 'clinical_doc', label: t('clinical_doc') },
                { key: 'data_privacy', label: t('data_privacy') },
                { key: 'terms_of_use', label: t('terms_of_use') },
                { key: 'accessibility', label: t('accessibility') }
              ].map(link => (
                <li key={link.key}>
                  <button className="text-text-secondary hover:text-accent font-medium transition-colors cursor-pointer border-none bg-transparent flex items-center gap-2 group p-0">
                    <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-6">
            <h5 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t("system_health_title")}</h5>
            <div className="card !p-6 bg-green-ok/5 border-green-ok/20 space-y-4 shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-green-ok">{t("all_systems_go")}</span>
                <div className="w-2 h-2 rounded-full bg-green-ok animate-pulse" />
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed font-bold">
                {t("system_latency_desc")}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-black text-text-dim uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              <span>{t("updated_ago")}</span>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <p className="text-xs text-text-dim font-bold uppercase tracking-widest">
            {t("copyright")}
          </p>
          <div className="flex items-center gap-8 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              {t("gdpr_compliant")}
            </span>
            <span className="flex items-center gap-2">
              <LockIcon className="w-3.5 h-3.5 text-accent" />
              {t("aes_encryption")}
            </span>
          </div>
        </div>
      </footer>

      {/* Central Dialog for Region Triage */}
      <AnimatePresence>
        {selectedRegionForTriage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-void/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-xl bg-bg-surface border-2 border-white/10 rounded-[40px] p-12 shadow-[0_0_120px_rgba(0,0,0,0.55)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-52 h-52 bg-accent/5 rounded-full blur-[80px] -mr-24 -mt-24" />

              <button
                onClick={() => setSelectedRegionForTriage(null)}
                className="absolute top-6 right-6 p-3 rounded-3xl hover:bg-white/5 text-text-dim hover:text-white transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="text-6xl w-24 h-24 bg-accent/10 rounded-[36px] flex items-center justify-center border border-accent/20 shadow-inner">
                    {selectedRegionForTriage.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {selectedRegionForTriage.label}
                    </h3>
                    <p className="text-[10px] uppercase font-black text-accent tracking-[0.4em]">{t("region_active")}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">Clinical Description</p>
                    <p className="text-base text-text-secondary font-medium leading-relaxed">
                      {selectedRegionForTriage.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">Indexed Indications</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegionForTriage.symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-sm bg-bg-void border border-white/10 text-white font-black px-4 py-2 rounded-2xl shadow-xl"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t border-white/10">
                    <button
                      onClick={() => {
                        onStartTriage(selectedRegionForTriage);
                        setSelectedRegionForTriage(null);
                      }}
                      className="btn-primary !py-4 !text-base shadow-2xl shadow-accent/20 border-none cursor-pointer"
                    >
                      <ShieldAlert className="w-6 h-6" />
                      Run Clinical Audit
                    </button>

                    <button
                      onClick={() => {
                        onNavigateToTab("voice");
                        setSelectedRegionForTriage(null);
                      }}
                      className="btn-secondary !py-4 !text-base !bg-bg-void flex items-center justify-center gap-4 border-none cursor-pointer"
                    >
                      <Speech className="w-6 h-6 animate-pulse" />
                      Vocal Intake
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
