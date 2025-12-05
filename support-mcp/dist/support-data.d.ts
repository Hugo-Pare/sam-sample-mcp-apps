import { Ticket, Customer, KnowledgeBase, SupportStats, TicketStatus, TicketPriority, TicketCategory } from './types.js';
export declare function listTickets(status?: TicketStatus, assignedTo?: string): Ticket[];
export declare function getTicket(ticketId: string): Ticket | null;
export declare function createTicket(subject: string, description: string, customerId: string, customerEmail: string, priority: TicketPriority, category: TicketCategory): Ticket;
export declare function updateTicket(ticketId: string, updates: Partial<Ticket>): Ticket;
export declare function assignTicket(ticketId: string, assignedTo: string): Ticket;
export declare function closeTicket(ticketId: string, resolution?: string): Ticket;
export declare function searchKnowledgeBase(query: string): KnowledgeBase[];
export declare function getCustomerInfo(customerId: string): Customer | null;
export declare function getAllCustomers(): Customer[];
export declare function getSupportStats(period: string): SupportStats;
export declare function listAgents(): any[];
export declare function getOpenTickets(): Ticket[];
export declare function getMyAssignedTickets(username: string): Ticket[];
export declare function getAllKnowledgeBase(): KnowledgeBase[];
//# sourceMappingURL=support-data.d.ts.map