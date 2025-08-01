import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function EmpresaPerfil() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        nombre: userData.nombre || "",
        rut: userData.rut || "",
        email: userData.email || "",
        telefono: userData.telefono || "",
        direccion: userData.direccion || "",
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
      rut: userData.rut || "",
      email: userData.email || "",
      telefono: userData.telefono || "",
      direccion: userData.direccion || "",
    });
    setEditando(false);
  };

  const guardarCambios = async (e) => {
    e.preventDefault();

    if (
      !formData.nombre.trim() ||
      !formData.rut.trim() ||
      !formData.telefono.trim() ||
      !formData.direccion.trim()
    ) {
      Swal.fire("Error", "Todos los campos son obligatorios", "warning");
      return;
    }

    setLoading(true);
    try {
      const empresaRef = doc(db, "usuarios", user.uid);
      await updateDoc(empresaRef, {
        nombre: formData.nombre.trim(),
        rut: formData.rut.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
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
          <p>Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">
                  <i className="fas fa-building me-2"></i>
                  Perfil de Empresa
                </h3>
                <button
                  className="btn btn-light btn-sm"
                  onClick={() => navigate("/empresa/dashboard")}
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
                      <i className="fas fa-signature me-1"></i>
                      Nombre de la Empresa
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
                      <i className="fas fa-id-card me-1"></i>
                      RUT
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="rut"
                      value={formData.rut}
                      onChange={handleInputChange}
                      disabled={!editando}
                      maxLength={12}
                      required
                    />
                    <small className="text-muted">Máximo 12 caracteres</small>
                  </div>
                </div>

                <div className="row">
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

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-phone me-1"></i>
                      Teléfono
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={!editando}
                      maxLength={15}
                      required
                    />
                    <small className="text-muted">Máximo 15 caracteres</small>
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
                      className="btn btn-primary"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
