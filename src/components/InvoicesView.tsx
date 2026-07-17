import React, { useState } from 'react';
import { AppState, Invoice } from '../types';
import { T } from '../data';

interface InvoicesViewProps {
    state: AppState & { invoices: Invoice[] };
    onUpdateInvoices: (invoices: Invoice[]) => void;
}

export default function InvoicesView({ state, onUpdateInvoices }: InvoicesViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Selected Invoice for Drawer Preview
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Filter and search
    const [search, setSearch] = useState('');

    const filteredInvoices = state.invoices.filter(inv => 
        inv.no.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.toLowerCase().includes(search.toLowerCase())
    );

    const handleWhatsAppSend = (inv: Invoice) => {
        const text = isRtl 
            ? `مرحباً ${inv.customer}،\nمرفق لكم الفاتورة الرقمية رقم ${inv.no} الصادرة من تطبيق يزل للخدمات.\nالمبلغ المطلوب: ${inv.amount} ${inv.currency}\nحالة الفاتورة: ${t('st_' + inv.status)}\nللدفع الإلكتروني أو الاستعلام: https://yazal-app.com/invoice/${inv.no}\nشكراً لتعاملكم معنا.`
            : `Hello ${inv.customer},\nHere is your digital invoice ${inv.no} from Yazal App.\nAmount due: ${inv.amount} ${inv.currency}\nInvoice status: ${t('st_' + inv.status)}\nPay online or inspect: https://yazal-app.com/invoice/${inv.no}\nThank you for choosing Yazal App.`;

        // Copy template to clipboard
        navigator.clipboard.writeText(text);
        alert(isRtl ? 'تم نسخ قالب رسالة واتساب الجاهزة إلى الحافظة للإرسال السريع!' : 'WhatsApp template message copied to clipboard!');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">{t('inv_t')}</h1>
                    <p className="page-desc">{t('inv_s')}</p>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
                    <span>🔍</span>
                    <input 
                        type="text" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder={isRtl ? 'ابحث برقم الفاتورة أو اسم العميل...' : 'Search by invoice number or customer name...'} 
                        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', width: '100%' }}
                    />
                </div>
            </div>

            {/* Invoices Table */}
            <div className="card" style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table>
                    <thead>
                        <tr>
                            <th>{t('th_invno')}</th>
                            <th>{t('th_name')}</th>
                            <th>{t('th_amount')}</th>
                            <th>{t('th_date')}</th>
                            <th>{t('th_status')}</th>
                            <th>{isRtl ? 'طريقة السداد' : 'Payment Mode'}</th>
                            <th>{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    {isRtl ? 'لا توجد فواتير مطابقة للبحث حالياً.' : 'No invoices matching search.'}
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map(inv => (
                                <tr key={inv.no} className="row" onClick={() => setSelectedInvoice(inv)}>
                                    <td className="cell-primary font-mono" style={{ color: 'var(--gold-600)' }}>
                                        {inv.no}
                                    </td>
                                    <td><div style={{ fontWeight: 600 }}>{inv.customer}</div></td>
                                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--success)' }}>
                                        {inv.amount} <span style={{ fontSize: '11px' }}>{inv.currency}</span>
                                    </td>
                                    <td>{inv.date}</td>
                                    <td>
                                        <span className={`stamp ${inv.status === 'paid' ? 'success' : inv.status === 'unpaid' ? 'danger' : 'warn'}`}>
                                            {t('st_' + inv.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '12px' }}>💳 {t(inv.method || 'pay_cash')}</span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button 
                                                className="btn" 
                                                onClick={() => handleWhatsAppSend(inv)}
                                                style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: '#25D366', color: '#fff', border: 'none' }}
                                            >
                                                💬 {isRtl ? 'واتساب' : 'WhatsApp'}
                                            </button>
                                            <button 
                                                className="btn" 
                                                onClick={() => setSelectedInvoice(inv)}
                                                style={{ padding: '6px 10px', fontSize: '11px' }}
                                            >
                                                👁️ {isRtl ? 'معاينة' : 'Preview'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Slide Invoice Details Drawer */}
            {selectedInvoice && (
                <div className="overlay open" onClick={() => setSelectedInvoice(null)}>
                    <div className="drawer" onClick={e => e.stopPropagation()} style={{
                        left: isRtl ? 0 : 'auto',
                        right: isRtl ? 'auto' : 0,
                        transform: 'none'
                    }}>
                        <div className="drawer-head">
                            <div>
                                <span style={{ fontFamily: 'var(--font-disp)', color: 'var(--gold-600)', fontSize: '13px', fontWeight: 700, display: 'block' }}>
                                    {selectedInvoice.no}
                                </span>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                                    {isRtl ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
                                </h3>
                            </div>
                            <button className="drawer-close" onClick={() => setSelectedInvoice(null)}>✕</button>
                        </div>

                        {/* Interactive Styled Invoice Body */}
                        <div style={{
                            backgroundColor: 'var(--surface-2)',
                            border: '1px dashed var(--border)',
                            borderRadius: '10px',
                            padding: '20px',
                            marginTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                                        {isRtl ? 'شركة النجم الذهبي' : 'Golden Star Travel'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {isRtl ? 'الرقم الضريبي: ٣٠١١٤٤٢٢٤٤' : 'VAT No: 3011442244'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'end', fontSize: '11px', color: 'var(--text-muted)' }}>
                                    <div>{selectedInvoice.date}</div>
                                    <div>{selectedInvoice.no}</div>
                                </div>
                            </div>

                            <div className="field-row">
                                <span className="k">{isRtl ? 'العميل المستفيد' : 'Beneficiary'}</span>
                                <span className="v">{selectedInvoice.customer}</span>
                            </div>

                            <div className="field-row">
                                <span className="k">{t('method')}</span>
                                <span className="v">💳 {t(selectedInvoice.method || 'pay_cash')}</span>
                            </div>

                            <div className="field-row" style={{ borderBottom: 'none' }}>
                                <span className="k">{isRtl ? 'الحالة المباشرة' : 'Status'}</span>
                                <span className="v">
                                    <span className={`stamp ${selectedInvoice.status === 'paid' ? 'success' : 'danger'}`}>
                                        {t('st_' + selectedInvoice.status)}
                                    </span>
                                </span>
                            </div>

                            <div style={{
                                marginTop: '14px',
                                background: 'var(--surface)',
                                borderTop: '2px solid var(--gold-600)',
                                padding: '12px',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '14px' }}>{t('total')}</span>
                                <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--success)', fontFamily: 'var(--font-disp)' }}>
                                    {selectedInvoice.amount} {selectedInvoice.currency}
                                </span>
                            </div>

                            {/* Generates beautiful SVG barcode/QR code representational graphic */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', gap: '8px' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundColor: '#fff',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    border: '1px solid var(--border)'
                                }}>
                                    {/* Simulated QR block code matrix */}
                                    <div style={{ display: 'flex', gap: '2px', height: '18px' }}>
                                        <div style={{ flex: 1, backgroundColor: '#000' }} /><div style={{ flex: 1 }} /><div style={{ flex: 2, backgroundColor: '#000' }} /><div style={{ flex: 1 }} /><div style={{ flex: 1, backgroundColor: '#000' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px', height: '18px' }}>
                                        <div style={{ flex: 1 }} /><div style={{ flex: 2, backgroundColor: '#000' }} /><div style={{ flex: 1 }} /><div style={{ flex: 2, backgroundColor: '#000' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px', height: '18px' }}>
                                        <div style={{ flex: 3, backgroundColor: '#000' }} /><div style={{ flex: 1 }} /><div style={{ flex: 1, backgroundColor: '#000' }} /><div style={{ flex: 1 }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px', height: '18px' }}>
                                        <div style={{ flex: 1 }} /><div style={{ flex: 1, backgroundColor: '#000' }} /><div style={{ flex: 2 }} /><div style={{ flex: 2, backgroundColor: '#000' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px', height: '18px' }}>
                                        <div style={{ flex: 2, backgroundColor: '#000' }} /><div style={{ flex: 1 }} /><div style={{ flex: 2, backgroundColor: '#000' }} /><div style={{ flex: 1 }} />
                                    </div>
                                </div>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {isRtl ? 'مسح رمز QR للتحقق المالي المباشر' : 'Scan QR for VAT confirmation'}
                                </span>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                            <button className="btn" onClick={handlePrint} style={{ flex: 1, justifyContent: 'center' }}>
                                🖨️ {t('print')}
                            </button>
                            <button className="btn" onClick={() => handleWhatsAppSend(selectedInvoice)} style={{ flex: 1, justifyContent: 'center', backgroundColor: '#25D366', color: '#fff', border: 'none' }}>
                                💬 {isRtl ? 'إرسال واتساب' : 'WhatsApp'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
