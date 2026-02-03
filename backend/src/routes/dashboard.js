import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { clinicAuth } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/dashboard/stats - Get clinic-specific dashboard statistics
router.get('/stats', clinicAuth, async (req, res) => {
    try {
        // 1. Total Patients for this clinic
        const { count: totalPatients } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', req.clinicId);

        // 2. Today's Vitals for this clinic
        const today = new Date().toISOString().split('T')[0];

        // We need to join with patients to filter by clinic_id
        // or just query vitals_logs where recorded_by's clinic matches?
        // Let's join with patients to be sure
        const { count: todayVitals } = await supabase
            .from('vitals_logs')
            .select('id, patient:patients!inner(clinic_id)', { count: 'exact', head: true })
            .eq('patient.clinic_id', req.clinicId)
            .gte('recorded_at', today);

        // 3. Active Evacuations for this clinic
        const { count: notifications } = await supabase
            .from('evacuations')
            .select('*', { count: 'exact', head: true })
            .eq('origin_clinic_id', req.clinicId)
            .eq('status', 'in_transit');

        // 4. Recent Patients
        const { data: recentPatients } = await supabase
            .from('patients')
            .select('*')
            .eq('clinic_id', req.clinicId)
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            stats: {
                totalPatients: totalPatients || 0,
                todayVitals: todayVitals || 0,
                evacuations: notifications || 0
            },
            recentPatients: recentPatients || []
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
