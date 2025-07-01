import { useNavigate } from "react-router-dom";

export default function AdminProductos() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <button
        className="btn btn-secondary mb-3"
        onClick={() => navigate("/admin/dashboard")}
      >
        Volver al Panel Principal
      </button>

      <h2>Bienvenido al Panel de Gestión de Productos</h2>
    </div>
  );
}
