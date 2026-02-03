# System Setup & Credential Guide

Follow these steps exactly to set up the cloud infrastructure. We are using **Supabase** because it gives us Database, Authentication (including Google Login), and Real-time updates in one package.

## Part 1: Create Supabase Project
1.  Go to [database.new](https://database.new) (redirects to Supabase).
2.  Sign in with your GitHub account.
3.  Click **"New Project"**.
4.  **Form Details**:
    *   **Name**: `Island-Rescue-Platform`
    *   **Database Password**: Generate a strong password and **SAVE IT** safely. You cannot recover it.
    *   **Region**: `South Asia (Mumbai)` (Important for low latency in India).
    *   **Pricing Plan**: Select `Free` ($0/month).
5.  Click **"Create New Project"**. Setup takes about 2 minutes.

## Part 2: Get API Keys
Measurements needed for our app to talk to the cloud.

1.  Once the project is ready, go to **Project Settings** (Gear icon at the bottom of the left sidebar).
2.  Click on **API**.
3.  You will see `Project URL` and `Project API keys`.
4.  **Copy these two values** and paste them in the chat for me (or save them to a `.env` file):
    *   **Project URL**: (e.g., `https://xyzxyz.supabase.co`)
    *   **anon public**: (This is the public API key).

## Part 3: Setup Google Login (Authentication)
We will use Supabase's built-in Google Auth helper.

1.  In Supabase Dashboard, go to **Authentication** (Icon looks like Users).
2.  Click **Providers** in the sidebar.
3.  Find **Google** and click "Enable".
4.  You will verify the "Redirect URL" is present (usually `https://<your-project-id>.supabase.co/auth/v1/callback`). **Copy this URL.**

### 3a. Get Google Credentials (GCP)
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (Name: `Island-Rescue-Auth`).
3.  Go to **APIs & Services** -> **OAuth consent screen**.
    *   Select **External** -> Create.
    *   App Name: `Island Rescue`.
    *   Support Email: Your email.
    *   Developer Contact Info: Your email.
    *   Click "Save and Continue" (skip scopes for now).
4.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
    *   Application Type: **Web application**.
    *   Name: `Supabase Auth`.
    *   **Authorized redirect URIs**: PASTE the URL you copied from Supabase in Step 3.
5.  Click **Create**.
6.  Copy the **Client ID** and **Client Secret**.

### 3b. Finalize in Supabase
1.  Go back to Supabase -> Authentication -> Providers -> Google.
2.  Paste the **Client ID** and **Client Secret**.
3.  Click **Save**.

## Part 4: Initialize Database (One-Click Setup)
I have prepared the SQL code to build your entire database instantly.

1.  In Supabase, go to the **SQL Editor** (Icon looks like a terminal `>_`).
2.  Click **"New Query"**.
3.  Copy the content from the file `database/schema.sql` (which I have created in your project folder).
4.  Paste it into the SQL Editor.
5.  Click **Run** (bottom right).

---

## Summary of Keys I Need from You
Once you are done, please provide:
1.  **Supabase Project URL**
2.  **Supabase Anon Key**

(You don't need to share the Google Client ID/Secret with me, as long as you put them into Supabase).
