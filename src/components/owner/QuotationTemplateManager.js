import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, FileText, Loader2, Star } from 'lucide-react';
import { getOwnerTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/lib/quotationService';
import QuotationEditorModal from './QuotationEditorModal';

export default function QuotationTemplateManager({ user }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const loadTemplates = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const data = await getOwnerTemplates(user.uid);
            setTemplates(data);
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [user?.uid]);

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        setDeletingId(id);
        try {
            await deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            alert("Failed to delete template: " + error.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSaveTemplate = async (formData) => {
        if (editingTemplate?.id) {
            await updateTemplate(editingTemplate.id, user.uid, formData);
        } else {
            await createTemplate(user.uid, formData);
        }
        await loadTemplates();
    };

    const handleSetDefault = async (template) => {
        try {
            // Update UI optimistically
            setTemplates(templates.map(t => ({ ...t, is_default: t.id === template.id })));
            await updateTemplate(template.id, user.uid, { ...template, is_default: true });
            // Optionally reload to ensure sync
            // await loadTemplates();
        } catch (error) {
            alert("Failed to set default: " + error.message);
            await loadTemplates(); // Revert on failure
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quotation Templates</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage your default templates to send proposals faster.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" /> Create Template
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                    <p className="text-sm font-bold">Loading templates...</p>
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No templates found</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Create a reusable quotation template so you don't have to fill in standard terms and charges repeatedly.</p>
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                    >
                        Create Your First Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className={`bg-white border ${template.is_default ? 'border-blue-500 shadow-blue-100' : 'border-slate-200'} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}>
                            {template.is_default && (
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-white" /> Default
                                </div>
                            )}
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{template.template_name}</h3>
                                        <p className="text-xs text-slate-500">Updated {template.updated_at ? new Date(template.updated_at.seconds * 1000).toLocaleDateString() : 'recently'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleEdit(template)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                {!template.is_default && (
                                    <button
                                        onClick={() => handleSetDefault(template)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition-colors"
                                    >
                                        <Star className="w-3.5 h-3.5" /> Set Default
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    disabled={deletingId === template.id}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deletingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditorOpen && (
                <QuotationEditorModal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    initialData={editingTemplate || {}}
                    mode="template"
                    onSaveTemplate={handleSaveTemplate}
                />
            )}
        </div>
    );
}
