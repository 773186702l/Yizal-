/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Core interactive modules
import DashboardView from './components/DashboardView';
import CustomersView from './components/CustomersView';
import NewRequestView from './components/NewRequestView';
import ApprovalsView from './components/ApprovalsView';
import TasksView from './components/TasksView';
import VisaView from './components/VisaView';
import InvoicesView from './components/InvoicesView';
import AccountingView from './components/AccountingView';
import SettingsView from './components/SettingsView';
import ReportsView from './components/ReportsView';
import DocsView from './components/DocsView';
import WorkflowView from './components/WorkflowView';
import UsersView from './components/UsersView';
import ServicesView from './components/ServicesView';

import { AppState, User, Task, ServiceRequest, Customer, VisaApp, Invoice, Expense, Tag } from './types';
import { 
    accounts, 
    PERMS, 
    initialCustomers, 
    initialVisaApps, 
    initialInvoices, 
    initialExpenses, 
    initialServiceTypes 
} from './data';

// Persistent Cloud Layer imports
import { 
    initSupabaseAuth,
    loadUsers,
    saveUserToDb,
    loadCustomers,
    saveCustomerToDb,
    loadVisaApps,
    saveVisaAppToDb,
    loadInvoices,
    saveInvoiceToDb,
    loadExpenses,
    saveExpenseToDb,
    loadServiceRequests,
    saveServiceRequestToDb,
    loadTasks,
    saveTaskToDb,
    loadCustomTags,
    saveCustomTagsToDb,
    loadServiceTypes,
    saveServiceTypesToDb
} from './lib/db';

// Seed initial task list for executors (fallback when DB empty)
const initialTasks: Task[] = [
    {
        id: 'TSK-A2B3',
        title: 'تعبئة نموذج DS-160 وتحديد موعد المقابلة سفارة الرياض',
        description: 'طلب تأشيرة أمريكا للعميل ليلى حسن. المستندات المرفقة جاهزة ومترجمة بالكامل.',
        priority: 'high',
        dueDate: '2026-07-25',
        status: 'todo',
        tags: ['أمريكا', 'مستعجل']
    },
    {
        id: 'TSK-X7Y8',
        title: 'تقديم جواز السفر والمستندات للمركز الموحد VFS Global',
        description: 'فيزا شنغن فرنسا للعميل أحمد المصري. سداد الرسوم القنصلية تم بالكامل وبانتظار البصمة.',
        priority: 'medium',
        dueDate: '2026-07-20',
        status: 'in-progress',
        tags: ['شنغن', 'عمل']
    }
];

