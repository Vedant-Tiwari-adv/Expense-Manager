// ExpenseFlow - Expense Management System
class ExpenseFlowApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'dashboard';
        this.expenses = [];
        this.users = [];
        this.companies = [];
        this.approvalWorkflows = [];
        this.exchangeRates = {};
        this.charts = {};
        
        this.init();
    }

    init() {
        this.initializeData();
        this.setupEventListeners();
        this.showLogin();
        this.loadExchangeRates();
    }

    initializeData() {
        // Initialize sample data if not exists
        if (!localStorage.getItem('expenseflow_users')) {
            this.initializeSampleData();
        }
        
        this.loadData();
    }

    initializeSampleData() {
        // Sample companies
        const companies = [
            {
                id: 1,
                name: "TechCorp Inc.",
                currency: "USD",
                country: "US",
                autoApprovalLimit: 100,
                createdAt: new Date().toISOString()
            }
        ];

        // Sample users
        const users = [
            {
                id: 1,
                name: "Admin User",
                email: "admin@company.com",
                password: "admin123", // In real app, this would be hashed
                role: "Admin",
                companyId: 1,
                managerId: null,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: "John Manager",
                email: "manager@company.com",
                password: "manager123",
                role: "Manager",
                companyId: 1,
                managerId: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: "Jane Employee",
                email: "employee@company.com",
                password: "employee123",
                role: "Employee",
                companyId: 1,
                managerId: 2,
                createdAt: new Date().toISOString()
            }
        ];

        // Sample expenses
        const expenses = [
            {
                id: 1,
                userId: 3,
                amount: 45.50,
                currency: "USD",
                category: "Meals",
                description: "Client lunch meeting",
                date: "2024-10-01",
                status: "approved",
                receiptUrl: null,
                submittedAt: new Date().toISOString(),
                approvals: [
                    {
                        approverId: 2,
                        status: "approved",
                        comments: "Approved for client meeting",
                        approvedAt: new Date().toISOString()
                    }
                ]
            },
            {
                id: 2,
                userId: 3,
                amount: 129.99,
                currency: "USD",
                category: "Technology",
                description: "Software subscription",
                date: "2024-10-02",
                status: "pending",
                receiptUrl: null,
                submittedAt: new Date().toISOString(),
                approvals: []
            },
            {
                id: 3,
                userId: 3,
                amount: 850.00,
                currency: "USD",
                category: "Travel",
                description: "Flight to conference",
                date: "2024-10-03",
                status: "pending",
                receiptUrl: null,
                submittedAt: new Date().toISOString(),
                approvals: []
            }
        ];

        // Sample approval workflows
        const workflows = [
            {
                id: 1,
                companyId: 1,
                name: "Standard Approval",
                levels: [
                    { level: 1, role: "Manager", threshold: 1000 },
                    { level: 2, role: "Finance", threshold: 5000 },
                    { level: 3, role: "Director", threshold: 10000 }
                ],
                conditionalRules: {
                    percentageApproval: 60,
                    specificApprovers: ["CFO", "CEO"],
                    autoApprovalLimit: 100
                }
            }
        ];

        // Save to localStorage
        localStorage.setItem('expenseflow_companies', JSON.stringify(companies));
        localStorage.setItem('expenseflow_users', JSON.stringify(users));
        localStorage.setItem('expenseflow_expenses', JSON.stringify(expenses));
        localStorage.setItem('expenseflow_workflows', JSON.stringify(workflows));
    }

    loadData() {
        this.companies = JSON.parse(localStorage.getItem('expenseflow_companies') || '[]');
        this.users = JSON.parse(localStorage.getItem('expenseflow_users') || '[]');
        this.expenses = JSON.parse(localStorage.getItem('expenseflow_expenses') || '[]');
        this.approvalWorkflows = JSON.parse(localStorage.getItem('expenseflow_workflows') || '[]');
    }

    saveData() {
        localStorage.setItem('expenseflow_companies', JSON.stringify(this.companies));
        localStorage.setItem('expenseflow_users', JSON.stringify(this.users));
        localStorage.setItem('expenseflow_expenses', JSON.stringify(this.expenses));
        localStorage.setItem('expenseflow_workflows', JSON.stringify(this.approvalWorkflows));
    }

    async loadExchangeRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            this.exchangeRates = data.rates;
        } catch (error) {
            console.error('Failed to load exchange rates:', error);
            // Fallback exchange rates
            this.exchangeRates = {
                USD: 1,
                EUR: 0.85,
                GBP: 0.73,
                INR: 83.12,
                CAD: 1.25
            };
        }
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        const usdAmount = fromCurrency === 'USD' ? amount : amount / this.exchangeRates[fromCurrency];
        return toCurrency === 'USD' ? usdAmount : usdAmount * this.exchangeRates[toCurrency];
    }

    setupEventListeners() {
        // Login/Register forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Navigation
        document.getElementById('showRegister').addEventListener('click', () => this.showRegister());
        document.getElementById('showLogin').addEventListener('click', () => this.showLogin());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Demo account buttons
        document.querySelectorAll('.demo-buttons .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.target.getAttribute('data-email');
                const password = e.target.getAttribute('data-password');
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').value = password;
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.closest('.nav-link').getAttribute('data-view');
                this.showView(view);
            });
        });

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleExpenseSubmit(e));

        // Receipt upload
        document.getElementById('receiptFile').addEventListener('change', (e) => this.handleReceiptUpload(e));
        this.setupFileUploadArea();

        // Admin tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.showTab(tab);
            });
        });

        // Modal buttons
        document.getElementById('addUserBtn').addEventListener('click', () => this.showModal('addUserModal'));
        document.getElementById('saveUserBtn').addEventListener('click', () => this.saveUser());
        document.getElementById('approveExpenseBtn').addEventListener('click', () => this.approveExpense());
        document.getElementById('rejectExpenseBtn').addEventListener('click', () => this.rejectExpense());

        // Company settings
        document.getElementById('companySettingsForm').addEventListener('submit', (e) => this.saveCompanySettings(e));

        // Set today's date as default
        const expenseDateField = document.getElementById('expenseDate');
        if (expenseDateField) {
            expenseDateField.valueAsDate = new Date();
        }
    }

    setupFileUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('receiptFile').files = files;
                this.handleReceiptUpload({ target: { files } });
            }
        });
    }

    showLogin() {
        // Show login screen
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('registerScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('hidden');
        
        // Reset forms
        document.getElementById('loginForm').reset();
    }

    showRegister() {
        // Show register screen
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('registerScreen').classList.add('active');
        document.getElementById('mainApp').classList.add('hidden');
        
        // Reset forms
        document.getElementById('registerForm').reset();
    }

    showMainApp() {
        try {
            // Hide auth screens
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('registerScreen').classList.remove('active');
            
            // Show main app
            const mainApp = document.getElementById('mainApp');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('screen', 'active');
            
            // Update user interface
            this.updateUserInterface();
            
            // Show dashboard by default
            setTimeout(() => {
                this.showView('dashboard');
            }, 100);
            
        } catch (error) {
            console.error('Error showing main app:', error);
            this.showToast('Error loading application', 'error');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const user = this.users.find(u => u.email === email && u.password === password);
            
            if (user) {
                this.currentUser = user;
                this.showToast('Login successful!', 'success');
                
                // Delay showing main app to ensure DOM is ready
                setTimeout(() => {
                    this.showMainApp();
                }, 100);
            } else {
                this.showToast('Invalid email or password', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed', 'error');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        
        try {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const companyName = document.getElementById('registerCompany').value;
            const country = document.getElementById('registerCountry').value;
            const password = document.getElementById('registerPassword').value;

            // Check if user already exists
            if (this.users.find(u => u.email === email)) {
                this.showToast('User with this email already exists', 'error');
                return;
            }

            // Create new company
            const newCompany = {
                id: this.companies.length + 1,
                name: companyName,
                currency: this.getCurrencyByCountry(country),
                country: country,
                autoApprovalLimit: 100,
                createdAt: new Date().toISOString()
            };
            this.companies.push(newCompany);

            // Create new admin user
            const newUser = {
                id: this.users.length + 1,
                name: name,
                email: email,
                password: password,
                role: "Admin",
                companyId: newCompany.id,
                managerId: null,
                createdAt: new Date().toISOString()
            };
            this.users.push(newUser);

            this.saveData();
            
            this.currentUser = newUser;
            this.showToast('Account created successfully!', 'success');
            
            setTimeout(() => {
                this.showMainApp();
            }, 100);
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed', 'error');
        }
    }

    getCurrencyByCountry(country) {
        const currencyMap = {
            'US': 'USD',
            'GB': 'GBP',
            'IN': 'INR',
            'CA': 'CAD',
            'DE': 'EUR'
        };
        return currencyMap[country] || 'USD';
    }

    logout() {
        this.currentUser = null;
        document.body.className = '';
        
        // Clear any existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        this.showLogin();
        this.showToast('Logged out successfully', 'success');
    }

    updateUserInterface() {
        if (!this.currentUser) return;

        try {
            const company = this.companies.find(c => c.id === this.currentUser.companyId);
            
            // Update user info
            const currentUserElement = document.getElementById('currentUser');
            const companyInfoElement = document.getElementById('companyInfo');
            
            if (currentUserElement) {
                currentUserElement.textContent = this.currentUser.name;
            }
            
            if (companyInfoElement) {
                companyInfoElement.textContent = `${company?.name || 'Company'} (${company?.currency || 'USD'})`;
            }

            // Update role-based visibility
            document.body.className = `role-${this.currentUser.role.toLowerCase()}`;

            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
        } catch (error) {
            console.error('Error updating user interface:', error);
        }
    }

    showView(viewName) {
        try {
            this.currentView = viewName;

            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });

            // Show selected view
            const targetView = document.getElementById(`${viewName}View`);
            if (targetView) {
                targetView.classList.add('active');
            }

            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-view') === viewName) {
                    link.classList.add('active');
                }
            });

            // Load view-specific data with slight delay to ensure DOM is ready
            setTimeout(() => {
                switch (viewName) {
                    case 'dashboard':
                        this.loadDashboard();
                        break;
                    case 'expenses':
                        this.loadExpenses();
                        break;
                    case 'approvals':
                        this.loadApprovals();
                        break;
                    case 'admin':
                        this.loadAdmin();
                        break;
                }
            }, 50);
        } catch (error) {
            console.error('Error showing view:', error);
        }
    }

    loadDashboard() {
        try {
            const userExpenses = this.expenses.filter(e => 
                e.userId === this.currentUser.id || this.currentUser.role !== 'Employee'
            );

            // Update stats
            const totalAmount = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const pendingCount = userExpenses.filter(e => e.status === 'pending').length;
            const approvedCount = userExpenses.filter(e => e.status === 'approved').length;
            const rejectedCount = userExpenses.filter(e => e.status === 'rejected').length;

            const company = this.companies.find(c => c.id === this.currentUser.companyId);
            const currency = company?.currency || 'USD';

            // Update stat elements safely
            this.updateElement('totalExpenses', this.formatCurrency(totalAmount, currency));
            this.updateElement('pendingExpenses', pendingCount);
            this.updateElement('approvedExpenses', approvedCount);
            this.updateElement('rejectedExpenses', rejectedCount);

            // Load charts and recent expenses
            setTimeout(() => {
                this.loadCharts();
                this.loadRecentExpenses();
            }, 100);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    loadCharts() {
        try {
            // Destroy existing charts
            if (this.charts.monthly) {
                this.charts.monthly.destroy();
            }
            if (this.charts.category) {
                this.charts.category.destroy();
            }

            // Monthly chart
            const monthlyCtx = document.getElementById('monthlyChart');
            if (monthlyCtx) {
                this.charts.monthly = new Chart(monthlyCtx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Monthly Expenses',
                            data: [2500, 3200, 2800, 3500, 4100, 3800],
                            borderColor: '#1FB8CD',
                            backgroundColor: 'rgba(31, 184, 205, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Category chart
            const categoryCtx = document.getElementById('categoryChart');
            if (categoryCtx) {
                this.charts.category = new Chart(categoryCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Travel', 'Meals', 'Office', 'Technology', 'Marketing'],
                        datasets: [{
                            data: [8500, 4200, 1800, 3200, 2300],
                            backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }

    loadRecentExpenses() {
        try {
            const container = document.getElementById('recentExpensesList');
            if (!container) return;

            const recentExpenses = this.expenses
                .filter(e => this.currentUser.role === 'Employee' ? e.userId === this.currentUser.id : true)
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .slice(0, 5);

            container.innerHTML = recentExpenses.map(expense => {
                const user = this.users.find(u => u.id === expense.userId);
                
                return `
                    <div class="expense-item">
                        <div class="expense-details">
                            <div class="expense-title">${expense.description}</div>
                            <div class="expense-meta">
                                ${user?.name} • ${expense.category} • ${this.formatDate(expense.date)}
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                            <div class="expense-amount">${this.formatCurrency(expense.amount, expense.currency)}</div>
                            <span class="status status--${expense.status}">${this.capitalizeFirst(expense.status)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading recent expenses:', error);
        }
    }

    handleExpenseSubmit(e) {
        e.preventDefault();

        try {
            const newExpense = {
                id: this.expenses.length + 1,
                userId: this.currentUser.id,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                currency: document.getElementById('expenseCurrency').value,
                category: document.getElementById('expenseCategory').value,
                description: document.getElementById('expenseDescription').value,
                date: document.getElementById('expenseDate').value,
                status: 'pending',
                receiptUrl: null,
                submittedAt: new Date().toISOString(),
                approvals: []
            };

            this.expenses.push(newExpense);
            this.saveData();

            // Reset form
            document.getElementById('expenseForm').reset();
            const expenseDateField = document.getElementById('expenseDate');
            if (expenseDateField) {
                expenseDateField.valueAsDate = new Date();
            }
            
            const ocrResults = document.getElementById('ocrResults');
            if (ocrResults) {
                ocrResults.classList.add('hidden');
            }

            this.showToast('Expense submitted successfully!', 'success');
            this.showView('expenses');
        } catch (error) {
            console.error('Error submitting expense:', error);
            this.showToast('Error submitting expense', 'error');
        }
    }

    handleReceiptUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Simulate OCR processing
        setTimeout(() => {
            this.simulateOCRProcessing();
        }, 1000);

        this.showToast('Processing receipt...', 'info');
    }

    simulateOCRProcessing() {
        try {
            // Mock OCR data
            const ocrData = {
                merchant: "Starbucks Coffee",
                date: "2024-10-04",
                amount: 15.49,
                currency: "USD",
                category: "Meals"
            };

            // Populate form with OCR data
            this.updateElement('expenseAmount', ocrData.amount, 'value');
            this.updateElement('expenseCurrency', ocrData.currency, 'value');
            this.updateElement('expenseCategory', ocrData.category, 'value');
            this.updateElement('expenseDescription', `Purchase at ${ocrData.merchant}`, 'value');
            this.updateElement('expenseDate', ocrData.date, 'value');

            // Show OCR results
            const ocrResults = document.getElementById('ocrResults');
            if (ocrResults) {
                ocrResults.classList.remove('hidden');
            }
            
            this.showToast('Receipt processed successfully!', 'success');
        } catch (error) {
            console.error('Error processing OCR:', error);
            this.showToast('Error processing receipt', 'error');
        }
    }

    updateElement(id, value, property = 'textContent') {
        const element = document.getElementById(id);
        if (element) {
            if (property === 'value') {
                element.value = value;
            } else {
                element[property] = value;
            }
        }
    }

    loadExpenses() {
        try {
            const container = document.getElementById('expensesList');
            if (!container) return;

            const userExpenses = this.expenses.filter(e => e.userId === this.currentUser.id);

            container.innerHTML = userExpenses.map(expense => {
                return `
                    <div class="expense-item">
                        <div class="expense-details">
                            <div class="expense-title">${expense.description}</div>
                            <div class="expense-meta">
                                ${expense.category} • ${this.formatDate(expense.date)} • ${this.formatDate(expense.submittedAt)}
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <div class="expense-amount">${this.formatCurrency(expense.amount, expense.currency)}</div>
                            <span class="status status--${expense.status}">
                                <span class="status-dot ${expense.status}"></span>
                                ${this.capitalizeFirst(expense.status)}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    }

    loadApprovals() {
        if (this.currentUser.role === 'Employee') return;

        try {
            const container = document.getElementById('approvalsList');
            if (!container) return;

            const pendingExpenses = this.expenses.filter(e => 
                e.status === 'pending' && e.userId !== this.currentUser.id
            );

            container.innerHTML = pendingExpenses.map(expense => {
                const user = this.users.find(u => u.id === expense.userId);
                
                return `
                    <div class="approval-item">
                        <div class="approval-header">
                            <div class="approval-employee">${user?.name}</div>
                            <div class="approval-amount">${this.formatCurrency(expense.amount, expense.currency)}</div>
                        </div>
                        <div class="approval-details">
                            <div class="approval-detail">
                                <div class="approval-detail-label">Category</div>
                                <div class="approval-detail-value">${expense.category}</div>
                            </div>
                            <div class="approval-detail">
                                <div class="approval-detail-label">Date</div>
                                <div class="approval-detail-value">${this.formatDate(expense.date)}</div>
                            </div>
                            <div class="approval-detail">
                                <div class="approval-detail-label">Submitted</div>
                                <div class="approval-detail-value">${this.formatDate(expense.submittedAt)}</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <div class="approval-detail-label">Description</div>
                            <div class="approval-detail-value">${expense.description}</div>
                        </div>
                        <div class="approval-actions">
                            <button class="btn btn--outline" onclick="app.showExpenseDetails(${expense.id})">View Details</button>
                            <button class="btn btn--secondary" onclick="app.showApprovalModal(${expense.id}, 'reject')">Reject</button>
                            <button class="btn btn--primary" onclick="app.showApprovalModal(${expense.id}, 'approve')">Approve</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading approvals:', error);
        }
    }

    showApprovalModal(expenseId, action) {
        try {
            const expense = this.expenses.find(e => e.id === expenseId);
            if (!expense) return;

            const user = this.users.find(u => u.id === expense.userId);

            const detailsContainer = document.getElementById('approvalExpenseDetails');
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="approval-details">
                        <div class="approval-detail">
                            <div class="approval-detail-label">Employee</div>
                            <div class="approval-detail-value">${user?.name}</div>
                        </div>
                        <div class="approval-detail">
                            <div class="approval-detail-label">Amount</div>
                            <div class="approval-detail-value">${this.formatCurrency(expense.amount, expense.currency)}</div>
                        </div>
                        <div class="approval-detail">
                            <div class="approval-detail-label">Category</div>
                            <div class="approval-detail-value">${expense.category}</div>
                        </div>
                        <div class="approval-detail">
                            <div class="approval-detail-label">Date</div>
                            <div class="approval-detail-value">${this.formatDate(expense.date)}</div>
                        </div>
                    </div>
                    <div style="margin-top: 16px;">
                        <div class="approval-detail-label">Description</div>
                        <div class="approval-detail-value">${expense.description}</div>
                    </div>
                `;
            }

            this.pendingApproval = { expenseId, action };
            this.showModal('approvalModal');
        } catch (error) {
            console.error('Error showing approval modal:', error);
        }
    }

    approveExpense() {
        try {
            const comments = document.getElementById('approvalComments').value;
            const expense = this.expenses.find(e => e.id === this.pendingApproval.expenseId);
            
            if (expense) {
                expense.status = 'approved';
                expense.approvals.push({
                    approverId: this.currentUser.id,
                    status: 'approved',
                    comments: comments,
                    approvedAt: new Date().toISOString()
                });

                this.saveData();
                this.showToast('Expense approved successfully!', 'success');
            }

            this.closeModal('approvalModal');
            this.loadApprovals();
        } catch (error) {
            console.error('Error approving expense:', error);
            this.showToast('Error approving expense', 'error');
        }
    }

    rejectExpense() {
        try {
            const comments = document.getElementById('approvalComments').value;
            const expense = this.expenses.find(e => e.id === this.pendingApproval.expenseId);
            
            if (expense) {
                expense.status = 'rejected';
                expense.approvals.push({
                    approverId: this.currentUser.id,
                    status: 'rejected',
                    comments: comments,
                    rejectedAt: new Date().toISOString()
                });

                this.saveData();
                this.showToast('Expense rejected', 'warning');
            }

            this.closeModal('approvalModal');
            this.loadApprovals();
        } catch (error) {
            console.error('Error rejecting expense:', error);
            this.showToast('Error rejecting expense', 'error');
        }
    }

    loadAdmin() {
        if (this.currentUser.role !== 'Admin') return;

        try {
            this.loadUsersTable();
            this.loadWorkflowBuilder();
            this.loadCompanySettings();
        } catch (error) {
            console.error('Error loading admin panel:', error);
        }
    }

    loadUsersTable() {
        try {
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;

            const companyUsers = this.users.filter(u => u.companyId === this.currentUser.companyId);

            tbody.innerHTML = companyUsers.map(user => {
                const manager = this.users.find(u => u.id === user.managerId);
                return `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td><span class="status status--info">${user.role}</span></td>
                        <td>${manager?.name || 'None'}</td>
                        <td>
                            <button class="btn btn--sm btn--outline" onclick="app.editUser(${user.id})">Edit</button>
                            <button class="btn btn--sm btn--secondary" onclick="app.deleteUser(${user.id})">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading users table:', error);
        }
    }

    loadWorkflowBuilder() {
        try {
            const container = document.getElementById('workflowLevels');
            if (!container) return;

            const workflow = this.approvalWorkflows.find(w => w.companyId === this.currentUser.companyId);
            
            if (!workflow) return;

            container.innerHTML = workflow.levels.map((level, index) => `
                <div class="workflow-level">
                    <input type="number" value="${level.level}" placeholder="Level" readonly>
                    <select value="${level.role}">
                        <option value="Manager" ${level.role === 'Manager' ? 'selected' : ''}>Manager</option>
                        <option value="Finance" ${level.role === 'Finance' ? 'selected' : ''}>Finance</option>
                        <option value="Director" ${level.role === 'Director' ? 'selected' : ''}>Director</option>
                        <option value="CEO" ${level.role === 'CEO' ? 'selected' : ''}>CEO</option>
                    </select>
                    <input type="number" value="${level.threshold}" placeholder="Threshold Amount">
                    <button class="btn btn--sm btn--secondary" onclick="app.removeWorkflowLevel(${index})">Remove</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading workflow builder:', error);
        }
    }

    loadCompanySettings() {
        try {
            const company = this.companies.find(c => c.id === this.currentUser.companyId);
            if (!company) return;

            this.updateElement('companyName', company.name, 'value');
            this.updateElement('defaultCurrency', company.currency, 'value');
            this.updateElement('autoApprovalLimit', company.autoApprovalLimit, 'value');
        } catch (error) {
            console.error('Error loading company settings:', error);
        }
    }

    saveCompanySettings(e) {
        e.preventDefault();
        
        try {
            const company = this.companies.find(c => c.id === this.currentUser.companyId);
            if (!company) return;

            company.name = document.getElementById('companyName').value;
            company.currency = document.getElementById('defaultCurrency').value;
            company.autoApprovalLimit = parseFloat(document.getElementById('autoApprovalLimit').value);

            this.saveData();
            this.showToast('Company settings saved!', 'success');
            this.updateUserInterface();
        } catch (error) {
            console.error('Error saving company settings:', error);
            this.showToast('Error saving settings', 'error');
        }
    }

    saveUser() {
        try {
            const name = document.getElementById('newUserName').value;
            const email = document.getElementById('newUserEmail').value;
            const role = document.getElementById('newUserRole').value;
            const managerId = document.getElementById('newUserManager').value || null;

            // Check if user exists
            if (this.users.find(u => u.email === email)) {
                this.showToast('User with this email already exists', 'error');
                return;
            }

            const newUser = {
                id: this.users.length + 1,
                name,
                email,
                password: 'password123', // Default password
                role,
                companyId: this.currentUser.companyId,
                managerId: managerId ? parseInt(managerId) : null,
                createdAt: new Date().toISOString()
            };

            this.users.push(newUser);
            this.saveData();
            
            this.closeModal('addUserModal');
            this.loadUsersTable();
            this.showToast('User created successfully!', 'success');
        } catch (error) {
            console.error('Error saving user:', error);
            this.showToast('Error creating user', 'error');
        }
    }

    showTab(tabName) {
        try {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab
            const targetTab = document.getElementById(`${tabName}Tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // Add active class to clicked tab button
            event.target.classList.add('active');
        } catch (error) {
            console.error('Error showing tab:', error);
        }
    }

    showModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
            }
            
            // Populate manager dropdown for add user modal
            if (modalId === 'addUserModal') {
                const managerSelect = document.getElementById('newUserManager');
                if (managerSelect) {
                    const managers = this.users.filter(u => 
                        u.companyId === this.currentUser.companyId && 
                        (u.role === 'Manager' || u.role === 'Admin')
                    );
                    
                    managerSelect.innerHTML = '<option value="">No Manager</option>' + 
                        managers.map(manager => 
                            `<option value="${manager.id}">${manager.name}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    }

    closeModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // Clear form if it's add user modal
            if (modalId === 'addUserModal') {
                const form = document.getElementById('addUserForm');
                if (form) {
                    form.reset();
                }
            }
            
            if (modalId === 'approvalModal') {
                const comments = document.getElementById('approvalComments');
                if (comments) {
                    comments.value = '';
                }
            }
        } catch (error) {
            console.error('Error closing modal:', error);
        }
    }

    showToast(message, type = 'info') {
        try {
            // Remove existing toast
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }

            // Create new toast
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            // Show toast
            setTimeout(() => toast.classList.add('show'), 10);
            
            // Hide toast after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }

    formatCurrency(amount, currency = 'USD') {
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            INR: '₹',
            CAD: 'C$'
        };

        return `${symbols[currency] || '$'}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Global function to close modals (for onclick handlers)
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ExpenseFlowApp();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.app) {
            window.app = new ExpenseFlowApp();
        }
    });
} else {
    window.app = new ExpenseFlowApp();
}