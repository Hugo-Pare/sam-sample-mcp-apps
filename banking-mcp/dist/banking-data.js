// Mock bank accounts
const MOCK_ACCOUNTS = [
    // user_basic accounts
    {
        accountId: 'acc_basic_001',
        userId: 'user_basic',
        accountNumber: '****1234',
        accountType: 'checking',
        balance: 5420.50,
        currency: 'USD',
        status: 'active',
        createdAt: '2023-01-15T00:00:00Z',
        lastActivity: '2026-01-19T14:30:00Z',
    },
    {
        accountId: 'acc_basic_002',
        userId: 'user_basic',
        accountNumber: '****5678',
        accountType: 'savings',
        balance: 12350.75,
        currency: 'USD',
        status: 'active',
        createdAt: '2023-01-15T00:00:00Z',
        lastActivity: '2026-01-18T09:15:00Z',
    },
    // user_transactions accounts
    {
        accountId: 'acc_trans_001',
        userId: 'user_transactions',
        accountNumber: '****9012',
        accountType: 'checking',
        balance: 8234.25,
        currency: 'USD',
        status: 'active',
        createdAt: '2022-06-10T00:00:00Z',
        lastActivity: '2026-01-20T08:45:00Z',
    },
    {
        accountId: 'acc_trans_002',
        userId: 'user_transactions',
        accountNumber: '****3456',
        accountType: 'savings',
        balance: 25600.00,
        currency: 'USD',
        status: 'active',
        createdAt: '2022-06-10T00:00:00Z',
        lastActivity: '2026-01-15T16:20:00Z',
    },
    {
        accountId: 'acc_trans_003',
        userId: 'user_transactions',
        accountNumber: '****7890',
        accountType: 'credit',
        balance: -1250.50,
        currency: 'USD',
        status: 'active',
        createdAt: '2023-03-20T00:00:00Z',
        lastActivity: '2026-01-19T12:00:00Z',
    },
    // user_full accounts
    {
        accountId: 'acc_full_001',
        userId: 'user_full',
        accountNumber: '****2468',
        accountType: 'checking',
        balance: 15750.80,
        currency: 'USD',
        status: 'active',
        createdAt: '2021-09-01T00:00:00Z',
        lastActivity: '2026-01-20T10:30:00Z',
    },
    {
        accountId: 'acc_full_002',
        userId: 'user_full',
        accountNumber: '****1357',
        accountType: 'savings',
        balance: 45000.00,
        currency: 'USD',
        status: 'active',
        createdAt: '2021-09-01T00:00:00Z',
        lastActivity: '2026-01-10T14:00:00Z',
    },
    {
        accountId: 'acc_full_003',
        userId: 'user_full',
        accountNumber: '****9876',
        accountType: 'credit',
        balance: -3420.75,
        currency: 'USD',
        status: 'active',
        createdAt: '2022-01-15T00:00:00Z',
        lastActivity: '2026-01-19T18:45:00Z',
    },
];
// Mock transactions
const MOCK_TRANSACTIONS = [
    // user_basic transactions (acc_basic_001)
    {
        transactionId: 'txn_basic_001',
        accountId: 'acc_basic_001',
        type: 'debit',
        amount: -45.99,
        currency: 'USD',
        description: 'Grocery Store Purchase',
        merchant: 'Whole Foods',
        category: 'groceries',
        timestamp: '2026-01-19T10:30:00Z',
        balance: 5420.50,
    },
    {
        transactionId: 'txn_basic_002',
        accountId: 'acc_basic_001',
        type: 'debit',
        amount: -12.50,
        currency: 'USD',
        description: 'Coffee Shop',
        merchant: 'Starbucks',
        category: 'dining',
        timestamp: '2026-01-19T08:15:00Z',
        balance: 5466.49,
    },
    {
        transactionId: 'txn_basic_003',
        accountId: 'acc_basic_001',
        type: 'credit',
        amount: 2500.00,
        currency: 'USD',
        description: 'Payroll Deposit',
        category: 'income',
        timestamp: '2026-01-18T00:00:00Z',
        balance: 5478.99,
    },
    {
        transactionId: 'txn_basic_004',
        accountId: 'acc_basic_001',
        type: 'debit',
        amount: -85.00,
        currency: 'USD',
        description: 'Electric Bill',
        merchant: 'City Electric',
        category: 'utilities',
        timestamp: '2026-01-17T12:00:00Z',
        balance: 2978.99,
    },
    {
        transactionId: 'txn_basic_005',
        accountId: 'acc_basic_001',
        type: 'debit',
        amount: -150.00,
        currency: 'USD',
        description: 'Internet Service',
        merchant: 'Comcast',
        category: 'utilities',
        timestamp: '2026-01-16T09:00:00Z',
        balance: 3063.99,
    },
    // user_transactions transactions (acc_trans_001)
    {
        transactionId: 'txn_trans_001',
        accountId: 'acc_trans_001',
        type: 'debit',
        amount: -125.00,
        currency: 'USD',
        description: 'Gas Station',
        merchant: 'Shell',
        category: 'transportation',
        timestamp: '2026-01-20T07:30:00Z',
        balance: 8234.25,
    },
    {
        transactionId: 'txn_trans_002',
        accountId: 'acc_trans_001',
        type: 'debit',
        amount: -89.99,
        currency: 'USD',
        description: 'Restaurant',
        merchant: 'Olive Garden',
        category: 'dining',
        timestamp: '2026-01-19T19:00:00Z',
        balance: 8359.25,
    },
    {
        transactionId: 'txn_trans_003',
        accountId: 'acc_trans_001',
        type: 'credit',
        amount: 3500.00,
        currency: 'USD',
        description: 'Payroll Deposit',
        category: 'income',
        timestamp: '2026-01-18T00:00:00Z',
        balance: 8449.24,
    },
    {
        transactionId: 'txn_trans_004',
        accountId: 'acc_trans_001',
        type: 'debit',
        amount: -1200.00,
        currency: 'USD',
        description: 'Rent Payment',
        category: 'housing',
        timestamp: '2026-01-15T10:00:00Z',
        balance: 4949.24,
    },
    {
        transactionId: 'txn_trans_005',
        accountId: 'acc_trans_001',
        type: 'debit',
        amount: -250.00,
        currency: 'USD',
        description: 'Online Shopping',
        merchant: 'Amazon',
        category: 'shopping',
        timestamp: '2026-01-14T15:30:00Z',
        balance: 6149.24,
    },
    // user_full transactions (acc_full_001)
    {
        transactionId: 'txn_full_001',
        accountId: 'acc_full_001',
        type: 'debit',
        amount: -500.00,
        currency: 'USD',
        description: 'Hotel Booking',
        merchant: 'Hilton',
        category: 'travel',
        timestamp: '2026-01-20T09:00:00Z',
        balance: 15750.80,
    },
    {
        transactionId: 'txn_full_002',
        accountId: 'acc_full_001',
        type: 'debit',
        amount: -175.50,
        currency: 'USD',
        description: 'Pharmacy',
        merchant: 'CVS',
        category: 'healthcare',
        timestamp: '2026-01-19T14:20:00Z',
        balance: 16250.80,
    },
    {
        transactionId: 'txn_full_003',
        accountId: 'acc_full_001',
        type: 'credit',
        amount: 5000.00,
        currency: 'USD',
        description: 'Payroll Deposit',
        category: 'income',
        timestamp: '2026-01-18T00:00:00Z',
        balance: 16426.30,
    },
    {
        transactionId: 'txn_full_004',
        accountId: 'acc_full_001',
        type: 'debit',
        amount: -2500.00,
        currency: 'USD',
        description: 'Mortgage Payment',
        category: 'housing',
        timestamp: '2026-01-15T10:00:00Z',
        balance: 11426.30,
    },
    {
        transactionId: 'txn_full_005',
        accountId: 'acc_full_001',
        type: 'debit',
        amount: -450.00,
        currency: 'USD',
        description: 'Car Insurance',
        category: 'insurance',
        timestamp: '2026-01-10T12:00:00Z',
        balance: 13926.30,
    },
];
// Mock customer profiles
const MOCK_PROFILES = new Map([
    [
        'user_basic',
        {
            userId: 'user_basic',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1-555-0101',
            address: {
                street: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip: '94102',
                country: 'USA',
            },
            dateOfBirth: '1990-05-15',
            accountsSince: '2023-01-15',
            preferredLanguage: 'en',
            notifications: {
                email: true,
                sms: false,
                push: true,
            },
        },
    ],
    [
        'user_transactions',
        {
            userId: 'user_transactions',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1-555-0102',
            address: {
                street: '456 Oak Ave',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'USA',
            },
            dateOfBirth: '1985-08-22',
            accountsSince: '2022-06-10',
            preferredLanguage: 'en',
            notifications: {
                email: true,
                sms: true,
                push: true,
            },
        },
    ],
    [
        'user_full',
        {
            userId: 'user_full',
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '+1-555-0103',
            address: {
                street: '789 Pine Rd',
                city: 'Seattle',
                state: 'WA',
                zip: '98101',
                country: 'USA',
            },
            dateOfBirth: '1980-12-10',
            accountsSince: '2021-09-01',
            preferredLanguage: 'en',
            notifications: {
                email: true,
                sms: true,
                push: true,
            },
        },
    ],
]);
// Mock payments
const MOCK_PAYMENTS = [];
// ===== Banking Data Functions =====
export function getAccountsByUserId(userId) {
    return MOCK_ACCOUNTS.filter((acc) => acc.userId === userId);
}
export function getAccountBalance(accountId, userId) {
    const account = MOCK_ACCOUNTS.find((acc) => acc.accountId === accountId && acc.userId === userId);
    if (!account) {
        throw new Error('Account not found or access denied');
    }
    return account;
}
export function getTransactions(accountId, userId, limit = 50) {
    // Verify account ownership
    const account = MOCK_ACCOUNTS.find((acc) => acc.accountId === accountId && acc.userId === userId);
    if (!account) {
        throw new Error('Account not found or access denied');
    }
    return MOCK_TRANSACTIONS.filter((txn) => txn.accountId === accountId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
}
export function getAllTransactionsForUser(userId, limit = 50) {
    // Get all account IDs for this user
    const userAccountIds = MOCK_ACCOUNTS.filter((acc) => acc.userId === userId).map((acc) => acc.accountId);
    return MOCK_TRANSACTIONS.filter((txn) => userAccountIds.includes(txn.accountId))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
}
export function getCustomerProfile(userId) {
    const profile = MOCK_PROFILES.get(userId);
    if (!profile) {
        throw new Error('Customer profile not found');
    }
    return profile;
}
export function updateCustomerProfile(userId, updates) {
    const profile = MOCK_PROFILES.get(userId);
    if (!profile) {
        throw new Error('Customer profile not found');
    }
    // Deep merge updates
    const updatedProfile = {
        ...profile,
        ...updates,
        address: {
            ...profile.address,
            ...(updates.address || {}),
        },
        notifications: {
            ...profile.notifications,
            ...(updates.notifications || {}),
        },
    };
    MOCK_PROFILES.set(userId, updatedProfile);
    return updatedProfile;
}
export function initiatePayment(userId, fromAccountId, toAccountNumber, amount, description) {
    // Verify account ownership
    const account = MOCK_ACCOUNTS.find((acc) => acc.accountId === fromAccountId && acc.userId === userId);
    if (!account) {
        throw new Error('Account not found or access denied');
    }
    // Check sufficient balance (for non-credit accounts)
    if (account.accountType !== 'credit' && account.balance < amount) {
        throw new Error('Insufficient funds');
    }
    // Create payment
    const payment = {
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromAccountId,
        toAccountNumber,
        amount,
        currency: account.currency,
        description,
        status: 'pending',
        initiatedAt: new Date().toISOString(),
    };
    MOCK_PAYMENTS.push(payment);
    // Simulate payment completion (in real system, this would be async)
    setTimeout(() => {
        payment.status = 'completed';
        payment.completedAt = new Date().toISOString();
        // Update account balance
        account.balance -= amount;
        account.lastActivity = new Date().toISOString();
    }, 100);
    return payment;
}
export function getPaymentHistory(userId, limit = 50) {
    // Get all account IDs for this user
    const userAccountIds = MOCK_ACCOUNTS.filter((acc) => acc.userId === userId).map((acc) => acc.accountId);
    return MOCK_PAYMENTS.filter((payment) => userAccountIds.includes(payment.fromAccountId))
        .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime())
        .slice(0, limit);
}
//# sourceMappingURL=banking-data.js.map