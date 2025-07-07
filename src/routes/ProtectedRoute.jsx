import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (user) {
      setVerified(user.emailVerified);
    }
    setChecking(false);
  }, [user]);

  if (checking) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!verified) {
    // Redirigir a la página de verificación con una interfaz consistente
    return (
      <Navigate
        to={`/email-verification?email=${encodeURIComponent(user.email)}`}
      />
    );
  }

  return children;
}
