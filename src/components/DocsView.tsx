import React, { useState } from 'react';
import { AppState } from '../types';
import { T } from '../data';
import { Search, Filter, Upload, FileText, X, Trash, Folder, Download, CheckSquare, Square } from 'lucide-react';

interface DocsViewProps {
    state: AppState;
}

interface Document {
    id: string;
    name: string;
    type: 'Passport' | 'Visa' | 'Contract' | 'Other';
    date: string;
    client: string;
}

export default function DocsView({ state }: DocsViewProps) {
    const isRtl = state.lang === 'ar';
    const t = (k: string) => T[state.lang][k] || k;
    
    const [docs, setDocs] = useState<Document[]>([
        { id: '1', name: 'جواز سفر محمد.pdf', type: 'Passport', date: '2026-07-15', client: 'محمد' },
        { id: '2', name: 'عقد شركة.docx', type: 'Contract', date: '2026-07-16', client: 'شركة أ' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [uploading, setUploading] = useState(false);
    const [categorizing, setCategorizing] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

    const filteredDocs = docs.filter(doc => 
        (filterType === 'All' || doc.type === filterType) &&
        (doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleSelect = (id: string) => {
        setSelectedDocIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        setSelectedDocIds(prev => prev.length === filteredDocs.length ? [] : filteredDocs.map(d => d.id));
    };

    const handleDelete = () => {
        setDocs(prev => prev.filter(d => !selectedDocIds.includes(d.id)));
        setSelectedDocIds([]);
    };

    const onDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('docId', id);
    };

    const onDrop = (e: React.DragEvent, targetType: string) => {
        const id = e.dataTransfer.getData('docId');
        setDocs(prev => prev.map(d => d.id === id ? { ...d, type: targetType as any } : d));
    };

    const handleUpload = () => {
        setUploading(true);
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress >= 100) {
                clearInterval(interval);
                setUploading(false);
            }
        }, 200);
    };

    const handleAutoSort = async () => {
        setCategorizing(true);
        try {
            const response = await fetch('/api/categorize-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: docs })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.categorizedDocs) {
                const updatedDocs = docs.map(doc => {
                    const updated = data.categorizedDocs.find((d: any) => d.id === doc.id);
                    return updated ? { ...doc, type: updated.type, client: updated.client } : doc;
                });
                setDocs(updatedDocs);
            }
        } catch (error) {
            console.error('Failed to categorize:', error);
        } finally {
            setCategorizing(false);
        }
    };

    return (
        <div className="view">
            <div className="page-head" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">{isRtl ? 'المستندات' : 'Documents'}</h1>
                <div className="flex gap-2">
                    <button className="btn secondary" onClick={handleAutoSort} disabled={categorizing}>
                        {categorizing ? (isRtl ? 'جاري الترتيب...' : 'Sorting...') : (isRtl ? 'ترتيب ذكي' : 'AI Auto-Sort')}
                    </button>
                    <button className="btn primary flex items-center gap-2" onClick={handleUpload}>
                        {uploading ? <div className="spinner" /> : <Upload size={16} />}
                        {isRtl ? (uploading ? 'جاري الرفع...' : 'رفع ملف') : (uploading ? 'Uploading...' : 'Upload File')}
                    </button>
                </div>
            </div>
            
            {uploading && (
                <div className="card mb-4 overflow-hidden">
                    <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-full bg-gold-500 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                    </div>
                </div>
            )}
            
            <div className="card mb-6" style={{ padding: '20px', display: 'flex', gap: '15px' }}>
                <div className="search-bar flex-1 flex items-center border rounded-md px-3 gap-2">
                    <Search size={18} className="text-gray-400" />
                    <input type="text" placeholder={isRtl ? 'بحث...' : 'Search...'} className="w-full p-2 outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-bar flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select className="p-2 border rounded-md" onChange={(e) => setFilterType(e.target.value)}>
                        <option value="All">{isRtl ? 'الكل' : 'All'}</option>
                        <option value="Passport">{isRtl ? 'جوازات' : 'Passports'}</option>
                        <option value="Visa">{isRtl ? 'تأشيرات' : 'Visas'}</option>
                        <option value="Contract">{isRtl ? 'عقود' : 'Contracts'}</option>
                    </select>
                </div>
            </div>

            {selectedDocIds.length > 0 && (
                <div className="card mb-6 flex items-center justify-between p-4 bg-gray-50 border-gold-300">
                    <span>{isRtl ? `تم تحديد ${selectedDocIds.length} مستند` : `${selectedDocIds.length} documents selected`}</span>
                    <div className="flex gap-2">
                        <button className="btn secondary flex items-center gap-2" onClick={() => console.log('Download', selectedDocIds)}><Download size={16}/> {isRtl ? 'تحميل' : 'Download'}</button>
                        <button className="btn secondary flex items-center gap-2" onClick={() => console.log('Move', selectedDocIds)}><Folder size={16}/> {isRtl ? 'نقل' : 'Move'}</button>
                        <button className="btn danger flex items-center gap-2" onClick={handleDelete}><Trash size={16}/> {isRtl ? 'حذف' : 'Delete'}</button>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: isRtl ? 'right' : 'left' }}>
                            <th style={{ padding: '10px' }} onClick={toggleSelectAll} className="cursor-pointer">
                                {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? <CheckSquare size={18}/> : <Square size={18}/>}
                            </th>
                            <th style={{ padding: '10px' }}>{isRtl ? 'اسم الملف' : 'File Name'}</th>
                            <th style={{ padding: '10px' }}>{isRtl ? 'النوع' : 'Type'}</th>
                            <th style={{ padding: '10px' }}>{isRtl ? 'التاريخ' : 'Date'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocs.map(doc => (
                            <tr 
                                key={doc.id} 
                                draggable
                                onDragStart={(e) => onDragStart(e, doc.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, doc.type)}
                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: selectedDocIds.includes(doc.id) ? 'var(--gold-50)' : 'transparent' }} 
                                onClick={() => setSelectedDoc(doc)}
                            >
                                <td style={{ padding: '10px' }} onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}>
                                    {selectedDocIds.includes(doc.id) ? <CheckSquare size={18} className="text-gold-600"/> : <Square size={18}/>}
                                </td>
                                <td style={{ padding: '10px' }}>{doc.name}</td>
                                <td style={{ padding: '10px' }}>{doc.type}</td>
                                <td style={{ padding: '10px' }}>{doc.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Document Preview Drawer */}
            <div className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${selectedDoc ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSelectedDoc(null)}>
                <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg p-6 transform transition-transform duration-300 ${selectedDoc ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 gap-4">
                        <h2 className="text-xl font-bold break-words flex-1">{selectedDoc?.name}</h2>
                        <X size={24} className="cursor-pointer flex-shrink-0" onClick={() => setSelectedDoc(null)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <p className="text-sm text-gray-500">{isRtl ? 'العميل' : 'Client'}</p>
                            <p className="font-semibold">{selectedDoc?.client}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{isRtl ? 'النوع' : 'Type'}</p>
                            <p className="font-semibold">{selectedDoc?.type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{isRtl ? 'التاريخ' : 'Date'}</p>
                            <p className="font-semibold">{selectedDoc?.date}</p>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-4">
                        <div className="flex gap-4">
                            <button className="btn primary flex-1">{isRtl ? 'تحميل' : 'Download'}</button>
                            <button className="btn secondary flex-1">{isRtl ? 'مشاركة' : 'Share'}</button>
                        </div>
                        <button className="btn secondary w-full" onClick={() => console.log('Export PDF', selectedDoc?.id)}>{isRtl ? 'تصدير PDF' : 'Export to PDF'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
