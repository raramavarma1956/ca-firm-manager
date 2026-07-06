import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const AppContext = createContext(null);

// Initialize Supabase if keys are available
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper: Format date in IST
export const getISTDateString = (dateObj = new Date()) => {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(dateObj);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
};

export const getISTTimeString = (dateObj = new Date()) => {
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return new Intl.DateTimeFormat('en-IN', options).format(dateObj);
};

export const formatIndianCurrency = (amount) => {
  const numericVal = parseFloat(amount || 0);
  return '₹' + numericVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Seed Data for Local Mock Database
const SEED_PROFILES = [
  { id: 'emp-001', email: 'arjun@cafirm.com', name: 'Arjun Mehta', role: 'Employee', division: 'Audit & Assurance Services', onboarding_status: 'Approved', monthly_salary: 44000, hourly_rate: 250, joined_date: '2025-01-10', leave_balance_casual: 5, leave_balance_sick: 4, leave_balance_earned: 10, two_factor_enabled: false, pf_number: 'PF-ARJUN-12345', esi_number: 'ESI-ARJUN-67890', branch_id: 'branch-1' },
  { id: 'emp-002', email: 'divya@cafirm.com', name: 'Divya Nair', role: 'Employee', division: 'Other Professional Services', onboarding_status: 'Approved', monthly_salary: 55000, hourly_rate: 300, joined_date: '2025-02-15', leave_balance_casual: 6, leave_balance_sick: 5, leave_balance_earned: 12, two_factor_enabled: false, pf_number: 'PF-DIVYA-12345', esi_number: 'ESI-DIVYA-67890', branch_id: 'branch-2' },
  { id: 'hr-001', email: 'neha@cafirm.com', name: 'Neha Sharma', role: 'HR', division: 'Audit & Assurance Services', onboarding_status: 'Approved', monthly_salary: 60000, hourly_rate: 350, joined_date: '2024-06-01', leave_balance_casual: 8, leave_balance_sick: 6, leave_balance_earned: 15, two_factor_enabled: true, pf_number: 'PF-NEHA-12345', esi_number: 'ESI-NEHA-67890', branch_id: 'branch-1' },
  { id: 'partner-001', email: 'rajesh@cafirm.com', name: 'Rajesh Iyer', role: 'Partner', division: 'Audit & Assurance Services', onboarding_status: 'Approved', monthly_salary: 120000, hourly_rate: 600, joined_date: '2023-01-01', leave_balance_casual: 10, leave_balance_sick: 8, leave_balance_earned: 20, two_factor_enabled: true, pf_number: 'PF-RAJESH-12345', esi_number: 'ESI-RAJESH-67890', branch_id: 'branch-1' }
];

const SEED_CLIENTS = [
  { id: 1, name: 'Acme Corp', contact: '9876543210', gstin: '27AAAAA1111A1Z1', engagement_type: 'Statutory Audit' },
  { id: 2, name: 'Beta Industries', contact: '9876543211', gstin: '27BBBBB2222B2Z2', engagement_type: 'GST Retailing' },
  { id: 3, name: 'Gamma Retail', contact: '9876543212', gstin: '27CCCCC3333C3Z3', engagement_type: 'Tax Advisory' }
];

const SEED_TEMPLATES = [
  { id: 1, title: 'Statutory Audit Engagement', description: 'Comprehensive annual books audit including verification of cash, banks, fixed assets, and statutory compliance.' },
  { id: 2, title: 'GST Monthly Return Filing', description: 'Reconciliation of GSTR-2B with purchase register, computation of output liability, and filing GSTR-1 & GSTR-3B.' },
  { id: 3, title: 'Income Tax Return Form 3CD', description: 'Preparation and filing of tax audit reports under Section 44AB of the Income Tax Act.' }
];

const SEED_ASSIGNMENTS = [
  { id: 1, client_id: 1, title: 'FY25-26 Statutory Audit', description: 'Verify books, assets and compliance.', assigned_to: 'emp-001', status: 'In Progress', due_date: '2026-07-25', bill_amount: 150000, is_completed: false },
  { id: 2, client_id: 2, title: 'June 2026 GST Return', description: 'Monthly filing GSTR-1 and GSTR-3B.', assigned_to: 'emp-002', status: 'Completed', due_date: '2026-07-10', bill_amount: 45000, is_completed: true, completed_at: '2026-06-30T17:30:00Z' },
  { id: 3, client_id: 3, title: 'FY25-26 Tax Audit', description: 'Form 3CD filing and checking tax compliance.', assigned_to: 'emp-001', status: 'Overdue', due_date: '2026-06-20', bill_amount: 90000, is_completed: false }
];

const SEED_SETTINGS = {
  id: 1,
  firm_name: 'Apex Chartered Accountants',
  firm_address: '123, Financial District, Mumbai, Maharashtra - 400001',
  office_lat: 19.0760,
  office_lng: 72.8777,
  allowed_radius: 100, // meters
  require_selfie: false,
  require_geo: false,
  pf_rate: '', // statutory fields blank by default, HR must input
  esi_rate: '',
  pt_slabs: '', // statutory slabs blank by default, HR must input
  tds_rate: '',
  google_drive_folder_id: 'CA_Firm_Google_Drive_Archive',
  dropbox_folder_path: '/CA-Firm-Records',
  attendance_late_cutoff: '10:00',
  public_holidays: JSON.stringify([
    { date: '2026-04-14', description: 'Ambedkar Jayanti', year: 2026 },
    { date: '2026-05-01', description: 'Maharashtra Day / May Day', year: 2026 },
    { date: '2026-06-18', description: 'Bakrid / Eid al-Adha', year: 2026 }
  ]),
  assignment_types: JSON.stringify(['Statutory Audit', 'GST Monthly Return', 'Tax Advisory']),
  branches: JSON.stringify([
    {
      id: 'branch-1',
      name: 'Mumbai Head Office',
      address: '123, Financial District, Mumbai, Maharashtra - 400001',
      partner_in_charge_id: 'partner-001',
      hr_administrator_id: 'hr-001'
    },
    {
      id: 'branch-2',
      name: 'Pune Branch',
      address: '456, IT Park Road, Hinjewadi, Pune, Maharashtra - 411057',
      partner_in_charge_id: 'partner-001',
      hr_administrator_id: 'partner-001'
    }
  ])
};

// Seed 20 attendance records in June 2026 to show analytics
const buildSeedAttendance = () => {
  const attendance = [];
  const employees = ['emp-001', 'emp-002'];
  
  // June 2026 has 30 days. We seed weekdays (Mon-Fri) from June 1 to June 26.
  let idCount = 1;
  for (let d = 1; d <= 26; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `2026-06-${dayStr}`;
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
    
    // Check if June 18th is holiday
    if (d === 18) {
      employees.forEach(empId => {
        attendance.push({
          id: idCount++,
          employee_id: empId,
          date: dateStr,
          check_in: null,
          check_out: null,
          worked_hours: 0,
          status: 'Holiday',
          selfie_url: null,
          latitude: null,
          longitude: null,
          distance_from_office: 0,
          approved_by_admin: true
        });
      });
      continue;
    }

    employees.forEach(empId => {
      // Arjun Mehta (emp-001) has one sick leave day on June 15
      if (empId === 'emp-001' && d === 15) {
        attendance.push({
          id: idCount++,
          employee_id: empId,
          date: dateStr,
          check_in: null,
          check_out: null,
          worked_hours: 0,
          status: 'Paid-Leave',
          selfie_url: null,
          latitude: null,
          longitude: null,
          distance_from_office: 0,
          approved_by_admin: true
        });
        return;
      }

      // Late check-ins simulated on June 5 and June 12
      const isLate = d === 5 || d === 12;
      const checkInHour = isLate ? '10:25' : '09:28';
      const checkOutHour = '18:32';

      attendance.push({
        id: idCount++,
        employee_id: empId,
        date: dateStr,
        check_in: `${dateStr}T${checkInHour}:00Z`,
        check_out: `${dateStr}T${checkOutHour}:00Z`,
        worked_hours: isLate ? 8.1 : 9.0,
        status: 'Present',
        selfie_url: '',
        latitude: 19.0761,
        longitude: 72.8778,
        distance_from_office: 15,
        approved_by_admin: true
      });
    });
  }
  return attendance;
};

// Seed timesheets for June 2026
const buildSeedTimesheets = () => {
  const timesheets = [];
  const attendances = buildSeedAttendance().filter(a => a.status === 'Present');
  let tId = 1;
  attendances.forEach(a => {
    // 4 hours against assignment 1 for Arjun, 4 hours against 3
    if (a.employee_id === 'emp-001') {
      timesheets.push({
        id: tId++,
        employee_id: a.employee_id,
        assignment_id: 1,
        date: a.date,
        hours: 4.5,
        note: 'Audit cash book and reconciliations'
      });
      timesheets.push({
        id: tId++,
        employee_id: a.employee_id,
        assignment_id: 3,
        date: a.date,
        hours: 4.5,
        note: 'Reviewing client records for 3CD compliance'
      });
    } else {
      timesheets.push({
        id: tId++,
        employee_id: a.employee_id,
        assignment_id: 2,
        date: a.date,
        hours: 8,
        note: 'Filing monthly GST returns'
      });
    }
  });
  return timesheets;
};

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);
  const [mockDb, setMockDb] = useState({});
  const [activeWorkspace, setActiveWorkspace] = useState('C:\\Users\\raram\\.gemini\\antigravity-ide\\scratch\\ca-firm-manager');
  const [notifications, setNotifications] = useState([]);
  const [driveConnectedEmail, setDriveConnectedEmail] = useState(() => localStorage.getItem('ca_drive_connected_email') || null);
  const [dropboxConnectedEmail, setDropboxConnectedEmail] = useState(() => localStorage.getItem('ca_dropbox_connected_email') || null);
  const [archiveError, setArchiveError] = useState(null);

  // Initialize DB
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Setup Mock LocalStorage DB
      const getOrInitTable = (key, defaultData) => {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      };

      const profiles = getOrInitTable('ca_profiles', SEED_PROFILES);
      const clients = getOrInitTable('ca_clients', SEED_CLIENTS);
      const templates = getOrInitTable('ca_templates', SEED_TEMPLATES);
      const assignments = getOrInitTable('ca_assignments', SEED_ASSIGNMENTS);
      const settings = getOrInitTable('ca_settings', SEED_SETTINGS);
      const attendance = getOrInitTable('ca_attendance', buildSeedAttendance());
      const timesheets = getOrInitTable('ca_timesheets', buildSeedTimesheets());
      const leaveRequests = getOrInitTable('ca_leave_requests', [
        { id: 1, employee_id: 'emp-001', type: 'Sick', from_date: '2026-06-15', to_date: '2026-06-15', reason: 'Fever', status: 'Approved', actioned_by: 'hr-001', created_at: '2026-06-14T09:00:00Z' },
        { id: 2, employee_id: 'emp-002', type: 'Casual', from_date: '2026-07-06', to_date: '2026-07-07', reason: 'Family trip', status: 'Pending', actioned_by: null, created_at: '2026-07-01T11:20:00Z' }
      ]);
      const payrollRuns = getOrInitTable('ca_payroll_runs', []);
      const salaries = getOrInitTable('ca_salaries', []);
      const auditLog = getOrInitTable('ca_audit_log', [
        { id: 1, actor_user_id: 'hr-001', actor_role: 'HR', action: 'Created', entity_type: 'employee', entity_id: 'emp-001', old_value: null, new_value: { name: 'Arjun Mehta' }, timestamp: '2026-06-01T09:00:00Z', ip_address: '127.0.0.1' },
        { id: 2, actor_user_id: 'partner-001', actor_role: 'Partner', action: 'Created', entity_type: 'assignment', entity_id: '1', old_value: null, new_value: { title: 'FY25-26 Statutory Audit' }, timestamp: '2026-06-02T10:15:00Z', ip_address: '127.0.0.1' }
      ]);
      const archiveLog = getOrInitTable('ca_archive_log', []);
      const notificationsTable = getOrInitTable('ca_notifications', []);

      setMockDb({
        profiles, clients, templates, assignments, settings, attendance, timesheets, leaveRequests, payrollRuns, salaries, auditLog, archiveLog, notifications: notificationsTable
      });

      // Try auto-login with last active user session from sessionStorage
      const session = sessionStorage.getItem('ca_session_user');
      if (session) {
        setSessionUser(JSON.parse(session));
      }
    } else {
      // Real Supabase Auth listener can be hooked here
      // For now, we simulate basic setup
    }
    setLoading(false);
  }, []);

  // Save Mock DB to localStorage helper
  const saveMockTable = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    setMockDb(prev => ({ ...prev, [key.replace('ca_', '')]: data }));
  };

  // Helper: Write Audit Log
  const writeAuditLog = (actorId, role, action, entityType, entityId, oldValue, newValue) => {
    const timestamp = new Date().toISOString();
    const ipAddress = '192.168.1.45'; // Simulated IP
    
    // Strict constraints validation
    const validActions = ['Created', 'Updated', 'Deleted', 'Finalized', 'Unlocked'];
    const validEntityTypes = ['attendance', 'salary', 'assignment', 'employee', 'payroll'];
    
    if (!validActions.includes(action) || !validEntityTypes.includes(entityType)) {
      // Skip invalid logs that do not match the database constraint
      return;
    }
    
    if (!isSupabaseConfigured) {
      const logs = [...(mockDb.auditLog || [])];
      const newLog = {
        id: logs.length + 1,
        actor_user_id: actorId,
        actor_role: role,
        action,
        entity_type: entityType,
        entity_id: String(entityId),
        old_value: oldValue,
        new_value: newValue,
        timestamp,
        ip_address: ipAddress
      };
      logs.push(newLog);
      saveMockTable('ca_audit_log', logs);
    } else {
      // Write real Supabase DB audit log
      supabase.from('audit_log').insert({
        actor_user_id: actorId,
        actor_role: role,
        action,
        entity_type: entityType,
        entity_id: String(entityId),
        old_value: oldValue,
        new_value: newValue,
        ip_address: ipAddress
      }).then();
    }
  };

  // 1. Auth Module
  const login = async (email, password, otp) => {
    if (!isSupabaseConfigured) {
      const user = mockDb.profiles.find(p => p.email === email.toLowerCase());
      if (!user) throw new Error('User not found.');
      
      if (user.onboarding_status === 'Pending Approval') {
        throw new Error('Onboarding Pending: Your registration is awaiting administrator review and approval. You cannot sign in until approved.');
      }
      
      if (user.onboarding_status === 'Rejected') {
        throw new Error('Onboarding Rejected: Your onboarding application was rejected by the administrator.');
      }

      // If user requires 2FA and OTP is not provided/invalid
      if (user.two_factor_enabled && !otp) {
        // Trigger simulated 2FA OTP sending
        const mockOTP = '123456';
        addNotification(`2FA Code for ${user.name}: ${mockOTP}`, 'info');
        return { require2FA: true, otpSentTo: email };
      }

      if (user.two_factor_enabled && otp !== '123456') {
        throw new Error('Invalid 2FA Code.');
      }

      setSessionUser(user);
      sessionStorage.setItem('ca_session_user', JSON.stringify(user));
      return { user };
    } else {
      // Supabase Email OTP or credential Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Get profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      
      if (profile.onboarding_status === 'Pending Approval') {
        throw new Error('Onboarding Pending: Your registration is awaiting administrator review and approval.');
      }

      setSessionUser(profile);
      return { user: profile };
    }
  };

  const signup = async (name, email, password, division, branchId) => {
    if (!isSupabaseConfigured) {
      const profiles = [...mockDb.profiles];
      const existing = profiles.find(p => p.email === email.toLowerCase());
      if (existing) throw new Error('An account with this email already exists.');

      const newEmp = {
        id: `emp-00${profiles.length + 1}`,
        email: email.toLowerCase(),
        name,
        role: 'Employee',
        division,
        branch_id: branchId || 'branch-1',
        onboarding_status: 'Pending Approval',
        monthly_salary: 0,
        hourly_rate: 0,
        joined_date: getISTDateString(),
        leave_balance_casual: 6,
        leave_balance_sick: 6,
        leave_balance_earned: 12,
        two_factor_enabled: false
      };
      profiles.push(newEmp);
      saveMockTable('ca_profiles', profiles);
      writeAuditLog(newEmp.id, newEmp.role, 'Created', 'employee', newEmp.id, null, newEmp);
      addNotification(`Self-onboarding submitted for ${name}. Pending approval.`, 'info');
      return newEmp;
    }
  };

  const logout = () => {
    setSessionUser(null);
    sessionStorage.removeItem('ca_session_user');
  };

  // 2. Attendance Module
  const checkIn = async (selfieBase64, latitude, longitude) => {
    if (!sessionUser) return;
    const todayStr = getISTDateString();
    
    // Check if geo fence is required
    const settings = await getSettings();
    let distance = 0;
    if (settings.require_geo && settings.office_lat && settings.office_lng && latitude && longitude) {
      // Calculate distance (Haversine formula)
      const R = 6371000; // meters
      const dLat = (latitude - settings.office_lat) * Math.PI / 180;
      const dLng = (longitude - settings.office_lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(settings.office_lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R * c;

      if (distance > settings.allowed_radius) {
        throw new Error(`Out of Bounds: You are ${Math.round(distance)}m away from office. Limit is ${settings.allowed_radius}m.`);
      }
    }

    if (settings.require_selfie && !selfieBase64) {
      throw new Error('Selfie verification is required for check-in.');
    }

    const timestampStr = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const records = [...mockDb.attendance];
      const existing = records.find(r => r.employee_id === sessionUser.id && r.date === todayStr);
      if (existing) throw new Error('Already checked in today.');

      const newRecord = {
        id: records.length + 1,
        employee_id: sessionUser.id,
        date: todayStr,
        check_in: timestampStr,
        check_out: null,
        worked_hours: 0,
        status: 'Present',
        selfie_url: selfieBase64 || '',
        latitude,
        longitude,
        distance_from_office: distance,
        approved_by_admin: false
      };
      records.push(newRecord);
      saveMockTable('ca_attendance', records);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Created', 'attendance', newRecord.id, null, newRecord);
    } else {
      // Supabase implementation
      // ... RLS handles policy constraints
    }
  };

  const checkOut = async () => {
    if (!sessionUser) return;
    const todayStr = getISTDateString();
    const timestampStr = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const records = [...mockDb.attendance];
      const idx = records.findIndex(r => r.employee_id === sessionUser.id && r.date === todayStr);
      if (idx === -1) throw new Error('No check-in record found for today.');
      if (records[idx].check_out) throw new Error('Already checked out today.');

      const checkInTime = new Date(records[idx].check_in);
      const checkOutTime = new Date(timestampStr);
      const hours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 10) / 10;

      const oldVal = { ...records[idx] };
      records[idx].check_out = timestampStr;
      records[idx].worked_hours = hours;
      saveMockTable('ca_attendance', records);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'attendance', records[idx].id, oldVal, records[idx]);
    } else {
      // Supabase implementation
    }
  };

  const getAttendance = async (employeeId, month, year) => {
    if (!isSupabaseConfigured) {
      return mockDb.attendance.filter(r => {
        const matchesEmployee = employeeId ? r.employee_id === employeeId : true;
        if (!r.date) return false;
        const [y, m] = r.date.split('-');
        return matchesEmployee && parseInt(m) === month && parseInt(y) === year;
      });
    } else {
      // Supabase fetch
    }
  };

  // 3. Settings Module
  const getSettings = async () => {
    if (!isSupabaseConfigured) {
      return mockDb.settings;
    } else {
      // Supabase
    }
  };

  const updateSettings = async (newSettings) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    
    if (!isSupabaseConfigured) {
      const oldSettings = { ...mockDb.settings };
      const updated = { ...oldSettings, ...newSettings };
      saveMockTable('ca_settings', updated);
    } else {
      // Supabase
    }
  };

  // 4. Leave Management
  const getLeaveRequests = async (employeeId = null) => {
    if (!isSupabaseConfigured) {
      return employeeId 
        ? mockDb.leaveRequests.filter(r => r.employee_id === employeeId) 
        : mockDb.leaveRequests;
    }
  };

  const applyLeave = async (type, fromDate, toDate, reason) => {
    if (!sessionUser) return;
    
    if (!isSupabaseConfigured) {
      const requests = [...mockDb.leaveRequests];
      const newReq = {
        id: requests.length + 1,
        employee_id: sessionUser.id,
        type,
        from_date: fromDate,
        to_date: toDate,
        reason,
        status: 'Pending',
        actioned_by: null,
        created_at: new Date().toISOString()
      };
      requests.push(newReq);
      saveMockTable('ca_leave_requests', requests);
    }
  };

  const actionLeave = async (requestId, status) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;

    if (!isSupabaseConfigured) {
      const requests = [...mockDb.leaveRequests];
      const idx = requests.findIndex(r => r.id === requestId);
      if (idx === -1) return;

      const oldVal = { ...requests[idx] };
      requests[idx].status = status;
      requests[idx].actioned_by = sessionUser.id;
      saveMockTable('ca_leave_requests', requests);

      // If approved, update attendance register
      if (status === 'Approved') {
        const req = requests[idx];
        const attendances = [...mockDb.attendance];
        const emp = mockDb.profiles.find(p => p.id === req.employee_id);

        // Calculate days & decrement leaves
        const start = new Date(req.from_date);
        const end = new Date(req.to_date);
        let daysCount = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          daysCount++;
          // Insert paid leave record
          if (!attendances.some(a => a.employee_id === req.employee_id && a.date === dateStr)) {
            const newRecord = {
              id: attendances.length + 1,
              employee_id: req.employee_id,
              date: dateStr,
              check_in: null,
              check_out: null,
              worked_hours: 0,
              status: 'Paid-Leave',
              selfie_url: null,
              latitude: null,
              longitude: null,
              distance_from_office: 0,
              approved_by_admin: true
            };
            attendances.push(newRecord);
            writeAuditLog(sessionUser.id, sessionUser.role, 'Created', 'attendance', newRecord.id, null, newRecord);
          }
        }
        saveMockTable('ca_attendance', attendances);

        // Deduct balance
        if (emp) {
          const updatedEmp = { ...emp };
          const typeKey = `leave_balance_${req.type.toLowerCase()}`;
          if (updatedEmp[typeKey] !== undefined) {
            updatedEmp[typeKey] = Math.max(0, updatedEmp[typeKey] - daysCount);
            const profiles = mockDb.profiles.map(p => p.id === emp.id ? updatedEmp : p);
            saveMockTable('ca_profiles', profiles);
          }
        }
      }
    }
  };

  const approveOnboarding = async (employeeId, monthlySalary, hourlyRate) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const profiles = [...mockDb.profiles];
      const idx = profiles.findIndex(p => p.id === employeeId);
      if (idx === -1) return;

      const oldVal = { ...profiles[idx] };
      profiles[idx].onboarding_status = 'Approved';
      profiles[idx].monthly_salary = parseFloat(monthlySalary) || 0;
      profiles[idx].hourly_rate = parseFloat(hourlyRate) || 0;
      saveMockTable('ca_profiles', profiles);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'employee', employeeId, oldVal, profiles[idx]);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'salary', employeeId, { monthly_salary: oldVal.monthly_salary }, { monthly_salary: profiles[idx].monthly_salary });
      addNotification(`Approved onboarding for ${profiles[idx].name}. Added to salary register.`, 'success');
    }
  };

  const rejectOnboarding = async (employeeId) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const profiles = [...mockDb.profiles];
      const idx = profiles.findIndex(p => p.id === employeeId);
      if (idx === -1) return;

      const oldVal = { ...profiles[idx] };
      profiles[idx].onboarding_status = 'Rejected';
      saveMockTable('ca_profiles', profiles);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'employee', employeeId, oldVal, profiles[idx]);
      addNotification(`Rejected onboarding for ${profiles[idx].name}.`, 'warning');
    }
  };

  const approveAttendanceDay = async (attendanceId) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const records = [...mockDb.attendance];
      const idx = records.findIndex(r => r.id === parseInt(attendanceId));
      if (idx === -1) return;

      const oldVal = { ...records[idx] };
      records[idx].approved_by_admin = true;
      saveMockTable('ca_attendance', records);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'attendance', attendanceId, oldVal, records[idx]);
      addNotification(`Approved check-in log for ${records[idx].date}`, 'success');
    }
  };

  const savePublicHoliday = async (date, description) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const s = { ...mockDb.settings };
      let holidays = [];
      if (s.public_holidays) {
        holidays = JSON.parse(s.public_holidays);
      }
      
      const existing = holidays.findIndex(h => h.date === date);
      const newHoli = { date, description, year: new Date(date).getFullYear() };
      
      if (existing !== -1) {
        holidays[existing] = newHoli;
      } else {
        holidays.push(newHoli);
      }
           s.public_holidays = JSON.stringify(holidays);
      saveMockTable('ca_settings', s);
      addNotification(`Saved public holiday: ${description} (${date})`, 'success');
 
      // Auto-insert public holiday into attendance list for all approved employees
      const employees = mockDb.profiles.filter(p => p.role === 'Employee' && p.onboarding_status === 'Approved');
      const attendance = [...mockDb.attendance];
      
      employees.forEach(emp => {
        const hasRecord = attendance.some(a => a.employee_id === emp.id && a.date === date);
        if (!hasRecord) {
          attendance.push({
            id: attendance.length + 1,
            employee_id: emp.id,
            date,
            check_in: null,
            check_out: null,
            worked_hours: 0,
            status: 'Holiday',
            selfie_url: null,
            latitude: null,
            longitude: null,
            distance_from_office: 0,
            approved_by_admin: true
          });
        }
      });
      saveMockTable('ca_attendance', attendance);
    }
  };

  // 5. Client & Templates Master
  const getClients = async () => {
    if (!isSupabaseConfigured) return mockDb.clients;
  };

  const createClient = async (clientData) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const clients = [...mockDb.clients];
      const newClient = { id: clients.length + 1, ...clientData };
      clients.push(newClient);
      saveMockTable('ca_clients', clients);
    }
  };

  const getTemplates = async () => {
    if (!isSupabaseConfigured) return mockDb.templates;
  };

  const createTemplate = async (title, description) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const templates = [...mockDb.templates];
      const newTemp = { id: templates.length + 1, title, description };
      templates.push(newTemp);
      saveMockTable('ca_templates', templates);
    }
  };

  // 6. Assignments & Timesheets
  const getAssignments = async (employeeId = null) => {
    if (!isSupabaseConfigured) {
      return employeeId 
        ? mockDb.assignments.filter(a => a.assigned_to === employeeId)
        : mockDb.assignments;
    }
  };

  const createAssignment = async (data) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const list = [...mockDb.assignments];
      const newAssign = {
        id: list.length + 1,
        ...data,
        status: 'Pending',
        is_completed: false
      };
      list.push(newAssign);
      saveMockTable('ca_assignments', list);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Created', 'assignment', newAssign.id, null, newAssign);
    }
  };

  const updateAssignmentStatus = async (id, status, isCompleted) => {
    if (!isSupabaseConfigured) {
      const list = [...mockDb.assignments];
      const idx = list.findIndex(a => a.id === id);
      if (idx === -1) return;
      const oldVal = { ...list[idx] };
      list[idx].status = status;
      list[idx].is_completed = isCompleted;
      if (isCompleted) {
        list[idx].completed_at = new Date().toISOString();
      }
      saveMockTable('ca_assignments', list);
      writeAuditLog(sessionUser?.id, sessionUser?.role, 'Updated', 'assignment', id, oldVal, list[idx]);
    }
  };

  const getTimesheets = async (employeeId = null) => {
    if (!isSupabaseConfigured) {
      return employeeId
        ? mockDb.timesheets.filter(t => t.employee_id === employeeId)
        : mockDb.timesheets;
    }
  };

  const saveTimesheet = async (date, assignmentId, hours, note) => {
    if (!sessionUser) return;
    if (!isSupabaseConfigured) {
      const logs = [...mockDb.timesheets];
      // Check if entry already exists for employee/date/assignment
      const idx = logs.findIndex(t => t.employee_id === sessionUser.id && t.date === date && t.assignment_id === parseInt(assignmentId));
      
      const newEntry = {
        employee_id: sessionUser.id,
        assignment_id: parseInt(assignmentId),
        date,
        hours: parseFloat(hours),
        note
      };

      if (idx !== -1) {
        newEntry.id = logs[idx].id;
        logs[idx] = newEntry;
      } else {
        newEntry.id = logs.length + 1;
        logs.push(newEntry);
      }
      saveMockTable('ca_timesheets', logs);
    }
  };

  // 7. Employee Master
  const getProfiles = async () => {
    if (!isSupabaseConfigured) return mockDb.profiles;
  };

  const createOrUpdateEmployee = async (empData) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    if (!isSupabaseConfigured) {
      const profiles = [...mockDb.profiles];
      if (empData.id) {
        // Update
        const idx = profiles.findIndex(p => p.id === empData.id);
        if (idx !== -1) {
          const oldVal = { ...profiles[idx] };
          profiles[idx] = { ...profiles[idx], ...empData };
          saveMockTable('ca_profiles', profiles);
          writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'employee', empData.id, oldVal, profiles[idx]);
          
          // Log salary changed if monthly_salary changed
          if (parseFloat(oldVal.monthly_salary) !== parseFloat(profiles[idx].monthly_salary)) {
            writeAuditLog(sessionUser.id, sessionUser.role, 'Updated', 'salary', empData.id, { monthly_salary: oldVal.monthly_salary }, { monthly_salary: profiles[idx].monthly_salary });
          }
        }
      } else {
        // Create
        const newEmp = {
          id: `emp-00${profiles.length + 1}`,
          ...empData,
          joined_date: getISTDateString()
        };
        profiles.push(newEmp);
        saveMockTable('ca_profiles', profiles);
        writeAuditLog(sessionUser.id, sessionUser.role, 'Created', 'employee', newEmp.id, null, newEmp);
        writeAuditLog(sessionUser.id, sessionUser.role, 'Created', 'salary', newEmp.id, null, { monthly_salary: newEmp.monthly_salary });
      }
    }
  };

  // 8. Payroll Engine (Finalize, Lock, Divisor 22, Deductions)
  const getPayrollRuns = async () => {
    if (!isSupabaseConfigured) return mockDb.payrollRuns;
  };

  const getSalariesForRun = async (runId) => {
    if (!isSupabaseConfigured) {
      return mockDb.salaries.filter(s => s.payroll_run_id === runId);
    }
  };

  const finalizePayroll = async (month, year) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;
    
    // Ensure PF, ESI, TDS inputs and PT slabs are entered in settings first
    const settings = await getSettings();
    if (settings.pf_rate === '' || settings.esi_rate === '' || settings.tds_rate === '' || !settings.pt_slabs || settings.pt_slabs === '') {
      throw new Error("Cannot finalize payroll: Statutory deduction rates (PF, ESI, TDS, PT Slabs) are unconfigured. Please complete the settings layout first.");
    }

    if (!isSupabaseConfigured) {
      const runs = [...mockDb.payrollRuns];
      const salariesList = [...mockDb.salaries];
      
      const existingRun = runs.find(r => r.month === month && r.year === year);
      if (existingRun && existingRun.status === 'Finalized') {
        throw new Error('Payroll for this month is already finalized/locked.');
      }

      // Create Run Record
      const newRun = {
        id: runs.length + 1,
        month,
        year,
        status: 'Finalized',
        finalized_by: sessionUser.id,
        finalized_at: new Date().toISOString()
      };
      runs.push(newRun);

      // Compute payroll details for all active approved employees (excluding pending onboarding)
      const employees = mockDb.profiles.filter(p => p.role === 'Employee' && p.onboarding_status === 'Approved');
      const attendance = mockDb.attendance.filter(a => {
        const [y, m] = a.date.split('-');
        return parseInt(m) === month && parseInt(y) === year;
      });

      employees.forEach(emp => {
        const empAttendance = attendance.filter(a => a.employee_id === emp.id);
        const workedDays = empAttendance.filter(a => a.status === 'Present' && (a.approved_by_admin === true || a.approved_by_admin === 'true')).length;
        const paidLeaves = empAttendance.filter(a => a.status === 'Paid-Leave').length;
        const holidaysCount = empAttendance.filter(a => a.status === 'Holiday').length;
        const unpaidLeaves = empAttendance.filter(a => a.status === 'Unpaid-Leave' || a.status === 'Absent').length;

        // Daily rate is monthly salary divided by 22
        const dailyRate = emp.monthly_salary / 22;
        // Total Paid Days = workedDays + paidLeaves + holidaysCount
        // Cap at 22 days to calculate baseline, but salary register will multiply dailyRate by actual paid days.
        const payableDays = Math.min(22, workedDays + paidLeaves + holidaysCount);
        const grossPayable = Math.round(dailyRate * payableDays);

        // Deductions
        const pfDeduction = Math.round(grossPayable * (parseFloat(settings.pf_rate) / 100));
        const esiDeduction = Math.round(grossPayable * (parseFloat(settings.esi_rate) / 100));
        const tdsDeduction = Math.round(grossPayable * (parseFloat(settings.tds_rate) / 100));

        // Professional tax slab calculation
        let ptDeduction = 0;
        if (settings.pt_slabs && settings.pt_slabs !== '') {
          try {
            const slabs = JSON.parse(settings.pt_slabs);
            const matchedSlab = slabs.find(s => grossPayable >= s.min && grossPayable <= s.max);
            if (matchedSlab) ptDeduction = matchedSlab.amt;
          } catch (e) {
            // Ignore
          }
        }

        const totalDeductions = pfDeduction + esiDeduction + tdsDeduction + ptDeduction;
        const netPayable = Math.max(0, grossPayable - totalDeductions);

        salariesList.push({
          id: salariesList.length + 1,
          payroll_run_id: newRun.id,
          employee_id: emp.id,
          basic_salary: emp.monthly_salary,
          gross_payable: grossPayable,
          net_payable: netPayable,
          deductions_pf: pfDeduction,
          deductions_esi: esiDeduction,
          deductions_pt: ptDeduction,
          deductions_tds: tdsDeduction,
          worked_days: workedDays,
          paid_leaves: paidLeaves,
          unpaid_leaves: unpaidLeaves
        });

        // Trigger automatic payslip email simulated log
        addNotification(`Payslip emailed successfully to ${emp.name} (${emp.email}) for ${month}/${year}`, 'success', emp.id);
      });

      saveMockTable('ca_payroll_runs', runs);
      saveMockTable('ca_salaries', salariesList);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Finalized', 'payroll', newRun.id, null, newRun);

      // Trigger automatic cloud archival
      triggerArchive(month, year, 'google_drive');
    }
  };

  const unlockPayroll = async (month, year) => {
    if (!sessionUser || (sessionUser.role !== 'HR' && sessionUser.role !== 'Partner')) return;

    if (!isSupabaseConfigured) {
      const runs = [...mockDb.payrollRuns];
      const runIdx = runs.findIndex(r => r.month === month && r.year === year);
      if (runIdx === -1) return;

      const oldRun = { ...runs[runIdx] };
      const runId = oldRun.id;
      
      // Delete salaries related to this run
      const salariesList = mockDb.salaries.filter(s => s.payroll_run_id !== runId);
      saveMockTable('ca_salaries', salariesList);

      // Remove run
      runs.splice(runIdx, 1);
      saveMockTable('ca_payroll_runs', runs);
      writeAuditLog(sessionUser.id, sessionUser.role, 'Unlocked', 'payroll', runId, oldRun, null);
      addNotification(`Payroll unlocked/cleared for ${month}/${year}`, 'warning');
    }
  };

  // 9. Archival Engine
  const getArchiveLogs = async () => {
    if (!isSupabaseConfigured) return mockDb.archiveLog;
  };

  const triggerArchive = async (month, year, provider = 'google_drive') => {
    if (!sessionUser) return;
    setArchiveError(null);
    
    // Connectivity checks
    if (provider === 'google_drive' && !localStorage.getItem('ca_drive_connected_email')) {
      const msg = "Google Drive is disconnected. Connect Google Drive in settings first.";
      setArchiveError(msg);
      addNotification(msg, 'danger');
      return;
    }
    if (provider === 'dropbox' && !localStorage.getItem('ca_dropbox_connected_email')) {
      const msg = "Dropbox is disconnected. Connect Dropbox in settings first.";
      setArchiveError(msg);
      addNotification(msg, 'danger');
      return;
    }

    const empCount = mockDb.profiles?.filter(p => p.role === 'Employee').length || 0;
    // Files: Attendance (2), Salary (2), Billing (1), Timesheet (2) and Payslips (empCount)
    const fileCount = 7 + empCount; 
    const timestamp = new Date().toISOString();

    if (!isSupabaseConfigured) {
      // 20% chance that the first attempt fails
      const firstAttemptSuccess = Math.random() > 0.20;

      if (firstAttemptSuccess) {
        const logs = [...(mockDb.archiveLog || [])];
        const newLog = {
          id: logs.length + 1,
          month,
          year,
          provider,
          files_uploaded: fileCount,
          status: 'Success',
          error_message: '',
          run_at: timestamp
        };
        logs.push(newLog);
        saveMockTable('ca_archive_log', logs);
        addNotification(`Cloud backup succeeded for ${month}/${year}. ${fileCount} files uploaded to /CA-Firm-Records/${year}/${month}/.`, 'success');
      } else {
        // Initial attempt failed. Retry once after 2 seconds.
        addNotification(`Initial cloud backup attempt failed for ${month}/${year}. Retrying once...`, 'warning');
        
        setTimeout(() => {
          // Retry attempt: 60% chance of success, 40% chance of failure
          const retrySuccess = Math.random() > 0.40;
          const retryTimestamp = new Date().toISOString();
          
          if (retrySuccess) {
            const logs = JSON.parse(localStorage.getItem('ca_archive_log') || '[]');
            const newLog = {
              id: logs.length + 1,
              month,
              year,
              provider,
              files_uploaded: fileCount,
              status: 'Success',
              error_message: '',
              run_at: retryTimestamp
            };
            logs.push(newLog);
            saveMockTable('ca_archive_log', logs);
            addNotification(`Backup retry succeeded for ${month}/${year}. ${fileCount} files uploaded.`, 'success');
          } else {
            // Retry failed!
            const logs = JSON.parse(localStorage.getItem('ca_archive_log') || '[]');
            const errMsg = `Backup failed on retry: Timeout connecting to upload server.`;
            const newLog = {
              id: logs.length + 1,
              month,
              year,
              provider,
              files_uploaded: 0,
              status: 'Failed',
              error_message: errMsg,
              run_at: retryTimestamp
            };
            logs.push(newLog);
            saveMockTable('ca_archive_log', logs);
            
            // Show red alert warning banner
            setArchiveError(`Archival for ${month}/${year} failed after retry. Details: ${errMsg}`);
            addNotification(`Backup failed completely for ${month}/${year}.`, 'danger');
          }
        }, 2000);
      }
    }
  };

  const connectGoogleDrive = (email) => {
    localStorage.setItem('ca_drive_connected_email', email);
    setDriveConnectedEmail(email);
    addNotification(`Connected Google Drive as ${email}`, 'success');
  };

  const disconnectGoogleDrive = () => {
    localStorage.removeItem('ca_drive_connected_email');
    setDriveConnectedEmail(null);
    addNotification('Disconnected from Google Drive.', 'warning');
  };

  const connectDropbox = (email) => {
    localStorage.setItem('ca_dropbox_connected_email', email);
    setDropboxConnectedEmail(email);
    addNotification(`Connected Dropbox as ${email}`, 'success');
  };

  const disconnectDropbox = () => {
    localStorage.removeItem('ca_dropbox_connected_email');
    setDropboxConnectedEmail(null);
    addNotification('Disconnected from Dropbox.', 'warning');
  };

  // 10. Notifications (PWA alert / alerts simulator)
  const addNotification = (text, type = 'info', employeeId = null) => {
    const newNotif = {
      id: Date.now() + Math.random().toString(),
      employee_id: employeeId || (sessionUser ? sessionUser.id : 'system'),
      text,
      type,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (!isSupabaseConfigured) {
      const logs = JSON.parse(localStorage.getItem('ca_notifications') || '[]');
      logs.push(newNotif);
      saveMockTable('ca_notifications', logs);
    }
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AppContext.Provider value={{
      loading,
      sessionUser,
      mockDb,
      notifications,
      activeWorkspace,
      setActiveWorkspace,
      login,
      logout,
      signup,
      checkIn,
      checkOut,
      getAttendance,
      getSettings,
      updateSettings,
      getLeaveRequests,
      applyLeave,
      actionLeave,
      approveOnboarding,
      rejectOnboarding,
      approveAttendanceDay,
      savePublicHoliday,
      getClients,
      createClient,
      getTemplates,
      createTemplate,
      getAssignments,
      createAssignment,
      updateAssignmentStatus,
      getTimesheets,
      saveTimesheet,
      getProfiles,
      createOrUpdateEmployee,
      getPayrollRuns,
      getSalariesForRun,
      finalizePayroll,
      unlockPayroll,
      getArchiveLogs,
      triggerArchive,
      addNotification,
      clearNotification,
      isSupabase: isSupabaseConfigured,
      driveConnectedEmail,
      dropboxConnectedEmail,
      archiveError,
      setArchiveError,
      connectGoogleDrive,
      disconnectGoogleDrive,
      connectDropbox,
      disconnectDropbox
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
