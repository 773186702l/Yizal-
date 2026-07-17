import { T, navItems, PERMS } from '../data';
import { AppState } from '../types';
import { 
    LayoutDashboard, 
    Users, 
    PlusCircle, 
    CheckSquare, 
    ListTodo, 
    Plane, 
    FileText, 
    Briefcase, 
    GitMerge, 
    Shield, 
    Settings2, 
    Folder, 
    BarChart3, 
    Settings, 
    LogOut,
    X
} from 'lucide-react';

interface SidebarProps {
    state: AppState;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

// Map nav item IDs to Lucide React icons
const iconMap: Record<string, any> = {
    dashboard: LayoutDashboard,
    customers: Users,
    newreq: PlusCircle,
    approvals: CheckSquare,
    tasks: ListTodo,
    visa: Plane,
    invoices: FileText,
    accounting: Briefcase,
    workflow: GitMerge,
    users: Shield,
    services: Settings2,
    docs: Folder,
    reports: BarChart3,
    settings: Settings,
};

export default function Sidebar({ state, onNavigate, onLogout, isOpen, onClose }: SidebarProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    const userRole = state.user?.role || 'sales';
    const userPerms = PERMS[userRole] || [];

    // Filter navItems so that they only see permitted modules
    const visibleItems = navItems.filter(n => userPerms.includes(n.id));

    const handleItemClick = (id: string) => {
        onNavigate(id);
        onClose(); // Auto close on mobile click
    };

    return (
        <>
            {/* Dark blur overlay for mobile */}
            {isOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(8, 15, 28, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 45
                    }}
                />
            )}

            <aside 
                className={`sidebar ${isOpen ? 'mobile-open' : ''}`} 
                id="sidebar"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: state.lang === 'ar' ? '1px solid var(--border)' : 'none',
                    borderRight: state.lang === 'en' ? '1px solid var(--border)' : 'none',
                }}
            >
                <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="brand-mark">Y</div>
                        <div>
                            <div className="brand-name">{state.lang === 'ar' ? 'تطبيق يزل' : 'Yazal App'}</div>
                            <div className="brand-sub">{state.lang === 'ar' ? 'نظام الإدارة المتكامل' : 'Integrated Management System'}</div>
                        </div>
                    </div>
                    {/* Close button for mobile sidebar */}
                    <button 
                        className="menu-toggle" 
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#CFC8B4',
                            cursor: 'pointer',
                            display: 'none', // Shown on mobile in CSS
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {state.user && (
                    <div className="who-card" style={{ marginBottom: '16px' }}>
                        <div className="who-avatar" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                            {state.user.name[0]}
                        </div>
                        <div>
                            <div className="who-name" style={{ fontSize: '13px', fontWeight: 600 }}>{state.user.name}</div>
                            <div className="who-role" style={{ fontSize: '11px', color: 'var(--gold-500)', fontWeight: 500 }}>
                                {t('role_' + state.user.role)}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
                    {visibleItems.map(n => {
                        const IconComponent = iconMap[n.id] || Folder;
                        const isActive = state.view === n.id;
                        return (
                            <div 
                                key={n.id} 
                                className={`nav-item ${isActive ? 'active' : ''}`} 
                                onClick={() => handleItemClick(n.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    borderLeft: state.lang === 'en' && isActive ? '3px solid var(--gold-500)' : '3px solid transparent',
                                    borderRight: state.lang === 'ar' && isActive ? '3px solid var(--gold-500)' : '3px solid transparent',
                                }}
                            >
                                <IconComponent size={16} className="ic" />
                                <span style={{ fontSize: '13px' }}>{t(n.key)}</span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#A9A08A' }}>
                        <span>{isRtl ? 'استخدام التخزين' : 'Storage'}</span>
                        <span>75%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', background: 'var(--gold-500)', borderRadius: '2px', width: '75%' }}></div>
                    </div>
                </div>

                <div 
                    className="logout-btn" 
                    onClick={onLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#A9A08A',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#A9A08A'}
                >
                    <LogOut size={16} />
                    <span>{t('logout')}</span>
                </div>
            </aside>
        </>
    );
}
