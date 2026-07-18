import React, { useState } from 'react';
import { AppState, Customer } from '../types';
import { T } from '../data';
import { sendWhatsAppMessage } from '../lib/whatsapp';
import { MessageSquare } from 'lucide-react';

interface CustomersViewProps {
    state: AppState & { customers: Customer[] };
    onUpdateCustomers: (customers: Customer[]) => void;
}

export default function CustomersView({ state, onUpdateCustomers }: CustomersViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

    // Selected customer for side drawer
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Create customer modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerNat, setNewCustomerNat] = useState('');
    const [newCustomerStatus, setNewCustomerStatus] = useState<'active' | 'inactive' | 'pending'>('active');

    const handleCreateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerName.trim()) return;

        // Auto-generate code like CUS-1043
        const nextIdNumber = state.customers.length > 0 
            ? Math.max(...state.customers.map(c => parseInt(c.code.split('-')[1] || '1000'))) + 1
            : 1000;
        
        const newCustomer: Customer = {
            code: `CUS-${nextIdNumber}`,
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || '+20 100 000 0000',
            nat: newCustomerNat.trim() || (isRtl ? 'مصر' : 'Egypt'),
            status: newCustomerStatus,
            assigned: state.user?.name || 'خالد عمر',
            timeline: [
                {
                    text: isRtl ? 'تم إنشاء ملف العميل الموحد في النظام' : 'Customer profile registered in the central system',
                    time: isRtl ? 'الآن' : 'Just now'
                }
            ]
        };

        onUpdateCustomers([newCustomer, ...state.customers]);
        setShowCreateModal(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerNat('');
    };

    // Filtered lists
    const filteredCustomers = state.customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.phone.includes(searchQuery) ||
                              c.nat.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">{t('customers_t')}</h1>
                    <p className="page-desc">{t('customers_s')}</p>
                </div>
                <button className="btn primary" onClick={() => setShowCreateModal(true)}>
                    {t('new_customer')}
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
                    <span>🔍</span>
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        placeholder={isRtl ? 'ابحث بالاسم، الكود، الجنسية أو الهاتف...' : 'Search by name, code, nationality...'} 
                        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', width: '100%' }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {isRtl ? 'تصفية الحالة:' : 'Status Filter:'}
                    </label>
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value as any)}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                    >
                        <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                        <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                        <option value="inactive">{isRtl ? 'غير نشط' : 'Inactive'}</option>
                        <option value="pending">{isRtl ? 'قيد الانتظار' : 'Pending'}</option>
                    </select>
                </div>
            </div>

            {/* Customers Data Table */}
            <div className="card" style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{ minWidth: '700px' }}>
                    <thead>
                        <tr>
                            <th>{t('th_code')}</th>
                            <th>{t('th_name')}</th>
                            <th>{t('th_phone')}</th>
                            <th>{t('th_nat')}</th>
                            <th>{t('th_status')}</th>
                            <th>{t('th_assigned')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    {isRtl ? 'لا يوجد عملاء يطابقون خيارات البحث الحالية.' : 'No customers matching current search criteria.'}
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.code} className="row" onClick={() => setSelectedCustomer(customer)}>
                                    <td className="cell-primary" style={{ fontFamily: 'var(--font-disp)', color: 'var(--gold-600)' }}>
                                        {customer.code}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                    </td>
                                    <td style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {customer.phone}
                                            <button 
                                                className="btn-icon" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    sendWhatsAppMessage(customer.phone, isRtl ? 'مرحباً، أرسل لك رسالة من يزل.' : 'Hello, sending you a message from Yazal.');
                                                }}
                                                style={{ padding: '4px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '4px' }}
                                                title={isRtl ? 'إرسال واتساب' : 'Send WhatsApp'}
                                            >
                                                <MessageSquare size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td>{customer.nat}</td>
                                    <td>
                                        <span className={`stamp ${customer.status === 'active' ? 'success' : customer.status === 'inactive' ? 'danger' : 'warn'}`}>
                                            {t('st_' + customer.status)}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        👤 {customer.assigned}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Customer Timeline Side Drawer */}
            {selectedCustomer && (
                <div className="overlay open" onClick={() => setSelectedCustomer(null)}>
                    <div className="drawer" onClick={e => e.stopPropagation()} style={{
                        left: isRtl ? 0 : 'auto',
                        right: isRtl ? 'auto' : 0,
                        transform: 'none'
                    }}>
                        <div className="drawer-head">
                            <div>
                                <span style={{ fontFamily: 'var(--font-disp)', color: 'var(--gold-600)', fontSize: '13px', fontWeight: 700, display: 'block' }}>
                                    {selectedCustomer.code}
                                </span>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                                    {selectedCustomer.name}
                                </h3>
                            </div>
                            <button className="drawer-close" onClick={() => setSelectedCustomer(null)}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                            <div className="field-row">
                                <span className="k">{t('th_phone')}</span>
                                <div className="v" style={{ direction: 'ltr', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {selectedCustomer.phone}
                                    <button 
                                        className="btn" 
                                        onClick={() => sendWhatsAppMessage(selectedCustomer.phone, isRtl ? 'مرحباً، أرسل لك رسالة من يزل.' : 'Hello, sending you a message from Yazal.')}
                                        style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#25D366', color: '#fff', border: 'none' }}
                                    >
                                        <MessageSquare size={12} style={{ marginRight: isRtl ? 0 : '4px', marginLeft: isRtl ? '4px' : 0 }} />
                                        {isRtl ? 'واتساب' : 'WhatsApp'}
                                    </button>
                                </div>
                            </div>
                            <div className="field-row">
                                <span className="k">{t('th_nat')}</span>
                                <span className="v">{selectedCustomer.nat}</span>
                            </div>
                            <div className="field-row">
                                <span className="k">{t('status_lbl')}</span>
                                <span className="v">
                                    <span className={`stamp ${selectedCustomer.status === 'active' ? 'success' : selectedCustomer.status === 'inactive' ? 'danger' : 'warn'}`}>
                                        {t('st_' + selectedCustomer.status)}
                                    </span>
                                </span>
                            </div>
                            <div className="field-row">
                                <span className="k">{t('th_assigned')}</span>
                                <span className="v">👤 {selectedCustomer.assigned}</span>
                            </div>
                        </div>

                        {/* Customer History Timeline inside Drawer */}
                        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                                🕒 {t('timeline')}
                            </h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', borderLeft: isRtl ? 'none' : '2px solid var(--border)', borderRight: isRtl ? '2px solid var(--border)' : 'none', paddingLeft: isRtl ? 0 : '16px', paddingRight: isRtl ? '16px' : 0 }}>
                                {selectedCustomer.timeline.map((item, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        {/* Dot indicator */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: isRtl ? 'auto' : '-22px',
                                            right: isRtl ? '-22px' : 'auto',
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            backgroundColor: idx === 0 ? 'var(--gold-600)' : 'var(--border)',
                                            border: '2px solid var(--surface)'
                                        }} />
                                        <div style={{ fontSize: '13px', fontWeight: idx === 0 ? 600 : 500, color: idx === 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                                            {item.text}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {item.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Customer Dialog Modal */}
            {showCreateModal && (
                <div className="overlay open" onClick={() => setShowCreateModal(false)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <form onSubmit={handleCreateCustomer} className="card" onClick={e => e.stopPropagation()} style={{ width: '400px', maxWidth: '95vw', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                            {isRtl ? 'إنشاء ملف عميل جديد موحد' : 'Create Unified Customer File'}
                        </h3>

                        <div className="field">
                            <label>{isRtl ? 'اسم العميل بالكامل *' : 'Full Customer Name *'}</label>
                            <input 
                                required
                                value={newCustomerName} 
                                onChange={e => setNewCustomerName(e.target.value)} 
                                placeholder={isRtl ? 'مثال: عبد الله بن محمد...' : 'Example: John Doe...'}
                            />
                        </div>

                        <div className="field">
                            <label>{isRtl ? 'رقم الهاتف *' : 'Phone Number *'}</label>
                            <input 
                                value={newCustomerPhone} 
                                onChange={e => setNewCustomerPhone(e.target.value)} 
                                placeholder="+966 50 123 4567"
                            />
                        </div>

                        <div className="field">
                            <label>{isRtl ? 'الجنسية / الدولة *' : 'Nationality / Country *'}</label>
                            <input 
                                value={newCustomerNat} 
                                onChange={e => setNewCustomerNat(e.target.value)} 
                                placeholder={isRtl ? 'مثال: السعودية، مصر، أمريكا...' : 'Example: Saudi Arabia...'}
                            />
                        </div>

                        <div className="field">
                            <label>{isRtl ? 'حالة العميل المبدئية' : 'Initial Status'}</label>
                            <select value={newCustomerStatus} onChange={e => setNewCustomerStatus(e.target.value as any)}>
                                <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                                <option value="pending">{isRtl ? 'قيد الانتظار' : 'Pending'}</option>
                                <option value="inactive">{isRtl ? 'غير نشط' : 'Inactive'}</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreateModal(false)}>
                                {t('close')}
                            </button>
                            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
                                {isRtl ? 'حفظ العميل' : 'Save Customer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
