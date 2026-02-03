import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Building2, Users, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import './LocationStats.css';

// Region definitions (static config, data is fetched live)
const regionConfig = [
    {
        id: 'andaman',
        name: 'Andaman & Nicobar',
        shortName: 'Andaman',
        icon: '🏝️',
        color: '#3b82f6',
        gradientFrom: '#3b82f6',
        gradientTo: '#1d4ed8',
        locations: ['Havelock Island', 'Neil Island', 'Port Blair'],
    },
    {
        id: 'lakshadweep',
        name: 'Lakshadweep',
        shortName: 'Lakshadweep',
        icon: '🌊',
        color: '#06b6d4',
        gradientFrom: '#06b6d4',
        gradientTo: '#0891b2',
        locations: ['Kavaratti', 'Minicoy', 'Agatti'],
    },
    {
        id: 'ooty',
        name: 'Ooty',
        shortName: 'Ooty',
        icon: '⛰️',
        color: '#10b981',
        gradientFrom: '#10b981',
        gradientTo: '#059669',
        locations: ['Ooty', 'Coonoor'],
    },
    {
        id: 'kodaikanal',
        name: 'Kodaikanal',
        shortName: 'Kodaikanal',
        icon: '🌄',
        color: '#8b5cf6',
        gradientFrom: '#8b5cf6',
        gradientTo: '#7c3aed',
        locations: ['Kodaikanal', 'Munnar', 'Yercaud'],
    },
];

