import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function AdminRoute({ children }) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Verificar si el email está verificado
  if (!user.emailVerified) {
    return (
      <Navigate
        to={`/email-verification?email=${encodeURIComponent(user.email)}`}
      />
    );
  }

  if (userData?.tipo !== "admin") {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-header bg-danger text-white text-center">
                <h4 className="mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Acceso Denegado
                </h4>
              </div>
              <div className="card-body text-center">
                <i className="fas fa-user-shield fa-3x text-danger mb-3"></i>
                <h5>No tienes permisos de administrador</h5>
                <p className="text-muted">
                  Solo los administradores pueden acceder a esta sección.
                </p>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    signOut(auth);
                    window.location.href = "/login";
                  }}
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
