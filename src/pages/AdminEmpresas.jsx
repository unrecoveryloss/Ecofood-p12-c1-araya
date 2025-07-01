import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const navigate = useNavigate();

  const cargarEmpresas = async () => {
    const q = query(collection(db, "usuarios"), where("tipo", "==", "empresa"));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setEmpresas(data);
  };

  const handleEliminar = async (empresa) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar empresa?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "usuarios", empresa.id));
        cargarEmpresas();
        Swal.fire("Eliminado", "Empresa eliminada correctamente", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la empresa", "error");
      }
    }
  };

  useEffect(() => {
    cargarEmpresas();
  }, []);

  return (
    <div className="container mt-5">
      <button
        className="btn btn-secondary mb-3"
        onClick={() => navigate("/admin/dashboard")}
      >
        Volver al Panel Principal
      </button>

      <h2>Gestión de Empresas</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empresas.length > 0 ? (
            empresas.map((empresa) => (
              <tr key={empresa.id}>
                <td>{empresa.nombre}</td>
                <td>{empresa.email}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminar(empresa)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">
                No hay empresas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
