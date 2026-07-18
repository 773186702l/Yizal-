import React, { useState } from 'react';
import { Task, AppState } from '../types';
import { MessageSquare, User as UserIcon } from 'lucide-react';
import { sendWhatsAppMessage, formatTaskMessage } from '../lib/whatsapp';

interface KanbanBoardProps {
    state: AppState;
    tasks: Task[];
    onUpdateTask: (task: Task) => void;
    selectedTaskIds: string[];
    onToggleSelect: (id: string) => void;
}

export default function KanbanBoard({ state, tasks, onUpdateTask, selectedTaskIds, onToggleSelect }: KanbanBoardProps) {
    const isRtl = state.lang === 'ar';
    const tagMap = new Map((state.customTags || []).map(t => [t.name, t.color]));
    
    // State for task-specific customer selection
    const [sharingTask, setSharingTask] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        e.dataTransfer.setData('taskId', task.id);
    };

    const handleDrop = (e: React.DragEvent, status: Task['status']) => {
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            onUpdateTask({ ...task, status });
        }
    };

    const toggleComplete = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const newStatus: Task['status'] = task.status === 'completed' ? 'todo' : 'completed';
        onUpdateTask({ ...task, status: newStatus });
    };

    const columns: Task['status'][] = ['todo', 'in-progress', 'completed'];

    const getColumnName = (col: Task['status']) => {
        if (col === 'todo') return isRtl ? 'بانتظار البدء' : 'To Do';
        if (col === 'in-progress') return isRtl ? 'قيد التنفيذ' : 'In Progress';
        return isRtl ? 'مكتمل' : 'Completed';
    };

    return (
        <div className="kanban" style={{ gap: '16px', marginTop: '20px' }}>
            {columns.map(status => (
                <div 
                    key={status} 
                    className="kanban-col"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, status)}
                    style={{
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    <h4 style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        borderBottom: '2px solid var(--border)',
                        paddingBottom: '8px',
                        marginBottom: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>{getColumnName(status)}</span>
                        <span style={{
                            fontSize: '11px',
                            backgroundColor: 'var(--border)',
                            color: 'var(--text-muted)',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontWeight: 600
                        }}>
                            {tasks.filter(t => t.status === status).length}
                        </span>
                    </h4>

                    {tasks.filter(t => t.status === status).map(task => (
                        <div 
                            key={task.id} 
                            className="kcard"
                            draggable
                            onDragStart={e => handleDragStart(e, task)}
                            style={{
                                borderLeft: isRtl ? 'none' : `4px solid ${task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warn)' : 'var(--success)'}`,
                                borderRight: isRtl ? `4px solid ${task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warn)' : 'var(--success)'}` : 'none',
                                transition: 'all 0.2s',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                position: 'relative',
                                outline: selectedTaskIds.includes(task.id) ? '2px solid var(--gold-600)' : 'none',
                                backgroundColor: selectedTaskIds.includes(task.id) ? 'var(--gold-50)' : 'var(--surface)'
                            }}
                        >
                            {/* Bulk selection checkbox */}
                            <div style={{ position: 'absolute', top: '8px', right: isRtl ? 'auto' : '8px', left: isRtl ? '8px' : 'auto', zIndex: 5 }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedTaskIds.includes(task.id)}
                                    onChange={() => onToggleSelect(task.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                {/* Checkbox component with satisfying completion animation */}
                                <button 
                                    onClick={(e) => toggleComplete(e, task)}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: '2px solid var(--border)',
                                        borderColor: task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)',
                                        backgroundColor: task.status === 'completed' ? 'var(--success)' : 'transparent',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        padding: 0,
                                        marginTop: '2px',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    {task.status === 'completed' && <span style={{ animation: 'check-anim 0.2s' }}>✓</span>}
                                </button>

                                <div style={{ flex: 1 }}>
                                    <div className="nm" style={{ 
                                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        transition: 'all 0.25s ease'
                                    }}>
                                        {task.title}
                                    </div>
                                    {task.description && (
                                        <div className="sub" style={{ 
                                            fontSize: '12px', 
                                            color: 'var(--text-muted)', 
                                            marginTop: '4px',
                                            textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                        }}>
                                            {task.description}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tags list container */}
                            {task.tags && task.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                    {task.tags.map(tName => {
                                        const color = tagMap.get(tName) || '#6B7280';
                                        return (
                                            <span 
                                                key={tName} 
                                                style={{
                                                    backgroundColor: `${color}15`,
                                                    color: color,
                                                    border: `1px solid ${color}`,
                                                    borderRadius: '12px',
                                                    padding: '2px 8px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
                                                {tName}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Priority Badge and Due Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                <span className={`stamp ${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warn' : 'success'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                    {task.priority === 'high' ? (isRtl ? 'مرتفع' : 'High') : task.priority === 'medium' ? (isRtl ? 'متوسط' : 'Medium') : (isRtl ? 'منخفض' : 'Low')}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        className="btn-icon" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSharingTask(sharingTask === task.id ? null : task.id);
                                        }}
                                        style={{ padding: '4px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '4px' }}
                                        title={isRtl ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
                                    >
                                        <MessageSquare size={12} />
                                    </button>
                                    {task.dueDate && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            📅 {task.dueDate}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Inline Customer Picker for WhatsApp Sharing */}
                            {sharingTask === task.id && (
                                <div style={{ 
                                    marginTop: '8px', 
                                    padding: '8px', 
                                    backgroundColor: 'var(--surface-2)', 
                                    borderRadius: '8px',
                                    border: '1px solid var(--gold-600)',
                                    zIndex: 10
                                }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
                                        {isRtl ? 'اختر العميل للإرسال:' : 'Select Customer to Send:'}
                                    </div>
                                    <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {state.customers.map(customer => (
                                            <button 
                                                key={customer.code}
                                                className="btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const msg = formatTaskMessage(task, state.lang);
                                                    sendWhatsAppMessage(customer.phone, msg);
                                                    setSharingTask(null);
                                                }}
                                                style={{ 
                                                    padding: '4px 8px', 
                                                    fontSize: '11px', 
                                                    justifyContent: 'flex-start',
                                                    textAlign: isRtl ? 'right' : 'left',
                                                    width: '100%'
                                                }}
                                            >
                                                <UserIcon size={12} style={{ marginRight: isRtl ? 0 : '6px', marginLeft: isRtl ? '6px' : 0 }} />
                                                {customer.name}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        className="btn" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSharingTask(null);
                                        }}
                                        style={{ marginTop: '6px', width: '100%', justifyContent: 'center', fontSize: '10px', padding: '2px' }}
                                    >
                                        {isRtl ? 'إلغاء' : 'Cancel'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
