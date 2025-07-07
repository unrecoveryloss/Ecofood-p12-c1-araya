import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { getEstadisticasSolicitudes } from "../services/solicitudService";
import Swal from "sweetalert2";

export default function ClienteDashboard() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    totalSolicitudes: 0,
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      cargarEstadisticas();
    }
  }, [user]);

  const cargarEstadisticas = async () => {
    if (!user) {
      console.log("No hay usuario autenticado");
      setLoading(false);
      return;
    }

    console.log("Cargando estadísticas para cliente:", user.uid);
    setLoading(true);
    try {
      const estadisticas = await getEstadisticasSolicitudes(
        user.uid,
        "cliente"
      );

      console.log("Estadísticas recibidas:", estadisticas);
      setStats({
        totalSolicitudes: estadisticas.total || 0,
        solicitudesPendientes: estadisticas.pendientes || 0,
        solicitudesAprobadas: estadisticas.aprobadas || 0,
        solicitudesRechazadas: estadisticas.rechazadas || 0,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // Mantener estadísticas por defecto en caso de error
      setStats({
        totalSolicitudes: 0,
        solicitudesPendientes: 0,
        solicitudesAprobadas: 0,
        solicitudesRechazadas: 0,
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      Swal.fire("Error", "No se pudo cerrar la sesión", "error");
    }
  };

  if (!userData) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">
                    <i className="fas fa-user-friends me-2"></i>
                    Bienvenido, {userData.nombre}
                  </h2>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-envelope me-1"></i>
                    {userData.email}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-light btn-sm"
                    onClick={cargarEstadisticas}
                    disabled={loading}
                    title="Refrescar estadísticas"
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                  </button>
                  <button className="btn btn-light" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-1"></i>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-success h-100">
            <div className="card-body text-center">
              <div className="text-success mb-2">
                <i className="fas fa-shopping-cart fa-2x"></i>
              </div>
              <h4 className="card-title text-success">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.totalSolicitudes
                )}
              </h4>
              <p className="card-text">Total Solicitudes</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-warning h-100">
            <div className="card-body text-center">
              <div className="text-warning mb-2">
                <i className="fas fa-clock fa-2x"></i>
              </div>
              <h4 className="card-title text-warning">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.solicitudesPendientes
                )}
              </h4>
              <p className="card-text">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-primary h-100">
            <div className="card-body text-center">
              <div className="text-primary mb-2">
                <i className="fas fa-check-circle fa-2x"></i>
              </div>
              <h4 className="card-title text-primary">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.solicitudesAprobadas
                )}
              </h4>
              <p className="card-text">Aprobadas</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-danger h-100">
            <div className="card-body text-center">
              <div className="text-danger mb-2">
                <i className="fas fa-times-circle fa-2x"></i>
              </div>
              <h4 className="card-title text-danger">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.solicitudesRechazadas
                )}
              </h4>
              <p className="card-text">Rechazadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Gestión de Cliente
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-primary mb-3">
                        <i className="fas fa-boxes fa-3x"></i>
                      </div>
                      <h5 className="card-title">Ver Productos</h5>
                      <p className="card-text">
                        Explora todos los productos disponibles de las empresas,
                        incluyendo productos gratuitos y con precio simbólico.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate("/cliente/productos")}
                      >
                        <i className="fas fa-search me-1"></i>
                        Explorar Productos
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-success mb-3">
                        <i className="fas fa-shopping-cart fa-3x"></i>
                      </div>
                      <h5 className="card-title">Mis Solicitudes</h5>
                      <p className="card-text">
                        Revisa el estado de tus solicitudes, ve las aprobadas,
                        pendientes y rechazadas por las empresas.
                      </p>
                      <button
                        className="btn btn-success"
                        onClick={() => navigate("/cliente/solicitudes")}
                      >
                        <i className="fas fa-list me-1"></i>
                        Ver Solicitudes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-info mb-3">
                        <i className="fas fa-user-edit fa-3x"></i>
                      </div>
                      <h5 className="card-title">Mi Perfil</h5>
                      <p className="card-text">
                        Actualiza tu información personal, dirección de contacto
                        y datos de ubicación para recibir tus productos.
                      </p>
                      <button
                        className="btn btn-info text-white"
                        onClick={() => navigate("/cliente/perfil")}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Editar Perfil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Información de Contacto
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 mb-2">
                  <strong>
                    <i className="fas fa-phone me-2 text-primary"></i>Teléfono:
                  </strong>
                  <p className="ms-4 mb-1">
                    {userData.telefono || "No especificado"}
                  </p>
                </div>
                <div className="col-12 mb-2">
                  <strong>
                    <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                    Dirección:
                  </strong>
                  <p className="ms-4 mb-1">
                    {userData.direccion || "No especificada"}
                  </p>
                </div>
                <div className="col-12">
                  <strong>
                    <i className="fas fa-map me-2 text-primary"></i>Comuna:
                  </strong>
                  <p className="ms-4 mb-0">
                    {userData.comuna || "No especificada"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Consejos Rápidos
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Revisa regularmente los productos disponibles
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Solicita solo la cantidad que realmente necesitas
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Mantén actualizada tu información de contacto
                </li>
                <li className="mb-0">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Revisa el estado de tus solicitudes frecuentemente
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
