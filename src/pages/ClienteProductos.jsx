import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { crearSolicitud } from "../services/solicitudService";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function ClienteProductos() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroPrecio, setFiltroPrecio] = useState("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("todos");
  const [empresas, setEmpresas] = useState([]);

  // Estados del formulario de solicitud
  const [formData, setFormData] = useState({
    cantidad: "",
  });

  const cargarProductos = async () => {
    setLoading(true);
    try {
      // Cargar productos disponibles (con stock > 0)
      const q = query(collection(db, "productos"), where("cantidad", ">", 0));
      const snap = await getDocs(q);
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);

      // Cargar empresas para el filtro
      const empresasSnap = await getDocs(collection(db, "usuarios"));
      const empresasList = empresasSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.tipo === "empresa");
      setEmpresas(empresasList);
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

    // Filtro por precio
    if (filtroPrecio !== "todos") {
      filtrados = filtrados.filter((producto) => {
        if (filtroPrecio === "gratuitos") {
          return producto.precio === 0;
        } else if (filtroPrecio === "conValor") {
          return producto.precio > 0;
        }
        return true;
      });
    }

    // Filtro por empresa
    if (filtroEmpresa !== "todos") {
      filtrados = filtrados.filter(
        (producto) => producto.empresaId === filtroEmpresa
      );
    }

    setProductosFiltrados(filtrados);
  }, [productos, filtroNombre, filtroPrecio, filtroEmpresa]);

  const obtenerNombreEmpresa = (empresaId) => {
    const empresa = empresas.find((e) => e.id === empresaId);
    return empresa ? empresa.nombre : "Empresa desconocida";
  };

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

  const abrirModalSolicitud = (producto) => {
    setProductoSeleccionado(producto);
    setFormData({ cantidad: "1" });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
    setFormData({ cantidad: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarSolicitud = () => {
    const cantidad = parseInt(formData.cantidad);
    if (!cantidad || cantidad <= 0) {
      Swal.fire("Error", "La cantidad debe ser mayor a 0", "warning");
      return false;
    }
    if (cantidad > productoSeleccionado.cantidad) {
      Swal.fire(
        "Error",
        "La cantidad solicitada excede el stock disponible",
        "warning"
      );
      return false;
    }
    return true;
  };

  const realizarSolicitud = async (e) => {
    e.preventDefault();
    if (!validarSolicitud()) return;

    setLoading(true);
    try {
      // Crear la solicitud
      const solicitudData = {
        clienteId: user.uid,
        productoId: productoSeleccionado.id,
        empresaId: productoSeleccionado.empresaId,
        cantidad: parseInt(formData.cantidad),
        cantidadDisponible: productoSeleccionado.cantidad,
        precioUnitario: productoSeleccionado.precio,
        precioTotal: productoSeleccionado.precio * parseInt(formData.cantidad),
        estado: "pendiente",
        fechaSolicitud: new Date().toISOString(),
        nombreProducto: productoSeleccionado.nombre,
        nombreEmpresa: obtenerNombreEmpresa(productoSeleccionado.empresaId),
        nombreCliente: userData?.nombre || "Cliente",
        emailCliente: userData?.email || "",
      };

      console.log("Datos de la solicitud a crear:", solicitudData);
      console.log("Producto seleccionado:", productoSeleccionado);

      await crearSolicitud(solicitudData);

      Swal.fire({
        title: "Solicitud enviada",
        html: `
          <div class="text-start">
            <p><strong>Solicitud creada exitosamente</strong></p>
            <p>Producto: ${productoSeleccionado.nombre}</p>
            <p>Cantidad: ${formData.cantidad}</p>
            <p>Empresa: ${obtenerNombreEmpresa(
              productoSeleccionado.empresaId
            )}</p>
            <p>Estado: <span class="badge bg-warning">Pendiente</span></p>
            <p class="mt-2">La empresa revisará tu solicitud y te notificará el resultado.</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Entendido",
      });

      cerrarModal();
      cargarProductos(); // Recargar para actualizar stock
    } catch (error) {
      console.error("Error al crear solicitud:", error);
      Swal.fire("Error", "No se pudo crear la solicitud", "error");
    }
    setLoading(false);
  };

  const getPrecioDisplay = (precio) => {
    return precio === 0 ? (
      <span className="text-success fw-bold">Gratis</span>
    ) : (
      <span className="fw-bold">${precio.toFixed(2)}</span>
    );
  };

  const getEstadoBadge = (producto) => {
    if (producto.precio === 0) {
      return <span className="badge bg-success">Gratuito</span>;
    }
    if (estaPorVencer(producto.vencimiento)) {
      return <span className="badge bg-warning text-dark">Por Vencer</span>;
    }
    return <span className="badge bg-primary">Disponible</span>;
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <i className="fas fa-boxes me-2"></i>
              Productos Disponibles
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
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label fw-bold">
                <i className="fas fa-building me-1"></i>
                Filtrar por Empresa
              </label>
              <select
                className="form-select"
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
              >
                <option value="todos">Todas las empresas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="text-muted small">
                <i className="fas fa-info-circle me-1"></i>
                {productosFiltrados.length} productos disponibles
              </div>
            </div>
          </div>

          {/* Lista de productos */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando productos...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">
                {productos.length === 0
                  ? "No hay productos disponibles"
                  : "No se encontraron productos con los filtros aplicados"}
              </h5>
            </div>
          ) : (
            <div className="row">
              {productosFiltrados.map((producto) => (
                <div key={producto.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-0 fw-bold">{producto.nombre}</h6>
                        {getEstadoBadge(producto)}
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="card-text text-muted">
                        {producto.descripcion}
                      </p>

                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Precio:</small>
                          <div className="fw-bold">
                            {getPrecioDisplay(producto.precio)}
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Stock:</small>
                          <div className="fw-bold">
                            <span
                              className={`badge ${
                                producto.cantidad > 0
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {producto.cantidad} unidades
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Empresa:</small>
                        <div className="fw-bold text-primary">
                          {obtenerNombreEmpresa(producto.empresaId)}
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Vencimiento:</small>
                        <div className="fw-bold">
                          {producto.vencimiento}
                          {estaPorVencer(producto.vencimiento) && (
                            <div className="text-danger small">
                              <i className="fas fa-exclamation-triangle me-1"></i>
                              Vence en {diasRestantes(producto.vencimiento)}{" "}
                              días
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white">
                      <button
                        className="btn btn-success w-100"
                        onClick={() => abrirModalSolicitud(producto)}
                        disabled={producto.cantidad === 0}
                      >
                        <i className="fas fa-shopping-cart me-1"></i>
                        Solicitar Producto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para realizar solicitud */}
      {modalOpen && productoSeleccionado && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-shopping-cart me-2"></i>
                  Solicitar Producto
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                  disabled={loading}
                ></button>
              </div>

              <form onSubmit={realizarSolicitud}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <h6 className="alert-heading">
                      <i className="fas fa-info-circle me-2"></i>
                      Detalles del Producto
                    </h6>
                    <div className="row">
                      <div className="col-6">
                        <strong>Producto:</strong>
                        <p>{productoSeleccionado.nombre}</p>
                      </div>
                      <div className="col-6">
                        <strong>Empresa:</strong>
                        <p>
                          {obtenerNombreEmpresa(productoSeleccionado.empresaId)}
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-6">
                        <strong>Precio:</strong>
                        <p>{getPrecioDisplay(productoSeleccionado.precio)}</p>
                      </div>
                      <div className="col-6">
                        <strong>Stock disponible:</strong>
                        <p>{productoSeleccionado.cantidad} unidades</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-layer-group me-1"></i>
                      Cantidad a solicitar *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      min="1"
                      max={productoSeleccionado.cantidad}
                      required
                      disabled={loading}
                    />
                    <small className="text-muted">
                      Máximo {productoSeleccionado.cantidad} unidades
                      disponibles
                    </small>
                  </div>

                  {parseInt(formData.cantidad) > 0 && (
                    <div className="alert alert-warning">
                      <strong>Resumen de la solicitud:</strong>
                      <ul className="mb-0">
                        <li>Cantidad: {formData.cantidad} unidades</li>
                        <li>
                          Precio unitario:{" "}
                          {getPrecioDisplay(productoSeleccionado.precio)}
                        </li>
                        <li>
                          Total:{" "}
                          {getPrecioDisplay(
                            productoSeleccionado.precio *
                              parseInt(formData.cantidad)
                          )}
                        </li>
                      </ul>
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
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Enviando solicitud...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-1"></i>
                        Enviar Solicitud
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
