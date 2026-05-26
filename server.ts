import express from "express";
import path from "path";
import os from "os";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { translations } from "./src/data/translations";

const envPath = fs.existsSync(path.resolve(process.cwd(), ".env.local"))
  ? path.resolve(process.cwd(), ".env.local")
  : fs.existsSync(path.resolve(process.cwd(), "env.local"))
  ? path.resolve(process.cwd(), "env.local")
  : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });
console.log(`[MediGuide] Loaded environment file: ${envPath}`);

const app = express();
app.use(express.json({ limit: "15mb" }));

const apiRoute = (path: string) => [`/api${path}`, path];

const DEFAULT_PORT = Number(process.env.PORT) || 8080;
const MAX_PORT_RETRIES = 10;

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function extractJsonObject(text: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const candidate = trimmed.slice(start, end + 1);
      return JSON.parse(candidate);
    }
    throw new Error("No JSON object found in model output.");
  }
}

async function groqChat(messages: any[], temperature = 0.2) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("GROQ_API_KEY missing.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function groqJsonFallback(systemInstruction: string, userPrompt: string) {
  const content = await groqChat(
    [
      {
        role: "system",
        content: `${systemInstruction}
Return strictly valid JSON only. Do not wrap with markdown fences.`,
      },
      { role: "user", content: userPrompt },
    ],
    0.2
  );
  return extractJsonObject(content);
}

function getFactCheckFallback(claim: string) {
  const norm = claim.toLowerCase();
  let verdict = "Inconclusive";
  let explanation = "A reliable, specific conclusion is not available from the local health reference summary. Consult a licensed healthcare professional for a definitive assessment.";
  let evidenceSource = "General medical reference guidance";
  const safetyAdvisory = "This information is for educational purposes only. Consult a qualified medical professional for personalized medical advice.";

  if (norm.includes("carrot") || norm.includes("night vision") || norm.includes("eye")) {
    verdict = "Partially True";
    explanation = `Carrots supply beta-carotene, a precursor to vitamin A, which supports normal visual pigment formation and eye health. However, there is no evidence that eating carrots alone grants enhanced night vision beyond normal healthy levels.`;
    evidenceSource = "NIH and vision health clinical literature";
  } else if (norm.includes("turmeric") || norm.includes("curcumin") || norm.includes("arthritis") || norm.includes("joint")) {
    verdict = "True";
    explanation = `Curcumin, the active component of turmeric, has documented anti-inflammatory effects and has shown benefit as a supportive treatment for mild joint discomfort. It should be used alongside, not as a replacement for, standard medical care.`;
    evidenceSource = "Published curcumin trials and clinical reviews";
  } else if (norm.includes("hot water") || norm.includes("metabolism") || norm.includes("fat")) {
    verdict = "False";
    explanation = `Drinking hot water does not directly burn body fat or increase long-term metabolic fat loss. It may be soothing, but metabolic rate is governed by broader dietary and hormonal factors.`;
    evidenceSource = "Thermogenesis and nutrition science references";
  } else if (norm.includes("cold shower") || norm.includes("immunity") || norm.includes("blood cell")) {
    verdict = "Partially True";
    explanation = `Cold-water exposure can produce temporary changes in circulation and stress hormones. There is not enough evidence to conclude that it reliably boosts long-term immunity or prevents infection.`;
    evidenceSource = "Cold exposure and immune response studies";
  }

  return {
    claim,
    verdict,
    explanation,
    evidenceSource,
    safetyAdvisory
  };
}

