import { T } from '../data';
import { AppState } from '../types';
import { Menu, Moon, Sun, Bell } from 'lucide-react';

interface TopbarProps {
    state: AppState;
    onToggleLang: () => void;
    onToggleTheme: () => void;
    onToggleSidebar: () => void;
    onSearch: (term: string) => void;
}

export default function Topbar({ state, onToggleLang, onToggleTheme, onToggleSidebar, onSearch }: TopbarProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    return (
        <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                    className="menu-toggle icon-btn" 
                    onClick={onToggleSidebar}
                    style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'none', // Shown on mobile in CSS
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '38px'
                    }}
                >
                    <Menu size={18} />
                </button>
                <div className="search-box">
                    <span>⌕</span>
                    <input 
                        placeholder={isRtl ? 'بحث...' : 'Search...'} 
                        value={state.searchTerm || ''}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="top-actions">
                <button className="icon-btn" onClick={onToggleLang}>{state.lang === 'ar' ? 'EN' : 'AR'}</button>
                <button className="icon-btn" onClick={onToggleTheme}>
                    {state.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button className="icon-btn">
                    <Bell size={16} />
                    <span className="dot" />
                </button>
                <div className="avatar" style={{ textTransform: 'uppercase' }}>{state.user?.name[0]}</div>
            </div>
        </div>
    );
}
