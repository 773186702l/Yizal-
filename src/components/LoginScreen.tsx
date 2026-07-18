import React, { useState } from 'react';
import { T, accounts } from '../data';
import { AppState, User } from '../types';
import { Shield, User as UserIcon, Lock, Eye, EyeOff, Globe, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
    onLogin: (user: User) => void;
    state: AppState;
    onToggleLang: () => void;
}

export default function LoginScreen({ onLogin, state, onToggleLang }: LoginScreenProps) {
    const [usernameInput, setUsernameInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
        setLoading(true);

        const email = `${usernameInput.trim().toLowerCase()}@yazal-erp.com`;

        try {
            // 1. Authenticate with Supabase
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password: passwordInput,
            });

            if (authError) throw authError;

            // 2. Find matching user profile in state
            const matchedUser = state.usersList.find(u => u.username.trim().toLowerCase() === usernameInput.trim().toLowerCase());

            if (!matchedUser) {
                const fallbackUser = accounts.find(u => u.username.trim().toLowerCase() === usernameInput.trim().toLowerCase());
                if (fallbackUser) {
                    onLogin(fallbackUser);
                    return;
                }
                throw new Error("User profile not found");
            }

            onLogin(matchedUser);
        } catch (err: any) {
            console.error('Login error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at 50% 50%, var(--ink-800) 0%, var(--ink-900) 100%)',
            padding: '24px',
            position: 'relative',
            overflowY: 'auto'
        }}>
            {/* Elegant Language switcher at top right/left */}
            <div style={{
                position: 'absolute',
                top: '24px',
                right: isRtl ? 'auto' : '24px',
                left: isRtl ? '24px' : 'auto',
                display: 'flex',
                gap: '8px'
            }}>
                <button 
                    onClick={onToggleLang}
                    className="btn" 
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F3E4C8',
                        borderRadius: '10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Globe size={14} />
                    <span>{isRtl ? 'English' : 'العربية'}</span>
                </button>
            </div>

            {/* Glass Login Card */}
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow), 0 20px 40px rgba(0,0,0,0.15)',
                borderRadius: '20px',
                padding: '36px 32px',
                animation: 'fade 0.4s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Brand Header */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--gold-500) 0%, var(--gold-600) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(37,99,235,0.2)'
                    }}>
                        <Shield size={24} color="#FFFFFF" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: 'var(--text)',
                            fontFamily: 'var(--font-disp)',
                            letterSpacing: '-0.02em',
                            marginTop: '8px'
                        }}>
                            {isRtl ? 'تطبيق يزل للمبيعات والعمليات' : 'Yazal Sales & Operations'}
                        </h2>
                        <p style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            marginTop: '4px'
                        }}>
                            {isRtl ? 'تسجيل دخول موظفي تطبيق يزل للخدمات' : 'Login page for Yazal Staff & Agents'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="field" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            <UserIcon size={14} />
                            <span>{t('login_user')}</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                required
                                value={usernameInput} 
                                onChange={e => setUsernameInput(e.target.value)} 
                                placeholder={isRtl ? 'مثال: fatima_sales' : 'e.g. fatima_sales'} 
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    paddingLeft: isRtl ? '14px' : '14px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface-2)',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    <div className="field" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            <Lock size={14} />
                            <span>{t('login_pass')}</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                required
                                type={showPassword ? 'text' : 'password'} 
                                value={passwordInput} 
                                onChange={e => setPasswordInput(e.target.value)} 
                                placeholder="••••••••" 
                                style={{
                                    width: '100%',
                                    padding: '12px 42px 12px 14px',
                                    paddingInlineEnd: '42px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface-2)',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    insetInlineEnd: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            borderLeft: '4px solid var(--danger)',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            lineHeight: '1.4'
                        }}>
                            ⚠️ {t('login_err')}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn primary" 
                        style={{
                            width: '100%', 
                            justifyContent: 'center',
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '8px',
                            boxShadow: '0 4px 12px rgba(14,27,46,0.15)'
                        }}
                    >
                        {loading ? (
                            <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(243,228,200,0.3)',
                                borderTop: '2px solid #F3E4C8',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        ) : (
                            <span>{t('login_btn')}</span>
                        )}
                    </button>
                </form>
            </div>

            {/* Footer Credits */}
            <div style={{ marginTop: '20px', fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-disp)' }}>
                {isRtl ? 'نظام يزل لإدارة موارد المؤسسات الموحد v2.1' : 'Unified Yazal ERP Travel Portal System v2.1'}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