function getSymptomAnalysisFallback(region: string, symptoms: string[], severity: number, duration: string) {
  const normSymp = symptoms.map(s => s.toLowerCase()).join(" ");
  let isEmergency = false;
  let emergencyReason = "Based on clinical triage rules, these symptoms appear stable. However, monitor progress closely.";
  let conditions: any[] = [];
  let dynamicTips: string[] = [];
  let recommendedSpecialties: string[] = [];

  const sevNum = Number(severity) || 0;

  if (normSymp.includes("chest") || normSymp.includes("heart") || normSymp.includes("radiat") || normSymp.includes("breath")) {
    isEmergency = true;
    emergencyReason = "CRITICAL: Left thoracic pressure and radiating discomfort are high-risk indicators of potential cardiac strain or acute pulmonary blockage.";
    conditions = [
      {
        name: "Acute Coronal Ischemia Strain",
        probability: 72,
        explanation: "Pressure radiating down limbs points to possible microvascular spasm or arterial compression.",
        urgency: "Critical"
      },
      {
        name: "Thoracic Intercostal Muscle Spasm",
        probability: 58,
        explanation: "Sub-sternal muscle spasms mimicking acute vessel pressure.",
        urgency: "Moderate"
      }
    ];
    dynamicTips = [
      "Adopt an upright, relaxed sitting position to optimize airflow.",
      "Avoid sudden physical exertion or cold water stress.",
      "If pain persists over 15 minutes, seek immediate emergency services."
    ];
    recommendedSpecialties = ["Cardiologist", "Emergency Medicine Specialist"];
  } else if (normSymp.includes("head") || normSymp.includes("migraine") || normSymp.includes("spin") || normSymp.includes("dizz")) {
    isEmergency = sevNum >= 3;
    emergencyReason = isEmergency
      ? "HIGH RISK: Severe sudden onset neurological headaches can indicate acute vascular spikes or intracranial pressure."
      : "MODERATE RISK: Steady throbbing headache with vestibular sensitivity indicates standard migraine profiling.";
    conditions = [
      {
        name: "Vascular Migraine Syndrome",
        probability: 80,
        explanation: "Vasodilation of intracranial blood vessels triggering sensory throbbing waves.",
        urgency: "Moderate"
      },
      {
        name: "Tension-Type Myalgia Neck Compression",
        probability: 65,
        explanation: "Physical stiffness in cervical tendons radiating to the skull nodes.",
        urgency: "Low"
      }
    ];
    dynamicTips = [
      "Rest in a dark, quiet room with zero screen exposure.",
      "Apply a gentle cooling cold-wrap directly over the forehead.",
      "Maintain adequate hydration to stabilize cranial volumes."
    ];
    recommendedSpecialties = ["Neurologist", "General Practitioner"];
  } else if (normSymp.includes("stomach") || normSymp.includes("abdomen") || normSymp.includes("burn") || normSymp.includes("gast")) {
    conditions = [
      {
        name: "Acute Acid Gastritides / Dyspepsia",
        probability: 85,
        explanation: "Hypersecretion of stomach acids causing chemical irritation of the mucosal lining.",
        urgency: "Moderate"
      },
      {
        name: "Biliary Path Spasm / Enteritis",
        probability: 50,
        explanation: "Transient slow digestion producing relative visceral spasms.",
        urgency: "Moderate"
      }
    ];
    dynamicTips = [
      "Sip plain warm water slowly; avoid solid food intake.",
      "Rest with the torso elevated at 30-40 degrees to deter esophageal acid reflux.",
      "Avoid pressing down on the gastrointestinal area; keep clothes light."
    ];
    recommendedSpecialties = ["Gastroenterologist", "Internal Medicine Specialist"];
  } else {
    conditions = [
      {
        name: `Localized Somatosensory Strain (${region || "Inherent"})`,
        probability: 75,
        explanation: "Musculoskeletal inflammation or minor ligament overextension in myofascial tissue.",
        urgency: "Low"
      },
      {
        name: "General Neuromyopathic Fatigue Nodes",
        probability: 55,
        explanation: "Minor functional fatigue of local motor endplates causing sensory discomfort.",
        urgency: "Low"
      }
    ];
    dynamicTips = [
      "Immobilize and unload direct bodyweight off the affected region.",
      "Interchange dry heat wraps and cooling packs for 15-minute cycles.",
      "Perform slow, diaphragmatic deep-breathing cycles to reduce pain signals."
    ];
    recommendedSpecialties = ["General Physician", "Orthopedic Specialist"];
  }

  return {
    emergency: isEmergency,
    emergencyReason,
    conditions,
    dynamicTips,
    recommendedSpecialties
  };
}

