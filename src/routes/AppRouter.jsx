import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import ClienteDashboard from "../pages/ClienteDashboard";
import ClienteProductos from "../pages/ClienteProductos";
import ClienteSolicitudes from "../pages/ClienteSolicitudes";
import ClientePerfil from "../pages/ClientePerfil";
import AdminDashboard from "../pages/AdminDashboard";
import AdminAdministradores from "../pages/AdminAdministradores";
import AdminClientes from "../pages/AdminClientes";
import AdminEmpresas from "../pages/AdminEmpresas";
import AdminProductos from "../pages/AdminProductos";
import AdminUsuarios from "../pages/AdminUsuarios";
import EmpresaDashboard from "../pages/EmpresaDashboard";
import EmpresaPerfil from "../pages/EmpresaPerfil";
import EmpresaProductos from "../pages/EmpresaProductos";
import EmpresaSolicitudes from "../pages/EmpresaSolicitudes";
import ResetPassword from "../pages/ResetPassword";
import EmailVerification from "../pages/EmailVerification";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-verification" element={<EmailVerification />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente/dashboard"
        element={
          <ProtectedRoute>
            <ClienteDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente/productos"
        element={
          <ProtectedRoute>
            <ClienteProductos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente/solicitudes"
        element={
          <ProtectedRoute>
            <ClienteSolicitudes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente/perfil"
        element={
          <ProtectedRoute>
            <ClientePerfil />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/clientes"
        element={
          <AdminRoute>
            <AdminClientes />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/empresas"
        element={
          <AdminRoute>
            <AdminEmpresas />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/administradores"
        element={
          <AdminRoute>
            <AdminAdministradores />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/productos"
        element={
          <AdminRoute>
            <AdminProductos />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/usuarios"
        element={
          <AdminRoute>
            <AdminUsuarios />
          </AdminRoute>
        }
      />

      <Route
        path="/empresa/dashboard"
        element={
          <ProtectedRoute>
            <EmpresaDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/empresa/perfil"
        element={
          <ProtectedRoute>
            <EmpresaPerfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresa/productos"
        element={
          <ProtectedRoute>
            <EmpresaProductos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/empresa/solicitudes"
        element={
          <ProtectedRoute>
            <EmpresaSolicitudes />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
