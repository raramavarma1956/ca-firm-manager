# Varma Raja & Associates - Indiranagar Office Setup Guide

This guide describes how to install the CA Practice Manager application on the computer in the **Indiranagar Office**, configure it under the name **Varma Raja & Associates** for live testing with real employees, and ensure its database is completely isolated so that no testing actions affect the master development copy on this computer.

---

## 1. Ensuring Database Isolation

To prevent any testing activities in the Indiranagar Office from modifying or affecting the master copy database on this computer, choose one of the following two isolated setups:

### Option A: Standalone Local Storage Mode (Recommended for Single-Computer Testing)
If all testing is conducted on a single computer at the Indiranagar Office, you do **not** need a backend cloud database:
1. Leave the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables **blank** (or omit them) in the `.env` file of the Indiranagar computer.
2. The application will automatically run in **Local Standalone Mode**.
3. All employee profiles, check-ins, timesheets, and payroll logs will be stored securely inside that specific browser's local database (`localStorage`).
4. This keeps the data 100% contained within that computer and has zero network dependency or connection to the master database.

### Option B: Isolated Supabase Project (Recommended for Multi-Device Live Testing)
If real employees need to check in using their own mobile phones or other devices, they will need a shared database.
1. Sign up for a free account at [Supabase](https://supabase.com/).
2. Create a new project (e.g., `Varma Raja & Associates - Live Testing`).
3. Under the SQL Editor in your new Supabase dashboard, click "New Query", paste the content of the `supabase_schema.sql` file (found at the root of the project folder), and run it. This sets up the isolated tables and security policies.
4. Go to **Project Settings -> API** in the Supabase Dashboard and copy the Project URL and Anon Key.
5. Place these values in the `.env` file on the Indiranagar computer:
   ```env
   VITE_SUPABASE_URL=https://your-new-indiranagar-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. This connects the Indiranagar app to its own isolated database, keeping it completely separated from the developer's database.

---

## 2. Step-by-Step Installation on the Indiranagar Computer

Follow these steps to deploy and run the app on the target machine:

### Step 1: Install Node.js
1. Download and install **Node.js LTS** (version 18 or above) from the official website: [nodejs.org](https://nodejs.org/).
2. Keep the default settings during installation.

### Step 2: Transfer the Application Files
1. Copy the entire project folder from this computer to a USB drive or upload it to a private shared folder.
2. **Note**: Do *not* copy the `node_modules` folder (if it exists) to save transfer time. The startup script will install dependencies automatically.
3. Paste the project folder onto the hard drive of the Indiranagar computer (e.g., `C:\CA-Firm-Manager`).

### Step 3: Configure Branding for Varma Raja & Associates
1. Inside the application folder on the Indiranagar computer, check if a file named `.env` exists. If it does not, copy and rename `.env.example` to `.env`.
2. Open `.env` in a text editor (like Notepad) and add or update the following lines:
   ```env
   # CA Firm Customization
   VITE_FIRM_NAME="Varma Raja & Associates"
   VITE_FIRM_ADDRESS="Indiranagar, Bangalore, Karnataka - 560038"
   ```
3. Save and close the file. The app will now automatically boot with the Varma Raja & Associates branding on the login portal, dashboards, and printable payslips.

### Step 4: Run the Application
1. Double-click the file named `start-app.bat` in the application folder.
2. The batch script will:
   - Check if dependencies are installed (and automatically run `npm install` if they are missing).
   - Start the local development web server.
   - Automatically open the application in the default web browser at `http://localhost:5173/`.
3. The app is now ready for live testing!

---

## 3. Live Employee Testing & Login

To onboard real employees for testing:
1. **HR/Partner Login**: On first boot, log in using the pre-seeded admin account credentials:
   - **HR Email**: `neha@cafirm.com`
   - **Partner Email**: `rajesh@cafirm.com`
   - **Password**: `password123` (OTP: `123456`)
2. **Staff Onboarding**: Staff can open the login screen, click "Sign Up / Onboard", enter their details, and select their branch.
3. **HR Approval**: Log back in as HR Manager or Partner, navigate to the **Employee Directory / Onboarding** tab, and approve the pending registrations to allow staff to log in and start tracking attendance/timesheets.