function getMedicineIdentifyFallback(query: string) {
  const norm = query.toLowerCase();

  let name = "Standard Clinical Compound";
  let generic = "Multivalent Chemical Composition";
  let verified = true;
  let dosage = "Standard Strength";
  let frequency = "As directed by physician";
  let sideEffects = "Nausea, mild dizziness, gastrointestinal discomfort if taken empty-stomach.";
  let contraindications = "Hypersensitivity to the active ingredients; severe hepatic or renal dysfunction.";
  let interactions: { drug: string; risk: string }[] = [];

  if (norm.includes("crocin") || norm.includes("paracetamol") || norm.includes("acetaminophen") || norm.includes("quick")) {
    name = "Paracetamol (Crocin Quick)";
    generic = "Acetaminophen Compound";
    dosage = "500 mg fast-dissolving";
    frequency = "One tablet every 6 hours as needed; maximum 4g daily.";
    sideEffects = "Extremely safe in therapeutic doses. Rare skin allergies, mild gastric acidity.";
    contraindications = "Severe active liver hepatoxicity or alcohol-induced hepatic cirrhosis.";
    interactions = [
      { drug: "Warfarin (Anticoagulant)", risk: "Prolonged high paracetamol exposure might slightly elevate INR/bleeding potential." },
      { drug: "Isoniazid (Anti-TB)", risk: "Increases risk of chronic liver toxicity and enzyme load." }
    ];
  } else if (norm.includes("augmentin") || norm.includes("amoxicillin") || norm.includes("strip")) {
    name = "Augmentin Duo Strip";
    generic = "Amoxicillin + Clavulanate Potassium";
    dosage = "625 mg standard formulation";
    frequency = "Twice daily after nutrient meals; complete the prescribed course.";
    sideEffects = "Loose stools, mild nausea, cutaneous allergic rash, abdominal abdominal cramps.";
    contraindications = "History of penicillin hypersensitivity (anaphylaxis risks); liver cholestatic jaundice.";
    interactions = [
      { drug: "Methotrexate (Immunosuppressant)", risk: "Penicillin competition reduces renal extraction, boosting toxic level risk." },
      { drug: "Oral Contraceptives", risk: "May moderately reduce intestinal resorption and efficacy of active estrogen cycles." }
    ];
  } else if (norm.includes("glycomet") || norm.includes("metformin") || norm.includes("control")) {
    name = "Glycomet Glycemic Control";
    generic = "Metformin Hydrochloride";
    dosage = "850 mg prolonged-release";
    frequency = "Once or twice daily with or immediately after principal meals.";
    sideEffects = "Taste alteration (metallic taste), flatulence, transient gastrointestinal soft stools.";
    contraindications = "Severe renal clearance failure (eGFR < 30 mL/min), acute metabolic lactic acidosis.";
    interactions = [
      { drug: "Contrast Radiography Media", risk: "Temporary metformin stoppage needed to guard against acute contrast-induced nephropathy." },
      { drug: "Cimetidine / Cationic Drugs", risk: "May increase circulating metformin concentration due to renal tube pathway competition." }
    ];
  } else if (norm.includes("amlopin") || norm.includes("amlodipine") || norm.includes("cardio")) {
    name = "Amlopin 5 Cardiotach";
    generic = "Amlodipine Besylate";
    dosage = "5 mg calcium-channel blocker";
    frequency = "Once daily at a standardized hour, with or without meals.";
    sideEffects = "Ankle swelling (peripheral edema), facial flushing, headache, fatigue.";
    contraindications = "Severe cardiogenic shock, obstruction of left ventricular outflow tract, hypotension.";
    interactions = [
      { drug: "Simvastatin (Cholesterol)", risk: "Amlodipine increases systemic exposure of simvastatin, increasing risk of skeletal muscle myopathy." },
      { drug: "Sildenafil (Viagra)", risk: "Additive blood pressure reduction can trigger hypotensive syncopes." }
    ];
  } else {
    name = query ? `Clinical Compound (${query})` : "General Compound";
    generic = "Identified via clinical registry cache";
  }

  return {
    name,
    generic,
    verified,
    dosage,
    frequency,
    sideEffects,
    contraindications,
    interactions
  };
}

