# Workplace Surveillance Data & Privacy Policy
**DPDP Act Compliance Statement (India)**

This document details the processing, access control, and retention policy for biometric-adjacent (selfie photos) and geofencing (device location) data collected during employee check-ins at Sharmas & Iyer Associates.

---

## 1. Purpose of Collection
We collect device location coordinates (latitude and longitude) and a selfie photo during check-in for the sole purpose of verifying that the clock-in event occurred within the active office geofence and by the registered employee.

## 2. Consent Mechanism
- Under the Digital Personal Data Protection (DPDP) Act, 2023, employees must give clear, explicit, and informed consent before collection begins.
- Consent is captured via the written agreement checkbox on the check-in panel.
- Employees can revoke their consent at any time, but doing so may limit their ability to use remote/geofenced check-in features, requiring in-office attendance overrides instead.

## 3. Access Controls & Security
- **Biometric-Adjacent Data (Selfies)** and location logs are classified as highly sensitive personal data.
- **Access Restriction**: Row-Level Security (RLS) is enabled. Only the respective employee (on their own calendar) and the authorized `HR` Manager or `Partner` roles can view attendance selfies and location metrics. They are never exposed to other staff members.

## 4. Retention & Deletion Policy
- **Attendance Selfies**: Kept for a maximum period of **90 days** from the date of capture to allow payroll reconciliation and audit trails. Photos older than 90 days are automatically purged from the storage bucket.
- **Location Coordinates**: Location coordinates are resolved to distance metrics (e.g. distance from office) and deleted immediately after check-in verification is approved. Only the final distance value (e.g. "15 meters") and check-in timestamp are stored in the database.
- **Account Termination**: If an employee resigns or their contract terminates, all associated selfie files are permanently erased from all backup storage pools within **30 days** of termination.
