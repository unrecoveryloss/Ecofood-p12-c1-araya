import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../services/firebase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { saveUserData } from "../services/userService";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo] = useState("cliente");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function validarPassword(contraseña) {
    const minLength = 8;
    const tieneMayuscula = /[A-Z]/.test(contraseña);
    const tieneMinuscula = /[a-z]/.test(contraseña);
    const tieneNumero = /\d/.test(contraseña);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(contraseña);

    if (
      contraseña.length < minLength ||
      !tieneMayuscula ||
      !tieneMinuscula ||
      !tieneNumero ||
      !tieneEspecial
    ) {
      Swal.fire(
        "Contraseña débil",
        "Tu contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial.",
        "warning"
      );
      return false;
    }
    return true;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validarPassword(password)) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await saveUserData(cred.user.uid, {
        nombre,
        tipo,
        email,
        direccion,
        comuna,
        telefono,
        estado: "activo",
      });

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);

        Swal.fire({
          title: "¡Registro exitoso!",
          html: `
            <div class="text-start">
              <p><strong>Tu cuenta ha sido creada correctamente.</strong></p>
              <p>Se ha enviado un correo de verificación a:</p>
              <p class="fw-bold text-primary">${email}</p>
              <p>Por favor:</p>
              <ul class="text-start">
                <li>Revisa tu <strong>bandeja de entrada</strong></li>
                <li>Si no lo encuentras, revisa tu <strong>carpeta de spam</strong></li>
                <li>Haz clic en el enlace de verificación</li>
              </ul>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Ir a verificación",
          showCancelButton: true,
          cancelButtonText: "Ir al login",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(`/email-verification?email=${encodeURIComponent(email)}`);
          } else {
            navigate("/login");
          }
        });
      } else {
        Swal.fire(
          "Error",
          "No se pudo enviar el correo de verificación. Intenta iniciar sesión manualmente.",
          "error"
        );
        navigate("/login");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      let mensaje = "No se pudo registrar";

      if (error.code === "auth/email-already-in-use") {
        mensaje = "El correo ya está registrado. Intenta iniciar sesión.";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "El correo electrónico no es válido.";
      } else if (error.code === "auth/weak-password") {
        mensaje = "La contraseña es muy débil.";
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
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-success text-white text-center">
              <h3 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Registro de Usuario
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-user me-1"></i>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    maxLength={50}
                    disabled={loading}
                  />
                  <small className="text-muted">Máximo 50 caracteres</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-envelope me-1"></i>
                    Correo electrónico
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
                    maxLength={40}
                    disabled={loading}
                  />
                  <small className="text-muted">
                    Mínimo 8 caracteres con mayúscula, minúscula, número y
                    símbolo especial
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                    maxLength={100}
                    disabled={loading}
                  />
                  <small className="text-muted">Máximo 100 caracteres</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-map me-1"></i>
                    Comuna
                  </label>
                  <select
                    className="form-select"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Selecciona una comuna...</option>
                    <option value="Andacollo">Andacollo</option>
                    <option value="Coquimbo">Coquimbo</option>
                    <option value="La Higuera">La Higuera</option>
                    <option value="La Serena">La Serena</option>
                    <option value="Paihuano">Paihuano</option>
                    <option value="Vicuña">Vicuña</option>
                    <option value="Combarbalá">Combarbalá</option>
                    <option value="Monte Patria">Monte Patria</option>
                    <option value="Ovalle">Ovalle</option>
                    <option value="Punitaqui">Punitaqui</option>
                    <option value="Río Hurtado">Río Hurtado</option>
                    <option value="Canela">Canela</option>
                    <option value="Illapel">Illapel</option>
                    <option value="Los Vilos">Los Vilos</option>
                    <option value="Salamanca">Salamanca</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-phone me-1"></i>
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    maxLength={15}
                    disabled={loading}
                  />
                  <small className="text-muted">Máximo 15 caracteres</small>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Registrar
                      </>
                    )}
                  </button>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
