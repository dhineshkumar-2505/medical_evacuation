import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="premium-loading-screen">
                <div className="loading-content">
                    <div className="loading-logo">
                        <div className="logo-pulse"></div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
                            <path d="M12 9v6M9 12h6" />
                        </svg>
                    </div>
                    <div className="loading-text">
                        <span>Island Medical</span>
                        <span className="loading-dots">
                            <span></span><span></span><span></span>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
