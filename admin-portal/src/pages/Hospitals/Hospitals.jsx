import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import './Hospitals.css';

const Hospitals = () => {
    const [hospitals, setHospitals] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHospitals();
    }, [activeTab]);

    const fetchHospitals = async () => {
        setLoading(true);
        const statusFilter = activeTab === 'pending' ? 'pending_approval' : 'active';
        console.log('Fetching hospitals with status:', statusFilter);

        try {
            const { data, error } = await supabase
                .from('hospitals')
                .select('*')
                .eq('status', statusFilter)
                .order('created_at', { ascending: false });

            console.log('Hospitals query result:', { data, error });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            setHospitals(data || []);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            toast.error('Failed to load hospitals: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (hospital) => {
        try {
            const { error } = await supabase
                .from('hospitals')
                .update({ status: 'active' })
                .eq('id', hospital.id);

            if (error) throw error;

            // Update user role if admin_id exists
            if (hospital.admin_id) {
                await supabase
                    .from('profiles')
                    .update({ role: 'hospital_admin' })
                    .eq('id', hospital.admin_id);
            }

            toast.success(`${hospital.name} approved!`);
            fetchHospitals();
        } catch (error) {
            console.error('Error approving hospital:', error);
            toast.error('Failed to approve hospital');
        }
    };

    const handleReject = async (hospital) => {
        if (!window.confirm(`Reject ${hospital.name}?`)) return;

        try {
            const { error } = await supabase
                .from('hospitals')
                .update({ status: 'suspended' })
                .eq('id', hospital.id);

            if (error) throw error;

            toast.success(`${hospital.name} rejected`);
            fetchHospitals();
        } catch (error) {
            console.error('Error rejecting hospital:', error);
            toast.error('Failed to reject hospital');
        }
    };

    return (
        <div className="hospitals-page">
            <div className="page-header">
                <h1>🏥 Hospital Management</h1>
                <p>Approve or reject hospital registrations</p>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Approval
                </button>
                <button
                    className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active Hospitals
                </button>
            </div>

            <div className="hospitals-grid">
                {loading ? (
                    <div className="loading">Loading hospitals...</div>
                ) : hospitals.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <p>No {activeTab === 'pending' ? 'pending' : 'active'} hospitals</p>
                    </div>
                ) : (
                    hospitals.map((hospital) => (
                        <div key={hospital.id} className="hospital-card">
                            <div className="card-header">
                                <h3>{hospital.name}</h3>
                                <span className={`status-badge ${hospital.status}`}>
                                    {hospital.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="label">Region:</span>
                                    <span className="value">{hospital.region}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">City:</span>
                                    <span className="value">{hospital.city || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Contact:</span>
                                    <span className="value">{hospital.contact_phone || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Admin:</span>
                                    <span className="value">{hospital.admin_email || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Type:</span>
                                    <span className="value">{hospital.facility_type?.replace('_', ' ') || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Registered:</span>
                                    <span className="value">
                                        {new Date(hospital.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {activeTab === 'pending' && (
                                <div className="card-actions">
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleApprove(hospital)}
                                    >
                                        ✅ Approve
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleReject(hospital)}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Hospitals;
