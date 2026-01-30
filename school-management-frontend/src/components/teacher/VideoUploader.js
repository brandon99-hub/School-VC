import React, { useState, useEffect } from 'react';
import { VideoCameraIcon, BookmarkIcon, LinkIcon } from '@heroicons/react/24/outline';

const VideoUploader = ({ onSave, onCancel, triggerSubmit, initialData = null }) => {
    const [videoType, setVideoType] = useState(initialData?.type || 'embed');
    const [embedUrl, setEmbedUrl] = useState(initialData?.embed_url || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (triggerSubmit) {
            handleSubmit();
        }
    }, [triggerSubmit]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

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
        <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <VideoCameraIcon className="w-6 h-6 text-[#18216D]" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[#18216D] uppercase tracking-widest">Video Content Configuration</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Configure your lesson video source</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} id="video-uploader-form" className="space-y-8">
                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        <BookmarkIcon className="w-3.5 h-3.5" />
                        Video Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                        }}
                        className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-4 focus:ring-[#FFC425]/10 focus:border-[#FFC425] transition-all text-sm font-medium ${errors.title ? 'border-red-500' : 'border-slate-100 shadow-sm'
                            }`}
                        placeholder="e.g., Introduction to Sub-strand Concepts"
                    />
                    {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.title}</p>}
                </div>

                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        <LinkIcon className="w-3.5 h-3.5" />
                        Video Source
                    </label>
                    <div className="flex gap-4 p-1 bg-white rounded-2xl border border-slate-100 w-fit">
                        <button
                            type="button"
                            onClick={() => setVideoType('embed')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${videoType === 'embed'
                                ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            External Embed
                        </button>
                        <button
                            type="button"
                            onClick={() => setVideoType('upload')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${videoType === 'upload'
                                ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Upload File
                        </button>
                    </div>
                </div>

                {videoType === 'embed' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Direct Embed URL
                        </label>
                        <input
                            type="url"
                            value={embedUrl}
                            onChange={handleUrlChange}
                            className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-4 focus:ring-[#FFC425]/10 focus:border-[#FFC425] transition-all text-sm font-medium ${errors.embedUrl ? 'border-red-500' : 'border-slate-100 shadow-sm'
                                }`}
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {errors.embedUrl && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.embedUrl}</p>}

                        {/* Preview Card */}
                        {embedUrl && !errors.embedUrl && (
                            <div className="mt-8 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-2 mb-3 px-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Preview</p>
                                </div>
                                <div className="aspect-video bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-2xl">
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
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <VideoCameraIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-black text-[#18216D] uppercase tracking-widest mb-1 italic">Internal Hosting</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coming Soon to Kianda OS</p>
                    </div>
                )}
            </form>
        </div>
    );
};

export default VideoUploader;
