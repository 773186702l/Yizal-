import React, { useState } from 'react';
import { AppState, Customer, ServiceRequest } from '../types';
import { T } from '../data';

interface NewRequestViewProps {
    state: AppState & {
        customers: Customer[];
        serviceRequests: ServiceRequest[];
        serviceTypes: string[];
    };
    onUpdateState: (newState: Partial<AppState>) => void;
    onAddServiceRequest: (request: ServiceRequest) => void;
}

export default function NewRequestView({ state, onUpdateState, onAddServiceRequest }: NewRequestViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Form states
    const [customerCode, setCustomerCode] = useState('');
    const [service, setService] = useState(state.serviceTypes[0] || 'فيزا شنغن');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('SAR');
    const [payType, setPayType] = useState('pay_cash');
    const [receipt, setReceipt] = useState(new Date().toISOString().split('T')[0]);
    const [expiry, setExpiry] = useState('');
    const [employee, setEmployee] = useState(state.user?.name || 'خالد عمر');

    // Document checklist states
    const [newDocName, setNewDocName] = useState('');
    const [attachedDocs, setAttachedDocs] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);

    // Feedback message states
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Real-time lookup of customer
    const verifiedCustomer = state.customers.find(c => c.code.toUpperCase() === customerCode.trim().toUpperCase());

    const handleVerifyCustomer = () => {
        if (!customerCode.trim()) {
            setErrorMessage(isRtl ? 'الرجاء إدخال كود العميل أولاً' : 'Please enter customer code first');
            setSuccessMessage('');
            return;
        }
        if (verifiedCustomer) {
            setSuccessMessage(`${t('f_found')} ${verifiedCustomer.name} (${verifiedCustomer.nat})`);
            setErrorMessage('');
        } else {
            setErrorMessage(t('f_notfound'));
            setSuccessMessage('');
        }
    };

    const handleAddDoc = () => {
        if (newDocName.trim() && !attachedDocs.includes(newDocName.trim())) {
            setAttachedDocs([...attachedDocs, newDocName.trim()]);
            setNewDocName('');
        }
    };

    const handleRemoveDoc = (docName: string) => {
        setAttachedDocs(attachedDocs.filter(d => d !== docName));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const fileNames = files.map((file: any) => file.name);
            setAttachedDocs(prev => [...prev, ...fileNames]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileNames = Array.from(e.target.files).map((file: any) => file.name);
            setAttachedDocs(prev => [...prev, ...fileNames]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!verifiedCustomer) {
            setErrorMessage(t('f_customer_req'));
            return;
        }

        const nextIdNumber = state.serviceRequests.length > 0
            ? Math.max(...state.serviceRequests.map(r => parseInt(r.id.split('-')[1] || '5000'))) + 1
            : 5001;

        const newRequest: ServiceRequest = {
            id: `REQ-${nextIdNumber}`,
            customerCode: verifiedCustomer.code,
            customerName: verifiedCustomer.name,
            service,
            docs: attachedDocs,
            amount: amount || '0',
            currency,
            payType,
            receipt,
            expiry: expiry || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            employee,
            status: 'pending_accountant',
            history: [
                {
                    text: isRtl ? 'تم إنشاء الطلب بواسطة المبيعات وبانتظار اعتماد المحاسب' : 'Request created by sales, awaiting accountant approval',
                    time: new Date().toLocaleDateString()
                }
            ]
        };

        onAddServiceRequest(newRequest);

        // Reset form
        setCustomerCode('');
        setAmount('');
        setAttachedDocs([]);
        setErrorMessage('');
        setSuccessMessage(isRtl ? '🎉 تم إرسال الطلب للمحاسب بنجاح وتأسيس الفاتورة!' : '🎉 Request successfully sent to accountant and invoice created!');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
            setSuccessMessage('');
        }, 5000);
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">{t('newreq_t')}</h1>
                    <p className="page-desc">{t('newreq_s')}</p>
                </div>
            </div>

            {successMessage && successMessage.includes('🎉') && (
                <div style={{
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(16,185,129,0.2)',
                    marginBottom: '24px',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.1)',
                    animation: 'fade 0.3s ease'
                }}>
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: 'grid' }}>
                
                {/* Main Form Card */}
                <form onSubmit={handleSubmit} className="card lg:col-span-2" style={{ padding: '24px' }}>
                    <div className="form-2col">
                        
                        {/* Customer Verification Input */}
                        <div className="field">
                            <label>{t('f_custid')}</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    value={customerCode} 
                                    onChange={e => {
                                        setCustomerCode(e.target.value);
                                        setErrorMessage('');
                                        if (successMessage && successMessage.includes('🎉')) {
                                            // Keep submit success, but reset verifiedCustomer messages
                                        } else {
                                            setSuccessMessage('');
                                        }
                                    }} 
                                    placeholder={t('f_custid_ph')} 
                                    style={{ textTransform: 'uppercase' }}
                                />
                                <button type="button" className="btn" style={{ flexShrink: 0 }} onClick={handleVerifyCustomer}>
                                    {isRtl ? 'تحقق' : 'Verify'}
                                </button>
                            </div>
                            {errorMessage && <div style={{ color: 'var(--danger)', fontSize: '11.5px', marginTop: '6px', fontWeight: 600 }}>✕ {errorMessage}</div>}
                            {successMessage && !successMessage.includes('🎉') && <div style={{ color: 'var(--success)', fontSize: '11.5px', marginTop: '6px', fontWeight: 600 }}>✓ {successMessage}</div>}
                        </div>

                        {/* Service Type Selection */}
                        <div className="field">
                            <label>{t('f_service')}</label>
                            <select value={service} onChange={e => setService(e.target.value)}>
                                {state.serviceTypes.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-2col" style={{ marginTop: '10px' }}>
                        {/* Service Price Amount */}
                        <div className="field">
                            <label>{t('f_amount')}</label>
                            <input 
                                type="number" 
                                required
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.00" 
                            />
                        </div>

                        {/* Currency selector */}
                        <div className="field">
                            <label>{t('f_currency')}</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)}>
                                <option value="SAR">SAR (ريال سعودي)</option>
                                <option value="USD">USD (دولار أمريكي)</option>
                                <option value="EGP">EGP (جنيه مصري)</option>
                                <option value="AED">AED (درهم إماراتي)</option>
                                <option value="GBP">GBP (جنيه إسترليني)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-2col" style={{ marginTop: '10px' }}>
                        {/* Payment Type Selection */}
                        <div className="field">
                            <label>{t('f_paytype')}</label>
                            <select value={payType} onChange={e => setPayType(e.target.value)}>
                                <option value="pay_cash">{t('pay_cash')}</option>
                                <option value="pay_card">{t('pay_card')}</option>
                                <option value="pay_bank">{t('pay_bank')}</option>
                                <option value="pay_wallet">{t('pay_wallet')}</option>
                            </select>
                        </div>

                        {/* Receipt Date */}
                        <div className="field">
                            <label>{t('f_receipt')}</label>
                            <input type="date" value={receipt} onChange={e => setReceipt(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-2col" style={{ marginTop: '10px' }}>
                        {/* Delivery Target / Expiry Date */}
                        <div className="field">
                            <label>{t('f_expiry')}</label>
                            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} required />
                        </div>

                        {/* Sales representative assignment */}
                        <div className="field">
                            <label>{t('f_employee')}</label>
                            <input value={employee} disabled />
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn primary" style={{ padding: '12px 24px', gap: '8px' }}>
                            🚀 {t('f_submit')}
                        </button>
                    </div>
                </form>

                {/* Side Document Attachment Drawer */}
                <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📎</span> <span>{t('f_docs')}</span>
                        </h3>

                        {/* File Drag and Drop box */}
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: dragOver ? '2px dashed var(--gold-600)' : '2px dashed var(--border)',
                                borderRadius: '12px',
                                padding: '30px 10px',
                                textAlign: 'center',
                                background: dragOver ? 'var(--gold-100)' : 'var(--surface-2)',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <input 
                                type="file" 
                                multiple 
                                onChange={handleFileInput}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }} 
                            />
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                                {isRtl ? 'اسحب وأفلت المستندات هنا' : 'Drag and drop documents here'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {isRtl ? 'أو اضغط لتصفح الملفات من الهاتف أو الكمبيوتر' : 'or click to browse local files'}
                            </div>
                        </div>

                        {/* Add Document manually */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <input 
                                value={newDocName} 
                                onChange={e => setNewDocName(e.target.value)} 
                                placeholder={isRtl ? 'اسم مستند يدوي...' : 'Manual document name...'} 
                                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', flex: 1, background: 'var(--surface-2)', color: 'var(--text)' }}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDoc())}
                            />
                            <button type="button" className="btn" style={{ flexShrink: 0 }} onClick={handleAddDoc}>
                                {t('f_doc_add')}
                            </button>
                        </div>

                        {/* Render Attached Documents list */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
                            {attachedDocs.length === 0 ? (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    {isRtl ? 'لم يتم إرفاق أي مستندات حتى الآن.' : 'No documents attached yet.'}
                                </div>
                            ) : (
                                attachedDocs.map(doc => (
                                    <span key={doc} className="doc-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px' }}>
                                        <span>📄 {doc}</span>
                                        <span onClick={() => handleRemoveDoc(doc)} style={{ cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold', marginInlineStart: '4px' }}>✕</span>
                                    </span>
                                ))
                             )}
                        </div>
                    </div>

                    {/* Standard process guide panel */}
                    <div className="card perm-note" style={{ borderInlineStart: '4px solid var(--gold-600)', padding: '16px', background: 'var(--info-bg)' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gold-600)', marginBottom: '6px' }}>💡 {isRtl ? 'التدفق الذهبي لقسم المبيعات' : 'Sales Golden Guidelines'}</h4>
                        <ul style={{ fontSize: '12px', color: 'var(--text)', paddingInlineStart: '16px', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                            <li>{isRtl ? 'تأكد من مطابقة كود العميل بالCRM قبل الضغط على الحفظ.' : 'Verify customer code first before sending.'}</li>
                            <li>{isRtl ? 'الملفات المرفقة تذهب مباشرة لصفحة المراجعة الخاصة بمدير العمليات.' : 'Attached files are queued for operational review.'}</li>
                            <li>{isRtl ? 'الطلب لن يبدأ في التنفيذ إلا بعد سداد المبلغ وتأكيد المحاسب المالي.' : 'Operation triggers only after payment approval.'}</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