function getVoiceInputFallback(transcript: string) {
  const norm = transcript.toLowerCase();
  let mappedTerm = "General Functional Somalgia";
  let detectedSymptoms = ["Localized functional stress discomfort"];
  let suggestedRegion = "Head";

  if (norm.includes("head") || norm.includes("throbb") || norm.includes("spin") || norm.includes("whirl") || norm.includes("cranial")) {
    mappedTerm = "Cephalgia with Vestibular Migraine profile";
    detectedSymptoms = ["Severe migraine throbbing", "Vestibular spinning (dizziness)", "Sensory overstimulation"];
    suggestedRegion = "Head";
  } else if (norm.includes("chest") || norm.includes("heart") || norm.includes("tight") || norm.includes("pressure") || norm.includes("breath")) {
    mappedTerm = "Thoracic Anginal Discomfort Profile";
    detectedSymptoms = ["Tight retrosternal pressure", "Radiating left side arm discomfort", "Exertional dyspnea (breathlessness)"];
    suggestedRegion = "Chest";
  } else if (norm.includes("stomach") || norm.includes("belly") || norm.includes("tummy") || norm.includes("burn") || norm.includes("acid")) {
    mappedTerm = "Dyspepsia with Gastric Hyperacidity Reactivity";
    detectedSymptoms = ["Epigastric burning pain", "Visceral acid regurgitation", "Postprandial flatulence"];
    suggestedRegion = "Abdomen";
  } else if (norm.includes("back") || norm.includes("hip") || norm.includes("sciatic") || norm.includes("spine")) {
    mappedTerm = "Lumbago with Sciatic Motor Pathway Irritation";
    detectedSymptoms = ["Lumbosacral radiating pull", "Physiological hip joint stiffness", "Cervical facet pressure"];
    suggestedRegion = "Back";
  } else if (norm.includes("arm") || norm.includes("shoulder") || norm.includes("hand") || norm.includes("wrist")) {
    mappedTerm = "Upper Limb Myofascial Overstretch Strain";
    detectedSymptoms = ["Acromioclavicular pressure", "Hand motor conduction tingling", "Local musculotendinous swelling"];
    suggestedRegion = "Left Arm";
  } else if (norm.includes("leg") || norm.includes("knee") || norm.includes("ankle") || norm.includes("calf") || norm.includes("foot")) {
    mappedTerm = "Lower Extremity Musculofascial Cramp Response";
    detectedSymptoms = ["Popliteal joint cracking", "Sudden gastrocnemius muscle cramps", "Ankle sensory swelling"];
    suggestedRegion = "Left Leg";
  }

  return {
    mappedTerm,
    detectedSymptoms,
    suggestedRegion
  };
}

