import React, { useState } from 'react';
import { Task, AppState, Tag } from '../types';
import { T } from '../data';

interface AddTaskModalProps {
    state: AppState;
    onAdd: (task: Task) => void;
    onClose: () => void;
    onAddTag: (tag: Tag) => void;
}

const PRESET_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export default function AddTaskModal({ state, onAdd, onClose, onAddTag }: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    // Tag management state
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

    const t = (k: string) => T[state.lang][k] || k;
    const isRtl = state.lang === 'ar';

    const handleAIsuggest = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/suggest-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });
            const data = await res.json();
            if (data.priority) setPriority(data.priority);
        } catch (err) {
            console.error('AI Suggest failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        
        // Prevent duplicate tag names
        const existingTags = state.customTags || [];
        if (existingTags.some(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase())) {
            return;
        }

        const newTag: Tag = {
            name: newTagName.trim(),
            color: newTagColor,
        };

        onAddTag(newTag);
        setSelectedTags([...selectedTags, newTag.name]);
        setNewTagName('');
    };

    const toggleTagSelection = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            setSelectedTags(selectedTags.filter(name => name !== tagName));
        } else {
            setSelectedTags([...selectedTags, tagName]);
        }
    };

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd({
            id: Math.random().toString(36).substring(2, 9),
            title: title.trim(),
            description: description.trim(),
            priority,
            dueDate,
            status: 'todo',
            tags: selectedTags,
        });
        onClose();
    };

    const customTagsList = state.customTags || [];

    return (
        <div className="overlay open" onClick={onClose} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="card" style={{ width: '480px', maxWidth: '95vw', padding: '26px', backgroundColor: 'var(--surface)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div className="drawer-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '18px' }}>
                        {isRtl ? 'إضافة مهمة جديدة' : 'Add New Task'}
                    </div>
                    <div className="drawer-close" onClick={onClose}>✕</div>
                </div>

                {/* Task Form Fields */}
                <div className="field">
                    <label>{isRtl ? 'العنوان' : 'Title'} *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder={isRtl ? 'أدخل عنوان المهمة...' : 'Enter task title...'} />
                </div>

                <div className="field">
                    <label>{isRtl ? 'الوصف' : 'Description'}</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={isRtl ? 'أدخل وصف المهمة...' : 'Enter task description...'} style={{ minHeight: '80px', resize: 'vertical' }} />
                </div>

                <div className="form-2col" style={{ marginBottom: '14px' }}>
                    <div className="field">
                        <label>{isRtl ? 'الأولوية' : 'Priority'}</label>
                        <select value={priority} onChange={e => setPriority(e.target.value as any)}>
                            <option value="low">{isRtl ? 'منخفض' : 'Low'}</option>
                            <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
                            <option value="high">{isRtl ? 'مرتفع' : 'High'}</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                </div>

                {/* Custom Tag Management & Selection */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text)' }}>
                        {t('tags_title')}
                    </div>
                    
                    {/* Render Tags Selection Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                        {customTagsList.map(tag => {
                            const isSelected = selectedTags.includes(tag.name);
                            return (
                                <button
                                    key={tag.name}
                                    type="button"
                                    onClick={() => toggleTagSelection(tag.name)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '5px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        border: `2px solid ${tag.color}`,
                                        backgroundColor: isSelected ? tag.color : 'transparent',
                                        color: isSelected ? '#FFFFFF' : 'var(--text)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        transform: isSelected ? 'scale(1.05)' : 'none'
                                    }}
                                >
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isSelected ? '#FFFFFF' : tag.color }} />
                                    {tag.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tag Creator Subsection */}
                    <div style={{ backgroundColor: 'var(--surface-2)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
                            {t('tag_create')}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                placeholder={t('tag_name_ph')}
                                style={{ flex: '1', minWidth: '120px', padding: '8px 10px', fontSize: '12.5px' }}
                            />
                            
                            {/* Color Selector */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewTagColor(color)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            border: newTagColor === color ? '2px solid var(--text)' : '1px solid transparent',
                                            cursor: 'pointer',
                                            padding: 0,
                                            transform: newTagColor === color ? 'scale(1.15)' : 'none',
                                            transition: 'all 0.15s'
                                        }}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                className="btn primary"
                                onClick={handleCreateTag}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                                {t('tag_add_btn')}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <button 
                        type="button"
                        className="btn" 
                        onClick={handleAIsuggest} 
                        disabled={loading || !title.trim()} 
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        {loading ? (isRtl ? 'جاري الاقتراح...' : 'Suggesting...') : (isRtl ? 'اقتراح ذكي ✨' : 'AI Suggest ✨')}
                    </button>
                    <button 
                        type="button"
                        className="btn primary" 
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        {isRtl ? 'حفظ المهمة' : 'Save Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
