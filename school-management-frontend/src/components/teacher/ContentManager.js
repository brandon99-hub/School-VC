import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import VideoUploader from './VideoUploader';
import DocumentUploader from './DocumentUploader';
import ContentBlockCard from './ContentBlockCard';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    PlusIcon,
    PencilSquareIcon,
    VideoCameraIcon,
    DocumentTextIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const ContentManager = ({ lesson, onClose }) => {
    const { post, put } = useApi();
    const { showToast } = useAppState();
    const [contentBlocks, setContentBlocks] = useState(lesson.contents || []);
    const [activeEditor, setActiveEditor] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [triggerSubmit, setTriggerSubmit] = useState(false);

    const handleAddContent = (type) => {
        setActiveEditor(type);
        setTriggerSubmit(false);
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
        setTriggerSubmit(false);
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
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onDragStart={(e) => e.stopPropagation()}
            draggable="false"
        >
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
                onDragStart={(e) => e.stopPropagation()}
                draggable="false"
            >
                <div className="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-[#18216D] uppercase tracking-tight">Manage Content</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            <span className="text-[#FFC425] mr-2">/</span> {lesson.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-red-500"
                    >
                        <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Quick Add Ribbon */}
                    {!activeEditor && (
                        <div className="bg-[#18216D]/5 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between border border-[#18216D]/10">
                            <div className="flex items-center gap-3 px-4 py-2">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                                    <PlusIcon className="w-4 h-4 text-[#18216D]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#18216D] uppercase tracking-widest leading-none">Swift-Add Toolbar</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Direct sub-strand entry</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-1">
                                <button
                                    onClick={() => handleAddContent('text')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-[#18216D] hover:border-[#18216D]/20 hover:bg-slate-50 transition-all shadow-sm hover:translate-y-[-1px] group"
                                >
                                    <PencilSquareIcon className="w-4 h-4 text-[#18216D]/40 group-hover:text-[#18216D]" /> Rich Text
                                </button>
                                <button
                                    onClick={() => handleAddContent('video')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-[#18216D] hover:border-[#FFC425]/40 hover:bg-amber-50/30 transition-all shadow-sm hover:translate-y-[-1px] group"
                                >
                                    <VideoCameraIcon className="w-4 h-4 text-[#FFC425] group-hover:scale-110" /> Video
                                </button>
                                <button
                                    onClick={() => handleAddContent('document')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-[#18216D] hover:border-emerald-500/20 hover:bg-emerald-50/30 transition-all shadow-sm hover:translate-y-[-1px] group"
                                >
                                    <DocumentTextIcon className="w-4 h-4 text-emerald-500 group-hover:scale-110" /> Document
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Editor */}
                    {activeEditor && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            {activeEditor === 'text' && (
                                <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <PencilSquareIcon className="w-6 h-6 text-[#18216D]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-[#18216D] uppercase tracking-widest">Rich Text Editor</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Compose your lesson narrative</p>
                                        </div>
                                    </div>
                                    <RichTextEditor
                                        value={textContent}
                                        onChange={setTextContent}
                                        placeholder="Start typing your lesson content..."
                                    />
                                </div>
                            )}

                            {activeEditor === 'video' && (
                                <VideoUploader
                                    onSave={(data) => {
                                        handleSaveVideoBlock(data);
                                        setTriggerSubmit(false);
                                    }}
                                    onCancel={() => {
                                        setActiveEditor(null);
                                        setTriggerSubmit(false);
                                    }}
                                    triggerSubmit={triggerSubmit}
                                />
                            )}

                            {activeEditor === 'document' && (
                                <DocumentUploader
                                    onSave={(data) => {
                                        handleSaveDocumentBlock(data);
                                        setTriggerSubmit(false);
                                    }}
                                    onCancel={() => {
                                        setActiveEditor(null);
                                        setTriggerSubmit(false);
                                    }}
                                    triggerSubmit={triggerSubmit}
                                />
                            )}
                        </div>
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
                        <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
                                <PlusIcon className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-[#18216D] mb-2 tracking-tight uppercase italic">No Content Yet</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mb-10 font-medium italic text-sm">Your sub-strand is currently a blank canvas. Start building by selecting a content type below.</p>
                            <div className="flex flex-wrap items-center justify-center gap-4 px-6">
                                <button
                                    onClick={() => handleAddContent('text')}
                                    className="px-8 py-4 bg-white border border-slate-100 text-[#18216D] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-indigo-900/5 hover:bg-[#18216D] hover:text-white transition-all group"
                                >
                                    <PencilSquareIcon className="w-5 h-5 mb-2 mx-auto group-hover:scale-110" />
                                    <span>Create Text</span>
                                </button>
                                <button
                                    onClick={() => handleAddContent('video')}
                                    className="px-8 py-4 bg-white border border-slate-100 text-[#18216D] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-amber-900/5 hover:bg-[#FFC425] transition-all group"
                                >
                                    <VideoCameraIcon className="w-5 h-5 mb-2 mx-auto group-hover:scale-110" />
                                    <span>Embed Video</span>
                                </button>
                                <button
                                    onClick={() => handleAddContent('document')}
                                    className="px-8 py-4 bg-white border border-slate-100 text-[#18216D] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-900/5 hover:bg-emerald-500 hover:text-white transition-all group"
                                >
                                    <DocumentTextIcon className="w-5 h-5 mb-2 mx-auto group-hover:scale-110" />
                                    <span>Attach File</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-4 sticky bottom-0">
                    <button
                        onClick={activeEditor ? () => setActiveEditor(null) : onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-[#18216D]/60 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-[#18216D] transition-all"
                    >
                        {activeEditor ? 'Discard Draft' : 'Exit Manager'}
                    </button>
                    {activeEditor ? (
                        <button
                            onClick={() => {
                                if (activeEditor === 'text') handleSaveTextBlock();
                                else setTriggerSubmit(true);
                            }}
                            className="px-10 py-3 bg-[#FFC425] text-[#18216D] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#F0B40F] transition-all shadow-xl shadow-amber-900/10"
                        >
                            Confirm & Add Block
                        </button>
                    ) : (
                        <button
                            onClick={handleSaveAll}
                            disabled={saving || contentBlocks.length === 0}
                            className="px-10 py-3 bg-[#18216D] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0D164F] transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Syncing...' : 'Sync to Cloud'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentManager;
