import { supabase, isSupabaseConfigured } from "./supabase";
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

// Unified Error Logger
function logDbError(err: any, op: string, table: string) {
    if (!isSupabaseConfigured()) return;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Supabase Error [${op}] on table [${table}]:`, errMsg);
}

// 1. Users List Operations
export async function loadUsers(): Promise<User[]> {
    if (!isSupabaseConfigured()) return accounts;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            // Seed (Note: insert many)
            await supabase.from('users').insert(accounts);
            return accounts;
        }

        // Check for specific manager users as per original logic
        const list = data as User[];
        const managers = ['laithhazza1@gmail.com', 'laithhazza09@gmail.com'];
        for (const m of managers) {
            if (!list.some(u => u.username === m)) {
                const managerUser = accounts.find(u => u.username === m);
                if (managerUser) {
                    await supabase.from('users').insert(managerUser);
                    list.push(managerUser);
                }
            }
        }
        return list;
    } catch (e) {
        logDbError(e, "select", "users");
        return accounts;
    }
}

export async function saveUserToDb(user: User): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const { error } = await supabase
            .from('users')
            .upsert(user, { onConflict: 'username' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "users");
    }
}

export async function deleteUserFromDb(username: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('username', username);
        if (error) throw error;
    } catch (e) {
        logDbError(e, "delete", "users");
    }
}

// 2. Customers Operations
export async function loadCustomers(): Promise<Customer[]> {
    if (!isSupabaseConfigured()) return initialCustomers;
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            await supabase.from('customers').insert(initialCustomers);
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
        const { error } = await supabase
            .from('customers')
            .upsert(cust, { onConflict: 'code' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "customers");
    }
}

// 3. Visa App Operations
export async function loadVisaApps(): Promise<VisaApp[]> {
    if (!isSupabaseConfigured()) return initialVisaApps;
    try {
        const { data, error } = await supabase
            .from('visa_apps')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            await supabase.from('visa_apps').insert(initialVisaApps);
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
        const { error } = await supabase
            .from('visa_apps')
            .upsert(visa, { onConflict: 'id' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "visa_apps");
    }
}

// 4. Invoices Operations
export async function loadInvoices(): Promise<Invoice[]> {
    if (!isSupabaseConfigured()) return initialInvoices;
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            await supabase.from('invoices').insert(initialInvoices);
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
        const { error } = await supabase
            .from('invoices')
            .upsert(inv, { onConflict: 'no' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "invoices");
    }
}

// 5. Expenses Operations
export async function loadExpenses(): Promise<Expense[]> {
    if (!isSupabaseConfigured()) return initialExpenses;
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            await supabase.from('expenses').insert(initialExpenses);
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
        const { error } = await supabase
            .from('expenses')
            .upsert({ ...exp, id }, { onConflict: 'id' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "expenses");
    }
}

// 6. Service Requests Operations
export async function loadServiceRequests(fallbackRequests: ServiceRequest[]): Promise<ServiceRequest[]> {
    if (!isSupabaseConfigured()) return fallbackRequests;
    try {
        const { data, error } = await supabase
            .from('service_requests')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            await supabase.from('service_requests').insert(fallbackRequests);
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
        const { error } = await supabase
            .from('service_requests')
            .upsert(req, { onConflict: 'id' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "service_requests");
    }
}

// 7. Tasks Operations
export async function loadTasks(fallbackTasks: Task[]): Promise<Task[]> {
    if (!isSupabaseConfigured()) return fallbackTasks;
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            await supabase.from('tasks').insert(fallbackTasks);
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
        const { error } = await supabase
            .from('tasks')
            .upsert(task, { onConflict: 'id' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "tasks");
    }
}

export async function deleteTaskFromDb(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (e) {
        logDbError(e, "delete", "tasks");
    }
}

// 8. Service Types config
export async function loadServiceTypes(): Promise<string[]> {
    if (!isSupabaseConfigured()) return initialServiceTypes;
    try {
        const { data, error } = await supabase
            .from('config')
            .select('data')
            .eq('id', 'services')
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                await supabase.from('config').insert({ id: 'services', data: { types: initialServiceTypes } });
                return initialServiceTypes;
            }
            throw error;
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
        const { error } = await supabase
            .from('config')
            .upsert({ id: 'services', data: { types } }, { onConflict: 'id' });
        if (error) throw error;
    } catch (e) {
        logDbError(e, "upsert", "config");
    }
}

// 9. Custom Tags config
export async function loadCustomTags(fallbackTags: Tag[]): Promise<Tag[]> {
    if (!isSupabaseConfigured()) return fallbackTags;
    try {
        const { data, error } = await supabase
            .from('config')
            .select('data')
            .eq('id', 'tags')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                await supabase.from('config').insert({ id: 'tags', data: { tags: fallbackTags } });
                return fallbackTags;
            }
            throw error;
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
        const { error } = await supabase
            .from('config')
            .upsert({ id: 'tags', data: { tags } }, { onConflict: 'id' });
        if (error) throw error;
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