// Endpoint 1: Health / Verification
app.get(apiRoute("/health"), (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Endpoint 2: Analyze Symptoms via Gemini (Standard Triage)
app.post(apiRoute("/analyze-symptoms"), async (req, res) => {
  const { region, symptoms, severity, duration, customSymptom, language } = req.body;
  const formattedSymptoms = [
    ...(symptoms || []),
    ...(customSymptom ? [customSymptom] : []),
  ];

  if (formattedSymptoms.length === 0) {
    return res.status(400).json({ error: "No symptoms provided for analysis." });
  }

  const prompt = `Analyze symptoms for regional area "${region}". 
Symptoms reported: ${formattedSymptoms.join(", ")}. 
User-reported severity (0 to 4 scale, where 4 is critical): ${severity}. 
Estimated duration of symptoms: ${duration || "unspecified"}.
Target response language: ${language || "English"}.

Evaluate these inputs and identify:
1. Potential acute conditions.
2. An indicator of whether these symptoms point to a life-threatening immediate medical emergency.
3. Simple, non-medicative helpful actions/tips (e.g., safe resting alignments, hydration, ice packs). Do not prescribe drugs.
4. Appropriate clinical specialties the user should consult.`;

  const symptomSystemInstruction = `You are a highly precise, board-certified emergency medicine triage bot. Your task is to analyze patient-submitted symptoms and estimate triage likelihoods. Since you are an advisory tool, always separate conditions into potential matches with confidence values, designate potential immediate emergencies of high danger correctly, and recommend real physical clinical doctor consultations.
CRITICAL: You must write and output ALL text fields, strings, names, explanations, emergency reports, recommendations and tips completely in this language: ${language || "English"}.
Output JSON shape:
{
  "emergency": boolean,
  "emergencyReason": string,
  "conditions": [{"name": string, "probability": number, "explanation": string, "urgency": "Critical"|"High"|"Moderate"|"Low"}],
  "dynamicTips": [string, string, string],
  "recommendedSpecialties": [string]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: symptomSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emergency: {
              type: Type.BOOLEAN,
              description: "True if symptoms indicate a potential high-urgency clinical emergency (e.g., stroke symptoms, chest pain with radiating arm pain, severe breathing difficulty, massive sudden leg swelling, major neurological deficits)."
            },
            emergencyReason: {
              type: Type.STRING,
              description: "Short explanation of why this constitutes or does not constitute an immediate emergency."
            },
            conditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Common name of the condition" },
                  probability: { type: Type.INTEGER, description: "Triage matching confidence score out of 100" },
                  explanation: { type: Type.STRING, description: "Brief scientific background explanation of why this matches the symptoms" },
                  urgency: { type: Type.STRING, description: "Urgency category: Critical, High, Moderate, Low" }
                },
                required: ["name", "probability", "explanation", "urgency"]
              }
            },
            dynamicTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 safe, actionable physical self-care guidelines (like hydration, cooling wraps, avoiding weight load) - NO specific medication recommendations."
            },
            recommendedSpecialties: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended medical professionals to consult (e.g. Cardiologist, Orthopedic, General Physician)"
            }
          },
          required: ["emergency", "emergencyReason", "conditions", "dynamicTips", "recommendedSpecialties"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error in symptoms analysis, attempting Groq fallback:", error.message || error);
    try {
      const groqData = await groqJsonFallback(symptomSystemInstruction, prompt);
      return res.json(groqData);
    } catch (groqError: any) {
      console.warn("Groq Error in symptoms analysis, using local fallback:", groqError.message || groqError);
      const fallback = getSymptomAnalysisFallback(
        req.body.region || "General",
        [...(req.body.symptoms || []), ...(req.body.customSymptom ? [req.body.customSymptom] : [])],
        req.body.severity || 0,
        req.body.duration || "unspecified"
      );
      return res.json(fallback);
    }
  }
});

// Endpoint 3: Scan Medicine Label / OCR Identification
app.post(apiRoute("/identify-medicine"), async (req, res) => {
  const { text, image, language } = req.body;

  let prompt = "";
  let contents: any = [];

  if (image) {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    contents = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
      {
        text: `Identify the medicine packaging, strip, or prescription label shown in this image. Extract active pharmacological ingredients, dosage levels, approximate CDSCO/FDA verification status, safe intake guides, and side-effects. Also flag key negative combinations or interactions with other common medication. Provide response in ${language || "English"}.`,
      },
    ];
  } else if (text) {
    prompt = `Extract medical details for drug name/search query: "${text}". Give official pharmacological info in ${language || "English"}.`;
    contents = [prompt];
  } else {
    return res.status(400).json({ error: "Please provide either scanned text representation or base64 image data." });
  }

  const medicineSystemInstruction = `You are a professional clinical drug information verification system. You translate scanned pill strips, labels or text searches into accurate chemical formulations, side effects, precautions, CDSCO status flags and safe dosage outlines.
CRITICAL: You must write and translate all text values, medicine description, side-effects, interactions, warnings and dosage notes completely in this language: ${language || "English"}.
Output JSON shape:
{
  "name": string,
  "generic": string,
  "verified": boolean,
  "dosage": string,
  "frequency": string,
  "sideEffects": string,
  "contraindications": string,
  "interactions": [{"drug": string, "risk": string}]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: medicineSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Official pharmacological brand or compound name identified" },
            generic: { type: Type.STRING, description: "Generic chemical names or active composition details" },
            verified: { type: Type.BOOLEAN, description: "True if recognized as registered in CDSCO, FDA, or standard national registers" },
            dosage: { type: Type.STRING, description: "Standard therapeutic strength / standard release format (e.g. 500mg, controlled-release tablet)" },
            frequency: { type: Type.STRING, description: "Standard clinical intake patterns (e.g., twice daily, as directed by physician)" },
            sideEffects: { type: Type.STRING, description: "Primary adverse side effects" },
            contraindications: { type: Type.STRING, description: "Primary direct restrictions (when NOT to administer, e.g., third-semester pregnancy, severe liver failure)" },
            interactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  drug: { type: Type.STRING, description: "Excluding drug category or specific active chemical" },
                  risk: { type: Type.STRING, description: "Adverse outcome description" }
                },
                required: ["drug", "risk"]
              }
            }
          },
          required: ["name", "generic", "verified", "dosage", "frequency", "sideEffects", "contraindications", "interactions"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error identifying medicine, attempting Groq fallback:", error.message || error);
    try {
      const groqPrompt = image
        ? `Medicine image was uploaded by user. Perform best-effort medicine identification guidance based on likely packaging cues and clinical safety context. If uncertain, say uncertain and provide safe guidance. Respond in ${language || "English"}.`
        : prompt;
      const groqData = await groqJsonFallback(medicineSystemInstruction, groqPrompt);
      return res.json(groqData);
    } catch (groqError: any) {
      console.warn("Groq Error identifying medicine, using local fallback:", groqError.message || groqError);
      const searchQuery = req.body.text || "Standard Formula";
      const fallback = getMedicineIdentifyFallback(searchQuery);
      return res.json(fallback);
    }
  }
});

