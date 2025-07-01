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

  if (checking) return <p className="text-center mt-5">Cargando...</p>;

  if (!user) return <Navigate to="/login" />;

  if (!verified) {
    return (
      <div className="container mt-5 text-center">
        <h4>Debes verificar tu correo electrónico para acceder.</h4>
        <p>Revisa tu bandeja de entrada o carpeta de spam.</p>
      </div>
    );
  }

  return children;
}
