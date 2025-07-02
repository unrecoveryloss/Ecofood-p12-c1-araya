import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        const result = await Swal.fire({
          title: "Verificación pendiente",
          text: "Tu correo aún no ha sido verificado. ¿Deseas reenviar el correo de verificación?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Reenviar",
          cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
          await sendEmailVerification(cred.user);
          Swal.fire(
            "Correo enviado",
            "Revisa tu bandeja de entrada o carpeta de spam.",
            "success"
          );
        }

        return;
      }

      const ref = doc(db, "usuarios", cred.user.uid);
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
      Swal.fire("Error", "Credenciales incorrectas o fallo de red", "error");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label">Correo Electrónico</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={40} 
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={40} 
          />
        </div>
        <button type="submit" className="btn btn-primary me-2">
          Iniciar Sesión
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/registro")}
        >
          Registrarse
        </button>

        <p className="mt-3">
          ¿Olvidaste tu contraseña?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => navigate("/reset-password")}
          >
            Recupérala aquí
          </span>
        </p>
      </form>
    </div>
  );
}
