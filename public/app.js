document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const messageEl = document.getElementById('form-message');

    // Initial load
    refreshData();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            transaction_id: document.getElementById('tx-id').value,
            user_id: document.getElementById('user-id').value,
            amount: parseFloat(document.getElementById('amount').value),
            device_id: document.getElementById('device-id').value,
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                messageEl.style.color = 'green';
                messageEl.textContent = 'Transaction saved successfully!';
                form.reset();
                refreshData();
            } else {
                messageEl.style.color = 'red';
                messageEl.textContent = data.error || 'Error saving transaction';
            }
        } catch (err) {
            messageEl.style.color = 'red';
            messageEl.textContent = 'Network error';
        }
    });

    async function refreshData() {
        updateDashboard();
        updateTransactions();
    }

    async function updateDashboard() {
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();

            document.getElementById('stat-total').textContent = data.total_transactions;
            document.getElementById('stat-flagged').textContent = data.flagged_transactions;
            document.getElementById('stat-high').textContent = data.high_risk;
            document.getElementById('stat-suspicious').textContent = data.suspicious;
        } catch (err) {
            console.error('Failed to fetch dashboard stats');
        }
    }

    async function updateTransactions() {
        try {
            const res = await fetch('/api/transactions');
            const transactions = await res.json();

            const tbody = document.getElementById('transaction-list');
            tbody.innerHTML = '';

            transactions.forEach(tx => {
                const row = document.createElement('tr');

                // Highlight flagged rows
                if (tx.risk_flag === 'HIGH_RISK') row.classList.add('row-high-risk');
                if (tx.risk_flag === 'SUSPICIOUS') row.classList.add('row-suspicious');

                row.innerHTML = `
                    <td>${tx.transaction_id}</td>
                    <td>${tx.user_id}</td>
                    <td>${tx.amount.toFixed(2)}</td>
                    <td>${new Date(tx.timestamp).toLocaleString()}</td>
                    <td>${tx.device_id}</td>
                    <td>${tx.risk_flag || '-'}</td>
                    <td>${tx.rule_triggered || '-'}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (err) {
            console.error('Failed to fetch transactions');
        }
    }
});
