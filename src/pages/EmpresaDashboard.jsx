import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function EmpresaDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); 
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      alert("Error al cerrar sesión");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Bienvenido al Panel de la Empresa</h2>
      <button
        className="btn btn-primary me-2"
        onClick={() => navigate("/empresa/perfil")}
      >
        Editar Perfil
      </button>
      <button
        className="btn btn-secondary me-2"
        onClick={() => navigate("/empresa/productos")}
      >
        Gestionar Productos
      </button>
      <button className="btn btn-danger" onClick={handleLogout}>
        Cerrar Sesión
      </button>
    </div>
  );
}
