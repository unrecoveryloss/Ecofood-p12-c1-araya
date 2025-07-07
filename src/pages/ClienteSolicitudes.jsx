import { useState, useEffect } from "react";
import { getSolicitudesCliente } from "../services/solicitudService";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function ClienteSolicitudes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargarSolicitudes = async () => {
    if (!user) {
      console.log("No hay usuario autenticado");
      return;
    }

    console.log("Cargando solicitudes para cliente:", user.uid);
    setLoading(true);
    try {
      const lista = await getSolicitudesCliente(user.uid);
      console.log("Solicitudes cargadas:", lista.length);
      setSolicitudes(lista);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
      Swal.fire("Error", "No se pudieron cargar las solicitudes", "error");
      setSolicitudes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      cargarSolicitudes();
    }
  }, [user]);

  // Filtrar solicitudes
  useEffect(() => {
    let filtradas = solicitudes;

    if (filtroEstado !== "todos") {
      filtradas = filtradas.filter(
        (solicitud) => solicitud.estado === filtroEstado
      );
    }

    setSolicitudesFiltradas(filtradas);
  }, [solicitudes, filtroEstado]);

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: "bg-warning text-dark",
      aprobada: "bg-success",
      rechazada: "bg-danger",
    };
    return (
      <span className={`badge ${badges[estado] || "bg-secondary"}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const getPrecioDisplay = (precio) => {
    return precio === 0 ? (
      <span className="text-success fw-bold">Gratis</span>
    ) : (
      <span className="fw-bold">${precio.toFixed(2)}</span>
    );
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      pendiente: "fas fa-clock text-warning",
      aprobada: "fas fa-check-circle text-success",
      rechazada: "fas fa-times-circle text-danger",
    };
    return icons[estado] || "fas fa-question-circle text-secondary";
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-success text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-shopping-cart me-2"></i>
              Mis Solicitudes
            </h3>
            <button
              className="btn btn-light btn-sm"
              onClick={() => navigate("/cliente/dashboard")}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver al Panel
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Filtros */}
          <div className="row mb-4">
            <div className="col-md-4 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-filter me-1"></i>
                Filtrar por Estado
              </label>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todas las solicitudes</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <button
                className="btn btn-success w-100"
                onClick={() => navigate("/cliente/productos")}
              >
                <i className="fas fa-plus me-1"></i>
                Nueva Solicitud
              </button>
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <div className="text-muted small">
                <i className="fas fa-info-circle me-1"></i>
                {solicitudesFiltradas.length} solicitudes encontradas
              </div>
            </div>
          </div>

          {/* Lista de solicitudes */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando solicitudes...</p>
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {solicitudes.length === 0
                  ? "No tienes solicitudes realizadas"
                  : "No se encontraron solicitudes con el filtro aplicado"}
              </h5>
              {solicitudes.length === 0 && (
                <button
                  className="btn btn-success"
                  onClick={() => navigate("/cliente/productos")}
                >
                  <i className="fas fa-plus me-1"></i>
                  Realizar tu primera solicitud
                </button>
              )}
            </div>
          ) : (
            <div className="row">
              {solicitudesFiltradas.map((solicitud) => (
                <div key={solicitud.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">
                          {solicitud.nombreProducto}
                        </h6>
                        {getEstadoBadge(solicitud.estado)}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <i
                          className={`${getEstadoIcon(
                            solicitud.estado
                          )} fa-2x mb-2`}
                        ></i>
                        <h6 className="text-muted">
                          Estado:{" "}
                          {solicitud.estado.charAt(0).toUpperCase() +
                            solicitud.estado.slice(1)}
                        </h6>
                      </div>

                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Cantidad:</small>
                          <div className="fw-bold">
                            {solicitud.cantidad} unidades
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Precio unitario:</small>
                          <div className="fw-bold">
                            {getPrecioDisplay(solicitud.precioUnitario)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Total:</small>
                        <div className="fw-bold text-primary fs-5">
                          {getPrecioDisplay(solicitud.precioTotal)}
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Empresa:</small>
                        <div className="fw-bold text-info">
                          {solicitud.nombreEmpresa}
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">
                          Fecha de solicitud:
                        </small>
                        <div className="fw-bold">
                          {formatearFecha(solicitud.fechaSolicitud)}
                        </div>
                      </div>

                      {solicitud.estado === "pendiente" && (
                        <div className="alert alert-warning small">
                          <i className="fas fa-info-circle me-1"></i>
                          Tu solicitud está siendo revisada por la empresa
                        </div>
                      )}

                      {solicitud.estado === "aprobada" && (
                        <div className="alert alert-success small">
                          <i className="fas fa-check-circle me-1"></i>
                          ¡Tu solicitud fue aprobada! Contacta a la empresa para
                          coordinar la entrega
                        </div>
                      )}

                      {solicitud.estado === "rechazada" && (
                        <div className="alert alert-danger small">
                          <i className="fas fa-times-circle me-1"></i>
                          Tu solicitud fue rechazada. Puedes intentar con otro
                          producto
                        </div>
                      )}
                    </div>
                    <div className="card-footer bg-white">
                      <div className="d-grid gap-2">
                        {solicitud.estado === "aprobada" && (
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => {
                              Swal.fire({
                                title: "Información de contacto",
                                html: `
                                  <div class="text-start">
                                    <p><strong>Empresa:</strong> ${
                                      solicitud.nombreEmpresa
                                    }</p>
                                    <p><strong>Producto:</strong> ${
                                      solicitud.nombreProducto
                                    }</p>
                                    <p><strong>Cantidad:</strong> ${
                                      solicitud.cantidad
                                    } unidades</p>
                                    <p><strong>Total:</strong> ${getPrecioDisplay(
                                      solicitud.precioTotal
                                    )}</p>
                                    <p class="mt-3">Contacta directamente a la empresa para coordinar la entrega de tu producto.</p>
                                  </div>
                                `,
                                icon: "info",
                                confirmButtonText: "Entendido",
                              });
                            }}
                          >
                            <i className="fas fa-phone me-1"></i>
                            Ver detalles de entrega
                          </button>
                        )}

                        {solicitud.estado === "rechazada" && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => navigate("/cliente/productos")}
                          >
                            <i className="fas fa-search me-1"></i>
                            Buscar otros productos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estadísticas */}
          {solicitudesFiltradas.length > 0 && (
            <div className="mt-4 p-3 bg-light rounded">
              <div className="row text-center">
                <div className="col-md-3">
                  <h6 className="text-muted">Total solicitudes</h6>
                  <h4 className="text-success">
                    {solicitudesFiltradas.length}
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Pendientes</h6>
                  <h4 className="text-warning">
                    {
                      solicitudesFiltradas.filter(
                        (s) => s.estado === "pendiente"
                      ).length
                    }
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Aprobadas</h6>
                  <h4 className="text-success">
                    {
                      solicitudesFiltradas.filter(
                        (s) => s.estado === "aprobada"
                      ).length
                    }
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Rechazadas</h6>
                  <h4 className="text-danger">
                    {
                      solicitudesFiltradas.filter(
                        (s) => s.estado === "rechazada"
                      ).length
                    }
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
