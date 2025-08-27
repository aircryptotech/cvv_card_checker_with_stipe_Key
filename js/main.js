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

    // --- USER DASHBOARD LOGIC (v2 with Premium Features) ---
    const userDashboard = document.getElementById('checker-form');
    if (userDashboard) {
        // Mock state with localStorage persistence
        let state = JSON.parse(localStorage.getItem('userState')) || {
            balance: 10.00,
            checksPerformed: 0,
            liveCards: [],
            deadCards: []
        };

        const saveState = () => {
            localStorage.setItem('userState', JSON.stringify(state));
        };

        // DOM Elements
        const userBalanceEl = document.getElementById('user-balance');
        const checksPerformedEl = document.getElementById('checks-performed');
        const checkerResultEl = document.getElementById('checker-result');
        const depositForm = document.getElementById('deposit-form');
        const depositMessageEl = document.getElementById('deposit-message');
        const logoutBtn = document.getElementById('logout-btn');
        const checkerForm = document.getElementById('checker-form');

        // Premium Feature Elements
        const batchInput = document.getElementById('batch-input');
        const batchCheckBtn = document.getElementById('batch-check-btn');
        const liveCardsListEl = document.getElementById('live-cards-list');
        const deadCardsListEl = document.getElementById('dead-cards-list');
        const exportLiveBtn = document.getElementById('export-live-btn');
        const exportDeadBtn = document.getElementById('export-dead-btn');

        const renderLists = () => {
            liveCardsListEl.innerHTML = '';
            state.liveCards.forEach(card => {
                const li = document.createElement('li');
                li.textContent = card;
                liveCardsListEl.appendChild(li);
            });

            deadCardsListEl.innerHTML = '';
            state.deadCards.forEach(card => {
                const li = document.createElement('li');
                li.textContent = card;
                deadCardsListEl.appendChild(li);
            });
        };

        const updateStats = () => {
            userBalanceEl.textContent = `$${state.balance.toFixed(2)}`;
            checksPerformedEl.textContent = state.checksPerformed;
        };

        const updateUI = () => {
            updateStats();
            renderLists();
        };

        const performCheck = (cardInfo) => {
            const costPerCheck = 0.05;
            if (state.balance < costPerCheck) {
                checkerResultEl.textContent = 'Insufficient balance for next check!';
                checkerResultEl.className = 'result-box dead';
                return false; // Stop batch if balance runs out
            }

            state.balance -= costPerCheck;
            state.checksPerformed++;

            const isLive = Math.random() > 0.3; // 70% chance live
            if (isLive) {
                state.liveCards.push(cardInfo);
            } else {
                state.deadCards.push(cardInfo);
            }
            return true;
        };

        checkerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const card = `${document.getElementById('card-number').value}|${document.getElementById('expiry-date').value}|${document.getElementById('cvv').value}`;

            if(performCheck(card)) {
                 checkerResultEl.textContent = `Check complete. Result added to lists.`;
                 checkerResultEl.className = 'result-box live';
            }

            updateUI();
            saveState();
            checkerForm.reset();
        });

        batchCheckBtn.addEventListener('click', () => {
            const cards = batchInput.value.trim().split('\n');
            if (cards.length === 0 || cards[0] === '') return;

            for (const card of cards) {
                if (!performCheck(card.trim())) {
                    break; // Stop if balance runs out
                }
            }

            updateUI();
            saveState();
            batchInput.value = '';
        });

        const exportList = (list, filename) => {
            const content = list.join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        exportLiveBtn.addEventListener('click', () => {
            exportList(state.liveCards, 'live_cards.txt');
        });

        exportDeadBtn.addEventListener('click', () => {
            exportList(state.deadCards, 'dead_cards.txt');
        });

        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const txnId = document.getElementById('txn-id').value;
            depositMessageEl.textContent = `Request for TXN ID: ${txnId} sent for approval.`;
            setTimeout(() => { depositMessageEl.textContent = ''; }, 3000);
            depositForm.reset();
        });

        logoutBtn.addEventListener('click', () => {
            // No need to save state on logout if we want a fresh start
            // localStorage.removeItem('userState');
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
