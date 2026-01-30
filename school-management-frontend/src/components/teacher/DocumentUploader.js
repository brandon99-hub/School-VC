import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, BookmarkIcon, LinkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const DocumentUploader = ({ onSave, onCancel, triggerSubmit, initialData = null }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [file, setFile] = useState(null);
    const [resourceUrl, setResourceUrl] = useState(initialData?.resource_url || '');
    const [errors, setErrors] = useState({});
    const [uploadMethod, setUploadMethod] = useState('url');

    useEffect(() => {
        if (triggerSubmit) {
            handleSubmit();
        }
    }, [triggerSubmit]);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            if (!title) {
                setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
            }
        }
    }, [title]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/plain': ['.txt'],
        },
        maxFiles: 1,
    });

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (uploadMethod === 'url' && !resourceUrl.trim()) {
            newErrors.resourceUrl = 'Document URL is required';
        }
        if (uploadMethod === 'file' && !file) {
            newErrors.file = 'Please select a file';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            title,
            resource_url: uploadMethod === 'url' ? resourceUrl : '',
            file: uploadMethod === 'file' ? file : null,
        });
    };

    return (
        <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <DocumentTextIcon className="w-6 h-6 text-[#18216D]" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-[#18216D] uppercase tracking-widest">Document Configuration</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Manage files and external resources</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} id="document-uploader-form" className="space-y-8">
                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        <BookmarkIcon className="w-3.5 h-3.5" />
                        Document Title
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
                        placeholder="e.g., Course Syllabus or Reference Guide"
                    />
                    {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.title}</p>}
                </div>

                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        <CloudArrowUpIcon className="w-3.5 h-3.5" />
                        Acquisition Method
                    </label>
                    <div className="flex gap-4 p-1 bg-white rounded-2xl border border-slate-100 w-fit">
                        <button
                            type="button"
                            onClick={() => setUploadMethod('url')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMethod === 'url'
                                ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            External Link
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMethod('file')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMethod === 'file'
                                ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Upload Local
                        </button>
                    </div>
                </div>

                {uploadMethod === 'url' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Direct Asset URL
                        </label>
                        <input
                            type="url"
                            value={resourceUrl}
                            onChange={(e) => {
                                setResourceUrl(e.target.value);
                                if (errors.resourceUrl) setErrors(prev => ({ ...prev, resourceUrl: null }));
                            }}
                            className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-4 focus:ring-[#FFC425]/10 focus:border-[#FFC425] transition-all text-sm font-medium ${errors.resourceUrl ? 'border-red-500' : 'border-slate-100 shadow-sm'
                                }`}
                            placeholder="https://example.com/document.pdf"
                        />
                        {errors.resourceUrl && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.resourceUrl}</p>}
                    </div>
                )}

                {uploadMethod === 'file' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-[#18216D] bg-indigo-50/50'
                                : errors.file
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-slate-200 bg-white hover:border-[#FFC425] hover:bg-amber-50/10'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <CloudArrowUpIcon className={`mx-auto h-12 w-12 mb-4 transition-colors ${isDragActive ? 'text-[#18216D]' : 'text-slate-300'}`} />
                            {file ? (
                                <div className="animate-in zoom-in-95">
                                    <p className="text-sm font-black text-[#18216D] uppercase tracking-widest">{file.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{(file.size / 1024).toFixed(2)} KB - Ready for transport</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                        {isDragActive ? 'Release to catch' : 'Drag file here or click'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                        PDF, DOCX, PPTX, XLSX (Max 10MB)
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Cloud Sync Mode Active</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.file && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-3 text-center">{errors.file}</p>}
                    </div>
                )}
            </form>
        </div>
    );
};

export default DocumentUploader;
