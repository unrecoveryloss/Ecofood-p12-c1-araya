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
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarCliente, setEditarCliente] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const clientesRef = collection(db, "usuarios");

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const q = query(clientesRef, where("tipo", "==", "cliente"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClientes(data);
    } catch {
      Swal.fire("Error", "No se pudieron cargar los clientes", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const abrirModalCrear = () => {
    setEditarCliente(null);
    setNombre("");
    setEmail("");
    setPassword("");
    setModalOpen(true);
  };

  const abrirModalEditar = (cliente) => {
    setEditarCliente(cliente);
    setNombre(cliente.nombre);
    setEmail(cliente.email);
    setPassword("");
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!nombre || !email || (editarCliente === null && password.length < 8)) {
      Swal.fire(
        "Error",
        editarCliente === null
          ? "Todos los campos son obligatorios y la contraseña debe tener al menos 8 caracteres"
          : "Nombre y correo son obligatorios",
        "warning"
      );
      return;
    }
    setLoading(true);
    if (editarCliente) {
      try {
        const docRef = doc(db, "usuarios", editarCliente.id);
        const datosActualizar = { nombre, email };
        if (password) {
          await secondaryAuth.signOut();
          const cred = await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password
          );
          await sendEmailVerification(cred.user);
          datosActualizar.email = email;
        }
        await updateDoc(docRef, datosActualizar);
        Swal.fire("Actualizado", "Cliente actualizado correctamente", "success");
        cerrarModal();
        cargarClientes();
        if (password) await secondaryAuth.signOut();
      } catch (error) {
        let mensaje = "No se pudo actualizar el cliente";
        if (error.code === "auth/email-already-in-use") {
          mensaje = "El correo ya está en uso";
        } else if (error.code === "auth/invalid-email") {
          mensaje = "Correo inválido";
        }
        Swal.fire("Error", mensaje, "error");
      }
    } else {
      try {
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password
        );
        await sendEmailVerification(cred.user);
        await setDoc(doc(db, "usuarios", cred.user.uid), {
          nombre,
          email,
          tipo: "cliente",
          estado: "activo",
        });
        Swal.fire(
          "Cliente creado",
          "Se envió un correo de verificación al nuevo cliente",
          "success"
        );
        setNombre("");
        setEmail("");
        setPassword("");
        cargarClientes();
        await secondaryAuth.signOut();
        cerrarModal();
      } catch (error) {
        let mensaje = "No se pudo crear el cliente";
        if (error.code === "auth/email-already-in-use") {
          mensaje = "El correo ya está en uso";
        } else if (error.code === "auth/invalid-email") {
          mensaje = "Correo inválido";
        }
        Swal.fire("Error", mensaje, "error");
      }
    }
    setLoading(false);
  };

  const handleEliminar = async (cliente) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", cliente.id));
        cargarClientes();
        Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
      } catch {
        Swal.fire("Error", "No se pudo eliminar el cliente", "error");
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Gestión de Clientes</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/dashboard")}
          disabled={loading}
        >
          Volver al Panel Principal
        </button>
      </div>

      <div className="mb-3">
        <button className="btn btn-success" onClick={abrirModalCrear} disabled={loading}>
          Crear Cliente
        </button>
      </div>

      {loading ? (
        <p>Cargando clientes...</p>
      ) : clientes.length === 0 ? (
        <p>No hay clientes registrados.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nombre}</td>
                <td>{cliente.email}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm me-2"
                    onClick={() => abrirModalEditar(cliente)}
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminar(cliente)}
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <form onSubmit={guardarCliente} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editarCliente ? "Editar Cliente" : "Crear Cliente"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarModal}
                  aria-label="Cerrar"
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    placeholder="Correo"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || editarCliente !== null}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder={
                      editarCliente
                        ? "Nueva contraseña (opcional, mínimo 8 caracteres)"
                        : "Contraseña (mín 8 caracteres)"
                    }
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={editarCliente ? 0 : 8}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading
                    ? editarCliente
                      ? "Actualizando..."
                      : "Creando..."
                    : editarCliente
                    ? "Actualizar Cliente"
                    : "Crear Cliente"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModal}
                  disabled={loading}
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
