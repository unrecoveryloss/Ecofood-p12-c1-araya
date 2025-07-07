import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalProductos: 0,
    empresasActivas: 0,
    clientesActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    console.log("Cargando estadísticas del sistema...");
    setLoading(true);
    try {
      // Cargar usuarios
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const usuarios = usuariosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Usuarios cargados:", usuarios.length);
      console.log(
        "Tipos de usuarios:",
        usuarios.map((u) => ({ tipo: u.tipo, estado: u.estado }))
      );

      // Cargar productos
      const productosSnap = await getDocs(collection(db, "productos"));
      const productos = productosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Productos cargados:", productos.length);

      // Calcular estadísticas con validaciones
      const empresasActivas = usuarios.filter(
        (u) => u.tipo === "empresa" && u.estado === "activa"
      ).length;

      const clientesActivos = usuarios.filter(
        (u) => u.tipo === "cliente" && u.estado === "activo"
      ).length;

      console.log("Empresas activas:", empresasActivas);
      console.log("Clientes activos:", clientesActivos);

      setStats({
        totalUsuarios: usuarios.length,
        totalProductos: productos.length,
        empresasActivas: empresasActivas,
        clientesActivos: clientesActivos,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // Mantener estadísticas por defecto en caso de error
      setStats({
        totalUsuarios: 0,
        totalProductos: 0,
        empresasActivas: 0,
        clientesActivos: 0,
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.fire("Error", "No se pudo cerrar sesión", "error");
    }
  };

  return (
    <div className="container mt-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">
                    <i className="fas fa-shield-alt me-2"></i>
                    Panel de Administración
                  </h2>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-cogs me-1"></i>
                    Gestión completa del sistema EcoFood
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-light btn-sm"
                    onClick={cargarEstadisticas}
                    disabled={loading}
                    title="Refrescar estadísticas"
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                  </button>
                  <button className="btn btn-light" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-1"></i>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-primary h-100">
            <div className="card-body text-center">
              <div className="text-primary mb-2">
                <i className="fas fa-users fa-2x"></i>
              </div>
              <h4 className="card-title text-primary">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.totalUsuarios
                )}
              </h4>
              <p className="card-text">Total Usuarios</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-success h-100">
            <div className="card-body text-center">
              <div className="text-success mb-2">
                <i className="fas fa-boxes fa-2x"></i>
              </div>
              <h4 className="card-title text-success">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.totalProductos
                )}
              </h4>
              <p className="card-text">Total Productos</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-info h-100">
            <div className="card-body text-center">
              <div className="text-info mb-2">
                <i className="fas fa-building fa-2x"></i>
              </div>
              <h4 className="card-title text-info">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.empresasActivas
                )}
              </h4>
              <p className="card-text">Empresas Activas</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-warning h-100">
            <div className="card-body text-center">
              <div className="text-warning mb-2">
                <i className="fas fa-user-friends fa-2x"></i>
              </div>
              <h4 className="card-title text-warning">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.clientesActivos
                )}
              </h4>
              <p className="card-text">Clientes Activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos de Gestión */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Módulos de Gestión
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-primary mb-3">
                        <i className="fas fa-users fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Usuarios</h5>
                      <p className="card-text">
                        Administra todos los usuarios del sistema: clientes,
                        empresas y administradores.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate("/admin/usuarios")}
                      >
                        <i className="fas fa-users me-1"></i>
                        Gestionar Usuarios
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-success mb-3">
                        <i className="fas fa-user-friends fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Clientes</h5>
                      <p className="card-text">
                        Crea y administra cuentas de clientes con verificación
                        de email automática.
                      </p>
                      <button
                        className="btn btn-success"
                        onClick={() => navigate("/admin/clientes")}
                      >
                        <i className="fas fa-user-plus me-1"></i>
                        Gestionar Clientes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-info mb-3">
                        <i className="fas fa-building fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Empresas</h5>
                      <p className="card-text">
                        Administra las empresas registradas y sus datos de
                        contacto.
                      </p>
                      <button
                        className="btn btn-info text-white"
                        onClick={() => navigate("/admin/empresas")}
                      >
                        <i className="fas fa-building me-1"></i>
                        Gestionar Empresas
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-warning mb-3">
                        <i className="fas fa-boxes fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Productos</h5>
                      <p className="card-text">
                        Administra el catálogo global de productos con filtros y
                        validaciones.
                      </p>
                      <button
                        className="btn btn-warning text-dark"
                        onClick={() => navigate("/admin/productos")}
                      >
                        <i className="fas fa-box me-1"></i>
                        Gestionar Productos
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-danger mb-3">
                        <i className="fas fa-shield-alt fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Administradores</h5>
                      <p className="card-text">
                        Administra los permisos y cuentas de administradores del
                        sistema.
                      </p>
                      <button
                        className="btn btn-danger"
                        onClick={() => navigate("/admin/administradores")}
                      >
                        <i className="fas fa-user-shield me-1"></i>
                        Gestionar Administradores
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Información del Sistema
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Sistema de autenticación seguro con Firebase
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Base de datos en tiempo real con Firestore
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Verificación de email obligatoria
                </li>
                <li className="mb-0">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Interfaz responsive con Bootstrap
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Acciones Rápidas
              </h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate("/admin/usuarios")}
                >
                  <i className="fas fa-users me-1"></i>
                  Ver todos los usuarios
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => navigate("/admin/productos")}
                >
                  <i className="fas fa-box me-1"></i>
                  Revisar productos
                </button>
                <button
                  className="btn btn-outline-info btn-sm"
                  onClick={() => navigate("/admin/empresas")}
                >
                  <i className="fas fa-building me-1"></i>
                  Gestionar empresas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
