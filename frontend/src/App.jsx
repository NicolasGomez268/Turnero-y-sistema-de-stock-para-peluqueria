import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import BookingWizard from './components/BookingWizard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminBarberos from './pages/AdminBarberos';
import AdminCaja from './pages/AdminCaja';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminStock from './pages/AdminStock';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública - Home con booking wizard */}
          <Route 
            path="/" 
            element={
              <Layout>
                <BookingWizard />
              </Layout>
            } 
          />

          {/* Ruta pública - Login de Admin */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Rutas protegidas - Dashboard de Admin con sidebar */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route 
            path="/admin-barberos" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminBarberos />} />
          </Route>

          <Route 
            path="/admin-stock" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminStock />} />
          </Route>

          <Route 
            path="/admin-caja" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminCaja />} />
          </Route>

          {/* Redirect de rutas legacy */}
          <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
