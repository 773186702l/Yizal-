import React, { useState } from 'react';
import { AppState, VisaApp } from '../types';
import { T } from '../data';

interface VisaViewProps {
    state: AppState & { visaApps: VisaApp[] };
    onUpdateVisaApps: (apps: VisaApp[]) => void;
}

export default function VisaView({ state, onUpdateVisaApps }: VisaViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Local state for modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [destination, setDestination] = useState('');
    const [totalDocs, setTotalDocs] = useState(5);
    const [receivedDocs, setReceivedDocs] = useState(0);
    const [initialStage, setInitialStage] = useState<'draft' | 'submitted' | 'review' | 'approved' | 'rejected'>('draft');

    const stages: VisaApp['stage'][] = ['draft', 'submitted', 'review', 'approved', 'rejected'];

    const getStageName = (st: VisaApp['stage']) => {
        if (st === 'draft') return isRtl ? 'مسودة 📝' : 'Draft 📝';
        if (st === 'submitted') return isRtl ? 'مقدم ✉️' : 'Submitted ✉️';
        if (st === 'review') return isRtl ? 'قيد المراجعة ⏳' : 'Review ⏳';
        if (st === 'approved') return isRtl ? 'تمت الموافقة 🎉' : 'Approved 🎉';
        return isRtl ? 'مرفوض ✕' : 'Rejected ✕';
    };

    const handleDragStart = (e: React.DragEvent, app: VisaApp) => {
        e.dataTransfer.setData('appId', app.id);
    };

    const handleDrop = (e: React.DragEvent, targetStage: VisaApp['stage']) => {
        const appId = e.dataTransfer.getData('appId');
        const app = state.visaApps.find(a => a.id === appId);
        if (app) {
            const updated = state.visaApps.map(a => a.id === appId ? { ...a, stage: targetStage } : a);
            onUpdateVisaApps(updated);
        }
    };

    const handleCreateApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !destination.trim()) return;

        const nextIdNumber = state.visaApps.length > 0
            ? Math.max(...state.visaApps.map(v => parseInt(v.id.split('-')[1] || '3000'))) + 1
            : 3001;

        const newApp: VisaApp = {
            id: `VA-${nextIdNumber}`,
            customer: customerName.trim(),
            dest: destination.trim(),
            stage: initialStage,
            docs: totalDocs,
            received: receivedDocs
        };

        onUpdateVisaApps([...state.visaApps, newApp]);
        setShowAddModal(false);
        setCustomerName('');
        setDestination('');
        setTotalDocs(5);
        setReceivedDocs(0);
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">{t('visa_t')}</h1>
                    <p className="page-desc">{t('visa_s')}</p>
                </div>
                <button className="btn primary" onClick={() => setShowAddModal(true)}>
                    {isRtl ? '+ إضافة ملف فيزا' : '+ Add Visa Application'}
                </button>
            </div>

            {/* Kanban columns */}
            <div className="kanban five-col" style={{ gap: '12px', alignItems: 'start' }}>
                {stages.map(stage => {
                    const appsInStage = state.visaApps.filter(a => a.stage === stage);
                    return (
                        <div 
                            key={stage}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDrop(e, stage)}
                            style={{
                                backgroundColor: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '12px',
                                minHeight: '350px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}
                        >
                            <h4 style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'var(--text)',
                                borderBottom: '2px solid var(--border)',
                                paddingBottom: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{getStageName(stage)}</span>
                                <span style={{ fontSize: '11px', backgroundColor: 'var(--border)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '10px' }}>
                                    {appsInStage.length}
                                </span>
                            </h4>

                            {appsInStage.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '11.5px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
                                    {isRtl ? 'اسحب الملفات هنا' : 'Drop apps here'}
                                </div>
                            ) : (
                                appsInStage.map(app => {
                                    const progressPercent = Math.min(100, Math.round((app.received / app.docs) * 100)) || 0;
                                    return (
                                        <div
                                            key={app.id}
                                            draggable
                                            onDragStart={e => handleDragStart(e, app)}
                                            className="kcard"
                                            style={{
                                                padding: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                borderRight: isRtl ? `4px solid ${stage === 'approved' ? 'var(--success)' : stage === 'rejected' ? 'var(--danger)' : 'var(--gold-600)'}` : 'none',
                                                borderLeft: !isRtl ? `4px solid ${stage === 'approved' ? 'var(--success)' : stage === 'rejected' ? 'var(--danger)' : 'var(--gold-600)'}` : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                <span>{app.id}</span>
                                                <span>✈️ {app.dest}</span>
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginTop: '2px' }}>
                                                {app.customer}
                                            </div>

                                            {/* Document checklist progression */}
                                            <div style={{ marginTop: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                                    <span>📂 {isRtl ? 'المستندات:' : 'Docs:'} {app.received}/{app.docs}</span>
                                                    <span>{progressPercent}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--gold-600)', transition: 'width 0.3s' }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add visa dialog */}
            {showAddModal && (
                <div className="overlay open" onClick={() => setShowAddModal(false)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <form onSubmit={handleCreateApp} className="card" onClick={e => e.stopPropagation()} style={{ width: '400px', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                            {isRtl ? 'تسجيل طلب فيزا جديد' : 'Register New Visa Application'}
                        </h3>

                        <div className="field">
                            <label>{isRtl ? 'اسم العميل بالكامل *' : 'Full Client Name *'}</label>
                            <input 
                                required
                                value={customerName} 
                                onChange={e => setCustomerName(e.target.value)} 
                                placeholder={isRtl ? 'مثال: أحمد المصري...' : 'E.g. Ahmed Masry...'}
                            />
                        </div>

                        <div className="field">
                            <label>{isRtl ? 'الوجهة / نوع التأشيرة *' : 'Destination / Visa Type *'}</label>
                            <input 
                                required
                                value={destination} 
                                onChange={e => setDestination(e.target.value)} 
                                placeholder={isRtl ? 'مثال: شنغن — فرنسا، أمريكا سياحة...' : 'E.g. USA Tourist, UK Business...'}
                            />
                        </div>

                        <div className="form-2col">
                            <div className="field">
                                <label>{isRtl ? 'إجمالي الأوراق المطلوبة' : 'Total Required Docs'}</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    value={totalDocs} 
                                    onChange={e => setTotalDocs(parseInt(e.target.value) || 1)} 
                                />
                            </div>
                            <div className="field">
                                <label>{isRtl ? 'الأوراق المستلمة' : 'Received Docs'}</label>
                                <input 
                                    type="number" 
                                    min={0} 
                                    max={totalDocs}
                                    value={receivedDocs} 
                                    onChange={e => setReceivedDocs(parseInt(e.target.value) || 0)} 
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label>{isRtl ? 'مرحلة البداية' : 'Initial Stage'}</label>
                            <select value={initialStage} onChange={e => setInitialStage(e.target.value as any)}>
                                <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                                <option value="submitted">{isRtl ? 'تم التقديم' : 'Submitted'}</option>
                                <option value="review">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
                                {t('close')}
                            </button>
                            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
                                {isRtl ? 'إضافة للوحة المتابعة' : 'Add to Pipeline'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
