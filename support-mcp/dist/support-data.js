import { getAllUsers } from './auth.js';
const MOCK_TICKETS = [
    {
        id: 'TKT-001',
        subject: 'Cannot login to account',
        description: 'I am unable to login to my account. Password reset is not working.',
        status: 'open',
        priority: 'high',
        category: 'technical',
        customerId: 'cust_001',
        customerEmail: 'john@example.com',
        assignedTo: undefined,
        createdAt: '2025-12-03T10:00:00Z',
        updatedAt: '2025-12-03T10:00:00Z',
        tags: ['login', 'password'],
    },
    {
        id: 'TKT-002',
        subject: 'Billing question about invoice',
        description: 'I have a question about the charges on my latest invoice.',
        status: 'in_progress',
        priority: 'medium',
        category: 'billing',
        customerId: 'cust_002',
        customerEmail: 'sarah@company.com',
        assignedTo: 'agent1',
        createdAt: '2025-12-02T14:30:00Z',
        updatedAt: '2025-12-03T09:15:00Z',
        tags: ['billing', 'invoice'],
    },
    {
        id: 'TKT-003',
        subject: 'Feature request: Dark mode',
        description: 'Would love to see a dark mode option in the application.',
        status: 'waiting',
        priority: 'low',
        category: 'feature_request',
        customerId: 'cust_003',
        customerEmail: 'mike@startup.io',
        assignedTo: 'agent1',
        createdAt: '2025-12-01T08:00:00Z',
        updatedAt: '2025-12-02T16:00:00Z',
        tags: ['feature', 'ui'],
    },
    {
        id: 'TKT-004',
        subject: 'App crashes on iOS',
        description: 'The mobile app crashes when I try to upload photos on iOS 17.',
        status: 'resolved',
        priority: 'urgent',
        category: 'bug',
        customerId: 'cust_004',
        customerEmail: 'lisa@email.com',
        assignedTo: 'supervisor1',
        createdAt: '2025-11-30T11:00:00Z',
        updatedAt: '2025-12-01T15:30:00Z',
        resolvedAt: '2025-12-01T15:30:00Z',
        tags: ['bug', 'mobile', 'ios'],
    },
];
const MOCK_CUSTOMERS = [
    {
        id: 'cust_001',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Example Corp',
        plan: 'pro',
        ticketCount: 3,
        createdAt: '2025-01-15T00:00:00Z',
        lastContact: '2025-12-03T10:00:00Z',
    },
    {
        id: 'cust_002',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        company: 'Johnson LLC',
        plan: 'enterprise',
        ticketCount: 5,
        createdAt: '2025-02-20T00:00:00Z',
        lastContact: '2025-12-02T14:30:00Z',
    },
    {
        id: 'cust_003',
        name: 'Mike Chen',
        email: 'mike@startup.io',
        company: 'StartupIO',
        plan: 'basic',
        ticketCount: 2,
        createdAt: '2025-03-10T00:00:00Z',
        lastContact: '2025-12-01T08:00:00Z',
    },
    {
        id: 'cust_004',
        name: 'Lisa Anderson',
        email: 'lisa@email.com',
        plan: 'free',
        ticketCount: 1,
        createdAt: '2025-11-25T00:00:00Z',
        lastContact: '2025-11-30T11:00:00Z',
    },
];
const KNOWLEDGE_BASE = [
    {
        id: 'kb_001',
        title: 'How to reset your password',
        content: 'Step-by-step guide for resetting your account password...',
        category: 'account',
        tags: ['password', 'login', 'security'],
        views: 1523,
        helpful: 1401,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-06-15T00:00:00Z',
    },
    {
        id: 'kb_002',
        title: 'Understanding your invoice',
        content: 'Guide to reading and understanding your monthly invoice...',
        category: 'billing',
        tags: ['billing', 'invoice', 'payment'],
        views: 892,
        helpful: 805,
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-07-20T00:00:00Z',
    },
    {
        id: 'kb_003',
        title: 'Troubleshooting mobile app crashes',
        content: 'Common solutions for mobile app stability issues...',
        category: 'technical',
        tags: ['mobile', 'troubleshooting', 'crash'],
        views: 2156,
        helpful: 1890,
        createdAt: '2025-02-10T00:00:00Z',
        updatedAt: '2025-11-01T00:00:00Z',
    },
];
export function listTickets(status, assignedTo) {
    let tickets = [...MOCK_TICKETS];
    if (status) {
        tickets = tickets.filter((t) => t.status === status);
    }
    if (assignedTo) {
        tickets = tickets.filter((t) => t.assignedTo === assignedTo);
    }
    return tickets;
}
export function getTicket(ticketId) {
    return MOCK_TICKETS.find((t) => t.id === ticketId) || null;
}
export function createTicket(subject, description, customerId, customerEmail, priority, category) {
    const newTicket = {
        id: `TKT-${String(MOCK_TICKETS.length + 1).padStart(3, '0')}`,
        subject,
        description,
        status: 'open',
        priority,
        category,
        customerId,
        customerEmail,
        assignedTo: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
    };
    MOCK_TICKETS.push(newTicket);
    return newTicket;
}
export function updateTicket(ticketId, updates) {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
    if (!ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
    }
    Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });
    return ticket;
}
export function assignTicket(ticketId, assignedTo) {
    return updateTicket(ticketId, {
        assignedTo,
        status: 'in_progress',
    });
}
export function closeTicket(ticketId, resolution) {
    return updateTicket(ticketId, {
        status: 'closed',
        resolvedAt: new Date().toISOString(),
    });
}
export function searchKnowledgeBase(query) {
    const lowerQuery = query.toLowerCase();
    return KNOWLEDGE_BASE.filter((article) => article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)));
}
export function getCustomerInfo(customerId) {
    return MOCK_CUSTOMERS.find((c) => c.id === customerId) || null;
}
export function getAllCustomers() {
    return MOCK_CUSTOMERS;
}
export function getSupportStats(period) {
    const openTickets = MOCK_TICKETS.filter((t) => t.status === 'open').length;
    const resolvedTickets = MOCK_TICKETS.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    const categoryCount = {};
    MOCK_TICKETS.forEach((t) => {
        categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    return {
        period,
        totalTickets: MOCK_TICKETS.length,
        openTickets,
        resolvedTickets,
        averageResponseTime: Math.round(Math.random() * 120) + 30, // minutes
        averageResolutionTime: Math.round(Math.random() * 24) + 4, // hours
        customerSatisfaction: Math.round((4 + Math.random()) * 10) / 10, // 4.0-5.0
        topCategories,
    };
}
export function listAgents() {
    const users = getAllUsers();
    return users
        .filter((u) => u.role === 'agent' || u.role === 'supervisor')
        .map((u) => ({
        userId: u.userId,
        username: u.username,
        name: u.name,
        role: u.role,
        email: u.email,
        assignedTickets: MOCK_TICKETS.filter((t) => t.assignedTo === u.username).length,
    }));
}
export function getOpenTickets() {
    return MOCK_TICKETS.filter((t) => t.status === 'open');
}
export function getMyAssignedTickets(username) {
    return MOCK_TICKETS.filter((t) => t.assignedTo === username);
}
export function getAllKnowledgeBase() {
    return KNOWLEDGE_BASE;
}
//# sourceMappingURL=support-data.js.map