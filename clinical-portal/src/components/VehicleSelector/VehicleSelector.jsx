import { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { Truck, Users, Star, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import './VehicleSelector.css';

export default function VehicleSelector({
    companyId,
    patientRiskScore = 50,
    onSelectVehicle,
    selectedVehicleId
}) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recommendedVehicleId, setRecommendedVehicleId] = useState(null);

    useEffect(() => {
        if (companyId) {
            fetchVehicles();
        }
    }, [companyId]);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/bookings/vehicles/${companyId}`);
            const vehicleData = response.data || [];
            setVehicles(vehicleData);

            // Calculate recommendation
            const recommended = getRecommendedVehicle(vehicleData, patientRiskScore);
            setRecommendedVehicleId(recommended?.id || null);

            if (vehicleData.length === 0) {
                setError('No vehicles available for this provider');
            }
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    };

    const getRecommendedVehicle = (availableVehicles, riskScore) => {
        if (!availableVehicles || availableVehicles.length === 0) {
            return null;
        }

        let recommendedType;

        if (riskScore >= 80) {
            // Critical - prioritize helicopter
            recommendedType = 'helicopter';
        } else if (riskScore >= 60) {
            // High risk - ambulance or helicopter
            recommendedType = 'ambulance';
        } else if (riskScore >= 30) {
            // Moderate - ambulance or ship
            recommendedType = 'ambulance';
        } else {
            // Low risk - any available vehicle
            recommendedType = 'ship';
        }

        // Try to find exact match
        let vehicle = availableVehicles.find(v => v.vehicle_type === recommendedType);

        // Fallback priority: helicopter > ambulance > ship > boat
        if (!vehicle) {
            const priority = ['helicopter', 'ambulance', 'ship', 'boat'];
            for (const type of priority) {
                vehicle = availableVehicles.find(v => v.vehicle_type === type);
                if (vehicle) break;
            }
        }

        return vehicle;
    };

    const getRiskLevel = (score) => {
        if (score >= 80) return { label: 'Critical', class: 'critical' };
        if (score >= 60) return { label: 'High', class: 'high' };
        if (score >= 30) return { label: 'Moderate', class: 'moderate' };
        return { label: 'Low', class: 'low' };
    };

    const getVehicleIcon = (type) => {
        const icons = {
            helicopter: '🚁',
            ambulance: '🚑',
            ship: '🚢',
            boat: '⛵'
        };
        return icons[type] || '🚗';
    };

    if (loading) {
        return (
            <div className="vehicle-selector-loading">
                <Loader2 className="spinner" />
                <p>Loading vehicles...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vehicle-selector-error">
                <AlertCircle size={20} />
                <p>{error}</p>
            </div>
        );
    }

    const riskLevel = getRiskLevel(patientRiskScore);

    return (
        <div className="vehicle-selector">
            <div className="selector-header">
                <h3>Select Vehicle</h3>
                <div className={`risk-badge risk-${riskLevel.class}`}>
                    <AlertCircle size={14} />
                    Patient Risk: {riskLevel.label} ({patientRiskScore}/100)
                </div>
            </div>

            <div className="vehicles-grid">
                {vehicles.map((vehicle) => {
                    const isRecommended = vehicle.id === recommendedVehicleId;
                    const isSelected = vehicle.id === selectedVehicleId;

                    return (
                        <div
                            key={vehicle.id}
                            className={`vehicle-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
                            onClick={() => onSelectVehicle(vehicle)}
                        >
                            {isRecommended && (
                                <div className="recommended-badge">
                                    <Star size={12} />
                                    Recommended
                                </div>
                            )}

                            <div className="vehicle-icon-large">
                                {getVehicleIcon(vehicle.vehicle_type)}
                            </div>

                            <div className="vehicle-info">
                                <h4>{vehicle.vehicle_name}</h4>
                                <p className="vehicle-type">{vehicle.vehicle_type}</p>
                                <p className="vehicle-plate">{vehicle.license_plate}</p>
                            </div>

                            <div className="vehicle-capacity">
                                <Users size={16} />
                                <span>Capacity: {vehicle.capacity}</span>
                            </div>

                            {isSelected && (
                                <div className="selected-indicator">
                                    <CheckCircle2 size={20} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {vehicles.length === 0 && (
                <div className="empty-state">
                    <p>No vehicles available</p>
                </div>
            )}
        </div>
    );
}
