import React, { useState } from 'react';

const VideoUploader = ({ onSave, onCancel, initialData = null }) => {
    const [videoType, setVideoType] = useState(initialData?.type || 'embed');
    const [embedUrl, setEmbedUrl] = useState(initialData?.embed_url || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (videoType === 'embed' && !embedUrl.trim()) {
            newErrors.embedUrl = 'Video URL is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            type: videoType,
            title,
            embed_url: embedUrl,
        });
    };

    const getEmbedUrl = (url) => {
        // Convert YouTube watch URLs to embed URLs
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            return `https://www.youtube.com/embed/${videoId}`;
        }
        // Convert youtu.be URLs to embed URLs
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        // Convert Vimeo URLs to embed URLs
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1].split('?')[0];
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setEmbedUrl(url);
        if (errors.embedUrl) {
            setErrors(prev => ({ ...prev, embedUrl: null }));
        }
    };

    return (
        <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Video Content</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="e.g., Introduction to Python Variables"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Source
                    </label>
                    <div className="flex space-x-4 mb-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="embed"
                                checked={videoType === 'embed'}
                                onChange={(e) => setVideoType(e.target.value)}
                                className="mr-2"
                            />
                            <span className="text-sm">Embed URL (YouTube, Vimeo)</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="upload"
                                checked={videoType === 'upload'}
                                onChange={(e) => setVideoType(e.target.value)}
                                className="mr-2"
                            />
                            <span className="text-sm">Upload File (Coming Soon)</span>
                        </label>
                    </div>
                </div>

                {videoType === 'embed' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Video URL *
                        </label>
                        <input
                            type="url"
                            value={embedUrl}
                            onChange={handleUrlChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.embedUrl ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {errors.embedUrl && <p className="text-red-500 text-sm mt-1">{errors.embedUrl}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                            Supports YouTube and Vimeo URLs
                        </p>

                        {/* Preview */}
                        {embedUrl && !errors.embedUrl && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <iframe
                                        src={getEmbedUrl(embedUrl)}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title="Video preview"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {videoType === 'upload' && (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Video file upload coming soon</p>
                        <p className="text-xs text-gray-500">Use embed URL for now</p>
                    </div>
                )}

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Add Video
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VideoUploader;
