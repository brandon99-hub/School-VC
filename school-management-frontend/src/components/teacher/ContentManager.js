import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import VideoUploader from './VideoUploader';
import DocumentUploader from './DocumentUploader';
import ContentBlockCard from './ContentBlockCard';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const ContentManager = ({ lesson, onClose }) => {
    const { post, put } = useApi();
    const { showToast } = useAppState();
    const [contentBlocks, setContentBlocks] = useState(lesson.contents || []);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [activeEditor, setActiveEditor] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAddContent = (type) => {
        setActiveEditor(type);
        setShowAddMenu(false);
        if (type === 'text') {
            setTextContent('');
        }
    };

    const handleSaveTextBlock = () => {
        if (!textContent.trim()) {
            showToast('Please enter some content', 'error');
            return;
        }

        const newBlock = {
            id: Date.now(),
            content_type: 'text',
            title: 'Text Content',
            body: textContent,
            order: contentBlocks.length + 1,
        };

        setContentBlocks([...contentBlocks, newBlock]);
        setActiveEditor(null);
        setTextContent('');
    };

    const handleSaveVideoBlock = (data) => {
        const newBlock = {
            id: Date.now(),
            content_type: 'video',
            title: data.title,
            embed_url: data.embed_url,
            order: contentBlocks.length + 1,
        };

        setContentBlocks([...contentBlocks, newBlock]);
        setActiveEditor(null);
    };

    const handleSaveDocumentBlock = (data) => {
        const newBlock = {
            id: Date.now(),
            content_type: 'document',
            title: data.title,
            resource_url: data.resource_url,
            order: contentBlocks.length + 1,
        };

        setContentBlocks([...contentBlocks, newBlock]);
        setActiveEditor(null);
    };

    const handleDeleteBlock = (blockId) => {
        if (!window.confirm('Are you sure you want to delete this content block?')) {
            return;
        }
        setContentBlocks(contentBlocks.filter(b => b.id !== blockId));
    };

    const handleMoveBlock = (index, direction) => {
        const newBlocks = [...contentBlocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];

        // Update order
        newBlocks.forEach((block, idx) => {
            block.order = idx + 1;
        });

        setContentBlocks(newBlocks);
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);

            // Save each content block to the lesson
            for (const block of contentBlocks) {
                if (block.id && typeof block.id === 'number' && block.id > 1000000000) {
                    // New block (temp ID from Date.now()) - create
                    await post(`/api/lesson-contents/`, {
                        lesson: lesson.id,
                        content_type: block.content_type,
                        title: block.title,
                        body: block.body,
                        embed_url: block.embed_url,
                        resource_url: block.resource_url,
                        order: block.order
                    });
                } else if (block.id) {
                    // Existing block - update
                    await put(`/api/lesson-contents/${block.id}/`, {
                        title: block.title,
                        body: block.body,
                        embed_url: block.embed_url,
                        resource_url: block.resource_url,
                        order: block.order
                    });
                }
            }

            showToast('Content saved successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving content:', error);
            showToast('Failed to save content', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-50 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Manage Content</h2>
                        <p className="text-sm text-gray-600">{lesson.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Add Content Button */}
                    {!activeEditor && (
                        <div className="relative">
                            <button
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                className="w-full px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium text-gray-700 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Content Block</span>
                            </button>

                            {/* Add Menu */}
                            {showAddMenu && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
                                    <button
                                        onClick={() => handleAddContent('text')}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                                    >
                                        <span className="text-2xl">📝</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Rich Text</p>
                                            <p className="text-xs text-gray-500">Add formatted text content</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleAddContent('video')}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-t border-gray-100"
                                    >
                                        <span className="text-2xl">🎥</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Video</p>
                                            <p className="text-xs text-gray-500">Embed YouTube or Vimeo</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleAddContent('document')}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-t border-gray-100"
                                    >
                                        <span className="text-2xl">📄</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Document</p>
                                            <p className="text-xs text-gray-500">PDF, DOC, or other files</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            showToast('Please use the main "Quizzes" tab in the course view to manage quizzes for this lesson.', 'info');
                                            setShowAddMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-t border-gray-100"
                                    >
                                        <span className="text-2xl">❓</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Quiz</p>
                                            <p className="text-xs text-gray-500">Manage via Quizzes tab</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active Editor */}
                    {activeEditor === 'text' && (
                        <div className="bg-white rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Text Content</h3>
                            <RichTextEditor
                                value={textContent}
                                onChange={setTextContent}
                                placeholder="Start typing your lesson content..."
                            />
                            <div className="flex items-center justify-end space-x-4 mt-4">
                                <button
                                    onClick={() => setActiveEditor(null)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTextBlock}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Add Text Block
                                </button>
                            </div>
                        </div>
                    )}

                    {activeEditor === 'video' && (
                        <VideoUploader
                            onSave={handleSaveVideoBlock}
                            onCancel={() => setActiveEditor(null)}
                        />
                    )}

                    {activeEditor === 'document' && (
                        <DocumentUploader
                            onSave={handleSaveDocumentBlock}
                            onCancel={() => setActiveEditor(null)}
                        />
                    )}

                    {/* Content Blocks List */}
                    {contentBlocks.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Content Blocks</h3>
                            {contentBlocks.map((block, index) => (
                                <ContentBlockCard
                                    key={block.id}
                                    block={block}
                                    onEdit={() => showToast('Edit functionality coming soon', 'info')}
                                    onDelete={() => handleDeleteBlock(block.id)}
                                    onMoveUp={() => handleMoveBlock(index, 'up')}
                                    onMoveDown={() => handleMoveBlock(index, 'down')}
                                    isFirst={index === 0}
                                    isLast={index === contentBlocks.length - 1}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {contentBlocks.length === 0 && !activeEditor && (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-lg font-medium mb-2">No content blocks yet</p>
                            <p className="text-sm">Click "Add Content Block" to start building your lesson</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-end space-x-4 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentManager;
