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

    if (!validarPassword(password)) return;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await saveUserData(cred.user.uid, {
        nombre,
        tipo,
        email,
        direccion,
        comuna,
        telefono,
      });

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Swal.fire(
          "Verifica tu correo",
          "Se ha enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.",
          "info"
        );
      } else {
        Swal.fire(
          "Error",
          "No se pudo enviar el correo de verificación. Intenta iniciar sesión manualmente.",
          "error"
        );
      }

      navigate("/login");
    } catch (error) {
      console.error("Error al registrar:", error);
      Swal.fire("Error", error.message || "No se pudo registrar", "error");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label className="form-label">Nombre completo</label>
          <input
            type="text"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={40}  
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Correo</label>
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
        <div className="mb-3">
          <label className="form-label">Dirección</label>
          <input
            type="text"
            className="form-control"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
            maxLength={40} 
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Comuna</label>
          <select
            className="form-select"
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            required
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
          <label className="form-label">Teléfono (opcional)</label>
          <input
            type="text"
            className="form-control"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            maxLength={40} 
          />
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-success">
            Registrar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/login")}
          >
            Volver al Login
          </button>
        </div>
      </form>
    </div>
  );
}
