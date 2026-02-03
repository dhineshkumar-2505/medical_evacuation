-- Enable Row Level Security (RLS) is generally good, but for now we will keep it simple for prototyping
-- We will enable RLS later.

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'clinic_doctor', 'transport_pilot', 'hospital_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Clinics (The Island/Mountain Nodes)
CREATE TABLE public.clinics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    region_type TEXT CHECK (region_type IN ('island', 'mountain')),
    location_name TEXT NOT NULL, -- e.g., "Havelock Island", "Kodaikanal"
    facility_level TEXT CHECK (facility_level IN ('basic', 'intermediate', 'advanced')),
    status TEXT DEFAULT 'pending_approval', -- pending_approval, active, suspended
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Patients (The Core Entity)
CREATE TABLE public.patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id),
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    admission_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    condition_summary TEXT,
    evacuation_readiness_status TEXT DEFAULT 'stable', -- stable, observe, prepare_evac, immediate_evac
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Vitals Logs (Time-Series Data)
CREATE TABLE public.vitals_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    heart_rate INTEGER,
    spo2 INTEGER, -- Blood Oxygen %
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    temperature_c DECIMAL(4,1),
    respiratory_rate INTEGER,
    consciousness_level TEXT, -- Alert, Voice, Pain, Unresponsive (AVPU)
    notes TEXT
);

-- 5. Transport Providers (Ships/Helis)
CREATE TABLE public.transport_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('helicopter', 'boat', 'ambulance', 'flight')),
    base_location TEXT,
    status TEXT DEFAULT 'active',
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Transport Routes & Availability
CREATE TABLE public.transport_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.transport_providers(id),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- available, weather_delay, maintenance, in_transit
    next_departure TIMESTAMP WITH TIME ZONE,
    capacity_remaining INTEGER,
    estimated_transit_time_minutes INTEGER
);

-- 7. Evacuation Requests
CREATE TABLE public.evacuations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id),
    origin_clinic_id UUID REFERENCES public.clinics(id),
    transport_route_id UUID REFERENCES public.transport_routes(id),
    target_hospital_name TEXT,
    status TEXT DEFAULT 'requested', -- requested, approved, in_transit, completed
    marketing_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completion_time TIMESTAMP WITH TIME ZONE
);

-- Set up Realtime for these tables
alter publication supabase_realtime add table public.clinics;
alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.vitals_logs;
alter publication supabase_realtime add table public.transport_routes;
alter publication supabase_realtime add table public.evacuations;