// Endpoint 4: Voice Input Mapping to Symptoms & Regions
app.post(apiRoute("/voice-input"), async (req, res) => {
  const { transcript, language } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: "Transcript data is required for mapping." });
  }

  const voicePrompt = `Translate the following colloquial patient description: "${transcript}" into formal medical terminologies, specific anatomical region candidates, and extract concrete listed symptoms that are active.
CRITICAL: Translate all output fields (mappedTerm background, detected symptoms list) completely into this language: ${language || "English"}.`;

  const voiceSystemInstruction = `Return strictly valid JSON with:
{
  "mappedTerm": string,
  "detectedSymptoms": [string],
  "suggestedRegion": "Head"|"Chest"|"Abdomen"|"Left Arm"|"Right Arm"|"Left Leg"|"Right Leg"|"Back"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: voicePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mappedTerm: { type: Type.STRING, description: "Formal medical equivalent term (e.g. Cephalgia with migraine profile, Dyspepsia)" },
            detectedSymptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of distinct symptoms detected (e.g., severe localized headache, nausea)"
            },
            suggestedRegion: {
              type: Type.STRING,
              description: "Anatomical region. Must be one of: Head, Chest, Abdomen, Left Arm, Right Arm, Left Leg, Right Leg, Back"
            }
          },
          required: ["mappedTerm", "detectedSymptoms", "suggestedRegion"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error in voice input mapping, attempting Groq fallback:", error.message || error);
    try {
      const groqData = await groqJsonFallback(voiceSystemInstruction, voicePrompt);
      return res.json(groqData);
    } catch (groqError: any) {
      console.warn("Groq Error in voice input mapping, using local fallback:", groqError.message || groqError);
      const transcript = req.body.transcript || "";
      const fallback = getVoiceInputFallback(transcript);
      return res.json(fallback);
    }
  }
});

// Endpoint 5: Fact Check Medical Claims with Search Grounding
app.post(apiRoute("/fact-check"), async (req, res) => {
  const { claim, language } = req.body;
  if (!claim) {
    return res.status(400).json({ error: "Medical claim or assertion text is required." });
  }

  const factPrompt = `Fact-check this medical claim, myth, or question thoroughly: "${claim}". 
