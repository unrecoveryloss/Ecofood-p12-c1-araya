import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function ClientePerfil() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    direccion: "",
    comuna: "",
    telefono: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        nombre: userData.nombre || "",
        email: userData.email || "",
        direccion: userData.direccion || "",
        comuna: userData.comuna || "",
        telefono: userData.telefono || "",
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const iniciarEdicion = () => {
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setFormData({
      nombre: userData.nombre || "",
      email: userData.email || "",
      direccion: userData.direccion || "",
      comuna: userData.comuna || "",
      telefono: userData.telefono || "",
    });
    setEditando(false);
  };

  const guardarCambios = async (e) => {
    e.preventDefault();

    if (
      !formData.nombre.trim() ||
      !formData.direccion.trim() ||
      !formData.comuna
    ) {
      Swal.fire(
        "Error",
        "Los campos nombre, dirección y comuna son obligatorios",
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      const clienteRef = doc(db, "usuarios", user.uid);
      await updateDoc(clienteRef, {
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        comuna: formData.comuna,
        telefono: formData.telefono.trim(),
      });

      Swal.fire("Éxito", "Perfil actualizado correctamente", "success");
      setEditando(false);

      // Recargar la página para actualizar los datos en el contexto
      window.location.reload();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      Swal.fire("Error", "No se pudo actualizar el perfil", "error");
    }
    setLoading(false);
  };

  if (!userData) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">
                  <i className="fas fa-user-friends me-2"></i>
                  Mi Perfil de Cliente
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
              <form onSubmit={guardarCambios}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-user me-1"></i>
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      disabled={!editando}
                      maxLength={50}
                      required
                    />
                    <small className="text-muted">Máximo 50 caracteres</small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-envelope me-1"></i>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      name="email"
                      value={formData.email}
                      disabled={true}
                      readOnly
                    />
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      El correo no se puede modificar por seguridad
                    </small>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-phone me-1"></i>
                      Teléfono (opcional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={!editando}
                      maxLength={15}
                    />
                    <small className="text-muted">Máximo 15 caracteres</small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-map me-1"></i>
                      Comuna
                    </label>
                    <select
                      className="form-select"
                      name="comuna"
                      value={formData.comuna}
                      onChange={handleInputChange}
                      disabled={!editando}
                      required
                    >
                      <option value="">Selecciona una comuna...</option>
                      <option value="Andacollo">Andacollo</option>
                      <option value="Coquimbo">Coquimbo</option>
                      <option value="La Higuera">La Higuera</option>
                      <option value="La Serena">La Serena</option>
                      <option value="Paihuano">Paihuano</option>
                      <option value="Vicuña">Vicuña</option>
                      <option value="Combarbalá">Combarbalá</option>
                      <option value="Monte Patria">Monte Patria</option>
                      <option value="Ovalle">Ovalle</option>
                      <option value="Punitaqui">Punitaqui</option>
                      <option value="Río Hurtado">Río Hurtado</option>
                      <option value="Canela">Canela</option>
                      <option value="Illapel">Illapel</option>
                      <option value="Los Vilos">Los Vilos</option>
                      <option value="Salamanca">Salamanca</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    disabled={!editando}
                    maxLength={100}
                    required
                  />
                  <small className="text-muted">Máximo 100 caracteres</small>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  {!editando ? (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={iniciarEdicion}
                    >
                      <i className="fas fa-edit me-1"></i>
                      Editar Perfil
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={cancelarEdicion}
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
                            Guardando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Guardar Cambios
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>

              {/* Información adicional */}
              <div className="mt-4">
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Información Importante
                  </h6>
                  <ul className="mb-0">
                    <li>
                      Mantén actualizada tu información de contacto para recibir
                      notificaciones sobre tus solicitudes.
                    </li>
                    <li>
                      La dirección y comuna son importantes para coordinar la
                      entrega de productos aprobados.
                    </li>
                    <li>
                      El correo electrónico no se puede modificar por motivos de
                      seguridad.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
