======================================================================
CA PRACTICE SUITE & STAFF REGISTRY MANAGER - README
======================================================================

Overview:
---------
CA Practice Suite & Staff Registry Manager is a standalone, installable 
Progressive Web Application (PWA) designed for CA Firm administration. 
It covers time-tracking, client/engagement management, GPS geofencing,
biometric-adjacent verification consent, statutory deductions configuration, 
tamper-proof system audit trails, resource utilization analytics, and cloud 
backup logs.

This version supports multiple branch locations, editable CA Firm name and 
address fields, and separate role delegation (Partner in Charge and HR 
Administrator) per branch location.


Project Structure:
------------------
- /src/components/        - User interface dashboards & registers.
- /src/context/           - Context state, seed profiles, and database logic.
- /public/                - Service worker (sw.js), manifest, icons.
- /supabase_schema.sql    - Supabase database schema and RLS policies.
- /SURVEILLANCE_POLICY.md - Workplace surveillance data retention policies.
- /start-app.bat          - Startup and automated installation script.


How to Run the Application:
---------------------------
1. Navigate to the project root directory.
2. Double-click the start-app.bat file. 
   - This automatically checks for "node_modules". If missing, it installs all dependencies automatically.
   - It spins up the Vite development server in a background shell.
   - It waits 3 seconds and automatically opens http://localhost:5173/ in your default browser.
3. Alternately, run manually in terminal:
   - npm install (if dependencies are not yet installed)
   - npm run dev
   - Open http://localhost:5173/ in your web browser.


Default Login Credentials:
--------------------------
1. HR Manager (2FA OTP required):
   - Email: neha@cafirm.com
   - Password: password123
   - OTP Code: 123456

2. Managing Partner (2FA OTP required):
   - Email: rajesh@cafirm.com
   - Password: password123
   - OTP Code: 123456

3. Staff Employee (no OTP bypass):
   - Email: arjun@cafirm.com
   - Password: password123


Features Implemented:
--------------------
- Editable Firm Profile: Modify CA Firm Name and Head Office Address.
- Multi-Branch locations: Configure multiple branch locations with distinct addresses.
- Role Separation per Branch: Set a Partner in Charge (Partner role) and an HR Administrator (HR/Partner role) for each branch (both roles can overlap on the same person if needed, but are configured separately).
- Division Allocation: Team divisions are mapped to:
  - "Audit & Assurance Services"
  - "Other Professional Services"
- Tamper-proof Audit Trails: RLS-blocked, filterable logs with CSV exports.
- Cloud Backup Manager: Automated and manual backups to Dropbox and Google Drive.
- Client Master & Templates: Structured GSTIN registry and engagement type lists.
- Timesheets & Resource Utilization: Chargeable and total hours analytics.
- Statutory Deductions: Interactive Professional Tax (PT) slab grids and verification warnings.
- DPDP Act Surveillance compliance: Attendance check-in consent checkpoints.
- Service Worker offline capability: Stale-while-revalidate and network-first dynamic caching.


PWA Verification & Mobile Device Testing:
-----------------------------------------
1. Open the application in Google Chrome or Microsoft Edge.
2. Open Developer Tools (F12).
3. Navigate to the "Application" tab.
4. Verify the "Manifest" configuration and that "Service Workers" sw.js is active.
5. In the Service Workers panel, check "Offline", refresh the page, and confirm the check-in screen functions.
6. Install by clicking the install icon in the address bar.

Mobile Testing (Android & iOS) on Local Network:
- Make sure phone and PC are connected to the same Wi-Fi.
- Run start-app.bat to expose the host on your local network.
- Access http://192.168.0.114:5173/ on your device.

Fixing "Not Secure" / Service Worker Block on Mobile:
Service workers require HTTPS to install. Use one of these methods to bypass:
Method A (Android & iOS - localtunnel):
  1. With start-app.bat running, open a new cmd prompt and run:
     npx localtunnel --port 5173
  2. Open the secure https:// URL outputted on your Android/iOS browser.

Method B (Android only - Chrome Flags):
  1. Open Chrome on Android, go to: chrome://flags/#unsafely-treat-insecure-origin-as-secure
  2. Enable the flag and add: http://192.168.0.114:5173
  3. Relaunch Chrome.

Method C (Android only - USB Port Forwarding):
  1. Connect Android to PC via USB with USB Debugging enabled.
  2. Open chrome://inspect/#devices on your PC Chrome browser.
  3. Click "Port forwarding...", add port 5173 mapped to localhost:5173, and check enable.
  4. Open http://localhost:5173/ on your Android device Chrome browser.


Backup to GitHub:
-----------------
Once Git is installed on your machine, run these commands in a shell inside this folder:
1. git init
2. git add .
3. git commit -m "Initialize CA Firm Staff and Practice Manager v1.0"
4. git remote add origin https://github.com/<your-username>/ca-firm-manager.git
5. git branch -M main
6. git push -u origin main

Offsite Client Audit / Client Premises Check-In:
------------------------------------------------
When employees are deputed offsite for client audits:
1. Offline Mode: The PWA loads offline via Service Worker, and all attendance logs are written locally on the device (using localStorage).
2. Geofencing Override: If "Restrict check-in to office location" is enabled in settings, offsite check-ins will trigger an "Out of Bounds" block.
3. Solutions for Offsite Staff:
   - Option A: HR toggles off "Restrict check-in to office location" in settings; coordinates are still tracked but not restricted.
   - Option B: Staff records hours on timesheets, and HR approves regularization manually.
======================================================================