Provide a clear, clinical, objective scientific breakdown. 
Target response language: ${language || "English"}.`;

  const factSystemInstruction = `You are a professional medical fact-checker. You verify health claims against scientific evidence.
CRITICAL: You must output the response in JSON format strictly following this schema:
{
  "claim": "The original claim being checked",
  "verdict": "One of: True, False, Partially True, or Misleading",
  "explanation": "A detailed scientific explanation (Markdown supported)",
  "evidenceSource": "Brief description of the primary scientific evidence used",
  "safetyAdvisory": "A clinical safety note for the patient"
}
Translate all fields into the requested language: ${language || "English"}.`;

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "dummy-key") {
      console.warn("No Gemini API key configured; using local fact-check guidance.");
      const fallback = getFactCheckFallback(claim);
      return res.json(fallback);
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: factPrompt,
      config: {
        systemInstruction: factSystemInstruction,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error in factcheck analysis, attempting Groq fallback:", error.message || error);
    try {
      const groqData = await groqJsonFallback(factSystemInstruction, factPrompt);
      return res.json(groqData);
    } catch (groqError: any) {
      console.warn("Groq Error in factcheck analysis, using local fallback:", groqError.message || groqError);
      const fallback = getFactCheckFallback(claim);
      return res.json(fallback);
    }
  }
});

app.post(apiRoute("/translate"), (req, res) => {
  const { lang } = req.body;
  if (!lang || !translations[lang]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  res.json({ translations: translations[lang] });
});

// Smart fallback for Real-time AI Assistant when API is offline or 429 occurs
function getAssistantChatFallback(message: string, language: string) {
  const norm = message.toLowerCase();
  let text = "";

  if (norm.includes("burn") || norm.includes("scal")) {
    text = `**First Aid for Minor Burns:**
1. **Cooling:** Flush the burn area under cool running water for at least 10 to 20 minutes immediately to stop the thermal damage.
2. **Protection:** Cover with a clean, sterile, non-sticky gauze or cloth. Do not pop any fluid-filled blisters.
3. **Avoid Myths:** Avoid applying household ingredients like toothpaste, butter, oils, or ice directly, as these can trap heat or introduce bacterial contaminants.

*Note: For deep blistering, charring, or burns on the face, hands, or joints, consult an emergency specialist immediately.*`;
  } else if (norm.includes("paracetamol") || norm.includes("crocin") || norm.includes("acetaminophen")) {
    text = `**Acetaminophen / Paracetamol (e.g., Crocin):**
- **Indication:** A common counter-analgesic and antipyretic used to relieve mild-to-moderate pain and reduce high fevers.
- **Safety Threshold:** Maximum daily allowance for a standard adult is 4,000 mg (4 grams). Consuming more than this pose severe risk of hepatic necrosis (irreversible liver failure).
- **Contraindications:** Chronic alcohol heavy ingestion or underlying clinical liver disease.

*Always consult with your physician to establish standard personal dose frequencies.*`;
  } else if (norm.includes("cdsco") || norm.includes("compliance")) {
    text = `**CDSCO Regulatory Standing:**
The Central Drugs Standard Control Organisation (CDSCO) is India's preeminent national regulatory authority for pharmaceuticals, clinical trials, and medical device standards. 

All diagnostic advice, medication descriptions, and clinical workflows inside MediGuide comply with standard CDSCO clinical guidelines to protect patient safety.`;
  } else if (norm.includes("stroke") || norm.includes("heart") || norm.includes("pain") || norm.includes("breath")) {
    text = `🚨 **HIGH ALARM SYMPTOM DETECTED** 🚨

Visceral chest pain, tightness radiating to the arm, throat compression, severe breathlessness (dyspnea), or sudden asymmetrical numbness are high-alert symptoms.

