import { VitalSign, LabResult, TimelineEvent, Doctor } from "../types";

export const INITIAL_VITALS: VitalSign[] = [
  {
    id: "hr",
    label: "Pulmonary Rate",
    value: "72",
    unit: "bpm",
    status: "normal",
    history: [70, 72, 75, 71, 74, 72, 73],
    icon: "❤️"
  },
  {
    id: "bo",
    label: "SpO₂ Saturation",
    value: "98",
    unit: "%",
    status: "normal",
    history: [98, 98, 99, 97, 98, 98, 98],
    icon: "🫁"
  },
  {
    id: "bp",
    label: "Arterial Pressure",
    value: "118/76",
    unit: "mmHg",
    status: "normal",
    history: [116, 120, 118, 115, 119, 118, 117],
    icon: "💪"
  },
  {
    id: "bg",
    label: "Serum Glucose",
    value: "94",
    unit: "mg/dL",
    status: "normal",
    history: [92, 95, 101, 89, 94, 98, 94],
    icon: "🩸"
  },
  {
    id: "temp",
    label: "Thermal Core",
    value: "98.4",
    unit: "°F",
    status: "normal",
    history: [98.2, 98.4, 98.6, 98.3, 98.5, 98.4, 98.4],
    icon: "🌡️"
  }
];

export const LAB_RESULTS: LabResult[] = [
  {
    name: "Hemoglobin Hb",
    value: 14.8,
    unit: "g/dL",
    normalRange: "13.8 - 17.2",
    min: 10,
    max: 20,
    normalStartPct: 38,
    normalWidthPct: 34,
    positionPct: 48,
    status: "normal",
    statusColor: "#39ff5a"
  },
  {
    name: "White Blood Cells (WBC)",
    value: 10.4,
    unit: "x10^3/µL",
    normalRange: "4.5 - 11.0",
    min: 2,
    max: 18,
    normalStartPct: 15,
    normalWidthPct: 41,
    positionPct: 52,
    status: "normal",
    statusColor: "#39ff5a"
  },
  {
    name: "Serum Creatinine",
    value: 1.45,
    unit: "mg/dL",
    normalRange: "0.60 - 1.20",
    min: 0,
    max: 2.5,
    normalStartPct: 24,
    normalWidthPct: 24,
    positionPct: 58,
    status: "high",
    statusColor: "#ffc244" // elevated amber
  },
  {
    name: "C-Reactive Protein (CRP)",
    value: 0.8,
    unit: "mg/L",
    normalRange: "0.0 - 3.0",
    min: 0,
    max: 15,
    normalStartPct: 0,
    normalWidthPct: 20,
    positionPct: 6,
    status: "normal",
    statusColor: "#39ff5a"
  },
  {
    name: "Serum Potassium",
    value: 3.1,
    unit: "mEq/L",
    normalRange: "3.5 - 5.1",
    min: 2.0,
    max: 6.5,
    normalStartPct: 33,
    normalWidthPct: 36,
    positionPct: 24,
    status: "low",
    statusColor: "#ff3d3d" // critical low
  }
];

export const MEDICAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "2026-05-18",
    title: "Optical Core Imaging Update",
    detail: "Bilateral laser scan of retinal plexus. Conduction pathways stable.",
    color: "#00f3ff",
    category: "scan"
  },
  {
    date: "2026-04-10",
    title: "Myocardial Scan Retraction",
    detail: "Echocardiogram recorded normal left ventricular throughput (EF: 62%).",
    color: "#00f3ff",
    category: "vitals"
  },
  {
    date: "2026-03-01",
    title: "CDSCO Prescription Auth",
    detail: "Pharmacotherapy update: Formulated beta-blocker dosage set to 25mg daily.",
    color: "#ffc244",
    category: "prescription"
  },
  {
    date: "2025-11-22",
    title: "Thoracic Synapse Audit",
    detail: "Electro-physical screening detected minor lower back posture nerve pinch.",
    color: "#10b981",
    category: "treatment"
  }
];

export const NEARBY_DOCTORS: Doctor[] = [
  {
    id: "doc_01",
    name: "Dr. Vikram Sarabhai",
    specialty: "Emergency Medicine Specialist",
    rating: 4.9,
    distance: 1.4,
    available: true,
    nextSlot: "Immediate",
    initials: "VS",
    phone: "+91 98765 43210"
  },
  {
    id: "doc_02",
    name: "Dr. Ananya Iyer",
    specialty: "Clinical Neurologist & Brain Specialist",
    rating: 4.8,
    distance: 2.8,
    available: true,
    nextSlot: "Today, 4:30 PM",
    initials: "AI",
    phone: "+91 87654 32109"
  },
  {
    id: "doc_03",
    name: "Dr. Joseph Cardoza",
    specialty: "Interventional Cardiologist",
    rating: 4.95,
    distance: 3.1,
    available: false,
    nextSlot: "Tomorrow, 9:00 AM",
    initials: "JC",
    phone: "+91 76543 21098"
  },
  {
    id: "doc_04",
    name: "Dr. Sunita Deshmukh",
    specialty: "Gastroenterologist & Internal Medicine",
    rating: 4.7,
    distance: 4.2,
    available: true,
    nextSlot: "Today, 6:00 PM",
    initials: "SD",
    phone: "+91 65432 10987"
  }
];
