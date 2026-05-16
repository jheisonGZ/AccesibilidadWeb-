// =============================================================================
// src/hooks/useFeedback.js
// Hook global de sonidos (Web Audio API) + vibraciones para experiencia inmersiva
// =============================================================================

const ctx = { current: null };

const getCtx = () => {
  if (!ctx.current || ctx.current.state === "closed") {
    ctx.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.current.state === "suspended") {
    ctx.current.resume();
  }
  return ctx.current;
};

const tone = (ac, freq, start, duration, type = "sine", vol = 0.25) => {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g);
  g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime + start);
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration);
  o.start(ac.currentTime + start);
  o.stop(ac.currentTime + start + duration + 0.05);
};

// =============================================================================
// CATÁLOGO DE SONIDOS
// =============================================================================
const SOUNDS = {

  // ── Login exitoso: acorde mayor ascendente cálido ──────────────────────────
  loginSuccess: () => {
    try {
      const ac = getCtx();
      tone(ac, 330, 0,    0.15, "sine",     0.2);
      tone(ac, 415, 0.12, 0.15, "sine",     0.2);
      tone(ac, 523, 0.24, 0.25, "sine",     0.25);
      tone(ac, 659, 0.36, 0.35, "triangle", 0.2);
      if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
    } catch (_) {}
  },

  // ── Error de login: tono descendente ──────────────────────────────────────
  loginError: () => {
    try {
      const ac = getCtx();
      tone(ac, 300, 0,    0.15, "sawtooth", 0.15);
      tone(ac, 220, 0.15, 0.2,  "sawtooth", 0.12);
      if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
    } catch (_) {}
  },

  // ── Registro exitoso: fanfarria corta ──────────────────────────────────────
  registerSuccess: () => {
    try {
      const ac = getCtx();
      tone(ac, 392, 0,    0.1,  "sine",     0.2);
      tone(ac, 494, 0.1,  0.1,  "sine",     0.2);
      tone(ac, 587, 0.2,  0.1,  "sine",     0.2);
      tone(ac, 784, 0.3,  0.3,  "triangle", 0.25);
      if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 100]);
    } catch (_) {}
  },

  // ── Navegar / click en tarjeta dashboard: clic suave ──────────────────────
  cardClick: () => {
    try {
      const ac = getCtx();
      tone(ac, 600, 0,    0.06, "sine",     0.15);
      tone(ac, 800, 0.05, 0.08, "sine",     0.1);
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (_) {}
  },

  // ── Selección de opción en cuestionario: ding ─────────────────────────────
  questionSelect: () => {
    try {
      const ac = getCtx();
      tone(ac, 520, 0, 0.12, "sine", 0.2);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (_) {}
  },

  // ── Avanzar pregunta: dos tonos ascendentes ───────────────────────────────
  questionAdvance: () => {
    try {
      const ac = getCtx();
      tone(ac, 440, 0,    0.08, "sine", 0.18);
      tone(ac, 560, 0.09, 0.1,  "sine", 0.18);
      if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
    } catch (_) {}
  },

  // ── Cuestionario completado: melodía celebración ──────────────────────────
  questionFinish: () => {
    try {
      const ac = getCtx();
      tone(ac, 440, 0,    0.1,  "sine",     0.2);
      tone(ac, 554, 0.12, 0.1,  "sine",     0.2);
      tone(ac, 659, 0.24, 0.1,  "sine",     0.2);
      tone(ac, 880, 0.36, 0.3,  "triangle", 0.22);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
    } catch (_) {}
  },

  // ── Avatar seleccionado: tono de confirmación ─────────────────────────────
  avatarSelect: () => {
    try {
      const ac = getCtx();
      tone(ac, 480, 0,    0.08, "sine",     0.18);
      tone(ac, 600, 0.08, 0.12, "triangle", 0.18);
      if (navigator.vibrate) navigator.vibrate([25, 15, 50]);
    } catch (_) {}
  },

  // ── Confirmar avatar y entrar: fanfarria inmersiva ────────────────────────
  avatarConfirm: () => {
    try {
      const ac = getCtx();
      tone(ac, 349, 0,    0.08, "sine",     0.18);
      tone(ac, 440, 0.08, 0.08, "sine",     0.18);
      tone(ac, 523, 0.16, 0.08, "sine",     0.2);
      tone(ac, 698, 0.24, 0.35, "triangle", 0.22);
      if (navigator.vibrate) navigator.vibrate([40, 20, 40, 20, 120]);
    } catch (_) {}
  },

  // ── Entrar al escenario 3D: whoosh + tono ambiental ──────────────────────
  sceneEnter: () => {
    try {
      const ac = getCtx();
      // Ruido de "whoosh" con oscilador de frecuencia descendente
      tone(ac, 800, 0,    0.4,  "sine",     0.1);
      tone(ac, 400, 0.1,  0.4,  "sine",     0.08);
      tone(ac, 200, 0.3,  0.5,  "sine",     0.06);
      tone(ac, 523, 0.5,  0.3,  "triangle", 0.15);
      if (navigator.vibrate) navigator.vibrate([20, 40, 20, 40, 80]);
    } catch (_) {}
  },

  // ── Respuesta del chatbot recibida: notificación suave ────────────────────
  chatbotResponse: () => {
    try {
      const ac = getCtx();
      tone(ac, 440, 0,    0.06, "sine", 0.12);
      tone(ac, 554, 0.07, 0.1,  "sine", 0.1);
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (_) {}
  },

  // ── Enviar mensaje en chatbot: clic de envío ──────────────────────────────
  chatbotSend: () => {
    try {
      const ac = getCtx();
      tone(ac, 700, 0,    0.05, "sine", 0.12);
      tone(ac, 900, 0.05, 0.07, "sine", 0.08);
      if (navigator.vibrate) navigator.vibrate(15);
    } catch (_) {}
  },

  // ── Tocar el perrito Taison: boing juguetón ───────────────────────────────
  taisonBounce: () => {
    try {
      const ac = getCtx();
      tone(ac, 520, 0,    0.06, "sine",     0.18);
      tone(ac, 780, 0.06, 0.08, "triangle", 0.15);
      tone(ac, 520, 0.14, 0.1,  "sine",     0.1);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (_) {}
  },

  // ── Logout: tono de cierre ────────────────────────────────────────────────
  logout: () => {
    try {
      const ac = getCtx();
      tone(ac, 440, 0,    0.1,  "sine", 0.15);
      tone(ac, 330, 0.12, 0.15, "sine", 0.12);
      tone(ac, 220, 0.28, 0.2,  "sine", 0.1);
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    } catch (_) {}
  },

  // ── Progreso cargado: tono informativo ────────────────────────────────────
  progressLoad: () => {
    try {
      const ac = getCtx();
      tone(ac, 370, 0,    0.08, "sine",     0.15);
      tone(ac, 466, 0.09, 0.12, "triangle", 0.15);
      if (navigator.vibrate) navigator.vibrate([20, 10, 40]);
    } catch (_) {}
  },

  // ── Error genérico ────────────────────────────────────────────────────────
  error: () => {
    try {
      const ac = getCtx();
      tone(ac, 250, 0,   0.18, "sawtooth", 0.15);
      tone(ac, 200, 0.2, 0.18, "sawtooth", 0.12);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (_) {}
  },
};

// =============================================================================
// HOOK
// =============================================================================
export const useFeedback = () => SOUNDS;