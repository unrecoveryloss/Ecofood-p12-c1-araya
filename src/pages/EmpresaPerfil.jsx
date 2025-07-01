import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Swal from "sweetalert2";

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");

  const fetchEmpresas = async () => {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    const lista = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().tipo === "empresa") {
        lista.push({ id: doc.id, ...doc.data() });
      }
    });
    setEmpresas(lista);
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const crearEmpresa = async (e) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(auth, correo, password);
      await sendEmailVerification(cred.user);

      await addDoc(collection(db, "usuarios"), {
        nombre,
        rut,
        correo,
        telefono,
        direccion,
        tipo: "empresa",
        estado: "activa",
      });

      Swal.fire(
        "Empresa creada",
        "Verifica el correo de la nueva empresa",
        "success"
      );
      setNombre("");
      setRut("");
      setCorreo("");
      setTelefono("");
      setDireccion("");
      setPassword("");
      fetchEmpresas();
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la empresa", "error");
    }
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
      await deleteDoc(doc(db, "usuarios", id));
      fetchEmpresas();
    }
  };

  return (
    <div className="container mt-5">
      <h2>Gestión de Empresas</h2>
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
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="RUT"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
            />
            <input
              type="email"
              className="form-control mb-2"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
            />
            <input
              type="password"
              className="form-control mb-2"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn btn-success" type="submit">
              Crear Empresa
            </button>
          </div>
        </div>
      </form>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Correo</th>
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
              <td>{emp.correo}</td>
              <td>{emp.telefono}</td>
              <td>{emp.direccion}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => eliminarEmpresa(emp.id)}
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
