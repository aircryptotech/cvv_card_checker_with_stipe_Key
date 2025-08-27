document.addEventListener('DOMContentLoaded', () => {

    // --- AUTHENTICATION LOGIC ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');

            if (username === 'admin' && password === 'anamaka') {
                sessionStorage.setItem('currentUser', 'admin');
                window.location.href = 'admin.html';
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                sessionStorage.setItem('currentUser', username);
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

            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));

            const newUserState = { balance: 0.00, checksPerformed: 0, liveCards: [], deadCards: [] };
            localStorage.setItem(`userState_${username}`, JSON.stringify(newUserState));

            window.location.href = 'login.html?registered=true';
        });
    }

    if (window.location.search.includes('registered=true')) {
        const loginBox = document.querySelector('.login-box');
        if (loginBox) {
            const successMessage = document.createElement('p');
            successMessage.textContent = 'Registration successful! Please log in.';
            successMessage.style.color = 'var(--primary-color)';
            loginBox.insertBefore(successMessage, loginForm);
        }
    }

    // --- LOGGED-IN USER APP LOGIC ---
    const userApp = document.querySelector('.app-header');
    if (userApp) {
        const currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        const defaultState = { balance: 0.00, checksPerformed: 0, liveCards: [], deadCards: [] };
        let state = JSON.parse(localStorage.getItem(`userState_${currentUser}`)) || defaultState;

        const saveState = () => {
            localStorage.setItem(`userState_${currentUser}`, JSON.stringify(state));
        };

        const updateStats = () => {
            const userBalanceEls = document.querySelectorAll('#user-balance');
            userBalanceEls.forEach(el => {
                if(el) el.textContent = `$${state.balance.toFixed(2)}`;
            });
        };

        const logoutBtn = userApp.querySelector('#logout-btn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }

        // --- CHECKER PAGE (dashboard.html) ---
        const checkerForm = document.getElementById('checker-form');
        if (checkerForm) {
            const checksPerformedEl = document.getElementById('checks-performed');
            if (checksPerformedEl) checksPerformedEl.textContent = state.checksPerformed;

            const checkerResultEl = document.getElementById('checker-result');
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

            const performCheck = (cardInfo) => {
                const costPerCheck = 0.05;
                if (state.balance < costPerCheck) {
                    checkerResultEl.textContent = 'Insufficient balance!';
                    checkerResultEl.className = 'result-box dead';
                    return false;
                }
                state.balance -= costPerCheck;
                state.checksPerformed++;
                const isLive = Math.random() > 0.3;
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
                if (performCheck(card)) {
                    checkerResultEl.textContent = `Check complete. Result added to lists.`;
                    checkerResultEl.className = 'result-box live';
                }
                updateStats();
                if(checksPerformedEl) checksPerformedEl.textContent = state.checksPerformed;
                renderLists();
                saveState();
                checkerForm.reset();
            });

            batchCheckBtn.addEventListener('click', () => {
                const cards = batchInput.value.trim().split('\n').filter(c => c);
                if (cards.length === 0) return;
                for (const card of cards) {
                    if (!performCheck(card.trim())) break;
                }
                updateStats();
                if(checksPerformedEl) checksPerformedEl.textContent = state.checksPerformed;
                renderLists();
                saveState();
                batchInput.value = '';
            });

            const exportList = (list, filename) => {
                const content = list.join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            };

            exportLiveBtn.addEventListener('click', () => exportList(state.liveCards, 'live_cards.txt'));
            exportDeadBtn.addEventListener('click', () => exportList(state.deadCards, 'dead_cards.txt'));

            renderLists();
        }

        // --- DEPOSIT PAGE (deposit.html) ---
        const depositForm = document.getElementById('deposit-form');
        if (depositForm) {
            const addresses = JSON.parse(localStorage.getItem('walletAddresses')) || {};
            const btcAddressEl = document.getElementById('btc-address');
            const ethAddressEl = document.getElementById('eth-address');
            const ltcAddressEl = document.getElementById('ltc-address');
            const usdtAddressEl = document.getElementById('usdt-address');

            if(btcAddressEl) btcAddressEl.textContent = addresses.btc || '...';
            if(ethAddressEl) ethAddressEl.textContent = addresses.eth || '...';
            if(ltcAddressEl) ltcAddressEl.textContent = addresses.ltc || '...';
            if(usdtAddressEl) usdtAddressEl.textContent = addresses.usdt || '...';

            const depositMessageEl = document.getElementById('deposit-message');
            const cryptoTabs = document.querySelector('.crypto-tabs');
            const fileInput = document.getElementById('txn-screenshot');
            const fileChosenEl = document.getElementById('file-chosen');
            const qrCodeImg = document.getElementById('qr-code-img');

            function generateQRCode(address) {
                if (qrCodeImg && address && address !== '...') {
                    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(address)}`;
                    qrCodeImg.src = apiUrl;
                    qrCodeImg.style.display = 'block';
                } else if (qrCodeImg) {
                    qrCodeImg.style.display = 'none';
                }
            }

            // Generate initial QR code
            const initialAddress = document.getElementById('btc-address').textContent;
            generateQRCode(initialAddress);

            cryptoTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab-btn');
                if (tab) {
                    cryptoTabs.querySelector('.active').classList.remove('active');
                    document.querySelector('.crypto-content.active').classList.remove('active');
                    tab.classList.add('active');
                    const crypto = tab.dataset.crypto;
                    document.getElementById(`${crypto}-info`).classList.add('active');
                    const newAddress = document.getElementById(`${crypto}-address`).textContent;
                    generateQRCode(newAddress);
                }
            });

            fileInput.addEventListener('change', () => {
                fileChosenEl.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file chosen';
            });

            depositForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('deposit-amount').value;
                const txnId = document.getElementById('txn-id').value;
                const crypto = cryptoTabs.querySelector('.active').dataset.crypto.toUpperCase();
                depositMessageEl.textContent = `Request for $${amount} in ${crypto} (TXN: ${txnId}) sent for approval.`;
                setTimeout(() => { depositMessageEl.textContent = ''; }, 4000);
                depositForm.reset();
                fileChosenEl.textContent = 'No file chosen';
            });
        }

        // --- SUPPORT PAGE (support.html) ---
        const supportTicketForm = document.getElementById('support-ticket-form');
        if (supportTicketForm) {
            const userTicketListEl = document.getElementById('user-ticket-list');
            const newTicketView = document.getElementById('new-ticket-view');
            const conversationView = document.getElementById('conversation-view');
            const newTicketBtn = document.getElementById('new-ticket-btn');
            const ticketSuccessMessage = document.getElementById('ticket-success-message');

            const renderUserTickets = () => {
                const allTickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
                const userTickets = allTickets.filter(t => t.user === currentUser);
                userTicketListEl.innerHTML = '';
                userTickets.forEach(ticket => {
                    const div = document.createElement('div');
                    div.className = 'ticket-summary';
                    div.dataset.id = ticket.id;
                    div.innerHTML = `<p><strong>${ticket.subject}</strong></p><span class="status-open">${ticket.status}</span>`;
                    userTicketListEl.appendChild(div);
                });
            };

            const renderUserConversation = (ticket) => {
                document.getElementById('convo-subject').textContent = ticket.subject;
                const messagesContainer = document.getElementById('convo-messages');
                messagesContainer.innerHTML = '';

                const userMsg = document.createElement('div');
                userMsg.className = 'message user-message';
                userMsg.innerHTML = `<span class="author">You</span><p>${ticket.message}</p>`;
                messagesContainer.appendChild(userMsg);

                ticket.replies.forEach(reply => {
                    const replyMsg = document.createElement('div');
                    replyMsg.className = 'message admin-reply';
                    replyMsg.innerHTML = `<span class="author">Admin</span><p>${reply.message}</p>`;
                    messagesContainer.appendChild(replyMsg);
                });
            };

            userTicketListEl.addEventListener('click', (e) => {
                const ticketDiv = e.target.closest('.ticket-summary');
                if (ticketDiv) {
                    const allTickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
                    const ticket = allTickets.find(t => t.id == ticketDiv.dataset.id);
                    if (ticket) {
                        newTicketView.classList.add('hidden');
                        conversationView.classList.remove('hidden');
                        renderUserConversation(ticket);
                        // Highlight active ticket
                        const currentActive = userTicketListEl.querySelector('.active');
                        if(currentActive) currentActive.classList.remove('active');
                        ticketDiv.classList.add('active');
                    }
                }
            });

            newTicketBtn.addEventListener('click', () => {
                conversationView.classList.add('hidden');
                newTicketView.classList.remove('hidden');
                const currentActive = userTicketListEl.querySelector('.active');
                if(currentActive) currentActive.classList.remove('active');
            });

            supportTicketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const subject = document.getElementById('ticket-subject').value;
                const message = document.getElementById('ticket-message').value;
                const allTickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
                const newTicket = { id: Date.now(), user: currentUser, subject, message, status: 'open', replies: [] };
                allTickets.push(newTicket);
                localStorage.setItem('supportTickets', JSON.stringify(allTickets));

                ticketSuccessMessage.textContent = 'Support ticket submitted successfully!';
                setTimeout(() => { ticketSuccessMessage.textContent = ''; }, 3000);
                supportTicketForm.reset();
                renderUserTickets(); // Re-render the list
            });

            renderUserTickets();
        }

        // Initial UI update for all app pages
        updateStats();
    }

    // --- ADMIN DASHBOARD LOGIC (v2 with Advanced Features) ---
    const adminDashboard = document.getElementById('deposit-requests-table');
    if (adminDashboard) {
        // --- MODAL LOGIC ---
        const modal = document.getElementById('screenshot-modal');
        const closeBtn = document.querySelector('.close-btn');
        const openModal = () => modal.style.display = 'block';
        const closeModal = () => modal.style.display = 'none';
        if(closeBtn) closeBtn.onclick = closeModal;

        const ticketModal = document.getElementById('ticket-view-modal');
        const closeTicketBtn = ticketModal.querySelector('.ticket-close');
        const openTicketModal = () => ticketModal.style.display = 'block';
        const closeTicketModal = () => ticketModal.style.display = 'none';
        if(closeTicketBtn) closeTicketBtn.onclick = closeTicketModal;

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

        adminDashboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-screenshot')) {
                openModal();
            }
            if (e.target.classList.contains('approve') || e.target.classList.contains('decline')) {
                const id = parseInt(e.target.dataset.id);
                requests = requests.filter(req => req.id !== id);
                saveRequests();
                renderRequests();
            }
        });

        const ticketListEl = document.getElementById('ticket-list');
        if (ticketListEl) { // This block is for the ADMIN ticket list
            let tickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
            let currentOpenTicketId = null;

            const renderTickets = () => {
                ticketListEl.innerHTML = '';
                tickets.forEach(ticket => {
                    const li = document.createElement('li');
                    li.dataset.id = ticket.id;
                    li.className = 'ticket-summary';
                    li.innerHTML = `
                        <p><strong>${ticket.subject}</strong></p>
                        <span>From: ${ticket.user}</span>
                    `;
                    ticketListEl.appendChild(li);
                });
            };

            const renderConversation = (ticket) => {
                const conversationView = document.getElementById('ticket-conversation');
                conversationView.innerHTML = ''; // Clear previous

                // Original message
                const userMsg = document.createElement('div');
                userMsg.className = 'message user-message';
                userMsg.innerHTML = `<span class="author">User: ${ticket.user}</span><p>${ticket.message}</p>`;
                conversationView.appendChild(userMsg);

                // Replies
                ticket.replies.forEach(reply => {
                    const replyMsg = document.createElement('div');
                    replyMsg.className = `message ${reply.author === 'admin' ? 'admin-reply' : 'user-message'}`;
                    replyMsg.innerHTML = `<span class="author">${reply.author === 'admin' ? 'Admin' : 'User'}</span><p>${reply.message}</p>`;
                    conversationView.appendChild(replyMsg);
                });
            };

            ticketListEl.addEventListener('click', (e) => {
                const ticketLi = e.target.closest('li');
                if (ticketLi) {
                    currentOpenTicketId = ticketLi.dataset.id;
                    const ticket = tickets.find(t => t.id == currentOpenTicketId);
                    if (ticket) {
                        renderConversation(ticket);
                        openTicketModal();
                    }
                }
            });

            const replyForm = document.getElementById('ticket-reply-form');
            replyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const messageInput = document.getElementById('ticket-reply-message');
                const message = messageInput.value;
                if (!message || !currentOpenTicketId) return;

                const ticketIndex = tickets.findIndex(t => t.id == currentOpenTicketId);
                if (ticketIndex > -1) {
                    tickets[ticketIndex].replies.push({ author: 'admin', message });
                    localStorage.setItem('supportTickets', JSON.stringify(tickets));
                    renderConversation(tickets[ticketIndex]); // Re-render the conversation
                    messageInput.value = '';
                }
            });

            renderTickets();
        }

        const apiKeyForm = document.getElementById('api-key-form');
        const currentKeyEl = document.getElementById('current-key');
        const checkKeyBtn = document.getElementById('check-key-btn');
        const keyDetailsPanel = document.getElementById('key-details');

        apiKeyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyInput = document.getElementById('stripe-key');
            if (keyInput.value) {
                currentKeyEl.textContent = `${keyInput.value.substring(0, 8)}...${keyInput.value.slice(-4)}`;
            }
            keyInput.value = '';
            keyDetailsPanel.classList.remove('active');
        });

        checkKeyBtn.addEventListener('click', () => {
            const isLive = Math.random() > 0.3;
            const statusEl = document.getElementById('key-status-val');
            const typeEl = document.getElementById('key-type-val');
            const createdEl = document.getElementById('key-created-val');
            const permsEl = document.getElementById('key-perms-val');
            if (isLive) {
                statusEl.textContent = 'LIVE ✅';
                statusEl.style.color = 'var(--primary-color)';
                typeEl.textContent = 'Test Key';
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

        const walletForm = document.getElementById('wallet-form');
        const walletSaveMessage = document.getElementById('wallet-save-message');
        const walletInputs = {
            btc: document.getElementById('btc-addr'),
            eth: document.getElementById('eth-addr'),
            ltc: document.getElementById('ltc-addr'),
            usdt: document.getElementById('usdt-addr')
        };

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

        const adminLogoutBtn = document.getElementById('logout-btn');
        if(adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }

        // Initial render
        renderRequests();
        loadWalletAddresses();
    }
});
