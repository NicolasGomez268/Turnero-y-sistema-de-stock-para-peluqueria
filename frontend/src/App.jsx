import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import BookingWizard from './components/BookingWizard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

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

          {/* Ruta protegida - Dashboard de Admin */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Ruta protegida - Gestión de Stock (placeholder para futuro) */}
          <Route 
            path="/admin-servicios" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ServiciosAdmin />} />
          </Route>

          <Route 
            path="/admin-stock" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12 text-tincho-gold text-2xl">
                    Módulo de Stock - Próximamente
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
