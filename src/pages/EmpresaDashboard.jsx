import { useNavigate } from "react-router-dom";

export default function EmpresaDashboard() {
  const navigate = useNavigate();
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
        className="btn btn-secondary"
        onClick={() => navigate("/empresa/productos")}
      >
        Gestionar Productos
      </button>
    </div>
  );
}
