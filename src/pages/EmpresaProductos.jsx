import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function EmpresaProductos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const cargarProductos = async () => {
    const q = query(
      collection(db, "productos"),
      where("empresaId", "==", user.uid)
    );
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
    setProductos(lista);
  };

  useEffect(() => {
    if (user) cargarProductos();
  }, [user]);

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setVencimiento("");
    setCantidad("");
    setPrecio("");
    setModoEdicion(false);
    setIdEditar(null);
  };

  const crearProducto = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "productos"), {
        empresaId: user.uid,
        nombre,
        descripcion,
        vencimiento,
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio),
        estado: parseFloat(precio) === 0 ? "gratuito" : "activo",
      });
      resetForm();
      cargarProductos();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear el producto", "error");
    }
  };

  const iniciarEdicion = (prod) => {
    setModoEdicion(true);
    setIdEditar(prod.id);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion);
    setVencimiento(prod.vencimiento);
    setCantidad(prod.cantidad);
    setPrecio(prod.precio);
  };

  const editarProducto = async (e) => {
    e.preventDefault();
    try {
      const ref = doc(db, "productos", idEditar);
      await updateDoc(ref, {
        nombre,
        descripcion,
        vencimiento,
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio),
        estado: parseFloat(precio) === 0 ? "gratuito" : "activo",
      });
      resetForm();
      cargarProductos();
    } catch (error) {
      Swal.fire("Error", "No se pudo editar el producto", "error");
    }
  };

  const eliminarProducto = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "No",
    });
    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "productos", id));
      cargarProductos();
    }
  };

  const diasRestantes = (fecha) => {
    const hoy = new Date();
    const fin = new Date(fecha);
    const diff = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="container mt-5">
      <h2>Gestión de Productos</h2>
      <button
        className="btn btn-secondary mb-3"
        onClick={() => navigate("/empresa/dashboard")}
      >
        Volver al Panel
      </button>
      <form
        onSubmit={modoEdicion ? editarProducto : crearProducto}
        className="mb-4"
      >
        <div className="row">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control mb-2"
              value={vencimiento}
              onChange={(e) => setVencimiento(e.target.value)}
              required
            />
            <input
              type="number"
              className="form-control mb-2"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              className="form-control mb-2"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-primary me-2" type="submit">
              {modoEdicion ? "Guardar" : "Crear"}
            </button>
            {modoEdicion && (
              <button className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Vence</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((prod) => (
            <tr key={prod.id}>
              <td>{prod.nombre}</td>
              <td>{prod.descripcion}</td>
              <td>
                {prod.vencimiento}{" "}
                {diasRestantes(prod.vencimiento) <= 3 && (
                  <span className="text-danger">(⚠️ vence pronto)</span>
                )}
              </td>
              <td>{prod.cantidad}</td>
              <td>{prod.precio === 0 ? "Gratis" : `$${prod.precio}`}</td>
              <td>{prod.estado}</td>
              <td>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => iniciarEdicion(prod)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => eliminarProducto(prod.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
