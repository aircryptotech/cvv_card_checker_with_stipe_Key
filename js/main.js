document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION LOGIC (v2) ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');

            // Admin check
            if (username === 'admin' && password === 'anamaka') {
                window.location.href = 'admin.html';
                return;
            }

            // User check
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                // In a real app, you'd set a session token. Here we just redirect.
                window.location.href = 'dashboard.html';
            } else {
                errorMessage.textContent = 'Access Denied. Invalid Credentials.';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');

            const users = JSON.parse(localStorage.getItem('users')) || [];

            if (users.find(u => u.username === username)) {
                errorMessage.textContent = 'Username already exists.';
                return;
            }

            // Add new user
            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));

            // Redirect to login page with a success message
            window.location.href = 'index.html?registered=true';
        });
    }

    // Check for registration success message on login page
    if (window.location.search.includes('registered=true')) {
        const loginBox = document.querySelector('.login-box');
        if(loginBox){
            const successMessage = document.createElement('p');
            successMessage.textContent = 'Registration successful! Please log in.';
            successMessage.style.color = 'var(--primary-color)';
            loginBox.insertBefore(successMessage, loginForm);
        }
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
        const cryptoTabs = document.querySelector('.crypto-tabs');
        const cryptoContents = document.querySelectorAll('.crypto-content');
        const fileInput = document.getElementById('txn-screenshot');
        const fileChosenEl = document.getElementById('file-chosen');
        const checkerForm = document.getElementById('checker-form');

        // Premium Feature Elements
        const batchInput = document.getElementById('batch-input');
        const batchCheckBtn = document.getElementById('batch-check-btn');
        const liveCardsListEl = document.getElementById('live-cards-list');
        const deadCardsListEl = document.getElementById('dead-cards-list');
        const exportLiveBtn = document.getElementById('export-live-btn');
        const exportDeadBtn = document.getElementById('export-dead-btn');
        const supportTicketForm = document.getElementById('support-ticket-form');
        const ticketSuccessMessage = document.getElementById('ticket-success-message');

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

        cryptoTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                // Deactivate current active elements
                cryptoTabs.querySelector('.active').classList.remove('active');
                document.querySelector('.crypto-content.active').classList.remove('active');

                // Activate new tab and content
                e.target.classList.add('active');
                const crypto = e.target.dataset.crypto;
                document.getElementById(`${crypto}-info`).classList.add('active');
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileChosenEl.textContent = fileInput.files[0].name;
            } else {
                fileChosenEl.textContent = 'No file chosen';
            }
        });

        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = document.getElementById('deposit-amount').value;
            const txnId = document.getElementById('txn-id').value;
            const crypto = cryptoTabs.querySelector('.active').dataset.crypto.toUpperCase();

            depositMessageEl.textContent = `Request for $${amount} in ${crypto} (TXN: ${txnId}) sent for approval with screenshot.`;

            setTimeout(() => { depositMessageEl.textContent = ''; }, 4000);
            depositForm.reset();
            fileChosenEl.textContent = 'No file chosen';
        });

        logoutBtn.addEventListener('click', () => {
            // No need to save state on logout if we want a fresh start
            // localStorage.removeItem('userState');
            window.location.href = 'index.html';
        });

        supportTicketForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subject = document.getElementById('ticket-subject').value;
            const message = document.getElementById('ticket-message').value;

            const tickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
            const newTicket = {
                id: Date.now(), // simple unique id
                user: 'currentUser', // In a real app, this would be the logged-in user's ID
                subject,
                message,
                status: 'open'
            };
            tickets.push(newTicket);
            localStorage.setItem('supportTickets', JSON.stringify(tickets));

            ticketSuccessMessage.textContent = 'Support ticket submitted successfully!';
            setTimeout(() => { ticketSuccessMessage.textContent = ''; }, 3000);
            supportTicketForm.reset();
        });

        // Initial UI render
        updateUI();
    }

    // --- ADMIN DASHBOARD LOGIC (v2 with Advanced Features) ---
    const adminDashboard = document.getElementById('deposit-requests-table');
    if (adminDashboard) {
        // --- MODAL LOGIC ---
        const modal = document.getElementById('screenshot-modal');
        const closeBtn = document.querySelector('.close-btn');
        const openModal = () => modal.style.display = 'block';
        const closeModal = () => modal.style.display = 'none';
        closeBtn.onclick = closeModal;

        // --- TICKET MODAL LOGIC ---
        const ticketModal = document.getElementById('ticket-view-modal');
        const closeTicketBtn = ticketModal.querySelector('.ticket-close');
        const openTicketModal = () => ticketModal.style.display = 'block';
        const closeTicketModal = () => ticketModal.style.display = 'none';
        closeTicketBtn.onclick = closeTicketModal;

        window.onclick = (event) => {
            if (event.target == modal) closeModal();
            if (event.target == ticketModal) closeTicketModal();
        };

        // --- MOCK DATA ---
        let requests = JSON.parse(localStorage.getItem('depositRequests_v2')) || [
            { id: 1, crypto: 'BTC', amount: 50.00, txnId: 'abcde12345', screenshot: 'mock_img_url' },
            { id: 2, crypto: 'ETH', amount: 25.50, txnId: 'fghij67890', screenshot: 'mock_img_url' },
            { id: 3, crypto: 'USDT', amount: 100.00, txnId: 'klmno11223', screenshot: 'mock_img_url' },
        ];
        const saveRequests = () => {
            localStorage.setItem('depositRequests_v2', JSON.stringify(requests));
        };

        // --- RENDER DEPOSIT REQUESTS ---
        const renderRequests = () => {
            const tableBody = adminDashboard.querySelector('tbody');
            tableBody.innerHTML = '';
            requests.forEach(req => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${req.crypto}</td>
                    <td>$${req.amount.toFixed(2)}</td>
                    <td>${req.txnId}</td>
                    <td><button class="btn action-btn view-screenshot" data-id="${req.id}">View</button></td>
                    <td>
                        <button class="btn action-btn approve" data-id="${req.id}">Approve</button>
                        <button class="btn action-btn decline" data-id="${req.id}">Decline</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        };

        // --- TABLE ACTIONS (APPROVE/DECLINE/VIEW) ---
        adminDashboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-screenshot')) {
                openModal();
                // In a real app, you'd pass the specific screenshot URL here
            }
            if (e.target.classList.contains('approve') || e.target.classList.contains('decline')) {
                const id = parseInt(e.target.dataset.id);
                requests = requests.filter(req => req.id !== id);
                saveRequests();
                renderRequests();
            }
        });

        // --- TICKET LIST LOGIC ---
        const ticketListEl = document.getElementById('ticket-list');
        const renderTickets = () => {
            const tickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
            ticketListEl.innerHTML = '';
            tickets.forEach(ticket => {
                const li = document.createElement('li');
                li.dataset.id = ticket.id;
                li.innerHTML = `
                    <strong>${ticket.subject}</strong>
                    <span>From: ${ticket.user}</span>
                `;
                ticketListEl.appendChild(li);
            });
        };

        ticketListEl.addEventListener('click', (e) => {
            const ticketLi = e.target.closest('li');
            if (ticketLi) {
                const tickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
                const ticket = tickets.find(t => t.id == ticketLi.dataset.id);
                if (ticket) {
                    document.getElementById('ticket-user').textContent = ticket.user;
                    document.getElementById('ticket-modal-subject').textContent = ticket.subject;
                    document.getElementById('ticket-modal-message').textContent = ticket.message;
                    openTicketModal();
                }
            }
        });

        // --- API KEY MANAGEMENT ---
        const apiKeyForm = document.getElementById('api-key-form');
        const currentKeyEl = document.getElementById('current-key');
        const checkKeyBtn = document.getElementById('check-key-btn');
        const keyDetailsPanel = document.getElementById('key-details');

        apiKeyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyInput = document.getElementById('stripe-key');
            const newKey = keyInput.value;
            if (newKey) {
                currentKeyEl.textContent = `${newKey.substring(0, 8)}...${newKey.slice(-4)}`;
            }
            keyInput.value = '';
            keyDetailsPanel.classList.remove('active'); // Hide details on new key save
        });

        checkKeyBtn.addEventListener('click', () => {
            const isLive = Math.random() > 0.3; // 70% chance live

            const statusEl = document.getElementById('key-status-val');
            const typeEl = document.getElementById('key-type-val');
            const createdEl = document.getElementById('key-created-val');
            const permsEl = document.getElementById('key-perms-val');

            if (isLive) {
                statusEl.textContent = 'LIVE ✅';
                statusEl.style.color = 'var(--primary-color)';
                typeEl.textContent = 'Test Key';
                // Generate a random date within the last year
                const fakeDate = new Date(Date.now() - Math.floor(Math.random() * 31536000000));
                createdEl.textContent = fakeDate.toUTCString();
                permsEl.textContent = 'Read, Write, Charges, Payouts';
            } else {
                statusEl.textContent = 'DEAD ❌';
                statusEl.style.color = 'var(--error-color)';
                typeEl.textContent = 'N/A';
                createdEl.textContent = 'N/A';
                permsEl.textContent = 'N/A';
            }
            keyDetailsPanel.classList.add('active');
        });

        // --- WALLET MANAGEMENT ---
        const walletForm = document.getElementById('wallet-form');
        const walletInputs = {
            btc: document.getElementById('btc-addr'),
            eth: document.getElementById('eth-addr'),
            ltc: document.getElementById('ltc-addr'),
            usdt: document.getElementById('usdt-addr')
        };
        const walletSaveMessage = document.getElementById('wallet-save-message');

        const saveWalletAddresses = () => {
            const addresses = {
                btc: walletInputs.btc.value,
                eth: walletInputs.eth.value,
                ltc: walletInputs.ltc.value,
                usdt: walletInputs.usdt.value
            };
            localStorage.setItem('walletAddresses', JSON.stringify(addresses));
        };

        const loadWalletAddresses = () => {
            const addresses = JSON.parse(localStorage.getItem('walletAddresses')) || {};
            walletInputs.btc.value = addresses.btc || '';
            walletInputs.eth.value = addresses.eth || '';
            walletInputs.ltc.value = addresses.ltc || '';
            walletInputs.usdt.value = addresses.usdt || '';
        };

        walletForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveWalletAddresses();
            walletSaveMessage.textContent = 'Addresses saved successfully!';
            setTimeout(() => { walletSaveMessage.textContent = '' }, 3000);
        });


        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Initial render
        renderRequests();
        loadWalletAddresses();
        renderTickets();
    }
});
