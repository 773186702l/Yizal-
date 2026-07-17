import React from 'react';
import { AppState } from '../types';
import { T } from '../data';

interface ReportsViewProps {
    state: AppState;
}

export default function ReportsView({ state }: ReportsViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">{isRtl ? 'التقارير' : 'Reports'}</h1>
            </div>
            <div className="card" style={{ padding: '20px' }}>
                <p>{isRtl ? 'تقارير الأداء والبيانات المالية' : 'Performance reports and financial data.'}</p>
                {/* Add reports content here */}
            </div>
        </div>
    );
}
