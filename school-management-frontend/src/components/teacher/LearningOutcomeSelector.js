import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';

const LearningOutcomeSelector = ({ learningAreaId, strandId, selectedOutcome, selectedOutcomes = [], multiple = false, onChange }) => {
    const { get } = useApi();
    const [strands, setStrands] = useState([]);
    const [selectedStrand, setSelectedStrand] = useState(null);
    const [subStrands, setSubStrands] = useState([]);
    const [selectedSubStrand, setSelectedSubStrand] = useState(null);
    const [outcomes, setOutcomes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStrands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await get(`/api/cbc/learning-areas/${learningAreaId}/strands/`);
            setStrands(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load strands');
            console.error('Error fetching strands:', err);
        } finally {
            setLoading(false);
        }
    }, [get, learningAreaId]);

    const handleSubStrandChange = useCallback(async (subStrandId, clearSelection = true, subStrandsList = null) => {
        const listToUse = subStrandsList || subStrands;
        const subStrand = listToUse.find(ss => ss.id == subStrandId);
        setSelectedSubStrand(subStrand);

        if (clearSelection) {
            onChange(null);
        }

        if (subStrandId) {
            setLoading(true);
            try {
                const data = await get(`/api/cbc/sub-strands/${subStrandId}/learning-outcomes/`);
                setOutcomes(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to load learning outcomes');
                console.error('Error fetching learning outcomes:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setOutcomes([]);
        }
    }, [subStrands, onChange, get]);

    const handleStrandChange = useCallback(async (strandId, clearSelection = true) => {
        const strand = strands.find(s => s.id == strandId);
        setSelectedStrand(strand);
        setSelectedSubStrand(null);
        setOutcomes([]);

        if (clearSelection) {
            onChange(null); // Only clear if user manually changed it
        }

        if (strandId) {
            setLoading(true);
            try {
                const data = await get(`/api/cbc/strands/${strandId}/sub-strands/`);
                const validatedData = Array.isArray(data) ? data : [];
                setSubStrands(validatedData);

                // If we are in edit mode, try to find the current sub-strand
                // Support both single selection (selectedOutcome) and multiple (selectedOutcomes)
                const firstOutcome = selectedOutcome || (multiple && selectedOutcomes?.length > 0 ? selectedOutcomes[0] : null);

                if (firstOutcome?.sub_strand_id) {
                    const subStrand = validatedData.find(ss => ss.id == firstOutcome.sub_strand_id);
                    if (subStrand) {
                        handleSubStrandChange(subStrand.id, false, validatedData);
                    }
                }
            } catch (err) {
                setError('Failed to load sub-strands');
                console.error('Error fetching sub-strands:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setSubStrands([]);
        }
    }, [strands, onChange, get, selectedOutcome?.sub_strand_id, handleSubStrandChange]);

    // Fetch strands when learning area changes
    useEffect(() => {
        if (learningAreaId) {
            fetchStrands();
        } else {
            setStrands([]);
            setSelectedStrand(null);
            setSubStrands([]);
            setSelectedSubStrand(null);
            setOutcomes([]);
        }
    }, [learningAreaId, fetchStrands]);

    // React to external strand selection
    useEffect(() => {
        if (strandId && strands.length > 0) {
            const strand = strands.find(s => s.id == strandId);
            if (strand && selectedStrand?.id != strand.id) {
                handleStrandChange(strandId, false);
            }
        }
    }, [strandId, strands, selectedStrand?.id, handleStrandChange]);

    const handleOutcomeChange = (outcomeId) => {
        const outcome = outcomes.find(o => o.id == outcomeId);
        if (outcome) {
            // Normalize to ensure sub_strand_id is present for persistence logic
            onChange({
                ...outcome,
                sub_strand_id: outcome.sub_strand_id || outcome.sub_strand
            });
        } else if (!multiple) {
            onChange(null);
        }
    };

    const toggleOutcome = (outcomeId) => {
        const outcome = outcomes.find(o => o.id == outcomeId);
        if (!outcome) return;

        const safeSelected = Array.isArray(selectedOutcomes) ? selectedOutcomes : [];
        const isSelected = safeSelected.some(o => o.id == outcome.id);
        if (isSelected) {
            onChange(safeSelected.filter(o => o.id != outcome.id));
        } else {
            onChange([...safeSelected, {
                ...outcome,
                sub_strand_id: outcome.sub_strand_id || outcome.sub_strand
            }]);
        }
    };

    const removeOutcome = (outcomeId) => {
        const safeSelected = Array.isArray(selectedOutcomes) ? selectedOutcomes : [];
        onChange(safeSelected.filter(o => o.id != outcomeId));
    };

    if (!learningAreaId) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    Please select a Learning Area first to choose a learning outcome.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Curriculum Mapping Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strand Selector (only if not provided by parent) */}
                {!strandId && (
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Curriculum Strand <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedStrand?.id || ''}
                            onChange={(e) => handleStrandChange(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                            disabled={loading || !strands || strands.length === 0}
                        >
                            <option value="">Select a strand...</option>
                            {strands.map(strand => (
                                <option key={strand.id} value={strand.id}>
                                    {strand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Sub-Strand Selector (appears after strand selected) */}
                {selectedStrand && (
                    <div className="animate-in fade-in duration-300">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Sub-Strand / Lesson <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedSubStrand?.id || ''}
                            onChange={(e) => handleSubStrandChange(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                            disabled={loading || !subStrands || subStrands.length === 0}
                        >
                            <option value="">Select a sub-strand...</option>
                            {subStrands.map(subStrand => (
                                <option key={subStrand.id} value={subStrand.id}>
                                    {subStrand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Learning Outcome Selector (appears after sub-strand selected) */}
            {selectedSubStrand && (
                <div className="animate-in fade-in duration-300">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                        Learning Outcome <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={multiple ? '' : (selectedOutcome?.id || '')}
                        onChange={(e) => multiple ? toggleOutcome(e.target.value) : handleOutcomeChange(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                        disabled={loading || !outcomes || outcomes.length === 0}
                    >
                        <option value="">{multiple ? 'Choose competencies...' : 'Select learning outcome...'}</option>
                        {outcomes.map(outcome => {
                            const isSelected = multiple && Array.isArray(selectedOutcomes) && selectedOutcomes.some(o => o.id == outcome.id);
                            return (
                                <option key={outcome.id} value={outcome.id}>
                                    {isSelected ? '✓ ' : ''}{outcome.description}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}

            {/* Selected Outcomes Tags (Multiple Mode) */}
            {multiple && Array.isArray(selectedOutcomes) && selectedOutcomes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in duration-300">
                    {selectedOutcomes.map((outcome) => (
                        <div key={outcome.id} className="bg-[#18216D]/5 border border-[#18216D]/10 rounded-xl px-4 py-2 flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-[#18216D] uppercase tracking-widest">{outcome.code}</span>
                                <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{outcome.description}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeOutcome(outcome.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Outcome Preview (Single Mode) */}
            {!multiple && selectedOutcome && (
                <div className="bg-[#18216D]/5 border border-[#18216D]/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
                    <h4 className="text-[10px] font-black text-[#18216D] uppercase tracking-widest mb-3">Selected Learning Outcome</h4>
                    <p className="text-sm font-bold text-gray-900 mb-4 italic leading-relaxed">"{selectedOutcome.description}"</p>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <span className="bg-[#18216D] text-white px-2 py-1 rounded">
                            {selectedOutcome.code}
                        </span>
                        <span className="text-slate-400">
                            {selectedStrand?.name} <i className="fas fa-chevron-right text-[8px] mx-1" /> {selectedSubStrand?.name}
                        </span>
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#18216D]/10 border-t-[#18216D] shadow-sm"></div>
                    <span className="ml-4 text-[10px] font-black text-[#18216D] uppercase tracking-widest">Synchronizing...</span>
                </div>
            )}
        </div>
    );
};

export default LearningOutcomeSelector;
