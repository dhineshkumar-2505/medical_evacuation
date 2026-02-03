import { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    AlertCircle,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Truck
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { socket } from '../../services/socketClient';
import { supabase } from '../../services/supabaseClient';
import LocationStats from '../../components/LocationStats/LocationStats';
import TransportRegionStats from '../../components/TransportRegionStats/TransportRegionStats';
import { DashboardSkeleton } from '../../components/Skeleton/Skeleton';
import GlobalSearch from '../../components/GlobalSearch/GlobalSearch';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        activeClinics: 0,
        totalPatients: 0,
        criticalCases: 0,
        pendingEvacuations: 0,
        transportProviders: 0,
        pendingTransport: 0
    });
    const [transportRegionStats, setTransportRegionStats] = useState([
        { location: 'Ooty', active: 0, pending: 0, vehicles: 0, drivers: 0 },
        { location: 'Kodaikanal', active: 0, pending: 0, vehicles: 0, drivers: 0 },
        { location: 'Andaman & Nicobar', active: 0, pending: 0, vehicles: 0, drivers: 0 },
        { location: 'Lakshadweep', active: 0, pending: 0, vehicles: 0, drivers: 0 }
    ]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    const fetchData = async () => {
        console.log('Dashboard: Starting fetch...');
        try {
            // Parallel fetch for speed
            const [clinicsRes, patientsRes, evacuationsRes] = await Promise.all([
                api.get('/clinics'),
                api.get('/patients'),
                api.get('/evacuations')
            ]);

            console.log('Dashboard: Fetch complete', { clinicsRes, patientsRes, evacuationsRes });

            // Safe access with fallbacks
            const clinicsData = clinicsRes?.data || [];
            const patientsData = patientsRes?.data || [];
            const evacuationsData = evacuationsRes?.data || [];

            // Calculate stats
            const activeClinics = clinicsData.filter(c => c.status === 'active').length;
            const totalPatients = patientsRes?.count || patientsData.length;
            const criticalCases = patientsData.filter(p => p.status === 'critical').length;
            const pendingEvacuations = evacuationsData.filter(e => e.status === 'requested').length;

            // Fetch transport stats
            const { data: transportData } = await supabase
                .from('transport_companies')
                .select('is_verified, is_active');

            const transportProviders = transportData?.filter(t => t.is_verified && t.is_active).length || 0;
            const pendingTransport = transportData?.filter(t => !t.is_verified && t.is_active).length || 0;

            // Calculate region-wise transport stats
            const locations = ['Ooty', 'Kodaikanal', 'Andaman & Nicobar', 'Lakshadweep'];
            const regionStats = await Promise.all(locations.map(async (location) => {
                // Get companies for this location
                const { data: companies } = await supabase
                    .from('transport_companies')
                    .select('id, is_verified, is_active')
                    .eq('operating_location', location);

                const active = companies?.filter(c => c.is_verified && c.is_active).length || 0;
                const pending = companies?.filter(c => !c.is_verified && c.is_active).length || 0;

                // Get vehicles count
                const companyIds = companies?.map(c => c.id) || [];
                const { count: vehiclesCount } = await supabase
                    .from('vehicles')
                    .select('*', { count: 'exact', head: true })
                    .in('company_id', companyIds);

                // Get drivers count
                const { count: driversCount } = await supabase
                    .from('drivers')
                    .select('*', { count: 'exact', head: true })
                    .in('company_id', companyIds);

                return {
                    location,
                    active,
                    pending,
                    vehicles: vehiclesCount || 0,
                    drivers: driversCount || 0
                };
            }));

            setTransportRegionStats(regionStats);

            setStats({
                activeClinics,
                totalPatients,
                criticalCases,
                pendingEvacuations,
                transportProviders,
                pendingTransport
            });

            // Combine recent activity (safe)
            const newClinics = clinicsData
                .filter(c => c.status === 'pending_approval')
                .map(c => ({
                    type: 'registration',
                    title: 'New Clinic Registration',
                    desc: `${c.name || 'Unknown'} in ${c.location_name || 'Unknown'}`,
                    time: new Date(c.created_at || Date.now()),
                    id: c.id
                }));

            const newEvacuations = evacuationsData
                .slice(0, 5)
                .map(e => ({
                    type: 'evacuation',
                    title: 'Evacuation Request',
                    desc: `${(e.urgency || 'MEDIUM').toUpperCase()} priority`,
                    time: new Date(e.created_at || Date.now()),
                    id: e.id
                }));

            const combined = [...newClinics, ...newEvacuations]
                .sort((a, b) => b.time - a.time)
                .slice(0, 10);

            setRecentActivity(combined);
            console.log('Dashboard: State updated');
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            console.log('Dashboard: Setting loading=false');
            setLoading(false);
            setInitialized(true);
        }
    };

    useEffect(() => {
        fetchData();
        socket.connect();

        // Real-time listeners
        const cleanups = [
            socket.on('clinic:created', () => fetchData()),
            socket.on('clinic:approved', () => fetchData()),
            socket.on('patient:created', () => fetchData()),
            socket.on('patient:critical', () => fetchData()),
            socket.on('evacuation:requested', () => fetchData())
        ];

        return () => {
            cleanups.forEach(clean => clean());
            socket.disconnect();
        };
    }, []);

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'registration': return <BuildingIcon />;
            case 'evacuation': return <AlertCircle className="text-danger" />;
            case 'system': return <CheckCircle2 className="text-success" />;
            default: return <Activity />;
        }
    };

    const BuildingIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <path d="M9 22v-4h6v4"></path>
            <path d="M8 6h.01"></path>
            <path d="M16 6h.01"></path>
            <path d="M12 6h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 10h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 10h.01"></path>
            <path d="M8 14h.01"></path>
        </svg>
    );

    if (loading && !initialized) {
        return (
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Command Center</h1>
                        <p className="dashboard-date">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </header>
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Command Center</h1>
                    <p className="dashboard-date">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="header-actions">
                    <GlobalSearch />
                    <div className="live-indicator">
                        <span className="pulse-dot"></span>
                        <div className="live-ripple"></div>
                        Live System
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-info-subtle">
                        <BuildingIcon />
                    </div>
                    <div>
                        <div className="stat-label">Active Clinics</div>
                        <div className="stat-value">{stats.activeClinics}</div>
                        <div className="stat-trend trend-up">
                            <ArrowUpRight size={14} />
                            <span>100% operational</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-success-subtle">
                        <Users className="text-success" />
                    </div>
                    <div>
                        <div className="stat-label">Total Patients</div>
                        <div className="stat-value">{stats.totalPatients}</div>
                        <div className="stat-trend trend-up">
                            <ArrowUpRight size={14} />
                            <span>+12% this week</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-danger-subtle">
                        <Activity className="text-danger" />
                    </div>
                    <div>
                        <div className="stat-label">Critical Cases</div>
                        <div className="stat-value">{stats.criticalCases}</div>
                        <div className="stat-trend trend-down">
                            <ArrowDownRight size={14} />
                            <span>Stable</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-warning-subtle">
                        <AlertCircle className="text-warning" />
                    </div>
                    <div>
                        <div className="stat-label">Pending Evacs</div>
                        <div className="stat-value">{stats.pendingEvacuations}</div>
                        <div className="stat-trend">
                            <Clock size={14} />
                            <span>Requires action</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clinical Dashboard Section */}
            <div className="dashboard-main-stack">
                {/* Visual Stats (Map placeholder) */}
                <div className="dashboard-section main-chart-section">
                    <div className="section-header">
                        <h2>Clinical Regional Status</h2>
                        <button className="btn-icon">
                            <span className="dots">•••</span>
                        </button>
                    </div>
                    <div className="chart-container">
                        <LocationStats />
                    </div>
                </div>
            </div>

            {/* ========== TRANSPORT DASHBOARD SECTION ========== */}
            <div style={{ marginTop: '3rem', borderTop: '2px solid #e2e8f0', paddingTop: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                        🚚 Transport Dashboard
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Emergency transport providers across all regions</p>
                </div>

                {/* Transport Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon bg-purple-subtle">
                            <Truck className="text-purple" style={{ color: '#8b5cf6' }} />
                        </div>
                        <div>
                            <div className="stat-label">Transport Providers</div>
                            <div className="stat-value">{stats.transportProviders}</div>
                            <div className="stat-trend">
                                <CheckCircle2 size={14} />
                                <span>Active & Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon bg-warning-subtle">
                            <Clock className="text-warning" />
                        </div>
                        <div>
                            <div className="stat-label">Pending Approval</div>
                            <div className="stat-value">{stats.pendingTransport}</div>
                            <div className="stat-trend">
                                <AlertCircle size={14} />
                                <span>Awaiting review</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon bg-info-subtle">
                            <Truck className="text-info" />
                        </div>
                        <div>
                            <div className="stat-label">Total Vehicles</div>
                            <div className="stat-value">
                                {transportRegionStats.reduce((sum, r) => sum + r.vehicles, 0)}
                            </div>
                            <div className="stat-trend">
                                <span>Across all regions</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon bg-success-subtle">
                            <Users className="text-success" />
                        </div>
                        <div>
                            <div className="stat-label">Total Drivers</div>
                            <div className="stat-value">
                                {transportRegionStats.reduce((sum, r) => sum + r.drivers, 0)}
                            </div>
                            <div className="stat-trend">
                                <span>Ready to serve</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transport by Region - Graph Format */}
                <div className="dashboard-section main-chart-section">
                    <div className="section-header">
                        <h2>Transport Regional Status</h2>
                        <button className="btn-icon">
                            <span className="dots">•••</span>
                        </button>
                    </div>
                    <div className="chart-container">
                        <TransportRegionStats />
                    </div>
                </div>
            </div>

            {/* Recent Activity - Outside Transport Section */}
            <div className="dashboard-main-stack" style={{ marginTop: '2rem' }}>
                {/* Recent Activity */}
                <div className="dashboard-section activity-section">
                    <div className="section-header">
                        <h2>Live Activity Feed</h2>
                        <span className="badge badge-neutral">Real-time</span>
                    </div>
                    <div className="activity-list">
                        {recentActivity.length === 0 ? (
                            <div className="empty-state">No recent activity</div>
                        ) : (
                            recentActivity.map((item) => (
                                <div key={item.id} className="activity-item">
                                    <div className="activity-icon-wrapper">
                                        {getActivityIcon(item.type)}
                                        <div className="activity-line"></div>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-header">
                                            <span className="activity-title">{item.title}</span>
                                            <span className="activity-time">{getTimeAgo(item.time)}</span>
                                        </div>
                                        <p className="activity-desc">{item.desc}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
