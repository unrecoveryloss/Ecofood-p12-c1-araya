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
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", uid: "" });
  const navigate = useNavigate();

  const cargarAdmins = async () => {
    try {
      const q = query(collection(db, "usuarios"), where("tipo", "==", "admin"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAdmins(data);
    } catch {
      Swal.fire("Error", "No se pudieron cargar los administradores", "error");
    }
  };

  useEffect(() => {
    cargarAdmins();
  }, []);

  const abrirModalCrear = () => {
    setModoEditar(false);
    setForm({ nombre: "", email: "", uid: "" });
    setModalOpen(true);
  };

  const abrirModalEditar = (admin) => {
    setModoEditar(true);
    setForm({ nombre: admin.nombre, email: admin.email, uid: admin.id });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim()) {
      Swal.fire("Error", "Nombre y correo son obligatorios", "warning");
      return;
    }

    try {
      if (modoEditar) {
        const ref = doc(db, "usuarios", form.uid);
        await updateDoc(ref, {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
        });
        Swal.fire("Actualizado", "Administrador actualizado correctamente", "success");
      } else {
        await addDoc(collection(db, "usuarios"), {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          tipo: "admin",
          principal: false,
        });
        Swal.fire("Creado", "Administrador agregado correctamente", "success");
      }
      cerrarModal();
      cargarAdmins();
      setForm({ nombre: "", email: "", uid: "" });
      setModoEditar(false);
    } catch {
      Swal.fire("Error", "No se pudo guardar el administrador", "error");
    }
  };

  const handleEliminar = async (admin) => {
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
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", admin.id));
        cargarAdmins();
        Swal.fire("Eliminado", "Administrador eliminado correctamente", "success");
      } catch {
        Swal.fire("Error", "No se pudo eliminar el administrador", "error");
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Gestión de Administradores</h2>
        <button className="btn btn-secondary" onClick={() => navigate("/admin/dashboard")}>
          Volver al Panel Principal
        </button>
      </div>

      <div className="mb-3 d-flex justify-content-end">
        <button className="btn btn-success" onClick={abrirModalCrear}>
          Crear Administrador
        </button>
      </div>

      {admins.length === 0 ? (
        <p>No hay administradores registrados.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Principal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.nombre}</td>
                  <td>{admin.email}</td>
                  <td>{admin.principal ? "Sí" : "No"}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => abrirModalEditar(admin)}
                      disabled={admin.principal}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleEliminar(admin)}
                      disabled={admin.principal}
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
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modoEditar ? "Editar Administrador" : "Crear Administrador"}</h5>
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
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Correo</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
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
