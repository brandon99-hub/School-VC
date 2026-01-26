import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const GenericModal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-lg' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className={`bg-white rounded-[2rem] shadow-2xl ${maxWidth} w-full overflow-hidden animate-in zoom-in-95 duration-200`}>
                <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="px-8 py-6 bg-slate-50 border-t border-gray-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

const OutcomeItem = ({ outcome }) => (
    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 rounded-lg px-2 py-0.5 mt-0.5">{outcome.code}</span>
        <p className="text-sm font-semibold text-gray-700 leading-snug">{outcome.description}</p>
    </div>
);

const SubStrandItem = ({ sub, searchQuery }) => {
    const [expanded, setExpanded] = useState(false);

    // Auto-expand if searching outcomes
    useEffect(() => {
        if (searchQuery && sub.learning_outcomes?.some(o => o.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
            setExpanded(true);
        }
    }, [searchQuery, sub.learning_outcomes]);

    return (
        <div className="border-l-2 border-indigo-100 pl-4 py-3">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 group w-full text-left"
            >
                <span className={`w-5 h-5 rounded flex items-center justify-center transition-all ${expanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100'}`}>
                    <i className={`fas fa-chevron-right text-[8px] transition-transform ${expanded ? 'rotate-90' : ''}`}></i>
                </span>
                <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{sub.name}</span>
                <span className="text-[10px] font-mono text-gray-400">{sub.code}</span>
            </button>
            {expanded && (
                <div className="mt-4 space-y-3 pl-4 animate-in slide-in-from-left-2 duration-300">
                    {sub.learning_outcomes?.map(outcome => (
                        <OutcomeItem key={outcome.id} outcome={outcome} />
                    ))}
                </div>
            )}
        </div>
    );
};

const StrandItem = ({ strand, searchQuery }) => {
    const [expanded, setExpanded] = useState(false);

    // Auto-expand if searching sub-strands or outcomes
    useEffect(() => {
        if (searchQuery) {
            const matchesSub = strand.sub_strands?.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesOutcome = strand.sub_strands?.some(s => s.learning_outcomes?.some(o => o.description.toLowerCase().includes(searchQuery.toLowerCase())));
            if (matchesSub || matchesOutcome) setExpanded(true);
        }
    }, [searchQuery, strand.sub_strands]);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4 hover:border-indigo-100 transition-colors">
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${expanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${expanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-500'}`}>
                        <i className={`fas fa-layer-group text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
                    </div>
                    <div className="text-left">
                        <h5 className="font-black text-gray-900 text-sm uppercase tracking-tight">{strand.name}</h5>
                        <p className="text-[10px] font-mono text-gray-400 uppercase">{strand.code}</p>
                    </div>
                </div>
                <i className={`fas fa-chevron-down text-[10px] text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
            </button>
            {expanded && (
                <div className="px-8 pb-6 bg-slate-50/20 divide-y divide-gray-50 animate-in fade-in duration-300">
                    {strand.sub_strands?.map(sub => (
                        <SubStrandItem key={sub.id} sub={sub} searchQuery={searchQuery} />
                    ))}
                </div>
            )}
        </div>
    );
};

const LearningAreaCard = ({ area, onManage, searchQuery }) => {
    const [expanded, setExpanded] = useState(false);
    const { get } = useApi();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const data = await get(`/api/cbc/learning-areas/${area.id}/`);
            setDetails(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [area.id, get]);

    useEffect(() => {
        if (expanded && !details) fetchDetails();
    }, [expanded, details, fetchDetails]);

    // Auto-expand card if search query found in strands
    useEffect(() => {
        if (searchQuery && area.matchedInHierarchy) {
            setExpanded(true);
        }
    }, [searchQuery, area.matchedInHierarchy]);

    const stats = useMemo(() => {
        if (!details) return { strands: area.strands_count || 0, outcomes: 0 };
        const strands = details.strands?.length || 0;
        const outcomes = details.strands?.reduce((acc, s) => acc + (s.sub_strands?.reduce((acc2, ss) => acc2 + (ss.learning_outcomes?.length || 0), 0)), 0) || 0;
        return { strands, outcomes };
    }, [details, area.strands_count]);

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 overflow-hidden">
            <div className={`p-6 flex items-center justify-between ${expanded ? 'bg-slate-50/50' : ''}`}>
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expanded ? 'bg-[#18216D] text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-[#18216D] hover:text-[#18216D]'}`}
                    >
                        <i className={`fas fa-chevron-right transition-transform ${expanded ? 'rotate-90' : ''}`}></i>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight leading-none">{area.name}</h4>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 uppercase">{area.code}</span>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-widest">{area.grade_level_name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><i className="fas fa-layer-group text-indigo-400"></i> {stats.strands} Strands</span>
                            <span className="flex items-center gap-1.5"><i className="fas fa-bullseye text-blue-400"></i> {stats.outcomes} Outcomes</span>
                            {area.teacher_name && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1.5"><i className="fas fa-user-tie"></i> {area.teacher_name}</span>}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onManage(area)}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-black transition-all"
                >
                    Registry Admin
                </button>
            </div>
            {expanded && (
                <div className="p-6 pt-0 bg-white space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    {loading ? (
                        <div className="py-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] animate-pulse">Querying Knowledge Base...</div>
                    ) : (
                        <div className="pt-4 border-t border-gray-50">
                            {details?.strands?.map(strand => (
                                <StrandItem key={strand.id} strand={strand} searchQuery={searchQuery} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const LearningAreaManagerModal = ({ isOpen, onClose, area, onRefresh }) => {
    const { get, post, put, delete: del } = useApi();
    const { showToast } = useAppState();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editor, setEditor] = useState(null); // { type, mode, data, parentId }
    const [inlineEdit, setInlineEdit] = useState(null); // { type, id, field, value }
    const [areaEdit, setAreaEdit] = useState(false);

    const fetchDetails = useCallback(async () => {
        if (!area?.id) return;
        setLoading(true);
        try {
            const data = await get(`/api/cbc/learning-areas/${area.id}/`);
            setDetails(data);
        } catch (err) {
            showToast('Failed to load details', 'error');
        } finally {
            setLoading(false);
        }
    }, [area?.id, get, showToast]);

    useEffect(() => {
        if (isOpen) fetchDetails();
    }, [isOpen, fetchDetails]);

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());

        try {
            const endpoint = (editor.type === 'learning-outcome' ? '/api/cbc/learning-outcomes/' : `/api/cbc/${editor.type}s/`) + (editor.mode === 'edit' ? `${editor.data.id}/` : '');
            const method = editor.mode === 'edit' ? put : post;

            // Add parent link
            if (editor.mode === 'create') {
                if (editor.type === 'strand') payload.learning_area = editor.parentId;
                if (editor.type === 'sub-strand') payload.strand = editor.parentId;
                if (editor.type === 'learning-outcome') payload.sub_strand = editor.parentId;
            }

            await method(endpoint, payload);
            showToast(`${editor.type} saved successfully`, 'success');
            setEditor(null);
            fetchDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast(`Failed to save ${editor.type}: ${err.message}`, 'error');
        }
    };

    const handleInlineSave = async (type, id, field, newValue) => {
        try {
            const endpoint = (type === 'learning-outcome' ? `/api/cbc/learning-outcomes/${id}/` : `/api/cbc/${type}s/${id}/`);
            await put(endpoint, { [field]: newValue });
            showToast('Updated successfully', 'success');
            setInlineEdit(null);
            fetchDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast('Update failed', 'error');
        }
    };

    const handleAreaSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        try {
            await put(`/api/cbc/learning-areas/${area.id}/`, payload);
            showToast('Learning Area updated', 'success');
            setAreaEdit(false);
            fetchDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast('Update failed', 'error');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const endpoint = (type === 'learning-outcome' ? `/api/cbc/learning-outcomes/${id}/` : `/api/cbc/${type}s/${id}/`);
            await del(endpoint);
            showToast(`${type} deleted`, 'success');
            fetchDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            showToast(`Failed to delete ${type}`, 'error');
        }
    };

    return (
        <GenericModal isOpen={isOpen} onClose={onClose} title={`Governance: ${area?.name}`} maxWidth="max-w-4xl">
            <div className="space-y-6">
                {/* Learning Area Edit Section */}
                <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🏛️</span>
                            <div>
                                <h4 className="text-sm font-black text-[#18216D] uppercase tracking-widest leading-none">Learning Area Identity</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Managed Registry Node: {area?.code}</p>
                            </div>
                        </div>
                        {!areaEdit ? (
                            <button onClick={() => setAreaEdit(true)} className="px-4 py-2 bg-white text-[#18216D] border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                <i className="fas fa-edit mr-2"></i> Edit Identity
                            </button>
                        ) : (
                            <button onClick={() => setAreaEdit(false)} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                Cancel
                            </button>
                        )}
                    </div>

                    {areaEdit ? (
                        <form onSubmit={handleAreaSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Display Name</label>
                                <input name="name" defaultValue={details?.name} className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl font-bold text-sm" required />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registry Code</label>
                                <input name="code" defaultValue={details?.code} className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl font-bold text-sm" required />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="w-full py-3 bg-[#18216D] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20">
                                    Apply Changes to Registry
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex gap-6 mt-4">
                            <div className="bg-white p-3 rounded-2xl border border-indigo-50 flex-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Title</span>
                                <p className="text-xs font-black text-gray-900">{details?.name || area?.name}</p>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-indigo-50 w-32 text-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Code</span>
                                <p className="text-xs font-black text-indigo-600">{details?.code || area?.code}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center py-4 border-t border-slate-100">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Curriculum Components</h4>
                    <button
                        onClick={() => setEditor({ type: 'strand', mode: 'create', parentId: area.id })}
                        className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-black/10 hover:bg-black transition-all"
                    >
                        <i className="fas fa-plus mr-2"></i> Register New Strand
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Accessing Registry...</div>
                ) : (
                    <div className="space-y-4">
                        {details?.strands?.map(strand => (
                            <div key={strand.id} className="border border-slate-100 rounded-3xl p-5 bg-slate-50/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-[#18216D] text-white flex items-center justify-center text-[10px] shadow-lg">
                                            <i className="fas fa-layer-group"></i>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-[#18216D] uppercase tracking-wider leading-none">{strand.name}</h5>
                                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{strand.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditor({ type: 'sub-strand', mode: 'create', parentId: strand.id })} className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-100" title="Add Sub-strand">
                                            <i className="fas fa-plus text-[10px]"></i>
                                        </button>
                                        <button
                                            onClick={() => setInlineEdit({ type: 'strand', id: strand.id, field: 'name', value: strand.name })}
                                            className="p-2 bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm border border-slate-100"
                                        >
                                            <i className="fas fa-pen text-[10px]"></i>
                                        </button>
                                        <button onClick={() => handleDelete('strand', strand.id)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-all shadow-sm border border-slate-100">
                                            <i className="fas fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>

                                {inlineEdit?.id === strand.id && inlineEdit.type === 'strand' && (
                                    <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2">
                                        <input
                                            autoFocus
                                            className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                                            value={inlineEdit.value}
                                            onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                        />
                                        <button onClick={() => handleInlineSave('strand', strand.id, 'name', inlineEdit.value)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase">Save</button>
                                        <button onClick={() => setInlineEdit(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">Cancel</button>
                                    </div>
                                )}

                                <div className="ml-8 space-y-3">
                                    {strand.sub_strands?.map(sub => (
                                        <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-100 group-hover:bg-[#FFC425] transition-colors"></div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{sub.code}</span>
                                                    {inlineEdit?.id === sub.id && inlineEdit.type === 'sub-strand' ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                autoFocus
                                                                className="px-3 py-1 border border-indigo-200 rounded-lg text-[11px] font-black uppercase tracking-tight"
                                                                value={inlineEdit.value}
                                                                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                                            />
                                                            <button onClick={() => handleInlineSave('sub-strand', sub.id, 'name', inlineEdit.value)} className="text-green-500 hover:scale-110"><i className="fas fa-check"></i></button>
                                                            <button onClick={() => setInlineEdit(null)} className="text-slate-400"><i className="fas fa-times"></i></button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{sub.name}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setEditor({ type: 'learning-outcome', mode: 'create', parentId: sub.id })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Add Outcome">
                                                        <i className="fas fa-bullseye text-[10px]"></i>
                                                    </button>
                                                    <button onClick={() => setInlineEdit({ type: 'sub-strand', id: sub.id, field: 'name', value: sub.name })} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors">
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                    <button onClick={() => handleDelete('sub-strand', sub.id)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors">
                                                        <i className="fas fa-trash text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2">
                                                {sub.learning_outcomes?.map(outcome => (
                                                    <div key={outcome.id} className="flex items-start justify-between gap-3 bg-slate-50/50 p-2 rounded-xl group/out">
                                                        <div className="flex-1 flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5"></div>
                                                            {inlineEdit?.id === outcome.id && inlineEdit.type === 'learning-outcome' ? (
                                                                <div className="flex-1 flex gap-2">
                                                                    <textarea
                                                                        autoFocus
                                                                        rows={2}
                                                                        className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-[10px] font-bold text-slate-500 leading-tight resize-none"
                                                                        value={inlineEdit.value}
                                                                        onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                                                    />
                                                                    <div className="flex flex-col gap-1">
                                                                        <button onClick={() => handleInlineSave('learning-outcome', outcome.id, 'description', inlineEdit.value)} className="text-green-500 hover:scale-110"><i className="fas fa-check"></i></button>
                                                                        <button onClick={() => setInlineEdit(null)} className="text-slate-400"><i className="fas fa-times"></i></button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] font-bold text-slate-500 leading-tight">{outcome.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover/out:opacity-100 transition-opacity">
                                                            <button onClick={() => setInlineEdit({ type: 'learning-outcome', id: outcome.id, field: 'description', value: outcome.description })} className="text-[9px] text-slate-400 hover:text-indigo-600">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button onClick={() => handleDelete('learning-outcome', outcome.id)} className="text-[9px] text-slate-400 hover:text-rose-600">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editor && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[300] flex items-center justify-center p-4">
                    <form onSubmit={handleSave} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                {editor.mode === 'edit' ? 'Update' : 'New'} {editor.type.replace('-', ' ')}
                            </h4>
                            <button type="button" onClick={() => setEditor(null)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            {editor.type !== 'learning-outcome' ? (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                                        <input
                                            name="name"
                                            defaultValue={editor.data?.name || ''}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold text-sm"
                                            placeholder="e.g. Living Things"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Registry Code</label>
                                        <input
                                            name="code"
                                            defaultValue={editor.data?.code || ''}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold text-sm"
                                            placeholder="e.g. S1.1"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Outcome Code</label>
                                        <input
                                            name="code"
                                            defaultValue={editor.data?.code || ''}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                                        <textarea
                                            name="description"
                                            defaultValue={editor.data?.description || ''}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold text-sm resize-none"
                                        />
                                    </div>
                                </>
                            )}
                            <button
                                type="submit"
                                className="w-full py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <i className="fas fa-save mr-2"></i> Commit to Registry
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </GenericModal>
    );
};

const CurriculumRegistry = () => {
    const { get } = useApi();
    const { showToast } = useAppState();
    const [gradeLevels, setGradeLevels] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [learningAreas, setLearningAreas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [managerArea, setManagerArea] = useState(null);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    const handleManage = (area) => {
        setManagerArea(area);
        setIsManagerOpen(true);
    };

    const handleRefresh = useCallback(async () => {
        try {
            const areas = await get('/api/cbc/learning-areas/');
            setLearningAreas(areas || []);
        } catch (err) {
            console.error(err);
        }
    }, [get]);

    // Advanced search logic with hierarchy matching
    const filteredAreas = useMemo(() => {
        let items = learningAreas;

        // Grade Filter
        if (selectedGrade !== 'all') {
            items = items.filter(a => a.grade_level === parseInt(selectedGrade));
        }

        // Search Filter
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            const isStrandSearch = query.startsWith('strand:');
            const isSubjSearch = query.startsWith('subj:');
            const cleanQuery = query.replace('strand:', '').replace('subj:', '').trim();

            return items.filter(a => {
                const nameMatch = a.name.toLowerCase().includes(cleanQuery) || a.code.toLowerCase().includes(cleanQuery);

                // If it's a subtype search or we want deep matching
                if (isStrandSearch || (!isSubjSearch && cleanQuery.length > 2)) {
                    // We mark areas that match deep in their hierarchy if they have strands metadata
                    // For now we fuzzy match on area name if strand specific isn't available in list
                    // In a real scenario, we'd have strand names in the list payload or use a search endpoint
                    const strandMatch = (a.strands || []).some(s => s.name.toLowerCase().includes(cleanQuery));
                    if (strandMatch) a.matchedInHierarchy = true;
                    return nameMatch || strandMatch;
                }

                return nameMatch;
            });
        }

        return items;
    }, [learningAreas, selectedGrade, searchTerm]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [grades, areas] = await Promise.all([
                    get('/api/cbc/grade-levels/'),
                    get('/api/cbc/learning-areas/')
                ]);
                const sortedGrades = (grades || []).sort((a, b) => b.order - a.order);
                setGradeLevels(sortedGrades);
                setLearningAreas(areas || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [get]);

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden -m-8">
            {/* Minimal Grade Rail (Vertical) */}
            <aside className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-6 gap-3 z-10 flex-shrink-0">
                <button
                    onClick={() => setSelectedGrade('all')}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] uppercase flex items-center justify-center transition-all ${selectedGrade === 'all' ? 'bg-[#18216D] text-white shadow-lg' : 'text-slate-300 hover:bg-slate-50 hover:text-[#18216D]'}`}
                    title="All Levels"
                >
                    ALL
                </button>
                <div className="w-6 h-px bg-gray-100 my-2"></div>
                <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-3 no-scrollbar pb-6">
                    {gradeLevels.map(grade => (
                        <button
                            key={grade.id}
                            onClick={() => setSelectedGrade(grade.id)}
                            className={`w-10 h-10 rounded-xl font-black text-[10px] flex flex-col items-center justify-center transition-all ${selectedGrade === grade.id ? 'bg-[#FFC425] text-[#18216D] shadow-lg shadow-yellow-500/20' : 'text-slate-300 hover:bg-slate-50 hover:text-[#18216D]'}`}
                        >
                            <span className="text-[7px] leading-none mb-0.5 opacity-60">G</span>
                            <span className="text-sm leading-none">{grade.name.replace(/Grade\s*/i, '')}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Surface */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
                {/* Slim Header & Search Context */}
                <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between gap-8 z-10">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl relative group">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#18216D] transition-colors"></i>
                        <input
                            type="text"
                            placeholder="Search National Registry: Subjects, Strands, Sub-strands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] focus:bg-white transition-all font-bold text-gray-900 text-sm outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Context</span>
                            <span className="text-xs font-black text-gray-900 uppercase">
                                {selectedGrade === 'all' ? 'Universal Registry' : gradeLevels.find(g => g.id === selectedGrade)?.name}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-100"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Density</span>
                            <span className="text-xs font-black text-[#18216D] bg-[#18216D]/5 px-2 py-0.5 rounded-lg border border-[#18216D]/10">{filteredAreas.length} Nodes</span>
                        </div>
                    </div>
                </header>

                {/* Content scroll area */}
                <main className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {loading ? (
                            <div className="py-40 text-center animate-in fade-in duration-700">
                                <div className="space-y-4 flex flex-col items-center">
                                    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Synching National Registry...</p>
                                </div>
                            </div>
                        ) : filteredAreas.length === 0 ? (
                            <div className="bg-white rounded-[3rem] border border-gray-100 p-24 text-center mt-12 shadow-sm">
                                <div className="text-5xl mb-6">🛰️</div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Logic Void</h3>
                                <p className="text-gray-400 font-bold mt-2 italic lowercase tracking-wide">No curriculum nodes match this parameter set.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {filteredAreas.map(area => (
                                    <LearningAreaCard
                                        key={area.id}
                                        area={area}
                                        searchQuery={searchTerm}
                                        onManage={handleManage}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <LearningAreaManagerModal
                    isOpen={isManagerOpen}
                    onClose={() => setIsManagerOpen(false)}
                    area={managerArea}
                    onRefresh={handleRefresh}
                />
            </div>
        </div>
    );
};

export default CurriculumRegistry;
