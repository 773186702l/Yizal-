import React, { useRef, useState } from 'react';
import { Plus, FileText, Users, ListChecks, Settings, LayoutDashboard, Camera, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { AppState, Customer, VisaApp, Invoice, Expense, ServiceRequest } from '../types';
import { T } from '../data';
import InsightsWidget from './InsightsWidget';

interface DashboardViewProps {
    state: AppState & {
        customers: Customer[];
        visaApps: VisaApp[];
        invoices: Invoice[];
        expenses: Expense[];
        serviceRequests: ServiceRequest[];
    };
    onNavigate: (view: string) => void;
}

export default function DashboardView({ state, onNavigate }: DashboardViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedDoc, setScannedDoc] = useState<{ client: string, type: string, date: string } | null>(null);

    const startScan = async () => {
        setIsScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setIsScanning(false);
        }
    };

    const stopScan = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsScanning(false);
    };

    const captureImage = async () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            const imageBase64 = canvasRef.current.toDataURL('image/jpeg');
            
            setIsProcessing(true);
            try {
                const response = await fetch('/api/ocr-scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64 })
                });
                const data = await response.json();
                console.log('OCR Result:', data);
                setScannedDoc({
                    client: data.client || '',
                    type: data.type || '',
                    date: data.date || ''
                });
                // In a real app, we'd navigate to the new document or show a confirmation modal
            } catch (error) {
                console.error('OCR failed:', error);
            } finally {
                setIsProcessing(false);
                stopScan();
            }
        }
    };

    // Derived statistics
    const totalCustomers = state.customers.length;
    const activeVisas = state.visaApps.filter(v => v.stage !== 'approved' && v.stage !== 'rejected').length;
    const totalInvoicesPaidSum = state.invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/,/g, '') || '0'), 0);
    const pendingApprovalsCount = state.serviceRequests.filter(req => req.status === 'pending_accountant').length;

    // Prepare chart data (Monthly Sales in thousands)
    const salesData = [
        { month: isRtl ? 'يناير' : 'Jan', val: 45, height: '45%' },
        { month: isRtl ? 'فبراير' : 'Feb', val: 62, height: '62%' },
        { month: isRtl ? 'مارس' : 'Mar', val: 85, height: '85%' },
        { month: isRtl ? 'أبريل' : 'Apr', val: 74, height: '74%' },
        { month: isRtl ? 'مايو' : 'May', val: 98, height: '98%' },
        { month: isRtl ? 'يونيو' : 'Jun', val: 115, height: '100%' },
    ];

    // Activity timeline feed
    const activities = [
        { text: isRtl ? 'تم تحديث حالة فيزا أحمد المصري إلى "مقدم"' : 'Ahmed El-Masry visa updated to "Submitted"', time: isRtl ? 'منذ 10 دقائق' : '10 mins ago', type: 'info', icon: Clock },
        { text: isRtl ? 'سجل المحاسب معاملة جديدة: إيجار المكتب بقيمة 3,000 EGP' : 'SARAH registered expense: Office rent 3,000 EGP', time: isRtl ? 'منذ ساعة' : '1 hour ago', type: 'danger', icon: AlertCircle },
        { text: isRtl ? 'أضاف خالد عمر عميلاً جديداً: ليلى حسن (المملكة العربية السعودية)' : 'KHALID added customer: Leila Hassan (KSA)', time: isRtl ? 'منذ ساعتين' : '2 hours ago', type: 'success', icon: CheckCircle },
        { text: isRtl ? 'تم تحصيل دفعة فاتورة INV-0231 بقيمة 5,400 SAR' : 'Payment received for INV-0231: 5,400 SAR', time: isRtl ? 'منذ يوم' : '1 day ago', type: 'success', icon: CheckCircle },
    ];

    const quickActions = [
        { label: isRtl ? 'طلب جديد' : 'New Request', icon: Plus, view: 'newreq' },
        { label: isRtl ? 'الفواتير' : 'Invoices', icon: FileText, view: 'invoices' },
        { label: isRtl ? 'العملاء' : 'Customers', icon: Users, view: 'customers' },
        { label: isRtl ? 'المهام' : 'Tasks', icon: ListChecks, view: 'tasks' },
    ];

    return (
        <div className="view relative min-h-screen">
            <div className="page-head" style={{ marginBottom: '52px' }}>
                <div>
                    <h1 className="page-title">{t('dash_title')}</h1>
                    <p className="page-desc">{t('dash_sub')}</p>
                </div>
            </div>

            {/* Quick KPI Cards Grid */}
            <div className="kpi-grid grid" style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '52px' }}>
                <div className="card kpi" style={{ borderInlineStart: '4px solid var(--gold-600)', padding: '20px' }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>{t('kpi_customers')}</div>
                    <div className="val" style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-disp)' }}>{totalCustomers}</div>
                </div>

                <div className="card kpi" style={{ borderInlineStart: '4px solid var(--info)', padding: '20px' }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>{t('kpi_visa')}</div>
                    <div className="val" style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-disp)' }}>{activeVisas}</div>
                </div>

                <div className="card kpi" style={{ borderInlineStart: '4px solid var(--success)', padding: '20px' }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>{t('kpi_revenue')}</div>
                    <div className="val" style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-disp)' }}>
                        {totalInvoicesPaidSum.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>SAR</span>
                    </div>
                </div>

                <div className="card kpi" style={{ borderInlineStart: '4px solid var(--danger)', padding: '20px' }}>
                    <div className="lbl" style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>{t('kpi_pending')}</div>
                    <div className="val" style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-disp)' }}>{pendingApprovalsCount}</div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
                {quickActions.map(action => (
                    <button 
                        key={action.view}
                        onClick={() => onNavigate(action.view)}
                        className="card flex flex-col items-center justify-center p-4 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] cursor-pointer gap-2 border border-gray-200 dark:border-slate-700"
                    >
                        <action.icon size={22} className="text-gold-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Interactive Presentation Layout */}
            <div className="two-col grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
                <InsightsWidget tasks={state.tasks} requests={state.serviceRequests} />
            </div>

            <div className="two-col grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
                
                {/* Activity Feed Card */}
                <div className="card feed transition-all duration-300 hover:shadow-lg hover:border-gold-200" style={{ padding: '24px', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔔</span>
                        <span>{t('feed_t')}</span>
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activities.map((act, idx) => (
                            <div key={idx} className="feed-item" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: 'var(--surface-2)', borderRadius: '8px' }}>
                                <act.icon size={20} className={act.type === 'success' ? 'text-green-500' : act.type === 'danger' ? 'text-red-500' : 'text-blue-500'} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div className="feed-text" style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                                        {act.text}
                                    </div>
                                    <div className="feed-time" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {act.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Sales Monthly Chart Card */}
                <div className="card chart-wrap transition-all duration-300 hover:shadow-lg hover:border-gold-200" style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
                    <div className="chart-title" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📈 {t('chart_t')}</span>
                    </div>
                    
                    {/* Elegant custom bar graphics */}
                    <div className="bars" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '10px', borderBottom: '1px solid var(--border)' }}>
                        {salesData.map((data, idx) => (
                            <div key={idx} className="bar-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                                    {data.val}K
                                </div>
                                <div className="bar transition-all duration-500 hover:opacity-80" style={{
                                    width: '32px',
                                    height: `calc(${data.height} * 1.2)`,
                                    borderRadius: '6px 6px 0 0',
                                    background: 'linear-gradient(180deg, var(--gold-500), var(--gold-600))'
                                }} />
                                <div className="m" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {data.month}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Scan Button */}
            <button 
                className={`fixed bottom-8 right-8 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40 ${
                    state.theme === 'dark' 
                    ? 'bg-white text-slate-900 hover:bg-gray-100' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={startScan}
            >
                <Camera size={28} />
            </button>

            {/* Camera Overlay */}
            {isScanning && (
                <div className="fixed inset-0 bg-black flex flex-col z-50">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-white text-xl">Quick Scan</h2>
                        <button className="text-white" onClick={stopScan}><X size={28} /></button>
                    </div>
                    <video ref={videoRef} autoPlay playsInline className="flex-1 w-full object-cover" />
                    <button 
                        className={`bg-gold-600 text-white p-6 rounded-full mx-auto my-8 ${isProcessing ? 'opacity-50 cursor-wait' : ''}`} 
                        onClick={captureImage}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <div className="spinner" /> : <Camera size={32} />}
                    </button>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {/* OCR Confirmation Modal */}
            {scannedDoc && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">{isRtl ? 'تأكيد البيانات' : 'Confirm Data'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{isRtl ? 'العميل' : 'Client'}</label>
                                <input className="w-full border p-2 rounded" value={scannedDoc.client} onChange={(e) => setScannedDoc({...scannedDoc, client: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{isRtl ? 'النوع' : 'Type'}</label>
                                <input className="w-full border p-2 rounded" value={scannedDoc.type} onChange={(e) => setScannedDoc({...scannedDoc, type: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{isRtl ? 'التاريخ' : 'Date'}</label>
                                <input className="w-full border p-2 rounded" value={scannedDoc.date} onChange={(e) => setScannedDoc({...scannedDoc, date: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button className="btn secondary" onClick={() => setScannedDoc(null)}>{isRtl ? 'إلغاء' : 'Cancel'}</button>
                            <button className="btn primary" onClick={() => { console.log('Saving:', scannedDoc); setScannedDoc(null); }}>{isRtl ? 'حفظ' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

