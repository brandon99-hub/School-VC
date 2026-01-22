import React, { useState } from 'react';
import ContentManager from './ContentManager';

const LessonCard = ({ lesson, onEdit, onDelete, onTogglePublish }) => {
    const [showContentManager, setShowContentManager] = useState(false);

    const handleManageContent = () => {
        setShowContentManager(true);
    };
    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">📄</span>
                        <h4 className="text-base font-semibold text-gray-900">{lesson.title}</h4>
                        {!lesson.is_published && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                Draft
                            </span>
                        )}
                    </div>
                    {lesson.summary && (
                        <p className="text-sm text-gray-600 mb-2">{lesson.summary}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Order: {lesson.order}</span>
                        {lesson.duration_minutes > 0 && (
                            <span>{lesson.duration_minutes} min</span>
                        )}
                        {lesson.release_date && (
                            <span>Release: {new Date(lesson.release_date).toLocaleDateString()}</span>
                        )}
                        <span>{lesson.contents?.length || 0} content blocks</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                    <button
                        onClick={handleManageContent}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Manage content"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onTogglePublish(lesson)}
                        className={`p-2 rounded-lg transition-colors ${lesson.is_published
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                            }`}
                        title={lesson.is_published ? 'Published' : 'Unpublished'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onEdit(lesson)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit lesson"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(lesson)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete lesson"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Manager Modal */}
            {showContentManager && (
                <ContentManager
                    lesson={lesson}
                    onClose={() => setShowContentManager(false)}
                />
            )}
        </div>
    );
};

export default LessonCard;
