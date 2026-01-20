import { BankAccount, Transaction, CustomerProfile, Payment } from './types.js';
export declare function getAccountsByUserId(userId: string): BankAccount[];
export declare function getAccountBalance(accountId: string, userId: string): BankAccount;
export declare function getTransactions(accountId: string, userId: string, limit?: number): Transaction[];
export declare function getAllTransactionsForUser(userId: string, limit?: number): Transaction[];
export declare function getCustomerProfile(userId: string): CustomerProfile;
export declare function updateCustomerProfile(userId: string, updates: Partial<CustomerProfile>): CustomerProfile;
export declare function initiatePayment(userId: string, fromAccountId: string, toAccountNumber: string, amount: number, description: string): Payment;
export declare function getPaymentHistory(userId: string, limit?: number): Payment[];
//# sourceMappingURL=banking-data.d.ts.map