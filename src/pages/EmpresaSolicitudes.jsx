import { useState, useEffect } from "react";
import {
  getSolicitudesEmpresa,
  aprobarSolicitud,
  rechazarSolicitud,
} from "../services/solicitudService";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function EmpresaSolicitudes() {
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

    console.log("Cargando solicitudes para empresa:", user.uid);
    setLoading(true);
    try {
      const lista = await getSolicitudesEmpresa(user.uid);
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
    console.log("Precio recibido:", precio, typeof precio);
    if (precio === undefined || precio === null) {
      return <span className="text-warning fw-bold">Precio no definido</span>;
    }
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

  const handleAprobarSolicitud = async (solicitud) => {
    const confirm = await Swal.fire({
      title: "¿Aprobar solicitud?",
      html: `
        <div class="text-start">
          <p><strong>Producto:</strong> ${solicitud.nombreProducto}</p>
          <p><strong>Cliente:</strong> ${solicitud.nombreCliente}</p>
          <p><strong>Cantidad:</strong> ${solicitud.cantidad} unidades</p>
          <p><strong>Total:</strong> ${getPrecioDisplay(
            solicitud.precioTotal
          )}</p>
          <p class="mt-2">Al aprobar, se descontará el stock del producto.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#28a745",
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      try {
        console.log("Aprobando solicitud:", solicitud.id);

        // Aprobar la solicitud
        await aprobarSolicitud(solicitud.id, new Date().toISOString());

        // Descontar stock del producto
        const productoRef = doc(db, "productos", solicitud.productoId);
        const nuevaCantidad = solicitud.cantidadDisponible - solicitud.cantidad;
        await updateDoc(productoRef, {
          cantidad: nuevaCantidad,
        });

        console.log("Solicitud aprobada y stock actualizado");
        Swal.fire(
          "Aprobada",
          "La solicitud ha sido aprobada exitosamente",
          "success"
        );
        cargarSolicitudes();
      } catch (error) {
        console.error("Error al aprobar solicitud:", error);
        Swal.fire("Error", "No se pudo aprobar la solicitud", "error");
      }
      setLoading(false);
    }
  };

  const handleRechazarSolicitud = async (solicitud) => {
    const confirm = await Swal.fire({
      title: "¿Rechazar solicitud?",
      html: `
        <div class="text-start">
          <p><strong>Producto:</strong> ${solicitud.nombreProducto}</p>
          <p><strong>Cliente:</strong> ${solicitud.nombreCliente}</p>
          <p><strong>Cantidad:</strong> ${solicitud.cantidad} unidades</p>
          <p class="mt-2">Al rechazar, el stock permanecerá sin cambios.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      try {
        console.log("Rechazando solicitud:", solicitud.id);

        await rechazarSolicitud(solicitud.id, new Date().toISOString());

        console.log("Solicitud rechazada exitosamente");
        Swal.fire("Rechazada", "La solicitud ha sido rechazada", "success");
        cargarSolicitudes();
      } catch (error) {
        console.error("Error al rechazar solicitud:", error);
        Swal.fire("Error", "No se pudo rechazar la solicitud", "error");
      }
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-clipboard-list me-2"></i>
              Gestión de Solicitudes
            </h3>
            <button
              className="btn btn-light btn-sm"
              onClick={() => navigate("/empresa/dashboard")}
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
                className="btn btn-primary w-100"
                onClick={cargarSolicitudes}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Actualizar
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
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando solicitudes...</p>
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {solicitudes.length === 0
                  ? "No hay solicitudes pendientes"
                  : "No se encontraron solicitudes con el filtro aplicado"}
              </h5>
              {solicitudes.length === 0 && (
                <p className="text-muted">
                  Los clientes podrán solicitar tus productos desde el catálogo.
                </p>
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
                        <small className="text-muted">Cliente:</small>
                        <div className="fw-bold text-primary">
                          {solicitud.nombreCliente}
                        </div>
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
                        <div className="fw-bold text-success fs-5">
                          {getPrecioDisplay(solicitud.precioTotal)}
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
                          <i className="fas fa-clock me-1"></i>
                          Solicitud pendiente de revisión
                        </div>
                      )}

                      {solicitud.estado === "aprobada" && (
                        <div className="alert alert-success small">
                          <i className="fas fa-check-circle me-1"></i>
                          Solicitud aprobada el{" "}
                          {solicitud.fechaRespuesta
                            ? formatearFecha(solicitud.fechaRespuesta)
                            : "recientemente"}
                        </div>
                      )}

                      {solicitud.estado === "rechazada" && (
                        <div className="alert alert-danger small">
                          <i className="fas fa-times-circle me-1"></i>
                          Solicitud rechazada el{" "}
                          {solicitud.fechaRespuesta
                            ? formatearFecha(solicitud.fechaRespuesta)
                            : "recientemente"}
                        </div>
                      )}
                    </div>
                    <div className="card-footer bg-white">
                      {solicitud.estado === "pendiente" && (
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAprobarSolicitud(solicitud)}
                            disabled={loading}
                          >
                            <i className="fas fa-check me-1"></i>
                            Aprobar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRechazarSolicitud(solicitud)}
                            disabled={loading}
                          >
                            <i className="fas fa-times me-1"></i>
                            Rechazar
                          </button>
                        </div>
                      )}
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
                  <h4 className="text-primary">
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
