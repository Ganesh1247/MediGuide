import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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
    label: "Head & Brain",
    color: "#22D3EE",
    icon: "🧠",
    symptoms: ["Severe Headache", "Dizziness", "Confusion", "Numbness in Face"],
    description: "Cranial structure housing the neural processing centers."
  },
  {
    id: "eyes",
    label: "Eyes & Vision",
    color: "#22D3EE",
    icon: "👁️",
    symptoms: ["Blurry Vision", "Double Vision", "Eye Pain", "Light Sensitivity"],
    description: "Visual organs responsible for sight and light detection."
  },
  {
    id: "ears",
    label: "Ears & Hearing",
    color: "#22D3EE",
    icon: "👂",
    symptoms: ["Hearing Loss", "Tinnitus (Ringing)", "Ear Ache", "Vertigo"],
    description: "Auditory and vestibular system for hearing and balance."
  },
  {
    id: "chest",
    label: "Chest & Heart",
    color: "#FF4D4D",
    icon: "🫁",
    symptoms: ["Chest Pain", "Shortness of Breath", "Palpitations", "Coughing"],
    description: "Thoracic region containing the heart and respiratory organs."
  },
  {
    id: "abdomen",
    label: "Abdomen",
    color: "#FACC15",
    icon: "🍕",
    symptoms: ["Stomach Pain", "Bloating", "Nausea", "Indigestion"],
    description: "Central region for digestive and metabolic functions."
  },
  {
    id: "upper_limbs",
    label: "Arms & Hands",
    color: "#22D3EE",
    icon: "💪",
    symptoms: ["Joint Pain", "Weakness", "Numbness", "Stiffness"],
    description: "Upper extremities and muscular skeletal structures."
  },
  {
    id: "lower_limbs",
    label: "Legs & Feet",
    color: "#22D3EE",
    icon: "🦵",
    symptoms: ["Calf Pain", "Swollen Ankles", "Knee Pain", "Numb Feet"],
    description: "Lower extremities for support and locomotion."
  },
  {
    id: "back",
    label: "Back & Spine",
    color: "#22D3EE",
    icon: "🦴",
    symptoms: ["Lower Back Pain", "Spinal Stiffness", "Nerve Pain"],
    description: "Posterior structure supporting the spinal column."
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
  const [gender, setGender] = useState<"male" | "female">("male");

  useEffect(() => {
    selectedRegionIdRef.current = selectedRegionId;
  }, [selectedRegionId]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.2;
    controls.maxDistance = 5.0;
    controls.target.set(0, 0.9, 0);

    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // Realistic Materials for a "Dressed" (Suit) Human
    const suitMaterial = new THREE.MeshPhongMaterial({
      color: 0x1A202C, // Deep Slate (Suit)
      specular: 0x22D3EE,
      shininess: 30,
    });

    const skinMaterial = new THREE.MeshPhongMaterial({
      color: 0xFAD0C4, // Flesh tone
    });

    const highlightMaterial = new THREE.MeshPhongMaterial({
      color: 0x22D3EE,
      emissive: 0x22D3EE,
      emissiveIntensity: 0.5,
    });

    const isMale = gender === "male";
    const shoulderWidth = isMale ? 0.45 : 0.35;

    // BUILD DRESSED HUMAN
    const anatomy = [
      // Head (Skin)
      { id: "head", geom: new THREE.CapsuleGeometry(0.18, 0.1, 8, 20), pos: [0, 1.75, 0], mat: skinMaterial },
      // Neck (Skin)
      { id: "head", geom: new THREE.CylinderGeometry(0.06, 0.07, 0.15), pos: [0, 1.58, 0], mat: skinMaterial },

      // Eyes (Targetable)
      { id: "eyes", geom: new THREE.SphereGeometry(0.035, 16, 16), pos: [-0.07, 1.80, 0.16], mat: highlightMaterial },
      { id: "eyes", geom: new THREE.SphereGeometry(0.035, 16, 16), pos: [0.07, 1.80, 0.16], mat: highlightMaterial },

      // Ears (Targetable)
      { id: "ears", geom: new THREE.BoxGeometry(0.02, 0.06, 0.04), pos: [-0.2, 1.75, 0], mat: skinMaterial },
      { id: "ears", geom: new THREE.BoxGeometry(0.02, 0.06, 0.04), pos: [0.2, 1.75, 0], mat: skinMaterial },

      // Chest (Suit)
      { id: "chest", geom: new THREE.CapsuleGeometry(0.3, 0.45, 8, 20), pos: [0, 1.25, 0], mat: suitMaterial },

      // Shoulders (Suit)
      { id: "upper_limbs", geom: new THREE.SphereGeometry(0.1, 16, 16), pos: [-shoulderWidth, 1.4, 0], mat: suitMaterial },
      { id: "upper_limbs", geom: new THREE.SphereGeometry(0.1, 16, 16), pos: [shoulderWidth, 1.4, 0], mat: suitMaterial },

      // Abdomen (Suit)
      { id: "abdomen", geom: new THREE.CapsuleGeometry(0.24, 0.3, 8, 20), pos: [0, 0.8, 0], mat: suitMaterial },

      // Back (Interactive)
      { id: "back", geom: new THREE.BoxGeometry(0.05, 1.1, 0.02), pos: [0, 1.0, -0.15], mat: suitMaterial },

      // Arms (Suit)
      { id: "upper_limbs", geom: new THREE.CapsuleGeometry(0.06, 0.4, 4, 12), pos: [-(shoulderWidth + 0.1), 1.1, 0], rot: [0, 0, 0.15], mat: suitMaterial },
      { id: "upper_limbs", geom: new THREE.CapsuleGeometry(0.06, 0.4, 4, 12), pos: [(shoulderWidth + 0.1), 1.1, 0], rot: [0, 0, -0.15], mat: suitMaterial },

      // Legs (Suit)
      { id: "lower_limbs", geom: new THREE.CapsuleGeometry(0.11, 0.5, 4, 16), pos: [-0.15, 0.2, 0], rot: [0, 0, -0.05], mat: suitMaterial },
      { id: "lower_limbs", geom: new THREE.CapsuleGeometry(0.11, 0.5, 4, 16), pos: [0.15, 0.2, 0], rot: [0, 0, 0.05], mat: suitMaterial },

      { id: "lower_limbs", geom: new THREE.CapsuleGeometry(0.08, 0.5, 4, 16), pos: [-0.17, -0.4, 0], mat: suitMaterial },
      { id: "lower_limbs", geom: new THREE.CapsuleGeometry(0.08, 0.5, 4, 16), pos: [0.17, -0.4, 0], mat: suitMaterial }
    ];

    const interactiveObjects: THREE.Mesh[] = [];

    anatomy.forEach(item => {
      const mesh = new THREE.Mesh(item.geom, item.mat.clone());
      mesh.position.set(item.pos[0], item.pos[1], item.pos[2]);
      if (item.rot) mesh.rotation.set(item.rot[0], item.rot[1], item.rot[2]);
      mesh.userData = { regionId: item.id, originalMat: item.mat };
      bodyGroup.add(mesh);
      interactiveObjects.push(mesh);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.style.touchAction = "none";

    const getRegionAtPointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveObjects);
      return hits.length > 0 ? BODY_REGIONS.find(r => r.id === hits[0].object.userData.regionId) || null : null;
    };

    const handleMove = (e: PointerEvent) => {
      const region = getRegionAtPointer(e);
      const isTouch = e.pointerType === "touch";

      if (region) {
        setHoveredRegion(region.id);
        if (!isTouch) {
          onRegionHover(region);
          container.style.cursor = "pointer";
        } else {
          onRegionHover(null);
          container.style.cursor = "default";
        }
      } else {
        setHoveredRegion(null);
        onRegionHover(null);
        container.style.cursor = "default";
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const region = getRegionAtPointer(e);
      if (region) {
        setHoveredRegion(region.id);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const region = getRegionAtPointer(e);
      if (region) {
        onRegionSelect(region);
      }
    };

    renderer.domElement.addEventListener("pointermove", handleMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      bodyGroup.rotation.y += 0.002;

      bodyGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.regionId) {
          const id = child.userData.regionId;
          const isActive = id === hoveredRegion || id === selectedRegionIdRef.current;
          if (isActive) {
            child.material.color.setHex(0x22D3EE);
            child.material.emissive?.setHex(0x22D3EE);
          } else {
            child.material.color.copy(child.userData.originalMat.color);
            child.material.emissive?.setHex(0x000000);
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      renderer.domElement.removeEventListener("pointermove", handleMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [gender]);

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 p-1 bg-bg-surface/90 border border-border rounded-xl">
        <button onClick={() => setGender("male")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border-none cursor-pointer ${gender === "male" ? "bg-accent text-black" : "text-text-dim"}`}>Male</button>
        <button onClick={() => setGender("female")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border-none cursor-pointer ${gender === "female" ? "bg-accent text-black" : "text-text-dim"}`}>Female</button>
      </div>
      <div ref={mountRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
