import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import ModuleBuilder from '../../components/teacher/ModuleBuilder';
import ModuleCard from '../../components/teacher/ModuleCard';
import { BookOpenIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const GenericModal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#18216D] uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-300 hover:text-red-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-10 text-center">
                    {children}
                </div>
                {footer && (
                    <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

const ModuleList = ({ courseId }) => {
    const { get, post, del, put } = useApi();
    const { showToast } = useAppState();
    const [modules, setModules] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [showSyncModal, setShowSyncModal] = useState(false);

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const [modResponse, courseResponse] = await Promise.all([
                get(`/teachers/api/courses/${courseId}/modules/`),
                get(`/teachers/api/courses/${courseId}/`)
            ]);
            setModules((modResponse || []).sort((a, b) => a.order - b.order));
            setCourse(courseResponse);
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId, get]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    const handleCreateModule = () => {
        setEditingModule(null);
        setShowBuilder(true);
    };

    const handleEditModule = (module) => {
        setEditingModule(module);
        setShowBuilder(true);
    };

    const handleDeleteModule = async (module) => {
        if (!window.confirm(`Are you sure you want to delete "${module.title}"?`)) {
            return;
        }

        try {
            await del(`/teachers/api/modules/${module.id}/`);
            fetchModules();
        } catch (error) {
            console.error('Error deleting module:', error);
            showToast('Failed to delete module', 'error');
        }
    };

    const handleTogglePublish = async (module) => {
        try {
            await put(`/teachers/api/modules/${module.id}/`, {
                ...module,
                is_published: !module.is_published
            });
            fetchModules();
        } catch (error) {
            console.error('Error toggling publish status:', error);
            showToast('Failed to update module', 'error');
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const newModules = [...modules];
        const draggedModule = newModules[draggedItem];
        newModules.splice(draggedItem, 1);
        newModules.splice(index, 0, draggedModule);

        setModules(newModules);
        setDraggedItem(index);
    };

    const handleDragEnd = async () => {
        if (draggedItem === null) return;

        const updates = modules.map((module, index) => ({
            id: module.id,
            order: index + 1
        }));

        try {
            await put(`/teachers/api/courses/${courseId}/modules/reorder/`, { modules: updates });
            fetchModules();
        } catch (error) {
            console.error('Error reordering modules:', error);
            showToast('Failed to reorder modules', 'error');
            fetchModules();
        } finally {
            setDraggedItem(null);
        }
    };

    const handleSyncRegistry = async () => {
        setShowSyncModal(false);

        try {
            setLoading(true);
            const res = await post(`/teachers/api/courses/${courseId}/sync-from-registry/`);
            showToast(res.message || 'Registry synchronization complete');
            fetchModules();
        } catch (error) {
            console.error('Error syncing:', error);
            showToast(error.response?.data?.error || 'Failed to sync with registry', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !course) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Curriculum Strands</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                        Organize your learning area into major thematic strands
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSyncModal(true)}
                        className="px-5 py-2.5 bg-[#FFC425]/10 text-[#18216D] rounded-xl hover:bg-[#FFC425]/20 transition-all font-black flex items-center space-x-2 border border-[#FFC425]/20"
                        title="Import strands from national registry"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        <span className="uppercase tracking-widest text-[10px]">Import Registry</span>
                    </button>
                    <button
                        onClick={handleCreateModule}
                        className="px-5 py-2.5 bg-[#18216D] text-white rounded-xl hover:bg-[#0D164F] transition-all font-black shadow-lg shadow-indigo-900/20 flex items-center space-x-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="uppercase tracking-widest text-[10px]">Create Strand</span>
                    </button>
                </div>
            </div>

            {/* Content List */}
            {modules.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <div className="flex justify-center mb-6">
                        <BookOpenIcon className="h-16 w-16 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Strands Yet</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium italic">
                        The national registry has strands predefined for this subject. Use 'Import Registry' to pull official strands, or create your first strand manually.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setShowSyncModal(true)}
                            className="px-8 py-3 bg-[#18216D] text-white rounded-xl hover:bg-[#0D164F] transition-all font-black shadow-lg shadow-indigo-900/20 uppercase tracking-widest text-xs"
                        >
                            Import from Registry
                        </button>
                        <button
                            onClick={handleCreateModule}
                            className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-xs"
                        >
                            Create Manually
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {modules.map((module, index) => (
                        <div
                            key={module.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`cursor-move transition-opacity ${draggedItem === index ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <ModuleCard
                                module={module}
                                onEdit={handleEditModule}
                                onDelete={handleDeleteModule}
                                onTogglePublish={handleTogglePublish}
                                onRefresh={fetchModules}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Module Builder Modal */}
            {showBuilder && (
                <ModuleBuilder
                    courseId={courseId}
                    module={editingModule}
                    onClose={() => {
                        setShowBuilder(false);
                        setEditingModule(null);
                    }}
                    onSave={fetchModules}
                />
            )}
            {/* Registry Sync Confirmation Modal */}
            <GenericModal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                title="Synchronize Registry"
                footer={(
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowSyncModal(false)}
                            className="px-6 py-3 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSyncRegistry}
                            className="px-8 py-3 bg-[#18216D] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0D164F] transition-all shadow-lg shadow-indigo-900/20"
                        >
                            Begin Import
                        </button>
                    </div>
                )}
            >
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-[#FFC425]/10 rounded-full flex items-center justify-center mb-6">
                        <ArrowPathIcon className="w-10 h-10 text-[#FFC425]" />
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        This operation will automatically import all official <span className="text-[#18216D] font-black underline decoration-[#FFC425] decoration-2 underline-offset-4">strands and sub-strands</span> from the national curriculum registry into your workspace.
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">
                        Duplicates will be skipped automatically
                    </p>
                </div>
            </GenericModal>
        </div>
    );
};

export default ModuleList;
