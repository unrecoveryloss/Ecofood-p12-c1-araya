import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification,
  reload,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Recargar el usuario para obtener el estado más reciente de verificación
      await reload(cred.user);

      if (!cred.user.emailVerified) {
        const result = await Swal.fire({
          title: "Verificación pendiente",
          html: `
            <div class="text-start">
              <p><strong>Tu correo electrónico aún no ha sido verificado.</strong></p>
              <p>Para continuar, necesitas verificar tu cuenta:</p>
              <ul class="text-start">
                <li>Revisa tu <strong>bandeja de entrada</strong></li>
                <li>Revisa tu <strong>carpeta de spam</strong></li>
                <li>Espera unos minutos (puede tardar hasta 10 minutos)</li>
              </ul>
              <p>¿Qué deseas hacer?</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Ir a verificación",
          denyButtonText: "Reenviar correo",
          cancelButtonText: "Intentar de nuevo",
          confirmButtonColor: "#28a745",
          denyButtonColor: "#17a2b8",
        });

        if (result.isConfirmed) {
          // Ir a la página de verificación
          navigate(
            `/email-verification?email=${encodeURIComponent(cred.user.email)}`
          );
        } else if (result.isDenied) {
          // Reenviar correo
          try {
            await sendEmailVerification(cred.user);
            Swal.fire({
              title: "Correo enviado",
              html: `
                <div class="text-start">
                  <p><strong>Se ha reenviado el correo de verificación a:</strong></p>
                  <p class="fw-bold text-primary">${cred.user.email}</p>
                  <p>Por favor:</p>
                  <ul class="text-start">
                    <li>Revisa tu <strong>bandeja de entrada</strong></li>
                    <li>Si no lo encuentras, revisa tu <strong>carpeta de spam</strong></li>
                    <li>El correo puede tardar hasta 10 minutos en llegar</li>
                  </ul>
                </div>
              `,
              icon: "success",
              confirmButtonText: "Ir a verificación",
              showCancelButton: true,
              cancelButtonText: "Entendido",
            }).then((result) => {
              if (result.isConfirmed) {
                navigate(
                  `/email-verification?email=${encodeURIComponent(
                    cred.user.email
                  )}`
                );
              }
            });
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
        }

        setLoading(false);
        return;
      }

      await proceedWithLogin(cred.user);
    } catch (error) {
      console.error("Error en login:", error);
      let mensaje = "Credenciales incorrectas o fallo de red";

      if (error.code === "auth/user-not-found") {
        mensaje = "No existe una cuenta con este correo electrónico";
      } else if (error.code === "auth/wrong-password") {
        mensaje = "Contraseña incorrecta";
      } else if (error.code === "auth/too-many-requests") {
        mensaje = "Demasiados intentos fallidos. Intenta más tarde";
      } else if (error.code === "auth/network-request-failed") {
        mensaje = "Error de conexión. Verifica tu internet";
      } else if (error.code === "auth/user-disabled") {
        mensaje = "Tu cuenta ha sido deshabilitada. Contacta al administrador";
      }

      Swal.fire("Error", mensaje, "error");
    }
    setLoading(false);
  };

  const proceedWithLogin = async (user) => {
    try {
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        Swal.fire("Error", "No se encontraron los datos del usuario", "error");
        return;
      }

      const userData = snap.data();

      if (userData.tipo === "admin") {
        navigate("/admin/dashboard");
      } else if (userData.tipo === "cliente") {
        navigate("/cliente/dashboard");
      } else if (userData.tipo === "empresa") {
        navigate("/empresa/dashboard");
      } else {
        Swal.fire("Error", "Rol de usuario desconocido", "error");
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      Swal.fire("Error", "Error al cargar datos del usuario", "error");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white text-center">
              <h3 className="mb-0">
                <i className="fas fa-sign-in-alt me-2"></i>
                Iniciar Sesión
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-envelope me-1"></i>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={50}
                    disabled={loading}
                  />
                  <small className="text-muted">Máximo 50 caracteres</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-lock me-1"></i>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={50}
                    disabled={loading}
                  />
                  <small className="text-muted">Máximo 50 caracteres</small>
                </div>

                <div className="d-grid gap-2 mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Iniciar Sesión
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="mb-2">
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => navigate("/registro")}
                      disabled={loading}
                    >
                      Regístrate aquí
                    </button>
                  </p>

                  <p className="mb-0">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => navigate("/reset-password")}
                      disabled={loading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </p>
                </div>
              </form>

              {/* Información adicional */}
              <div className="mt-4">
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Información Importante
                  </h6>
                  <ul className="mb-0 small">
                    <li>
                      La verificación de correo es obligatoria para acceder al
                      sistema
                    </li>
                    <li>Si no recibes el correo, revisa tu carpeta de spam</li>
                    <li>
                      El correo de verificación puede tardar hasta 10 minutos en
                      llegar
                    </li>
                    <li>
                      Puedes reenviar el correo desde la página de verificación
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
