import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function AdminRoute({ children }) {
  const { user, userData, loading } = useAuth();

  if (loading) return <p className="text-center mt-5">Cargando...</p>;

  if (!user) return <Navigate to="/login" />;

  if (userData?.tipo !== "admin") {
    return (
      <div className="container mt-5 text-center">
        <h4>No tienes permisos para acceder a esta sección.</h4>
        <button
          className="btn btn-danger mt-3"
          onClick={() => {
            signOut(auth);
            window.location.href = "/login";
          }}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return children;
}