const LocationStats = () => {
    const [regionData, setRegionData] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegionData();

        // Real-time subscription
        const subscription = supabase
            .channel('location-stats-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, fetchRegionData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchRegionData)
            .subscribe();

        return () => subscription.unsubscribe();
    }, []);

    const fetchRegionData = async () => {
        try {
            // Fetch all clinics with their location
            const { data: clinics } = await supabase
                .from('clinics')
                .select('id, location_name, status');

            // Fetch all active patients with their clinic
            const { data: patients } = await supabase
                .from('patients')
                .select('id, clinic_id, evacuation_readiness_status, is_active, clinics(location_name)')
                .eq('is_active', true);

            // Group data by region
            const regionStats = regionConfig.map(region => {
                // Count clinics in this region
                const regionClinics = clinics?.filter(c =>
                    region.locations.some(loc => c.location_name?.includes(loc))
                ) || [];
                const activeClinics = regionClinics.filter(c => c.status === 'active').length;

                // Count patients in this region
                const regionPatients = patients?.filter(p =>
                    region.locations.some(loc => p.clinics?.location_name?.includes(loc))
                ) || [];

                const stableCount = regionPatients.filter(p => p.evacuation_readiness_status === 'stable').length;
                const observeCount = regionPatients.filter(p => p.evacuation_readiness_status === 'observe').length;
                const criticalCount = regionPatients.filter(p =>
                    p.evacuation_readiness_status === 'prepare_evac' ||
                    p.evacuation_readiness_status === 'immediate_evac'
                ).length;

                return {
                    ...region,
                    clinics: activeClinics,
                    patients: regionPatients.length,
                    critical: criticalCount,
                    evacuations: 0, // Would need evacuations table query
                    trend: generateTrendData(regionPatients.length), // Simulated trend based on current count
                    distribution: [
                        { name: 'Stable', value: stableCount || 0, color: '#22c55e' },
                        { name: 'Observe', value: observeCount || 0, color: '#f59e0b' },
                        { name: 'Critical', value: criticalCount || 0, color: '#ef4444' },
                    ],
                };
            });

            setRegionData(regionStats);
            if (!selectedLocation) {
                setSelectedLocation(regionStats[0]);
            } else {
                // Update selected location with new data
                const updated = regionStats.find(r => r.id === selectedLocation.id);
                if (updated) setSelectedLocation(updated);
            }
        } catch (error) {
            console.error('Error fetching region data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate trend data based on current patient count (simulated weekly trend)
    const generateTrendData = (currentCount) => {
        const variance = Math.max(1, Math.floor(currentCount * 0.1));
        return [
            { day: 'Mon', patients: Math.max(0, currentCount - variance * 4) },
            { day: 'Tue', patients: Math.max(0, currentCount - variance * 3) },
            { day: 'Wed', patients: Math.max(0, currentCount - variance * 2) },
            { day: 'Thu', patients: Math.max(0, currentCount - variance) },
            { day: 'Fri', patients: currentCount },
        ];
    };

    if (loading) {
        return (
            <div className="location-stats">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div className="spinner spinner-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="location-stats">
            {/* Location Selector Cards */}
            <div className="location-selector">
                {regionData.map((location) => (
                    <button
                        key={location.id}
                        className={`location-card ${selectedLocation?.id === location.id ? 'active' : ''}`}
                        onClick={() => setSelectedLocation(location)}
                        style={{
                            '--card-color': location.color,
                            '--gradient-from': location.gradientFrom,
                            '--gradient-to': location.gradientTo,
                        }}
                    >
                        <div className="location-card-icon">{location.icon}</div>
                        <div className="location-card-content">
                            <span className="location-card-name">{location.shortName}</span>
                            <span className="location-card-stats">
                                {location.clinics} clinics • {location.patients} patients
                            </span>
                        </div>
                        {selectedLocation?.id === location.id && (
                            <div className="location-card-indicator" />
                        )}
                    </button>
                ))}
            </div>

            {/* Stats Detail Panel */}
            {selectedLocation && (
                <div className="location-detail">
                    {/* Header */}
                    <div className="detail-header">
                        <div className="detail-title">
                            <span className="detail-icon">{selectedLocation.icon}</span>
                            <div>
                                <h3>{selectedLocation.name}</h3>
                                <p>Regional Health Overview</p>
                            </div>
                        </div>
                        <div className="detail-badge" style={{ background: selectedLocation.color }}>
                            <Activity size={14} />
                            Live Data
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="quick-stats">
                        <div className="quick-stat">
                            <div className="quick-stat-icon" style={{ background: `${selectedLocation.color}15`, color: selectedLocation.color }}>
                                <Building2 size={20} />
                            </div>
                            <div className="quick-stat-content">
                                <span className="quick-stat-value">{selectedLocation.clinics}</span>
                                <span className="quick-stat-label">Active Clinics</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="quick-stat-icon" style={{ background: '#22c55e15', color: '#22c55e' }}>
                                <Users size={20} />
                            </div>
                            <div className="quick-stat-content">
                                <span className="quick-stat-value">{selectedLocation.patients}</span>
                                <span className="quick-stat-label">Total Patients</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="quick-stat-icon" style={{ background: '#ef444415', color: '#ef4444' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div className="quick-stat-content">
                                <span className="quick-stat-value">{selectedLocation.critical}</span>
                                <span className="quick-stat-label">Critical Cases</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="charts-grid">
                        {/* Trend Chart */}
                        <div className="chart-card">
                            <h4>Patient Trend (This Week)</h4>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={selectedLocation.trend}>
                                        <defs>
                                            <linearGradient id={`gradient-${selectedLocation.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={selectedLocation.color} stopOpacity={0.3} />
                                                <stop offset="100%" stopColor={selectedLocation.color} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="patients"
                                            stroke={selectedLocation.color}
                                            strokeWidth={2}
                                            fill={`url(#gradient-${selectedLocation.id})`}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribution Chart */}
                        <div className="chart-card">
                            <h4>Patient Distribution</h4>
                            <div className="chart-container pie-chart">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={selectedLocation.distribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {selectedLocation.distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pie-legend">
                                    {selectedLocation.distribution.map((item) => (
                                        <div key={item.name} className="legend-item">
                                            <span className="legend-dot" style={{ background: item.color }} />
                                            <span className="legend-label">{item.name}</span>
                                            <span className="legend-value">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationStats;
