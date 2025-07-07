import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AdminAdministradores() {
  const [admins, setAdmins] = useState([]);
  const [adminsFiltrados, setAdminsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarAdmin, setEditarAdmin] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroPrincipal, setFiltroPrincipal] = useState("todos");

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    uid: "",
  });

  const navigate = useNavigate();

  const cargarAdmins = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "usuarios"), where("tipo", "==", "admin"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAdmins(data);
    } catch (error) {
      console.error("Error al cargar administradores:", error);
      Swal.fire("Error", "No se pudieron cargar los administradores", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarAdmins();
  }, []);

  // Filtrar administradores
  useEffect(() => {
    let filtrados = admins;

    // Filtro por nombre
    if (filtroNombre.trim()) {
      filtrados = filtrados.filter((admin) =>
        admin.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    // Filtro por tipo (principal/no principal)
    if (filtroPrincipal !== "todos") {
      filtrados = filtrados.filter((admin) => {
        if (filtroPrincipal === "principal") {
          return admin.principal === true;
        } else {
          return admin.principal !== true;
        }
      });
    }

    setAdminsFiltrados(filtrados);
  }, [admins, filtroNombre, filtroPrincipal]);

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      uid: "",
    });
    setEditarAdmin(null);
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalOpen(true);
  };

  const abrirModalEditar = (admin) => {
    setEditarAdmin(admin);
    setFormData({
      nombre: admin.nombre || "",
      email: admin.email || "",
      uid: admin.id || "",
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return false;
    }
    if (!formData.email.trim()) {
      Swal.fire("Error", "El email es obligatorio", "warning");
      return false;
    }
    return true;
  };

  const guardarAdmin = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      if (editarAdmin) {
        // Actualizar administrador existente
        const ref = doc(db, "usuarios", formData.uid);
        await updateDoc(ref, {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
        });
        Swal.fire(
          "Actualizado",
          "Administrador actualizado correctamente",
          "success"
        );
      } else {
        // Crear nuevo administrador
        await addDoc(collection(db, "usuarios"), {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          tipo: "admin",
          principal: false,
        });
        Swal.fire("Creado", "Administrador agregado correctamente", "success");
      }

      cerrarModal();
      cargarAdmins();
    } catch (error) {
      console.error("Error al guardar administrador:", error);
      Swal.fire("Error", "No se pudo guardar el administrador", "error");
    }
    setLoading(false);
  };

  const eliminarAdmin = async (admin) => {
    if (admin.principal) {
      Swal.fire(
        "Denegado",
        "No se puede eliminar el administrador principal",
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Eliminar administrador?",
      text: `¿Estás seguro de eliminar a "${admin.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", admin.id));
        Swal.fire(
          "Eliminado",
          "Administrador eliminado correctamente",
          "success"
        );
        cargarAdmins();
      } catch (error) {
        console.error("Error al eliminar administrador:", error);
        Swal.fire("Error", "No se pudo eliminar el administrador", "error");
      }
    }
  };

  const getPrincipalBadge = (principal) => {
    return principal ? (
      <span className="badge bg-danger">Principal</span>
    ) : (
      <span className="badge bg-secondary">Secundario</span>
    );
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-danger text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-user-shield me-2"></i>
              Gestión de Administradores
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
                <i className="fas fa-search me-1"></i>
                Buscar por nombre
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre del administrador..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-filter me-1"></i>
                Filtrar por Tipo
              </label>
              <select
                className="form-select"
                value={filtroPrincipal}
                onChange={(e) => setFiltroPrincipal(e.target.value)}
              >
                <option value="todos">Todos los administradores</option>
                <option value="principal">Solo principales</option>
                <option value="secundario">Solo secundarios</option>
              </select>
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <button
                className="btn btn-danger w-100"
                onClick={abrirModalCrear}
                disabled={loading}
              >
                <i className="fas fa-user-plus me-1"></i>
                Crear Administrador
              </button>
            </div>
          </div>

          {/* Tabla de administradores */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando administradores...</p>
            </div>
          ) : adminsFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-user-shield fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {admins.length === 0
                  ? "No hay administradores registrados"
                  : "No se encontraron administradores con los filtros aplicados"}
              </h5>
              {admins.length === 0 && (
                <button className="btn btn-danger" onClick={abrirModalCrear}>
                  <i className="fas fa-user-plus me-1"></i>
                  Crear tu primer administrador
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsFiltrados.map((admin) => (
                    <tr key={admin.id}>
                      <td className="fw-bold">{admin.nombre}</td>
                      <td>{admin.email}</td>
                      <td>{getPrincipalBadge(admin.principal)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => abrirModalEditar(admin)}
                            title="Editar administrador"
                            disabled={admin.principal}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => eliminarAdmin(admin)}
                            title="Eliminar administrador"
                            disabled={admin.principal}
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
          {adminsFiltrados.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="row text-center">
                <div className="col-md-4">
                  <h6 className="text-muted">Total administradores</h6>
                  <h4 className="text-danger">{adminsFiltrados.length}</h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Principales</h6>
                  <h4 className="text-danger">
                    {adminsFiltrados.filter((a) => a.principal).length}
                  </h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Secundarios</h6>
                  <h4 className="text-secondary">
                    {adminsFiltrados.filter((a) => !a.principal).length}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-4">
            <div className="alert alert-info">
              <h6 className="alert-heading">
                <i className="fas fa-info-circle me-2"></i>
                Información Importante
              </h6>
              <ul className="mb-0">
                <li>
                  El administrador principal no puede ser editado ni eliminado
                  por seguridad.
                </li>
                <li>
                  Los administradores secundarios tienen los mismos permisos que
                  el principal.
                </li>
                <li>
                  Se recomienda mantener al menos un administrador principal
                  activo.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar administrador */}
      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="fas fa-user-shield me-2"></i>
                  {editarAdmin
                    ? "Editar Administrador"
                    : "Crear Nuevo Administrador"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                  disabled={loading}
                ></button>
              </div>

              <form onSubmit={guardarAdmin}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-user me-1"></i>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      maxLength={50}
                      disabled={loading}
                    />
                    <small className="text-muted">Máximo 50 caracteres</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-envelope me-1"></i>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      maxLength={50}
                      disabled={loading}
                    />
                    <small className="text-muted">Máximo 50 caracteres</small>
                  </div>

                  {editarAdmin && (
                    <div className="alert alert-warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <strong>Nota:</strong> Solo se pueden editar el nombre y
                      correo del administrador. Los permisos se mantienen
                      automáticamente.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cerrarModal}
                    disabled={loading}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-1"></i>
                        {editarAdmin ? "Actualizar" : "Crear"} Administrador
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
