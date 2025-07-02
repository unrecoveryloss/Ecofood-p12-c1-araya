import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
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
  const [empresaId, setEmpresaId] = useState(null); // Para editar la empresa seleccionada
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

  // Validación de la contraseña
  const validarPassword = (contraseña) => {
    const minLength = 8;
    const tieneMayuscula = /[A-Z]/.test(contraseña);
    const tieneMinuscula = /[a-z]/.test(contraseña);
    const tieneNumero = /\d/.test(contraseña);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(contraseña);

    if (
      contraseña.length < minLength ||
      !tieneMayuscula ||
      !tieneMinuscula ||
      !tieneNumero ||
      !tieneEspecial
    ) {
      Swal.fire(
        "Contraseña débil",
        "Tu contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial.",
        "warning"
      );
      return false;
    }
    return true;
  };

  const crearEmpresa = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validarPassword(password)) return; // Verificamos la contraseña antes de proceder

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

  const openCreateModal = () => {
    Swal.fire({
      title: "Crear Empresa",
      html: `
        <form id="createEmpresaForm">
          <input type="text" id="nombre" class="swal2-input" placeholder="Nombre" maxlength="40" required />
          <input type="text" id="rut" class="swal2-input" placeholder="RUT" maxlength="40" required />
          <input type="email" id="email" class="swal2-input" placeholder="Email" maxlength="40" required />
          <input type="text" id="telefono" class="swal2-input" placeholder="Teléfono" maxlength="40" required />
          <input type="text" id="direccion" class="swal2-input" placeholder="Dirección" maxlength="40" required />
          <input type="password" id="password" class="swal2-input" placeholder="Contraseña" maxlength="40" required />
        </form>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value;
        const rut = document.getElementById("rut").value;
        const email = document.getElementById("email").value;
        const telefono = document.getElementById("telefono").value;
        const direccion = document.getElementById("direccion").value;
        const password = document.getElementById("password").value;

        setNombre(nombre);
        setRut(rut);
        setEmail(email);
        setTelefono(telefono);
        setDireccion(direccion);
        setPassword(password);

        crearEmpresa({ preventDefault: () => { } });
      },
    });
  };

  const openEditModal = async (empresa) => {
    setEmpresaId(empresa.id);
    setNombre(empresa.nombre);
    setRut(empresa.rut);
    setEmail(empresa.email);
    setTelefono(empresa.telefono);
    setDireccion(empresa.direccion);
    setPassword(""); // Dejar la contraseña en blanco (porque no se debe editar de forma directa)

    Swal.fire({
      title: "Editar Empresa",
      html: `
        <form id="editEmpresaForm">
          <input type="text" id="nombre" class="swal2-input" value="${empresa.nombre}" maxlength="40" minlength="8" required />
          <input type="text" id="rut" class="swal2-input" value="${empresa.rut}" maxlength="40" minlength="8" required />
          <input type="email" id="email" class="swal2-input" value="${empresa.email}" maxlength="40" minlength="8" required />
          <input type="text" id="telefono" class="swal2-input" value="${empresa.telefono}" maxlength="40" minlength="8" required />
          <input type="text" id="direccion" class="swal2-input" value="${empresa.direccion}" maxlength="40" minlength="8" required />
          <input type="password" id="password" class="swal2-input" placeholder="Contraseña (opcional)" maxlength="40" minlength="8" />
        </form>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value;
        const rut = document.getElementById("rut").value;
        const email = document.getElementById("email").value;
        const telefono = document.getElementById("telefono").value;
        const direccion = document.getElementById("direccion").value;
        const password = document.getElementById("password").value;

        setNombre(nombre);
        setRut(rut);
        setEmail(email);
        setTelefono(telefono);
        setDireccion(direccion);
        setPassword(password);

        editarEmpresa();
      },
    });
  };

  const editarEmpresa = async () => {
    if (loading) return;

    if (!empresaId) {
      Swal.fire("Error", "No se ha seleccionado una empresa para editar", "error");
      return;
    }

    setLoading(true);

    try {
      // Verificar si la empresa existe
      const empresaRef = doc(db, "usuarios", empresaId);
      const empresaDoc = await getDoc(empresaRef);

      if (!empresaDoc.exists()) {
        Swal.fire("Error", "La empresa no existe", "error");
        return;
      }

      // Preparar la actualización de los datos
      const updates = {
        nombre,
        rut,
        email,
        telefono,
        direccion,
      };

      // Si la contraseña está presente y es válida, la incluimos en la actualización
      if (password) {
        if (!validarPassword(password)) {
          setLoading(false);
          return; // No procedemos si la contraseña no es válida
        }
        updates.password = password; // Actualizar la contraseña también si es válida
      }

      // Actualizamos el documento
      await updateDoc(empresaRef, updates);

      Swal.fire(
        "Empresa actualizada",
        "Los datos de la empresa han sido actualizados correctamente",
        "success"
      );

      // Limpiamos el formulario y estado
      setEmpresaId(null);
      setNombre("");
      setRut("");
      setEmail("");
      setTelefono("");
      setDireccion("");
      setPassword(""); // Reseteamos la contraseña

      fetchEmpresas(); // Recargamos la lista de empresas

    } catch (error) {
      console.error("Error al actualizar la empresa:", error);
      Swal.fire("Error", "No se pudo actualizar la empresa. Intenta nuevamente", "error");
    }

    setLoading(false);
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
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Crear Empresa
        </button>
      </div>

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
                    className="btn btn-warning btn-sm"
                    onClick={() => openEditModal(emp)}
                    disabled={loading}
                  >
                    Editar
                  </button>
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