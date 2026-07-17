export type Role = 'admin' | 'accountant' | 'sales' | 'executor';

export interface User {
  uid?: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  email?: string;
}

export interface TimelineItem {
  text: string;
  time: string;
}

export interface Customer {
  code: string;
  name: string;
  phone: string;
  nat: string;
  status: 'active' | 'inactive' | 'pending';
  assigned: string;
  timeline: TimelineItem[];
}

export interface VisaApp {
  id: string;
  customer: string;
  dest: string;
  stage: 'draft' | 'submitted' | 'review' | 'approved' | 'rejected';
  docs: number;
  received: number;
}

export interface Invoice {
  no: string;
  customer: string;
  amount: string;
  currency: string;
  status: 'paid' | 'unpaid' | 'partial';
  date: string;
  method: string;
}

export interface Expense {
    desc: string;
    amount: string;
    currency: string;
    by: string;
    date: string;
    type: 'income' | 'expense';
}

export interface ServiceRequest {
    id: string;
    customerCode: string;
    customerName: string;
    service: string;
    docs: string[];
    amount: string;
    currency: string;
    payType: string;
    receipt: string;
    expiry: string;
    employee: string;
    status: 'pending_accountant' | 'executor_pending' | 'completed' | 'rejected';
    history: TimelineItem[];
}

export interface Tag {
    name: string;
    color: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    status: 'todo' | 'in-progress' | 'completed';
    tags?: string[]; // list of tag names assigned
}

export interface AppState {
    lang: 'ar' | 'en';
    theme: 'light' | 'dark';
    view: string;
    user: User | null;
    tasks: Task[];
    customTags?: Tag[];
    customers: Customer[];
    serviceRequests: ServiceRequest[];
    visaApps: VisaApp[];
    invoices: Invoice[];
    expenses: Expense[];
    serviceTypes: string[];
    usersList: User[];
    searchTerm?: string;
}
