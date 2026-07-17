import { useState } from 'react';
import { Task, AppState, Tag } from '../types';
import KanbanBoard from './KanbanBoard';
import AddTaskModal from './AddTaskModal';
import { T } from '../data';
import { Trash2, CheckCircle2, XSquare, Download } from 'lucide-react';

interface TasksViewProps {
    state: AppState;
    onUpdateState: (newState: Partial<AppState>) => void;
}

export default function TasksView({ state, onUpdateState }: TasksViewProps) {
    const [showModal, setShowModal] = useState(false);
    const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    
    const tasks = state.tasks || [];
    const customTags = state.customTags || [];
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;

    const handleUpdateTask = (updatedTask: Task) => {
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        onUpdateState({ tasks: newTasks });
    };

    const handleAddTask = (task: Task) => {
        const newTasks = [task, ...tasks];
        onUpdateState({ tasks: newTasks });
    };

    const handleAddTag = (tag: Tag) => {
        const newTags = [...customTags, tag];
        onUpdateState({ customTags: newTags });
    };

    // Filter tasks based on active tag filter
    const filteredTasks = activeFilterTag
        ? tasks.filter(t => t.tags && t.tags.includes(activeFilterTag))
        : tasks;

    const toggleSelect = (id: string) => {
        setSelectedTaskIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedTaskIds.length === filteredTasks.length) {
            setSelectedTaskIds([]);
        } else {
            setSelectedTaskIds(filteredTasks.map(t => t.id));
        }
    };

    const handleBulkDelete = () => {
        if (confirm(isRtl ? `هل أنت متأكد من حذف ${selectedTaskIds.length} مهمة؟` : `Delete ${selectedTaskIds.length} tasks?`)) {
            const newTasks = tasks.filter(t => !selectedTaskIds.includes(t.id));
            onUpdateState({ tasks: newTasks });
            setSelectedTaskIds([]);
        }
    };

    const handleBulkStatusChange = (status: Task['status']) => {
        const newTasks = tasks.map(t => 
            selectedTaskIds.includes(t.id) ? { ...t, status } : t
        );
        onUpdateState({ tasks: newTasks });
        setSelectedTaskIds([]);
    };

    const handleExportCSV = () => {
        const tasksToExport = filteredTasks;
        if (tasksToExport.length === 0) return;

        const headers = ['Title', 'Status', 'Priority', 'Tags', 'Created At'];
        const rows = tasksToExport.map(t => [
            `"${t.title.replace(/"/g, '""')}"`,
            t.status,
            t.priority,
            `"${(t.tags || []).join(', ')}"`,
            new Date(t.id).toLocaleDateString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Entirely empty state (no tasks at all in system)
    if (tasks.length === 0) {
        return (
            <div className="placeholder" style={{ padding: '60px 20px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <img 
                    src="/src/assets/images/no_tasks_illustration_1784140111853.jpg" 
                    alt="No tasks" 
                    referrerPolicy="no-referrer" 
                    style={{ maxWidth: '280px', borderRadius: '14px', marginBottom: '24px', boxShadow: 'var(--shadow)' }} 
                />
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                    {isRtl ? 'أنت على أتم استعداد! لا توجد مهام اليوم' : 'All caught up! No tasks for today'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '20px', maxWidth: '360px', lineHeight: '1.5' }}>
                    {isRtl ? 'تم الانتهاء من جميع المهام المعينة. اضغط أدناه لإضافة معاملة جديدة وتخطيط جدولك.' : 'All assigned tasks are completed. Tap below to create a new request and organize your schedule.'}
                </p>
                <button className="btn primary" onClick={() => setShowModal(true)}>
                    {isRtl ? '+ إضافة مهمة جديدة' : '+ Add New Task'}
                </button>
                {showModal && (
                    <AddTaskModal 
                        state={state} 
                        onAdd={handleAddTask} 
                        onClose={() => setShowModal(false)} 
                        onAddTag={handleAddTag}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="view">
            <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <div className="page-title">{isRtl ? 'مهامي والوسوم' : 'My Tasks & Tags'}</div>
                    <div className="page-desc">{isRtl ? 'تتبع سير معاملات العملاء وقم بفرزها بذكاء' : 'Track and categorize customer transactions with colored tags'}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className="btn" 
                        onClick={handleExportCSV}
                        style={{ 
                            backgroundColor: 'transparent', 
                            color: 'var(--text)', 
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px'
                        }}
                    >
                        <Download size={18} />
                        {isRtl ? 'تصدير CSV' : 'Export CSV'}
                    </button>
                    <button className="btn primary" onClick={() => setShowModal(true)}>
                        {isRtl ? '+ إضافة مهمة جديدة' : '+ Add New Task'}
                    </button>
                </div>
            </div>

            {/* Bulk Action Header */}
            {selectedTaskIds.length > 0 && (
                <div style={{
                    backgroundColor: 'var(--ink-900)',
                    color: '#F3E4C8',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideDown 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                            type="checkbox" 
                            checked={selectedTaskIds.length === filteredTasks.length}
                            onChange={toggleSelectAll}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>
                            {isRtl ? `${selectedTaskIds.length} مهام محددة` : `${selectedTaskIds.length} tasks selected`}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn" 
                            onClick={() => handleBulkStatusChange('completed')}
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <CheckCircle2 size={14} />
                            {isRtl ? 'إكمال الكل' : 'Complete All'}
                        </button>
                        <button 
                            className="btn" 
                            onClick={() => handleBulkStatusChange('todo')}
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <XSquare size={14} />
                            {isRtl ? 'إعادة تعيين' : 'Reset status'}
                        </button>
                        <button 
                            className="btn" 
                            onClick={handleBulkDelete}
                            style={{ backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Trash2 size={14} />
                            {isRtl ? 'حذف المحدد' : 'Delete Selected'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tags Filtering Section */}
            <div style={{ 
                backgroundColor: 'var(--surface)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px', 
                boxShadow: 'var(--shadow)' 
            }}>
                <div style={{ 
                    fontSize: '12.5px', 
                    fontWeight: 600, 
                    color: 'var(--text-muted)', 
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span>🔍</span>
                    <span>{t('tag_filter')}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {/* All Tags filter */}
                    <button
                        onClick={() => setActiveFilterTag(null)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid var(--border)',
                            backgroundColor: activeFilterTag === null ? 'var(--ink-900)' : 'var(--surface-2)',
                            color: activeFilterTag === null ? '#F3E4C8' : 'var(--text)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('tag_all')}
                    </button>

                    {/* Individual tag filters */}
                    {customTags.map(tag => {
                        const isActive = activeFilterTag === tag.name;
                        return (
                            <button
                                key={tag.name}
                                onClick={() => setActiveFilterTag(isActive ? null : tag.name)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: `1.5px solid ${tag.color}`,
                                    backgroundColor: isActive ? tag.color : 'transparent',
                                    color: isActive ? '#FFFFFF' : 'var(--text)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    transform: isActive ? 'scale(1.05)' : 'none'
                                }}
                            >
                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? '#FFFFFF' : tag.color }} />
                                {tag.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Kanban Board with filtered tasks */}
            {filteredTasks.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>📁</div>
                    <div>
                        {isRtl 
                            ? 'لا توجد مهام تطابق هذا الوسم المحدد.' 
                            : 'No tasks found matching this selected tag.'}
                    </div>
                    <button 
                        className="btn" 
                        onClick={() => setActiveFilterTag(null)} 
                        style={{ marginTop: '12px', fontSize: '12.5px' }}
                    >
                        {isRtl ? 'عرض جميع المهام' : 'Show All Tasks'}
                    </button>
                </div>
            ) : (
                <KanbanBoard 
                    state={state} 
                    tasks={filteredTasks} 
                    onUpdateTask={handleUpdateTask} 
                    selectedTaskIds={selectedTaskIds}
                    onToggleSelect={toggleSelect}
                />
            )}

            {showModal && (
                <AddTaskModal 
                    state={state} 
                    onAdd={handleAddTask} 
                    onClose={() => setShowModal(false)} 
                    onAddTag={handleAddTag}
                />
            )}
        </div>
    );
}
