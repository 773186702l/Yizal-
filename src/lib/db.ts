import { isSupabaseConfigured } from "./supabase";
import { 
    User, 
    Customer, 
    VisaApp, 
    Invoice, 
    ServiceRequest, 
    Expense, 
    Task, 
    Tag 
} from "../types";
import { 
    accounts, 
    initialCustomers, 
    initialVisaApps, 
    initialInvoices, 
    initialExpenses, 
    initialServiceTypes 
} from "../data";

// Helper for API proxy calls
async function fetchFromApi(table: string): Promise<any[]> {
    try {
        const response = await fetch(`/api/db/${table}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error(`API Fetch Error [${table}]:`, e);
        throw e;
    }
}

async function saveToApi(table: string, data: any, onConflict: string = 'id'): Promise<void> {
    try {
        const response = await fetch(`/api/db/${table}?onConflict=${onConflict}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }
    } catch (e) {
        console.error(`API Save Error [${table}]:`, e);
        throw e;
    }
}

async function deleteFromApi(table: string, column: string, value: string): Promise<void> {
    try {
        const response = await fetch(`/api/db/${table}?column=${column}&value=${value}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }
    } catch (e) {
        console.error(`API Delete Error [${table}]:`, e);
        throw e;
    }
}

// Unified Error Logger
function logDbError(err: any, op: string, table: string) {
    if (!isSupabaseConfigured()) return;
    
    let errorDetail = '';
    if (err && typeof err === 'object') {
        errorDetail = err.message || err.details || JSON.stringify(err);
        if (err.code) errorDetail += ` (Code: ${err.code})`;
    } else {
        errorDetail = String(err);
    }
    
    console.error(`Supabase Error [${op}] on table [${table}]: ${errorDetail}`);
}

// 1. Users List Operations
export async function loadUsers(): Promise<User[]> {
    if (!isSupabaseConfigured()) return accounts;
    try {
        // Use API proxy
        const data = await fetchFromApi('users');

        if (!data || data.length === 0) {
            return accounts;
        }

        // Map and ensure defaults
        const list = (data as any[]).map(u => ({
            ...u,
            status: u.status || 'active',
            role: u.role || 'employee'
        })) as User[];
        
        const managers = ['laithhazza1@gmail.com', 'laithhazza09@gmail.com'];
        for (const m of managers) {
            if (!list.some(u => u.username === m)) {
                const managerUser = accounts.find(u => u.username === m);
                if (managerUser) {
                    try {
                        await saveToApi('users', managerUser, 'username');
                        list.push(managerUser);
                    } catch (e) {
                         // Ignore insert errors during auto-sync
                    }
                }
            }
        }
        return list;
    } catch (e) {
        logDbError(e, "loadUsers_catch", "users");
        return accounts;
    }
}

export async function saveUserToDb(user: User): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('users', user, 'username');
    } catch (e) {
        logDbError(e, "upsert", "users");
    }
}

export async function deleteUserFromDb(username: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await deleteFromApi('users', 'username', username);
    } catch (e) {
        logDbError(e, "delete", "users");
    }
}

// 2. Customers Operations
export async function loadCustomers(): Promise<Customer[]> {
    if (!isSupabaseConfigured()) return initialCustomers;
    try {
        const data = await fetchFromApi('customers');

        if (!data || data.length === 0) {
            return initialCustomers;
        }
        return data as Customer[];
    } catch (e) {
        logDbError(e, "select", "customers");
        return initialCustomers;
    }
}

export async function saveCustomerToDb(cust: Customer): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('customers', cust, 'code');
    } catch (e) {
        logDbError(e, "upsert", "customers");
    }
}

// 3. Visa App Operations
export async function loadVisaApps(): Promise<VisaApp[]> {
    if (!isSupabaseConfigured()) return initialVisaApps;
    try {
        const data = await fetchFromApi('visa_apps');

        if (!data || data.length === 0) {
            return initialVisaApps;
        }
        return data as VisaApp[];
    } catch (e) {
        logDbError(e, "select", "visa_apps");
        return initialVisaApps;
    }
}

export async function saveVisaAppToDb(visa: VisaApp): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('visa_apps', visa, 'id');
    } catch (e) {
        logDbError(e, "upsert", "visa_apps");
    }
}

// 4. Invoices Operations
export async function loadInvoices(): Promise<Invoice[]> {
    if (!isSupabaseConfigured()) return initialInvoices;
    try {
        const data = await fetchFromApi('invoices');

        if (!data || data.length === 0) {
            return initialInvoices;
        }
        return data as Invoice[];
    } catch (e) {
        logDbError(e, "select", "invoices");
        return initialInvoices;
    }
}

export async function saveInvoiceToDb(inv: Invoice): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('invoices', inv, 'no');
    } catch (e) {
        logDbError(e, "upsert", "invoices");
    }
}

// 5. Expenses Operations
export async function loadExpenses(): Promise<Expense[]> {
    if (!isSupabaseConfigured()) return initialExpenses;
    try {
        const data = await fetchFromApi('expenses');

        if (!data || data.length === 0) {
            return initialExpenses;
        }
        return data as Expense[];
    } catch (e) {
        logDbError(e, "select", "expenses");
        return initialExpenses;
    }
}

export async function saveExpenseToDb(exp: Expense, id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('expenses', { ...exp, id }, 'id');
    } catch (e) {
        logDbError(e, "upsert", "expenses");
    }
}

// 6. Service Requests Operations
export async function loadServiceRequests(fallbackRequests: ServiceRequest[]): Promise<ServiceRequest[]> {
    if (!isSupabaseConfigured()) return fallbackRequests;
    try {
        const data = await fetchFromApi('service_requests');

        if (!data || data.length === 0) {
            return fallbackRequests;
        }
        return data as ServiceRequest[];
    } catch (e) {
        logDbError(e, "select", "service_requests");
        return fallbackRequests;
    }
}

export async function saveServiceRequestToDb(req: ServiceRequest): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('service_requests', req, 'id');
    } catch (e) {
        logDbError(e, "upsert", "service_requests");
    }
}

// 7. Tasks Operations
export async function loadTasks(fallbackTasks: Task[]): Promise<Task[]> {
    if (!isSupabaseConfigured()) return fallbackTasks;
    try {
        const data = await fetchFromApi('tasks');

        if (!data || data.length === 0) {
            return fallbackTasks;
        }
        return data as Task[];
    } catch (e) {
        logDbError(e, "select", "tasks");
        return fallbackTasks;
    }
}

export async function saveTaskToDb(task: Task): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('tasks', task, 'id');
    } catch (e) {
        logDbError(e, "upsert", "tasks");
    }
}

export async function deleteTaskFromDb(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await deleteFromApi('tasks', 'id', id);
    } catch (e) {
        logDbError(e, "delete", "tasks");
    }
}

// 8. Service Types config
export async function loadServiceTypes(): Promise<string[]> {
    if (!isSupabaseConfigured()) return initialServiceTypes;
    try {
        const response = await fetch('/api/db/config');
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }
        const configs = await response.json();
        const data = configs.find((c: any) => c.id === 'services');

        if (!data) {
            return initialServiceTypes;
        }
        return data.data.types as string[];
    } catch (e) {
        logDbError(e, "select", "config");
        return initialServiceTypes;
    }
}

export async function saveServiceTypesToDb(types: string[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('config', { id: 'services', data: { types } }, 'id');
    } catch (e) {
        logDbError(e, "upsert", "config");
    }
}

// 9. Custom Tags config
export async function loadCustomTags(fallbackTags: Tag[]): Promise<Tag[]> {
    if (!isSupabaseConfigured()) return fallbackTags;
    try {
        const response = await fetch('/api/db/config');
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }
        const configs = await response.json();
        const data = configs.find((c: any) => c.id === 'tags');

        if (!data) {
            return fallbackTags;
        }
        return data.data.tags as Tag[];
    } catch (e) {
        logDbError(e, "select", "config");
        return fallbackTags;
    }
}

export async function saveCustomTagsToDb(tags: Tag[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        await saveToApi('config', { id: 'tags', data: { tags } }, 'id');
    } catch (e) {
        logDbError(e, "upsert", "config");
    }
}

// Supabase Init Auth (not strictly needed for rules like PostgreSQL, but good for session)
export async function initSupabaseAuth() {
    if (!isSupabaseConfigured()) return;
    // Supabase client handles persistent session automatically in browser
    console.log("Supabase Auth initialized.");
}
