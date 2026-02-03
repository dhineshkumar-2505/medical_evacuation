import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, MapPin, Phone, Save } from 'lucide-react';
import './RegisterClinic.css';

export default function RegisterClinic() {
    const { refreshClinic } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        location_name: '',
        region_type: 'island',
        facility_level: 'basic',
        contact_phone: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use backend API instead of direct Supabase
            await api.post('/clinics', {
                name: formData.name,
                location_name: formData.location_name,
                region_type: formData.region_type,
                facility_level: formData.facility_level,
                contact_phone: formData.contact_phone,
            });

            // Refresh clinic data in context
            await refreshClinic();
            navigate('/pending');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const locations = {
        island: ['Havelock Island', 'Neil Island', 'Port Blair', 'Kavaratti', 'Minicoy', 'Agatti'],
        mountain: ['Ooty', 'Kodaikanal', 'Coonoor', 'Munnar', 'Yercaud'],
    };

    return (
        <div className="register-clinic-page">
            <div className="register-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <div className="register-card">
                <div className="register-header">
                    <div className="register-icon">
                        <Building2 size={32} />
                    </div>
                    <h1>Register Your Clinic</h1>
                    <p>Complete your clinic registration to access the Clinical Portal</p>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">
                            <Building2 size={16} />
                            Clinic Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Havelock Primary Health Center"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="region_type">Region Type *</label>
                            <select
                                id="region_type"
                                name="region_type"
                                value={formData.region_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="island">🏝️ Island</option>
                                <option value="mountain">⛰️ Mountain</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="location_name">
                                <MapPin size={16} />
                                Location *
                            </label>
                            <select
                                id="location_name"
                                name="location_name"
                                value={formData.location_name}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Location</option>
                                {locations[formData.region_type].map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="facility_level">Facility Level *</label>
                            <select
                                id="facility_level"
                                name="facility_level"
                                value={formData.facility_level}
                                onChange={handleChange}
                                required
                            >
                                <option value="basic">Basic (First Aid, Consultations)</option>
                                <option value="intermediate">Intermediate (Minor Procedures)</option>
                                <option value="advanced">Advanced (Surgery Capable)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_phone">
                                <Phone size={16} />
                                Contact Phone *
                            </label>
                            <input
                                type="tel"
                                id="contact_phone"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                required
                                placeholder="+91 9876543210"
                            />
                        </div>
                    </div>

                    <div className="form-info">
                        <p>
                            <strong>Note:</strong> Your registration will be reviewed by the Central Command.
                            You will be notified once approved.
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? <div className="spinner"></div> : <Save size={20} />}
                        {loading ? 'Submitting...' : 'Submit Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
}
