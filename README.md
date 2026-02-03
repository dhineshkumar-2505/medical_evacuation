# 🏥 Island Health - Emergency Transport & Medical Coordination Platform

**Island Health** is a comprehensive ecosystem designed to bridge the gap between clinics, hospitals, and emergency transport providers in island regions. It facilitates seamless patient transfers, real-time ambulance booking, and automated case management.

## 🚀 System Overview

The platform consists of 6 interconnected applications:

| Application | Path | Purpose | Port |
| :--- | :--- | :--- | :--- |
| **Clinical Portal** | `/clinical-portal` | For basic clinics to refer patients & book emergency transport. | `5173` |
| **Hospital Portal** | `/hospital-portal` | For major hospitals to accept incoming referrals & manage bed capacity. | `5174` |
| **Transport Provider** | `/transport-provider-app` | For fleet owners to manage vehicles, drivers, and bookings. | `5175` |
| **Driver App** | `/driver-app` | Mobile-first web app for ambulance drivers to receive & execute trips. | `5176` |
| **Admin Portal** | `/admin-portal` | Super-admin dashboard for platform oversight, verification & user management. | `5177` |
| **Backend API** | `/backend` | Central Node.js/Express server handling real-time logic & orchestration. | `3000` |

---

## 🛠️ Tech Stack

*   **Frontend:** React.js, Vite, Tailwind CSS / Vanilla CSS, Lucide Icons, Recharts
*   **Backend:** Node.js, Express.js, Socket.io (Real-time updates)
*   **Database:** Supabase (PostgreSQL) + Auth
*   **Maps:** Google Maps Platform (Directions, Geocoding)

---

## ⚡ Quick Start Guide

### 1. Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   Git

### 2. Installation
Install dependencies for the backend and all frontend portals.

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies (repeat for all portals)
cd clinical-portal && npm install && cd ..
cd hospital-portal && npm install && cd ..
cd transport-provider-app && npm install && cd ..
cd driver-app && npm install && cd ..
cd admin-portal && npm install && cd ..
```

### 3. Running the Platform
It is recommended to run each service in a separate terminal window.

#### Backend (Required for Real-time features)
```bash
cd backend
npm start
```
*Runs on http://localhost:3000*

#### Portals
```bash
# Clinical Portal
cd clinical-portal
npm run dev

# Hospital Portal
cd hospital-portal
npm run dev

# Transport Provider App
cd transport-provider-app
npm run dev

# Driver App
cd driver-app
npm run dev

# Admin Portal
cd admin-portal
npm run dev
```

---

## 📂 Project Structure

```
d:\island_project33\
├── admin-portal/           # Super Admin Dashboard
├── backend/                # Central API Server
├── clinical-portal/        # Clinic Interface
├── database/               # SQL Scripts & Migrations
├── driver-app/             # Driver Mobile App
├── hospital-portal/        # Hospital Interface
├── shared-components/      # Reusable React Components (Verification Badges, etc.)
├── transport-provider-app/ # Transport Company Dashboard
└── README.md
```

## 🔐 Environment Variables
Each project folder contains a `.env` example file. Ensure you configure the following keys in your local `.env` files:
*   `VITE_SUPABASE_URL`
*   `VITE_SUPABASE_ANON_KEY`
*   `VITE_API_URL` (usually http://localhost:3000)
*   `VITE_GOOGLE_MAPS_API_KEY` (for mapping features)

---

**© 2026 Island Health Platform**
