import React from 'react';

const ContentBlockCard = ({ block, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
    const renderContent = () => {
        switch (block.content_type) {
            case 'text':
                return (
                    <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: block.body }}
                    />
                );

            case 'video':
                return (
                    <div className="space-y-2">
                        <p className="font-medium text-gray-900">{block.title}</p>
                        {block.embed_url && (
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                <iframe
                                    src={block.embed_url}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={block.title}
                                />
                            </div>
                        )}
                    </div>
                );

            case 'document':
                return (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{block.title}</p>
                            {block.resource_url && (
                                <a
                                    href={block.resource_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    View Document →
                                </a>
                            )}
                        </div>
                    </div>
                );

            case 'quiz':
                return (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{block.title}</p>
                            <p className="text-sm text-gray-600">Quiz (Coming in Week 7)</p>
                        </div>
                    </div>
                );

            default:
                return <p className="text-gray-500">Unknown content type</p>;
        }
    };

    const getIcon = () => {
        switch (block.content_type) {
            case 'text': return '📝';
            case 'video': return '🎥';
            case 'document': return '📄';
            case 'quiz': return '❓';
            default: return '📦';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <span className="text-xl">{getIcon()}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase">
                        {block.content_type}
                    </span>
                </div>

                <div className="flex items-center space-x-1">
                    {/* Move Up/Down */}
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className={`p-1 rounded transition-colors ${isFirst
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        title="Move up"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className={`p-1 rounded transition-colors ${isLast
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        title="Move down"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Edit/Delete */}
                    <button
                        onClick={onEdit}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="content-preview">
                {renderContent()}
            </div>
        </div>
    );
};

export default ContentBlockCard;
