import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// ============================================================================
// GET /api/critical/hospitals/:region - Get all active hospitals in a region
// ============================================================================
router.get('/hospitals/:region', async (req, res) => {
    try {
        const { region } = req.params;

        const { data, error } = await supabase
            .from('hospitals')
            .select('id, name, city, facility_type, contact_phone')
            .eq('region', region)
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        res.json({ success: true, hospitals: data || [] });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// GET /api/critical/nearby/:clinicId - Get hospitals in the clinic's target region
// ============================================================================
router.get('/nearby/:clinicId', async (req, res) => {
    try {
        const { clinicId } = req.params;

        // 1. Get clinic's region
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .select('id, name, region')
            .eq('id', clinicId)
            .single();

        if (clinicError) throw clinicError;

        // 2. Get target region from mapping
        const { data: mapping } = await supabase
            .from('region_mappings')
            .select('target_region')
            .eq('origin_region', clinic.region)
            .single();

        // If no mapping, use same region
        const targetRegion = mapping?.target_region || clinic.region;

        // 3. Get all active hospitals in target region
        const { data: hospitals, error: hospError } = await supabase
            .from('hospitals')
            .select('id, name, city, facility_type, contact_phone, region')
            .eq('region', targetRegion)
            .eq('status', 'active')
            .order('name');

        if (hospError) throw hospError;

        res.json({
            success: true,
            clinic: clinic,
            targetRegion: targetRegion,
            hospitals: hospitals || []
        });
    } catch (error) {
        console.error('Error fetching nearby hospitals:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// POST /api/critical/share - Share critical patient to selected hospital
// ============================================================================
router.post('/share', async (req, res) => {
    try {
        const { patient_id, clinic_id, hospital_id, notes } = req.body;
        const io = req.io; // Injected via middleware

        if (!patient_id || !clinic_id || !hospital_id) {
            return res.status(400).json({
                success: false,
                error: 'patient_id, clinic_id, and hospital_id are required'
            });
        }

        // 1. Check if an active (non-acknowledged) case already exists
        const { data: existingCase } = await supabase
            .from('critical_cases')
            .select('id, status, target_hospital_id')
            .eq('patient_id', patient_id)
            .eq('status', 'shared')
            .single();

        if (existingCase) {
            return res.json({
                success: true,
                message: 'Case already shared and awaiting acknowledgement',
                case: existingCase,
                isExisting: true
            });
        }

        // 2. Mark patient as critical
        await supabase
            .from('patients')
            .update({ is_critical: true })
            .eq('id', patient_id);

        // 3. Create critical case record
        const { data: newCase, error: createError } = await supabase
            .from('critical_cases')
            .insert({
                patient_id,
                clinic_id,
                target_hospital_id: hospital_id,
                notes: notes || null,
                status: 'shared',
                shared_at: new Date().toISOString()
            })
            .select(`
                *,
                patient:patients(id, name, patient_id, age, gender, blood_type),
                clinic:clinics(id, name, region),
                hospital:hospitals(id, name, city)
            `)
            .single();

        if (createError) throw createError;

        console.log(`✅ Critical case shared: Patient ${patient_id} → Hospital ${hospital_id}`);
        console.log(`   Case ID: ${newCase.id}, Status: ${newCase.status}`);

        // 4. Emit real-time event to hospital
        if (io) {
            io.to(`hospital-${hospital_id}`).emit('critical:new', newCase);
            console.log(`📡 Emitted critical:new to hospital-${hospital_id}`);
        }

        res.json({
            success: true,
            message: 'Critical case shared successfully',
            case: newCase,
            isExisting: false
        });
    } catch (error) {
        console.error('Error sharing critical case:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// POST /api/critical/acknowledge/:id - Hospital acknowledges receipt
// ============================================================================
router.post('/acknowledge/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hospital_id } = req.body;
        const io = req.io;

        // 1. Get the case
        const { data: criticalCase, error: fetchError } = await supabase
            .from('critical_cases')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !criticalCase) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        // 2. Validate hospital ownership
        if (hospital_id && criticalCase.target_hospital_id !== hospital_id) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to acknowledge this case'
            });
        }

        // 3. Check if already acknowledged
        if (criticalCase.status === 'acknowledged') {
            return res.json({
                success: true,
                message: 'Case already acknowledged',
                case: criticalCase
            });
        }

        // 4. Update status
        const { data: updatedCase, error: updateError } = await supabase
            .from('critical_cases')
            .update({
                status: 'acknowledged',
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 5. Emit event to clinic
        if (io) {
            io.to(`clinic-${criticalCase.clinic_id}`).emit('critical:acknowledged', updatedCase);
            console.log(`📡 Emitted critical:acknowledged to clinic-${criticalCase.clinic_id}`);
        }

        res.json({
            success: true,
            message: 'Case acknowledged successfully',
            case: updatedCase
        });
    } catch (error) {
        console.error('Error acknowledging case:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// GET /api/critical/hospital/:hospitalId - Get cases for a hospital
// ============================================================================
router.get('/hospital/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { status } = req.query;

        let query = supabase
            .from('critical_cases')
            .select(`
                *,
                patient:patients(id, name, patient_id, age, gender, blood_type, is_critical),
                clinic:clinics(id, name, region)
            `)
            .eq('target_hospital_id', hospitalId)
            .order('shared_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log(`📋 Fetched ${data?.length || 0} critical cases for Hospital ${hospitalId}`);

        res.json({ success: true, cases: data || [] });
    } catch (error) {
        console.error('Error fetching hospital cases:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// GET /api/critical/clinic/:clinicId - Get cases shared by a clinic
// ============================================================================
router.get('/clinic/:clinicId', async (req, res) => {
    try {
        const { clinicId } = req.params;

        const { data, error } = await supabase
            .from('critical_cases')
            .select(`
                *,
                patient:patients(id, name, patient_id, age, gender),
                hospital:hospitals(id, name, city, region)
            `)
            .eq('clinic_id', clinicId)
            .order('shared_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, cases: data || [] });
    } catch (error) {
        console.error('Error fetching clinic cases:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// GET /api/critical/patient/:patientId/vitals - Get all vitals history for graphs
// ============================================================================
router.get('/patient/:patientId/vitals', async (req, res) => {
    try {
        const { patientId } = req.params;

        const { data, error } = await supabase
            .from('vitals_logs')
            .select('*')
            .eq('patient_id', patientId)
            .order('recorded_at', { ascending: true });

        if (error) throw error;

        res.json({ success: true, vitals: data || [] });
    } catch (error) {
        console.error('Error fetching vitals:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// GET /api/critical/patient/:patientId - Get full patient details for hospital view
// ============================================================================
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;

        // Get patient
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single();

        if (patientError) throw patientError;

        // Get all vitals for history graphs
        const { data: vitals, error: vitalsError } = await supabase
            .from('vitals_logs')
            .select('*')
            .eq('patient_id', patientId)
            .order('recorded_at', { ascending: true });

        if (vitalsError) throw vitalsError;

        // Get medical history
        const { data: history } = await supabase
            .from('medical_history')
            .select('*')
            .eq('patient_id', patientId);

        res.json({
            success: true,
            patient,
            vitals: vitals || [],
            medicalHistory: history || []
        });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
