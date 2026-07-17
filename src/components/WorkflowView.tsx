import React, { useState } from 'react';
import { AppState } from '../types';
import { T } from '../data';

export default function WorkflowView({ state }: { state: AppState }) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Selected step for detailed info
    const [selectedStep, setSelectedStep] = useState(0);

    const steps = [
        {
            num: '01',
            title: isRtl ? 'قيد المبيعات والعميل الموحد' : 'Sales & Unified Customer File',
            arName: 'قيد المبيعات والعميل',
            role: isRtl ? 'المبيعات / الإدارة' : 'Sales Representatives',
            desc: isRtl 
                ? 'يقوم المبيعات بتسجيل العميل بالكامل (الاسم والاتصال والجنسية) ويولد النظام رقم موحد كود CUS-XXXX. لا يمكن عمل طلب دون التحقق من الـ CRM.'
                : 'Sales representatives register the client details first in the system, obtaining a unique CUS-XXXX code. No request can exist without valid CRM verification.',
            color: 'var(--gold-600)',
            badge: isRtl ? 'أول سير العمل' : 'Start of Flow'
        },
        {
            num: '02',
            title: isRtl ? 'الاعتماد المالي والتحصيل' : 'Financial Approval & Ledgering',
            arName: 'الاعتماد المالي والتحصيل',
            role: isRtl ? 'المحاسب المالي' : 'Accountant',
            desc: isRtl
                ? 'يظهر الطلب تلقائياً في شاشة المحاسب. بعد مراجعة الإيصال البنكي أو طريقة السداد، يعتمد الدفعة المبيعات فتتحول تلقائياً لدفتر الأستاذ العام.'
                : 'The registered request is instantly queued for financial check. The accountant audits receipts/remittances. Once approved, funds flow automatically to the General Ledger.',
            color: 'var(--info)',
            badge: isRtl ? 'اعتماد المحاسب' : 'Accountant Review'
        },
        {
            num: '03',
            title: isRtl ? 'تنفيذ وتخليص المعاملة' : 'Operations Execution',
            arName: 'التنفيذ وتخليص المعاملة',
            role: isRtl ? 'منفذ المعاملات (المعقب)' : 'Operations Executor',
            desc: isRtl
                ? 'يتلقى المنفذ المعقب المعاملة المعتمدة في شاشة المهام للتخليص مع القنصليات والجهات الحكومية، ومتابعة الأوراق المرفقة.'
                : 'Once verified, the execution task appears on the operators workspace dashboard. Operators submit documentation to foreign embassies, government divisions, and consulates.',
            color: 'var(--warn)',
            badge: isRtl ? 'تخليص المعاملة' : 'Operational Clearance'
        },
        {
            num: '04',
            title: isRtl ? 'الفاتورة التلقائية والـ QR' : 'Auto Invoicing & QR VAT',
            arName: 'الفاتورة والـ QR',
            role: isRtl ? 'النظام التلقائي' : 'System Engine',
            desc: isRtl
                ? 'فور وضع علامة "مكتمل" من قبل منفذ المعاملات، يقوم النظام تلقائياً وبشكل فوري بإصدار فاتورة ضريبية برقم INV-XXXX مع كود QR مرمز ضريبياً.'
                : 'When operational clearance completes, the system automatically prints a verified VAT invoice (INV-XXXX) decorated with digital QR code matrices.',
            color: 'var(--success)',
            badge: isRtl ? 'إصدار تلقائي' : 'Automated Billing'
        },
        {
            num: '05',
            title: isRtl ? 'الإرسال للعميل والأرشفة' : 'WhatsApp Delivery & Archive',
            arName: 'الإرسال والأرشفة',
            role: isRtl ? 'النظام والمستخدم' : 'Unified Messenger',
            desc: isRtl
                ? 'يقوم النظام بتهيئة قالب رسالة واتساب جاهزة بالإرسال، ثم أرشفة الطلب في السجل الموحد للعميل لاسترجاعه مستقبلاً.'
                : 'An automated CRM pre-compiled WhatsApp text is ready for swift clipboard copying to dispatch direct details, and the file is permanently archived.',
            color: 'var(--ink-800)',
            badge: isRtl ? 'أرشفة موثقة' : 'Secure Archiving'
        }
    ];

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">{t('nav_workflow')}</h1>
                    <p className="page-desc">{t('wf_s')}</p>
                </div>
            </div>

            {/* Interactive workflow progress trail */}
            <div className="card" style={{ padding: '30px 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {steps.map((st, idx) => {
                        const isActive = idx === selectedStep;
                        return (
                            <React.Fragment key={idx}>
                                <div 
                                    onClick={() => setSelectedStep(idx)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        minWidth: '100px',
                                        flex: 1,
                                        zIndex: 1
                                    }}
                                >
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: isActive ? st.color : 'var(--surface-2)',
                                        border: `2.5px solid ${isActive ? st.color : 'var(--border)'}`,
                                        color: isActive ? '#fff' : 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '14px',
                                        transition: 'all 0.25s',
                                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                    }}>
                                        {st.num}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        color: isActive ? 'var(--text)' : 'var(--text-muted)'
                                    }}>
                                        {isRtl ? st.arName : st.title.split('&')[0]}
                                    </div>
                                </div>

                                {/* Connecting dots indicator (except for last one) */}
                                {idx < steps.length - 1 && (
                                    <div style={{
                                        flex: 1,
                                        height: '2px',
                                        backgroundColor: idx < selectedStep ? steps[idx].color : 'var(--border)',
                                        minWidth: '20px',
                                        marginTop: '-24px',
                                        transition: 'background-color 0.25s'
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Step Detail Explanation Area */}
            <div className="card" style={{ padding: '24px', borderLeft: `6px solid ${steps[selectedStep].color}`, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '12px' }}>
                            {steps[selectedStep].badge}
                        </span>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '8px' }}>
                            {steps[selectedStep].title}
                        </h2>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {isRtl ? 'المسؤول المباشر:' : 'Responsible party:'} <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{steps[selectedStep].role}</strong>
                    </div>
                </div>

                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text)', marginBottom: '20px' }}>
                    {steps[selectedStep].desc}
                </p>

                {/* Automation highlight message box */}
                <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '24px' }}>🤖</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {isRtl 
                            ? 'نظام يزل الذكي يراقب المعاملات تلقائياً. لا داعي للمتابعة اليدوية أو الاستفسارات الورقية بين الفروع.' 
                            : 'Yazal Automation handles status handovers seamlessly. No manual tracking slips or physical routing forms are required.'}
                    </div>
                </div>
            </div>
        </div>
    );
}
