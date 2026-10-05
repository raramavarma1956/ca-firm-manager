import React, { useState, useEffect } from 'react';
import { useApp, formatIndianCurrency, getISTDateString } from '../context/AppContext';

export const HRDashboard = () => {
  const {
    sessionUser,
    mockDb,
    getAttendance,
    getSettings,
    updateSettings,
    getLeaveRequests,
    actionLeave,
    approveOnboarding,
    rejectOnboarding,
    approveAttendanceDay,
    savePublicHoliday,
    getProfiles,
    createOrUpdateEmployee,
    getArchiveLogs,
    triggerArchive,
    addNotification,
    logout,
    driveConnectedEmail,
    dropboxConnectedEmail,
    archiveError,
    setArchiveError,
    connectGoogleDrive,
    disconnectGoogleDrive,
    connectDropbox,
    disconnectDropbox
  } = useApp();

  const [activeTab, setActiveTab] = useState('attendance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(getISTDateString());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedSelfie, setSelectedSelfie] = useState(null);

  // Leave states
  const [pendingRequests, setPendingRequests] = useState([]);

  // Onboarding approvals states
  const [pendingOnboardings, setPendingOnboardings] = useState([]);
  const [salaryInputs, setSalaryInputs] = useState({});
  const [hourlyRateInputs, setHourlyRateInputs] = useState({});

  // Employee directory states
  const [employees, setEmployees] = useState([]);
  const [editingEmp, setEditingEmp] = useState(null);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: '', email: '', role: 'Employee', division: 'Audit & Assurance Services', branch_id: 'branch-1', monthly_salary: 30000, hourly_rate: 200,
    leave_balance_casual: 6, leave_balance_sick: 6, leave_balance_earned: 12, two_factor_enabled: false,
    pf_number: '', esi_number: ''
  });

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    office_lat: 19.0760, office_lng: 72.8777, allowed_radius: 100,
    require_selfie: false, require_geo: false, pf_rate: '', esi_rate: '', tds_rate: '', pt_slabs: '',
    google_drive_folder_id: '', dropbox_folder_path: '', attendance_late_cutoff: '10:00',
    firm_name: '', firm_address: '', branches: ''
  });
  
  // Archival settings states
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  // Audit Trail states
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditDateStart, setAuditDateStart] = useState('');
  const [auditDateEnd, setAuditDateEnd] = useState('');

  // Timesheet Report states
  const [reportMonth, setReportMonth] = useState(6); // June
  const [reportYear, setReportYear] = useState(2026);
  const [timesheets, setTimesheets] = useState([]);
  
  // Professional Tax Slabs configuration state
  const [ptSlabs, setPtSlabs] = useState([]);

  // Branch & Firm states
  const [branchesList, setBranchesList] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ id: '', name: '', address: '', partner_in_charge_id: '', hr_administrator_id: '' });
  const [branchFilter, setBranchFilter] = useState('');

  // Analytics states
  const [analyticsMonth, setAnalyticsMonth] = useState(6); // June
  const [analyticsYear, setAnalyticsYear] = useState(2026);

  // Load Data
  useEffect(() => {
    loadAttendance();
    loadLeaves();
    loadEmployees();
    loadSettings();
    loadArchiveLogs();
    loadAuditLogs();
    loadTimesheets();
  }, [mockDb, attendanceDate]);

  const loadAttendance = async () => {
    const all = mockDb.attendance || [];
    const records = all.filter(r => r.date === attendanceDate);
    setAttendanceRecords(records);
  };

  const loadLeaves = async () => {
    const list = await getLeaveRequests();
    setPendingRequests(list.filter(r => r.status === 'Pending'));
  };

  const loadEmployees = async () => {
    const p = await getProfiles();
    // Only active employees appear in directory
    setEmployees(p.filter(emp => emp.onboarding_status === 'Approved' || emp.role !== 'Employee'));
    // Pending approvals
    setPendingOnboardings(p.filter(emp => emp.onboarding_status === 'Pending Approval'));
  };

  const loadSettings = async () => {
    const s = await getSettings();
    if (s) {
      setSettingsForm({
        office_lat: parseFloat(s.office_lat) || 19.0760,
        office_lng: parseFloat(s.office_lng) || 72.8777,
        allowed_radius: parseInt(s.allowed_radius) || 100,
        require_selfie: s.require_selfie === 'true' || s.require_selfie === true,
        require_geo: s.require_geo === 'true' || s.require_geo === true,
        pf_rate: s.pf_rate,
        esi_rate: s.esi_rate,
        tds_rate: s.tds_rate,
        pt_slabs: s.pt_slabs || '',
        google_drive_folder_id: s.google_drive_folder_id || '',
        dropbox_folder_path: s.dropbox_folder_path || '',
        attendance_late_cutoff: s.attendance_late_cutoff || '10:00',
        firm_name: s.firm_name || '',
        firm_address: s.firm_address || '',
        branches: s.branches || ''
      });
      if (s.pt_slabs) {
        try {
          setPtSlabs(JSON.parse(s.pt_slabs));
        } catch (e) {
          setPtSlabs([]);
        }
      } else {
        setPtSlabs([]);
      }
      if (s.branches) {
        try {
          setBranchesList(JSON.parse(s.branches));
        } catch (e) {
          setBranchesList([]);
        }
      } else {
        setBranchesList([]);
      }
    }
  };

  const updateSlab = (index, field, value) => {
    const updated = [...ptSlabs];
    updated[index][field] = value;
    setPtSlabs(updated);
    setSettingsForm(prev => ({ ...prev, pt_slabs: JSON.stringify(updated) }));
  };

  const addSlab = () => {
    const updated = [...ptSlabs, { min: 0, max: 9999999, amt: 0 }];
    setPtSlabs(updated);
    setSettingsForm(prev => ({ ...prev, pt_slabs: JSON.stringify(updated) }));
  };

  const removeSlab = (index) => {
    const updated = ptSlabs.filter((_, i) => i !== index);
    setPtSlabs(updated);
    setSettingsForm(prev => ({ ...prev, pt_slabs: updated.length > 0 ? JSON.stringify(updated) : '' }));
  };

  const loadArchiveLogs = async () => {
    const logs = await getArchiveLogs();
    setArchiveLogs(logs.sort((a, b) => b.run_at.localeCompare(a.run_at)));
  };

  const loadAuditLogs = async () => {
    setAuditLogs(mockDb.auditLog || []);
  };

  const loadTimesheets = async () => {
    setTimesheets(mockDb.timesheets || []);
  };

  // Leave action
  const handleLeaveAction = async (id, status) => {
    await actionLeave(id, status);
    addNotification(`Leave request ${status.toLowerCase()} successfully.`, 'info');
    loadLeaves();
    loadAttendance();
  };

  // Employee Edit/Save
  const openNewEmployeeModal = () => {
    setEditingEmp(null);
    setEmpForm({
      name: '', email: '', role: 'Employee', division: 'Audit & Assurance Services', branch_id: 'branch-1', monthly_salary: 30000, hourly_rate: 200,
      leave_balance_casual: 6, leave_balance_sick: 6, leave_balance_earned: 12, two_factor_enabled: false,
      pf_number: '', esi_number: ''
    });
    setShowEmpModal(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingEmp(emp);
    setEmpForm({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      division: emp.division || 'Audit & Assurance Services',
      branch_id: emp.branch_id || 'branch-1',
      monthly_salary: emp.monthly_salary,
      hourly_rate: emp.hourly_rate || 200,
      leave_balance_casual: emp.leave_balance_casual || 0,
      leave_balance_sick: emp.leave_balance_sick || 0,
      leave_balance_earned: emp.leave_balance_earned || 0,
      two_factor_enabled: emp.two_factor_enabled || false,
      pf_number: emp.pf_number || '',
      esi_number: emp.esi_number || ''
    });
    setShowEmpModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    await createOrUpdateEmployee({ ...empForm, onboarding_status: 'Approved' });
    addNotification(editingEmp ? 'Employee profile updated.' : 'New employee registered.', 'success');
    setShowEmpModal(false);
    loadEmployees();
  };

  const handleSaveBranch = (e) => {
    e.preventDefault();
    let updatedBranches = [...branchesList];
    if (editingBranch) {
      updatedBranches = updatedBranches.map(b => b.id === branchForm.id ? { ...b, ...branchForm } : b);
      addNotification(`Branch "${branchForm.name}" updated.`, 'success');
    } else {
      const newId = `branch-${Date.now()}`;
      const newBranch = { ...branchForm, id: newId };
      updatedBranches.push(newBranch);
      addNotification(`Branch "${branchForm.name}" created.`, 'success');
    }
    setBranchesList(updatedBranches);
    setSettingsForm(prev => {
      const nextSettings = { ...prev, branches: JSON.stringify(updatedBranches) };
      updateSettings(nextSettings);
      return nextSettings;
    });
    setShowBranchModal(false);
  };

  const deleteBranch = (branchId) => {
    if (!confirm('Are you sure you want to delete this branch location?')) return;
    const updatedBranches = branchesList.filter(b => b.id !== branchId);
    setBranchesList(updatedBranches);
    setSettingsForm(prev => {
      const nextSettings = { ...prev, branches: JSON.stringify(updatedBranches) };
      updateSettings(nextSettings);
      return nextSettings;
    });
    addNotification('Branch location deleted.', 'success');
  };

  const openNewBranchModal = () => {
    const partners = mockDb.profiles?.filter(p => p.role === 'Partner') || [];
    const hrs = mockDb.profiles?.filter(p => p.role === 'HR' || p.role === 'Partner') || [];
    setEditingBranch(null);
    setBranchForm({
      id: '',
      name: '',
      address: '',
      partner_in_charge_id: partners[0]?.id || '',
      hr_administrator_id: hrs[0]?.id || ''
    });
    setShowBranchModal(true);
  };

  const openEditBranchModal = (branch) => {
    setEditingBranch(branch);
    setBranchForm({ ...branch });
    setShowBranchModal(true);
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await updateSettings(settingsForm);
    addNotification('Firm settings and statutory rates saved.', 'success');
  };

  // Cloud backup connections
  const toggleGoogleDrive = () => {
    if (driveConnectedEmail) {
      disconnectGoogleDrive();
    } else {
      const email = prompt("Enter Google Account email to connect (drive.file scope):", "sharmas.iyer.ca@gmail.com");
      if (email) connectGoogleDrive(email);
    }
  };

  const toggleDropbox = () => {
    if (dropboxConnectedEmail) {
      disconnectDropbox();
    } else {
      const email = prompt("Enter Dropbox Account email to connect (files.content.write):", "sharmas.iyer.ca@dropbox.com");
      if (email) connectDropbox(email);
    }
  };

  const triggerManualBackup = async () => {
    if (!driveConnectedEmail && !dropboxConnectedEmail) {
      alert('Please connect Google Drive or Dropbox integration first.');
      return;
    }
    setBackupLoading(true);
    await triggerArchive(reportMonth, reportYear, driveConnectedEmail ? 'google_drive' : 'dropbox');
    setBackupLoading(false);
    loadArchiveLogs();
  };

  // Audit Logs Filter
  const filteredAuditLogs = auditLogs.filter(log => {
    let matchesEmployee = true;
    if (auditActorFilter) {
      const isActor = log.actor_user_id === auditActorFilter;
      const isEmployeeSubject = log.entity_type === 'employee' && log.entity_id === auditActorFilter;
      const isSalarySubject = log.entity_type === 'salary' && log.entity_id === auditActorFilter;
      
      // Check attendance subject
      let isAttendanceSubject = false;
      if (log.entity_type === 'attendance') {
        if (log.entity_id === auditActorFilter) {
          isAttendanceSubject = true;
        } else {
          const record = mockDb.attendance?.find(a => String(a.id) === String(log.entity_id));
          if (record && record.employee_id === auditActorFilter) {
            isAttendanceSubject = true;
          }
        }
      }
      
      // Check assignment subject
      let isAssignmentSubject = false;
      if (log.entity_type === 'assignment') {
        const record = mockDb.assignments?.find(a => String(a.id) === String(log.entity_id));
        if (record && record.assigned_to === auditActorFilter) {
          isAssignmentSubject = true;
        }
      }
      
      matchesEmployee = isActor || isEmployeeSubject || isSalarySubject || isAttendanceSubject || isAssignmentSubject;
    }
    const matchesAction = auditActionFilter ? log.action === auditActionFilter : true;
    
    let matchesDate = true;
    if (log.timestamp) {
      const logDate = log.timestamp.split('T')[0];
      if (auditDateStart && logDate < auditDateStart) matchesDate = false;
      if (auditDateEnd && logDate > auditDateEnd) matchesDate = false;
    }
    return matchesEmployee && matchesAction && matchesDate;
  });

  // Analytics computations
  const cutoffTime = settingsForm?.attendance_late_cutoff || '10:00';
  const [cutoffH, cutoffM] = cutoffTime.split(':').map(Number);
  const cutoffMinutes = cutoffH * 60 + cutoffM;
  
  const staff = mockDb.profiles?.filter(p => p.role === 'Employee') || [];
  const selectedMonthLogs = mockDb.attendance?.filter(att => {
    if (!att.date) return false;
    const [y, m] = att.date.split('-');
    return parseInt(m) === analyticsMonth && parseInt(y) === analyticsYear;
  }) || [];

  const analyticsRows = staff.map(emp => {
    const empLogs = selectedMonthLogs.filter(log => log.employee_id === emp.id);
    const totalLogs = empLogs.length;

    const presentLogs = empLogs.filter(log => log.status === 'Present' || log.status === 'Paid-Leave' || log.status === 'Holiday');
    const attendancePct = totalLogs > 0 ? Math.round((presentLogs.length / totalLogs) * 100) : 0;

    const checkInLogs = empLogs.filter(log => log.check_in);
    const checkInMins = checkInLogs.map(log => {
      const d = new Date(log.check_in);
      return d.getHours() * 60 + d.getMinutes();
    });
    const avgMins = checkInMins.length > 0 ? checkInMins.reduce((a, b) => a + b, 0) / checkInMins.length : 0;
    const avgCheckInStr = checkInMins.length > 0 
      ? `${String(Math.floor(avgMins / 60)).padStart(2, '0')}:${String(Math.round(avgMins % 60)).padStart(2, '0')}`
      : 'N/A';

    const lateArrivalsCount = checkInLogs.filter(log => {
      const d = new Date(log.check_in);
      const mins = d.getHours() * 60 + d.getMinutes();
      return mins > cutoffMinutes;
    }).length;

    const checkOutLogs = empLogs.filter(log => log.check_out);
    const earlyDeparturesCount = checkOutLogs.filter(log => {
      const d = new Date(log.check_out);
      const mins = d.getHours() * 60 + d.getMinutes();
      return mins < 1020; // 5:00 PM
    }).length;

    const workedHoursLogs = empLogs.filter(log => log.worked_hours > 0).map(log => parseFloat(log.worked_hours) || 0);
    const avgWorkedHours = workedHoursLogs.length > 0
      ? (workedHoursLogs.reduce((a, b) => a + b, 0) / workedHoursLogs.length).toFixed(1)
      : '0.0';

    return {
      id: emp.id,
      name: emp.name,
      attendancePct,
      avgCheckInStr,
      lateArrivalsCount,
      earlyDeparturesCount,
      avgWorkedHours
    };
  });

  const exportAnalyticsToCSV = () => {
    let csv = `HR Analytics Report,Period: ${analyticsMonth}/${analyticsYear}\n`;
    csv += 'Employee Name,Avg Check-In Time,Late Arrivals (Count),Early Departures (Count),Avg Worked Hours/Day,Monthly Attendance %\n';
    
    analyticsRows.forEach(row => {
      csv += `"${row.name}",${row.avgCheckInStr},${row.lateArrivalsCount},${row.earlyDeparturesCount},${row.avgWorkedHours},"${row.attendancePct}%"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `HR-Analytics-${analyticsMonth}-${analyticsYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Analytics report downloaded successfully.', 'success');
  };

  const exportAuditLogsToCSV = () => {
    let csv = 'Audit Trail Log,Generated: ' + new Date().toLocaleDateString('en-IN') + '\n';
    csv += 'Timestamp,Actor User,Role,Action,Entity,Entity ID,IP Address\n';
    
    filteredAuditLogs.forEach(l => {
      const user = mockDb.profiles.find(p => p.id === l.actor_user_id);
      csv += `${l.timestamp},"${user ? user.name : l.actor_user_id}",${l.actor_role},${l.action},${l.entity_type},${l.entity_id},${l.ip_address}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'CA-Firm-Audit-Trail.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Audit Trail logs downloaded successfully.', 'success');
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar navigation */}
      <div className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>HR & Accounts</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Logged in: <strong style={{ color: 'var(--primary)' }}>{sessionUser?.name}</strong>
            </p>
          </div>
          <button 
            type="button" 
            className="mobile-close-btn" 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', flex: 1 }}>
          <button 
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            📋 Daily Attendance
          </button>
          
          <button 
            className={`btn ${activeTab === 'onboarding' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('onboarding'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            👥 Onboarding Approvals
            {pendingOnboardings.length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                {pendingOnboardings.length}
              </span>
            )}
          </button>

          <button 
            className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('leaves'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            🌴 Leaves Approval
            {pendingRequests.length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button 
            className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            👥 Staff Directory
          </button>
          <button 
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            ⚙️ Firm Settings
          </button>
          <button 
            className={`btn ${activeTab === 'archival' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('archival'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            ☁️ Cloud Backup
          </button>
          
          <button 
            className={`btn ${activeTab === 'timesheet_report' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('timesheet_report'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            📊 Timesheet Reports
          </button>

          <button 
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            📈 HR Analytics
          </button>

          <button 
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            🛡️ Secure Audit Log
          </button>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-card)' }}>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={logout}>
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-main">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰ Menu
            </button>
            <h2 style={{ fontSize: '1.15rem' }}>CA Practice Suite</h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Designation: <strong style={{ color: 'var(--primary)' }}>HR Manager</strong>
          </span>
        </header>

        <main className="app-content">
          {archiveError && (
            <div className="alert alert-danger mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', padding: '0.75rem 1.25rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <div>
                <strong>⚠️ Cloud Backup Alert:</strong> {archiveError}
              </div>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }} 
                onClick={() => setArchiveError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
          {/* TAB 1: Attendance Review & Approvals */}
          {activeTab === 'attendance' && (
            <div className="glass card-body">
              <div className="flex-between mb-4">
                <div>
                  <h3>📋 Daily Attendance Registry Review</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Verify check-in captures, selfie records, and click **Approve** to verify attendance days.
                  </p>
                </div>
                <div>
                  <input 
                    type="date" 
                    className="form-control"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Division</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Hours</th>
                      <th>GPS Verify</th>
                      <th>Selfie</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No check-in records found for this date.
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map(rec => {
                        const staff = mockDb.profiles?.find(e => e.id === rec.employee_id);
                        return (
                          <tr key={rec.id}>
                            <td style={{ fontWeight: '500' }}>{staff ? staff.name : 'Unknown'}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                {staff?.division || 'Audit Division'}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>
                              {rec.check_in ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>
                              {rec.check_out ? new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td>{rec.worked_hours ? `${rec.worked_hours} hrs` : '-'}</td>
                             <td>
                               {rec.check_in_mode === 'client' ? (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                   <span className="badge" style={{ backgroundColor: 'var(--secondary)', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.35rem', alignSelf: 'flex-start', borderRadius: '4px' }}>
                                     On-Site Audit
                                   </span>
                                   <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                     {mockDb.clients?.find(c => c.id === parseInt(rec.client_id))?.name || 'Client Site'}
                                   </span>
                                 </div>
                               ) : rec.latitude ? (
                                 <span style={{ 
                                   color: rec.distance_from_office > settingsForm.allowed_radius ? 'var(--danger)' : '#34d399',
                                   fontSize: '0.8rem',
                                   fontWeight: '600'
                                 }}>
                                   {Math.round(rec.distance_from_office)}m deviation
                                 </span>
                               ) : (
                                 <span style={{ color: 'var(--text-muted)' }}>No GPS logged</span>
                               )}
                             </td>
                            <td>
                              {rec.selfie_url ? (
                                <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedSelfie(rec.selfie_url)}>
                                  View Selfie
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>No Selfie</span>
                              )}
                            </td>
                            <td>
                              {rec.status === 'Holiday' ? (
                                <span className="badge badge-warning">Public Holiday</span>
                              ) : rec.approved_by_admin || rec.approved_by_admin === 'true' ? (
                                <span className="badge badge-success">Approved</span>
                              ) : (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={async () => {
                                    await approveAttendanceDay(rec.id);
                                    loadAttendance();
                                  }}
                                >
                                  Approve Login
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {selectedSelfie && (
                <div className="modal-overlay" onClick={() => setSelectedSelfie(null)}>
                  <div className="modal-content" style={{ maxWidth: '360px', padding: '1rem', background: '#0f172a' }}>
                    <div className="flex-between mb-2">
                      <h4 style={{ color: '#fff' }}>Selfie verification</h4>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedSelfie(null)}>&times;</button>
                    </div>
                    <img src={selectedSelfie} alt="Verification" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Onboarding approvals */}
          {activeTab === 'onboarding' && (
            <div className="glass card-body">
              <h3>👥 Onboarding Requests Verification</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Review self-onboarding employee applications. Assign basic salary and hourly rates to approve them into the Salary Register.
              </p>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Email</th>
                      <th>Allocated Division</th>
                      <th>Assign Monthly Salary (₹)</th>
                      <th>Assign Hourly Cost (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOnboardings.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No pending onboarding requests at this time.
                        </td>
                      </tr>
                    ) : (
                      pendingOnboardings.map(emp => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: '600' }}>{emp.name}</td>
                          <td>{emp.email}</td>
                          <td>
                            <span className="badge badge-info">{emp.division || 'Audit Division'}</span>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control"
                              placeholder="e.g. 40000"
                              style={{ width: '130px' }}
                              value={salaryInputs[emp.id] || ''}
                              onChange={(e) => setSalaryInputs(prev => ({ ...prev, [emp.id]: parseFloat(e.target.value) || 0 }))}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control"
                              placeholder="e.g. 250"
                              style={{ width: '100px' }}
                              value={hourlyRateInputs[emp.id] || ''}
                              onChange={(e) => setHourlyRateInputs(prev => ({ ...prev, [emp.id]: parseFloat(e.target.value) || 0 }))}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={async () => {
                                  const sal = salaryInputs[emp.id];
                                  const rate = hourlyRateInputs[emp.id];
                                  if (!sal || !rate) {
                                    alert('Please assign a valid monthly salary and hourly rate before approving.');
                                    return;
                                  }
                                  await approveOnboarding(emp.id, sal, rate);
                                  loadEmployees();
                                }}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to reject onboarding for ${emp.name}?`)) {
                                    await rejectOnboarding(emp.id);
                                    loadEmployees();
                                  }
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Leaves approval */}
          {activeTab === 'leaves' && (
            <div className="glass card-body">
              <h3>🌴 Leave Requests Manager</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Review pending leaves. Approval will decrement staff leave balances and auto-mark those dates in the registry.
              </p>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No pending leave requests.
                        </td>
                      </tr>
                    ) : (
                      pendingRequests.map(req => {
                        const staff = mockDb.profiles?.find(e => e.id === req.employee_id);
                        return (
                          <tr key={req.id}>
                            <td style={{ fontWeight: '500' }}>{staff ? staff.name : 'Unknown'}</td>
                            <td>{req.type}</td>
                            <td>
                              <strong>{req.from_date}</strong> to <strong>{req.to_date}</strong>
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>{req.reason}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleLeaveAction(req.id, 'Approved')}>
                                  Approve
                                </button>
                                <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleLeaveAction(req.id, 'Rejected')}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Staff Directory */}
          {activeTab === 'employees' && (
            <div className="glass card-body">
              <div className="flex-between mb-4">
                <div>
                  <h3>👥 Staff Directory & Pay Rates</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Configure basic salary, division allocations, and 2FA logins for team members.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="form-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Branch Filter:</label>
                    <select 
                      className="form-control form-select"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: '200px' }}
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="">-- All Branches --</option>
                      {branchesList.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={openNewEmployeeModal}>
                    + Add New Employee
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Branch & Division</th>
                      <th>Monthly Salary</th>
                      <th>Hourly Cost</th>
                      <th>PF / ESI Numbers</th>
                      <th>Leave Balances</th>
                      <th>Security</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter(emp => !branchFilter || emp.branch_id === branchFilter)
                      .map(emp => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: '600' }}>{emp.name}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</span></td>
                        <td>{emp.role}</td>
                        <td>
                          <span className="badge badge-info" style={{ display: 'block', marginBottom: '0.25rem' }}>
                            {(() => {
                              const b = branchesList.find(x => x.id === emp.branch_id);
                              return b ? b.name : 'Mumbai Head Office';
                            })()}
                          </span>
                          <span className="badge badge-outline" style={{ display: 'block', border: '1px solid var(--primary)', color: 'var(--primary)', textTransform: 'none' }}>
                            {emp.division || 'Audit & Assurance Services'}
                          </span>
                        </td>
                        <td>{formatIndianCurrency(emp.monthly_salary)}</td>
                        <td>{formatIndianCurrency(emp.hourly_rate)}/hr</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', display: 'block' }}>PF: {emp.pf_number || 'N/A'}</span>
                          <span style={{ fontSize: '0.75rem', display: 'block' }}>ESI: {emp.esi_number || 'N/A'}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          C: {emp.leave_balance_casual} | S: {emp.leave_balance_sick} | E: {emp.leave_balance_earned}
                        </td>
                        <td>
                          {emp.two_factor_enabled ? (
                            <span className="badge badge-success">2FA Enabled</span>
                          ) : (
                            <span className="badge badge-info">Standard</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => openEditEmployeeModal(emp)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Employee Modifying Modal */}
              {showEmpModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editingEmp ? 'Edit Profile' : 'Register Employee'}</h3>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowEmpModal(false)}>&times;</button>
                    </div>
                    <form onSubmit={handleSaveEmployee}>
                      <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            required 
                            value={empForm.name} 
                            onChange={(e) => setEmpForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <input 
                            type="email" 
                            className="form-control" 
                            required 
                            value={empForm.email} 
                            onChange={(e) => setEmpForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Firm Role</label>
                          <select 
                            className="form-control form-select"
                            value={empForm.role}
                            onChange={(e) => setEmpForm(prev => ({ ...prev, role: e.target.value }))}
                          >
                            <option value="Employee">Employee</option>
                            <option value="HR">HR Manager</option>
                            <option value="Partner">Partner</option>
                            <option value="Accounts">Accounts Officer</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Division Allocation</label>
                          <select 
                            className="form-control form-select"
                            value={empForm.division}
                            onChange={(e) => setEmpForm(prev => ({ ...prev, division: e.target.value }))}
                          >
                            <option value="Audit & Assurance Services">Audit & Assurance Services</option>
                            <option value="Other Professional Services">Other Professional Services</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Branch Location</label>
                          <select 
                            className="form-control form-select"
                            required
                            value={empForm.branch_id || ''}
                            onChange={(e) => setEmpForm(prev => ({ ...prev, branch_id: e.target.value }))}
                          >
                            {branchesList.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid-2">
                          <div className="form-group">
                            <label className="form-label">Monthly Salary (₹)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              required 
                              value={empForm.monthly_salary} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, monthly_salary: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Hourly Rate (₹)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              required 
                              value={empForm.hourly_rate} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>

                        <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                          <div className="form-group">
                            <label className="form-label">Provident Fund (PF) Number</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={empForm.pf_number || ''} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, pf_number: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">ESI Number</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={empForm.esi_number || ''} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, esi_number: e.target.value }))}
                            />
                          </div>
                        </div>

                        <p className="form-label mb-2" style={{ marginTop: '0.5rem' }}>Initial Leave Balances</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                          <div className="form-group">
                            <label className="form-label">Casual</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={empForm.leave_balance_casual} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, leave_balance_casual: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Sick</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={empForm.leave_balance_sick} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, leave_balance_sick: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Earned</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={empForm.leave_balance_earned} 
                              onChange={(e) => setEmpForm(prev => ({ ...prev, leave_balance_earned: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            id="2fa_check"
                            checked={empForm.two_factor_enabled} 
                            onChange={(e) => setEmpForm(prev => ({ ...prev, two_factor_enabled: e.target.checked }))}
                          />
                          <label htmlFor="2fa_check" className="form-label" style={{ cursor: 'pointer' }}>Enforce 2-Factor Authentication OTP at login</label>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button className="btn btn-primary" type="submit">Save Profile</button>
                        <button className="btn btn-outline" type="button" onClick={() => setShowEmpModal(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Branch Modifying Modal */}
          {showBranchModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{editingBranch ? 'Edit Branch Location' : 'Add Branch Location'}</h3>
                  <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowBranchModal(false)}>&times;</button>
                </div>
                <form onSubmit={handleSaveBranch}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Branch Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={branchForm.name} 
                        onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Address</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        required 
                        value={branchForm.address} 
                        onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Partner in Charge</label>
                      <select 
                        className="form-control form-select"
                        required
                        value={branchForm.partner_in_charge_id}
                        onChange={(e) => setBranchForm(prev => ({ ...prev, partner_in_charge_id: e.target.value }))}
                      >
                        <option value="">-- Choose Partner --</option>
                        {mockDb.profiles?.filter(p => p.role === 'Partner').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">HR Administrator</label>
                      <select 
                        className="form-control form-select"
                        required
                        value={branchForm.hr_administrator_id}
                        onChange={(e) => setBranchForm(prev => ({ ...prev, hr_administrator_id: e.target.value }))}
                      >
                        <option value="">-- Choose HR Manager / Partner --</option>
                        {mockDb.profiles?.filter(p => p.role === 'HR' || p.role === 'Partner').map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-primary" type="submit">Save Branch</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowBranchModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* TAB 4: Settings & Statutory Rates & Holidays */}
      {activeTab === 'settings' && (
        <div className="glass card-body">
          <h3>⚙️ Firm Configuration & Statutory Rates</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Manage GPS attendance fence, branch locations, and statutory deduction rates.
          </p>

          <form onSubmit={handleSaveSettings}>
            <h4 className="mb-2" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.4rem' }}>
              🏢 CA Firm Profile & Branch Locations
            </h4>
            <div className="grid-2 mb-4">
              <div className="form-group">
                <label className="form-label">CA Firm Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  value={settingsForm.firm_name}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, firm_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Head Office Address</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  required
                  value={settingsForm.firm_address}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, firm_address: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--primary)', margin: 0 }}>
                📍 Branch Locations Register
              </h4>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={openNewBranchModal}>
                + Add Branch Location
              </button>
            </div>

            <div className="table-container mb-4" style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Address</th>
                    <th>Partner in Charge</th>
                    <th>HR Administrator</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branchesList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No branches configured. Click "+ Add Branch Location" to add.
                      </td>
                    </tr>
                  ) : (
                    branchesList.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '600' }}>{b.name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{b.address}</td>
                        <td>
                          {(() => {
                            const partner = mockDb.profiles?.find(p => p.id === b.partner_in_charge_id);
                            return partner ? partner.name : b.partner_in_charge_id || 'Unassigned';
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const hr = mockDb.profiles?.find(p => p.id === b.hr_administrator_id);
                            return hr ? hr.name : b.hr_administrator_id || 'Unassigned';
                          })()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEditBranchModal(b)}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => deleteBranch(b.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h4 className="mb-2" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.4rem' }}>
              📍 Geofencing & Verification
            </h4>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Office Latitude</label>
                    <input 
                      type="number" 
                      step="0.000001" 
                      className="form-control"
                      value={settingsForm.office_lat}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, office_lat: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Office Longitude</label>
                    <input 
                      type="number" 
                      step="0.000001" 
                      className="form-control"
                      value={settingsForm.office_lng}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, office_lng: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Allowed Radius (meters)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={settingsForm.allowed_radius}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, allowed_radius: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                </div>

                <div className="grid-3 mb-4">
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="set_require_selfie"
                      checked={settingsForm.require_selfie}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, require_selfie: e.target.checked }))}
                    />
                    <label htmlFor="set_require_selfie" className="form-label" style={{ cursor: 'pointer' }}>Require Selfie check-in</label>
                  </div>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="set_require_geo"
                      checked={settingsForm.require_geo}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, require_geo: e.target.checked }))}
                    />
                    <label htmlFor="set_require_geo" className="form-label" style={{ cursor: 'pointer' }}>Restrict Check-in to office radius</label>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Late Arrival Cutoff Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10:00"
                      className="form-control"
                      value={settingsForm.attendance_late_cutoff}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, attendance_late_cutoff: e.target.value }))}
                    />
                  </div>
                </div>

                <h4 className="mb-2" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.4rem' }}>
                  🇮🇳 Statutory Deductions (PF / ESI / TDS)
                </h4>
                <div className="alert alert-danger" style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                  ⚠️ <strong>Disclaimer:</strong> Statutory rates must be entered and verified by the firm against current Indian laws before finalizing payroll. 
                </div>

                <div className="grid-3 mb-4">
                  <div className="form-group">
                    <label className="form-label">Provident Fund (PF) Rate %</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g. 12" 
                      className="form-control"
                      value={settingsForm.pf_rate}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, pf_rate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ESI Rate %</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g. 0.75" 
                      className="form-control"
                      value={settingsForm.esi_rate}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, esi_rate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TDS Rate %</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g. 10" 
                      className="form-control"
                      value={settingsForm.tds_rate}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, tds_rate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3', borderTop: '1px dashed var(--border-card)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 'bold' }}>Professional Tax (PT) Slabs Configuration</label>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                      Define slabs by state/salary range. Net Payable will subtract matching slab amount. Rates must be verified against current state law by the firm.
                    </p>
                    
                    {ptSlabs.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        No slabs configured. Please add slab ranges to calculate PT during payroll.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                          <div>Salary Min (₹)</div>
                          <div>Salary Max (₹)</div>
                          <div>Deduction Amt (₹)</div>
                          <div style={{ width: '28px' }}></div>
                        </div>
                        {ptSlabs.map((slab, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                              value={slab.min} 
                              onChange={(e) => updateSlab(i, 'min', parseFloat(e.target.value) || 0)} 
                            />
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                              value={slab.max} 
                              onChange={(e) => updateSlab(i, 'max', parseFloat(e.target.value) || 0)} 
                            />
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                              value={slab.amt} 
                              onChange={(e) => updateSlab(i, 'amt', parseFloat(e.target.value) || 0)} 
                            />
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              style={{ padding: '0.2rem 0.4rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', borderRadius: '4px' }} 
                              onClick={() => removeSlab(i)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', width: 'fit-content' }} 
                      onClick={addSlab}
                    >
                      + Add Slab Range
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary" type="submit">Save Configurations</button>
              </form>

              {/* Public Holidays Management Section */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem' }}>
                <h4 className="mb-2" style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📅 Public Holidays Register</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fed on 1st of April annually</span>
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                  Define holiday dates. Approved employees auto-receive paid holiday status (and full salary check-in credit) for these days.
                </p>

                <div className="grid-2">
                  {/* List of holidays */}
                  <div className="glass card-body" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active Holidays</p>
                    {mockDb.settings?.public_holidays ? (
                      (() => {
                        const list = JSON.parse(mockDb.settings.public_holidays);
                        if (list.length === 0) return <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No public holidays seeded.</p>;
                        return list.sort((a,b) => a.date.localeCompare(b.date)).map((h, i) => (
                          <div key={i} className="flex-between mb-2" style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                            <span><strong>{h.date}</strong> - {h.description}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>FY {h.year}</span>
                          </div>
                        ));
                      })()
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No public holidays found.</p>
                    )}
                  </div>

                  {/* Add holiday form */}
                  <div className="glass card-body">
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Add Holiday Entry</p>
                    <div className="form-group">
                      <label className="form-label">Holiday Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        id="new_holiday_date"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Independence Day"
                        id="new_holiday_desc"
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary mt-1" 
                      style={{ width: '100%' }}
                      onClick={async () => {
                        const date = document.getElementById('new_holiday_date').value;
                        const desc = document.getElementById('new_holiday_desc').value;
                        if (!date || !desc) {
                          alert('Please specify both date and description.');
                          return;
                        }
                        await savePublicHoliday(date, desc);
                        document.getElementById('new_holiday_date').value = '';
                        document.getElementById('new_holiday_desc').value = '';
                        loadSettings();
                      }}
                    >
                      Save Holiday Entry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Cloud Backup & Archival Logs */}
          {activeTab === 'archival' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass card-body">
                <h3>☁️ Cloud Archival Integration (Google Drive / Dropbox)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Save copies of monthly attendance registers, salary ledgers, and payslip folders automatically.
                </p>

                <div className="grid-2 mb-4">
                  {/* Google Drive Integration card */}
                  <div className="glass card-body" style={{ borderColor: driveConnectedEmail ? 'var(--secondary)' : 'var(--border-card)' }}>
                    <div className="flex-between mb-2">
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>Google Drive</strong>
                      <span className={`badge ${driveConnectedEmail ? 'badge-success' : 'badge-info'}`}>
                        {driveConnectedEmail ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      Connects with `drive.file` scope (only interacts with documents it creates for maximum security).
                    </p>
                    {driveConnectedEmail && (
                      <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', marginBottom: '1rem' }}>
                        🟢 Connected as {driveConnectedEmail}
                      </p>
                    )}
                    <div className="form-group">
                      <label className="form-label">Root Folder Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="CA-Firm-Records"
                        value={settingsForm.google_drive_folder_id}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, google_drive_folder_id: e.target.value }))}
                      />
                    </div>
                    <button className={`btn ${driveConnectedEmail ? 'btn-danger' : 'btn-primary'} mt-2`} style={{ width: '100%' }} onClick={toggleGoogleDrive}>
                      {driveConnectedEmail ? 'Disconnect' : 'Connect Google Drive OAuth'}
                    </button>
                  </div>

                  {/* Dropbox Integration Card */}
                  <div className="glass card-body" style={{ borderColor: dropboxConnectedEmail ? 'var(--secondary)' : 'var(--border-card)' }}>
                    <div className="flex-between mb-2">
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>Dropbox Business</strong>
                      <span className={`badge ${dropboxConnectedEmail ? 'badge-success' : 'badge-info'}`}>
                        {dropboxConnectedEmail ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      Archival with short-lived tokens and secure offline `files.content.write` permissions.
                    </p>
                    {dropboxConnectedEmail && (
                      <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', marginBottom: '1rem' }}>
                        🟢 Connected as {dropboxConnectedEmail}
                      </p>
                    )}
                    <div className="form-group">
                      <label className="form-label">Dropbox Archival Path</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="/CA-Firm-Records"
                        value={settingsForm.dropbox_folder_path}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, dropbox_folder_path: e.target.value }))}
                      />
                    </div>
                    <button className={`btn ${dropboxConnectedEmail ? 'btn-danger' : 'btn-primary'} mt-2`} style={{ width: '100%' }} onClick={toggleDropbox}>
                      {dropboxConnectedEmail ? 'Disconnect' : 'Connect Dropbox OAuth'}
                    </button>
                  </div>
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem' }}>
                  <div>
                    <h4>Manual Archive Backup</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Click to trigger immediate compile & upload of registers for month/year.</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        className="form-control form-select" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '130px' }}
                        value={reportMonth} 
                        onChange={(e) => setReportMonth(parseInt(e.target.value))}
                      >
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                      <select 
                        className="form-control form-select" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '90px' }}
                        value={reportYear} 
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-secondary" onClick={triggerManualBackup} disabled={backupLoading}>
                    {backupLoading ? 'Uploading...' : '☁️ Backup Now'}
                  </button>
                </div>
              </div>

              {/* Archive Logs list */}
              <div className="glass card-body">
                <h3>📜 Cloud Backup Logs</h3>
                <div className="table-container mt-4">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Archive Month</th>
                        <th>Cloud Provider</th>
                        <th>Files Uploaded</th>
                        <th>Status</th>
                        <th>Run Date</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archiveLogs.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No backup runs recorded yet. Finalizing payroll or backing up now will trigger entries.
                          </td>
                        </tr>
                      ) : (
                        archiveLogs.map(log => (
                          <tr key={log.id}>
                            <td><strong>{log.month}/{log.year}</strong></td>
                            <td>{log.provider === 'google_drive' ? 'Google Drive' : 'Dropbox'}</td>
                            <td>{log.files_uploaded} items</td>
                            <td>
                              <span className={`badge ${log.status === 'Success' ? 'badge-success' : 'badge-danger'}`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{new Date(log.run_at).toLocaleString('en-IN')}</td>
                            <td style={{ fontSize: '0.8rem', color: log.status === 'Failed' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                              {log.error_message || 'Uploaded successfully to /CA-Firm-Records/2026/06-June/'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Timesheet Reports */}
          {activeTab === 'timesheet_report' && (() => {
            const assignmentsList = mockDb.assignments || [];
            const timesheetRecords = mockDb.timesheets || [];
            
            const monthlyTimesheets = timesheetRecords.filter(t => {
              const [y, m] = t.date.split('-');
              return parseInt(y) === reportYear && parseInt(m) === reportMonth;
            });

            const hoursPerAssignment = assignmentsList.map(a => {
              const client = mockDb.clients?.find(c => c.id === a.client_id);
              const loggedHours = monthlyTimesheets
                .filter(t => t.assignment_id === a.id)
                .reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);
              return {
                id: a.id,
                title: a.title,
                clientName: client ? client.name : 'Unknown',
                hours: loggedHours
              };
            }).filter(a => a.hours > 0);

            const employeesList = mockDb.profiles?.filter(p => p.role === 'Employee') || [];
            const attendanceRecords = mockDb.attendance || [];
            
            const employeeUtilization = employeesList.map(emp => {
              const empTimesheets = monthlyTimesheets.filter(t => t.employee_id === emp.id);
              const chargeable = empTimesheets.reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);
              
              const empAttendance = attendanceRecords.filter(a => {
                const [y, m] = a.date.split('-');
                return a.employee_id === emp.id && parseInt(y) === reportYear && parseInt(m) === reportMonth && a.status === 'Present';
              });
              const worked = empAttendance.reduce((sum, a) => sum + parseFloat(a.worked_hours || 0), 0);
              const utilization = worked > 0 ? Math.round((chargeable / worked) * 100) : 0;
              
              return {
                id: emp.id,
                name: emp.name,
                chargeable,
                worked,
                utilization
              };
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass card-body">
                  <div className="flex-between mb-4">
                    <div>
                      <h3>📊 Timesheet & Utilization Analytics</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Analyze employee billable performance, hours spent per engagement, and utilization metrics.
                      </p>
                    </div>
                    
                    {/* Period filters */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        className="form-control form-select"
                        style={{ padding: '0.35rem 0.5rem', width: '130px' }}
                        value={reportMonth}
                        onChange={(e) => setReportMonth(parseInt(e.target.value))}
                      >
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                      <select 
                        className="form-control form-select"
                        style={{ padding: '0.35rem 0.5rem', width: '90px' }}
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2 mt-4">
                    {/* Report 1: Hours per assignment */}
                    <div className="glass card-body">
                      <h4 className="mb-3" style={{ color: '#fff' }}>📋 Engagement Hours Distribution</h4>
                      <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Engagement / Task</th>
                              <th>Client</th>
                              <th style={{ textAlign: 'right' }}>Total Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hoursPerAssignment.length === 0 ? (
                              <tr>
                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                  No hours logged for this period.
                                </td>
                              </tr>
                            ) : (
                              hoursPerAssignment.map(a => (
                                <tr key={a.id}>
                                  <td style={{ fontWeight: '500' }}>{a.title}</td>
                                  <td>{a.clientName}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {a.hours} hrs
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Report 2: Employee utilization */}
                    <div className="glass card-body">
                      <h4 className="mb-3" style={{ color: '#fff' }}>👥 Employee Resource Utilization</h4>
                      <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Staff Member</th>
                              <th style={{ textAlign: 'center' }}>Chargeable</th>
                              <th style={{ textAlign: 'center' }}>Total Worked</th>
                              <th style={{ textAlign: 'right' }}>Utilization %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeUtilization.map(emp => (
                              <tr key={emp.id}>
                                <td style={{ fontWeight: '500' }}>{emp.name}</td>
                                <td style={{ textAlign: 'center' }}>{emp.chargeable} hrs</td>
                                <td style={{ textAlign: 'center' }}>{emp.worked} hrs</td>
                                <td style={{ textAlign: 'right' }}>
                                  <span className={`badge ${
                                    emp.utilization >= 75 ? 'badge-success' : 
                                    emp.utilization >= 50 ? 'badge-warning' : 'badge-danger'
                                  }`} style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    {emp.utilization}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 8: HR Analytics */}
          {activeTab === 'analytics' && (
            <div className="glass card-body">
              <div className="flex-between mb-4">
                <div>
                  <h3>📈 HR Attendance Analytics Dashboard</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Analyze check-in distributions, late arrivals, early departures, and attendance ratios.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="form-control" 
                    style={{ width: '130px' }}
                    value={analyticsMonth} 
                    onChange={(e) => setAnalyticsMonth(parseInt(e.target.value))}
                  >
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <select 
                    className="form-control" 
                    style={{ width: '100px' }}
                    value={analyticsYear} 
                    onChange={(e) => setAnalyticsYear(parseInt(e.target.value))}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                  <button className="btn btn-outline" onClick={exportAnalyticsToCSV}>
                    📥 Export Report
                  </button>
                </div>
              </div>

              {/* Charts grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="glass card-body" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)' }}>
                  <h4 className="mb-3" style={{ color: '#fff' }}>📅 Monthly Attendance % per Employee</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsRows.map(row => (
                      <div key={row.id}>
                        <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          <span>{row.name}</span>
                          <strong>{row.attendancePct}%</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${row.attendancePct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-glow) 100%)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass card-body" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)' }}>
                  <h4 className="mb-3" style={{ color: '#fff' }}>🚨 Count of Late Arrivals (after {cutoffTime})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsRows.map(row => (
                      <div key={row.id}>
                        <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          <span>{row.name}</span>
                          <strong>{row.lateArrivalsCount} Late</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.lateArrivalsCount / 22) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table section */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th style={{ textAlign: 'center' }}>Avg Check-In Time</th>
                      <th style={{ textAlign: 'center' }}>Late Arrivals</th>
                      <th style={{ textAlign: 'center' }}>Early Departures</th>
                      <th style={{ textAlign: 'center' }}>Avg Worked Hours/Day</th>
                      <th style={{ textAlign: 'right' }}>Monthly Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsRows.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No staff found.
                        </td>
                      </tr>
                    ) : (
                      analyticsRows.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: '600' }}>{row.name}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{row.avgCheckInStr}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={row.lateArrivalsCount > 3 ? 'badge badge-danger' : 'badge badge-info'}>
                              {row.lateArrivalsCount} times
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={row.earlyDeparturesCount > 3 ? 'badge badge-warning' : 'badge badge-info'}>
                              {row.earlyDeparturesCount} times
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.avgWorkedHours} hrs</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {row.attendancePct}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="glass card-body">
              <div className="flex-between mb-4">
                <div>
                  <h3>🛡️ Secure System Audit Trail Log</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Tamper-proof registers of employee updates, salary edits, and check-in overrides.
                  </p>
                </div>
                <button className="btn btn-outline" onClick={exportAuditLogsToCSV}>
                  📥 Export Logs to Excel (.csv)
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Employee / Actor</label>
                  <select 
                    className="form-control form-select"
                    value={auditActorFilter}
                    onChange={(e) => setAuditActorFilter(e.target.value)}
                  >
                    <option value="">-- All Employees --</option>
                    {mockDb.profiles?.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Action Type</label>
                  <select 
                    className="form-control form-select"
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                  >
                    <option value="">-- All Actions --</option>
                    <option value="Created">Created</option>
                    <option value="Updated">Updated</option>
                    <option value="Deleted">Deleted</option>
                    <option value="Finalized">Finalized</option>
                    <option value="Unlocked">Unlocked</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={auditDateStart}
                    onChange={(e) => setAuditDateStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={auditDateEnd}
                    onChange={(e) => setAuditDateEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp (IST)</th>
                      <th>Actor</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No audit records found matching these filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map(log => {
                        const actor = mockDb.profiles?.find(p => p.id === log.actor_user_id);
                        return (
                          <tr key={log.id}>
                            <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              {new Date(log.timestamp).toLocaleString('en-IN')}
                            </td>
                            <td style={{ fontWeight: '500' }}>{actor ? actor.name : log.actor_user_id}</td>
                            <td>{log.actor_role}</td>
                            <td>
                              <span className={`badge ${
                                log.action === 'Created' ? 'badge-success' :
                                log.action === 'Updated' ? 'badge-info' :
                                log.action === 'Deleted' ? 'badge-danger' : 'badge-warning'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td>{log.entity_type} (ID: {log.entity_id})</td>
                            <td style={{ fontSize: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(log.new_value || log.old_value)}>
                              {log.new_value ? JSON.stringify(log.new_value) : log.old_value ? JSON.stringify(log.old_value) : ''}
                            </td>
                            <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.ip_address}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
