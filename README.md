# Varma Raja & Associates, Bangalore
### CA Firm Staff & Practice Manager

A progressive, high-fidelity web application built for **Varma Raja & Associates, Bangalore** to manage staff attendance (with selfie/GPS checks), leave requests, weekly timesheets, Indian statutory payroll, client billings, realization ratios, and secure partner audit trails.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fraramavarma1956%2Fca-firm-manager)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/raramavarma1956/ca-firm-manager)

---

## 🚀 1. Demo App Installation (Local Setup)

Follow these steps to run the application on your computer:

### Prerequisites
- Make sure you have **Node.js** (v18 or higher) installed. Download it from [nodejs.org](https://nodejs.org/).

### Installation Steps
1. Open your terminal or command prompt (PowerShell / cmd).
2. Navigate to the project directory:
   ```bash
   cd C:\Users\raram\.gemini\antigravity-ide\scratch\ca-firm-manager
   ```
3. Install the project dependencies:
   ```bash
   npm install
   ```
4. Start the local Vite development server:
   ```bash
   npm run dev
   ```
5. Open your web browser and navigate to the address shown in the terminal (usually `http://localhost:5173`).

---

## 🔑 2. Initial Administrator Profiles (Pre-seeded)

For immediate demo testing, the database is pre-seeded with two administrator profiles (HR & Partner). You can use these to set up subsequent profiles.

*   **HR Manager (Neha Sharma)**
    *   **Email:** `neha@cafirm.com`
    *   **Password:** `password123`
    *   **2FA OTP:** `123456`
*   **Managing Partner (Rajesh Iyer)**
    *   **Email:** `rajesh@cafirm.com`
    *   **Password:** `password123`
    *   **2FA OTP:** `123456`

---

## 👥 3. Profile Setup Guide

### Setting up a New Administrator Profile
1. Log in to the application as one of the pre-seeded administrators (e.g., HR Manager `neha@cafirm.com`).
2. Enter the simulated 2FA code `123456` when prompted.
3. Click on the **Staff Directory** tab in the left-hand menu.
4. Click the blue **+ Add New Employee** button in the upper right.
5. Fill in the name and email.
6. In the **Firm Role** dropdown:
   - Select **HR** (HR Manager) or **Partner** to make them an Administrator.
7. Fill in their monthly salary and hourly billing rate.
8. Check the **Enforce 2-Factor Authentication** checkbox to enable secure OTP logins for this administrator.
9. Click **Save Profile**.

### Setting up an Employee Profile
There are two ways to add employees to the firm:

#### Option A: Direct Administrator Creation
1. Log in as an Administrator (e.g., HR Manager).
2. Go to **Staff Directory** -> **+ Add New Employee**.
3. Under **Firm Role**, select **Employee**.
4. Under **Division Allocation**, select either **Audit Division** or **Taxation Division**.
5. Input their starting basic monthly salary, hourly billing cost, and initial leave balances.
6. Click **Save Profile**. The employee can immediately log in.

#### Option B: Employee Self-Onboarding (Mobile App Flow)
1. On the Login page, click **Apply as Employee (Self-Onboard)** at the bottom.
2. The employee enters their Name, Email, preferred Division (Audit vs. Taxation), and Password, and clicks **Apply for Onboarding**.
3. Sign-in will be blocked for this account until an administrator approves it.
4. An Administrator logs in, clicks the **Onboarding Approvals** tab (indicated by a badge), inputs the employee's Monthly Salary and Hourly Rate, and clicks **Approve**.
5. The employee is now active and added to the monthly payroll engine.

---

## 📱 4. PWA Integration (Installing on Mobiles)

Since the app is built as a Progressive Web App (PWA), you can install it on smartphones to run as a full-screen, offline-capable application without going through the App Store or Google Play Store.

### Requirements
- Your computer running the local server and your mobile device must be connected to the **same Wi-Fi network**.
- Identify your computer's local IP address (e.g., `192.168.1.15`).
- Access the app on your mobile device using the URL: `http://<YOUR_LOCAL_IP>:5173` (e.g., `http://192.168.1.15:5173`).

---

### 🤖 Installing on Android Mobiles (Google Chrome)

1. Open **Google Chrome** on your Android device.
2. Enter the mobile network URL of the application.
3. A banner prompt **"Add to Home Screen"** or **"Install App"** will pop up at the bottom of the screen. Tap it.
4. If you do not see the banner:
   - Tap the **three-dot menu button** in the top right corner of Chrome.
   - Tap **Install app** or **Add to Home screen**.
5. Click **Install** in the confirmation box.
6. The app will appear on your device's home screen as a native icon. Tap it to launch in fullscreen mode.

---

### 🍏 Installing on iOS Mobiles / iPhones (Apple Safari)

*Note: PWAs on iOS must be installed using Apple's default Safari browser.*

1. Run `start-app.bat` on your computer. It automatically detects and displays your computer's local network URL (e.g., `http://192.168.1.15:5173/`).
2. Ensure your iPhone is connected to the **same Wi-Fi network**.
3. Open **Safari** on your iPhone and visit the mobile URL.
4. An on-screen banner with an **"Install CA Practice on iPhone"** prompt will appear.
5. Tap the **Share button** at the bottom of the screen (square icon with an arrow pointing upwards `⎋`).
6. Scroll down the share sheet options and tap **Add to Home Screen** (`⊞`).
7. Confirm the name and tap **Add** in the top right corner.
8. The CA Practice icon will now appear on your iPhone's home screen. Open it to launch the app in full-screen standalone mode.

#### 📸 Taking Selfie Check-Ins on iPhone:
- On iPhone, tap **"Open iPhone Camera"** or **"Take Selfie with Camera"** in the check-in panel.
- iOS Safari will natively open your iPhone's front-facing camera.
- Snap your selfie and tap **Use Photo**. The app crops, verifies, and attaches your security portrait to today's attendance record!
- Tap **☰ Menu** in the top left to open the slide-out navigation drawer at any time.

## ✈️ 5. Offsite Client Audits & Client Premises Check-In

When employees are sent off-site for audits at client offices:
1. **Client Site Check-In Mode:** Employees toggle the check-in type to "Client Site Audit" in their check-in modal. This bypasses the office radius check and prompts them to select the audit client location.
2. **HR Review & Approval:** Client-site check-ins are flagged as "Pending Approval" with a distinct "On-Site Audit" badge and the selected client's name on the HR Dashboard. HR/Partners can manually review coordinates and approve check-ins.
3. **Remote Network Access:** 
   - **Private VPN (Tailscale):** Set up Tailscale VPN on the hosting PC and mobile devices. Staff can log in using the host machine's private Tailscale IP (e.g., `http://100.12.34.56:5173`) over 4G/5G mobile internet.
   - **Public Cloud Hosting:** Connect the app to a remote Supabase instance (using the `.env` template) and deploy the frontend publicly to Vercel/Netlify for global HTTP/HTTPS access.

