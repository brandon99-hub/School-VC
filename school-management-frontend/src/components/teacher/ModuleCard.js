import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import LessonEditor from './LessonEditor';
import LessonCard from './LessonCard';
import {
    ArchiveBoxIcon,
    PlusIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const ModuleCard = ({ module, onEdit, onDelete, onTogglePublish, onRefresh }) => {
    const { del, put } = useApi();
    const { showToast } = useAppState();
    const [showLessons, setShowLessons] = useState(false);
    const [showLessonEditor, setShowLessonEditor] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);

    const handleAddLesson = () => {
        setEditingLesson(null);
        setShowLessonEditor(true);
    };

    const handleEditLesson = (lesson) => {
        setEditingLesson(lesson);
        setShowLessonEditor(true);
    };

    const handleDeleteLesson = async (lesson) => {
        if (!window.confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
            return;
        }

        try {
            await del(`/teachers/api/lessons/${lesson.id}/`);
            onRefresh();
            showToast('Lesson deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting lesson:', error);
            showToast('Failed to delete lesson', 'error');
        }
    };

    const handleToggleLessonPublish = async (lesson) => {
        try {
            await put(`/teachers/api/lessons/${lesson.id}/`, {
                ...lesson,
                is_published: !lesson.is_published
            });
            onRefresh();
            showToast(`Sub-strand ${lesson.is_published ? 'unpublished' : 'published'} successfully!`, 'success');
        } catch (error) {
            console.error('Error toggling lesson publish status:', error);
            showToast('Failed to update sub-strand status. Please try again.', 'error');
        }
    };

    const handleManageContent = (lesson) => {
        // Content management is now handled via LessonCard or other triggers
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <button
                                onClick={() => setShowLessons(!showLessons)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ChevronRightIcon
                                    className={`w-5 h-5 text-gray-400 transform transition-transform ${showLessons ? 'rotate-90' : ''}`}
                                />
                            </button>
                            <div className="w-10 h-10 bg-[#18216D]/5 rounded-lg flex items-center justify-center">
                                <ArchiveBoxIcon className="h-6 w-6 text-[#18216D]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                            {!module.is_published && (
                                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                                    Draft
                                </span>
                            )}
                        </div>
                        {module.description && (
                            <p className="text-sm text-gray-500 mb-4 ml-12 leading-relaxed">{module.description}</p>
                        )}
                        <div className="flex items-center space-x-6 text-[11px] font-bold text-gray-400 ml-12 uppercase tracking-tight">
                            <span className="flex items-center"><span className="w-1.5 h-1.5 bg-gray-200 rounded-full mr-2"></span>Order: {module.order}</span>
                            {module.release_date && (
                                <span className="flex items-center"><span className="w-1.5 h-1.5 bg-gray-200 rounded-full mr-2"></span>Release: {new Date(module.release_date).toLocaleDateString()}</span>
                            )}
                            <span className="flex items-center text-[#18216D]"><span className="w-1.5 h-1.5 bg-[#18216D] rounded-full mr-2"></span>{module.lessons?.length || 0} Sub-strand{module.lessons?.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Module Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                        <button
                            onClick={() => onTogglePublish(module)}
                            className={`p-2.5 rounded-xl transition-all ${module.is_published
                                ? 'text-green-600 bg-green-50 shadow-sm'
                                : 'text-gray-400 bg-gray-50'
                                }`}
                            title={module.is_published ? 'Visible to students' : 'Private Draft'}
                        >
                            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onEdit(module)}
                            className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
                            title="Edit strand settings"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(module)}
                            className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm"
                            title="Delete strand"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Lessons Section */}
                {showLessons && (
                    <div className="mt-6 pt-6 border-t border-gray-100 ml-12">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Curriculum Sub-strands</h4>
                            <button
                                onClick={handleAddLesson}
                                className="px-4 py-2 bg-[#18216D] text-white rounded-lg hover:bg-[#0D164F] transition-all text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-900/10"
                            >
                                <PlusIcon className="w-4 h-4 font-black" />
                                <span>Create Sub-strand</span>
                            </button>
                        </div>

                        {module.lessons && module.lessons.length > 0 ? (
                            <div className="space-y-3">
                                {module.lessons.map((lesson) => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        onEdit={handleEditLesson}
                                        onDelete={handleDeleteLesson}
                                        onTogglePublish={handleToggleLessonPublish}
                                        onManageContent={handleManageContent}
                                        onRefresh={onRefresh}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <PlusIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 font-medium">No sub-strands defined yet.</p>
                                <button
                                    onClick={handleAddLesson}
                                    className="mt-3 text-sm text-[#18216D] hover:text-[#0D164F] font-black"
                                >
                                    Add Your First Sub-strand
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lesson Editor Modal */}
            {showLessonEditor && (
                <LessonEditor
                    moduleId={module.id}
                    lesson={editingLesson}
                    onClose={() => {
                        setShowLessonEditor(false);
                        setEditingLesson(null);
                    }}
                    onSave={() => {
                        onRefresh();
                        setShowLessonEditor(false);
                        setEditingLesson(null);
                    }}
                />
            )}
        </div>
    );
};

export default ModuleCard;
