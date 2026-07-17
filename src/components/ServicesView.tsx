import React, { useState } from 'react';
import { AppState } from '../types';
import { T } from '../data';

interface ServicesViewProps {
    state: AppState & { serviceTypes: string[] };
    onUpdateServiceTypes: (types: string[]) => void;
}

export default function ServicesView({ state, onUpdateServiceTypes }: ServicesViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    const [newService, setNewService] = useState('');
    const [statuses, setStatuses] = useState<Record<string, 'available' | 'maintenance'>>({});

    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newService.trim()) return;

        if (state.serviceTypes.includes(newService.trim())) {
            alert(isRtl ? 'هذه الخدمة مضافة بالفعل في النظام مسبقاً!' : 'This service is already configured!');
            return;
        }

        onUpdateServiceTypes([...state.serviceTypes, newService.trim()]);
        setNewService('');
        alert(isRtl ? 'تمت إضافة فئة الخدمة الجديدة بنجاح للمبيعات!' : 'New service category appended successfully!');
    };

    const handleRemoveService = (srv: string) => {
        if (state.serviceTypes.length <= 1) {
            alert(isRtl ? 'لا يمكن تفريغ الخدمات بالكامل، يجب الإبقاء على خدمة واحدة على الأقل.' : 'Must leave at least one active service.');
            return;
        }
        if (confirm(isRtl ? `هل أنت متأكد من تعطيل/حذف خدمة: ${srv}؟` : `Disable service: ${srv}?`)) {
            onUpdateServiceTypes(state.serviceTypes.filter(s => s !== srv));
        }
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">{t('services_t')}</h1>
                    <p className="page-desc">{t('services_s')}</p>
                </div>
            </div>

            <div className="grid two-col" style={{ gap: '20px' }}>
                
                {/* Add Service form */}
                <form onSubmit={handleAddService} className="card" style={{ padding: '20px', alignSelf: 'start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                        ➕ {t('add_service')}
                    </h3>
                    
                    <div className="field">
                        <label>{isRtl ? 'اسم الخدمة باللغة العربية أو الإنجليزية *' : 'Service Name (Arabic or English) *'}</label>
                        <input 
                            required
                            value={newService} 
                            onChange={e => setNewService(e.target.value)} 
                            placeholder={t('service_ph')} 
                        />
                    </div>

                    <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                        💾 {isRtl ? 'تفعيل فئة الخدمة' : 'Enable Service Category'}
                    </button>
                </form>

                {/* Services lists */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                        📋 {isRtl ? 'فئات الخدمات المفعلة حالياً' : 'Currently Active Service Offerings'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {state.serviceTypes.map(srv => (
                            <div key={srv} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 14px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                fontSize: '13.5px'
                            }}>
                                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                    ✨ {srv}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        padding: '2px 8px', 
                                        borderRadius: '12px', 
                                        background: statuses[srv] === 'maintenance' ? 'var(--warn-bg)' : 'var(--success-bg)',
                                        color: statuses[srv] === 'maintenance' ? 'var(--warn)' : 'var(--success)',
                                        fontWeight: 600 
                                    }}>
                                        {statuses[srv] === 'maintenance' ? (isRtl ? 'قيد الصيانة' : 'Maintenance') : (isRtl ? 'متاح' : 'Available')}
                                    </span>
                                    <button 
                                        onClick={() => setStatuses(prev => ({ ...prev, [srv]: prev[srv] === 'maintenance' ? 'available' : 'maintenance' }))}
                                        style={{
                                            fontSize: '10px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isRtl ? 'تغيير' : 'Toggle'}
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveService(srv)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--danger)',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            padding: '4px 8px'
                                        }}
                                    >
                                        ✕ {isRtl ? 'حذف' : 'Remove'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
