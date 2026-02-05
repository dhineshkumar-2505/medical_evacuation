import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login/Login';
import RegisterClinic from './pages/RegisterClinic/RegisterClinic';
import PendingApproval from './pages/PendingApproval/PendingApproval';
import Dashboard from './pages/Dashboard/Dashboard';
import Patients from './pages/Patients/Patients';
import PatientForm from './pages/Patients/PatientForm';
import Vitals from './pages/Vitals/Vitals';
import Evacuations from './pages/Evacuations/Evacuations';
import Transport from './pages/Transport/Transport';
import Records from './pages/Records/Records';
import PatientRecords from './pages/Records/PatientRecords';
import CriticalRecords from './pages/CriticalRecords/CriticalRecords';

// Minimal loading spinner
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, hsl(185, 60%, 12%), hsl(152, 50%, 15%))'
  }}>
    <div style={{
      width: 48,
      height: 48,
      border: '4px solid rgba(255,255,255,0.2)',
      borderTopColor: '#14b8a6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Single router component that handles all auth states
function AppRouter() {
  const { user, loading, initialized, hasClinic, isClinicApproved, isClinicPending, isClinicRejected } = useAuth();

  // Only show loading on first initialization
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* Register - logged in but no clinic (or rejected) */}
        <Route path="/register" element={
          !user ? <Navigate to="/login" replace /> :
            (hasClinic && !isClinicRejected) ? <Navigate to="/" replace /> :
              <RegisterClinic />
        } />

        {/* Pending */}
        <Route path="/pending" element={
          !user ? <Navigate to="/login" replace /> :
            !hasClinic ? <Navigate to="/register" replace /> :
              isClinicApproved ? <Navigate to="/" replace /> :
                <PendingApproval />
        } />

        {/* Main App */}
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> :
            !hasClinic ? <Navigate to="/register" replace /> :
              !isClinicApproved ? <Navigate to="/pending" replace /> :
                <AppLayout />
        }>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<PatientForm />} />
          <Route path="vitals" element={<Vitals />} />
          <Route path="evacuations" element={<Evacuations />} />
          <Route path="evacuations/new" element={<Evacuations />} />
          <Route path="transport" element={<Transport />} />
          <Route path="records" element={<Records />} />
          <Route path="records/:id" element={<PatientRecords />} />
          <Route path="critical" element={<CriticalRecords />} />
          <Route path="settings" element={<div style={{ padding: 40 }}>Settings (Coming Soon)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        className: 'premium-toast',
        style: {
          background: '#0f172a',
          color: '#fff',
          border: '1px solid #1e293b'
        }
      }} />
      <AppRouter />
    </AuthProvider>
  );
}
