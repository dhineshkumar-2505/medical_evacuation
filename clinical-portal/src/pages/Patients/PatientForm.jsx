import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Save, X } from 'lucide-react';
import './PatientForm.css';

export default function PatientForm() {
    const navigate = useNavigate();
    const { clinic } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'male',
        blood_type: '',
        contact_number: '',
        emergency_contact: '',
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
            // Use backend API - patient_id is auto-generated on server
            const response = await api.post('/patients', {
                name: formData.name,
                age: parseInt(formData.age),
                gender: formData.gender,
                blood_type: formData.blood_type || null,
                contact_number: formData.contact_number || null,
                emergency_contact: formData.emergency_contact || null,
                clinic_id: clinic?.id,
            });

            navigate(`/patients/${response.data.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="patient-form-page">
            <div className="form-header">
                <div className="form-header-icon">
                    <UserPlus />
                </div>
                <div>
                    <h1 className="form-title">Register New Patient</h1>
                    <p className="form-subtitle">Enter patient details to create a new record</p>
                </div>
            </div>

            <form className="patient-form" onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter patient name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="age">Age *</label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                required
                                min="0"
                                max="150"
                                placeholder="Age in years"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="gender">Gender *</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="blood_type">Blood Type</label>
                            <select
                                id="blood_type"
                                name="blood_type"
                                value={formData.blood_type}
                                onChange={handleChange}
                            >
                                <option value="">Unknown</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">Contact Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="contact_number">Phone Number</label>
                            <input
                                type="tel"
                                id="contact_number"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                placeholder="Patient contact"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="emergency_contact">Emergency Contact</label>
                            <input
                                type="tel"
                                id="emergency_contact"
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleChange}
                                placeholder="Emergency contact number"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/patients')}>
                        <X size={18} />
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <div className="spinner"></div> : <Save size={18} />}
                        {loading ? 'Saving...' : 'Register Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}
