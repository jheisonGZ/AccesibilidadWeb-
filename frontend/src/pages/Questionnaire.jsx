import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  doc, setDoc, addDoc, collection, getDocs,
  orderBy, query, limit, serverTimestamp, increment
} from "firebase/firestore";
import Swal from "sweetalert2";
import {
  Wind, Brain, BookOpen, BatteryLow, Zap, CloudRain, Activity,
  Heart, AlertTriangle, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, Frown, HeartCrack
} from "lucide-react";
import "../styles/questionnaire.css";
import { useAppNavigate } from "../providers/NavigationContext";

/*
 * CUESTIONARIO — 7 preguntas
 * Fuentes: GAD-7 (Spitzer et al., 2006), PHQ-9 (Kroenke et al., 2001),
 *          BDI-II (Beck et al., 1996), HAM-A (Hamilton, 1959)
 */
const QUESTIONS = [
  {
    id: "q1",
    text: "Me he sentido nervioso/a, ansioso/a o con los nervios de punta.",
    icon: Wind,
    dimension: "ansiedad",
    fuente: "GAD-7 ítem 1 · Spitzer et al., 2006",
  },
  {
    id: "q2",
    text: "No he podido dejar de preocuparme o controlar mis preocupaciones.",
    icon: Brain,
    dimension: "ansiedad",
    fuente: "GAD-7 ítem 2 · Spitzer et al., 2006",
  },
  {
    id: "q3",
    text: "Me he sentido triste o con el ánimo muy bajo sin saber bien por qué.",
    icon: Frown,
    dimension: "ansiedad",
    fuente: "BDI-II ítem 1 · Beck et al., 1996",
  },
  {
    id: "q4",
    text: "Me ha costado concentrarme en mis actividades académicas.",
    icon: BookOpen,
    dimension: "estres",
    fuente: "GAD-7 ítem 3 / PHQ-9 ítem 7 · Spitzer et al., 2006; Kroenke et al., 2001",
  },
  {
    id: "q5",
    text: "Me he sentido agotado/a o con poca energía durante el día.",
    icon: BatteryLow,
    dimension: "estres",
    fuente: "PHQ-9 ítem 4 · Kroenke et al., 2001",
  },
  {
    id: "q6",
    text: "He tenido síntomas físicos como palpitaciones, sudoración o sensación de ahogo al estresarme.",
    icon: Zap,
    dimension: "ansiedad",
    fuente: "HAM-A ítem 13 · Hamilton, 1959",
  },
  {
    id: "q7",
    text: "He tenido pensamientos negativos sobre mi futuro o he sentido que no soy suficientemente capaz.",
    icon: HeartCrack,
    dimension: "estres",
    fuente: "BDI-II ítems 3 & 5 · Beck et al., 1996",
  },
];

const OPTIONS = [
  { value: 0, label: "Nunca",           sublabel: "No me ha ocurrido"  },
  { value: 1, label: "Varios días",     sublabel: "Algunas veces"      },
  { value: 2, label: "Más de la mitad", sublabel: "Con frecuencia"     },
  { value: 3, label: "Casi siempre",    sublabel: "La mayoría de días" },
];

/*
 * Paleta de 7 colores — uno por pregunta
 * Transición suave de azul → cyan → teal → verde → amarillo → naranja → violeta
 * Se aplica como CSS variable --q-accent directamente en el style del contenedor.
 * Todos los elementos de acento (barra, ícono, círculo, badge, dots) leen esa variable.
 */
const STEP_COLORS = [
  "#7ecfff", // p1 — azul claro
  "#60c8f0", // p2 — azul cyan
  "#4dc9c9", // p3 — teal
  "#5dd68a", // p4 — verde
  "#f0c14b", // p5 — amarillo dorado
  "#f09050", // p6 — naranja
  "#c084fc", // p7 — violeta
];

const MAX_SCORE = QUESTIONS.length * 3; // 21

const classify = (score) => {
  if (score >= 15) return { label: "Ansiedad elevada",  Icon: AlertCircle,   color: "#f87171", key: "ansiedad", desc: "Se recomienda buscar apoyo profesional." };
  if (score >= 10) return { label: "Estrés moderado",   Icon: AlertTriangle, color: "#fbbf24", key: "estres",   desc: "Considera técnicas de manejo del estrés." };
  if (score >= 5)  return { label: "Leve malestar",     Icon: Activity,      color: "#34d399", key: "leve",     desc: "Pequeños ajustes pueden ayudarte." };
  return                  { label: "Bienestar estable", Icon: Heart,         color: "#7ecfff", key: "neutro",   desc: "¡Vas muy bien! Sigue así." };
};