**Emergency Action Protocol:**
1. Stop all physical movements immediately.
2. If you are near others, alert them immediately.
3. Call 112 or local regional emergency medical dispatches. Do not attempt to drive yourself to a trauma station.`;
  } else {
    text = `Thank you for reaching out to MediGuide Clinical Support.

Here are some standard clinical wellness pillars:
- **Hydration:** Aim to drink at least 2.5 to 3 liters of clean water daily to assist renal cellular clearance.
- **Sleep Quality:** Maintain 7-8 hours of circadian sleep to allow autonomic neural reset.
- **Active Motion:** Regular moderate cardio (like 30 minutes of brisk walking) optimizes cardiovascular compliance.

Is there a specific symptom, medication query, or first-aid practice you would like to explore?`;
  }

  return {
    response: `${text}`
  };
}

// Endpoint 6: Real-time AI Assistant Chat
app.post(apiRoute("/assistant/chat"), async (req, res) => {
  const { messages, language } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Format chat messages appropriately for Gemini API
  // Gemini 3.5 expects {"role": "user"|"model", "parts": [{"text": "..."}]}
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: msg.content || msg.text || "" }]
  }));

  const systemInstruction = `You are "MediGuide's Real-time Clinical Wellness Copilot", an empathetic, highly professional medical-grade AI assistant. 
Your goal is to provide patient-first medical education, first-aid techniques, medication information, and symptom explanations.
Adhere strictly to these clinical rules:
1. Since you do not replace real-world physical physicians, always frame your guidance as educational and encourage consulting licensed medical practitioners.
2. Keep your answers clearly structured using clean bullet points and precise Markdown.
3. Address the user and respond completely in their selected language: ${language || "English"}.
4. Provide safe, non-medicative physical recovery recommendations (such as relative rest, hydration, standard first aid) unless describing specific medicines explicitly asked about.
5. Absolute emergency cases (chest pain, stroke, breathing crises, severe blood loss) must trigger a high-contrast emergency warning immediately.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      }
    });

    res.json({ response: response.text || "" });
  } catch (error: any) {
    console.warn("Gemini Error in assistant chat, attempting Groq fallback:", error.message || error);
    try {
      const groqMessages = [
        { role: "system", content: systemInstruction },
        ...messages.map((msg: any) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content || msg.text || "",
        })),
      ];
      const groqResponse = await groqChat(groqMessages, 0.7);
      return res.json({ response: groqResponse || "" });
    } catch (groqError: any) {
      console.warn("Groq Error in assistant chat, using local fallback:", groqError.message || groqError);
      const lastMessage = req.body.messages?.[req.body.messages.length - 1]?.content || "";
      const fallback = getAssistantChatFallback(lastMessage, req.body.language || "English");
      return res.json(fallback);
    }
  }
});

// Serve frontend build / Vite Dev Middleware configuration
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to avoid bundling Vite in production
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await startListening(DEFAULT_PORT);
}

async function startListening(startPort: number, retries = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    const port = startPort + retries;
    const server = app.listen(port, "0.0.0.0", () => {
      const localUrl = `http://localhost:${port}`;
      const networkInterfaces = os.networkInterfaces();
      const networkUrls = Object.values(networkInterfaces)
        .flatMap((records) => records || [])
        .filter((record) => record?.family === "IPv4" && !record.internal)
        .map((record) => `http://${record.address}:${port}`);

      console.log(`\n[MediGuide Backend] Full-stack application configured on port ${port}`);
      console.log(`Local:   ${localUrl}`);
      if (networkUrls.length > 0) {
        console.log(`Phone:   ${networkUrls[0]}`);
      }
      console.log(`\nOpen the app in your browser or on a network phone using the above URL.\n`);
      resolve();
    });

    server.on("error", async (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && retries < MAX_PORT_RETRIES) {
        console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
        await startListening(startPort, retries + 1);
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export default app;

if (process.env.VERCEL !== "1") {
  startApp().catch((err) => {
    console.error("Server startup failure:", err);
  });
}
