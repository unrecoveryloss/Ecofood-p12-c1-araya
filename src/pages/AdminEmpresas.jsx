import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "../services/firebase";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarEmpresa, setEditarEmpresa] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    password: "",
  });

  const navigate = useNavigate();

  const secondaryApp =
    getApps().find((app) => app.name === "Secondary") ||
    initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);

  const cargarEmpresas = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().tipo === "empresa") {
          lista.push({ id: doc.id, ...doc.data() });
        }
      });
      setEmpresas(lista);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      Swal.fire("Error", "No se pudieron cargar las empresas", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarEmpresas();
  }, []);

  // Filtrar empresas
  useEffect(() => {
    let filtradas = empresas;

    // Filtro por estado
    if (filtroEstado !== "todos") {
      filtradas = filtradas.filter(
        (empresa) => empresa.estado === filtroEstado
      );
    }

    // Filtro por nombre
    if (filtroNombre.trim()) {
      filtradas = filtradas.filter((empresa) =>
        empresa.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    setEmpresasFiltradas(filtradas);
  }, [empresas, filtroEstado, filtroNombre]);

  // Validación de la contraseña
  const validarPassword = (contraseña) => {
    const minLength = 8;
    const tieneMayuscula = /[A-Z]/.test(contraseña);
    const tieneMinuscula = /[a-z]/.test(contraseña);
    const tieneNumero = /\d/.test(contraseña);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(contraseña);

    if (
      contraseña.length < minLength ||
      !tieneMayuscula ||
      !tieneMinuscula ||
      !tieneNumero ||
      !tieneEspecial
    ) {
      Swal.fire(
        "Contraseña débil",
        "Tu contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial.",
        "warning"
      );
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      rut: "",
      email: "",
      telefono: "",
      direccion: "",
      password: "",
    });
    setEditarEmpresa(null);
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalOpen(true);
  };

  const abrirModalEditar = (empresa) => {
    setEditarEmpresa(empresa);
    setFormData({
      nombre: empresa.nombre || "",
      rut: empresa.rut || "",
      email: empresa.email || "",
      telefono: empresa.telefono || "",
      direccion: empresa.direccion || "",
      password: "",
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
    if (!formData.rut.trim()) {
      Swal.fire("Error", "El RUT es obligatorio", "warning");
      return false;
    }
    if (!formData.email.trim()) {
      Swal.fire("Error", "El email es obligatorio", "warning");
      return false;
    }
    if (!formData.telefono.trim()) {
      Swal.fire("Error", "El teléfono es obligatorio", "warning");
      return false;
    }
    if (!formData.direccion.trim()) {
      Swal.fire("Error", "La dirección es obligatoria", "warning");
      return false;
    }
    if (
      !editarEmpresa &&
      (!formData.password || !validarPassword(formData.password))
    ) {
      return false;
    }
    if (
      editarEmpresa &&
      formData.password &&
      !validarPassword(formData.password)
    ) {
      return false;
    }
    return true;
  };

  const guardarEmpresa = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validarFormulario()) return;

    setLoading(true);
    try {
      if (editarEmpresa) {
        // Actualizar empresa existente
        const empresaRef = doc(db, "usuarios", editarEmpresa.id);
        const empresaDoc = await getDoc(empresaRef);

        if (!empresaDoc.exists()) {
          Swal.fire("Error", "La empresa no existe", "error");
          return;
        }

        const updates = {
          nombre: formData.nombre.trim(),
          rut: formData.rut.trim(),
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
        };

        if (formData.password) {
          await secondaryAuth.signOut();
          const cred = await createUserWithEmailAndPassword(
            secondaryAuth,
            formData.email,
            formData.password
          );
          await sendEmailVerification(cred.user);
          updates.email = formData.email;
        }

        await updateDoc(empresaRef, updates);
        Swal.fire(
          "Empresa actualizada",
          "Los datos de la empresa han sido actualizados correctamente",
          "success"
        );

        if (formData.password) await secondaryAuth.signOut();
      } else {
        // Crear nueva empresa
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email,
          formData.password
        );
        await sendEmailVerification(cred.user);

        await setDoc(doc(db, "usuarios", cred.user.uid), {
          nombre: formData.nombre.trim(),
          rut: formData.rut.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
          tipo: "empresa",
          estado: "activa",
        });

        await secondaryAuth.signOut();

        Swal.fire(
          "Empresa creada",
          "Se envió un correo de verificación a la nueva empresa",
          "success"
        );
      }

      resetForm();
      cargarEmpresas();
      cerrarModal();
    } catch (error) {
      let mensaje = "No se pudo guardar la empresa";
      if (error.code === "auth/email-already-in-use") {
        mensaje = "El correo ya está en uso";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "Correo inválido";
      }
      Swal.fire("Error", mensaje, "error");
    }
    setLoading(false);
  };

  const eliminarEmpresa = async (empresa) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar empresa?",
      text: `¿Estás seguro de eliminar a "${empresa.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", empresa.id));
        Swal.fire("Eliminada", "Empresa eliminada correctamente", "success");
        cargarEmpresas();
      } catch (error) {
        console.error("Error al eliminar empresa:", error);
        Swal.fire("Error", "No se pudo eliminar la empresa", "error");
      }
    }
  };

  const cambiarEstado = async (empresa, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "usuarios", empresa.id), {
        estado: nuevoEstado,
      });
      Swal.fire(
        "Éxito",
        `Empresa ${
          nuevoEstado === "activa" ? "activada" : "desactivada"
        } correctamente`,
        "success"
      );
      cargarEmpresas();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      Swal.fire("Error", "No se pudo cambiar el estado de la empresa", "error");
    }
  };

  const getEstadoBadge = (estado) => {
    return estado === "activa" ? (
      <span className="badge bg-success">Activa</span>
    ) : (
      <span className="badge bg-warning text-dark">Inactiva</span>
    );
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-info text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-building me-2"></i>
              Gestión de Empresas
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
                <option value="todos">Todas las empresas</option>
                <option value="activa">Activas</option>
                <option value="inactiva">Inactivas</option>
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
                placeholder="Nombre de la empresa..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <button
                className="btn btn-info text-white w-100"
                onClick={abrirModalCrear}
                disabled={loading}
              >
                <i className="fas fa-plus me-1"></i>
                Crear Empresa
              </button>
            </div>
          </div>

          {/* Tabla de empresas */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando empresas...</p>
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-building fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {empresas.length === 0
                  ? "No hay empresas registradas"
                  : "No se encontraron empresas con los filtros aplicados"}
              </h5>
              {empresas.length === 0 && (
                <button
                  className="btn btn-info text-white"
                  onClick={abrirModalCrear}
                >
                  <i className="fas fa-plus me-1"></i>
                  Crear tu primera empresa
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Nombre</th>
                    <th>RUT</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Información de Contacto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empresasFiltradas.map((empresa) => (
                    <tr key={empresa.id}>
                      <td className="fw-bold">{empresa.nombre}</td>
                      <td>{empresa.rut}</td>
                      <td>{empresa.email}</td>
                      <td>{getEstadoBadge(empresa.estado)}</td>
                      <td>
                        <div className="small">
                          {empresa.telefono && (
                            <div>
                              <i className="fas fa-phone me-1"></i>
                              {empresa.telefono}
                            </div>
                          )}
                          {empresa.direccion && (
                            <div>
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {empresa.direccion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => abrirModalEditar(empresa)}
                            title="Editar empresa"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {empresa.estado === "activa" ? (
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => cambiarEstado(empresa, "inactiva")}
                              title="Desactivar empresa"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => cambiarEstado(empresa, "activa")}
                              title="Activar empresa"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => eliminarEmpresa(empresa)}
                            title="Eliminar empresa"
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
          {empresasFiltradas.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="row text-center">
                <div className="col-md-4">
                  <h6 className="text-muted">Total empresas</h6>
                  <h4 className="text-info">{empresasFiltradas.length}</h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Activas</h6>
                  <h4 className="text-success">
                    {
                      empresasFiltradas.filter((e) => e.estado === "activa")
                        .length
                    }
                  </h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted">Inactivas</h6>
                  <h4 className="text-warning">
                    {
                      empresasFiltradas.filter((e) => e.estado === "inactiva")
                        .length
                    }
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar empresa */}
      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-building me-2"></i>
                  {editarEmpresa ? "Editar Empresa" : "Crear Nueva Empresa"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                  disabled={loading}
                ></button>
              </div>

              <form onSubmit={guardarEmpresa}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-building me-1"></i>
                        Nombre de la Empresa *
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
                        <i className="fas fa-id-card me-1"></i>
                        RUT *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="rut"
                        value={formData.rut}
                        onChange={handleInputChange}
                        required
                        maxLength={12}
                        disabled={loading}
                      />
                      <small className="text-muted">Máximo 12 caracteres</small>
                    </div>
                  </div>

                  <div className="row">
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
                        disabled={loading || editarEmpresa !== null}
                      />
                      <small className="text-muted">Máximo 50 caracteres</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone me-1"></i>
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
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
                        <i className="fas fa-lock me-1"></i>
                        Contraseña {editarEmpresa ? "(opcional)" : "*"}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength={editarEmpresa ? 0 : 8}
                        disabled={loading}
                      />
                      <small className="text-muted">
                        {editarEmpresa
                          ? "Deja en blanco para mantener la actual"
                          : "Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo"}
                      </small>
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
                    className="btn btn-info text-white"
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
                        {editarEmpresa ? "Actualizar" : "Crear"} Empresa
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
