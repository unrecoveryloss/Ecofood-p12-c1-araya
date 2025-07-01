import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AdminAdministradores() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ nombre: "", email: "", uid: "" });
  const [modoEditar, setModoEditar] = useState(false);
  const navigate = useNavigate();

  const cargarAdmins = async () => {
    const q = query(collection(db, "usuarios"), where("tipo", "==", "admin"));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAdmins(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.email) return;

    try {
      if (modoEditar) {
        const ref = doc(db, "usuarios", form.uid);
        await updateDoc(ref, {
          nombre: form.nombre,
          email: form.email,
        });
        setModoEditar(false);
      } else {
        const ref = doc(collection(db, "usuarios"));
        await setDoc(ref, {
          nombre: form.nombre,
          email: form.email,
          tipo: "admin",
          principal: false,
        });
      }
      setForm({ nombre: "", email: "", uid: "" });
      cargarAdmins();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el administrador", "error");
    }
  };

  const handleEditar = (admin) => {
    setModoEditar(true);
    setForm({ nombre: admin.nombre, email: admin.email, uid: admin.id });
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
      title: "¿Eliminar?",
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
        Swal.fire(
          "Eliminado",
          "Administrador eliminado correctamente",
          "success"
        );
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  };

  useEffect(() => {
    cargarAdmins();
  }, []);

  return (
    <div className="container mt-5">
      <button
        className="btn btn-secondary mb-3"
        onClick={() => navigate("/admin/dashboard")}
      >
        Volver al Panel Principal
      </button>
      <h2>Gestión de Administradores</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Nombre"
          className="form-control mb-2"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          className="form-control mb-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <button type="submit" className="btn btn-success">
          {modoEditar ? "Actualizar" : "Agregar"}
        </button>
        {modoEditar && (
          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => {
              setModoEditar(false);
              setForm({ nombre: "", email: "", uid: "" });
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Principal</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.length > 0 ? (
            admins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.nombre}</td>
                <td>{admin.email}</td>
                <td>{admin.principal ? "Sí" : "No"}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm me-2"
                    onClick={() => handleEditar(admin)}
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
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                No hay administradores registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
