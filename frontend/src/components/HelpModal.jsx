// src/components/HelpModal.jsx

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "../styles/HelpModal.css";
import helpControlsImage from "/images/HelpControls.webp";

// -----------------------------------------------------------------------------
// Efectos de sonido — Web Audio API (sin dependencias)
// -----------------------------------------------------------------------------
// Vibración para móviles — ignora silenciosamente si no está disponible
function vibrate(pattern) {
  try { navigator.vibrate?.(pattern); } catch {}
}

function createAudioCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone({ frequency = 440, type = "sine", duration = 0.12,
                    gain = 0.08, fadeOut = true, delay = 0 } = {}) {
  const ctx = createAudioCtx();
  if (!ctx) return;

  const osc  = ctx.createOscillator();
  const amp  = ctx.createGain();

  osc.connect(amp);
  amp.connect(ctx.destination);

  osc.type      = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  amp.gain.setValueAtTime(gain, ctx.currentTime + delay);
  if (fadeOut) {
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  }

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
}

// Sonido de apertura — acorde suave ascendente (do-mi-sol)
function soundOpen() {
  vibrate([30, 40, 20]); // dos pulsos suaves
  playTone({ frequency: 523.25, type: "sine",     gain: 0.07, duration: 0.18, delay: 0.00 }); // Do
  playTone({ frequency: 659.25, type: "sine",     gain: 0.06, duration: 0.18, delay: 0.08 }); // Mi
  playTone({ frequency: 783.99, type: "sine",     gain: 0.07, duration: 0.22, delay: 0.16 }); // Sol
}

// Sonido de cierre — nota suave descendente
function soundClose() {
  vibrate(25); // pulso breve
  playTone({ frequency: 783.99, type: "sine",     gain: 0.06, duration: 0.14, delay: 0.00 });
  playTone({ frequency: 523.25, type: "sine",     gain: 0.05, duration: 0.18, delay: 0.10 });
}

// Sonido hover en secciones — tick sutil
function soundHover() {
  vibrate(8); // micro-pulso casi imperceptible
  playTone({ frequency: 1200, type: "sine", gain: 0.03, duration: 0.06, delay: 0 });
}

// Sonido botón entendido — confirmación positiva
function soundConfirm() {
  vibrate([20, 30, 20, 30, 60]); // patrón rítmico de confirmación
  playTone({ frequency: 659.25, type: "sine", gain: 0.07, duration: 0.12, delay: 0.00 });
  playTone({ frequency: 880.00, type: "sine", gain: 0.07, duration: 0.12, delay: 0.10 });
  playTone({ frequency: 1046.5, type: "sine", gain: 0.08, duration: 0.20, delay: 0.20 });
}

// -----------------------------------------------------------------------------
// Componente
// -----------------------------------------------------------------------------
const HelpModal = ({ isOpen, onClose }) => {
  const hasPlayed = useRef(false);

  // Sonido de apertura — solo la primera vez que se abre
  useEffect(() => {
    if (isOpen && !hasPlayed.current) {
      soundOpen();
      hasPlayed.current = true;
    }
    if (!isOpen) {
      hasPlayed.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("help-modal-overlay")) {
      soundClose();
      onClose();
    }
  };

  const handleClose = () => {
    soundClose();
    onClose();
  };

  const handleConfirm = () => {
    soundConfirm();
    setTimeout(onClose, 350); // pequeño delay para escuchar el sonido
  };

  return (
    <div
      className="help-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="help-modal-content help-modal-content--compact">

        {/* Botón cerrar */}
        <button
          type="button"
          className="help-modal-close"
          onClick={handleClose}
          aria-label="Cerrar ayuda"
        >
          <X size={20} />
        </button>

        {/* Contenido */}
        <div className="help-modal-scroll">

          {/* Encabezado */}
          <header className="help-modal-header">
            <h2 id="help-modal-title">Guía del Entorno 3D</h2>
            <p>
              Tu espacio de bienestar emocional en la EISC. Explora, interactúa
              y recibe acompañamiento personalizado a tu propio ritmo.
            </p>
          </header>

          {/* Imagen de controles */}
          <section className="help-modal-hero">
            <img
              src={helpControlsImage}
              alt="Controles de teclado para moverse en el entorno 3D"
              loading="lazy"
            />
          </section>

          {/* Secciones con hover sonoro */}
          <section className="help-section" onMouseEnter={soundHover}>
            <h3>Movimiento</h3>
            <p>
              Usa <strong>W A S D</strong> o las <strong>flechas del teclado</strong> para
              desplazarte. Mantén <strong>Shift</strong> para moverte más rápido.
            </p>
          </section>

          <section className="help-section" onMouseEnter={soundHover}>
            <h3>Interacción</h3>
            <p>
              Acércate a los objetos y zonas del entorno para activar actividades,
              mensajes y recursos de bienestar adaptados a tu estado emocional.
            </p>
          </section>

          <section className="help-section" onMouseEnter={soundHover}>
            <h3>Tu sala personalizada</h3>
            <p>
              El escenario cambia según el resultado de tu autoevaluación.
              Cada sala está diseñada para acompañarte en momentos de estrés,
              ansiedad o equilibrio emocional.
            </p>
          </section>

          <section className="help-section" onMouseEnter={soundHover}>
            <h3>Taison — tu asistente</h3>
            <p>
              El perrito en la esquina inferior derecha es Taison. Haz clic en él
              para abrir el chat y recibir orientación emocional, técnicas de
              manejo del estrés y recursos de apoyo de la UV.
            </p>
          </section>

          <section className="help-section" onMouseEnter={soundHover}>
            <h3>Panel de control</h3>
            <p>
              <strong>Base</strong> — regresa al Dashboard principal.<br />
              <strong>Ayuda</strong> — abre esta guía.<br />
              <strong>Salir</strong> — cierra tu sesión de forma segura.
            </p>
          </section>

          <section className="help-section help-tip" onMouseEnter={soundHover}>
            <h3>Recuerda</h3>
            <p>
              Esta herramienta es un complemento de bienestar, no reemplaza
              la atención profesional. Si lo necesitas, Bienestar UV te espera
              en el edificio 304, ext. 2551 / 2552.
            </p>
          </section>

        </div>

        {/* Botón inferior */}
        <button
          type="button"
          className="help-modal-understood"
          onClick={handleConfirm}
        >
          ¡Entendido, a explorar!
        </button>

      </div>
    </div>
  );
};

export default HelpModal;