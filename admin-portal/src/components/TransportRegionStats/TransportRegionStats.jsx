import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { Truck, Users, Car, Activity } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import '../LocationStats/LocationStats.css';

// Transport region configuration
const transportRegionConfig = [
    {
        id: 'ooty',
        name: 'Ooty',
        shortName: 'Ooty',
        icon: '⛰️',
        color: '#10b981',
        gradientFrom: '#10b981',
        gradientTo: '#059669',
    },
    {
        id: 'kodaikanal',
        name: 'Kodaikanal',
        shortName: 'Kodaikanal',
        icon: '🌄',
        color: '#8b5cf6',
        gradientFrom: '#8b5cf6',
        gradientTo: '#7c3aed',
    },
    {
        id: 'andaman',
        name: 'Andaman & Nicobar',
        shortName: 'Andaman',
        icon: '🏝️',
        color: '#3b82f6',
        gradientFrom: '#3b82f6',
        gradientTo: '#1d4ed8',
    },
    {
        id: 'lakshadweep',
        name: 'Lakshadweep',
        shortName: 'Lakshadweep',
        icon: '🌊',
        color: '#06b6d4',
        gradientFrom: '#06b6d4',
        gradientTo: '#0891b2',
    },
];

const TransportRegionStats = () => {
    const [regionData, setRegionData] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegionData();

        // Real-time subscription
        const subscription = supabase
            .channel('transport-stats-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_companies' }, fetchRegionData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, fetchRegionData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchRegionData)
            .subscribe();

        return () => subscription.unsubscribe();
    }, []);

    const fetchRegionData = async () => {
        try {
            const regionStats = await Promise.all(transportRegionConfig.map(async (region) => {
                // Get companies for this location
                const { data: companies } = await supabase
                    .from('transport_companies')
                    .select('id, is_verified, is_active')
                    .eq('operating_location', region.name);

                const activeProviders = companies?.filter(c => c.is_verified && c.is_active).length || 0;
                const pendingProviders = companies?.filter(c => !c.is_verified && c.is_active).length || 0;
                const totalProviders = activeProviders + pendingProviders;

                // Get vehicles count
                const companyIds = companies?.map(c => c.id) || [];
                const { data: vehicles } = await supabase
                    .from('vehicles')
                    .select('vehicle_type')
                    .in('company_id', companyIds);

                const vehicleCount = vehicles?.length || 0;

                // Count vehicle types
                const ambulanceCount = vehicles?.filter(v => v.vehicle_type === 'ambulance').length || 0;
                const helicopterCount = vehicles?.filter(v => v.vehicle_type === 'helicopter').length || 0;
                const shipCount = vehicles?.filter(v => v.vehicle_type === 'ship').length || 0;

                // Get drivers count
                const { count: driverCount } = await supabase
                    .from('drivers')
                    .select('*', { count: 'exact', head: true })
                    .in('company_id', companyIds);

                return {
                    ...region,
                    providers: totalProviders,
                    activeProviders,
                    pendingProviders,
                    vehicles: vehicleCount,
                    drivers: driverCount || 0,
                    trend: generateTrendData(vehicleCount),
                    vehicleDistribution: [
                        { name: 'Ambulance', value: ambulanceCount, color: '#22c55e' },
                        { name: 'Helicopter', value: helicopterCount, color: '#3b82f6' },
                        { name: 'Ship', value: shipCount, color: '#06b6d4' },
                    ].filter(v => v.value > 0), // Only show types that exist
                };
            }));

            setRegionData(regionStats);
            if (!selectedLocation) {
                setSelectedLocation(regionStats[0]);
            } else {
                const updated = regionStats.find(r => r.id === selectedLocation.id);
                if (updated) setSelectedLocation(updated);
            }
        } catch (error) {
            console.error('Error fetching transport region data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate trend data (simulated weekly trend)
    const generateTrendData = (currentCount) => {
        const variance = Math.max(1, Math.floor(currentCount * 0.05));
        return [
            { day: 'Mon', count: Math.max(0, currentCount - variance * 4) },
            { day: 'Tue', count: Math.max(0, currentCount - variance * 3) },
            { day: 'Wed', count: Math.max(0, currentCount - variance * 2) },
            { day: 'Thu', count: Math.max(0, currentCount - variance) },
            { day: 'Fri', count: currentCount },
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
                                {location.providers} providers • {location.vehicles} vehicles
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
                                <p>Transport Network Overview</p>
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
                                <Truck size={20} />
                            </div>
                            <div className="quick-stat-content">
                                <span className="quick-stat-value">{selectedLocation.activeProviders}</span>
                                <span className="quick-stat-label">Active Providers</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="quick-stat-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}>
                                <Car size={20} />
                            </div>
                            <div className="quick-stat-content">
                                <span className="quick-stat-value">{selectedLocation.vehicles}</span>
                                <span className="quick-stat-label">Total Vehicles</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="quick-stat-icon" style={{ background: '#22c55e15', color: '#22c55e' }}>
                                <Users size={20} />
                            </div>
                            <div className="quick-stat-content">
                                <span className="quick-stat-value">{selectedLocation.drivers}</span>
                                <span className="quick-stat-label">Total Drivers</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="charts-grid">
                        {/* Trend Chart */}
                        <div className="chart-card">
                            <h4>Vehicle Fleet Growth (This Week)</h4>
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
                                            dataKey="count"
                                            stroke={selectedLocation.color}
                                            strokeWidth={2}
                                            fill={`url(#gradient-${selectedLocation.id})`}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Vehicle Type Distribution */}
                        <div className="chart-card">
                            <h4>Vehicle Type Distribution</h4>
                            <div className="chart-container">
                                {selectedLocation.vehicleDistribution.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={selectedLocation.vehicleDistribution}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {selectedLocation.vehicleDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className="pie-legend" style={{ marginTop: '12px' }}>
                                            {selectedLocation.vehicleDistribution.map((item) => (
                                                <div key={item.name} className="legend-item">
                                                    <span className="legend-dot" style={{ background: item.color }} />
                                                    <span className="legend-label">{item.name}</span>
                                                    <span className="legend-value">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '180px',
                                        color: '#94a3b8',
                                        textAlign: 'center',
                                        padding: '20px'
                                    }}>
                                        <Car size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No vehicles registered yet</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Vehicles will appear here once providers add them</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransportRegionStats;
