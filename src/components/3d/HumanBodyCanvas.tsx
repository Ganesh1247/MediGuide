import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BodyRegion } from "../../types";

export interface HumanBodyCanvasProps {
  onRegionHover: (region: BodyRegion | null) => void;
  onRegionSelect: (region: BodyRegion) => void;
  selectedRegionId: string | null;
}

export const BODY_REGIONS: BodyRegion[] = [
  {
    id: "head",
    label: "Head & Neurological",
    color: "#6366f1", // clinical indigo
    icon: "🧠",
    symptoms: ["Severe Headache", "Dizziness / Vertigo", "Double Vision", "Brain Fog / Memory Slips", "Tinnitus / Hearing Loss", "Numbness in Face"],
    description: "Cranial cavity containing neural pathways, visual cortex, auditory channels, and sensory relays."
  },
  {
    id: "chest",
    label: "Chest & Pulmonary",
    color: "#e11d48", // clinical cardiac red
    icon: "🫁",
    symptoms: ["Sharp Chest Pain", "Shortness of Breath", "Palpitations / Fluttering", "Chronic Tight Cough", "Radiating Pain to Jaw/Shoulder"],
    description: "Thoracic cage housing the cardiovascular engine and auxiliary dual lung lobes."
  },
  {
    id: "abdomen",
    label: "Abdomen & Digestive",
    color: "#d97706", // warm metabolic amber
    icon: "🍕",
    symptoms: ["Acute Stomach Cramps", "Persistent Nausea", "Reflux / Acid Burps", "Bloating / Gas Pressure", "Lower Quadrant Swelling"],
    description: "Gastrointestinal ecosystem mediating enzyme synthesis and metabolic digestion."
  },
  {
    id: "left_arm",
    label: "Left Upper Limb",
    color: "#0891b2", // surgical cyan
    icon: "💪",
    symptoms: ["Radiating Arm Pain", "Left Hand Numbness", "Elbow Stiffness", "Tremor / Muscle Loss"],
    description: "Upper left skeletal extremity comprising mechanical flexors and neurological fibers connected to chest."
  },
  {
    id: "right_arm",
    label: "Right Upper Limb",
    color: "#0891b2", // surgical cyan
    icon: "💪",
    symptoms: ["Shoulder Sharp Pain", "Right Hand Tingling", "Wrist Nerve Pressure", "Joint Swelling"],
    description: "Upper right clinical biomechanical flexors and muscle grip controls."
  },
  {
    id: "left_leg",
    label: "Left Lower Extremity",
    color: "#0891b2", // surgical cyan
    icon: "🦵",
    symptoms: ["Sudden Calf Cramps", "Ankle Swelling", "Coldness in Toes", "Sharp Hip Stiffness"],
    description: "Lower left motor pathway anchoring blood circulation and physical locomotion."
  },
  {
    id: "right_leg",
    label: "Right Lower Extremity",
    color: "#0891b2", // surgical cyan
    icon: "🦵",
    symptoms: ["Severe Thigh Strain", "Ankle Swelling", "Knee Cracking Joint Pain", "Numb Foot Sole"],
    description: "Lower right clinical motor joints and weight-bearing structures."
  },
  {
    id: "back",
    label: "Posteriors & Spine",
    color: "#059669", // vertebral emerald
    icon: "🦴",
    symptoms: ["Sciatic Nerve Pain", "Lower Lumbar Stiffness", "Spine Pinch Pressure", "Shoulder Blade Spasms"],
    description: "Main vertebral spine alignment guiding posture, balance, and cranial bone linkages."
  }
];

