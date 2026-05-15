// =============================================================================
// src/components/ChatBotUI.jsx
// VERSIÓN CORREGIDA - Sin problemas de posición al hacer clic
// =============================================================================

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useAuth } from "../providers/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { gsap } from "gsap";
import "../styles/chatbot.css";

const TAISON_MODEL = "/models/taison.glb";

// -----------------------------------------------------------------------------
// SISTEMA DE PROMPTS (se mantiene igual)
// -----------------------------------------------------------------------------

const BASE_PROMPT =
  "Eres Taison, un asistente virtual de bienestar emocional creado exclusivamente " +
  "para los estudiantes de la Escuela de Ingenieria de Sistemas y Computacion (EISC) " +
  "de la Universidad del Valle, en Santiago de Cali, Colombia. " +
  "PROPOSITO: Brindar acompanamiento emocional, orientacion en autocuidado y recursos " +
  "de manejo del estres academico. Solo puedes abordar temas de bienestar emocional, " +
  "estres academico, ansiedad universitaria, tecnicas de relajacion, habitos de autocuidado, " +
  "vida universitaria en la EISC o la UV, y recursos institucionales. " +
  "RESTRICCION ABSOLUTA: Si el usuario pregunta algo ajeno al bienestar emocional " +
  "universitario, responde amablemente que esta fuera de tu alcance y redirige. " +
  "Nunca respondas preguntas tecnicas ni generales aunque insistan. " +
  "PERSONALIDAD: Calido, cercano, empatico y optimista. Lenguaje informal pero respetuoso. " +
  "Nunca condescendiente ni minimizas emociones. " +
  "CONTEXTO: En la EISC el 70.6% identifica la carga academica como principal estresante. " +
  "El 76.5% no usa servicios psicologicos UV. Estudiantes de 18-26 anos. " +
  "TECNICAS: Respiracion 4-7-8 (inhala 4, sostiene 7, exhala 8). " +
  "Grounding 5-4-3-2-1 (5 ves, 4 tocas, 3 escuchas, 2 hueles, 1 saboreas). " +
  "Pomodoro (25 min trabajo, 5 descanso). Matriz Eisenhower (urgente/importante). " +
  "Higiene del sueno, pausas activas cada 45 min, escritura emocional 5 min/dia. " +
  "LIMITES: Nunca diagnosticas. En crisis remite a Bienestar UV edificio 304 ext 2551/2552. " +
  "FORMATO: Maximo 4 oraciones. Sin listas salvo que se pidan. Espanol colombiano. " +
  "IDENTIDAD: Creado por Jheison Estiben Gomez Munoz, trabajo de grado UV, " +
  "bajo direccion del PhD Javier Mauricio Reyes Vera.";

const SYSTEM_PROMPTS = {
  neutro:
    BASE_PROMPT +
    " NIVEL: BIENESTAR ESTABLE (0-4). Sin sintomas significativos. " +
    "Refuerza positivamente, ofrece estrategias preventivas y habitos protectores.",
  leve:
    BASE_PROMPT +
    " NIVEL: LEVE MALESTAR (5-9). Sintomas leves, nivel mas comun en EISC. " +
    "Valida sin minimizar. Ofrece una o dos tecnicas aplicables hoy.",
  estres:
    BASE_PROMPT +
    " NIVEL: ESTRES MODERADO (10-14). Perfil del 70.6% de estudiantes EISC. " +
    "Ayuda a priorizar con Pomodoro o Eisenhower. Ofrece respiracion 4-7-8. " +
    "Si menciona materias o fechas, crea un mini plan de accion.",
  ansiedad:
    BASE_PROMPT +
    " NIVEL: ANSIEDAD ELEVADA (15-21). ESTRATEGIA OBLIGATORIA: primero calma, luego orienta. " +
    "Comienza siempre con respiracion o grounding. Frases: 'Estoy aqui contigo', " +
    "'Lo que sientes es real', 'Vamos paso a paso'. Sugiere Bienestar UV con gentileza. " +
    "NUNCA minimices. NUNCA listes consejos en crisis.",
};

