import React, { useState, useEffect } from 'react';
import { useApp, getISTDateString, getISTTimeString, formatIndianCurrency } from '../context/AppContext';
import { SelfieCamera } from './SelfieCamera';
import { GeoPicker } from './GeoPicker';

export const EmployeeDashboard = () => {
  const {
    sessionUser,
    mockDb,
    checkIn,
    checkOut,
    getAttendance,
    getSettings,
    getLeaveRequests,
    applyLeave,
    getAssignments,
    updateAssignmentStatus,
    getTimesheets,
    saveTimesheet,
    addNotification,
    logout
  } = useApp();

  const [activeTab, setActiveTab] = useState('attendance');
  const [settings, setSettings] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Attendance clock state
  const [todayRecord, setTodayRecord] = useState(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [selfie, setSelfie] = useState('');
  const [coords, setCoords] = useState({ latitude: null, longitude: null, distance: 0 });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [checkInMode, setCheckInMode] = useState('office'); // 'office' or 'client'
  const [selectedClientId, setSelectedClientId] = useState('');

  // Attendance Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Leave Form state
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);

  // Timesheet grid state
  const [timesheetWeekStart, setTimesheetWeekStart] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [timesheetRows, setTimesheetRows] = useState([]);
  const [tsSelectedAssignment, setTsSelectedAssignment] = useState('');
  const [tsNote, setTsNote] = useState('');
  const [tsHours, setTsHours] = useState({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 });

  // Assignments state
  const [assignments, setAssignments] = useState([]);

  // Payslips state
  const [finalizedPayslips, setFinalizedPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [surveillanceConsent, setSurveillanceConsent] = useState(false);

  // Initialize
  useEffect(() => {
    loadSettings();
    loadAttendance();
    loadLeaves();
    loadAssignments();
    initTimesheetWeek();
    loadPayslips();
  }, [mockDb, sessionUser]);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const loadAttendance = async () => {
    if (!sessionUser) return;
    const todayStr = getISTDateString();
    
    // Find today's check-in
    const history = await getAttendance(sessionUser.id, new Date().getMonth() + 1, new Date().getFullYear());
    setAttendanceHistory(history.sort((a, b) => b.date.localeCompare(a.date)));

    const today = history.find(h => h.date === todayStr);
    setTodayRecord(today);
  };

  const loadLeaves = async () => {
    if (!sessionUser) return;
    const leaves = await getLeaveRequests(sessionUser.id);
    setLeaveHistory(leaves.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  };

  const loadAssignments = async () => {
    if (!sessionUser) return;
    const a = await getAssignments(sessionUser.id);
    setAssignments(a.sort((x, y) => x.is_completed - y.is_completed));
    setMyAssignments(a);
  };

  const loadPayslips = async () => {
    if (!sessionUser) return;
    const runs = mockDb.payrollRuns || [];
    const salaries = mockDb.salaries || [];
    
    const slips = [];
    salaries.forEach(s => {
      if (s.employee_id === sessionUser.id) {
        const run = runs.find(r => r.id === s.payroll_run_id);
        if (run && run.status === 'Finalized') {
          slips.push({
            salary: s,
            run
          });
        }
      }
    });
    setFinalizedPayslips(slips);
  };

  // Timesheet logic
  const initTimesheetWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0,0,0,0);
    setTimesheetWeekStart(monday);
    generateWeekDates(monday);
  };

  const generateWeekDates = (monday) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
    loadTimesheetData(dates);
  };

  const loadTimesheetData = async (dates) => {
    if (!sessionUser) return;
    const startStr = getISTDateString(dates[0]);
    const endStr = getISTDateString(dates[6]);
    const allTs = await getTimesheets(sessionUser.id);
    
    const filtered = allTs.filter(t => t.date >= startStr && t.date <= endStr);
    
    const grouped = {};
    filtered.forEach(item => {
      const aId = item.assignment_id;
      if (!grouped[aId]) {
        const assign = mockDb.assignments.find(a => a.id === aId);
        grouped[aId] = {
          assignmentId: aId,
          title: assign ? assign.title : 'Unknown Assignment',
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
          notes: {}
        };
      }

      const dateObj = new Date(item.date);
      const dayIndex = dateObj.getDay();
      const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const key = keys[dayIndex];
      grouped[aId][key] = item.hours;
      grouped[aId].notes[key] = item.note;
    });

    setTimesheetRows(Object.values(grouped));
  };

  const handlePrevWeek = () => {
    const d = new Date(timesheetWeekStart);
    d.setDate(timesheetWeekStart.getDate() - 7);
    setTimesheetWeekStart(d);
    generateWeekDates(d);
  };

  const handleNextWeek = () => {
    const d = new Date(timesheetWeekStart);
    d.setDate(timesheetWeekStart.getDate() + 7);
    setTimesheetWeekStart(d);
    generateWeekDates(d);
  };

  const submitTimesheet = async (e) => {
    e.preventDefault();
    if (!tsSelectedAssignment) {
      alert('Please select an assignment.');
      return;
    }

    const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (let i = 0; i < 7; i++) {
      const dayKey = weekdays[i];
      const hours = tsHours[dayKey];
      if (hours > 0) {
        const dateStr = getISTDateString(weekDates[i]);
        await saveTimesheet(dateStr, tsSelectedAssignment, hours, tsNote || 'Log');
      }
    }

    addNotification('Timesheet hours recorded successfully.', 'success');
    setTsSelectedAssignment('');
    setTsNote('');
    setTsHours({ mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 });
    loadTimesheetData(weekDates);
  };

  // Check In/Out
  const handleCheckIn = async () => {
    try {
      if (settings?.require_selfie || settings?.require_geo) {
        if (!surveillanceConsent) {
          alert('Under India\'s DPDP Act, you must provide written consent for selfie/location collection to check in.');
          return;
        }
      }
      if (settings?.require_selfie && !selfie) {
        alert('Selfie verification is required.');
        return;
      }
      if (checkInMode === 'client' && !selectedClientId) {
        alert('Please select a client for client-site check-in.');
        return;
      }
      await checkIn(selfie, coords.latitude, coords.longitude, checkInMode, selectedClientId ? parseInt(selectedClientId) : null);
      addNotification('Checked In successfully for today. Pending Admin approval.', 'success');
      setShowCheckInForm(false);
      setSelfie('');
      setSurveillanceConsent(false);
      setCheckInMode('office');
      setSelectedClientId('');
      loadAttendance();
    } catch (err) {
      alert(err.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      addNotification('Checked Out successfully for today.', 'success');
      loadAttendance();
    } catch (err) {
      alert(err.message || 'Check-out failed.');
    }
  };

  // Leave Submit
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo) {
      alert('Please specify from & to dates.');
      return;
    }
    try {
      await applyLeave(leaveType, leaveFrom, leaveTo, leaveReason);
      addNotification('Leave application submitted to HR.', 'info');
      setLeaveFrom('');
      setLeaveTo('');
      setLeaveReason('');
      loadLeaves();
    } catch (err) {
      alert(err.message);
    }
  };

  // Assignment status update
  const handleStatusChange = async (id, newStatus) => {
    const isCompleted = newStatus === 'Completed';
    await updateAssignmentStatus(id, newStatus, isCompleted);
    addNotification(`Assignment status updated to: ${newStatus}`, 'success');
    loadAssignments();
  };

  const getDayName = (idx) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[idx];
  };

  // Calendar render helpers
  const getDaysInMonth = (m, y) => {
    return new Date(y, m, 0).getDate();
  };

  const getFirstDayOfMonth = (m, y) => {
    const day = new Date(y, m - 1, 1).getDay();
    // Adjust: 0 = Mon, 1 = Tue, ..., 6 = Sun
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const startOffset = getFirstDayOfMonth(calendarMonth, calendarYear);
    const cells = [];

    // Empty cells padding
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    // Days cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = calendarMonth < 10 ? `0${calendarMonth}` : `${calendarMonth}`;
      const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;

      // Check attendance registry
      // Note: mockDb.attendance has all logs
      const rec = (mockDb.attendance || []).find(a => a.employee_id === sessionUser.id && a.date === dateStr);
      
      // Check if this date is a configured public holiday in settings
      let holidayObj = null;
      if (settings?.public_holidays) {
        const hList = JSON.parse(settings.public_holidays);
        holidayObj = hList.find(h => h.date === dateStr);
      }

      let cellClass = 'absent';
      let statusText = 'Absent';
      let hoverText = '';

      const dayOfWeek = new Date(dateStr).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (holidayObj) {
        cellClass = 'holiday';
        statusText = holidayObj.description;
      } else if (rec) {
        if (rec.status === 'Holiday') {
          cellClass = 'holiday';
          statusText = 'Public Holiday';
        } else if (rec.status === 'Paid-Leave') {
          cellClass = 'leave';
          statusText = 'Paid Leave';
        } else if (rec.status === 'Present') {
          if (rec.approved_by_admin || rec.approved_by_admin === 'true' || rec.approved_by_admin === true) {
            cellClass = 'present-approved';
            statusText = 'Present (Approved)';
          } else {
            cellClass = 'present-pending';
            statusText = 'Pending Approval';
          }
          const checkInTimeStr = rec.check_in ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
          const checkOutTimeStr = rec.check_out ? new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
          hoverText = `In: ${checkInTimeStr} | Out: ${checkOutTimeStr || 'Pending'}`;
        }
      } else if (isWeekend) {
        cellClass = 'weekend';
        statusText = 'Weekend';
      }

      cells.push(
        <div key={day} className={`calendar-cell ${cellClass}`}>
          <span className="calendar-day-num">{day}</span>
          <span className="calendar-day-status" style={{ fontSize: '0.6rem', textAlign: 'right' }}>{statusText}</span>
          {hoverText && (
            <span className="calendar-day-hover" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
              {hoverText}
            </span>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <div className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Employee Portal</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Logged in: <strong style={{ color: 'var(--primary)' }}>{sessionUser?.name}</strong><br />
              Division: <span style={{ color: 'var(--secondary)', fontSize: '0.7rem' }}>{sessionUser?.division || 'Audit & Assurance Services'}</span>
              {sessionUser?.branch_id && settings?.branches && (
                <>
                  <br />
                  Branch: <span style={{ color: 'var(--primary)', fontSize: '0.7rem' }}>
                    {(() => {
                      try {
                        const branches = JSON.parse(settings.branches);
                        const branch = branches.find(b => b.id === sessionUser.branch_id);
                        return branch ? branch.name : 'Unknown';
                      } catch (e) {
                        return 'N/A';
                      }
                    })()}
                  </span>
                </>
              )}
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
            🕒 Attendance Register
          </button>
          <button 
            className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('calendar'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            📅 Attendance Calendar
          </button>
          <button 
            className={`btn ${activeTab === 'timesheet' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('timesheet'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            📅 Weekly Timesheet
          </button>
          <button 
            className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('leaves'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            🌴 Leave & Holidays
          </button>
          <button 
            className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('assignments'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            📋 Work Assignments
          </button>
          <button 
            className={`btn ${activeTab === 'payslips' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab('payslips'); setMobileMenuOpen(false); }}
            style={{ justifyContent: 'flex-start' }}
          >
            💵 Monthly Payslips
          </button>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-card)' }}>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={logout}>
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* Main Panel */}
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
            <strong>{getISTDateString()}</strong> <span className="hide-on-mobile">{getISTTimeString().substring(0, 5)}</span>
          </span>
        </header>

        <main className="app-content">
          {/* TAB 1: Attendance clock-in */}
          {activeTab === 'attendance' && (
            <div className="grid-2">
              <div className="glass card-body">
                <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🕒 Daily Check-In/Out
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Standard salary is computed based on divisor <strong>22</strong>. Confirm your daily clock timing.
                </p>

                {todayRecord ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="flex-between">
                      <span>Status:</span>
                      <span className="badge badge-success">Checked In</span>
                    </div>
                    <div className="flex-between">
                      <span>Check-In time:</span>
                      <strong style={{ color: 'var(--primary)' }}>
                        {new Date(todayRecord.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                    <div className="flex-between">
                      <span>Check-Out time:</span>
                      {todayRecord.check_out ? (
                        <strong style={{ color: 'var(--secondary)' }}>
                          {new Date(todayRecord.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not clocked out yet</span>
                      )}
                    </div>
                    {todayRecord.worked_hours > 0 && (
                      <div className="flex-between">
                        <span>Total Hours worked:</span>
                        <strong>{todayRecord.worked_hours} hrs</strong>
                      </div>
                    )}
                    {!todayRecord.check_out && (
                      <button className="btn btn-danger mt-2" onClick={handleCheckOut}>
                        Clock Out Now
                      </button>
                    )}
                  </div>
                ) : showCheckInForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Check-In Mode</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            flex: 1,
                            backgroundColor: checkInMode === 'office' ? 'var(--primary)' : 'transparent',
                            borderColor: checkInMode === 'office' ? 'var(--primary)' : 'var(--border-card)',
                            color: checkInMode === 'office' ? '#fff' : 'var(--text-secondary)'
                          }}
                          onClick={() => {
                            setCheckInMode('office');
                            setSelectedClientId('');
                          }}
                        >
                          Office Check-In
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            flex: 1,
                            backgroundColor: checkInMode === 'client' ? 'var(--primary)' : 'transparent',
                            borderColor: checkInMode === 'client' ? 'var(--primary)' : 'var(--border-card)',
                            color: checkInMode === 'client' ? '#fff' : 'var(--text-secondary)'
                          }}
                          onClick={() => {
                            setCheckInMode('client');
                            const clientList = mockDb.clients || [];
                            if (clientList.length > 0) {
                              setSelectedClientId(clientList[0].id.toString());
                            }
                          }}
                        >
                          Client Site Audit
                        </button>
                      </div>
                    </div>

                    {checkInMode === 'client' && (
                      <div className="form-group animate-fade-in">
                        <label className="form-label" htmlFor="select_client">Select Audit Client Location</label>
                        <select
                          id="select_client"
                          className="form-control"
                          value={selectedClientId}
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '0.5rem', 
                            borderRadius: 'var(--radius-sm)', 
                            backgroundColor: 'var(--bg-card)', 
                            border: '1px solid var(--border-card)', 
                            color: '#fff' 
                          }}
                        >
                          <option value="">-- Choose Client --</option>
                          {(mockDb.clients || []).map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.engagement_type || 'Audit Client'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {settings?.require_selfie && (
                      <div className="form-group">
                        <label className="form-label">Take verification selfie:</label>
                        <SelfieCamera 
                          onCapture={(img) => setSelfie(img)} 
                          onClear={() => setSelfie('')} 
                        />
                      </div>
                    )}

                    <GeoPicker 
                      officeLat={settings?.office_lat || 19.0760}
                      officeLng={settings?.office_lng || 72.8777}
                      allowedRadius={settings?.allowed_radius || 100}
                      onLocationChange={(loc) => setCoords(loc)}
                    />

                    {(settings?.require_selfie || settings?.require_geo) && (
                      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '0.5rem', margin: '0.5rem 0' }}>
                        <input 
                          type="checkbox" 
                          id="dpdp_consent" 
                          checked={surveillanceConsent} 
                          onChange={(e) => setSurveillanceConsent(e.target.checked)} 
                          style={{ marginTop: '0.2rem' }}
                        />
                        <label htmlFor="dpdp_consent" className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          I consent to the collection and processing of my selfie photo and device location data for attendance verification, as detailed in the <a href="/SURVEILLANCE_POLICY.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Surveillance Data Policy (India DPDP Act Compliance)</a>.
                        </label>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                        onClick={handleCheckIn}
                        disabled={checkInMode === 'office' && settings?.require_geo && coords.distance > (settings?.allowed_radius || 100)}
                      >
                        Confirm Check-In
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => { setShowCheckInForm(false); setSelfie(''); setCheckInMode('office'); setSelectedClientId(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={() => setShowCheckInForm(true)}>
                    ☀️ Clock In Today
                  </button>
                )}
              </div>

              <div className="glass card-body">
                <h3 className="mb-2">📅 Recent Attendance History</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Your registered check-ins/outs for this month.
                </p>
                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>In</th>
                        <th>Out</th>
                        <th>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: '500' }}>{row.date}</td>
                          <td>
                            <span className={`badge ${row.status === 'Present' ? 'badge-success' : 'badge-warning'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>
                            {row.check_in ? new Date(row.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>
                            {row.check_out ? new Date(row.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td>{row.worked_hours ? `${row.worked_hours}h` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Monthly Attendance Calendar */}
          {activeTab === 'calendar' && (
            <div className="glass card-body">
              <div className="flex-between mb-4">
                <div>
                  <h3>📅 Monthly Attendance Calendar</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Visual calendar tracking check-ins, holidays, and administrator verification status.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="form-control" style={{ width: '120px' }} value={calendarMonth} onChange={(e) => setCalendarMonth(parseInt(e.target.value))}>
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
                  <select className="form-control" style={{ width: '100px' }} value={calendarYear} onChange={(e) => setCalendarYear(parseInt(e.target.value))}>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid var(--secondary)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '2px' }} />
                  <span>Present (Approved)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '2px' }} />
                  <span>Pending Admin Approval</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid #a855f7', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '2px' }} />
                  <span>Paid Leave</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid #eab308', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '2px' }} />
                  <span>Public Holiday</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '2px' }} />
                  <span>Absent</span>
                </div>
              </div>

              {/* Grid */}
              <div className="calendar-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="calendar-header-day">{day}</div>
                ))}
                {renderCalendarDays()}
              </div>
            </div>
          )}

          {/* TAB 2: Weekly Timesheet */}
          {activeTab === 'timesheet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass card-body">
                <div className="flex-between mb-4">
                  <div>
                    <h3>📅 Weekly Timesheet Grid</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Log worked hours against assignments for the week of{' '}
                      <strong>{weekDates[0] ? getISTDateString(weekDates[0]) : ''}</strong> to{' '}
                      <strong>{weekDates[6] ? getISTDateString(weekDates[6]) : ''}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={handlePrevWeek}>&larr; Prev Week</button>
                    <button className="btn btn-outline" onClick={handleNextWeek}>Next Week &rarr;</button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="table" style={{ minWidth: '700px' }}>
                    <thead>
                      <tr>
                        <th>Assignment</th>
                        {weekDates.map((d, idx) => (
                          <th key={idx} style={{ textAlign: 'center' }}>
                            {getDayName(d.getDay())}<br />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.getDate()}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timesheetRows.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No hours logged for this week. Use the logger form below.
                          </td>
                        </tr>
                      ) : (
                        timesheetRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '500' }}>{row.title}</td>
                            <td style={{ textAlign: 'center' }}>{row.mon || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{row.tue || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{row.wed || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{row.thu || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{row.fri || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{row.sat || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{row.sun || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass card-body">
                <h3>✍️ Log Weekly Hours</h3>
                <form onSubmit={submitTimesheet} style={{ marginTop: '1rem' }}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Assignment</label>
                      <select 
                        className="form-control form-select"
                        required
                        value={tsSelectedAssignment}
                        onChange={(e) => setTsSelectedAssignment(e.target.value)}
                      >
                        <option value="">-- Choose Assignment --</option>
                        {myAssignments.map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Activity/Work Note</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="E.g. Bank reconciliation audit, GSTR 3B filing check"
                        value={tsNote}
                        onChange={(e) => setTsNote(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="form-label mb-2" style={{ marginTop: '0.5rem' }}>Hours per Day</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, idx) => (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                          {day}
                        </span>
                        <input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          className="form-control"
                          style={{ textAlign: 'center', width: '100%', padding: '0.4rem 0' }}
                          value={tsHours[day]}
                          onChange={(e) => setTsHours(prev => ({ ...prev, [day]: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary" type="submit">Log Worked Hours</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Leave Management */}
          {activeTab === 'leaves' && (
            <div className="grid-2">
              <div className="glass card-body">
                <h3>🌴 Leave Application</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Submit leaves for approval. Once approved, the payroll calculator automatically counts them as paid-leave.
                </p>

                <div className="grid-3 mb-4 text-center">
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Casual Leaves</p>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{sessionUser?.leave_balance_casual} remaining</strong>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sick Leaves</p>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--secondary)' }}>{sessionUser?.leave_balance_sick} remaining</strong>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Earned Leaves</p>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--warning)' }}>{sessionUser?.leave_balance_earned} remaining</strong>
                  </div>
                </div>

                <form onSubmit={handleApplyLeave}>
                  <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select 
                      className="form-control form-select"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                    >
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Earned">Earned Leave</option>
                    </select>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">From Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        required
                        value={leaveFrom}
                        onChange={(e) => setLeaveFrom(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        required
                        value={leaveTo}
                        onChange={(e) => setLeaveTo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      placeholder="Brief note about leave"
                      required
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit">Submit Request</button>
                </form>
              </div>

              <div className="glass card-body">
                <h3>📋 Past Request Logs</h3>
                <div className="table-container mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Dates</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No requests logged yet.</td>
                        </tr>
                      ) : (
                        leaveHistory.map(req => (
                          <tr key={req.id}>
                            <td>
                              <span style={{ fontWeight: '500' }}>{req.from_date}</span>
                              <br />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to {req.to_date}</span>
                            </td>
                            <td>{req.type}</td>
                            <td>
                              <span className={`badge ${
                                req.status === 'Approved' ? 'badge-success' : 
                                req.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {req.status}
                              </span>
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

          {/* TAB 4: Assignments List */}
          {activeTab === 'assignments' && (
            <div className="glass card-body">
              <h3>📋 Active Work Assignments</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Your client engagement tasks. Update progress regularly to calculate recovery ratio.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignments.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No work assignments assigned to you.
                  </p>
                ) : (
                  assignments.map(a => {
                    const client = mockDb.clients?.find(c => c.id === a.client_id);
                    return (
                      <div 
                        key={a.id} 
                        className="glass" 
                        style={{ 
                          padding: '1.25rem 1.5rem', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          borderColor: a.status === 'Overdue' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-card)'
                        }}
                      >
                        <div style={{ flex: 1, marginRight: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{a.title}</strong>
                            <span className={`badge ${
                              a.status === 'Completed' ? 'badge-success' :
                              a.status === 'In Progress' ? 'badge-info' :
                              a.status === 'Overdue' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {a.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500', marginBottom: '0.5rem' }}>
                            Client: {client ? client.name : 'Unknown'} ({client ? client.engagement_type : ''})
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.description}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Due Date: <strong style={{ color: a.status === 'Overdue' ? 'var(--danger)' : 'var(--text-secondary)' }}>{a.due_date}</strong>
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {a.status !== 'Completed' && (
                            <>
                              {a.status !== 'In Progress' && (
                                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => handleStatusChange(a.id, 'In Progress')}>
                                  Set In Progress
                                </button>
                              )}
                              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleStatusChange(a.id, 'Completed')}>
                                Complete Task
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Monthly Payslips */}
          {activeTab === 'payslips' && (
            <div className="glass card-body">
              <h3>💵 Finalized Payslip Archive</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Download or print payroll slips for finalized months.
              </p>

              {finalizedPayslips.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No finalized payslips found in the records.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {finalizedPayslips.map((slip, idx) => {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthName = months[slip.run.month - 1];
                    return (
                      <div key={idx} className="glass glass-interactive card-body flex-between">
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>{monthName} {slip.run.year}</strong>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Net Salary: {formatIndianCurrency(slip.salary.net_payable)}
                          </p>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setSelectedPayslip(slip)}>
                          View & Print
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Printable payslip modal */}
              {selectedPayslip && (
                <div className="modal-overlay">
                  <div className="modal-content" style={{ maxWidth: '650px', background: '#0b0f19', border: '1px solid var(--primary-glow)' }}>
                    <div className="modal-header">
                      <h3>Payslip Detail</h3>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedPayslip(null)}>&times;</button>
                    </div>
                    
                    <div id="printable-payslip" className="modal-body" style={{ color: '#000', backgroundColor: '#fff', padding: '2rem', borderRadius: '4px' }}>
                      <div style={{ borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                        <h2 style={{ color: '#1e3a8a', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>
                          {settings?.firm_name?.toUpperCase() || 'VARMA RAJA & ASSOCIATES'}
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.25rem 0' }}>
                          {settings?.firm_address || 'Chartered Accountants, Indiranagar, Bangalore, Karnataka - 560038'}
                        </p>
                        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', color: '#333', letterSpacing: '0.1em', marginTop: '0.5rem', margin: '0' }}>
                          Salary Slip for {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedPayslip.run.month - 1]} {selectedPayslip.run.year}
                        </h4>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        <div>
                          <strong>Employee Name:</strong> {sessionUser?.name}<br />
                          <strong>Designation:</strong> {sessionUser?.role}<br />
                          <strong>Division:</strong> {sessionUser?.division || 'Audit Division'}<br />
                          <strong>Email:</strong> {sessionUser?.email}<br />
                          <strong>PF Number:</strong> {sessionUser?.pf_number || 'N/A'}<br />
                          <strong>ESI Number:</strong> {sessionUser?.esi_number || 'N/A'}
                        </div>
                        <div>
                          <strong>Worked Days:</strong> {selectedPayslip.salary.worked_days} / 22<br />
                          <strong>Paid Leaves:</strong> {selectedPayslip.salary.paid_leaves}<br />
                          <strong>Unpaid Leaves:</strong> {selectedPayslip.salary.unpaid_leaves}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                          <div style={{ backgroundColor: '#f3f4f6', padding: '0.5rem', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Earnings</div>
                          <div style={{ padding: '0.5rem' }}>
                            <div className="flex-between" style={{ padding: '0.25rem 0' }}>
                              <span>Basic Monthly Salary:</span>
                              <strong>{formatIndianCurrency(selectedPayslip.salary.basic_salary)}</strong>
                            </div>
                            <div className="flex-between" style={{ padding: '0.25rem 0', borderTop: '1px dashed #eee' }}>
                              <span>Gross Payable (Divisor 22):</span>
                              <strong>{formatIndianCurrency(selectedPayslip.salary.gross_payable)}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                          <div style={{ backgroundColor: '#f3f4f6', padding: '0.5rem', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Deductions</div>
                          <div style={{ padding: '0.5rem' }}>
                            <div className="flex-between" style={{ padding: '0.25rem 0' }}>
                              <span>Provident Fund (PF):</span>
                              <strong>{formatIndianCurrency(selectedPayslip.salary.deductions_pf)}</strong>
                            </div>
                            <div className="flex-between" style={{ padding: '0.25rem 0', borderTop: '1px dashed #eee' }}>
                              <span>Employees\' State Insurance (ESI):</span>
                              <strong>{formatIndianCurrency(selectedPayslip.salary.deductions_esi)}</strong>
                            </div>
                            <div className="flex-between" style={{ padding: '0.25rem 0', borderTop: '1px dashed #eee' }}>
                              <span>Professional Tax (PT):</span>
                              <strong>{formatIndianCurrency(selectedPayslip.salary.deductions_pt)}</strong>
                            </div>
                            <div className="flex-between" style={{ padding: '0.25rem 0', borderTop: '1px dashed #eee' }}>
                              <span>Tax Deducted at Source (TDS):</span>
                              <strong>{formatIndianCurrency(selectedPayslip.salary.deductions_tds)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-between" style={{ 
                        marginTop: '1.5rem', 
                        backgroundColor: '#1e3a8a', 
                        color: '#fff', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}>
                        <span>NET PAYABLE AMOUNT:</span>
                        <span>{formatIndianCurrency(selectedPayslip.salary.net_payable)}</span>
                      </div>
                      
                      <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '1.5rem', textAlign: 'center' }}>
                        This is a computer-generated payslip under Sharmas & Iyer Associates. No signature required.
                      </p>
                    </div>

                    <div className="modal-footer" style={{ borderTopColor: 'var(--border-card)' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          const w = window.open('', 'PRINT', 'height=600,width=800');
                          w.document.write('<html><head><title>Payslip</title>');
                          w.document.write('<style>body { font-family: sans-serif; } .flex-between { display: flex; justify-content: space-between; align-items: center; }</style>');
                          w.document.write('</head><body>');
                          w.document.write(document.getElementById('printable-payslip').innerHTML);
                          w.document.write('</body></html>');
                          w.document.close();
                          w.focus();
                          w.print();
                          w.close();
                        }}
                      >
                        🖨️ Print Slip
                      </button>
                      <button className="btn btn-outline" onClick={() => setSelectedPayslip(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
