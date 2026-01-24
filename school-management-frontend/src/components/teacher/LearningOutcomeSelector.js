import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const LearningOutcomeSelector = ({ learningAreaId, strandId, selectedOutcome, onChange }) => {
    const { get } = useApi();
    const [strands, setStrands] = useState([]);
    const [selectedStrand, setSelectedStrand] = useState(null);
    const [subStrands, setSubStrands] = useState([]);
    const [selectedSubStrand, setSelectedSubStrand] = useState(null);
    const [outcomes, setOutcomes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch strands when learning area changes
    useEffect(() => {
        if (learningAreaId) {
            fetchStrands();
        } else {
            resetAll();
        }
    }, [learningAreaId]);

    // React to external strand selection
    useEffect(() => {
        if (strandId) {
            handleStrandChange(strandId);
        }
    }, [strandId, strands]);

    const resetAll = () => {
        setStrands([]);
        setSelectedStrand(null);
        setSubStrands([]);
        setSelectedSubStrand(null);
        setOutcomes([]);
    };

    const fetchStrands = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await get(`/api/cbc/learning-areas/${learningAreaId}/strands/`);
            setStrands(data);
        } catch (err) {
            setError('Failed to load strands');
            console.error('Error fetching strands:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStrandChange = async (strandId) => {
        const strand = strands.find(s => s.id === parseInt(strandId));
        setSelectedStrand(strand);
        setSelectedSubStrand(null);
        setOutcomes([]);
        onChange(null); // Clear selection

        if (strandId) {
            setLoading(true);
            try {
                const data = await get(`/api/cbc/strands/${strandId}/sub-strands/`);
                setSubStrands(data);
            } catch (err) {
                setError('Failed to load sub-strands');
                console.error('Error fetching sub-strands:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setSubStrands([]);
        }
    };

    const handleSubStrandChange = async (subStrandId) => {
        const subStrand = subStrands.find(ss => ss.id === parseInt(subStrandId));
        setSelectedSubStrand(subStrand);
        onChange(null); // Clear selection

        if (subStrandId) {
            setLoading(true);
            try {
                const data = await get(`/api/cbc/sub-strands/${subStrandId}/learning-outcomes/`);
                setOutcomes(data);
            } catch (err) {
                setError('Failed to load learning outcomes');
                console.error('Error fetching learning outcomes:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setOutcomes([]);
        }
    };

    const handleOutcomeChange = (outcomeId) => {
        const outcome = outcomes.find(o => o.id === parseInt(outcomeId));
        onChange(outcome);
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
                        disabled={loading || strands.length === 0}
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
                        disabled={loading || subStrands.length === 0}
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

            {/* Learning Outcome Selector (appears after sub-strand selected) */}
            {selectedSubStrand && (
                <div className="animate-in fade-in duration-300">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                        Learning Outcome <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedOutcome?.id || ''}
                        onChange={(e) => handleOutcomeChange(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                        disabled={loading || outcomes.length === 0}
                    >
                        <option value="">Select learning outcome...</option>
                        {outcomes.map(outcome => (
                            <option key={outcome.id} value={outcome.id}>
                                {outcome.description}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Selected Outcome Preview */}
            {selectedOutcome && (
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
