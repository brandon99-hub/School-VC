import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const DocumentUploader = ({ onSave, onCancel, initialData = null }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [file, setFile] = useState(null);
    const [resourceUrl, setResourceUrl] = useState(initialData?.resource_url || '');
    const [errors, setErrors] = useState({});
    const [uploadMethod, setUploadMethod] = useState('url');

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
        e.preventDefault();

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
        <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Document</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Title *
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
                        placeholder="e.g., Course Syllabus"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Method
                    </label>
                    <div className="flex space-x-4 mb-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="url"
                                checked={uploadMethod === 'url'}
                                onChange={(e) => setUploadMethod(e.target.value)}
                                className="mr-2"
                            />
                            <span className="text-sm">External URL</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="file"
                                checked={uploadMethod === 'file'}
                                onChange={(e) => setUploadMethod(e.target.value)}
                                className="mr-2"
                            />
                            <span className="text-sm">Upload File (Coming Soon)</span>
                        </label>
                    </div>
                </div>

                {uploadMethod === 'url' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Document URL *
                        </label>
                        <input
                            type="url"
                            value={resourceUrl}
                            onChange={(e) => {
                                setResourceUrl(e.target.value);
                                if (errors.resourceUrl) setErrors(prev => ({ ...prev, resourceUrl: null }));
                            }}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.resourceUrl ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="https://example.com/document.pdf"
                        />
                        {errors.resourceUrl && <p className="text-red-500 text-sm mt-1">{errors.resourceUrl}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                            Link to a PDF, Google Doc, or other document
                        </p>
                    </div>
                )}

                {uploadMethod === 'file' && (
                    <div>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : errors.file
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {file ? (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                        {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
                                    </p>
                                    <p className="text-xs text-red-500 mt-2">
                                        File upload backend coming soon - use URL for now
                                    </p>
                                </div>
                            )}
                        </div>
                        {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
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
                        Add Document
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DocumentUploader;
