import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    Activity,
    FileText,
    Ambulance,
    Truck,
    Settings,
    LogOut,
    Menu,
    X,
    Stethoscope,
    Wifi,
    WifiOff,
    AlertTriangle,
    MapPin,
} from 'lucide-react';
import './AppLayout.css';

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [clinicLocation, setClinicLocation] = useState('');
    const { profile, clinic, signOut } = useAuth();
    const location = useLocation();

    // Monitor online status
    useState(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Fetch clinic location
    useEffect(() => {
        if (clinic?.operating_location) {
            setClinicLocation(clinic.operating_location);
        }
    }, [clinic]);

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/patients', icon: Users, label: 'Patients' },
        { path: '/vitals', icon: Activity, label: 'Vitals Log' },
        { path: '/critical', icon: AlertTriangle, label: 'Critical', danger: true },
        { path: '/records', icon: FileText, label: 'Records' },
        { path: '/transport', icon: Truck, label: 'Transport' },
    ];

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        const item = navItems.find(n => n.path === path);
        return item?.label || 'Clinical Portal';
    };

    return (
        <div className="app-layout">
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Stethoscope />
                    </div>
                    <div className="sidebar-brand">
                        <span className="sidebar-title" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                            {clinic?.name || 'Clinical'}
                        </span>
                        <span className="sidebar-subtitle">Clinical Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main</span>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
                            >
                                <item.icon />
                                <span className="nav-item-text">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-title">System</span>
                        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Settings />
                            <span className="nav-item-text">Settings</span>
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} />
                            ) : (
                                profile?.full_name?.charAt(0) || 'D'
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{profile?.full_name || 'Doctor'}</span>
                            <span className="user-role">Medical Staff</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost logout-btn" onClick={signOut}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <div className="main-wrapper">
                <header className="topbar">
                    <div className="topbar-left">
                        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? <Menu /> : <X />}
                        </button>
                        <div className="breadcrumb">
                            <span className="breadcrumb-item">Clinical Portal</span>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-item current">{getPageTitle()}</span>
                        </div>
                    </div>

                    <div className="topbar-right">
                        {clinicLocation && (
                            <div className="location-badge">
                                <MapPin size={14} />
                                <span>{clinicLocation}</span>
                            </div>
                        )}
                        <div className={`connection-status ${isOnline ? '' : 'offline'}`}>
                            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                            <span className="status-dot"></span>
                            <span>{isOnline ? 'Connected' : 'Offline'}</span>
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
