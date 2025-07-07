import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";

export default function EmpresaDashboard() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosActivos: 0,
    productosGratuitos: 0,
    productosPorVencer: 0,
  });
  const [loading, setLoading] = useState(true);
  const [productosSinEmpresa, setProductosSinEmpresa] = useState(0);

  useEffect(() => {
    cargarEstadisticas();
  }, [user]);

  const cargarEstadisticas = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "productos"),
        where("empresaId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const productos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Debug: Verificar productos sin empresaId
      if (productos.length === 0) {
        console.log("No se encontraron productos con empresaId:", user.uid);
        // Verificar si hay productos sin empresaId
        const todosLosProductos = await getDocs(collection(db, "productos"));
        const productosSinEmpresaId = todosLosProductos.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => !p.empresaId);

        setProductosSinEmpresa(productosSinEmpresaId.length);

        if (productosSinEmpresaId.length > 0) {
          console.log(
            "Productos sin empresaId encontrados:",
            productosSinEmpresaId
          );
          // Opcional: Corregir productos sin empresaId
          if (
            window.confirm(
              "Se encontraron productos sin empresa asignada. ¿Deseas asignarlos a tu empresa?"
            )
          ) {
            await corregirProductosSinEmpresaId(productosSinEmpresaId);
          }
        }
      } else {
        setProductosSinEmpresa(0);
      }

      const hoy = new Date();
      const productosPorVencer = productos.filter((producto) => {
        if (!producto.vencimiento) return false;
        const venc = new Date(producto.vencimiento);
        const diffMs = venc - hoy;
        const diffDias = diffMs / (1000 * 60 * 60 * 24);
        return diffDias <= 3 && diffDias >= 0;
      });

      setStats({
        totalProductos: productos.length,
        productosActivos: productos.filter((p) => p.estado === "activo").length,
        productosGratuitos: productos.filter((p) => p.precio === 0).length,
        productosPorVencer: productosPorVencer.length,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
    setLoading(false);
  };

  const corregirProductosSinEmpresaId = async (productos) => {
    try {
      const { updateDoc, doc } = await import("firebase/firestore");

      for (const producto of productos) {
        await updateDoc(doc(db, "productos", producto.id), {
          empresaId: user.uid,
        });
      }

      Swal.fire(
        "Productos corregidos",
        `Se asignaron ${productos.length} productos a tu empresa.`,
        "success"
      );

      // Recargar estadísticas
      cargarEstadisticas();
    } catch (error) {
      console.error("Error al corregir productos:", error);
      Swal.fire("Error", "No se pudieron corregir los productos", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      Swal.fire("Error", "No se pudo cerrar la sesión", "error");
    }
  };

  if (!userData) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

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
                    <i className="fas fa-building me-2"></i>
                    Bienvenido, {userData.nombre}
                  </h2>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-envelope me-1"></i>
                    {userData.email}
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

      {/* Alerta de productos sin empresa */}
      {productosSinEmpresa > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div
              className="alert alert-warning alert-dismissible fade show"
              role="alert"
            >
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Atención:</strong> Se encontraron {productosSinEmpresa}{" "}
              productos sin empresa asignada.
              <button
                type="button"
                className="btn btn-warning btn-sm ms-2"
                onClick={() => {
                  const todosLosProductos = getDocs(
                    collection(db, "productos")
                  ).then((snap) => {
                    const productosSinEmpresaId = snap.docs
                      .map((doc) => ({ id: doc.id, ...doc.data() }))
                      .filter((p) => !p.empresaId);
                    if (productosSinEmpresaId.length > 0) {
                      corregirProductosSinEmpresaId(productosSinEmpresaId);
                    }
                  });
                }}
              >
                <i className="fas fa-wrench me-1"></i>
                Asignar a mi empresa
              </button>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="alert"
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-primary h-100">
            <div className="card-body text-center">
              <div className="text-primary mb-2">
                <i className="fas fa-boxes fa-2x"></i>
              </div>
              <h4 className="card-title text-primary">
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
          <div className="card border-success h-100">
            <div className="card-body text-center">
              <div className="text-success mb-2">
                <i className="fas fa-check-circle fa-2x"></i>
              </div>
              <h4 className="card-title text-success">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.productosActivos
                )}
              </h4>
              <p className="card-text">Productos Activos</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-info h-100">
            <div className="card-body text-center">
              <div className="text-info mb-2">
                <i className="fas fa-gift fa-2x"></i>
              </div>
              <h4 className="card-title text-info">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.productosGratuitos
                )}
              </h4>
              <p className="card-text">Productos Gratuitos</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-warning h-100">
            <div className="card-body text-center">
              <div className="text-warning mb-2">
                <i className="fas fa-exclamation-triangle fa-2x"></i>
              </div>
              <h4 className="card-title text-warning">
                {loading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  stats.productosPorVencer
                )}
              </h4>
              <p className="card-text">Por Vencer (≤3 días)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Gestión de Empresa
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-primary mb-3">
                        <i className="fas fa-user-edit fa-3x"></i>
                      </div>
                      <h5 className="card-title">Perfil de Empresa</h5>
                      <p className="card-text">
                        Actualiza la información de tu empresa, incluyendo datos
                        de contacto y ubicación.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate("/empresa/perfil")}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Editar Perfil
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="text-success mb-3">
                        <i className="fas fa-boxes fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Productos</h5>
                      <p className="card-text">
                        Administra tu catálogo de productos, crea nuevos
                        productos y gestiona inventario.
                      </p>
                      <button
                        className="btn btn-success"
                        onClick={() => navigate("/empresa/productos")}
                      >
                        <i className="fas fa-box me-1"></i>
                        Gestionar Productos
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
                        <i className="fas fa-clipboard-list fa-3x"></i>
                      </div>
                      <h5 className="card-title">Gestión de Solicitudes</h5>
                      <p className="card-text">
                        Revisa y gestiona las solicitudes de productos de los
                        clientes, aprueba o rechaza según disponibilidad.
                      </p>
                      <button
                        className="btn btn-warning text-dark"
                        onClick={() => navigate("/empresa/solicitudes")}
                      >
                        <i className="fas fa-clipboard-check me-1"></i>
                        Ver Solicitudes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la empresa */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Información de Contacto
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 mb-2">
                  <strong>
                    <i className="fas fa-phone me-2 text-primary"></i>Teléfono:
                  </strong>
                  <p className="ms-4 mb-1">
                    {userData.telefono || "No especificado"}
                  </p>
                </div>
                <div className="col-12 mb-2">
                  <strong>
                    <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                    Dirección:
                  </strong>
                  <p className="ms-4 mb-1">
                    {userData.direccion || "No especificada"}
                  </p>
                </div>
                <div className="col-12">
                  <strong>
                    <i className="fas fa-id-card me-2 text-primary"></i>RUT:
                  </strong>
                  <p className="ms-4 mb-0">
                    {userData.rut || "No especificado"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Consejos Rápidos
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Mantén actualizada la información de tu empresa
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Revisa regularmente los productos por vencer
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Ofrece productos gratuitos para ayudar a la comunidad
                </li>
                <li className="mb-0">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Actualiza las cantidades de inventario frecuentemente
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
