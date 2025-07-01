import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      Swal.fire("Error", "No se pudo cerrar sesión", "error");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Panel del Administrador</h2>

      <div className="d-grid gap-3 mb-4">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/admin/clientes")}
        >
          Gestión de Clientes
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/admin/empresas")}
        >
          Gestión de Empresas
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/admin/productos")}
        >
          Gestión de Productos
        </button>

        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/admin/administradores")}
        >
          Gestión de Administradores
        </button>
      </div>

      <button className="btn btn-danger" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
