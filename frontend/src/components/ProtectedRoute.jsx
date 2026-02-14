import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-tincho-dark flex items-center justify-center">
        <div className="text-tincho-gold text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
