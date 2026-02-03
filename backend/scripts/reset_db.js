import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'; // REPLACE WITH ACTUAL URL IF KNOWN, OTHERWISE RELY ON ENV
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// NOTE: Deletion usually requires SERVICE ROLE KEY for RLS bypass, 
// or the user must be an owner. 
// Since we are running this as a script, we ideally need the SERVICE_ROLE_KEY.
// If we don't have it, we can try using the anon key but RLS might block "delete all".

// However, I will write a script that attempts to delete using the provided client.
// To be effective, the user should provide the SERVICE_ROLE_KEY in the .env of the backend.

import dotenv from 'dotenv';
dotenv.config();

const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;
const apiUrl = process.env.SUPABASE_URL;

if (!serviceRoleKey || !apiUrl) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.');
    console.error('Please ensure d:/island_project33/backend/.env has these variables.');
    process.exit(1);
}

const supabase = createClient(apiUrl, serviceRoleKey);

async function resetDatabase() {
    console.log('⚠️  STARTING DATABASE RESET ⚠️');
    console.log('This will delete all data from tables: clinics, patients, vitals_logs, evacuations, etc.');

    // Order matters because of Foreign Keys
    const tables = [
        'vitals_logs',
        'evacuations',
        'patients',
        'clinics',
        // 'profiles' // Maybe keep profiles? The user said "clinics and hospitals all data". 
        // "and finalyearproject2026ddd@gmail.com this mailid only for admin"
        // If I delete profiles, I delete the admin profile too.
        // Let's delete profiles NOT matching the admin email.
    ];

    for (const table of tables) {
        console.log(`Deleting from ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        if (error) {
            console.error(`Failed to delete ${table}:`, error.message);
        } else {
            console.log(`✅ Cleared ${table}`);
        }
    }

    // Special handling for profiles
    console.log('Cleaning up profiles (Keeping Admin)...');
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .neq('email', 'finalyearproject2026ddd@gmail.com');

    if (profileError) {
        console.error('Failed to cleanup profiles:', profileError.message);
    } else {
        console.log('✅ Cleared non-admin profiles');
    }

    console.log('🎉 Database reset complete.');
}

resetDatabase();
