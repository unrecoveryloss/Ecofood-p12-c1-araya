import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import Swal from "sweetalert2";

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarProducto, setEditarProducto] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrecio, setFiltroPrecio] = useState("todos");

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    vencimiento: "",
    cantidad: "",
    precio: "",
    estado: "disponible",
  });

  const productosRef = collection(db, "productos");
  const navigate = useNavigate();

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(productosRef);
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      Swal.fire("Error", "No se pudieron cargar los productos", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrar productos
  useEffect(() => {
    let filtrados = productos;

    // Filtro por nombre
    if (filtroNombre.trim()) {
      filtrados = filtrados.filter((producto) =>
        producto.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      filtrados = filtrados.filter(
        (producto) => producto.estado === filtroEstado
      );
    }

    // Filtro por precio
    if (filtroPrecio !== "todos") {
      filtrados = filtrados.filter((producto) => {
        if (filtroPrecio === "gratuitos") {
          return producto.precio === 0;
        } else if (filtroPrecio === "conValor") {
          return producto.precio > 0;
        } else if (filtroPrecio === "porVencer") {
          return estaPorVencer(producto.vencimiento);
        }
        return true;
      });
    }

    setProductosFiltrados(filtrados);
  }, [productos, filtroNombre, filtroEstado, filtroPrecio]);

  const estaPorVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const venc = new Date(fechaVencimiento);
    const diffMs = venc - hoy;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    return diffDias <= 3 && diffDias >= 0;
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const fin = new Date(fecha);
    const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      vencimiento: "",
      cantidad: "",
      precio: "",
      estado: "disponible",
    });
    setEditarProducto(null);
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setEditarProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      vencimiento: producto.vencimiento,
      cantidad: producto.cantidad.toString(),
      precio: producto.precio.toString(),
      estado: producto.estado,
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
    if (!formData.descripcion.trim()) {
      Swal.fire("Error", "La descripción es obligatoria", "warning");
      return false;
    }
    if (!formData.vencimiento) {
      Swal.fire("Error", "La fecha de vencimiento es obligatoria", "warning");
      return false;
    }
    if (!formData.cantidad || parseInt(formData.cantidad) < 0) {
      Swal.fire("Error", "La cantidad debe ser mayor o igual a 0", "warning");
      return false;
    }
    if (formData.precio === "" || parseFloat(formData.precio) < 0) {
      Swal.fire("Error", "El precio debe ser mayor o igual a 0", "warning");
      return false;
    }
    return true;
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const productoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        vencimiento: formData.vencimiento,
        cantidad: parseInt(formData.cantidad),
        precio: parseFloat(formData.precio),
        estado:
          parseFloat(formData.precio) === 0 ? "gratuito" : formData.estado,
        fechaCreacion: new Date().toISOString(),
      };

      if (editarProducto) {
        await updateDoc(doc(db, "productos", editarProducto.id), productoData);
        Swal.fire(
          "Actualizado",
          "Producto actualizado correctamente",
          "success"
        );
      } else {
        await addDoc(productosRef, productoData);
        Swal.fire("Creado", "Producto creado correctamente", "success");
      }

      cerrarModal();
      cargarProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      Swal.fire("Error", "No se pudo guardar el producto", "error");
    }
    setLoading(false);
  };

  const eliminarProducto = async (producto) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      text: `¿Estás seguro de eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "productos", producto.id));
        Swal.fire("Eliminado", "Producto eliminado correctamente", "success");
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        Swal.fire("Error", "No se pudo eliminar el producto", "error");
      }
    }
  };

  const getEstadoBadge = (producto) => {
    if (producto.precio === 0) {
      return <span className="badge bg-success">Gratuito</span>;
    }
    if (estaPorVencer(producto.vencimiento)) {
      return <span className="badge bg-warning text-dark">Por Vencer</span>;
    }
    return <span className="badge bg-primary">{producto.estado}</span>;
  };

  const getPrecioDisplay = (precio) => {
    return precio === 0 ? (
      <span className="text-success fw-bold">Gratis</span>
    ) : (
      <span className="fw-bold">${precio.toFixed(2)}</span>
    );
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-warning text-dark">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-boxes me-2"></i>
              Gestión de Productos
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
            <div className="col-md-3 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-search me-1"></i>
                Buscar por nombre
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre del producto..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-filter me-1"></i>
                Filtrar por Estado
              </label>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="agotado">Agotado</option>
                <option value="gratuito">Gratuito</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-dollar-sign me-1"></i>
                Filtrar por Precio
              </label>
              <select
                className="form-select"
                value={filtroPrecio}
                onChange={(e) => setFiltroPrecio(e.target.value)}
              >
                <option value="todos">Todos los precios</option>
                <option value="gratuitos">Gratuitos</option>
                <option value="conValor">Con valor</option>
                <option value="porVencer">Por vencer (≤3 días)</option>
              </select>
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <button
                className="btn btn-warning text-dark w-100"
                onClick={abrirModalCrear}
                disabled={loading}
              >
                <i className="fas fa-plus me-1"></i>
                Crear Producto
              </button>
            </div>
          </div>

          {/* Tabla de productos */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando productos...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {productos.length === 0
                  ? "No hay productos registrados"
                  : "No se encontraron productos con los filtros aplicados"}
              </h5>
              {productos.length === 0 && (
                <button
                  className="btn btn-warning text-dark"
                  onClick={abrirModalCrear}
                >
                  <i className="fas fa-plus me-1"></i>
                  Crear tu primer producto
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Vencimiento</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id}>
                      <td className="fw-bold">{producto.nombre}</td>
                      <td>{producto.descripcion}</td>
                      <td>
                        <div>
                          {producto.vencimiento}
                          {estaPorVencer(producto.vencimiento) && (
                            <div className="text-danger small">
                              <i className="fas fa-exclamation-triangle me-1"></i>
                              Vence en {diasRestantes(producto.vencimiento)}{" "}
                              días
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            producto.cantidad > 0 ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {producto.cantidad}
                        </span>
                      </td>
                      <td>{getPrecioDisplay(producto.precio)}</td>
                      <td>{getEstadoBadge(producto)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => abrirModalEditar(producto)}
                            title="Editar producto"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => eliminarProducto(producto)}
                            title="Eliminar producto"
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
          {productosFiltrados.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="row text-center">
                <div className="col-md-3">
                  <h6 className="text-muted">Total productos</h6>
                  <h4 className="text-warning">{productosFiltrados.length}</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Gratuitos</h6>
                  <h4 className="text-success">
                    {productosFiltrados.filter((p) => p.precio === 0).length}
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Por vencer</h6>
                  <h4 className="text-warning">
                    {
                      productosFiltrados.filter((p) =>
                        estaPorVencer(p.vencimiento)
                      ).length
                    }
                  </h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Agotados</h6>
                  <h4 className="text-danger">
                    {productosFiltrados.filter((p) => p.cantidad === 0).length}
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar producto */}
      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="fas fa-box me-2"></i>
                  {editarProducto ? "Editar Producto" : "Crear Nuevo Producto"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarModal}
                  disabled={loading}
                ></button>
              </div>

              <form onSubmit={guardarProducto}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-tag me-1"></i>
                        Nombre del Producto *
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
                        <i className="fas fa-calendar me-1"></i>
                        Fecha de Vencimiento *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="vencimiento"
                        value={formData.vencimiento}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-align-left me-1"></i>
                      Descripción *
                    </label>
                    <textarea
                      className="form-control"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      required
                      maxLength={200}
                      disabled={loading}
                    ></textarea>
                    <small className="text-muted">Máximo 200 caracteres</small>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-layer-group me-1"></i>
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="cantidad"
                        value={formData.cantidad}
                        onChange={handleInputChange}
                        min="0"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-dollar-sign me-1"></i>
                        Precio *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="precio"
                        value={formData.precio}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                        disabled={loading}
                      />
                      <small className="text-muted">
                        Ingresa 0 para productos gratuitos
                      </small>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-toggle-on me-1"></i>
                        Estado
                      </label>
                      <select
                        className="form-select"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        disabled={loading || parseFloat(formData.precio) === 0}
                      >
                        <option value="disponible">Disponible</option>
                        <option value="agotado">Agotado</option>
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
                    className="btn btn-warning text-dark"
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
                        {editarProducto ? "Actualizar" : "Crear"} Producto
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