const WELCOME_MESSAGES = {
  neutro:
    "Woof! Hola, soy Taison. Ya completaste tu autoevaluacion y elegiste tu avatar, " +
    "eso significa que ya estas inmerso en tu entorno virtual de bienestar. " +
    "Tu estado emocional se ve estable hoy, y eso vale la pena cuidar. " +
    "En que puedo acompanarte?",
  leve:
    "Woof! Hola, soy Taison. Ya diste los pasos para sumergirte en tu entorno de apoyo, " +
    "eso requiere valentia y autoconsciencia. " +
    "Veo que has tenido algunos momentos dificiles ultimamente. " +
    "Estoy aqui para escucharte sin juzgarte. Que esta pasando?",
  estres:
    "Woof! Hola, soy Taison. Ya estas dentro de tu entorno virtual de bienestar emocional, " +
    "un espacio disenado para acompanarte en momentos como este. " +
    "Noto que estas cargando bastante estres. La EISC puede ser muy exigente y eso es real. " +
    "Cuentame, por donde quieres empezar?",
  ansiedad:
    "Woof... Hola, soy Taison. Me alegra que estes aqui, en este espacio virtual " +
    "creado para acompanarte en los momentos mas dificiles. " +
    "No estas solo en esto. Hagamos un ejercicio juntos: " +
    "inhala 4 segundos, sostiene 7, exhala 8. Cuando estes listo, cuentame.",
};

const WELCOME_SIN_TEST =
  "Woof! Hola, soy Taison, tu companero de bienestar en la EISC. " +
  "Para acompanarte de la mejor forma, te recomiendo seguir estos pasos: " +
  "primero completa el cuestionario de autoevaluacion emocional en el Dashboard, " +
  "luego elige tu avatar personalizado, y finalmente sumergete en tu entorno virtual " +
  "de apoyo psicoemocional disenado especialmente para ti. " +
  "Cuando estes listo, vuelve y charlamos. Woof!";

const EMO_COLORS = {
  neutro:   "#00eaff",
  leve:     "#00ff88",
  estres:   "#ffcc00",
  ansiedad: "#ff4466",
};

const PATRONES_PROHIBIDOS = [
  /\d+\s*[\+\-\*\/]\s*\d+/,
  /\b(suma|resta|multiplica|divide|integral|derivada|ecuacion|algebra|calculo)\b/i,
  /\b(codigo|programa|algoritmo|funcion|array|bucle|for|while|class|import|variable)\b/i,
  /\b(receta|ingredientes|cocinar|pelicula|serie|cancion|juego|videojuego)\b/i,
  /\b(politica|presidente|gobierno|noticias|economia|futbol|deporte)\b/i,
];

const esTemaFueraDeScope = (texto) =>
  PATRONES_PROHIBIDOS.some((patron) => patron.test(texto));