export default function HumanBodyCanvas({
  onRegionHover,
  onRegionSelect,
  selectedRegionId
}: HumanBodyCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedRegionIdRef = useRef<string | null>(selectedRegionId);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const [customObjFile, setCustomObjFile] = useState<File | null>(null);
  const [objStatus, setObjStatus] = useState<string>("");
  const [cameraAngle, setCameraAngle] = useState(0);
  const [zoomDepth, setZoomDepth] = useState(4.2);
  const [sensorStatus, setSensorStatus] = useState("CALIBRATING");
  const [gender, setGender] = useState<"male" | "female">("male");

  // Sync ref with prop for internal Three.js animation loops
  useEffect(() => {
    selectedRegionIdRef.current = selectedRegionId;
  }, [selectedRegionId]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 550;

    // SCENE & CAMERA (Light clinical background-matched scene)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.2);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ORBIT CONTROLS - Enable fully interactive zoom/rotate camera mechanics
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.0;
    controls.enablePan = false;
    controls.target.set(0, 0.9, 0);

    // GROUP FOR PROCEDURAL ANATOMY
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    const interactiveObjects: THREE.Object3D[] = [];

    // Materials mapping dictionaries
    const defaultMaterialMap = new Map<string, THREE.MeshStandardMaterial>();
    const highlightedMaterialMap = new Map<string, THREE.MeshStandardMaterial>();

    // Helper to create beautiful medical glass materials
    const createGlassMaterial = (colorStr: string, isHighlighted: boolean) => {
      const colorHex = new THREE.Color(colorStr);
      return new THREE.MeshStandardMaterial({
        color: isHighlighted ? colorHex : new THREE.Color("#475569"),
        emissive: isHighlighted ? colorHex : new THREE.Color("#cbd5e1"),
        emissiveIntensity: isHighlighted ? 0.95 : 0.08,
        transparent: true,
        opacity: isHighlighted ? 0.80 : 0.28,
        metalness: isHighlighted ? 0.35 : 0.15,
        roughness: isHighlighted ? 0.15 : 0.40,
        side: THREE.DoubleSide
      });
    };

    // Shared materials mapped by region ID
    const defaultRegionMaterials = new Map<string, THREE.MeshStandardMaterial>();
    const highlightedRegionMaterials = new Map<string, THREE.MeshStandardMaterial>();

    BODY_REGIONS.forEach((r) => {
      defaultRegionMaterials.set(r.id, createGlassMaterial(r.color, false));
      highlightedRegionMaterials.set(r.id, createGlassMaterial(r.color, true));
    });

    // Custom internal organ materials (glowing cybernetic elements)
    const brainMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#818cf8"),
      emissive: new THREE.Color("#6366f1"),
      emissiveIntensity: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9
    });
    const heartMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f43f5e"),
      emissive: new THREE.Color("#e11d48"),
      emissiveIntensity: 1.2,
      roughness: 0.05,
      transparent: true,
      opacity: 0.95
    });
    const lungMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#22d3ee"),
      emissive: new THREE.Color("#0891b2"),
      emissiveIntensity: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const gastroMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#fbbf24"),
      emissive: new THREE.Color("#d97706"),
      emissiveIntensity: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    // References for organ scaling oscillations
    let heartMesh: THREE.Mesh | null = null;
    let lungLeftMesh: THREE.Mesh | null = null;
    let lungRightMesh: THREE.Mesh | null = null;
    let brainMesh: THREE.Mesh | null = null;

    // Direct realistic clinical humanoid dimensions spec
    const isMale = gender === "male";
    
    // Proportional dimensions for realistic human curves
    const shouldersX = isMale ? 0.44 : 0.35;
    const bodyScaleX = isMale ? 1.14 : 0.88; 
    const pelvisScaleX = isMale ? 0.98 : 1.15;
    const neckScaleY = isMale ? 1.0 : 0.88;
    const neckScaleX = isMale ? 1.0 : 0.80;
    const limbScale = isMale ? 1.0 : 0.88;

    const anatomySegments = [
      // 1. HEAD CLINICAL ANATOMY
      { id: "head", name: "cranium", geom: new THREE.SphereGeometry(0.23, 28, 28), pos: [0, 1.76, 0], scale: [neckScaleX, 1.18, 0.94] },
      { id: "head", name: "jawline", geom: new THREE.CylinderGeometry(0.11, 0.06, 0.16, 16), pos: [0, 1.63, 0.04], rot: [0.18, 0, 0], scale: [neckScaleX, 1, 1] },
      { id: "head", name: "neck", geom: new THREE.CylinderGeometry(0.07, 0.08, 0.14, 16), pos: [0, 1.50, 0], scale: [neckScaleX, neckScaleY, neckScaleX] },
      { id: "head", name: "brain_core", geom: new THREE.SphereGeometry(0.08, 20, 20), pos: [0, 1.78, 0.02], isOrgan: true, organType: "brain" },

      // 2. CHEST / THORACIC MUSCULATURE
      { id: "chest", name: "thorax_body", geom: new THREE.CylinderGeometry(0.34, 0.25, 0.60, 24), pos: [0, 1.20, 0], scale: [bodyScaleX, 1.0, 0.94] },
      { id: "chest", name: "deltoid_l", geom: new THREE.SphereGeometry(0.11, 18, 18), pos: [-shouldersX, 1.35, -0.01], scale: [limbScale, limbScale, limbScale] },
      { id: "chest", name: "deltoid_r", geom: new THREE.SphereGeometry(0.11, 18, 18), pos: [shouldersX, 1.35, -0.01], scale: [limbScale, limbScale, limbScale] },
      
      // Dynamic chest contours for gender structures
      ...(isMale ? [
        { id: "chest", name: "pec_l", geom: new THREE.BoxGeometry(0.15, 0.13, 0.07), pos: [-0.11, 1.26, 0.14], rot: [0.1, 0, 0] },
        { id: "chest", name: "pec_r", geom: new THREE.BoxGeometry(0.15, 0.13, 0.07), pos: [0.11, 1.26, 0.14], rot: [0.1, 0, 0] }
      ] : [
        { id: "chest", name: "breast_l", geom: new THREE.SphereGeometry(0.10, 22, 22), pos: [-0.09, 1.22, 0.16], scale: [1, 1, 0.9] },
        { id: "chest", name: "breast_r", geom: new THREE.SphereGeometry(0.10, 22, 22), pos: [0.09, 1.22, 0.16], scale: [1, 1, 0.9] }
      ]),

      { id: "chest", name: "chest_rib_1", geom: new THREE.TorusGeometry(0.31, 0.01, 10, 48), pos: [0, 1.34, 0], rot: [Math.PI / 2, 0, 0], scale: [bodyScaleX, 1.0, 1.0], isDecor: true },
      { id: "chest", name: "chest_rib_2", geom: new THREE.TorusGeometry(0.30, 0.01, 10, 48), pos: [0, 1.20, 0], rot: [Math.PI / 2, 0, 0], scale: [bodyScaleX, 1.0, 1.0], isDecor: true },
      { id: "chest", name: "chest_rib_3", geom: new THREE.TorusGeometry(0.27, 0.01, 10, 48), pos: [0, 1.06, 0], rot: [Math.PI / 2, 0, 0], scale: [bodyScaleX, 1.0, 1.0], isDecor: true },
      
      // Inside active organs
      { id: "chest", name: "heart_core", geom: new THREE.SphereGeometry(0.08, 20, 20), pos: [-0.05, 1.25, 0.08], isOrgan: true, organType: "heart" },
      { id: "chest", name: "lung_l_core", geom: new THREE.CylinderGeometry(0.065, 0.05, 0.26, 16), pos: [-0.13, 1.22, 0.03], rot: [0.08, 0, 0.10], isOrgan: true, organType: "lung_l" },
      { id: "chest", name: "lung_r_core", geom: new THREE.CylinderGeometry(0.065, 0.05, 0.26, 16), pos: [0.13, 1.22, 0.03], rot: [0.08, 0, -0.10], isOrgan: true, organType: "lung_r" },

      // 3. ABDOMEN & BIOLOGY
      { id: "abdomen", name: "viscera_body", geom: new THREE.CylinderGeometry(0.25, 0.29, 0.36, 24), pos: [0, 0.76, 0], scale: [isMale ? 1.08 : 0.85, 1.0, 0.90] },
      { id: "abdomen", name: "pelvic_ring_body", geom: new THREE.CylinderGeometry(0.29, 0.23, 0.20, 24), pos: [0, 0.49, 0], scale: [pelvisScaleX, 1.0, 1.0] },
      { id: "abdomen", name: "viscera_gastro", geom: new THREE.SphereGeometry(0.075, 18, 18), pos: [0.04, 0.82, 0.08], isOrgan: true, organType: "gastro" },

      // 4. EMBEDDED SACRAL VERTEBRAE & VERTEBRAL TUBAL STRUCTURES
      { id: "back", name: "spine_cord_neon", geom: new THREE.CylinderGeometry(0.013, 0.013, 0.96, 16), pos: [0, 0.95, -0.15], rot: [0.03, 0, 0] },
      { id: "back", name: "vertebrae_top", geom: new THREE.BoxGeometry(0.038, 0.03, 0.035), pos: [0, 1.34, -0.15] },
      { id: "back", name: "vertebrae_chest", geom: new THREE.BoxGeometry(0.044, 0.032, 0.035), pos: [0, 1.18, -0.15] },
      { id: "back", name: "vertebrae_lumbar", geom: new THREE.BoxGeometry(0.048, 0.034, 0.035), pos: [0, 1.02, -0.15] },
      { id: "back", name: "vertebrae_hip", geom: new THREE.BoxGeometry(0.052, 0.036, 0.035), pos: [0, 0.86, -0.15] },
      { id: "back", name: "vertebrae_sacral", geom: new THREE.BoxGeometry(0.056, 0.038, 0.035), pos: [0, 0.70, -0.15] },

      // 5. LEFT LIMB SYSTEM (Athletic biomechanics)
      { id: "left_arm", name: "arm_up_l", geom: new THREE.CylinderGeometry(0.06, 0.05, 0.44, 16), pos: [-(shouldersX + 0.1), 1.11, 0.01], rot: [0, 0, 0.22], scale: [limbScale, limbScale, limbScale] },
      { id: "left_arm", name: "elbow_node_l", geom: new THREE.SphereGeometry(0.045, 12, 12), pos: [-(shouldersX + 0.17), 0.90, 0.02], scale: [limbScale, limbScale, limbScale] },
      { id: "left_arm", name: "forearm_l", geom: new THREE.CylinderGeometry(0.048, 0.034, 0.38, 16), pos: [-(shouldersX + 0.23), 0.71, 0.05], rot: [0, 0, 0.15], scale: [limbScale, limbScale, limbScale] },
      { id: "left_arm", name: "hand_l", geom: new THREE.BoxGeometry(0.018, 0.085, 0.06), pos: [-(shouldersX + 0.28), 0.50, 0.07], rot: [0, 0, 0.12], scale: [limbScale, limbScale, limbScale] },

      // 6. RIGHT LIMB SYSTEM (Athletic biomechanics)
      { id: "right_arm", name: "arm_up_r", geom: new THREE.CylinderGeometry(0.06, 0.05, 0.44, 16), pos: [(shouldersX + 0.1), 1.11, 0.01], rot: [0, 0, -0.22], scale: [limbScale, limbScale, limbScale] },
      { id: "right_arm", name: "elbow_node_r", geom: new THREE.SphereGeometry(0.045, 12, 12), pos: [(shouldersX + 0.17), 0.90, 0.02], scale: [limbScale, limbScale, limbScale] },
      { id: "right_arm", name: "forearm_r", geom: new THREE.CylinderGeometry(0.048, 0.034, 0.38, 16), pos: [(shouldersX + 0.23), 0.71, 0.05], rot: [0, 0, -0.15], scale: [limbScale, limbScale, limbScale] },
      { id: "right_arm", name: "hand_r", geom: new THREE.BoxGeometry(0.018, 0.085, 0.06), pos: [(shouldersX + 0.28), 0.50, 0.07], rot: [0, 0, -0.12], scale: [limbScale, limbScale, limbScale] },

      // 7. LEFT LOCOMOTION
      { id: "left_leg", name: "thigh_l", geom: new THREE.CylinderGeometry(0.11, 0.08, 0.62, 18), pos: [-0.16, 0.14, 0.01], rot: [0.03, 0, -0.04], scale: [limbScale, limbScale, limbScale] },
      { id: "left_leg", name: "knee_joint_l", geom: new THREE.SphereGeometry(0.065, 14, 14), pos: [-0.18, -0.20, 0.02], scale: [limbScale, limbScale, limbScale] },
      { id: "left_leg", name: "calf_l", geom: new THREE.CylinderGeometry(0.078, 0.048, 0.58, 18), pos: [-0.19, -0.52, 0.04], rot: [0.04, 0, -0.01], scale: [limbScale, limbScale, limbScale] },
      { id: "left_leg", name: "foot_l", geom: new THREE.BoxGeometry(0.08, 0.045, 0.18), pos: [-0.20, -0.83, 0.08], rot: [0.06, 0.03, 0], scale: [limbScale, limbScale, limbScale] },

      // 8. RIGHT LOCOMOTION
      { id: "right_leg", name: "thigh_r", geom: new THREE.CylinderGeometry(0.11, 0.08, 0.62, 18), pos: [0.16, 0.14, 0.01], rot: [0.03, 0, 0.04], scale: [limbScale, limbScale, limbScale] },
      { id: "right_leg", name: "knee_joint_r", geom: new THREE.SphereGeometry(0.065, 14, 14), pos: [0.19, -0.20, 0.02], scale: [limbScale, limbScale, limbScale] },
      { id: "right_leg", name: "calf_r", geom: new THREE.CylinderGeometry(0.078, 0.048, 0.58, 18), pos: [0.20, -0.52, 0.04], rot: [0.04, 0, 0.01], scale: [limbScale, limbScale, limbScale] },
      { id: "right_leg", name: "foot_r", geom: new THREE.BoxGeometry(0.08, 0.045, 0.18), pos: [0.21, -0.83, 0.08], rot: [0.06, -0.03, 0], scale: [limbScale, limbScale, limbScale] }
    ];

    if (customObjFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target?.result;
        if (typeof contents === "string") {
          try {
            const loader = new OBJLoader();
            const obj = loader.parse(contents);

            // Center and scale the custom OBJ model nicely
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            obj.position.x -= center.x;
            obj.position.y -= center.y;
            obj.position.z -= center.z;

            // Scale to look nicely balanced
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scaleFactor = 1.9 / maxDim;
            obj.scale.setScalar(scaleFactor);
            obj.position.y += 0.9;

            obj.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                const meshName = (child.name || "").toLowerCase();
                let regionId = "chest"; // fallback

                // Map standard body zones by sub-mesh names
                if (meshName.includes("head") || meshName.includes("skull") || meshName.includes("brain") || meshName.includes("neck") || meshName.includes("eye")) {
                  regionId = "head";
                } else if (meshName.includes("chest") || meshName.includes("heart") || meshName.includes("lung") || meshName.includes("rib")) {
                  regionId = "chest";
                } else if (meshName.includes("abdo") || meshName.includes("stomach") || meshName.includes("colon") || meshName.includes("gut") || meshName.includes("pelv")) {
                  regionId = "abdomen";
                } else if (meshName.includes("arm") || meshName.includes("hand") || meshName.includes("shoulder") || meshName.includes("finger")) {
                  regionId = (child.position.x < 0) ? "left_arm" : "right_arm";
                } else if (meshName.includes("leg") || meshName.includes("foot") || meshName.includes("toe") || meshName.includes("thigh") || meshName.includes("calf") || meshName.includes("knee")) {
                  regionId = (child.position.x < 0) ? "left_leg" : "right_leg";
                } else if (meshName.includes("back") || meshName.includes("spine") || meshName.includes("verteb") || meshName.includes("post")) {
                  regionId = "back";
                }

                const regionColor = BODY_REGIONS.find(r => r.id === regionId)?.color || "#7C3AED";
                child.material = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(regionColor),
                  emissive: new THREE.Color(regionColor),
                  emissiveIntensity: 0.15,
                  transparent: true,
                  opacity: 0.6,
                  roughness: 0.2,
                  metalness: 0.1,
                  side: THREE.DoubleSide
                });

                child.userData = { regionId };
                interactiveObjects.push(child);

                // outline
                const contourGeom = new THREE.WireframeGeometry(child.geometry);
                const lineMaterial = new THREE.LineBasicMaterial({
                  color: new THREE.Color(regionColor),
                  transparent: true,
                  opacity: 0.15
                });
                child.add(new THREE.LineSegments(contourGeom, lineMaterial));
              }
            });

            bodyGroup.add(obj);
            setObjStatus("Active model: " + customObjFile.name);
          } catch (err: any) {
            console.error("OBJ parse error:", err);
            setObjStatus("Error reading model: " + err.message);
          }
        }
      };
      reader.readAsText(customObjFile);
    } else {
      anatomySegments.forEach((seg) => {
        // Find region matching this mesh id
        const region = BODY_REGIONS.find((r) => r.id === seg.id)!;
        
        let meshMaterial: THREE.Material;

        // Custom assignment for internal organs vs standard glass structural parts
        if ("isOrgan" in seg) {
          if (seg.organType === "brain") meshMaterial = brainMat;
          else if (seg.organType === "heart") meshMaterial = heartMat;
          else if (seg.organType === "gastro") meshMaterial = gastroMat;
          else meshMaterial = lungMat;
        } else if ("isDecor" in seg) {
          // Semi transparent beautiful wire rings
          meshMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(region.color),
            transparent: true,
            opacity: 0.20,
            side: THREE.DoubleSide
          });
        } else {
          // Standard glass skeleton elements
          meshMaterial = defaultRegionMaterials.get(seg.id)!;
        }

        const mesh = new THREE.Mesh(seg.geom, meshMaterial);
        mesh.position.set(seg.pos[0], seg.pos[1], seg.pos[2]);
        if (seg.rot) {
          mesh.rotation.set(seg.rot[0], seg.rot[1], seg.rot[2]);
        }
        if (seg.scale) {
          mesh.scale.set(seg.scale[0], seg.scale[1], seg.scale[2]);
        }

        mesh.name = seg.name;
        mesh.userData = { 
          regionId: seg.id, 
          isOrgan: "isOrgan" in seg,
          organType: "isOrgan" in seg ? seg.organType : null,
          isDecor: "isDecor" in seg
        };
        
        bodyGroup.add(mesh);

        // Keep core structure parts in interactive array so they capture clicks/raycasts
        if (!("isOrgan" in seg) && !("isDecor" in seg)) {
          interactiveObjects.push(mesh);
        }

        // Keep tracking references for organic animations
        if ("isOrgan" in seg) {
          if (seg.organType === "heart") heartMesh = mesh;
          if (seg.organType === "lung_l") lungLeftMesh = mesh;
          if (seg.organType === "lung_r") lungRightMesh = mesh;
          if (seg.organType === "brain") brainMesh = mesh;
        }

        // Add beautiful high fidelity medical line contours to body meshes
        if (!("isOrgan" in seg)) {
          const contourGeom = new THREE.WireframeGeometry(seg.geom);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(region.color),
            transparent: true,
            opacity: "isDecor" in seg ? 0.35 : 0.08
          });
          const wireframeLines = new THREE.LineSegments(contourGeom, lineMaterial);
          mesh.add(wireframeLines);
        }
      });
    }

    // LIGHTING (Pristine surgical studio ambiance)
    const topLight = new THREE.DirectionalLight(0xffffff, 1.8);
    topLight.position.set(2, 4, 3);
    scene.add(topLight);

    const backSpecLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    backSpecLight.position.set(-2, 1, -2);
    scene.add(backSpecLight);

    const medicalRimLight = new THREE.PointLight(0x0891b2, 1.5, 8);
    medicalRimLight.position.set(0, 1,-1.5);
    scene.add(medicalRimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // DECORATIVE SCANNER TARGET ORBITALS (LIGHT MORPHIC STYLE)
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, 0.9, 0);
    scene.add(ringGroup);

    // Clear clinical glass orbital ring
    const ring1Geom = new THREE.RingGeometry(1.20, 1.215, 60);
    ring1Geom.rotateX(Math.PI / 2);
    const ringPulseMat = new THREE.MeshBasicMaterial({
      color: 0x0891b2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const ringMesh1 = new THREE.Mesh(ring1Geom, ringPulseMat);
    ringGroup.add(ringMesh1);

    // Cross clinical laser indicator line
    const ring2Geom = new THREE.RingGeometry(1.30, 1.31, 40);
    ring2Geom.rotateX(Math.PI / 2.2);
    const ringBlueMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15
    });
    const ringMesh2 = new THREE.Mesh(ring2Geom, ringBlueMat);
    ringGroup.add(ringMesh2);

    // FLOATING ADVISORY HEALTH PARTICLES (80 telemetry nodes)
    const particleCount = 80;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 0.8 + Math.random() * 1.2;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = (radius * Math.sin(phi) * Math.sin(theta)) + 0.9;
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Deep cyan/blue particles for clean light mode
      const isCyan = Math.random() > 0.5;
      colors[i * 3] = isCyan ? 0.03 : 0.01;
      colors[i * 3 + 1] = isCyan ? 0.57 : 0.52;
      colors[i * 3 + 2] = isCyan ? 0.70 : 0.78;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pTextureCanvas = document.createElement("canvas");
    pTextureCanvas.width = 16;
    pTextureCanvas.height = 16;
    const ctx = pTextureCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.3, "rgba(8, 145, 178, 0.8)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const particleTex = new THREE.CanvasTexture(pTextureCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      map: particleTex,
      transparent: true,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // RAYCASTING & TOUCH / DRAG 3D ROTATION SYSTEM CONTROL
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isPointerDown = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let cumulativeDrag = 0;
    let userInteracting = false;
    let interactionCooldown = 0;

    const updateMouseCoords = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      mouse.set(x, y);
    };

    const handlePointerDown = (event: PointerEvent) => {
      isPointerDown = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      cumulativeDrag = 0;
      userInteracting = true;
      interactionCooldown = 300; // frames
      setSensorStatus("INTERACTING");
      updateMouseCoords(event.clientX, event.clientY);
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateMouseCoords(event.clientX, event.clientY);

      if (isPointerDown) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        cumulativeDrag += Math.hypot(dx, dy);
        dragStartX = event.clientX;
        dragStartY = event.clientY;
      } else {
        // Standard non-drag hover intersection highlights
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(interactiveObjects, true);

        if (hits.length > 0) {
          const regionId = hits[0].object.userData.regionId;
          if (regionId) {
            setHoveredRegion(regionId);
            const activeRegion = BODY_REGIONS.find((r) => r.id === regionId) || null;
            onRegionHover(activeRegion);
            container.style.cursor = "pointer";
            return;
          }
        }
        setHoveredRegion(null);
        onRegionHover(null);
        container.style.cursor = "default";
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      isPointerDown = false;
      updateMouseCoords(event.clientX, event.clientY);

      // Only perform region selection if dragging was negligible (pure tap/click selection)
      if (cumulativeDrag < 12) {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(interactiveObjects, true);
        if (hits.length > 0) {
          const regionId = hits[0].object.userData.regionId;
          const region = BODY_REGIONS.find((r) => r.id === regionId);
          if (region) {
            onRegionSelect(region);
          }
        }
      }
    };

    // Attach cohesive unified modern pointer listeners support (Mouse + touch screens automatically)
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      const entry = entries[entries.length - 1];
      const w = entry.contentRect.width || width;
      const h = entry.contentRect.height || height;

      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    // ANIMATION LOOP
    let isMounted = true;
    let clock = new THREE.Clock();
    let frameCount = 0;

    const animate = () => {
      if (!isMounted) return;
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      frameCount++;

      // Cooldown timer to return to idle slow spin
      if (userInteracting) {
        interactionCooldown--;
        if (interactionCooldown <= 0) {
          userInteracting = false;
          setSensorStatus("STABILIZED");
        }
      }

      // Update OrbitControls
      controls.update();

      // Dynamic humanoid orientation rotators - idle drift rotation when not interacting
      if (!userInteracting) {
        bodyGroup.rotation.y += 0.003; // slow organic self spin
      }

      // Update HUD metrics in parent throttled to avoid layout thrashing
      if (frameCount % 10 === 0) {
        const angle = Math.round(Math.atan2(camera.position.x, camera.position.z) * (180 / Math.PI));
        setCameraAngle(angle);
        const dist = Math.round(camera.position.distanceTo(controls.target) * 10) / 10;
        setZoomDepth(dist);
      }

      // Pulse diagnostic organs organically
      if (heartMesh) {
        // Human resting heartbeat pulse frequency (approx 72bpm with standard cycles)
        const heartPulse = 1.0 + Math.sin(elapsedTime * 6.8) * 0.065;
        heartMesh.scale.set(heartPulse, heartPulse, heartPulse);
      }

      if (lungLeftMesh && lungRightMesh) {
        // Slow calm respiratory diaphragmatic breathing loop
        const lungBreathe = 1.0 + Math.cos(elapsedTime * 1.5) * 0.035;
        lungLeftMesh.scale.set(lungBreathe, lungBreathe, lungBreathe);
        lungRightMesh.scale.set(lungBreathe, lungBreathe, lungBreathe);
      }

      if (brainMesh) {
        // Gentle neurological neural brain aura ripple
        const brainAura = 1.0 + Math.sin(elapsedTime * 2.8) * 0.02;
        brainMesh.scale.set(brainAura, brainAura, brainAura);
      }

      // Animate telemetry holographic scan indicators
      ringMesh1.rotation.y = elapsedTime * 0.3;
      ringMesh2.rotation.z = -elapsedTime * 0.4;
      ringGroup.position.y = 0.90 + Math.sin(elapsedTime * 1.2) * 0.05;

      // Particles dynamic floating physics
      particles.rotation.y = elapsedTime * 0.025;

      // Dynamic highlighting setup for subdivisions skeleton meshes
      bodyGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.regionId && !child.userData.isOrgan && !child.userData.isDecor) {
          const regionId = child.userData.regionId;
          const isHovered = hoveredRegion === regionId;
          const isSelected = selectedRegionIdRef.current === regionId;

          if (isHovered || isSelected) {
            child.material = highlightedRegionMaterials.get(regionId)!;
          } else {
            child.material = defaultRegionMaterials.get(regionId)!;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      isMounted = false;
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      scene.clear();
      renderer.dispose();
      anatomySegments.forEach(() => {
        // let three gc deal with it
      });
      ring1Geom.dispose();
      ring2Geom.dispose();
      ringPulseMat.dispose();
      ringBlueMat.dispose();
      particleGeom.dispose();
      pTextureCanvas.remove();
      particleTex.dispose();
      particleMat.dispose();
      brainMat.dispose();
      heartMat.dispose();
      lungMat.dispose();
      gastroMat.dispose();

      defaultRegionMaterials.forEach((m) => m.dispose());
      highlightedRegionMaterials.forEach((m) => m.dispose());
    };
  }, [onRegionHover, onRegionSelect, hoveredRegion, customObjFile, gender]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Modern gender model toggle selection */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 bg-white/70 backdrop-blur-[6px] border border-neutral-200/50 rounded-xl shadow-sm">
        <button
          onClick={() => setGender("male")}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
            gender === "male"
              ? "bg-teal-glow text-white shadow-[0_2px_8px_rgba(8,145,178,0.25)]"
              : "text-text-secondary hover:bg-black/5"
          }`}
        >
          <span>👨</span> Male
        </button>
        <button
          onClick={() => setGender("female")}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
            gender === "female"
              ? "bg-teal-glow text-white shadow-[0_2px_8px_rgba(8,145,178,0.25)]"
              : "text-text-secondary hover:bg-black/5"
          }`}
        >
          <span>👩</span> Female
        </button>
      </div>

      <div 
        ref={mountRef} 
        id="body-canvas-container"
        className="w-full h-full min-h-[480px] max-h-[550px] select-none touch-none"
      />
    </div>
  );
}

