import { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { Building2, MapPin, Truck, Users, CheckCircle2, Loader2 } from 'lucide-react';
import './TransportProviderSelector.css';

export default function TransportProviderSelector({ clinicRegion, onSelectProvider, selectedProviderId }) {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (clinicRegion) {
            fetchProviders();
        }
    }, [clinicRegion]);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[TransportProviderSelector] Fetching providers for region:', clinicRegion);
            const response = await api.get(`/bookings/available?region=${encodeURIComponent(clinicRegion)}`);
            console.log('[TransportProviderSelector] API Response:', response.data);
            setProviders(response.data || []);

            if (response.data?.length === 0) {
                console.warn('[TransportProviderSelector] No providers found for region:', clinicRegion);
                setError(`No transport providers available in ${clinicRegion}`);
            } else {
                console.log('[TransportProviderSelector] Found', response.data?.length, 'providers');
            }
        } catch (err) {
            console.error('[TransportProviderSelector] Error fetching providers:', err);
            setError('Failed to load transport providers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="provider-selector-loading">
                <Loader2 className="spinner" />
                <p>Loading transport providers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="provider-selector-error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="transport-provider-selector">
            <div className="selector-header">
                <h3>Select Transport Provider</h3>
                <p className="region-badge">
                    <MapPin size={14} />
                    {clinicRegion}
                </p>
            </div>

            <div className="providers-grid">
                {providers.map((provider) => (
                    <div
                        key={provider.id}
                        className={`provider-card ${selectedProviderId === provider.id ? 'selected' : ''}`}
                        onClick={() => onSelectProvider(provider)}
                    >
                        <div className="provider-header">
                            <div className="provider-icon">
                                <Building2 size={24} />
                            </div>
                            <div className="provider-info">
                                <h4>{provider.company_name}</h4>
                                {provider.is_verified && (
                                    <span className="verified-badge">
                                        <CheckCircle2 size={12} />
                                        Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="provider-stats">
                            <div className="stat-item">
                                <Truck size={16} />
                                <span>{provider.available_vehicles} Vehicles</span>
                            </div>
                            <div className="stat-item">
                                <Users size={16} />
                                <span>{provider.available_drivers} Drivers</span>
                            </div>
                        </div>

                        <div className="provider-contact">
                            <p className="contact-phone">{provider.contact_phone}</p>
                        </div>

                        {selectedProviderId === provider.id && (
                            <div className="selected-indicator">
                                <CheckCircle2 size={20} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {providers.length === 0 && (
                <div className="empty-state">
                    <p>No transport providers available in your region.</p>
                    <p className="empty-hint">Please contact admin for assistance.</p>
                </div>
            )}
        </div>
    );
}
