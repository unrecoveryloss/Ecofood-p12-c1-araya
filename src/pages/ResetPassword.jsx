import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim()) {
      Swal.fire("Error", "Por favor ingresa tu correo electrónico", "warning");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire({
        title: "Correo enviado",
        html: `
          <div class="text-start">
            <p><strong>Se ha enviado un correo de recuperación a:</strong></p>
            <p class="fw-bold text-primary">${email}</p>
            <p>Por favor:</p>
            <ul class="text-start">
              <li>Revisa tu <strong>bandeja de entrada</strong></li>
              <li>Si no lo encuentras, revisa tu <strong>carpeta de spam</strong></li>
              <li>Haz clic en el enlace del correo para restablecer tu contraseña</li>
            </ul>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
      });
      setEmail("");
    } catch (error) {
      console.error("Error al enviar correo:", error);
      let mensaje = "No se pudo enviar el correo. Verifica el email.";

      if (error.code === "auth/user-not-found") {
        mensaje = "No existe una cuenta con este correo electrónico.";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "El correo electrónico no es válido.";
      } else if (error.code === "auth/too-many-requests") {
        mensaje = "Demasiados intentos. Intenta más tarde.";
      } else if (error.code === "auth/network-request-failed") {
        mensaje = "Error de conexión. Verifica tu internet.";
      }

      Swal.fire("Error", mensaje, "error");
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark text-center">
              <h3 className="mb-0">
                <i className="fas fa-key me-2"></i>
                Recuperar Contraseña
              </h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <i className="fas fa-lock-open fa-3x text-warning mb-3"></i>
                <h5>¿Olvidaste tu contraseña?</h5>
                <p className="text-muted">
                  No te preocupes, te ayudaremos a recuperarla. Ingresa tu
                  correo electrónico y te enviaremos las instrucciones.
                </p>
              </div>

              <form onSubmit={handleReset}>
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="fas fa-envelope me-1"></i>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    maxLength={50}
                    disabled={loading}
                  />
                  <small className="text-muted">Máximo 50 caracteres</small>
                </div>

                <div className="d-grid gap-2 mb-3">
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Enviando correo...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Enviar Correo de Recuperación
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/login")}
                    disabled={loading}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Volver al Login
                  </button>
                </div>
              </form>

              <div className="mt-4">
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Información Importante
                  </h6>
                  <ul className="mb-0 small">
                    <li>El correo puede tardar hasta 10 minutos en llegar</li>
                    <li>Revisa también tu carpeta de spam</li>
                    <li>El enlace de recuperación expira en 1 hora</li>
                    <li>
                      Si no recibes el correo, verifica que el email sea
                      correcto
                    </li>
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
