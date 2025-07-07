import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, secondaryAuth } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Swal from "sweetalert2";

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarCliente, setEditarCliente] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    direccion: "",
    comuna: "",
    telefono: "",
  });

  const navigate = useNavigate();
  const clientesRef = collection(db, "usuarios");

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const q = query(clientesRef, where("tipo", "==", "cliente"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      Swal.fire("Error", "No se pudieron cargar los clientes", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Filtrar clientes
  useEffect(() => {
    let filtrados = clientes;

    // Filtro por estado
    if (filtroEstado !== "todos") {
      filtrados = filtrados.filter(
        (cliente) => cliente.estado === filtroEstado
      );
    }

    // Filtro por nombre
    if (filtroNombre.trim()) {
      filtrados = filtrados.filter((cliente) =>
        cliente.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    setClientesFiltrados(filtrados);
  }, [clientes, filtroEstado, filtroNombre]);

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      password: "",
      direccion: "",
      comuna: "",
      telefono: "",
    });
    setEditarCliente(null);
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalOpen(true);
  };

  const abrirModalEditar = (cliente) => {
    setEditarCliente(cliente);
    setFormData({
      nombre: cliente.nombre || "",
      email: cliente.email || "",
      password: "",
      direccion: cliente.direccion || "",
      comuna: cliente.comuna || "",
      telefono: cliente.telefono || "",
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
    if (
      !editarCliente &&
      (!formData.password || formData.password.length < 8)
    ) {
      Swal.fire(
        "Error",
        "La contraseña debe tener al menos 8 caracteres",
        "warning"
      );
      return false;
    }
    if (!formData.direccion.trim()) {
      Swal.fire("Error", "La dirección es obligatoria", "warning");
      return false;
    }
    if (!formData.comuna) {
      Swal.fire("Error", "La comuna es obligatoria", "warning");
      return false;
    }
    return true;
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validarFormulario()) return;

    setLoading(true);
    try {
      if (editarCliente) {
        // Actualizar cliente existente
        const docRef = doc(db, "usuarios", editarCliente.id);
        const datosActualizar = {
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim(),
          comuna: formData.comuna,
          telefono: formData.telefono.trim(),
        };

        if (formData.password) {
          await secondaryAuth.signOut();
          const cred = await createUserWithEmailAndPassword(
            secondaryAuth,
            formData.email,
            formData.password
          );
          await sendEmailVerification(cred.user);
          datosActualizar.email = formData.email;
        }

        await updateDoc(docRef, datosActualizar);
        Swal.fire(
          "Actualizado",
          "Cliente actualizado correctamente",
          "success"
        );
        cerrarModal();
        cargarClientes();
        if (formData.password) await secondaryAuth.signOut();
      } else {
        // Crear nuevo cliente
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email,
          formData.password
        );
        await sendEmailVerification(cred.user);

        await setDoc(doc(db, "usuarios", cred.user.uid), {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          direccion: formData.direccion.trim(),
          comuna: formData.comuna,
          telefono: formData.telefono.trim(),
          tipo: "cliente",
          estado: "activo",
        });

        Swal.fire(
          "Cliente creado",
          "Se envió un correo de verificación al nuevo cliente",
          "success"
        );
        resetForm();
        cargarClientes();
        await secondaryAuth.signOut();
        cerrarModal();
      }
    } catch (error) {
      let mensaje = "No se pudo guardar el cliente";
      if (error.code === "auth/email-already-in-use") {
        mensaje = "El correo ya está en uso";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "Correo inválido";
      }
      Swal.fire("Error", mensaje, "error");
    }
    setLoading(false);
  };

  const eliminarCliente = async (cliente) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: `¿Estás seguro de eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", cliente.id));
        Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
        cargarClientes();
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        Swal.fire("Error", "No se pudo eliminar el cliente", "error");
      }
    }
  };

  const cambiarEstado = async (cliente, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "usuarios", cliente.id), {
        estado: nuevoEstado,
      });
      Swal.fire(
        "Éxito",
        `Cliente ${
          nuevoEstado === "activo" ? "activado" : "desactivado"
        } correctamente`,
        "success"
      );
      cargarClientes();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      Swal.fire("Error", "No se pudo cambiar el estado del cliente", "error");
    }
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
        <div className="card-header bg-success text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-user-friends me-2"></i>
              Gestión de Clientes
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
                Filtrar por Estado
              </label>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los clientes</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
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
                placeholder="Nombre del cliente..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <button
                className="btn btn-success w-100"
                onClick={abrirModalCrear}
                disabled={loading}
              >
                <i className="fas fa-user-plus me-1"></i>
                Crear Cliente
              </button>
            </div>
          </div>

          {/* Tabla de clientes */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-user-friends fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {clientes.length === 0
                  ? "No hay clientes registrados"
                  : "No se encontraron clientes con los filtros aplicados"}
              </h5>
              {clientes.length === 0 && (
                <button className="btn btn-success" onClick={abrirModalCrear}>
                  <i className="fas fa-user-plus me-1"></i>
                  Crear tu primer cliente
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
                    <th>Estado</th>
                    <th>Información de Contacto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="fw-bold">{cliente.nombre}</td>
                      <td>{cliente.email}</td>
                      <td>{getEstadoBadge(cliente.estado)}</td>
                      <td>
                        <div className="small">
                          {cliente.telefono && (
                            <div>
                              <i className="fas fa-phone me-1"></i>
                              {cliente.telefono}
                            </div>
                          )}
                          {cliente.direccion && (
                            <div>
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {cliente.direccion}
                            </div>
                          )}
                          {cliente.comuna && (
                            <div>
                              <i className="fas fa-map me-1"></i>Comuna:{" "}
                              {cliente.comuna}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => abrirModalEditar(cliente)}
                            title="Editar cliente"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {cliente.estado === "activo" ? (
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => cambiarEstado(cliente, "inactivo")}
                              title="Desactivar cliente"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => cambiarEstado(cliente, "activo")}
                              title="Activar cliente"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => eliminarCliente(cliente)}
                            title="Eliminar cliente"
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
          {clientesFiltrados.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="row text-center">
                <div className="col-md-4">
                  <h6 className="text-muted">Total clientes</h6>
                  <h4 className="text-success">{clientesFiltrados.length}</h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Activos</h6>
                  <h4 className="text-success">
                    {
                      clientesFiltrados.filter((c) => c.estado === "activo")
                        .length
                    }
                  </h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Inactivos</h6>
                  <h4 className="text-warning">
                    {
                      clientesFiltrados.filter((c) => c.estado === "inactivo")
                        .length
                    }
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar cliente */}
      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-user me-2"></i>
                  {editarCliente ? "Editar Cliente" : "Crear Nuevo Cliente"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                  disabled={loading}
                ></button>
              </div>

              <form onSubmit={guardarCliente}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
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

                    <div className="col-md-6 mb-3">
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
                        disabled={loading || editarCliente !== null}
                      />
                      <small className="text-muted">Máximo 50 caracteres</small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-lock me-1"></i>
                        Contraseña {editarCliente ? "(opcional)" : "*"}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength={editarCliente ? 0 : 8}
                        disabled={loading}
                      />
                      <small className="text-muted">
                        {editarCliente
                          ? "Deja en blanco para mantener la actual"
                          : "Mínimo 8 caracteres"}
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone me-1"></i>
                        Teléfono (opcional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        maxLength={15}
                        disabled={loading}
                      />
                      <small className="text-muted">Máximo 15 caracteres</small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        Dirección *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                        disabled={loading}
                      />
                      <small className="text-muted">
                        Máximo 100 caracteres
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map me-1"></i>
                        Comuna *
                      </label>
                      <select
                        className="form-select"
                        name="comuna"
                        value={formData.comuna}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Selecciona una comuna...</option>
                        <option value="Andacollo">Andacollo</option>
                        <option value="Coquimbo">Coquimbo</option>
                        <option value="La Higuera">La Higuera</option>
                        <option value="La Serena">La Serena</option>
                        <option value="Paihuano">Paihuano</option>
                        <option value="Vicuña">Vicuña</option>
                        <option value="Combarbalá">Combarbalá</option>
                        <option value="Monte Patria">Monte Patria</option>
                        <option value="Ovalle">Ovalle</option>
                        <option value="Punitaqui">Punitaqui</option>
                        <option value="Río Hurtado">Río Hurtado</option>
                        <option value="Canela">Canela</option>
                        <option value="Illapel">Illapel</option>
                        <option value="Los Vilos">Los Vilos</option>
                        <option value="Salamanca">Salamanca</option>
                      </select>
                    </div>
                  </div>
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
                    className="btn btn-success"
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
                        {editarCliente ? "Actualizar" : "Crear"} Cliente
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
