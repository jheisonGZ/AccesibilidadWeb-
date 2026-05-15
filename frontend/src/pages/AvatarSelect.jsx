// =============================================================================
// src/pages/AvatarSelect.jsx
//
// Pagina de seleccion de avatar con modelos 3D animados.
// Cada tarjeta tiene su propio renderer Three.js con:
//   - Rotacion automatica suave (OrbitControls.autoRotate)
//   - Animacion de flotacion vertical programatica
//   - Animacion de respiracion (escala) en el modelo seleccionado
//   - Iluminacion balanceada para mostrar colores originales del GLB
//   - Brillo con drop-shadow al seleccionar
//
// Autor: Jheison Estiben Gomez Muñoz
// Trabajo de Grado - Ingenieria de Sistemas - Universidad del Valle
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { ArrowRight, Check } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../styles/avatar.css";
import { useAppNavigate, usePageReady } from "../providers/NavigationContext";

// -----------------------------------------------------------------------------
// DEFINICION DE AVATARES
// hombre.glb y mujer.glb estan en /public/models/
// -----------------------------------------------------------------------------
const AVATARS = [
  {
    id:     "male-1",
    name:   "Alejandro",
    gender: "Masculino",
    desc:   "Estudiante activo y curioso.",
    color:  "#93c5fd",
    model:  "/models/hombre 2.glb",
  },
  {
    id:     "female-1",
    name:   "Valentina",
    gender: "Femenino",
    desc:   "Creativa, empatica y decidida.",
    color:  "#f9a8d4",
    model:  "/models/mujer 2.glb",
  },
  {
    id:     "male-2",
    name:   "Sebastian",
    gender: "Masculino",
    desc:   "Apasionado por la tecnologia.",
    color:  "#6ee7b7",
    model:  "/models/hombre.glb",
  },
  {
    id:     "female-2",
    name:   "Mariana",
    gender: "Femenino",
    desc:   "Reflexiva y lista para aprender.",
    color:  "#fcd34d",
    model:  "/models/mujer.glb",
  },
];

