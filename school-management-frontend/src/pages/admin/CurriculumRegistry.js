import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const GenericModal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
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

const CurriculumRegistry = () => {
    const { get } = useApi();
    const { showToast } = useAppState();
    const [gradeLevels, setGradeLevels] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [learningAreas, setLearningAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                                        onManage={(a) => showToast(`Opening Governance for ${a.name}...`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CurriculumRegistry;
