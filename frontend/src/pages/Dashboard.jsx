import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import Swal from "sweetalert2";
import { ClipboardList, User, Globe, BarChart3 } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Dashboard() {
  const { alias, user } = useAuth();
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [avatarSelected, setAvatarSelected] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false); // ← Nuevo

  // Precargar la imagen de fondo
  useEffect(() => {
    const img = new Image();
    img.src = "/images/dashboard.webp";
    img.onload = () => {
      setBackgroundLoaded(true);
      document.querySelector('.dashboard-page')?.classList.add('loaded');
    };
  }, []);

  // Leer estado real del usuario desde Firestore
  useEffect(() => {
    if (!user) return;
    const fetchState = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setQuestionnaireCompleted(!!data.lastEmotion);
          setAvatarSelected(!!data.avatar);
        }
      } catch (e) {
        console.error("Error leyendo estado del usuario:", e);
      } finally {
        setLoadingState(false);
      }
    };
    fetchState();
  }, [user]);

  // Mostrar skeleton mientras carga la imagen
  if (!backgroundLoaded || loadingState) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading"></div>
        <div className="dashboard-container" style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          minHeight: "60vh",
          position: "relative",
          zIndex: 1
        }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>
            Cargando tu espacio...
          </p>
        </div>
      </div>
    );
  }

  // El resto de tu componente Dashboard sigue igual...
  const showQuestionnaireReminder = () => {
    Swal.fire({
      icon: "warning",
      title: "Debes completar el cuestionario",
      text: "Primero debes llenar el cuestionario para poder elegir un avatar.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2c5364",
      background: "#0f2027",
      color: "#fff",
    });
  };

  const showAvatarReminder = () => {
    Swal.fire({
      icon: "info",
      title: "Selecciona un avatar",
      text: "Debes elegir un avatar antes de entrar al escenario 3D.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2c5364",
      background: "#0f2027",
      color: "#fff",
    });
  };

  const confirmChangeAvatar = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Cambiar avatar?",
      text: "¿Quieres elegir un avatar diferente al que ya tienes seleccionado?",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "No, quedarse",
      confirmButtonColor: "#2c5364",
      background: "#0f2027",
      color: "#fff",
    });
    return result.isConfirmed;
  };

  const initial = alias?.charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* BIENVENIDA */}
        <div className="dashboard-welcome">
          <div className="dashboard-avatar">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" />
              : <span>{initial}</span>
            }
          </div>
          <div className="dashboard-welcome-text">
            <span className="dashboard-welcome-label">Bienvenido</span>
            <span className="dashboard-welcome-alias">{alias}</span>
          </div>
        </div>

        {/* TÍTULO */}
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">Tu espacio de bienestar emocional</h1>
          <p className="dashboard-subtitle">
            Explora las herramientas diseñadas para acompañarte durante tu vida universitaria.
          </p>
        </div>

        {/* TARJETAS */}
        <div className="dashboard-grid">

          {/* 1. Cuestionario */}
          <Link to="/home/questionnaire" className="dashboard-card">
            <ClipboardList size={28} />
            <h3>{questionnaireCompleted ? "Repetir cuestionario" : "Hacer cuestionario"}</h3>
            <p>{questionnaireCompleted ? "Vuelve a hacer el test" : "Completa el test de accesibilidad"}</p>
          </Link>

          {/* 2. Avatar */}
          {questionnaireCompleted ? (
            avatarSelected ? (
              <div
                className="dashboard-card"
                onClick={async () => {
                  const confirmed = await confirmChangeAvatar();
                  if (confirmed) window.location.href = "/home/avatar";
                }}
                style={{ cursor: "pointer" }}
              >
                <User size={28} />
                <h3>Cambiar avatar</h3>
                <p>¿Quieres elegir otro?</p>
              </div>
            ) : (
              <Link to="/home/avatar" className="dashboard-card">
                <User size={28} />
                <h3>Elegir avatar</h3>
                <p>Selecciona tu representación</p>
              </Link>
            )
          ) : (
            <div className="dashboard-card disabled" onClick={showQuestionnaireReminder}>
              <User size={28} />
              <h3>Elegir avatar</h3>
              <p>Completa el cuestionario primero</p>
            </div>
          )}

          {/* 3. Escenario 3D */}
          {avatarSelected ? (
            <Link to="/home/scene" className="dashboard-card">
              <Globe size={28} />
              <h3>Escenario 3D</h3>
              <p>Explora el entorno interactivo</p>
            </Link>
          ) : (
            <div className="dashboard-card disabled" onClick={showAvatarReminder}>
              <Globe size={28} />
              <h3>Escenario 3D</h3>
              <p>Elige un avatar primero</p>
            </div>
          )}

          {/* 4. Progreso */}
          <Link to="/home/progress" className="dashboard-card">
            <BarChart3 size={28} />
            <h3>Ver progreso</h3>
            <p>Consulta tus resultados</p>
          </Link>

        </div>

        <p className="dashboard-footer">
          Aquí aparecerán recomendaciones y tu historial.
        </p>

      </div>
    </div>
  );
}