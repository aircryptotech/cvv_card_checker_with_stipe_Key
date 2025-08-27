document.addEventListener('DOMContentLoaded', () => {
    // --- LOGIN PAGE LOGIC ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');

            if (username === 'admin' && password === 'admin') {
                errorMessage.textContent = '';
                window.location.href = 'admin.html';
            } else if (username === 'user' && password === 'user') {
                errorMessage.textContent = '';
                window.location.href = 'dashboard.html';
            } else {
                errorMessage.textContent = 'Access Denied. Invalid Credentials.';
            }
        });
    }

    // --- USER DASHBOARD LOGIC ---
    const checkerForm = document.getElementById('checker-form');
    if (checkerForm) {
        // Mock state
        let state = {
            balance: 10.00,
            checksPerformed: 0,
            transactions: ['Initial Balance: +$10.00']
        };

        // DOM Elements
        const userBalanceEl = document.getElementById('user-balance');
        const checksPerformedEl = document.getElementById('checks-performed');
        const transactionListEl = document.getElementById('transaction-list');
        const checkerResultEl = document.getElementById('checker-result');
        const depositForm = document.getElementById('deposit-form');
        const depositMessageEl = document.getElementById('deposit-message');
        const logoutBtn = document.getElementById('logout-btn');

        const updateUI = () => {
            userBalanceEl.textContent = `$${state.balance.toFixed(2)}`;
            checksPerformedEl.textContent = state.checksPerformed;

            transactionListEl.innerHTML = '';
            state.transactions.forEach(tx => {
                const li = document.createElement('li');
                li.textContent = tx;
                if(tx.includes('Check')) {
                    li.classList.add('spent');
                }
                transactionListEl.prepend(li); // show newest first
            });
        };

        checkerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const costPerCheck = 0.05;

            if (state.balance < costPerCheck) {
                checkerResultEl.textContent = 'Insufficient balance!';
                checkerResultEl.className = 'result-box dead';
                return;
            }

            // Update state
            state.balance -= costPerCheck;
            state.checksPerformed++;
            const cardNumber = document.getElementById('card-number').value;
            const transactionText = `Card Check: ${cardNumber.slice(-4)} -$${costPerCheck.toFixed(2)}`;
            state.transactions.push(transactionText);

            // Simulate check result
            const isLive = Math.random() > 0.3; // 70% chance of being live
            if (isLive) {
                checkerResultEl.textContent = `Card is LIVE ✅`;
                checkerResultEl.className = 'result-box live';
            } else {
                checkerResultEl.textContent = `Card is DEAD ❌`;
                checkerResultEl.className = 'result-box dead';
            }

            // Update UI and clear form
            updateUI();
            checkerForm.reset();
        });

        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const txnId = document.getElementById('txn-id').value;
            depositMessageEl.textContent = `Request for TXN ID: ${txnId} sent for approval.`;
            setTimeout(() => {
                depositMessageEl.textContent = '';
            }, 3000);
            depositForm.reset();
        });

        logoutBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Initial UI render
        updateUI();
    }

    // --- ADMIN DASHBOARD LOGIC ---
    const adminDashboard = document.getElementById('deposit-requests-table');
    if (adminDashboard) {
        // Mock Data
        let requests = JSON.parse(localStorage.getItem('depositRequests')) || [
            { id: 1, user: 'user123', txnId: 'abcde12345', amount: 50.00 },
            { id: 2, user: 'user456', txnId: 'fghij67890', amount: 25.50 },
            { id: 3, user: 'user789', txnId: 'klmno11223', amount: 100.00 },
        ];

        const saveRequests = () => {
            localStorage.setItem('depositRequests', JSON.stringify(requests));
        };

        const renderRequests = () => {
            const tableBody = adminDashboard.querySelector('tbody');
            tableBody.innerHTML = '';
            requests.forEach(req => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${req.user}</td>
                    <td>${req.txnId}</td>
                    <td>$${req.amount.toFixed(2)}</td>
                    <td>
                        <button class="btn action-btn approve" data-id="${req.id}">Approve</button>
                        <button class="btn action-btn decline" data-id="${req.id}">Decline</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        };

        adminDashboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn')) {
                const id = parseInt(e.target.dataset.id);
                requests = requests.filter(req => req.id !== id);
                saveRequests();
                renderRequests();
            }
        });

        // API Key Management
        const apiKeyForm = document.getElementById('api-key-form');
        const currentKeyEl = document.getElementById('current-key');
        const checkKeyBtn = document.getElementById('check-key-btn');
        const keyStatusEl = document.getElementById('key-status');

        apiKeyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyInput = document.getElementById('stripe-key');
            const newKey = keyInput.value;
            if (newKey) {
                currentKeyEl.textContent = `${newKey.substring(0, 8)}...${newKey.slice(-4)}`;
            }
            keyInput.value = '';
        });

        checkKeyBtn.addEventListener('click', () => {
            const isLive = Math.random() > 0.3; // 70% chance live
            if (isLive) {
                keyStatusEl.textContent = 'Key is LIVE ✅';
                keyStatusEl.style.color = 'var(--primary-color)';
            } else {
                keyStatusEl.textContent = 'Key is DEAD ❌';
                keyStatusEl.style.color = 'var(--error-color)';
            }
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Initial render
        renderRequests();
    }
});
