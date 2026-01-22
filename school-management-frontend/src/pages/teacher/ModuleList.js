import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import ModuleBuilder from '../../components/teacher/ModuleBuilder';
import ModuleCard from '../../components/teacher/ModuleCard';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const ModuleList = ({ courseId }) => {
    const { get, del, put } = useApi();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);

    useEffect(() => {
        fetchModules();
    }, [courseId]);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const response = await get(`/api/teacher/courses/${courseId}/modules/`);
            setModules((response || []).sort((a, b) => a.order - b.order));
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setLoading(false);
        }
    };

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
            await del(`/api/teacher/modules/${module.id}/`);
            fetchModules();
        } catch (error) {
            console.error('Error deleting module:', error);
            alert('Failed to delete module');
        }
    };

    const handleTogglePublish = async (module) => {
        try {
            await put(`/api/teacher/modules/${module.id}/`, {
                ...module,
                is_published: !module.is_published
            });
            fetchModules();
        } catch (error) {
            console.error('Error toggling publish status:', error);
            alert('Failed to update module');
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

        // Update order for all modules
        const updates = modules.map((module, index) => ({
            id: module.id,
            order: index + 1
        }));

        try {
            await put(`/api/teacher/courses/${courseId}/modules/reorder/`, { modules: updates });
            fetchModules();
        } catch (error) {
            console.error('Error reordering modules:', error);
            alert('Failed to reorder modules');
            fetchModules(); // Revert to server state
        } finally {
            setDraggedItem(null);
        }
    };

    if (loading) {
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
                    <h2 className="text-2xl font-bold text-gray-900">Course Modules</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Organize your course content into modules
                    </p>
                </div>
                <button
                    onClick={handleCreateModule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Module</span>
                </button>
            </div>

            {/* Empty State */}
            {modules.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <BookOpenIcon className="h-16 w-16 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules yet</h3>
                    <p className="text-gray-600 mb-6">
                        Create your first module to start organizing your course content
                    </p>
                    <button
                        onClick={handleCreateModule}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Create Your First Module
                    </button>
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
                            className={`cursor-move transition-opacity ${draggedItem === index ? 'opacity-50' : 'opacity-100'
                                }`}
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
        </div>
    );
};

export default ModuleList;
