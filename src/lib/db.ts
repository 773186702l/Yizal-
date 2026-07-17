import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "./firebase";
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

// Sign in anonymously on load to ensure auth is active for rules
export async function initFirebaseAuth() {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log("Firebase Auth signed in anonymously.");
        }
    } catch (e) {
        console.log("Firebase Auth is not enabled in this environment. Continuing with public Firestore access.");
    }
}

// Unified Error Logger
function logDbError(err: any, op: string, path: string) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errInfo = {
        error: errMsg,
        operationType: op,
        path,
        authInfo: {
            userId: auth.currentUser?.uid || null,
            isAnonymous: auth.currentUser?.isAnonymous || null
        }
    };
    if (errMsg.toLowerCase().includes("offline") || errMsg.toLowerCase().includes("network")) {
        console.warn("Firestore offline/network warning: ", JSON.stringify(errInfo));
    } else {
        console.error("Firestore Error Detailed: ", JSON.stringify(errInfo));
    }
}

// 1. Users List Operations
export async function loadUsers(): Promise<User[]> {
    const colRef = collection(db, "users");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            // Seed
            for (const u of accounts) {
                await setDoc(doc(db, "users", u.username), u);
            }
            return accounts;
        }
        const list = snap.docs.map(d => d.data() as User);
        const hasManager1 = list.some(u => u.username === 'laithhazza1@gmail.com');
        if (!hasManager1) {
            const managerUser = accounts.find(u => u.username === 'laithhazza1@gmail.com');
            if (managerUser) {
                await setDoc(doc(db, "users", managerUser.username), managerUser);
                list.push(managerUser);
            }
        }
        const hasManager09 = list.some(u => u.username === 'laithhazza09@gmail.com');
        if (!hasManager09) {
            const managerUser = accounts.find(u => u.username === 'laithhazza09@gmail.com');
            if (managerUser) {
                await setDoc(doc(db, "users", managerUser.username), managerUser);
                list.push(managerUser);
            }
        }
        return list;
    } catch (e) {
        logDbError(e, "get", "users");
        return accounts;
    }
}

export async function saveUserToDb(user: User): Promise<void> {
    try {
        await setDoc(doc(db, "users", user.username), user);
    } catch (e) {
        logDbError(e, "write", `users/${user.username}`);
    }
}

export async function deleteUserFromDb(username: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "users", username));
    } catch (e) {
        logDbError(e, "delete", `users/${username}`);
    }
}

// 2. Customers Operations
export async function loadCustomers(): Promise<Customer[]> {
    const colRef = collection(db, "customers");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            for (const c of initialCustomers) {
                await setDoc(doc(db, "customers", c.code), c);
            }
            return initialCustomers;
        }
        return snap.docs.map(d => d.data() as Customer);
    } catch (e) {
        logDbError(e, "get", "customers");
        return initialCustomers;
    }
}

export async function saveCustomerToDb(cust: Customer): Promise<void> {
    try {
        await setDoc(doc(db, "customers", cust.code), cust);
    } catch (e) {
        logDbError(e, "write", `customers/${cust.code}`);
    }
}

// 3. Visa App Operations
export async function loadVisaApps(): Promise<VisaApp[]> {
    const colRef = collection(db, "visaApps");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            for (const v of initialVisaApps) {
                await setDoc(doc(db, "visaApps", v.id), v);
            }
            return initialVisaApps;
        }
        return snap.docs.map(d => d.data() as VisaApp);
    } catch (e) {
        logDbError(e, "get", "visaApps");
        return initialVisaApps;
    }
}

export async function saveVisaAppToDb(visa: VisaApp): Promise<void> {
    try {
        await setDoc(doc(db, "visaApps", visa.id), visa);
    } catch (e) {
        logDbError(e, "write", `visaApps/${visa.id}`);
    }
}

// 4. Invoices Operations
export async function loadInvoices(): Promise<Invoice[]> {
    const colRef = collection(db, "invoices");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            for (const inv of initialInvoices) {
                await setDoc(doc(db, "invoices", inv.no), inv);
            }
            return initialInvoices;
        }
        return snap.docs.map(d => d.data() as Invoice);
    } catch (e) {
        logDbError(e, "get", "invoices");
        return initialInvoices;
    }
}

