import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import Swal from "sweetalert2";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroNombre, setFiltroNombre] = useState("");
  const navigate = useNavigate();

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "usuarios"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      Swal.fire("Error", "No se pudieron cargar los usuarios", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    // Filtro por tipo
    if (filtroTipo !== "todos" && usuario.tipo !== filtroTipo) {
      return false;
    }
    // Filtro por nombre
    if (
      filtroNombre.trim() &&
      !usuario.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const cambiarEstado = async (usuario, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "usuarios", usuario.id), {
        estado: nuevoEstado,
      });
      Swal.fire(
        "Éxito",
        `Usuario ${
          nuevoEstado === "activo" ? "activado" : "desactivado"
        } correctamente`,
        "success"
      );
      cargarUsuarios();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      Swal.fire("Error", "No se pudo cambiar el estado del usuario", "error");
    }
  };

  const eliminarUsuario = async (usuario) => {
    if (usuario.tipo === "admin" && usuario.principal) {
      Swal.fire(
        "Error",
        "No se puede eliminar el administrador principal",
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: `¿Estás seguro de eliminar a "${usuario.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", usuario.id));
        Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
        cargarUsuarios();
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        Swal.fire("Error", "No se pudo eliminar el usuario", "error");
      }
    }
  };

  const getTipoBadge = (tipo) => {
    const badges = {
      admin: "bg-danger",
      empresa: "bg-primary",
      cliente: "bg-success",
    };
    return (
      <span className={`badge ${badges[tipo] || "bg-secondary"}`}>{tipo}</span>
    );
  };

  const getEstadoBadge = (estado) => {
    return estado === "activo" ? (
      <span className="badge bg-success">Activo</span>
    ) : (
      <span className="badge bg-warning text-dark">Inactivo</span>
    );
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-users me-2"></i>
              Gestión de Usuarios
            </h3>
            <button
              className="btn btn-light btn-sm"
              onClick={() => navigate("/admin/dashboard")}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver al Panel Principal
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Filtros */}
          <div className="row mb-4">
            <div className="col-md-4 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-filter me-1"></i>
                Filtrar por Tipo
              </label>
              <select
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos los usuarios</option>
                <option value="admin">Administradores</option>
                <option value="empresa">Empresas</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-search me-1"></i>
                Buscar por nombre
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre del usuario..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <div className="text-muted small">
                <i className="fas fa-info-circle me-1"></i>
                Total: {usuariosFiltrados.length} usuarios
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando usuarios...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {usuarios.length === 0
                  ? "No hay usuarios registrados"
                  : "No se encontraron usuarios con los filtros aplicados"}
              </h5>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Información</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="fw-bold">{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>{getTipoBadge(usuario.tipo)}</td>
                      <td>{getEstadoBadge(usuario.estado)}</td>
                      <td>
                        <div className="small">
                          {usuario.telefono && (
                            <div>
                              <i className="fas fa-phone me-1"></i>
                              {usuario.telefono}
                            </div>
                          )}
                          {usuario.direccion && (
                            <div>
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {usuario.direccion}
                            </div>
                          )}
                          {usuario.rut && (
                            <div>
                              <i className="fas fa-id-card me-1"></i>RUT:{" "}
                              {usuario.rut}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {usuario.estado === "activo" ? (
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => cambiarEstado(usuario, "inactivo")}
                              title="Desactivar usuario"
                              disabled={
                                usuario.tipo === "admin" && usuario.principal
                              }
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => cambiarEstado(usuario, "activo")}
                              title="Activar usuario"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => eliminarUsuario(usuario)}
                            title="Eliminar usuario"
                            disabled={
                              usuario.tipo === "admin" && usuario.principal
                            }
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Estadísticas */}
          {usuariosFiltrados.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="row text-center">
                <div className="col-md-3">
                  <h6 className="text-muted">Total usuarios</h6>
                  <h4 className="text-primary">{usuariosFiltrados.length}</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Administradores</h6>
                  <h4 className="text-danger">
                    {usuariosFiltrados.filter((u) => u.tipo === "admin").length}
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Empresas</h6>
                  <h4 className="text-primary">
                    {
                      usuariosFiltrados.filter((u) => u.tipo === "empresa")
                        .length
                    }
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Clientes</h6>
                  <h4 className="text-success">
                    {
                      usuariosFiltrados.filter((u) => u.tipo === "cliente")
                        .length
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
