export type UserRole = 'agent' | 'supervisor' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'general' | 'feature_request' | 'bug';

export interface AuthContext {
  username: string;
  role: UserRole;
  userId: string;
  email: string;
}

export interface UserCredentials {
  username: string;
  password: string;
  role: UserRole;
  userId: string;
  email: string;
  name: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerId: string;
  customerEmail: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  tags: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  ticketCount: number;
  createdAt: string;
  lastContact?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  author: string;
  authorRole: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: string;
  isInternal: boolean;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportStats {
  period: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  topCategories: { category: string; count: number }[];
}
