import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "../services/firebase"; 
import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const secondaryApp =
    getApps().find((app) => app.name === "Secondary") ||
    initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);

  const fetchEmpresas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().tipo === "empresa") {
          lista.push({ id: doc.id, ...doc.data() });
        }
      });
      setEmpresas(lista);
    } catch {
      Swal.fire("Error", "No se pudieron cargar las empresas", "error");
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const crearEmpresa = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 8) {
      Swal.fire(
        "Contraseña insegura",
        "La contraseña debe tener al menos 8 caracteres",
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      await sendEmailVerification(cred.user);

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre,
        rut,
        email,
        telefono,
        direccion,
        tipo: "empresa",
        estado: "activa",
      });

      await secondaryAuth.signOut();

      Swal.fire(
        "Empresa creada",
        "Se envió un correo de verificación a la nueva empresa",
        "success"
      );

      setNombre("");
      setRut("");
      setEmail("");
      setTelefono("");
      setDireccion("");
      setPassword("");
      fetchEmpresas();
    } catch (error) {
      let mensaje = "No se pudo crear la empresa";
      if (error.code === "auth/email-already-in-use") {
        mensaje = "El correo ya está en uso";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "Correo inválido";
      }
      Swal.fire("Error", mensaje, "error");
    }
    setLoading(false);
  };

  const eliminarEmpresa = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar empresa?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        fetchEmpresas();
        Swal.fire("Eliminada", "Empresa eliminada correctamente", "success");
      } catch {
        Swal.fire("Error", "No se pudo eliminar la empresa", "error");
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Empresas</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/dashboard")}
        >
          Volver al Panel Principal
        </button>
      </div>

      <form onSubmit={crearEmpresa} className="mb-4">
        <div className="row">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="RUT"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="email"
              className="form-control mb-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              className="form-control mb-2"
              placeholder="Contraseña (mín 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              className="btn btn-success"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Empresa"}
            </button>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.nombre}</td>
                <td>{emp.rut}</td>
                <td>{emp.email}</td>
                <td>{emp.telefono}</td>
                <td>{emp.direccion}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => eliminarEmpresa(emp.id)}
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">
                  No hay empresas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
