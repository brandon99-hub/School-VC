import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import LearningOutcomeSelector from './LearningOutcomeSelector';

const AssignmentCreator = ({ courseId, assignment, onClose, onSave }) => {
    const { get, post, put } = useApi();
    const { showToast } = useAppState();
    const isEditMode = Boolean(assignment);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [learningArea, setLearningArea] = useState(null);
    const [strands, setStrands] = useState([]);
    const [selectedStrand, setSelectedStrand] = useState(assignment?.strand_id || null);
    const [selectedOutcome, setSelectedOutcome] = useState(assignment?.learning_outcome ? { id: assignment.learning_outcome, description: assignment.learning_outcome_description } : null);

    const [formData, setFormData] = useState({
        title: assignment?.title || '',
        description: assignment?.description || '',
        due_date: assignment?.due_date ? assignment.due_date.split('T')[0] : '',
        due_time: assignment?.due_date ? assignment.due_date.split('T')[1]?.substring(0, 5) : '23:59',
        submission_types: assignment?.submission_types || ['file'],
        allow_late: assignment?.allow_late || false,
        late_penalty: assignment?.late_penalty || 0,
        assessment_type: assignment?.assessment_type || 'formative',
        criteria_ee: assignment?.criteria_ee || '',
        criteria_me: assignment?.criteria_me || '',
        criteria_ae: assignment?.criteria_ae || '',
        criteria_be: assignment?.criteria_be || '',
    });

    // Fetch current learning area and its strands
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const area = await get(`/api/cbc/learning-areas/${courseId}/`);
                setLearningArea(area);

                const strandsList = await get(`/api/cbc/learning-areas/${courseId}/strands/`);
                setStrands(Array.isArray(strandsList) ? strandsList : []);
            } catch (error) {
                console.error('Error fetching curriculum data:', error);
                showToast('Failed to load curriculum context', 'error');
            }
        };
        fetchInitialData();
    }, [courseId, get]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmissionTypeToggle = (type) => {
        setFormData(prev => {
            const types = prev.submission_types.includes(type)
                ? prev.submission_types.filter(t => t !== type)
                : [...prev.submission_types, type];
            return { ...prev, submission_types: types };
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Assignment title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.due_date) newErrors.due_date = 'Due date is required';
        if (!selectedOutcome) newErrors.learning_outcome = 'Learning Outcome is required';

        if (formData.submission_types.length === 0) {
            newErrors.submission_types = 'Select at least one submission type';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                due_date: `${formData.due_date}T${formData.due_time}:00`,
                status: 'Pending',
                is_cbc_assignment: true,
                learning_area: courseId,
                learning_outcome: selectedOutcome.id,
                assessment_type: formData.assessment_type,
            };

            if (isEditMode) {
                await put(`/api/assignments/${assignment.id}/`, payload);
                showToast('Assignment updated successfully!');
            } else {
                await post(`/api/assignments/`, payload);
                showToast('Assignment created successfully!');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving assignment:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                showToast('Failed to save assignment', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#18216D] mb-1">Competency-Based Assessment</p>
                        <h2 className="text-3xl font-black text-[#18216D] tracking-tight">
                            {isEditMode ? 'Edit Assignment' : 'New Assignment'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    {/* Context Context */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-[#18216D] text-white rounded-xl flex items-center justify-center font-black">
                            {learningArea?.name?.[0]}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Area</p>
                            <h4 className="font-black text-[#18216D] uppercase tracking-tight">{learningArea?.name} - {learningArea?.grade_level_name}</h4>
                        </div>
                    </div>

                    {/* Outcome Selection */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">1</span>
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Competency Selection</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Curriculum Strand</label>
                                <select
                                    value={selectedStrand || ''}
                                    onChange={(e) => {
                                        setSelectedStrand(e.target.value);
                                        setSelectedOutcome(null);
                                    }}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                                >
                                    <option value="">Select a strand...</option>
                                    {strands.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedStrand && (
                                <LearningOutcomeSelector
                                    learningAreaId={courseId}
                                    strandId={selectedStrand}
                                    selectedOutcome={selectedOutcome}
                                    onChange={setSelectedOutcome}
                                />
                            )}
                        </div>
                        {errors.learning_outcome && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{errors.learning_outcome}</p>}
                    </section>

                    {/* Assessment Details */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Assignment Details</h3>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Assignment Title (e.g. Weekly Math Quiz)"
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                            />
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the instructions for this competency task..."
                                rows="4"
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none resize-none"
                            />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Assessment Type */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Evaluation Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, assessment_type: 'formative' }))}
                                    className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${formData.assessment_type === 'formative' ? 'border-[#18216D] bg-[#18216D]/5 text-[#18216D]' : 'border-slate-50 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <p className="font-black text-xs uppercase">Formative</p>
                                    <p className="text-[10px] font-bold opacity-70 mt-1">Ongoing</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, assessment_type: 'summative' }))}
                                    className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${formData.assessment_type === 'summative' ? 'border-[#18216D] bg-[#18216D]/5 text-[#18216D]' : 'border-slate-50 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <p className="font-black text-xs uppercase">Summative</p>
                                    <p className="text-[10px] font-bold opacity-70 mt-1">End of Strand</p>
                                </button>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Deadline Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-10 py-6 border-t border-gray-100 bg-slate-50 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-4 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-10 py-5 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-[#0D164F] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Authenticating...' : (isEditMode ? 'Update Task' : 'Publish Task')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentCreator;