export async function saveInvoiceToDb(inv: Invoice): Promise<void> {
    try {
        await setDoc(doc(db, "invoices", inv.no), inv);
    } catch (e) {
        logDbError(e, "write", `invoices/${inv.no}`);
    }
}

// 5. Expenses Operations
export async function loadExpenses(): Promise<Expense[]> {
    const colRef = collection(db, "expenses");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            for (let i = 0; i < initialExpenses.length; i++) {
                await setDoc(doc(db, "expenses", `EXP-${i}`), initialExpenses[i]);
            }
            return initialExpenses;
        }
        return snap.docs.map(d => d.data() as Expense);
    } catch (e) {
        logDbError(e, "get", "expenses");
        return initialExpenses;
    }
}

export async function saveExpenseToDb(exp: Expense, id: string): Promise<void> {
    try {
        await setDoc(doc(db, "expenses", id), exp);
    } catch (e) {
        logDbError(e, "write", `expenses/${id}`);
    }
}

// 6. Service Requests Operations
export async function loadServiceRequests(fallbackRequests: ServiceRequest[]): Promise<ServiceRequest[]> {
    const colRef = collection(db, "serviceRequests");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            for (const r of fallbackRequests) {
                await setDoc(doc(db, "serviceRequests", r.id), r);
            }
            return fallbackRequests;
        }
        return snap.docs.map(d => d.data() as ServiceRequest);
    } catch (e) {
        logDbError(e, "get", "serviceRequests");
        return fallbackRequests;
    }
}

export async function saveServiceRequestToDb(req: ServiceRequest): Promise<void> {
    try {
        await setDoc(doc(db, "serviceRequests", req.id), req);
    } catch (e) {
        logDbError(e, "write", `serviceRequests/${req.id}`);
    }
}

// 7. Tasks Operations
export async function loadTasks(fallbackTasks: Task[]): Promise<Task[]> {
    const colRef = collection(db, "tasks");
    try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
            for (const t of fallbackTasks) {
                await setDoc(doc(db, "tasks", t.id), t);
            }
            return fallbackTasks;
        }
        return snap.docs.map(d => d.data() as Task);
    } catch (e) {
        logDbError(e, "get", "tasks");
        return fallbackTasks;
    }
}

export async function saveTaskToDb(task: Task): Promise<void> {
    try {
        await setDoc(doc(db, "tasks", task.id), task);
    } catch (e) {
        logDbError(e, "write", `tasks/${task.id}`);
    }
}

export async function deleteTaskFromDb(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "tasks", id));
    } catch (e) {
        logDbError(e, "delete", `tasks/${id}`);
    }
}

// 8. Service Types config document
export async function loadServiceTypes(): Promise<string[]> {
    try {
        const docRef = doc(db, "config", "services");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().types as string[];
        } else {
            await setDoc(docRef, { types: initialServiceTypes });
            return initialServiceTypes;
        }
    } catch (e) {
        logDbError(e, "get", "config/services");
        return initialServiceTypes;
    }
}

export async function saveServiceTypesToDb(types: string[]): Promise<void> {
    try {
        await setDoc(doc(db, "config", "services"), { types });
    } catch (e) {
        logDbError(e, "write", "config/services");
    }
}

// 9. Custom Tags config document
export async function loadCustomTags(fallbackTags: Tag[]): Promise<Tag[]> {
    try {
        const docRef = doc(db, "config", "tags");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().tags as Tag[];
        } else {
            await setDoc(docRef, { tags: fallbackTags });
            return fallbackTags;
        }
    } catch (e) {
        logDbError(e, "get", "config/tags");
        return fallbackTags;
    }
}

export async function saveCustomTagsToDb(tags: Tag[]): Promise<void> {
    try {
        await setDoc(doc(db, "config", "tags"), { tags });
    } catch (e) {
        logDbError(e, "write", "config/tags");
    }
}
