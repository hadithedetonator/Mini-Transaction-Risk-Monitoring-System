import { useState, useEffect } from 'react';
import './App.css';

const API = '/api';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [dashboard, setDashboard] = useState({ total_transactions: 0, flagged_transactions: 0, high_risk: 0, suspicious: 0 });
  const [form, setForm] = useState({ transaction_id: '', user_id: '', amount: '', device_id: '' });
  const [message, setMessage] = useState({ text: '', error: false });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [txRes, dashRes] = await Promise.all([
      fetch(`${API}/transactions`),
      fetch(`${API}/dashboard`)
    ]);
    setTransactions(await txRes.json());
    setDashboard(await dashRes.json());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ text: '', error: false });
    const res = await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ text: 'Transaction submitted successfully.', error: false });
      setForm({ transaction_id: '', user_id: '', amount: '', device_id: '' });
      fetchAll();
    } else {
      setMessage({ text: data.error || 'Submission failed.', error: true });
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function riskBadge(flag) {
    if (flag === 'HIGH_RISK') return <span className="badge badge-high-risk">High Risk</span>;
    if (flag === 'SUSPICIOUS') return <span className="badge badge-suspicious">Suspicious</span>;
    return <span className="badge badge-clean">Clean</span>;
  }

  function rowClass(flag) {
    if (flag === 'HIGH_RISK') return 'row-high-risk';
    if (flag === 'SUSPICIOUS') return 'row-suspicious';
    return '';
  }

  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <img src="/logo.png" alt="Logo" />
        <h1>Transaction <span>Risk</span> Monitoring System</h1>
      </div>

      {/* Dashboard */}
      <section className="card">
        <h2>Dashboard</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="label">Total</span>
            <span className="value">{dashboard.total_transactions}</span>
          </div>
          <div className="stat-item flagged">
            <span className="label">Flagged</span>
            <span className="value">{dashboard.flagged_transactions}</span>
          </div>
          <div className="stat-item high-risk">
            <span className="label">High Risk</span>
            <span className="value">{dashboard.high_risk}</span>
          </div>
          <div className="stat-item suspicious">
            <span className="label">Suspicious</span>
            <span className="value">{dashboard.suspicious}</span>
          </div>
        </div>
      </section>

      {/* Upload Form */}
      <section className="card">
        <h2>Submit Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Transaction ID</label>
            <input name="transaction_id" value={form.transaction_id} onChange={handleChange} required placeholder="e.g. TX999" />
          </div>
          <div className="form-group">
            <label>User ID</label>
            <input name="user_id" value={form.user_id} onChange={handleChange} required placeholder="e.g. U1001" />
          </div>
          <div className="form-group">
            <label>Amount (PKR)</label>
            <input name="amount" type="number" value={form.amount} onChange={handleChange} required step="0.01" placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Device ID</label>
            <input name="device_id" value={form.device_id} onChange={handleChange} required placeholder="e.g. D1" />
          </div>
          <button type="submit">Submit Transaction</button>
        </form>
        {message.text && (
          <p className={message.error ? 'msg-error' : 'msg-success'}>{message.text}</p>
        )}
      </section>

      {/* Transactions Table */}
      <section className="card">
        <h2>Transaction History</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>TX ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Timestamp</th>
                <th>Device</th>
                <th>Risk Flag</th>
                <th>Rule</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.transaction_id} className={rowClass(tx.risk_flag)}>
                  <td>{tx.transaction_id}</td>
                  <td>{tx.user_id}</td>
                  <td>{Number(tx.amount).toLocaleString()}</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td>{tx.device_id}</td>
                  <td>{riskBadge(tx.risk_flag)}</td>
                  <td>{tx.rule_triggered || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
