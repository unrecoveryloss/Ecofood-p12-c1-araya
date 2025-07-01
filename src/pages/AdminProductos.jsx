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
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarProducto, setEditarProducto] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [estado, setEstado] = useState("disponible");

  const productosRef = collection(db, "productos");
  const navigate = useNavigate();

  const cargarProductos = async () => {
    setLoading(true);
    try {
      let q = productosRef;
      if (filtro.trim() !== "") {
        q = query(
          productosRef,
          where("nombre", ">=", filtro),
          where("nombre", "<=", filtro + "\uf8ff")
        );
      }
      const snap = await getDocs(q);
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);
    } catch {
      Swal.fire("Error", "No se pudieron cargar los productos", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, [filtro]);

  const abrirModalCrear = () => {
    setEditarProducto(null);
    setNombre("");
    setDescripcion("");
    setVencimiento("");
    setCantidad("");
    setPrecio("");
    setEstado("disponible");
    setModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setEditarProducto(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setVencimiento(producto.vencimiento);
    setCantidad(producto.cantidad);
    setPrecio(producto.precio);
    setEstado(producto.estado);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || !vencimiento || !cantidad || precio === "") {
      Swal.fire("Error", "Todos los campos son obligatorios", "warning");
      return;
    }

    try {
      if (editarProducto) {
        const docRef = doc(db, "productos", editarProducto.id);
        await updateDoc(docRef, {
          nombre,
          descripcion,
          vencimiento,
          cantidad: Number(cantidad),
          precio: Number(precio),
          estado,
        });
        Swal.fire(
          "Actualizado",
          "Producto actualizado correctamente",
          "success"
        );
      } else {
        await addDoc(productosRef, {
          nombre,
          descripcion,
          vencimiento,
          cantidad: Number(cantidad),
          precio: Number(precio),
          estado,
        });
        Swal.fire("Creado", "Producto creado correctamente", "success");
      }
      cerrarModal();
      cargarProductos();
    } catch {
      Swal.fire("Error", "No se pudo guardar el producto", "error");
    }
  };

  const handleEliminar = async (producto) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "productos", producto.id));
        cargarProductos();
        Swal.fire("Eliminado", "Producto eliminado correctamente", "success");
      } catch {
        Swal.fire("Error", "No se pudo eliminar el producto", "error");
      }
    }
  };

  const estaPorVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const venc = new Date(fechaVencimiento);
    const diffMs = venc - hoy;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    return diffDias <= 3 && diffDias >= 0;
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Gestión de Productos</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/dashboard")}
        >
          Volver al Panel Principal
        </button>
      </div>

      <div className="mb-3 d-flex justify-content-between flex-wrap">
        <input
          type="text"
          placeholder="Filtrar por nombre"
          className="form-control w-100 w-md-50 mb-2 mb-md-0"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button className="btn btn-success" onClick={abrirModalCrear}>
          Crear Producto
        </button>
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos para mostrar.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
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
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.nombre}</td>
                  <td>{producto.descripcion}</td>
                  <td
                    className={
                      estaPorVencer(producto.vencimiento)
                        ? "text-danger fw-bold"
                        : ""
                    }
                    title={
                      estaPorVencer(producto.vencimiento)
                        ? "Producto próximo a vencer"
                        : ""
                    }
                  >
                    {producto.vencimiento}
                  </td>
                  <td>{producto.cantidad}</td>
                  <td>
                    {producto.precio <= 0
                      ? "Gratis"
                      : `$${producto.precio.toFixed(2)}`}
                  </td>
                  <td>{producto.estado}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => abrirModalEditar(producto)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleEliminar(producto)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <form onSubmit={handleGuardar} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editarProducto ? "Editar Producto" : "Crear Producto"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarModal}
                  aria-label="Cerrar"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Descripción</label>
                  <textarea
                    className="form-control"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Vencimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={vencimiento}
                    onChange={(e) => setVencimiento(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Precio</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Estado</label>
                  <select
                    className="form-select"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="agotado">Agotado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-success">
                  Guardar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