// -----------------------------------------------------------------------------
// COMPONENTE: AvatarCanvas
// -----------------------------------------------------------------------------
function AvatarCanvas({ modelUrl, accentColor, isSelected }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // ── Escena y camara ───────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      el.clientWidth / el.clientHeight,
      0.1,
      100
    );
    // Camara alejada para ver el cuerpo completo
    camera.position.set(0, 0.8, 3.8);

    // ── Iluminacion balanceada para preservar colores originales del GLB ──────
    // Ambiental alta para que los colores del modelo se vean sin depender
    // de las luces direccionales
    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);

    // Luz direccional principal suave con sombras
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 5, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 512;
    dirLight.shadow.mapSize.height = 512;
    scene.add(dirLight);

    // Luz frontal de relleno para evitar sombras duras en la cara
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 1, 4);
    scene.add(frontLight);

    // Luz hemisferica suave de suelo
    const fillLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.5);
    scene.add(fillLight);

    // Rim light con el color del avatar desde atras — solo acento sutil
    const rimColor = new THREE.Color(accentColor);
    const rimLight = new THREE.PointLight(rimColor, 0.6, 8);
    rimLight.position.set(-1.5, 2, -2);
    scene.add(rimLight);

    // ── OrbitControls — solo rotacion automatica ──────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom      = false;
    controls.enablePan       = false;
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.05;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 1.5;
    controls.target.set(0, 0.5, 0);
    controls.update();

    // ── Carga del modelo GLB ──────────────────────────────────────────────────
    let modelRef = null;
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Centrado y escalado automatico segun bounding box
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 1.75 / maxDim;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.1;

        // Habilitar sombras — NO modificar colores originales del material
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        modelRef = model;
        setLoaded(true);
      },
      undefined,
      () => setError(true)
    );

    // ── Loop de animacion con efectos procedurales ────────────────────────────
    let rafId;
    const startTime = performance.now();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      if (modelRef) {
        // Flotacion vertical suave
        const baseY = modelRef.userData.baseY ?? modelRef.position.y;
        if (!modelRef.userData.baseY) modelRef.userData.baseY = baseY;
        modelRef.position.y = baseY + Math.sin(elapsed * 1.2) * 0.06;

        // Respiracion (escala pulsante) solo si esta seleccionado
        if (sceneRef.current.isSelected) {
          const breathe = 1 + Math.sin(elapsed * 1.8) * 0.012;
          modelRef.scale.setScalar(modelRef.userData.baseScale * breathe);
        } else {
          if (modelRef.userData.baseScale) {
            modelRef.scale.setScalar(modelRef.userData.baseScale);
          }
        }

        // Guardar escala base la primera vez
        if (!modelRef.userData.baseScale) {
          modelRef.userData.baseScale = modelRef.scale.x;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { renderer, scene, controls, isSelected };

    return () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [modelUrl, accentColor]);

  // Actualiza seleccion y brillo sin reiniciar la escena
  useEffect(() => {
    sceneRef.current.isSelected = isSelected;
    const { renderer } = sceneRef.current;
    if (!renderer) return;
    renderer.domElement.style.transition = "filter 0.3s ease";
    renderer.domElement.style.filter = isSelected
      ? `drop-shadow(0 0 14px ${accentColor}) drop-shadow(0 0 6px ${accentColor}88)`
      : "none";
  }, [isSelected, accentColor]);

  return (
    <div className="av-canvas-wrap">
      <div ref={mountRef} className="av-canvas" />
      {(!loaded || error) && (
        <div className="av-canvas-placeholder" style={{ borderColor: accentColor }}>
          <ChibiSVG color={accentColor} />
          {!error && <span className="av-loading-dot" />}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE: ChibiSVG — placeholder mientras carga el GLB
// -----------------------------------------------------------------------------
function ChibiSVG({ color = "#7ecfff" }) {
  const light = color + "44";
  return (
    <svg viewBox="0 0 80 110" width="80" height="110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="85" rx="22" ry="25" fill={light} stroke={color} strokeWidth="1.5"/>
      <circle cx="40" cy="38" r="26" fill={light} stroke={color} strokeWidth="1.5"/>
      <path d="M14 32 Q18 10 40 12 Q62 10 66 32" fill={color} stroke={color} strokeWidth="1"/>
      <ellipse cx="32" cy="38" rx="4" ry="5" fill={color}/>
      <ellipse cx="48" cy="38" rx="4" ry="5" fill={color}/>
      <circle cx="33.5" cy="36.5" r="1.5" fill="white"/>
      <circle cx="49.5" cy="36.5" r="1.5" fill="white"/>
      <path d="M34 48 Q40 53 46 48" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="27" cy="44" r="4" fill={color} opacity="0.18"/>
      <circle cx="53" cy="44" r="4" fill={color} opacity="0.18"/>
      <ellipse cx="18" cy="78" rx="5" ry="14" fill={light} stroke={color} strokeWidth="1.2" transform="rotate(-10 18 78)"/>
      <ellipse cx="62" cy="78" rx="5" ry="14" fill={light} stroke={color} strokeWidth="1.2" transform="rotate(10 62 78)"/>
      <ellipse cx="32" cy="105" rx="7" ry="9" fill={light} stroke={color} strokeWidth="1.2"/>
      <ellipse cx="48" cy="105" rx="7" ry="9" fill={light} stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE: AvatarSelect — exportacion principal
// -----------------------------------------------------------------------------
export default function AvatarSelect() {
  const rawNavigate = useNavigate();
  const navigate    = useAppNavigate();
  usePageReady();

  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState("Todos");

  const filtered = filter === "Todos"
    ? AVATARS
    : AVATARS.filter((a) => a.gender === filter);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) { rawNavigate("/"); return; }

      await setDoc(doc(db, "users", user.uid), { avatar: selected }, { merge: true });
      localStorage.setItem("avatar", selected);

      const av = AVATARS.find((a) => a.id === selected);
      await Swal.fire({
        icon:               "success",
        title:              `${av.name} seleccionado`,
        text:               "Tu avatar esta listo. Entrando al escenario 3D...",
        confirmButtonText:  "Vamos",
        confirmButtonColor: "#2c5364",
        background:         "#0f2027",
        color:              "#fff",
        iconColor:          av.color,
        timer:              2500,
        timerProgressBar:   true,
      });

      navigate("/home/scene", "Cargando escenario 3D");
    } catch (e) {
      console.error(e);
      setLoading(false);
      Swal.fire({
        icon:               "error",
        title:              "Error",
        text:               "No se pudo guardar el avatar.",
        confirmButtonColor: "#2c5364",
      });
    }
  };

  return (
    <div className="av-page">
      <div className="av-container">

        <div className="av-header">
          <h1 className="av-title">Elige tu avatar</h1>
          <p className="av-subtitle">
            Selecciona el personaje que te representara en el escenario 3D de bienestar.
          </p>
        </div>

        <div className="av-filters">
          {["Todos", "Masculino", "Femenino"].map((f) => (
            <button
              key={f}
              className={`av-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="av-grid">
          {filtered.map((av) => (
            <div
              key={av.id}
              className={`av-card ${selected === av.id ? "selected" : ""}`}
              onClick={() => setSelected(av.id)}
              style={{ "--av-accent": av.color }}
            >
              {selected === av.id && (
                <div className="av-check">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              <AvatarCanvas
                modelUrl={av.model}
                accentColor={av.color}
                isSelected={selected === av.id}
              />
              <div className="av-info">
                <span className="av-gender-tag">{av.gender}</span>
                <h3 className="av-name">{av.name}</h3>
                <p className="av-desc">{av.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="av-btn"
          onClick={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? (
            "Guardando..."
          ) : selected ? (
            <><span>Entrar al escenario 3D</span><ArrowRight size={18} /></>
          ) : (
            "Selecciona un avatar para continuar"
          )}
        </button>

      </div>
    </div>
  );
}