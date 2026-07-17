import React, { useState } from 'react';
import { AppState, ServiceRequest, Task, Expense } from '../types';
import { T } from '../data';

interface ApprovalsViewProps {
    state: AppState & {
        serviceRequests: ServiceRequest[];
        tasks: Task[];
        expenses: Expense[];
    };
    onUpdateState: (newState: Partial<AppState>) => void;
}

export default function ApprovalsView({ state, onUpdateState }: ApprovalsViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Filter to only those pending accountant approval
    const [sortBy, setSortBy] = useState<'urgency' | 'date'>('date');
    const pendingRequests = state.serviceRequests.filter(req => req.status === 'pending_accountant').sort((a, b) => {
        if (sortBy === 'urgency') {
            return a.amount > b.amount ? -1 : 1; // Example: higher amount is more urgent
        } else {
            return a.receipt > b.receipt ? -1 : 1;
        }
    });

    // Reject Dialog modal state
    const [selectedRequestForReject, setSelectedRequestForReject] = useState<ServiceRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = (req: ServiceRequest) => {
        // 1. Update Request Status to executor_pending
        const updatedRequests: ServiceRequest[] = state.serviceRequests.map(r => {
            if (r.id === req.id) {
                return {
                    ...r,
                    status: 'executor_pending' as const,
                    history: [
                        ...r.history,
                        {
                            text: isRtl ? 'تمت الموافقة المالية بواسطة المحاسب وتم تحويلها للتنفيذ' : 'Payment approved by accountant. Transferred to execution.',
                            time: new Date().toLocaleDateString()
                        }
                    ]
                };
            }
            return r;
        });

        // 2. Automatically log an Income Transaction in Accounting general ledger
        const newExpense: Expense = {
            desc: isRtl ? `دخل مبيعات طلب ${req.id} - ${req.service}` : `Sales Income request ${req.id} - ${req.service}`,
            amount: req.amount,
            currency: req.currency,
            by: state.user?.name || 'سارة يوسف',
            date: new Date().toISOString().split('T')[0],
            type: 'income'
        };
        const updatedExpenses = [newExpense, ...state.expenses];

        // 3. Automatically create a task in the Task database for Executors to clear
        const newExecutionTask: Task = {
            id: `TSK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            title: isRtl ? `تخليص معاملة ${req.service} للعميل ${req.customerName}` : `Process ${req.service} for client ${req.customerName}`,
            description: isRtl 
                ? `طلب ${req.id}. الكود: ${req.customerCode}. الرسوم مدفوعة بالكامل بقيمة ${req.amount} ${req.currency}. المرفقات: ${req.docs.join(', ')}`
                : `Request ${req.id}. Code: ${req.customerCode}. Paid fees: ${req.amount} ${req.currency}. Docs: ${req.docs.join(', ')}`,
            priority: 'high',
            dueDate: req.expiry,
            status: 'todo',
            tags: [isRtl ? 'معتمد' : 'Approved', req.service]
        };
        const updatedTasks = [newExecutionTask, ...state.tasks];

        // Commit all 3 updates at once to state!
        onUpdateState({
            serviceRequests: updatedRequests,
            expenses: updatedExpenses,
            tasks: updatedTasks
        });

        alert(isRtl ? 'تم اعتماد الدفعة المالية بنجاح وصدر أمر تنفيذ تلقائي لمسؤول العمليات!' : 'Payment approved successfully! Operations task dispatched.');
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequestForReject) return;

        const updatedRequests: ServiceRequest[] = state.serviceRequests.map(r => {
            if (r.id === selectedRequestForReject.id) {
                return {
                    ...r,
                    status: 'rejected' as const,
                    history: [
                        ...r.history,
                        {
                            text: isRtl ? `مرفوض: ${rejectReason}` : `Rejected: ${rejectReason}`,
                            time: new Date().toLocaleDateString()
                        }
                    ]
                };
            }
            return r;
        });

        onUpdateState({ serviceRequests: updatedRequests });
        setSelectedRequestForReject(null);
        setRejectReason('');
        alert(isRtl ? 'تم رفض المعاملة وإعادتها لقسم المبيعات للتعديل.' : 'Request rejected and returned to sales team.');
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">{t('approvals_t')}</h1>
                    <p className="page-desc">{t('approvals_s')}</p>
                </div>
                <select className="border p-2 rounded" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="date">{isRtl ? 'ترتيب حسب التاريخ' : 'Sort by Date'}</option>
                    <option value="urgency">{isRtl ? 'ترتيب حسب الأهمية' : 'Sort by Urgency'}</option>
                </select>
            </div>

            {pendingRequests.length === 0 ? (
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '42px', marginBottom: '14px' }}>🛡️</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                        {t('empty_approvals')}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                        {isRtl ? 'لا توجد دفعات مالية معلقة بانتظار الاعتماد حالياً. جميع الطلبات مراجعة.' : 'No pending sales payments are waiting. All clear!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pendingRequests.map(req => (
                        <div key={req.id} className="card" style={{ padding: '20px', borderInlineStart: '4px solid var(--gold-500)', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                
                                {/* Info details */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontFamily: 'var(--font-disp)', fontSize: '13px', fontWeight: 700, color: 'var(--gold-600)', background: 'var(--warn-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {req.id}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            👤 {req.employee}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                                        {req.customerName} <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-muted)' }}>({req.customerCode})</span>
                                    </h3>
                                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
                                        {isRtl ? 'الخدمة المطلوبة:' : 'Requested Service:'} <span style={{ color: 'var(--gold-600)' }}>{req.service}</span>
                                    </div>
                                    
                                    {/* List documents */}
                                    {req.docs && req.docs.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                            {req.docs.map(doc => (
                                                <span key={doc} style={{ fontSize: '11px', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>
                                                    📄 {doc}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Financial block */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {isRtl ? 'المبلغ المستلم ومستند السداد:' : 'Received payment & mode:'}
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-disp)' }}>
                                        {parseFloat(req.amount).toLocaleString()} <span style={{ fontSize: '12px' }}>{req.currency}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                                        💳 {t(req.payType)} | 🗓️ {req.receipt}
                                    </div>
                                </div>

                                {/* Decisive approval buttons */}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                                    <button 
                                        onClick={() => setSelectedRequestForReject(req)}
                                        className="btn" 
                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '8px 12px', fontSize: '12.5px' }}
                                    >
                                        {t('reject')}
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(req)}
                                        className="btn success" 
                                        style={{ padding: '8px 16px', fontSize: '12.5px' }}
                                    >
                                        {t('accept')}
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Reason input dialog */}
            {selectedRequestForReject && (
                <div className="overlay open" onClick={() => setSelectedRequestForReject(null)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <form onSubmit={handleRejectSubmit} className="card" onClick={e => e.stopPropagation()} style={{ width: '400px', padding: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
                            {t('reject_reason')}
                        </h3>
                        <div className="field">
                            <label>{isRtl ? 'وضح سبب الرفض المالي للمبيعات *' : 'Specify financial rejection reason *'}</label>
                            <textarea 
                                required
                                value={rejectReason} 
                                onChange={e => setRejectReason(e.target.value)} 
                                placeholder={isRtl ? 'مثال: لم يتم استلام التحويل البنكي الفعلي، أو المبلغ ناقص...' : 'E.g. Bank transfer not yet verified...'}
                                style={{ minHeight: '80px', padding: '8px 12px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" onClick={() => setSelectedRequestForReject(null)}>
                                {t('close')}
                            </button>
                            <button type="submit" className="btn danger">
                                {isRtl ? 'تأكيد الرفض والإرجاع' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
