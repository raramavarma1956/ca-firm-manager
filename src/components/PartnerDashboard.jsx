import React, { useState, useEffect } from 'react';
import { useApp, formatIndianCurrency, getISTDateString } from '../context/AppContext';
import { SVGDonutChart, SVGBarChart, SVGLineChart } from './SVGCharts';
import { PayrollRegister } from './PayrollRegister';

export const PartnerDashboard = () => {
  const {
    sessionUser,
    mockDb,
    getSettings,
    updateSettings,
    getClients,
    createClient,
    getTemplates,
    createTemplate,
    getAssignments,
    createAssignment,
    getTimesheets,
    addNotification,
    logout
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [assignmentTypes, setAssignmentTypes] = useState(['Statutory Audit', 'GST Monthly Return', 'Tax Advisory']);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);

  // KPI states
  const [kpis, setKpis] = useState({
    staffCost: 0,
    totalBilling: 0,
    realization: 100,
    presentToday: 0,
    overdueAssignments: 0
  });

  // Profitability report states
  const [profitabilityData, setProfitabilityData] = useState([]);
  
  // Audit Trail states
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditDateStart, setAuditDateStart] = useState('');
  const [auditDateEnd, setAuditDateEnd] = useState('');

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    avgHours: [],
    lateCounts: [],
    monthlyAtt: []
  });

  // Client Master states
  const [clients, setClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', contact: '', gstin: '', engagement_type: 'Statutory Audit' });

  // Template states
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ title: '', description: '' });

  // Assignment Creation states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    client_id: '', title: '', description: '', assigned_to: '', due_date: '', bill_amount: 0
  });

  // Load dashboard data
  useEffect(() => {
    loadBranches();
    loadKpisAndAnalytics();
    loadProfitability();
    loadAuditLogs();
    loadClientsAndTemplates();
  }, [mockDb, selectedBranch]);

  const loadBranches = async () => {
    const s = await getSettings();
    if (s && s.branches) {
      try {
        setBranches(JSON.parse(s.branches));
      } catch (e) {
        setBranches([]);
      }
    }
  };

  const loadKpisAndAnalytics = async () => {
    // 1. Headcount present today
    const todayStr = getISTDateString();
    const attendanceToday = (mockDb.attendance || []).filter(a => {
      if (a.date !== todayStr || a.status !== 'Present') return false;
      if (selectedBranch) {
        const emp = mockDb.profiles?.find(p => p.id === a.employee_id);
        return emp && emp.branch_id === selectedBranch;
      }
      return true;
    });
    const presentCount = attendanceToday.length;

    // 2. Overdue assignments
    const assignments = mockDb.assignments || [];
    const filteredAssignments = assignments.filter(a => {
      if (selectedBranch) {
        const emp = mockDb.profiles?.find(p => p.id === a.assigned_to);
        return emp && emp.branch_id === selectedBranch;
      }
      return true;
    });
    const overdueCount = filteredAssignments.filter(a => a.status === 'Overdue' && !a.is_completed).length;

    // 3. Billing (sum of active/completed assignments)
    const totalBilling = filteredAssignments.reduce((sum, a) => sum + parseFloat(a.bill_amount || 0), 0);

    // 4. Staff cost (June 2026 finalized/locked or draft total gross payable)
    // Find June 2026 run in database
    const runs = mockDb.payrollRuns || [];
    const JuneRun = runs.find(r => r.month === 6 && r.year === 2026);
    let staffCost = 0;
    
    if (JuneRun) {
      const salaries = mockDb.salaries || [];
      const juneSalaries = salaries.filter(s => {
        if (s.payroll_run_id !== JuneRun.id) return false;
        if (selectedBranch) {
          const emp = mockDb.profiles?.find(p => p.id === s.employee_id);
          return emp && emp.branch_id === selectedBranch;
        }
        return true;
      });
      staffCost = juneSalaries.reduce((sum, s) => sum + s.gross_payable, 0);
    } else {
      // Calculate draft staff cost dynamically
      const employees = mockDb.profiles?.filter(p => p.role === 'Employee' && (!selectedBranch || p.branch_id === selectedBranch)) || [];
      staffCost = employees.reduce((sum, e) => sum + e.monthly_salary, 0);
    }

    // 5. Analytics (average worked hours per employee, late counts)
    const attendance = mockDb.attendance || [];
    const employees = mockDb.profiles?.filter(p => p.role === 'Employee' && (!selectedBranch || p.branch_id === selectedBranch)) || [];
    
    // Average hours chart data
    const avgHours = employees.map(emp => {
      const empAtt = attendance.filter(a => a.employee_id === emp.id && a.status === 'Present');
      const totalHours = empAtt.reduce((sum, a) => sum + parseFloat(a.worked_hours || 0), 0);
      const avg = empAtt.length > 0 ? Math.round((totalHours / empAtt.length) * 10) / 10 : 0;
      return { label: emp.name.split(' ')[0], value: avg };
    });

    // Punctuality data: late check-ins (after cutoff, e.g. 10:00)
    let lateCount = 0;
    let onTimeCount = 0;
    
    attendance.filter(a => {
      if (a.status !== 'Present') return false;
      if (selectedBranch) {
        const emp = mockDb.profiles?.find(p => p.id === a.employee_id);
        return emp && emp.branch_id === selectedBranch;
      }
      return true;
    }).forEach(a => {
      if (a.check_in) {
        const timePart = a.check_in.split('T')[1]?.substring(0, 5); // "09:30"
        if (timePart && timePart > '10:00') {
          lateCount++;
        } else {
          onTimeCount++;
        }
      }
    });

    // Monthly attendance %
    const monthlyAtt = employees.map(emp => {
      const empAtt = attendance.filter(a => a.employee_id === emp.id);
      const totalDays = 22; // Standard denominator
      const presentDays = empAtt.filter(a => a.status === 'Present' || a.status === 'Paid-Leave').length;
      const pct = Math.round((presentDays / totalDays) * 100);
      return { label: emp.name.split(' ')[0], value: Math.min(100, pct) };
    });

    setAnalyticsData({
      avgHours,
      lateCounts: [
        { label: 'On Time Check-in', value: onTimeCount || 10, color: '#10b981' },
        { label: 'Late Check-in (>10:00)', value: lateCount || 2, color: '#f59e0b' }
      ],
      monthlyAtt
    });

    // 6. Firm wide realization ratio
    // Realization = totalBilling / staffCost * 100
    const realization = staffCost > 0 ? Math.round((totalBilling / staffCost) * 100) : 100;

    setKpis({
      staffCost,
      totalBilling,
      realization,
      presentToday: presentCount,
      overdueAssignments: overdueCount
    });
  };

  const loadProfitability = async () => {
    let list = mockDb.assignments || [];
    const profiles = mockDb.profiles || [];
    const timesheets = mockDb.timesheets || [];

    if (selectedBranch) {
      list = list.filter(a => {
        const emp = profiles.find(p => p.id === a.assigned_to);
        return emp && emp.branch_id === selectedBranch;
      });
    }

    let totalCost = 0;
    let totalBilling = 0;

    const report = list.map(a => {
      const emp = profiles.find(p => p.id === a.assigned_to);
      const client = mockDb.clients?.find(c => c.id === a.client_id);
      
      // Calculate costs from timesheet hours
      const empTimesheets = timesheets.filter(t => t.assignment_id === a.id);
      const chargeableHours = empTimesheets.reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);
      
      // Hourly cost rate
      const hourlyRate = emp ? parseFloat(emp.hourly_rate || 200) : 200;
      let cost = chargeableHours * hourlyRate;

      // If no timesheets logged yet, fallback to days * daily rate (e.g. 5 days * daily rate)
      if (cost === 0) {
        cost = 5 * (emp ? emp.monthly_salary / 22 : 1500); // Simulated baseline cost
      }

      totalCost += cost;
      totalBilling += parseFloat(a.bill_amount || 0);

      const recovery = cost > 0 ? Math.round((a.bill_amount / cost) * 100) : 100;

      return {
        id: a.id,
        title: a.title,
        clientName: client ? client.name : 'Unknown',
        employeeName: emp ? emp.name : 'Unassigned',
        billAmount: a.bill_amount,
        chargeableHours,
        cost,
        recovery,
        status: a.status
      };
    });

    setProfitabilityData(report);
    
    // Set realization KPI
    const globalRatio = totalCost > 0 ? Math.round((totalBilling / totalCost) * 100) : 120;
    setKpis(prev => ({ ...prev, realization: globalRatio }));
  };

  const loadAuditLogs = async () => {
    let logs = mockDb.auditLog || [];
    if (selectedBranch) {
      logs = logs.filter(l => {
        const actor = mockDb.profiles?.find(p => p.id === l.actor_user_id);
        return actor && actor.branch_id === selectedBranch;
      });
    }
    setAuditLogs(logs);
  };

  const loadClientsAndTemplates = async () => {
    const c = await getClients();
    setClients(c);
    const t = await getTemplates();
    setTemplates(t);
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

  const handleAddAssignmentType = async () => {
    if (!newTypeInput.trim()) return;
    const cleaned = newTypeInput.trim();
    if (assignmentTypes.includes(cleaned)) {
      alert('This assignment type already exists.');
      return;
    }
    const updatedTypes = [...assignmentTypes, cleaned];
    setAssignmentTypes(updatedTypes);
    setNewTypeInput('');
    
    // Save to settings
    await updateSettings({ assignment_types: JSON.stringify(updatedTypes) });
    addNotification(`Added new assignment type: ${cleaned}`, 'success');
  };

  // Creation submissions
  const handleCreateClient = async (e) => {
    e.preventDefault();
    await createClient(clientForm);
    addNotification(`Client "${clientForm.name}" created.`, 'success');
    setClientForm({ name: '', contact: '', gstin: '', engagement_type: 'Statutory Audit' });
    setShowClientModal(false);
    loadClientsAndTemplates();
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    await createTemplate(templateForm.title, templateForm.description);
    addNotification(`Template "${templateForm.title}" saved.`, 'success');
    setTemplateForm({ title: '', description: '' });
    setShowTemplateModal(false);
    loadClientsAndTemplates();
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    await createAssignment(assignForm);
    addNotification(`Work Assignment "${assignForm.title}" allocated.`, 'success');
    setAssignForm({ client_id: '', title: '', description: '', assigned_to: '', due_date: '', bill_amount: 0 });
    setShowAssignModal(false);
    loadProfitability();
  };

  const applyTemplateValues = (templateId) => {
    const t = templates.find(temp => temp.id === parseInt(templateId));
    if (t) {
      setAssignForm(prev => ({
        ...prev,
        title: t.title,
        description: t.description
      }));
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar nav */}
      <div className="app-sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-card)' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Partner Dashboard</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Logged in: <strong style={{ color: 'var(--primary)' }}>Rajesh Iyer</strong>
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', flex: 1 }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('overview')}
            style={{ justifyContent: 'flex-start' }}
          >
            📊 Firm Analytics
          </button>
          <button 
            className={`btn ${activeTab === 'profitability' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('profitability')}
            style={{ justifyContent: 'flex-start' }}
          >
            💰 Assignment Realization
          </button>
          <button 
            className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('payroll')}
            style={{ justifyContent: 'flex-start' }}
          >
            💵 Lock / Finalize Payroll
          </button>
          <button 
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('audit')}
            style={{ justifyContent: 'flex-start' }}
          >
            🛡️ Audit Trail Log
          </button>
          <button 
            className={`btn ${activeTab === 'clients' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('clients')}
            style={{ justifyContent: 'flex-start' }}
          >
            🏢 Clients & Templates
          </button>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-card)' }}>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={logout}>
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* Main Main */}
      <div className="app-main">
        <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>CA Practice Suite</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              System Integrity Role: <strong style={{ color: 'var(--primary)' }}>Managing Partner</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Branch View:</label>
            <select 
              className="form-control form-select"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '200px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', color: '#fff' }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">-- All Branches --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="app-content">
          {/* TAB 1: Firm Analytics / Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* KPI Summary Cards */}
              <div className="grid-4">
                <div className="glass card-body">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Staff Cost (Jun 2026)</p>
                  <h2 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '0.25rem' }}>{formatIndianCurrency(kpis.staffCost)}</h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Gross payable to employees</span>
                </div>
                <div className="glass card-body">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Billing</p>
                  <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', marginTop: '0.25rem' }}>{formatIndianCurrency(kpis.totalBilling)}</h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All engagements value</span>
                </div>
                <div className="glass card-body">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Firm-wide Realization %</p>
                  <h2 style={{ color: kpis.realization >= 100 ? 'var(--secondary)' : 'var(--danger)', fontSize: '1.5rem', marginTop: '0.25rem' }}>
                    {kpis.realization}%
                  </h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bill realization vs resource cost</span>
                </div>
                <div className="glass card-body">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Overdue Tasks</p>
                  <h2 style={{ color: kpis.overdueAssignments > 0 ? 'var(--danger)' : '#fff', fontSize: '1.5rem', marginTop: '0.25rem' }}>
                    {kpis.overdueAssignments}
                  </h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Count of overdue assignments</span>
                </div>
              </div>

              {/* Headcount Card */}
              <div className="glass card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                <div>
                  <h4 style={{ color: '#fff' }}>👥 Staff Attendance Today</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live headcount of employees present in the office</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                    {kpis.presentToday}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Present</span>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid-3">
                <div className="glass card-body">
                  <SVGBarChart data={analyticsData.avgHours} title="Average Worked Hours / Day" />
                </div>
                <div className="glass card-body">
                  <SVGDonutChart 
                    data={analyticsData.lateCounts} 
                    title="Staff Punctuality Breakdown" 
                    centerValue={analyticsData.lateCounts.find(c => c.label.includes('Late'))?.value || 0}
                    centerLabel="Late Arrivals"
                  />
                </div>
                <div className="glass card-body">
                  <SVGLineChart data={analyticsData.monthlyAtt} title="Monthly Attendance % Ratio" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Profitability / Realization Report */}
          {activeTab === 'profitability' && (
            <div className="glass card-body">
              <h3>💰 Engagement Cost Profitability & Realization Ratio</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Cost = (chargeable hours &times; hourly rate) from timesheets. Recovery below 100% flags in <strong style={{ color: 'var(--danger)' }}>red</strong>.
              </p>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Assignment Title</th>
                      <th>Client Name</th>
                      <th>Assigned Staff</th>
                      <th>Bill Amount (₹)</th>
                      <th>Logged Hours</th>
                      <th>Resource Cost</th>
                      <th>Recovery Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{row.title}</td>
                        <td>{row.clientName}</td>
                        <td>{row.employeeName}</td>
                        <td>{formatIndianCurrency(row.billAmount)}</td>
                        <td>{row.chargeableHours} hrs</td>
                        <td>{formatIndianCurrency(row.cost)}</td>
                        <td style={{ 
                          fontWeight: 'bold', 
                          color: row.recovery < 100 ? 'var(--danger)' : 'var(--secondary)' 
                        }}>
                          {row.recovery}% {row.recovery < 100 && '⚠️'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Embedded Payroll finalize lock */}
          {activeTab === 'payroll' && (
            <PayrollRegister />
          )}

          {/* TAB 4: Audit Trail */}
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
                  <label className="form-label">Actor User</label>
                  <select 
                    className="form-control form-select"
                    value={auditActorFilter}
                    onChange={(e) => setAuditActorFilter(e.target.value)}
                  >
                    <option value="">-- All Actors --</option>
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
                            <td style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.new_value ? JSON.stringify(log.new_value) : ''}
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

          {/* TAB 5: Client Master & Templates */}
          {activeTab === 'clients' && (
            <div className="grid-2">
              <div className="glass card-body">
                <div className="flex-between mb-4">
                  <h3>🏢 Client Master Database</h3>
                  <button className="btn btn-primary" onClick={() => { setClientForm({ name: '', contact: '', gstin: '', engagement_type: assignmentTypes[0] || '' }); setShowClientModal(true); }}>+ Add Client</button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="New Engagement Type..." 
                    style={{ maxWidth: '200px', padding: '0.4rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-card)', borderRadius: '4px' }}
                    value={newTypeInput}
                    onChange={(e) => setNewTypeInput(e.target.value)}
                  />
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleAddAssignmentType}>
                    + Add Engagement Type
                  </button>
                </div>

                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Client Name</th>
                        <th>GSTIN</th>
                        <th>Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: '500' }}>{c.name}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ph: {c.contact}</span></td>
                          <td style={{ fontFamily: 'monospace' }}>{c.gstin}</td>
                          <td>{c.engagement_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Client Modal */}
                {showClientModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h3>Add New Client</h3>
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowClientModal(false)}>&times;</button>
                      </div>
                      <form onSubmit={handleCreateClient}>
                        <div className="modal-body">
                          <div className="form-group">
                            <label className="form-label">Client Name</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              required 
                              value={clientForm.name} 
                              onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={clientForm.contact} 
                              onChange={(e) => setClientForm(prev => ({ ...prev, contact: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">GSTIN ID</label>
                            <input 
                              type="text" 
                              placeholder="27AAAAA1111A1Z1"
                              className="form-control" 
                              value={clientForm.gstin} 
                              onChange={(e) => setClientForm(prev => ({ ...prev, gstin: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Engagement Type</label>
                            <select 
                              className="form-control form-select"
                              value={clientForm.engagement_type}
                              onChange={(e) => setClientForm(prev => ({ ...prev, engagement_type: e.target.value }))}
                            >
                              {assignmentTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn btn-primary" type="submit">Create Client</button>
                          <button className="btn btn-outline" type="button" onClick={() => setShowClientModal(false)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass card-body">
                <div className="flex-between mb-4">
                  <h3>📝 Reusable Assignment Templates</h3>
                  <button className="btn btn-primary" onClick={() => setShowTemplateModal(true)}>+ New Template</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                  {templates.map(t => (
                    <div key={t.id} className="glass" style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#fff' }}>{t.title}</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t.description}</p>
                    </div>
                  ))}
                </div>

                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowAssignModal(true)}>
                  📋 Allocate Assignment using Template
                </button>

                {/* Templates Modal */}
                {showTemplateModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h3>Create Assignment Template</h3>
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowTemplateModal(false)}>&times;</button>
                      </div>
                      <form onSubmit={handleCreateTemplate}>
                        <div className="modal-body">
                          <div className="form-group">
                            <label className="form-label">Template Title</label>
                            <input 
                              type="text" 
                              placeholder="E.g. Statutory Audit"
                              className="form-control" 
                              required 
                              value={templateForm.title} 
                              onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Description / Scope of Work</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              placeholder="Default scope to copy..."
                              required 
                              value={templateForm.description} 
                              onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn btn-primary" type="submit">Save Template</button>
                          <button className="btn btn-outline" type="button" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Assign Task Modal */}
                {showAssignModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h3>Allocate Engagement Assignment</h3>
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowAssignModal(false)}>&times;</button>
                      </div>
                      <form onSubmit={handleCreateAssignment}>
                        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                          <div className="form-group">
                            <label className="form-label">Client</label>
                            <select 
                              className="form-control form-select"
                              required
                              value={assignForm.client_id}
                              onChange={(e) => setAssignForm(prev => ({ ...prev, client_id: parseInt(e.target.value) || '' }))}
                            >
                              <option value="">-- Choose Client --</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Load Template (Optional)</label>
                            <select 
                              className="form-control form-select"
                              onChange={(e) => applyTemplateValues(e.target.value)}
                            >
                              <option value="">-- Apply a Template --</option>
                              {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Assignment Title</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              required 
                              value={assignForm.title} 
                              onChange={(e) => setAssignForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Scope Description</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              required 
                              value={assignForm.description} 
                              onChange={(e) => setAssignForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Assigned Staff Member</label>
                            <select 
                              className="form-control form-select"
                              required
                              value={assignForm.assigned_to}
                              onChange={(e) => setAssignForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                            >
                              <option value="">-- Choose Staff --</option>
                              {mockDb.profiles?.filter(p => p.role === 'Employee').map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid-2">
                            <div className="form-group">
                              <label className="form-label">Due Date</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                required 
                                value={assignForm.due_date} 
                                onChange={(e) => setAssignForm(prev => ({ ...prev, due_date: e.target.value }))}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Bill Amount (₹)</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                required 
                                value={assignForm.bill_amount} 
                                onChange={(e) => setAssignForm(prev => ({ ...prev, bill_amount: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn btn-primary" type="submit">Allocate Task</button>
                          <button className="btn btn-outline" type="button" onClick={() => setShowAssignModal(false)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