// Seed initial service requests for approvals queue (fallback when DB empty)
const initialRequests: ServiceRequest[] = [
    {
        id: 'REQ-5001',
        customerCode: 'CUS-1040',
        customerName: 'Michael Chen',
        service: 'فيزا أمريكا',
        docs: ['Passport Copy', 'Bank Statement', 'Employment Letter'],
        amount: '850',
        currency: 'USD',
        payType: 'pay_bank',
        receipt: '2026-07-16',
        expiry: '2026-07-31',
        employee: 'خالد عمر',
        status: 'pending_accountant',
        history: [{ text: 'تم إنشاء معاملة مبيعات جديدة وبانتظار اعتماد السداد', time: '2026-07-16' }]
    },
    {
        id: 'REQ-5002',
        customerCode: 'CUS-1038',
        customerName: 'Omar Al-Rashid',
        service: 'استثمار',
        docs: ['Commercial Register', 'Company Profile', 'Financial Statement'],
        amount: '25000',
        currency: 'AED',
        payType: 'pay_card',
        receipt: '2026-07-17',
        expiry: '2026-08-15',
        employee: 'خالد عمر',
        status: 'pending_accountant',
        history: [{ text: 'تم إرسال الطلب للاعتماد ومطابقة الحوالة البنكية الصادرة', time: '2026-07-17' }]
    }
];

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [state, setState] = useState<AppState>({
      lang: (localStorage.getItem('yazal-lang') as 'ar' | 'en') || 'ar',
      theme: (localStorage.getItem('yazal-theme') as 'light' | 'dark') || 'light',
      view: 'dashboard',
      user: null,
      tasks: [],
      customTags: [],
      customers: [],
      serviceRequests: [],
      visaApps: [],
      invoices: [],
      expenses: [],
      serviceTypes: [],
      usersList: [],
      searchTerm: ''
  });

  // Async load database from real cloud Supabase
  useEffect(() => {
      async function initializeCloud(retries = 3, delay = 1000) {
          try {
              // 1. Auth check
              await initSupabaseAuth();

              // 2. Parallel loading with seed fallback
              const [
                  loadedUsers,
                  loadedCustomers,
                  loadedVisaApps,
                  loadedInvoices,
                  loadedExpenses,
                  loadedServiceRequests,
                  loadedTasks,
                  loadedServiceTypes,
                  loadedCustomTags
              ] = await Promise.all([
                  loadUsers(),
                  loadCustomers(),
                  loadVisaApps(),
                  loadInvoices(),
                  loadExpenses(),
                  loadServiceRequests(initialRequests),
                  loadTasks(initialTasks),
                  loadServiceTypes(),
                  loadCustomTags([
                      { name: 'مستعجل', color: '#EF4444' },
                      { name: 'عمل', color: '#3B82F6' },
                      { name: 'شخصي', color: '#10B981' }
                  ])
              ]);

              // 3. Set loaded state
              setState(prev => ({
                  ...prev,
                  usersList: loadedUsers,
                  customers: loadedCustomers,
                  visaApps: loadedVisaApps,
                  invoices: loadedInvoices,
                  expenses: loadedExpenses,
                  serviceRequests: loadedServiceRequests,
                  tasks: loadedTasks,
                  serviceTypes: loadedServiceTypes,
                  customTags: loadedCustomTags
              }));
              
              setIsInitializing(false);
          } catch (error) {
              console.error("Critical error loading live cloud DB:", error);
              if (retries > 0) {
                  console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return initializeCloud(retries - 1, delay * 2);
              } else {
                  setIsInitializing(false);
              }
          }
      }

      initializeCloud();
  }, []);

  const handleLogin = (user: User) => {
      setState(prev => ({ 
          ...prev, 
          user, 
          view: PERMS[user.role][0] 
      }));
  };

  const handleLogout = () => {
      setState(prev => ({ 
          ...prev, 
          user: null, 
          view: 'dashboard' 
      }));
  };

  const handleSearch = (term: string) => {
      setState(prev => ({ ...prev, searchTerm: term }));
  };

  const toggleLang = () => {
      setState(prev => {
          const nextLang = prev.lang === 'ar' ? 'en' : 'ar';
          localStorage.setItem('yazal-lang', nextLang);
          return { ...prev, lang: nextLang };
      });
  };

  const toggleTheme = () => {
      setState(prev => {
          const nextTheme = prev.theme === 'light' ? 'dark' : 'light';
          localStorage.setItem('yazal-theme', nextTheme);
          return { ...prev, theme: nextTheme };
      });
  };

  // Intercepting State modifications and pushing them to actual Supabase
  const handleUpdateState = (newState: Partial<AppState>) => {
      setState(prev => {
          const merged = { ...prev, ...newState };

          if (newState.tasks) {
              newState.tasks.forEach(t => saveTaskToDb(t));
          }
          if (newState.customers) {
              newState.customers.forEach(c => saveCustomerToDb(c));
          }
          if (newState.serviceRequests) {
              newState.serviceRequests.forEach(r => saveServiceRequestToDb(r));
          }
          if (newState.visaApps) {
              newState.visaApps.forEach(v => saveVisaAppToDb(v));
          }
          if (newState.invoices) {
              newState.invoices.forEach(i => saveInvoiceToDb(i));
          }
          if (newState.expenses) {
              newState.expenses.forEach((e, idx) => saveExpenseToDb(e, `EXP-${idx}-${e.date}`));
          }
          if (newState.serviceTypes) {
              saveServiceTypesToDb(newState.serviceTypes);
          }
          if (newState.usersList) {
              newState.usersList.forEach(u => saveUserToDb(u));
          }
          if (newState.customTags) {
              saveCustomTagsToDb(newState.customTags);
          }

          return merged;
      });
  };

  const handleUpdateCustomers = (customers: Customer[]) => {
      setState(prev => ({ ...prev, customers }));
      customers.forEach(c => saveCustomerToDb(c));
  };

  const handleUpdateVisaApps = (visaApps: VisaApp[]) => {
      setState(prev => ({ ...prev, visaApps }));
      visaApps.forEach(v => saveVisaAppToDb(v));
  };

  const handleUpdateInvoices = (invoices: Invoice[]) => {
      setState(prev => ({ ...prev, invoices }));
      invoices.forEach(i => saveInvoiceToDb(i));
  };

  const handleUpdateExpenses = (expenses: Expense[]) => {
      setState(prev => ({ ...prev, expenses }));
      expenses.forEach((e, idx) => saveExpenseToDb(e, `EXP-${idx}-${e.date}`));
  };

  const handleUpdateServiceTypes = (serviceTypes: string[]) => {
      setState(prev => ({ ...prev, serviceTypes }));
      saveServiceTypesToDb(serviceTypes);
  };

  const handleUpdateUsers = (usersList: User[]) => {
      setState(prev => ({ ...prev, usersList }));
      usersList.forEach(u => saveUserToDb(u));
  };

  const handleAddServiceRequest = (req: ServiceRequest) => {
      setState(prev => ({ 
          ...prev, 
          serviceRequests: [req, ...prev.serviceRequests] 
      }));
      saveServiceRequestToDb(req);
  };

  const isRtl = state.lang === 'ar';

  const renderContent = () => {
      if (state.user) {
          const userPerms = PERMS[state.user.role] || [];
          if (state.view !== 'dashboard' && !userPerms.includes(state.view)) {
              return (
                  <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                      <span style={{ fontSize: '48px' }}>⚠️</span>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '12px' }}>
                          {isRtl ? 'عذراً، غير مصرح بالدخول' : 'Access Denied'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                          {isRtl 
                              ? 'صلاحيتك الحالية لا تسمح باستعراض أو تعديل هذا الملف المالي الحساس.' 
                              : 'Your employee profile does not hold permissions to read or modify these records.'}
                      </p>
                  </div>
              );
          }
      }

      switch (state.view) {
          case 'dashboard':
              return (
                  <DashboardView 
                      state={state} 
                      onNavigate={(view) => setState(prev => ({ ...prev, view }))} 
                  />
              );
          case 'customers':
              return (
                  <CustomersView 
                      state={state} 
                      onUpdateCustomers={handleUpdateCustomers} 
                  />
              );
          case 'newreq':
              return (
                  <NewRequestView 
                      state={state} 
                      onUpdateState={handleUpdateState}
                      onAddServiceRequest={handleAddServiceRequest}
                  />
              );
          case 'approvals':
              return (
                  <ApprovalsView 
                      state={state} 
                      onUpdateState={handleUpdateState}
                  />
              );
          case 'tasks':
              return (
                  <TasksView 
                      state={state} 
                      onUpdateState={handleUpdateState}
                  />
              );
          case 'visa':
              return (
                  <VisaView 
                      state={state} 
                      onUpdateVisaApps={handleUpdateVisaApps}
                  />
              );
          case 'invoices':
              return (
                  <InvoicesView 
                      state={state} 
                      onUpdateInvoices={handleUpdateInvoices}
                  />
              );
          case 'accounting':
              return (
                  <AccountingView 
                      state={state} 
                      onUpdateExpenses={handleUpdateExpenses}
                  />
              );
          case 'settings':
              return <SettingsView state={state} />;
          case 'reports':
              return <ReportsView state={state} />;
          case 'docs':
              return <DocsView state={state} />;
          case 'workflow':
              return <WorkflowView state={state} />;
          case 'users':
              return (
                  <UsersView 
                      state={state} 
                      onUpdateUsers={handleUpdateUsers}
                  />
              );
          case 'services':
              return (
                  <ServicesView 
                      state={state} 
                      onUpdateServiceTypes={handleUpdateServiceTypes}
                  />
              );
          default:
              return (
                  <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <span style={{ fontSize: '48px' }}>🚀</span>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '12px' }}>
                          {isRtl ? 'قريباً جداً' : 'Coming Soon'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                          {isRtl 
                              ? 'هذا الجزء قيد التطوير والتكامل مع القنصليات المركزية.' 
                              : 'This module is on the direct roadmap and is undergoing automated embassy integration tests.'}
                      </p>
                  </div>
              );
      }
  };

  if (isInitializing) {
      return (
          <div data-theme={state.theme} className={state.lang === 'ar' ? 'rtl' : 'ltr'} dir={state.lang === 'ar' ? 'rtl' : 'ltr'}>
              <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid var(--border-color, #eaeaea)',
                      borderTopColor: 'var(--primary, #0f52ba)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                  }} />
                  <style>{`
                      @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                      }
                  `}</style>
              </div>
          </div>
      );
  }

  return (
      <div data-theme={state.theme} className={state.lang === 'ar' ? 'rtl' : 'ltr'} dir={state.lang === 'ar' ? 'rtl' : 'ltr'}>
          {!state.user ? (
              <LoginScreen onLogin={handleLogin} state={state} onToggleLang={toggleLang} />
          ) : (
              <div className="app">
                  <Sidebar 
                      state={state} 
                      onNavigate={(view) => setState(prev => ({ ...prev, view }))} 
                      onLogout={handleLogout} 
                      isOpen={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                  />
                  <div className="main">
                      <Topbar 
                          state={state} 
                          onToggleLang={toggleLang} 
                          onToggleTheme={toggleTheme} 
                          onToggleSidebar={() => setSidebarOpen(open => !open)}
                          onSearch={handleSearch}
                      />
                      <div className="content" id="content" style={{ padding: '32px 24px 60px 24px' }}>
                          {renderContent()}
                      </div>
                  </div>
              </div>
          )}
          <Analytics />
      </div>
  );
}