// -----------------------------------------------------------------------------
// COMPONENTE: TaisonModel - VERSIÓN CORREGIDA
// -----------------------------------------------------------------------------
function TaisonModel({ isOpen, onToggle, isTypingRef }) {
  const { scene, animations } = useGLTF(TAISON_MODEL);
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  
  // Refs para controlar animaciones sin causar problemas de posición
  const bounceAnimationRef = useRef(null);
  const originalYRef = useRef(-0.3); // Posición Y original del modelo
  const isBouncingRef = useRef(false);
  const typingAnimationRef = useRef(null);

  // Configuración de animaciones disponibles
  const ANIMATIONS = {
    idle: 'Idle',
    typing: 'Typing',
    happy: 'Happy',
    wave: 'Wave'
  };

  // Función segura para reproducir animaciones
  const playAnimation = (animName, fadeIn = 0.3, autoStop = false) => {
    if (!actions || !animName) return;
    
    const anim = actions[animName];
    if (anim) {
      anim.reset().fadeIn(fadeIn).play();
      
      if (autoStop) {
        setTimeout(() => {
          if (actions[animName]) {
            actions[animName].fadeOut(0.5);
          }
        }, autoStop);
      }
    }
  };

  // Efecto para manejar animación de escritura
  useEffect(() => {
    if (!groupRef.current) return;
    
    if (isTypingRef.current) {
      // Si tiene animación nativa de typing, usarla
      if (actions[ANIMATIONS.typing]) {
        playAnimation(ANIMATIONS.typing, 0.2);
      } 
      // Si no, crear animación manual PERO sin modificar la posición base
      else {
        // Limpiar animación anterior si existe
        if (typingAnimationRef.current) {
          typingAnimationRef.current.kill();
        }
        
        // Guardar rotación original
        const originalRotZ = groupRef.current.rotation.z || 0;
        
        // Solo animar rotación, NO la posición Y
        typingAnimationRef.current = gsap.to(groupRef.current.rotation, {
          z: originalRotZ + 0.15,
          duration: 0.15,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          onRepeat: () => {
            // Pequeño movimiento de "cabeza" adicional
            if (groupRef.current && isTypingRef.current) {
              groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.05;
            }
          }
        });
      }
    } else {
      // Dejar de escribir - restaurar rotación
      if (typingAnimationRef.current) {
        typingAnimationRef.current.kill();
        typingAnimationRef.current = null;
      }
      
      // Restaurar rotación suavemente
      if (groupRef.current) {
        gsap.to(groupRef.current.rotation, {
          z: 0,
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
      
      // Volver a animación idle
      if (actions[ANIMATIONS.idle]) {
        playAnimation(ANIMATIONS.idle, 0.5);
      }
    }
    
    return () => {
      if (typingAnimationRef.current) {
        typingAnimationRef.current.kill();
      }
    };
  }, [isTypingRef.current, actions]);

  // Función de bounce CORREGIDA - usa timeline y restaura posición exacta
  const playBounceAnimation = () => {
    if (!groupRef.current || isBouncingRef.current) return;
    
    isBouncingRef.current = true;
    
    // Limpiar animación anterior si existe
    if (bounceAnimationRef.current) {
      bounceAnimationRef.current.kill();
    }
    
    // Posición exacta original
    const originalY = originalYRef.current;
    
    // Timeline de bounce (solo temporal, siempre vuelve a Y original)
    bounceAnimationRef.current = gsap.timeline({
      onComplete: () => {
        // Asegurar que vuelve EXACTAMENTE a la posición original
        if (groupRef.current) {
          groupRef.current.position.y = originalY;
        }
        isBouncingRef.current = false;
        bounceAnimationRef.current = null;
      }
    });
    
    bounceAnimationRef.current
      .to(groupRef.current.position, {
        y: originalY + 0.12,
        duration: 0.1,
        ease: "power2.out"
      })
      .to(groupRef.current.position, {
        y: originalY,
        duration: 0.15,
        ease: "bounce.out"
      });
    
    // Reproducir animación de felicidad si existe
    if (actions[ANIMATIONS.happy]) {
      playAnimation(ANIMATIONS.happy, 0.15, 500);
    } else if (actions[ANIMATIONS.wave]) {
      playAnimation(ANIMATIONS.wave, 0.15, 600);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    playBounceAnimation(); // Solo bounce, sin modificar posición permanente
    onToggle();
  };

  // Loop de animación idle (NO modifica la posición base permanentemente)
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Solo movimiento cuando está en idle y NO está escribiendo
    if (!isTypingRef.current && !isOpen && !isBouncingRef.current) {
      const t = state.clock.getElapsedTime();
      // Movimiento SUTIL alrededor de la posición original
      groupRef.current.position.y = originalYRef.current + Math.sin(t * 1.2) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.1;
    } else if (!isTypingRef.current && !isBouncingRef.current) {
      // Cuando el chat está abierto, mantener posición estable
      groupRef.current.position.y = originalYRef.current;
    }
  });

  // Efectos hover
  const handlePointerOver = () => {
    if (!groupRef.current || isTypingRef.current || isBouncingRef.current) return;
    gsap.to(groupRef.current.scale, {
      x: 1.05,
      y: 1.05,
      z: 1.05,
      duration: 0.2,
      ease: "power2.out"
    });
  };

  const handlePointerOut = () => {
    if (!groupRef.current) return;
    gsap.to(groupRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.2,
      ease: "power2.out"
    });
  };

  return (
    <group 
      ref={groupRef} 
      position={[0, originalYRef.current, -3]}
    >
      <primitive
        object={scene}
        scale={150}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE: ChatPanel (se mantiene igual)
// -----------------------------------------------------------------------------
function ChatPanel({ emotion, onClose, panelRef, onTyping }) {
  const mensajeInicial = emotion
    ? (WELCOME_MESSAGES[emotion] || WELCOME_MESSAGES.neutro)
    : WELCOME_SIN_TEST;

  const [messages, setMessages] = useState([
    { role: "assistant", text: mensajeInicial },
  ]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const bottomRef     = useRef();
  const sendBtnRef    = useRef();
  const typingRef     = useRef();
  const dotsRef       = useRef([]);
  const typingTimeout = useRef();
  const emoColor      = EMO_COLORS[emotion] || "#00eaff";

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeout.current);
      onTyping(false);
    };
  }, []);

  useEffect(() => {
    if (!loading || !typingRef.current) return;

    gsap.to(typingRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.25,
      ease: "power2.out",
    });

    const tl = gsap.timeline({ repeat: -1 });
    dotsRef.current.forEach((dot, i) => {
      if (!dot) return;
      tl.to(dot, {
        y: -5,
        duration: 0.3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1,
      }, i * 0.15);
    });

    return () => tl.kill();
  }, [loading]);

  useEffect(() => {
    const bubbles = document.querySelectorAll(".chatbot-bubble");
    if (!bubbles.length) return;
    const last = bubbles[bubbles.length - 1];
    gsap.to(last, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
    });
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 800);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    clearTimeout(typingTimeout.current);
    onTyping(false);

    gsap.fromTo(
      sendBtnRef.current,
      { scale: 0.88 },
      { scale: 1, duration: 0.3, ease: "elastic.out(1.2, 0.5)" }
    );

    if (esTemaFueraDeScope(text)) {
      setMessages((m) => [
        ...m,
        { role: "user", text },
        {
          role: "assistant",
          text:
            "Ese tema esta fuera de lo que puedo ayudarte. Solo puedo acompanarte " +
            "en temas de bienestar emocional universitario. " +
            "Cuentame, como te has sentido con la carga academica?",
        },
      ]);
      setInput("");
      return;
    }

    const newHistory = [...history, { role: "user", content: text }];
    setMessages((m) => [...m, { role: "user", text }]);
    setHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:   SYSTEM_PROMPTS[emotion] || SYSTEM_PROMPTS.neutro,
          messages: newHistory,
        }),
      });
      const data  = await res.json();
      const reply = data.content?.[0]?.text || "Lo siento, no pude responder ahora.";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Estoy teniendo problemas de conexion. Asegurate de que el backend este corriendo.",
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="chatbot-panel" ref={panelRef}>

      <div className="chatbot-header" style={{ borderBottom: `1px solid ${emoColor}22` }}>
        <div className="chatbot-header-left">
          <div
            className="chatbot-online-dot"
            style={{ background: emoColor, boxShadow: `0 0 8px ${emoColor}` }}
          />
          <div>
            <div className="chatbot-title">Taison</div>
            <div className="chatbot-subtitle">Bienestar EISC — Univalle</div>
          </div>
        </div>
        <button className="chatbot-close" onClick={onClose}>✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chatbot-msg-row ${m.role === "user" ? "user" : "bot"}`}>
            <div className={`chatbot-bubble ${m.role === "user" ? "user" : "bot"}`}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chatbot-typing-row" ref={typingRef}>
            <div className="chatbot-typing-bubble">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="chatbot-typing-dot"
                  ref={(el) => (dotsRef.current[i] = el)}
                  style={{ background: emoColor }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chatbot-input-row">
        <input
          className="chatbot-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={emotion ? "Escribe tu mensaje..." : "Completa el cuestionario primero..."}
          disabled={loading || !emotion}
        />
        <button
          ref={sendBtnRef}
          className="chatbot-send"
          onClick={send}
          disabled={loading || !input.trim() || !emotion}
          style={{ background: `${emoColor}55` }}
        >
          &#62;
        </button>
      </div>

    </div>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTE: ChatBotUI - EXPORTACIÓN PRINCIPAL
// -----------------------------------------------------------------------------
export default function ChatBotUI() {
  const [isOpen,  setIsOpen]  = useState(false);
  const [emotion, setEmotion] = useState(null);
  const { user } = useAuth();

  const isTypingRef = useRef(false);
  const panelRef   = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!user) return;
    const fetchEmotion = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setEmotion(snap.data().lastEmotion || null);
        }
      } catch {
        setEmotion(localStorage.getItem("emotion") || null);
      }
    };
    fetchEmotion();
  }, [user]);

  useEffect(() => {
    if (!tooltipRef.current || isOpen) return;
    gsap.to(tooltipRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.3,
    });
  }, [isOpen]);

  useEffect(() => {
    if (!panelRef.current) return;
    if (isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!panelRef.current) { setIsOpen(false); return; }
    gsap.to(panelRef.current, {
      opacity: 0,
      y: 16,
      scale: 0.96,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => setIsOpen(false),
    });
  };

  const handleTyping = (val) => {
    isTypingRef.current = val;
  };

  return (
    <div className="chatbot-wrapper">

      {isOpen && (
        <ChatPanel
          emotion={emotion}
          onClose={handleClose}
          panelRef={panelRef}
          onTyping={handleTyping}
        />
      )}

      {!isOpen && (
        <div
          ref={tooltipRef}
          className="chatbot-tooltip"
          onClick={() => setIsOpen(true)}
        >
          {emotion ? "Woof! En que puedo ayudarte" : "Haz el cuestionario primero"}
        </div>
      )}

      <div className="chatbot-canvas">
        <Canvas
          camera={{ position: [0, 0, 1.8], fov: 55 }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[2, 4, 2]} intensity={1.8} />
          <pointLight position={[-2, 2, 2]} intensity={0.6} color="#7ecfff" />
          <Suspense fallback={null}>
            <TaisonModel
              isOpen={isOpen}
              isTypingRef={isTypingRef}
              onToggle={() => (isOpen ? handleClose() : setIsOpen(true))}
            />
          </Suspense>
        </Canvas>
      </div>

    </div>
  );
}