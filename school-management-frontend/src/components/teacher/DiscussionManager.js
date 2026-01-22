import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const DiscussionManager = ({ courseId, onClose }) => {
    const { get, post, put, del } = useApi();
    const { showToast } = useAppState();
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewThread, setShowNewThread] = useState(false);
    const [newThread, setNewThread] = useState({ title: '', body: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchThreads();
    }, [courseId]);

    const fetchThreads = async () => {
        try {
            setLoading(true);
            const data = await get(`/courses/discussion-threads/?course=${courseId}`);
            setThreads(data || []);
        } catch (error) {
            console.error('Error fetching discussions:', error);
            showToast('Failed to load discussions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();
        if (!newThread.title.trim() || !newThread.body.trim()) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await post('/courses/discussion-threads/', {
                course: courseId,
                title: newThread.title,
                body: newThread.body
            });
            showToast('Discussion created successfully!');
            setNewThread({ title: '', body: '' });
            setShowNewThread(false);
            fetchThreads();
        } catch (error) {
            console.error('Error creating thread:', error);
            showToast('Failed to create discussion', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePin = async (threadId, isPinned) => {
        try {
            await put(`/courses/discussion-threads/${threadId}/`, {
                is_pinned: !isPinned
            });
            showToast(isPinned ? 'Thread unpinned' : 'Thread pinned');
            fetchThreads();
        } catch (error) {
            console.error('Error toggling pin:', error);
            showToast('Failed to update thread', 'error');
        }
    };

    const handleDeleteThread = async (threadId) => {
        if (!window.confirm('Are you sure you want to delete this discussion thread?')) {
            return;
        }

        try {
            await del(`/courses/discussion-threads/${threadId}/`);
            showToast('Thread deleted successfully');
            fetchThreads();
        } catch (error) {
            console.error('Error deleting thread:', error);
            showToast('Failed to delete thread', 'error');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                    <p className="mt-4 text-gray-600">Loading discussions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Discussion Board</h2>
                        <p className="text-sm text-gray-600">{threads.length} discussion{threads.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowNewThread(!showNewThread)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            New Discussion
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* New Thread Form */}
                {showNewThread && (
                    <div className="p-6 border-b bg-gray-50">
                        <form onSubmit={handleCreateThread} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discussion Title
                                </label>
                                <input
                                    type="text"
                                    value={newThread.title}
                                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter discussion title..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={newThread.body}
                                    onChange={(e) => setNewThread({ ...newThread, body: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Start the discussion..."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewThread(false);
                                        setNewThread({ title: '', body: '' });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Discussion'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Threads List */}
                <div className="p-6">
                    {threads.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-comments text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600 text-lg">No discussions yet</p>
                            <p className="text-gray-500 text-sm mt-2">Start a discussion to engage with your students</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {threads.map(thread => (
                                <div key={thread.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{thread.title}</h3>
                                                {thread.is_pinned && (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                                        <i className="fas fa-thumbtack mr-1"></i>
                                                        Pinned
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{thread.body}</p>
                                            <p className="text-xs text-gray-500">
                                                By {thread.created_by_name} • {new Date(thread.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleTogglePin(thread.id, thread.is_pinned)}
                                                className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                                title={thread.is_pinned ? 'Unpin' : 'Pin'}
                                            >
                                                <i className={`fas fa-thumbtack ${thread.is_pinned ? 'text-amber-600' : ''}`}></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteThread(thread.id)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    {thread.comments?.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 mb-2">
                                                <i className="fas fa-comment mr-1"></i>
                                                {thread.comments.length} comment{thread.comments.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscussionManager;
