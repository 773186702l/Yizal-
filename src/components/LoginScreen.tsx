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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
        setErrorMessage(null);
        setLoading(true);

        const userInput = usernameInput.trim().toLowerCase();
        const email = userInput.includes('@') ? userInput : `${userInput}@yazal-erp.com`;

        try {
            // 0. Check configuration
            const { isSupabaseConfigured } = await import('../lib/supabase');
            if (!isSupabaseConfigured()) {
                const configErr = isRtl 
                    ? "لم يتم تهيئة Supabase بشكل صحيح. يرجى التأكد من إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في الإعدادات." 
                    : "Supabase is not configured correctly. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in settings.";
                throw new Error(configErr);
            }

            // 1. Authenticate with Supabase
            let authData = null;
            let authError = null;

            try {
                const result = await supabase.auth.signInWithPassword({
                    email,
                    password: passwordInput,
                });
                authData = result.data;
                authError = result.error;
            } catch (fetchErr: any) {
                console.warn('Supabase Auth call threw an error:', fetchErr);
                authError = fetchErr;
            }

            // Fallback to server-side login if direct attempt fails or returns a network error
            const isNetworkError = authError && (
                authError.message === 'Failed to fetch' || 
                authError.message?.includes('Network') ||
                authError.name === 'TypeError' ||
                authError.code === 'CONFIG_MISSING' ||
                !authError.status // Supabase errors usually have a status if they reached the server
            );

            if (authError && isNetworkError) {
                console.warn('Direct login likely failed due to network or config, trying server-side proxy...');
                try {
                    const proxyResponse = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password: passwordInput })
                    });
                    
                    if (proxyResponse.ok) {
                        const data = await proxyResponse.json();
                        console.log('Server-side login proxy success');
                        authError = null;
                        if (data.session) {
                            try {
                                // We try to set the session locally, but if network blocks the verification call,
                                // we can still proceed because the app state will hold the user profile 
                                // and all data fetching is proxied through the server.
                                await supabase.auth.setSession(data.session);
                                console.log('Session set locally');
                            } catch (sErr: any) {
                                console.warn('Caught error during setSession, ignoring since we have session data from proxy:', sErr);
                            }
                        }
                    } else {
                        const errData = await proxyResponse.json();
                        // If proxy also returns an error, use the most descriptive one
                        authError = new Error(errData.error || 'Login failed via proxy');
                    }
                } catch (proxyErr: any) {
                    console.error('Login proxy also failed:', proxyErr);
                    // authError remains the original error
                }
            }

            if (authError) {
                console.error('Supabase Auth Error:', authError);
                
                // Handle specific common errors
                if (authError.message === 'Failed to fetch' || authError.message?.includes('proxy')) {
                    const errorMsg = isRtl 
                        ? "فشل الاتصال بالخادم. يرجى التأكد من اتصالك بالإنترنت ومن أن مشروع Supabase نشط في الإعدادات." 
                        : "Network error: Failed to reach server. Please ensure your internet connection is stable and Supabase is active.";
                    throw new Error(errorMsg);
                }
                
                // Handle credential errors
                if (authError.message === 'Invalid login credentials') {
                    throw new Error(isRtl ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password");
                }

                throw authError;
            }

            // 2. Find matching user profile in state
            // Normalize inputs for matching
            const normalizedInput = usernameInput.trim().toLowerCase();
            const matchedUser = state.usersList.find(u => u.username.trim().toLowerCase() === normalizedInput);

            if (!matchedUser) {
                // Fallback to accounts array in data.ts if state hasn't synced yet
                const fallbackUser = accounts.find(u => u.username.trim().toLowerCase() === normalizedInput);
                if (fallbackUser) {
                    onLogin(fallbackUser);
                    return;
                }
                throw new Error(isRtl ? "لم يتم العثور على ملف المستخدم في النظام" : "User profile not found in system records");
            }

            onLogin(matchedUser);
        } catch (err: any) {
            console.error('Login error details:', err);
            setError(true);
            setErrorMessage(err.message || String(err));
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
                            ⚠️ {errorMessage || t('login_err')}
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
