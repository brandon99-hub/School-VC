import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    XMarkIcon,
    ArrowUpTrayIcon,
    ClipboardDocumentListIcon,
    InformationCircleIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';

const AssignmentSubmission = ({ assignment, onClose, onSubmit }) => {
    const { post } = useApi();
    const { showToast } = useAppState();
    const [file, setFile] = useState(null);
    const [textSubmission, setTextSubmission] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file && !textSubmission.trim()) {
            showToast('Please provide a file or text submission', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('assignment', assignment.id);
            formData.append('text_submission', textSubmission);
            if (file) {
                formData.append('file', file);
            }

            await post('/courses/assignment-submissions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Celebration Toast
            showToast('🎉 Excellent! Your work has been handed in successfully.', 'success');

            setTimeout(() => {
                onSubmit();
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Error submitting assignment:', error);
            showToast('Failed to submit assignment. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#18216D]/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#FFC425]/10 text-[#18216D] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-[#FFC425]/20 flex items-center gap-1.5">
                                <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                                Assessment Submission
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-[#18216D] tracking-tight">{assignment.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-[#18216D]"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-8 pb-8 space-y-6">
                    {/* Minimal Task Card */}
                    {assignment.description && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                                <InformationCircleIcon className="w-5 h-5 text-[#18216D]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Task Instructions</p>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                    "{assignment.description}"
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload */}
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Upload Your Work (Photo/PDF)
                            </label>
                            <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-[#FFC425] hover:bg-yellow-50/30 transition-all cursor-pointer bg-white group-hover:shadow-lg group-hover:shadow-yellow-500/5">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ArrowUpTrayIcon className="w-8 h-8 text-slate-300 mb-2 group-hover:text-[#FFC425] transition-colors" />
                                    <p className="text-xs font-bold text-slate-500 group-hover:text-[#18216D]">
                                        {file ? file.name : 'Tap to select or drag your file here'}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Text Submission */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Text Response (Optional)
                            </label>
                            <textarea
                                value={textSubmission}
                                onChange={(e) => setTextSubmission(e.target.value)}
                                rows={4}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-[#18216D]/5 focus:border-[#18216D] focus:bg-white outline-none transition-all font-medium text-slate-600 placeholder:text-slate-300"
                                placeholder="Type your step-by-step working here..."
                            />
                        </div>

                        {/* Submission Tip */}
                        <div className="bg-[#18216D] rounded-2xl p-4 flex gap-3 items-center">
                            <div className="bg-[#FFC425] p-2 rounded-xl flex-shrink-0 animate-pulse">
                                <LightBulbIcon className="w-4 h-4 text-[#18216D]" />
                            </div>
                            <p className="text-xs font-bold text-white/90">
                                <span className="text-[#FFC425]">Submission Tip:</span> You can type your working or upload a photo of your notebook calculations!
                            </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] py-4 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0D164F] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Assignment
                                        <ClipboardDocumentListIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AssignmentSubmission;
