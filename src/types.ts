export interface ConditionMatch {
  name: string;
  probability: number;
  explanation: string;
  urgency: "Critical" | "High" | "Moderate" | "Low";
}

export interface SymptomAnalysisResult {
  emergency: boolean;
  emergencyReason: string;
  conditions: ConditionMatch[];
  dynamicTips: string[];
  recommendedSpecialties: string[];
}

export interface DrugInteraction {
  drug: string;
  risk: string;
}

export interface MedicineDetails {
  name: string;
  generic: string;
  verified: boolean;
  dosage: string;
  frequency: string;
  sideEffects: string;
  contraindications: string;
  interactions: DrugInteraction[];
}

export interface VoiceMappingResult {
  mappedTerm: string;
  detectedSymptoms: string[];
  suggestedRegion: string;
}

export interface GroundingCitation {
  title: string;
  url: string;
}

export interface FactCheckResult {
  claim: string;
  analysis: string;
  citations: GroundingCitation[];
}

export interface BodyRegion {
  id: string;
  label: string;
  color: string;
  icon: string;
  symptoms: string[];
  description: string;
}

export interface VitalSign {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: "normal" | "stable" | "elevated" | "warning";
  history: number[];
  icon: string;
}

export interface LabResult {
  name: string;
  value: number;
  unit: string;
  normalRange: string;
  min: number;
  max: number;
  normalStartPct: number;
  normalWidthPct: number;
  positionPct: number;
  status: "low" | "normal" | "high";
  statusColor: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
  color: string;
  category: "scan" | "treatment" | "vitals" | "prescription";
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: number;
  available: boolean;
  nextSlot: string;
  initials: string;
  phone: string;
}
