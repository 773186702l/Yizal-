import React, { useState } from 'react';
import { AppState, Expense } from '../types';
import { T } from '../data';

interface AccountingViewProps {
    state: AppState & { expenses: Expense[] };
    onUpdateExpenses: (expenses: Expense[]) => void;
}

export default function AccountingView({ state, onUpdateExpenses }: AccountingViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Form state for new expense
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('EGP');
    const [expenseType, setExpenseType] = useState<'income' | 'expense'>('expense');

    // Totals calculation (convert EGP/others mock-simulated with simple conversion rate for consolidated display, or just sum directly)
    const totalIncome = state.expenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + parseFloat(e.amount.replace(/,/g, '') || '0'), 0);

    const totalExpense = state.expenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + parseFloat(e.amount.replace(/,/g, '') || '0'), 0);

    const netProfit = totalIncome - totalExpense;

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc.trim() || !amount.trim()) return;

        const newTx: Expense = {
            desc: desc.trim(),
            amount: parseFloat(amount).toString(),
            currency,
            by: state.user?.name || 'سارة يوسف',
            date: new Date().toISOString().split('T')[0],
            type: expenseType
        };

        onUpdateExpenses([newTx, ...state.expenses]);
        setDesc('');
        setAmount('');
        alert(isRtl ? 'تم قيد المعاملة المالية في دفتر اليومية بنجاح!' : 'Transaction posted to general ledger successfully!');
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">{t('nav_accounting')}</h1>
                    <p className="page-desc">
                        {isRtl ? 'دفتر الأستاذ العام والتحكم في التدفقات النقدية والعمولات' : 'General Ledger Cashflow and Expense Commissions'}
                    </p>
                </div>
            </div>

            {/* Financial Overview Cards Grid */}
            <div className="kpi-grid grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                        {isRtl ? '💳 المقبوضات والإيرادات' : 'Total Revenue'}
                    </div>
                    <div className="val" style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--success)', fontFamily: 'var(--font-disp)' }}>
                        {totalIncome.toLocaleString()} <span style={{ fontSize: '12px' }}>SAR/EGP</span>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                        {isRtl ? '💸 المصروفات والعمولات والمشتريات' : 'Total Expenses'}
                    </div>
                    <div className="val" style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--danger)', fontFamily: 'var(--font-disp)' }}>
                        {totalExpense.toLocaleString()} <span style={{ fontSize: '12px' }}>SAR/EGP</span>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                        {isRtl ? '📊 صافي الربح التشغيلي' : 'Net Operating Profit'}
                    </div>
                    <div className="val" style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-disp)' }}>
                        {netProfit.toLocaleString()} <span style={{ fontSize: '12px' }}>SAR/EGP</span>
                    </div>
                </div>
            </div>

            <div className="grid two-col" style={{ gap: '20px' }}>
                
                {/* Book New Ledger Entry Form */}
                <form onSubmit={handleAddExpense} className="card" style={{ padding: '20px', alignSelf: 'start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                        🪙 {isRtl ? 'قيد معاملة مالية جديدة' : 'Post New Ledger Entry'}
                    </h3>

                    <div className="field">
                        <label>{isRtl ? 'نوع القيد' : 'Transaction Type'}</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="button" 
                                className={`btn ${expenseType === 'expense' ? 'danger' : ''}`}
                                onClick={() => setExpenseType('expense')}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px' }}
                            >
                                💸 {isRtl ? 'مصروف / عمولة' : 'Expense / Commission'}
                            </button>
                            <button 
                                type="button" 
                                className={`btn ${expenseType === 'income' ? 'success' : ''}`}
                                onClick={() => setExpenseType('income')}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px' }}
                            >
                                📈 {isRtl ? 'إيراد / دفعة عميل' : 'Income / Payment'}
                            </button>
                        </div>
                    </div>

                    <div className="field">
                        <label>{isRtl ? 'وصف المعاملة *' : 'Description *'}</label>
                        <input 
                            required
                            value={desc} 
                            onChange={e => setDesc(e.target.value)} 
                            placeholder={isRtl ? 'مثال: عمولة وكيل فيزا، حبر الطابعة...' : 'E.g. Visa fee agent commission...'}
                        />
                    </div>

                    <div className="form-2col">
                        <div className="field">
                            <label>{isRtl ? 'المبلغ الرقمي *' : 'Amount *'}</label>
                            <input 
                                type="number" 
                                required
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.00" 
                            />
                        </div>
                        <div className="field">
                            <label>{isRtl ? 'العملة *' : 'Currency *'}</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)}>
                                <option value="EGP">EGP (جنيه مصري)</option>
                                <option value="SAR">SAR (ريال سعودي)</option>
                                <option value="USD">USD (دولار أمريكي)</option>
                                <option value="AED">AED (درهم إماراتي)</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
                        🖋️ {isRtl ? 'ترحيل المعاملة الآن' : 'Post Transaction'}
                    </button>
                </form>

                {/* Ledger Journal Log list */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                        📖 {isRtl ? 'دفتر اليومية الموحد' : 'Unified Daily Journal Ledger'}
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ fontSize: '12.5px' }}>
                            <thead>
                                <tr>
                                    <th>{isRtl ? 'البيان' : 'Particulars'}</th>
                                    <th>{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th>{isRtl ? 'المسؤول' : 'Posted By'}</th>
                                    <th>{isRtl ? 'القيمة المباشرة' : 'Value'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.expenses.map((tx, idx) => (
                                    <tr key={idx} className="row">
                                        <td style={{ fontWeight: 600 }}>
                                            <span style={{ marginRight: '6px' }}>
                                                {tx.type === 'income' ? '🟢' : '🔴'}
                                            </span>
                                            {tx.desc}
                                        </td>
                                        <td>{tx.date}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>👤 {tx.by}</td>
                                        <td className="font-mono" style={{ fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                            {tx.type === 'income' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} {tx.currency}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
