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
            await del(`/api/teacher/lessons/${lesson.id}/`);
            onRefresh();
            showToast('Lesson deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting lesson:', error);
            showToast('Failed to delete lesson', 'error');
        }
    };

    const handleToggleLessonPublish = async (lesson) => {
        try {
            await put(`/api/teacher/lessons/${lesson.id}/`, {
                ...lesson,
                is_published: !lesson.is_published
            });
            onRefresh();
        } catch (error) {
            console.error('Error toggling lesson publish status:', error);
            alert('Failed to update lesson');
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
                            <ArchiveBoxIcon className="h-6 w-6 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                            {!module.is_published && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                    Draft
                                </span>
                            )}
                        </div>
                        {module.description && (
                            <p className="text-sm text-gray-600 mb-3 ml-7">{module.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 ml-7">
                            <span>Order: {module.order}</span>
                            {module.release_date && (
                                <span>Release: {new Date(module.release_date).toLocaleDateString()}</span>
                            )}
                            <span>{module.lessons?.length || 0} lesson{module.lessons?.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Module Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                        <button
                            onClick={() => onTogglePublish(module)}
                            className={`p-2 rounded-lg transition-colors ${module.is_published
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                            title={module.is_published ? 'Published' : 'Unpublished'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onEdit(module)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit module"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(module)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete module"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Lessons Section */}
                {showLessons && (
                    <div className="mt-4 pt-4 border-t border-gray-200 ml-7">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Lessons</h4>
                            <button
                                onClick={handleAddLesson}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-semibold flex items-center space-x-1 border border-blue-200"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Add Lesson</span>
                            </button>
                        </div>

                        {module.lessons && module.lessons.length > 0 ? (
                            <div className="space-y-2">
                                {module.lessons.map((lesson) => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        onEdit={handleEditLesson}
                                        onDelete={handleDeleteLesson}
                                        onTogglePublish={handleToggleLessonPublish}
                                        onManageContent={handleManageContent}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <PlusIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No lessons yet</p>
                                <button
                                    onClick={handleAddLesson}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-bold"
                                >
                                    Create your first lesson
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
