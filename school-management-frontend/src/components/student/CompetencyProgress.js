import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const CompetencyProgress = ({ studentId }) => {
    const { get } = useApi();
    const [learningAreas, setLearningAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [expandedStrand, setExpandedStrand] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLearningAreas();
    }, [studentId]);

    useEffect(() => {
        if (selectedArea) {
            fetchProgressData();
        }
    }, [selectedArea]);

    const fetchLearningAreas = async () => {
        try {
            const response = await get('/api/cbc/learning-areas/');
            setLearningAreas(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedArea(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching learning areas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            // Fetch strands for the learning area
            const strandsResponse = await get(`/api/cbc/learning-areas/${selectedArea}/strands/`);
            const strands = strandsResponse.data || [];

            // Fetch competency assessments for the student
            const assessmentsResponse = await get(`/api/cbc/competency-assessments/?student=${studentId}&learning_area=${selectedArea}`);
            const assessments = assessmentsResponse.data || [];

            // Build progress data structure
            const progressByOutcome = {};
            assessments.forEach(assessment => {
                progressByOutcome[assessment.learning_outcome] = {
                    competency_level: assessment.competency_level,
                    last_assessed: assessment.assessment_date,
                    teacher_comment: assessment.teacher_comment
                };
            });

            // Fetch detailed strand data with sub-strands and outcomes
            const detailedStrands = await Promise.all(
                strands.map(async (strand) => {
                    const subStrandsResponse = await get(`/api/cbc/strands/${strand.id}/sub-strands/`);
                    const subStrands = subStrandsResponse.data || [];

                    const detailedSubStrands = await Promise.all(
                        subStrands.map(async (subStrand) => {
                            const outcomesResponse = await get(`/api/cbc/sub-strands/${subStrand.id}/learning-outcomes/`);
                            const outcomes = (outcomesResponse.data || []).map(outcome => ({
                                ...outcome,
                                ...progressByOutcome[outcome.id]
                            }));

                            return {
                                ...subStrand,
                                outcomes
                            };
                        })
                    );

                    const totalOutcomes = detailedSubStrands.reduce((sum, ss) => sum + ss.outcomes.length, 0);
                    const completedOutcomes = detailedSubStrands.reduce(
                        (sum, ss) => sum + ss.outcomes.filter(o => o.competency_level).length,
                        0
                    );

                    return {
                        ...strand,
                        subStrands: detailedSubStrands,
                        totalOutcomes,
                        completedOutcomes
                    };
                })
            );

            setProgressData({
                strands: detailedStrands,
                assessments
            });
        } catch (error) {
            console.error('Error fetching progress data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStrand = (strandId) => {
        setExpandedStrand(expandedStrand === strandId ? null : strandId);
    };

    const getCompetencyBadge = (level) => {
        const badges = {
            'EE': { bg: 'bg-green-100', text: 'text-green-800', label: 'EE' },
            'ME': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ME' },
            'AE': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'AE' },
            'BE': { bg: 'bg-red-100', text: 'text-red-800', label: 'BE' }
        };
        return badges[level] || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not assessed' };
    };

    const calculateOverallStats = () => {
        if (!progressData) return { EE: 0, ME: 0, AE: 0, BE: 0, total: 0, percentage: 0 };

        const stats = { EE: 0, ME: 0, AE: 0, BE: 0 };
        let totalAssessed = 0;
        let totalOutcomes = 0;

        progressData.strands.forEach(strand => {
            strand.subStrands.forEach(subStrand => {
                subStrand.outcomes.forEach(outcome => {
                    totalOutcomes++;
                    if (outcome.competency_level) {
                        stats[outcome.competency_level]++;
                        totalAssessed++;
                    }
                });
            });
        });

        return {
            ...stats,
            total: totalAssessed,
            totalOutcomes,
            percentage: totalOutcomes > 0 ? Math.round((totalAssessed / totalOutcomes) * 100) : 0
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const stats = calculateOverallStats();

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">My Progress</h2>
                <p className="text-gray-600 mt-1">Track your competency development</p>
            </div>

            {/* Learning Area Selector */}
            <div className="mb-6">
                <select
                    value={selectedArea || ''}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    {learningAreas.map(area => (
                        <option key={area.id} value={area.id}>
                            {area.name} - {area.grade_level_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Overall Progress */}
            {progressData && (
                <>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
                            <span className="text-3xl font-bold text-blue-600">{stats.percentage}%</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-3 mb-4">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${stats.percentage}%` }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-green-600">{stats.EE}</div>
                                <div className="text-xs text-gray-600">EE</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{stats.ME}</div>
                                <div className="text-xs text-gray-600">ME</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{stats.AE}</div>
                                <div className="text-xs text-gray-600">AE</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">{stats.BE}</div>
                                <div className="text-xs text-gray-600">BE</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-4 text-center">
                            {stats.total} of {stats.totalOutcomes} learning outcomes assessed
                        </p>
                    </div>

                    {/* Strands */}
                    {progressData.strands.map(strand => (
                        <div key={strand.id} className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                            <button
                                onClick={() => toggleStrand(strand.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900">{strand.name}</h3>
                                    <span className="text-sm text-gray-500">
                                        {strand.completedOutcomes}/{strand.totalOutcomes} completed
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(strand.completedOutcomes / strand.totalOutcomes) * 100}%` }}
                                        ></div>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 transition-transform ${expandedStrand === strand.id ? 'rotate-180' : ''}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </button>

                            {/* Sub-Strands (expanded) */}
                            {expandedStrand === strand.id && (
                                <div className="px-6 pb-4 space-y-3 animate-fadeIn">
                                    {strand.subStrands.map(subStrand => (
                                        <div key={subStrand.id} className="pl-4 border-l-2 border-gray-200">
                                            <div className="font-medium text-gray-800 mb-2">{subStrand.name}</div>
                                            <div className="space-y-2">
                                                {subStrand.outcomes.map(outcome => {
                                                    const badge = getCompetencyBadge(outcome.competency_level);
                                                    return (
                                                        <div key={outcome.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-700">{outcome.description}</p>
                                                                {outcome.last_assessed && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Last assessed: {new Date(outcome.last_assessed).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm font-medium rounded-full`}>
                                                                    {badge.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default CompetencyProgress;
