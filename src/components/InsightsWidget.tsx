import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Task, ServiceRequest } from '../types';

interface InsightsWidgetProps {
    tasks: Task[];
    requests: ServiceRequest[];
}

export default function InsightsWidget({ tasks, requests }: InsightsWidgetProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/dashboard-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tasks, requests })
                });
                const data = await response.json();
                setSummary(data.summary);
            } catch (error) {
                console.error('Failed to load insights:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [tasks, requests]);

    return (
        <div className="card p-4 bg-gold-50 border-gold-200">
            <div className="flex items-center gap-2 mb-2 font-bold text-gold-800">
                <Sparkles size={18} />
                <span>AI Insights</span>
            </div>
            {loading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-gold-600" />
                </div>
            ) : (
                <p className="text-sm text-gray-700">{summary || 'No insights available.'}</p>
            )}
        </div>
    );
}
