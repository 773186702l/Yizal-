import React, { useState } from 'react';
import { AppState, User } from '../types';
import { T } from '../data';
import { ShieldAlert, UserPlus, Key, Shield, Eye, Trash2, Search, Sparkles } from 'lucide-react';

interface UsersViewProps {
    state: AppState & { usersList: User[] };
    onUpdateUsers: (users: User[]) => void;
}

export default function UsersView({ state, onUpdateUsers }: UsersViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    // Search query for team members
    const [searchQuery, setSearchQuery] = useState('');

    // Form inputs for creating a user
    const [showAddModal, setShowAddModal] = useState(false);
    const [fullname, setFullname] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'accountant' | 'sales' | 'executor'>('sales');

    // Password generator tool
    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%';
        let pwd = '';
        for (let i = 0; i < 8; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pwd);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullname.trim() || !username.trim() || !password.trim()) return;

        // Check if username already exists (case-insensitive)
        if (state.usersList.some(u => u.username.trim().toLowerCase() === username.trim().toLowerCase())) {
            alert(isRtl ? 'اسم المستخدم هذا مستخدم بالفعل من قبل موظف آخر!' : 'This username is already taken!');
            return;
        }

        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, username, password, role })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create user');
            }

            const newUser: User = {
                name: fullname.trim(),
                username: username.trim().toLowerCase(),
                password: password.trim(),
                role
            };

            onUpdateUsers([...state.usersList, newUser]);
            setShowAddModal(false);
            setFullname('');
            setUsername('');
            setPassword('');
            setRole('sales');
            
            alert(isRtl ? 'تم إنشاء حساب الموظف الجديد وصلاحياته بنجاح!' : 'New user profile and permissions created successfully!');
        } catch (error: any) {
            console.error('Create user error:', error);
            alert(isRtl ? `خطأ في إنشاء المستخدم: ${error.message}` : `Error creating user: ${error.message}`);
        }
    };

    const handleDeleteUser = async (usr: User) => {
        if (usr.username === 'admin') {
            alert(isRtl ? 'لا يمكن حذف الحساب الإداري الرئيسي للنظام!' : 'The root admin account cannot be deleted!');
            return;
        }

        if (usr.username === state.user?.username) {
            alert(isRtl ? 'لا يمكنك حذف حسابك أثناء تسجيل الدخول به!' : 'You cannot delete your own account while logged in!');
            return;
        }

        const confirmMsg = isRtl 
            ? `هل أنت متأكد من تعطيل وحذف حساب الموظف: ${usr.name}؟ لن يتمكن من تسجيل الدخول بعد الآن.` 
            : `Are you sure you want to revoke and delete the account of: ${usr.name}? They will no longer be able to log in.`;

        if (window.confirm(confirmMsg)) {
            try {
                const response = await fetch('/api/admin/delete-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usr.username, uid: usr.uid })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to delete user');
                }

                const updated = state.usersList.filter(u => u.username !== usr.username);
                onUpdateUsers(updated);
                
                alert(isRtl ? 'تم حذف حساب الموظف وإلغاء صلاحياته بنجاح.' : 'Employee account deleted and permissions revoked successfully.');
            } catch (error: any) {
                console.error('Delete user error:', error);
                alert(isRtl ? `خطأ في حذف المستخدم: ${error.message}` : `Error deleting user: ${error.message}`);
            }
        }
    };

    // Filter employees based on search query
    const filteredUsers = state.usersList.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="view">
            {/* Header section with clean visual layout */}
            <div className="page-head" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>♛</span>
                        <span>{t('users_t')}</span>
                    </h1>
                    <p className="page-desc">{t('users_s')}</p>
                </div>
                {state.user?.role === 'admin' && (
                    <button className="btn primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={16} />
                        <span>{t('add_user')}</span>
                    </button>
                )}
            </div>

            {/* Standard alert banner for role permissions */}
            <div className="card" style={{ 
                padding: '16px 20px', 
                marginBottom: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                background: 'var(--surface-2)', 
                borderLeft: isRtl ? 'none' : '4px solid var(--gold-600)',
                borderRight: isRtl ? '4px solid var(--gold-600)' : 'none',
                borderRadius: '12px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--warn-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-600)',
                    flexShrink: 0
                }}>
                    <ShieldAlert size={20} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    <strong style={{ color: 'var(--text)' }}>{isRtl ? 'مبدأ الصلاحيات والوصول المقيد:' : 'Role-Based Access Control (RBAC):'}</strong>{' '}
                    {isRtl 
                        ? 'تعتمد شاشات النظام بالكامل على نظرية الصلاحيات المقيدة. مبيعات لا يرى الحسابات المتقدمة، والمعقب لا يرى أسعار السفر والتحصيلات، والمدير يملك تحكماً كاملاً.' 
                        : 'Yazal runs strictly on a Role-Based Access hierarchy. Sales representatives are restricted from accessing accountant ledgers; operators only clear operational tasks.'}
                </div>
            </div>

            {/* Toolbar search & metrics */}
            <div className="card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: '260px', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        placeholder={isRtl ? 'ابحث باسم الموظف أو اسم المستخدم...' : 'Search by name or username...'} 
                        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '13px' }}
                    />
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {isRtl ? `إجمالي الموظفين النشطين: ${state.usersList.length}` : `Total active team profiles: ${state.usersList.length}`}
                </div>
            </div>

            {/* User List Table card */}
            <div className="card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
                <table style={{ minWidth: '800px', width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{isRtl ? 'اسم الموظف' : 'Employee Name'}</th>
                            <th>{isRtl ? 'اسم المستخدم للدخول' : 'Username'}</th>
                            <th>{isRtl ? 'رمز المرور الحالي' : 'Active Passkey'}</th>
                            <th>{isRtl ? 'الدور الوظيفي' : 'System Role'}</th>
                            <th>{isRtl ? 'حالة الصلاحيات' : 'Role Stamp'}</th>
                            {state.user?.role === 'admin' && <th style={{ textAlign: 'center' }}>{isRtl ? 'إجراءات' : 'Actions'}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={state.user?.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    {isRtl ? 'لا يوجد نتائج تطابق بحثك.' : 'No matching staff profiles found.'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(usr => (
                                <tr key={usr.username} className="row">
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--gold-100)',
                                                color: 'var(--gold-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                {usr.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{usr.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {usr.username === state.user?.username ? (isRtl ? 'حسابك الحالي' : 'Your active session') : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="font-mono" style={{ color: 'var(--gold-600)', fontWeight: 600 }}>
                                        {usr.username}
                                    </td>
                                    <td className="font-mono">
                                        <span style={{ color: 'var(--text-muted)' }}>••••••••</span>{' '}
                                        <span style={{ fontSize: '12px', color: 'var(--text)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                            {usr.password}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                                            {t('role_' + usr.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`stamp ${usr.role === 'admin' ? 'danger' : usr.role === 'accountant' ? 'info' : usr.role === 'sales' ? 'warn' : 'success'}`} style={{ transform: 'none' }}>
                                            {usr.role.toUpperCase()}
                                        </span>
                                    </td>
                                    {state.user?.role === 'admin' && (
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleDeleteUser(usr)}
                                                disabled={usr.username === 'admin' || usr.username === state.user?.username}
                                                className="btn" 
                                                style={{ 
                                                    padding: '6px 10px', 
                                                    color: 'var(--danger)', 
                                                    borderColor: 'transparent',
                                                    background: 'transparent',
                                                    opacity: (usr.username === 'admin' || usr.username === state.user?.username) ? 0.3 : 1
                                                }}
                                                title={isRtl ? 'حذف الحساب' : 'Revoke access'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Form Modal */}
            {showAddModal && (
                <div className="overlay open" onClick={() => setShowAddModal(false)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <form onSubmit={handleCreateUser} className="card" onClick={e => e.stopPropagation()} style={{ width: '420px', padding: '28px', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gold-600)', color: 'var(--ink-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                +
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                                {t('add_user')}
                            </h3>
                        </div>

                        <div className="field" style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t('f_fullname')} *</label>
                            <input 
                                required
                                value={fullname} 
                                onChange={e => setFullname(e.target.value)} 
                                placeholder={isRtl ? 'مثال: فاطمة الزهراء...' : 'E.g. Fatima Zahra...'}
                                style={{ borderRadius: '8px', padding: '10px 12px' }}
                            />
                        </div>

                        <div className="field" style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t('f_username')} *</label>
                            <input 
                                required
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                placeholder="E.g. fatima_sales"
                                style={{ textTransform: 'lowercase', borderRadius: '8px', padding: '10px 12px' }}
                            />
                        </div>

                        <div className="field" style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t('f_password')} *</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    required
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder={isRtl ? 'ادخل رمز سري أو اضغط توليد...' : 'Passkey...'}
                                    style={{ borderRadius: '8px', padding: '10px 12px', flex: 1 }}
                                />
                                <button type="button" className="btn" onClick={generatePassword} style={{ fontSize: '12px', background: 'var(--surface-2)', whiteSpace: 'nowrap' }}>
                                    ⚡ {isRtl ? 'توليد عشوائي' : 'Auto Generate'}
                                </button>
                            </div>
                        </div>

                        <div className="field" style={{ marginBottom: '24px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t('f_role')} *</label>
                            <select 
                                value={role} 
                                onChange={e => setRole(e.target.value as any)}
                                style={{ borderRadius: '8px', padding: '10px 12px', background: 'var(--surface)' }}
                            >
                                <option value="sales">{t('role_sales')} (SALES)</option>
                                <option value="executor">{t('role_executor')} (EXECUTOR)</option>
                                <option value="accountant">{t('role_accountant')} (ACCOUNTANT)</option>
                                <option value="admin">{t('role_admin')} (ADMIN)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center', borderRadius: '10px' }} onClick={() => setShowAddModal(false)}>
                                {t('close')}
                            </button>
                            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center', borderRadius: '10px' }}>
                                {t('create_user_btn')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
