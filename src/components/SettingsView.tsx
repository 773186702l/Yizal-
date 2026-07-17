import React from 'react';
import { AppState } from '../types';
import { T } from '../data';

interface SettingsViewProps {
    state: AppState;
}

export default function SettingsView({ state }: SettingsViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">{isRtl ? 'الإعدادات' : 'Settings'}</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card" style={{ padding: '20px' }}>
                    <h3 className="text-lg font-bold mb-4">{isRtl ? 'تفضيلات النظام' : 'System Preferences'}</h3>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>{isRtl ? 'اللغة' : 'Language'}</span>
                        <button className="btn secondary" onClick={() => {
                            // Implement language toggle here if needed, but App.tsx has it
                        }}>
                            {isRtl ? 'English' : 'العربية'}
                        </button>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span>{isRtl ? 'السمة' : 'Theme'}</span>
                        <button className="btn secondary">
                            {isRtl ? 'الوضع الليلي' : 'Dark Mode'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