const calcDimensionScores = (answers) => {
  let puntaje_ansiedad = 0;
  let puntaje_estres   = 0;
  QUESTIONS.forEach((q, i) => {
    const val = answers[i] ?? 0;
    if (q.dimension === "ansiedad") puntaje_ansiedad += val;
    else                            puntaje_estres   += val;
  });
  return { puntaje_ansiedad, puntaje_estres };
};

const lineFillPercent = (val) => val === null ? 0 : Math.round((val / 3) * 100);

export default function Questionnaire() {
  const rawNavigate = useNavigate();
  const navigate    = useAppNavigate();

  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  const score    = useMemo(() => answers.reduce((a, b) => a + (b ?? 0), 0), [answers]);
  const result   = useMemo(() => classify(score), [score]);
  const progress = (step / QUESTIONS.length) * 100;

  const current   = QUESTIONS[step];
  const Icon      = current?.icon;
  const accentColor = STEP_COLORS[step] ?? STEP_COLORS[0];

  const handleSelect = (value) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) setStep(s => s + 1);
      else setDone(true);
    }, 320);
  };

  const handleBack = () => {
    if (done) { setDone(false); return; }
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    localStorage.setItem("emotion", result.key);
    try {
      const user = auth.currentUser;
      if (!user) { rawNavigate("/"); return; }

      const { puntaje_ansiedad, puntaje_estres } = calcDimensionScores(answers);
      const respuestas = QUESTIONS.map((q, i) => ({
        id: q.id, pregunta: q.text, dimension: q.dimension,
        valor: answers[i] ?? 0,
        etiqueta: OPTIONS[answers[i] ?? 0]?.label ?? "Nunca",
        fuente: q.fuente,
      }));

      let puntaje_anterior = null;
      try {
        const prevSnap = await getDocs(query(
          collection(db, "users", user.uid, "assessments"),
          orderBy("createdAt", "desc"), limit(1)
        ));
        if (!prevSnap.empty) puntaje_anterior = prevSnap.docs[0].data().score ?? null;
      } catch (_) {}

      const mejora = puntaje_anterior !== null ? puntaje_anterior - score : null;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email, lastEmotion: result.key,
        nivel_progreso: result.key, updatedAt: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, "users", user.uid, "assessments"), {
        id_usuario: user.uid, email: user.email, createdAt: serverTimestamp(),
        respuestas, score, puntaje_estres, puntaje_ansiedad,
        classification: result.key, puntaje_emocional: result.label,
        puntaje_anterior, mejora,
      });

      await setDoc(doc(db, "users", user.uid, "meta", "stats"), {
        totalAssessments: increment(1), lastScore: score,
        scoreImprovement: mejora !== null ? increment(Math.max(0, mejora)) : increment(0),
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      await Swal.fire({
        icon: "success", title: result.label,
        html: `Tu puntaje fue <b>${score} / ${MAX_SCORE}</b>.<br/>${result.desc}`,
        confirmButtonText: "Elegir avatar", confirmButtonColor: "#2c5364",
        background: "#0f2027", color: "#fff", iconColor: result.color,
      });

      navigate("/home/avatar", "Preparando tu avatar");

    } catch (e) {
      console.error(e);
      setSaving(false);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar. Intenta de nuevo.", confirmButtonColor: "#2c5364" });
    }
  };

  /* ══ PANTALLA RESULTADO ══ */
  if (done) {
    const { Icon: ResIcon, label, color, desc } = result;
    const { puntaje_ansiedad, puntaje_estres }  = calcDimensionScores(answers);
    const maxAnsiedad = QUESTIONS.filter(q => q.dimension === "ansiedad").length * 3;
    const maxEstres   = QUESTIONS.filter(q => q.dimension === "estres").length   * 3;

    return (
      <div className="q-page">
        <div className="q-container q-result-screen">
          <div className="q-result-icon-big" style={{ color }}>
            <ResIcon size={64} strokeWidth={1.5} />
          </div>
          <h2 className="q-result-title" style={{ color }}>{label}</h2>
          <p className="q-result-desc">{desc}</p>

          <div className="q-score-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={`${(score / MAX_SCORE) * 314} 314`}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="q-score-center">
              <span className="q-score-num" style={{ color }}>{score}</span>
              <span className="q-score-max">/ {MAX_SCORE}</span>
            </div>
          </div>

          <div className="q-dimension-breakdown">
            <div className="q-dim-item">
              <AlertTriangle size={14} color="#fbbf24" />
              <span className="q-dim-label">Estrés</span>
              <div className="q-dim-bar-track">
                <div className="q-dim-bar-fill" style={{ width: `${(puntaje_estres / maxEstres) * 100}%`, background: "#fbbf24" }} />
              </div>
              <span className="q-dim-val" style={{ color: "#fbbf24" }}>{puntaje_estres}/{maxEstres}</span>
            </div>
            <div className="q-dim-item">
              <AlertCircle size={14} color="#f87171" />
              <span className="q-dim-label">Ansiedad</span>
              <div className="q-dim-bar-track">
                <div className="q-dim-bar-fill" style={{ width: `${(puntaje_ansiedad / maxAnsiedad) * 100}%`, background: "#f87171" }} />
              </div>
              <span className="q-dim-val" style={{ color: "#f87171" }}>{puntaje_ansiedad}/{maxAnsiedad}</span>
            </div>
          </div>

          <div className="q-answers-summary">
            {QUESTIONS.map((q, i) => {
              const Q   = q.icon;
              const opt = OPTIONS[answers[i]];
              return (
                <div className="q-summary-row" key={i}>
                  <Q size={16} style={{ color: "#7ecfff", flexShrink: 0 }} />
                  <span className="q-summary-q">{q.text}</span>
                  <span className="q-summary-a" style={{ color }}>{opt?.label}</span>
                </div>
              );
            })}
          </div>

          <div className="q-result-actions">
            <button className="q-btn-back" onClick={handleBack}>
              <ArrowLeft size={16} /> Revisar
            </button>
            <button className="q-btn-submit" onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : <><CheckCircle size={18} /> Confirmar y continuar</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══ PANTALLA PREGUNTA ══ */
  return (
    /* --q-accent cambia en cada paso → todos los elementos de color lo leen */
    <div className="q-page" style={{ "--q-accent": accentColor }}>
      <div className="q-container">

        <div className="q-top">
          <div className="q-step-label">
            Pregunta <b>{step + 1}</b> de {QUESTIONS.length}
          </div>
          <div className="q-progress-bar">
            <div className="q-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="q-card-single" key={step}>
          <div className="q-card-icon-wrap">
            <Icon size={30} strokeWidth={1.5} />
          </div>

          <p className="q-card-question">{current.text}</p>
          <span className="q-source-badge">{current.fuente}</span>
          <p className="q-card-hint">¿Con qué frecuencia en los últimos 7 días?</p>

          <div className="q-scale-wrapper">
            <div className="q-scale-row">
              {/* línea — primer elemento del DOM, queda debajo */}
              <div className="q-scale-line">
                <div className="q-scale-line-fill" style={{ width: `${lineFillPercent(answers[step])}%` }} />
              </div>

              {/* opciones — z-index:1 en CSS, tapan la línea */}
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`q-option-card ${answers[step] === opt.value ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <div className="q-opt-circle">
                    <span className="q-opt-value">{opt.value}</span>
                  </div>
                  <span className="q-opt-label">{opt.label}</span>
                  <span className="q-opt-sub">{opt.sublabel}</span>
                </button>
              ))}
            </div>

            <div className="q-scale-extremes">
              <span className="q-scale-extreme">← Menor frecuencia</span>
              <span className="q-scale-extreme">Mayor frecuencia →</span>
            </div>
          </div>
        </div>

        <div className="q-nav">
          <button className="q-btn-back" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft size={16} /> Anterior
          </button>
          {answers[step] !== null && step < QUESTIONS.length - 1 && (
            <button className="q-btn-next" onClick={() => setStep(s => s + 1)}>
              Siguiente <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="q-dots">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`q-dot ${i === step ? "active" : ""} ${answers[i] !== null ? "answered" : ""}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}