import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendEmailVerification, reload } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

export default function EmailVerification() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setCountdown(60); // 60 segundos de espera
        Swal.fire({
          title: "Correo enviado",
          html: `
            <div class="text-start">
              <p><strong>Se ha reenviado el correo de verificación a:</strong></p>
              <p class="fw-bold text-primary">${auth.currentUser.email}</p>
              <p>Por favor:</p>
              <ul class="text-start">
                <li>Revisa tu <strong>bandeja de entrada</strong></li>
                <li>Si no lo encuentras, revisa tu <strong>carpeta de spam</strong></li>
                <li>El correo puede tardar hasta 10 minutos en llegar</li>
              </ul>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Entendido",
        });
      } else {
        Swal.fire(
          "Error",
          "No hay usuario autenticado. Inicia sesión nuevamente.",
          "error"
        );
        navigate("/login");
      }
    } catch (error) {
      console.error("Error al reenviar correo:", error);
      let mensaje = "No se pudo reenviar el correo. Intenta más tarde.";

      if (error.code === "auth/too-many-requests") {
        mensaje =
          "Demasiados intentos. Espera unos minutos antes de intentar nuevamente.";
      } else if (error.code === "auth/network-request-failed") {
        mensaje = "Error de conexión. Verifica tu internet.";
      }

      Swal.fire("Error", mensaje, "error");
    }
    setLoading(false);
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);

        if (auth.currentUser.emailVerified) {
          // Obtener datos del usuario para redirigir correctamente
          try {
            const ref = doc(db, "usuarios", auth.currentUser.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
              const userData = snap.data();

              // Redirigir directamente sin mostrar mensaje
              if (userData.tipo === "admin") {
                navigate("/admin/dashboard");
              } else if (userData.tipo === "cliente") {
                navigate("/cliente/dashboard");
              } else if (userData.tipo === "empresa") {
                navigate("/empresa/dashboard");
              } else {
                navigate("/login");
              }
            } else {
              navigate("/login");
            }
          } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            navigate("/login");
          }
        } else {
          Swal.fire({
            title: "Verificación pendiente",
            html: `
              <div class="text-start">
                <p><strong>Tu correo aún no ha sido verificado.</strong></p>
                <p>Por favor:</p>
                <ul class="text-start">
                  <li>Revisa tu <strong>bandeja de entrada</strong></li>
                  <li>Revisa tu <strong>carpeta de spam</strong></li>
                  <li>Haz clic en el enlace de verificación del correo</li>
                  <li>Espera unos minutos (puede tardar hasta 10 minutos)</li>
                </ul>
                <p>Una vez que hayas verificado, haz clic en "Verificar estado" nuevamente.</p>
              </div>
            `,
            icon: "warning",
            confirmButtonText: "Entendido",
          });
        }
      } else {
        Swal.fire(
          "Error",
          "No hay usuario autenticado. Inicia sesión nuevamente.",
          "error"
        );
        navigate("/login");
      }
    } catch (error) {
      console.error("Error al verificar:", error);
      Swal.fire(
        "Error",
        "Error al verificar el estado del correo. Intenta nuevamente.",
        "error"
      );
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark text-center">
              <h3 className="mb-0">
                <i className="fas fa-envelope me-2"></i>
                Verificación de Correo Electrónico
              </h3>
            </div>
            <div className="card-body text-center">
              <div className="mb-4">
                <i className="fas fa-envelope-open fa-4x text-warning mb-3"></i>
                <h4>Verifica tu correo electrónico</h4>
                <p className="text-muted">
                  Hemos enviado un correo de verificación a:
                </p>
                <p className="fw-bold text-primary fs-5">
                  {email || auth.currentUser?.email || "tu correo"}
                </p>
              </div>

              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="fas fa-info-circle me-2"></i>
                  Pasos para verificar tu cuenta:
                </h6>
                <ol className="text-start mb-0">
                  <li>
                    Revisa tu <strong>bandeja de entrada</strong>
                  </li>
                  <li>
                    Si no lo encuentras, revisa tu{" "}
                    <strong>carpeta de spam</strong>
                  </li>
                  <li>Haz clic en el enlace de verificación del correo</li>
                  <li>Vuelve aquí y haz clic en "Verificar estado"</li>
                </ol>
              </div>

              <div className="alert alert-warning">
                <i className="fas fa-clock me-2"></i>
                <strong>Nota:</strong> El correo puede tardar hasta 10 minutos
                en llegar. Si no lo recibes, puedes reenviarlo.
              </div>

              <div className="d-grid gap-3">
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleCheckVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Verificar estado
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-primary"
                  onClick={handleResendEmail}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? (
                    <>
                      <i className="fas fa-clock me-2"></i>
                      Reenviar en {countdown}s
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Reenviar correo
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/login")}
                  disabled={loading}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Volver al login
                </button>
              </div>

              <div className="mt-4">
                <div className="alert alert-light">
                  <h6 className="alert-heading">
                    <i className="fas fa-question-circle me-2"></i>
                    ¿Necesitas ayuda?
                  </h6>
                  <ul className="text-start mb-0 small">
                    <li>Verifica que la dirección de correo sea correcta</li>
                    <li>
                      Revisa también tu carpeta de spam o correo no deseado
                    </li>
                    <li>Si el problema persiste, contacta al administrador</li>
                    <li>Puedes reenviar el correo cada 60 segundos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
