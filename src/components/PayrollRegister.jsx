import React, { useState, useEffect } from 'react';
import { useApp, formatIndianCurrency, getISTDateString } from '../context/AppContext';

export const PayrollRegister = () => {
  const {
    sessionUser,
    mockDb,
    getSettings,
    finalizePayroll,
    unlockPayroll,
    addNotification
  } = useApp();

  const [month, setMonth] = useState(6); // June
  const [year, setYear] = useState(2026);
  const [settings, setSettings] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  
  const [payrollRows, setPayrollRows] = useState([]);
  const [totals, setTotals] = useState({ gross: 0, pf: 0, esi: 0, pt: 0, tds: 0, net: 0 });

  useEffect(() => {
    loadPayrollData();
  }, [month, year, mockDb, settings]);

  const loadPayrollData = async () => {
    const s = await getSettings();
    setSettings(s);

    const runs = mockDb.payrollRuns || [];
    const salaries = mockDb.salaries || [];
    const activeRun = runs.find(r => r.month === month && r.year === year);
    
    if (activeRun && activeRun.status === 'Finalized') {
      setIsFinalized(true);
      // Load stored salaries
      const storedSalaries = salaries.filter(sal => sal.payroll_run_id === activeRun.id);
      
      const rows = storedSalaries.map(sal => {
        const emp = mockDb.profiles.find(p => p.id === sal.employee_id);
        return {
          employeeId: sal.employee_id,
          name: emp ? emp.name : 'Unknown',
          basic: sal.basic_salary,
          workedDays: sal.worked_days,
          paidLeaves: sal.paid_leaves,
          unpaidLeaves: sal.unpaid_leaves,
          gross: sal.gross_payable,
          pf: sal.deductions_pf,
          esi: sal.deductions_esi,
          pt: sal.deductions_pt,
          tds: sal.deductions_tds,
          net: sal.net_payable
        };
      });
      setPayrollRows(rows);
      calculateTotals(rows);
    } else {
      setIsFinalized(false);
      // Perform live calculations for draft preview
      const employees = mockDb.profiles?.filter(p => p.role === 'Employee') || [];
      const attendance = mockDb.attendance?.filter(a => {
        if (!a.date) return false;
        const [y, m] = a.date.split('-');
        return parseInt(m) === month && parseInt(y) === year;
      }) || [];

      const rows = employees.map(emp => {
        const empAtt = attendance.filter(a => a.employee_id === emp.id);
        const workedDays = empAtt.filter(a => a.status === 'Present').length;
        const paidLeaves = empAtt.filter(a => a.status === 'Paid-Leave').length;
        const unpaidLeaves = empAtt.filter(a => a.status === 'Unpaid-Leave' || a.status === 'Absent').length;

        // Divisor 22 calculation
        const dailyRate = emp.monthly_salary / 22;
        const payableDays = Math.min(22, workedDays + paidLeaves);
        const gross = Math.round(dailyRate * payableDays);

        // Deductions
        const pfRate = parseFloat(s?.pf_rate || 0);
        const esiRate = parseFloat(s?.esi_rate || 0);
        const tdsRate = parseFloat(s?.tds_rate || 0);

        const pf = Math.round(gross * (pfRate / 100));
        const esi = Math.round(gross * (esiRate / 100));
        const tds = Math.round(gross * (tdsRate / 100));

        let pt = 0;
        if (s?.pt_slabs && s.pt_slabs !== '') {
          try {
            const slabs = JSON.parse(s.pt_slabs);
            const matchedSlab = slabs.find(sl => gross >= sl.min && gross <= sl.max);
            if (matchedSlab) pt = matchedSlab.amt;
          } catch (e) {
            // Ignore
          }
        }

        const net = Math.max(0, gross - (pf + esi + pt + tds));

        return {
          employeeId: emp.id,
          name: emp.name,
          basic: emp.monthly_salary,
          workedDays,
          paidLeaves,
          unpaidLeaves,
          gross,
          pf,
          esi,
          pt,
          tds,
          net
        };
      });

      setPayrollRows(rows);
      calculateTotals(rows);
    }
  };

  const calculateTotals = (rows) => {
    const sum = rows.reduce((acc, curr) => ({
      gross: acc.gross + curr.gross,
      pf: acc.pf + curr.pf,
      esi: acc.esi + curr.esi,
      pt: acc.pt + curr.pt,
      tds: acc.tds + curr.tds,
      net: acc.net + curr.net
    }), { gross: 0, pf: 0, esi: 0, pt: 0, tds: 0, net: 0 });
    setTotals(sum);
  };

  const handleFinalize = async () => {
    try {
      await finalizePayroll(month, year);
      addNotification(`Payroll finalized and locked for ${month}/${year}.`, 'success');
      loadPayrollData();
    } catch (err) {
      alert(err.message || 'Error finalising payroll.');
    }
  };

  const handleUnlock = async () => {
    if (confirm('Are you sure you want to unlock this payroll? This will erase the locked salary register records.')) {
      await unlockPayroll(month, year);
      loadPayrollData();
    }
  };

  // Export functions
  const exportSalaryRegisterToCSV = () => {
    let csv = 'Salary Register,Month: ' + month + '/' + year + '\n';
    csv += 'Employee Name,Basic Salary,Present Days,Paid Leaves,Gross Salary,PF,ESI,PT,TDS,Net Payable\n';
    
    payrollRows.forEach(r => {
      csv += `"${r.name}",${r.basic},${r.workedDays},${r.paidLeaves},${r.gross},${r.pf},${r.esi},${r.pt},${r.tds},${r.net}\n`;
    });

    csv += `TOTAL,-,-,-,${totals.gross},${totals.pf},${totals.esi},${totals.pt},${totals.tds},${totals.net}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Salary-Register-${month}-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Salary register spreadsheet downloaded.', 'success');
  };

  const exportAttendanceRegisterToCSV = () => {
    let csv = 'Attendance Register,Month: ' + month + '/' + year + '\n';
    csv += 'Date,Employee Name,Status,Check-In,Check-Out,Hours Worked\n';
    
    const records = mockDb.attendance?.filter(a => {
      const [y, m] = a.date.split('-');
      return parseInt(m) === month && parseInt(y) === year;
    }) || [];

    records.forEach(r => {
      const emp = mockDb.profiles.find(p => p.id === r.employee_id);
      csv += `${r.date},"${emp ? emp.name : 'Unknown'}",${r.status},${r.check_in || '-'},${r.check_out || '-'},${r.worked_hours || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Attendance-Register-${month}-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Attendance register downloaded.', 'success');
  };

  const isDeductionsUnconfigured = () => {
    return !settings || settings.pf_rate === '' || settings.esi_rate === '' || settings.tds_rate === '' || !settings.pt_slabs || settings.pt_slabs === '';
  };

  return (
    <div className="glass card-body">
      <div className="flex-between mb-4">
        <div>
          <h3>💵 Salary Register & Payroll finalization</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Divisor 22 active. Net Payable = Gross Salary (Capped at 22 working days) - PT - PF - ESI - TDS.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select className="form-control" style={{ width: '120px' }} value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
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
          <select className="form-control" style={{ width: '100px' }} value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {isDeductionsUnconfigured() && (
        <div className="alert alert-danger">
          ⚠️ <strong>Payroll Lock Warning:</strong> PF, ESI, or TDS tax settings are not configured. You must set these rates in HR Settings before finalising monthly payroll.
        </div>
      )}

      {isFinalized ? (
        <div className="alert alert-success" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔒 <strong>Payroll Locked:</strong> June 2026 records are finalized and locked for modification. Cloud backup archives completed.</span>
          <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: '#fff' }} onClick={handleUnlock}>
            Unlock Register
          </button>
        </div>
      ) : (
        <div className="alert alert-warning" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📝 <strong>Draft Mode:</strong> Reviewing live calculations for {month}/{year}. Rates and days are editable.</span>
          <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={handleFinalize} disabled={isDeductionsUnconfigured()}>
            Finalize & Lock Payroll
          </button>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Basic Pay</th>
              <th>Paid Days</th>
              <th>Gross Salary</th>
              <th>PF Ded.</th>
              <th>ESI Ded.</th>
              <th>PT Ded.</th>
              <th>TDS Ded.</th>
              <th>Net Payable</th>
            </tr>
          </thead>
          <tbody>
            {payrollRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: '600' }}>{row.name}</td>
                <td>{formatIndianCurrency(row.basic)}</td>
                <td>
                  <strong>{row.workedDays + row.paidLeaves}</strong>
                  <br />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({row.workedDays} present + {row.paidLeaves} leave)</span>
                </td>
                <td>{formatIndianCurrency(row.gross)}</td>
                <td>{formatIndianCurrency(row.pf)}</td>
                <td>{formatIndianCurrency(row.esi)}</td>
                <td>{formatIndianCurrency(row.pt)}</td>
                <td>{formatIndianCurrency(row.tds)}</td>
                <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatIndianCurrency(row.net)}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderTop: '2px solid var(--border-card)', fontWeight: 'bold' }}>
              <td>TOTALS</td>
              <td>-</td>
              <td>-</td>
              <td>{formatIndianCurrency(totals.gross)}</td>
              <td>{formatIndianCurrency(totals.pf)}</td>
              <td>{formatIndianCurrency(totals.esi)}</td>
              <td>{formatIndianCurrency(totals.pt)}</td>
              <td>{formatIndianCurrency(totals.tds)}</td>
              <td style={{ color: 'var(--secondary)' }}>{formatIndianCurrency(totals.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {isFinalized && (
        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem' }}>
          <button className="btn btn-outline" onClick={exportSalaryRegisterToCSV}>
            📥 Export Salary register (.xlsx)
          </button>
          <button className="btn btn-outline" onClick={exportAttendanceRegisterToCSV}>
            📥 Export Attendance register (.xlsx)
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              const w = window.open('', 'PRINT', 'height=600,width=900');
              w.document.write('<html><head><title>Salary Register</title>');
              w.document.write('<style>body { font-family: sans-serif; padding: 20px; } table { width:100%; border-collapse: collapse; margin-top:20px; } th, td { border:1px solid #ccc; padding:10px; text-align:left; } th { background-color:#f4f4f4; }</style>');
              w.document.write('</head><body>');
              w.document.write('<h2>Salary Register - Sharmas & Iyer Associates</h2>');
              w.document.write('<h4>Month: ' + month + '/' + year + '</h4>');
              w.document.write('<p>Generated on: ' + new Date().toLocaleDateString('en-IN') + '</p>');
              
              let tableHTML = '<table><thead><tr><th>Employee Name</th><th>Basic Salary</th><th>Paid Days</th><th>Gross Payable</th><th>PF</th><th>ESI</th><th>PT</th><th>TDS</th><th>Net Payable</th></tr></thead><tbody>';
              payrollRows.forEach(r => {
                tableHTML += `<tr><td>${r.name}</td><td>₹${r.basic}</td><td>${r.workedDays + r.paidLeaves}</td><td>₹${r.gross}</td><td>₹${r.pf}</td><td>₹${r.esi}</td><td>₹${r.pt}</td><td>₹${r.tds}</td><td><strong>₹${r.net}</strong></td></tr>`;
              });
              tableHTML += `<tr><td><strong>TOTALS</strong></td><td>-</td><td>-</td><td><strong>₹${totals.gross}</strong></td><td><strong>₹${totals.pf}</strong></td><td><strong>₹${totals.esi}</strong></td><td><strong>₹${totals.pt}</strong></td><td><strong>₹${totals.tds}</strong></td><td><strong>₹${totals.net}</strong></td></tr>`;
              tableHTML += '</tbody></table>';

              w.document.write(tableHTML);
              w.document.write('</body></html>');
              w.document.close();
              w.focus();
              w.print();
              w.close();
            }}
          >
            🖨️ Print Registry Ledger
          </button>
        </div>
      )}
    </div>
  );
};
