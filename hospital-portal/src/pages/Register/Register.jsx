import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
    const { user, registerHospital } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        city: '',
        address: '',
        contact_phone: '',
        facility_type: 'multi_specialty',
    });
    const [submitting, setSubmitting] = useState(false);

    const regions = [
        { value: 'Chennai', label: 'Chennai' },
        { value: 'Kerala', label: 'Kerala' },
        { value: 'Coimbatore', label: 'Coimbatore' },
        { value: 'Puducherry', label: 'Puducherry' },
    ];

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const result = await registerHospital(formData);
        if (result.success) {
            navigate('/dashboard');
        }
        setSubmitting(false);
    };

    return (
        <div className="register-clinic-page">
            {/* Animated Background */}
            <div className="register-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            {/* High Contrast White Card */}
            <div className="register-card">
                <div className="register-header">
                    <div className="header-icon">🏥</div>
                    <h1>Register Your Hospital</h1>
                    <p>Join the Island MedEvac network to receive patient transfers</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Hospital Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Apollo Hospitals"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="region">Region *</label>
                            <select
                                id="region"
                                name="region"
                                value={formData.region}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Region</option>
                                {regions.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="e.g., Chennai"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Full Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Complete hospital address"
                            rows="2"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contact_phone">Contact Phone *</label>
                            <input
                                type="tel"
                                id="contact_phone"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                placeholder="+91 XXXXX XXXXX"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="facility_type">Facility Type</label>
                            <select
                                id="facility_type"
                                name="facility_type"
                                value={formData.facility_type}
                                onChange={handleChange}
                            >
                                <option value="multi_specialty">Multi-Specialty</option>
                                <option value="trauma_center">Trauma Center</option>
                                <option value="general">General Hospital</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-info">
                        <span className="info-icon">ℹ️</span>
                        <p>
                            <strong>Note:</strong> Registration requires admin approval.
                            You'll be notified via email once your hospital is approved.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? 'Registering...' : '✓ Register Hospital'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Logged in as: {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default Register;
