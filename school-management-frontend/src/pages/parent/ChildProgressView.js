import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ChildProgressView = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
    const [learningAreas, setLearningAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [expandedStrand, setExpandedStrand] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChildData();
        fetchLearningAreas();
    }, [childId]);

    useEffect(() => {
        if (selectedArea) {
            fetchProgressData();
        }
    }, [selectedArea]);

    const fetchChildData = async () => {
        try {
            const token = localStorage.getItem('parentAccessToken');
            const parentResponse = await axios.get('/api/parents/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const childData = parentResponse.data.children.find(c => c.id === parseInt(childId));
            setChild(childData);
        } catch (error) {
            console.error('Error fetching child data:', error);
        }
    };

    const fetchLearningAreas = async () => {
        try {
            const response = await axios.get('/api/cbc/learning-areas/');
            setLearningAreas(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedArea(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching learning areas:', error);
        }
    };

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('parentAccessToken');

            // Fetch strands
            const strandsResponse = await axios.get(`/api/cbc/learning-areas/${selectedArea}/strands/`);
            const strands = strandsResponse.data || [];

            // Fetch assessments
            const assessmentsResponse = await axios.get(
                `/api/cbc/competency-assessments/?student=${childId}&learning_area=${selectedArea}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const assessments = assessmentsResponse.data || [];

            // Build progress map
            const progressByOutcome = {};
            assessments.forEach(assessment => {
                progressByOutcome[assessment.learning_outcome] = {
                    competency_level: assessment.competency_level,
                    assessment_date: assessment.assessment_date,
                    teacher_comment: assessment.teacher_comment
                };
            });

            // Fetch detailed strand data
            const detailedStrands = await Promise.all(
                strands.map(async (strand) => {
                    const subStrandsResponse = await axios.get(`/api/cbc/strands/${strand.id}/sub-strands/`);
                    const subStrands = subStrandsResponse.data || [];

                    const detailedSubStrands = await Promise.all(
                        subStrands.map(async (subStrand) => {
                            const outcomesResponse = await axios.get(`/api/cbc/sub-strands/${subStrand.id}/learning-outcomes/`);
                            const outcomes = (outcomesResponse.data || []).map(outcome => ({
                                ...outcome,
                                ...progressByOutcome[outcome.id]
                            }));

                            return { ...subStrand, outcomes };
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

            setProgressData({ strands: detailedStrands });
        } catch (error) {
            console.error('Error fetching progress data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCompetencyBadge = (level) => {
        const badges = {
            'EE': { bg: 'bg-green-100', text: 'text-green-800', label: 'Exceeding Expectations', short: 'EE' },
            'ME': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Meeting Expectations', short: 'ME' },
            'AE': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Approaching Expectations', short: 'AE' },
            'BE': { bg: 'bg-red-100', text: 'text-red-800', label: 'Below Expectations', short: 'BE' }
        };
        return badges[level] || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Yet Assessed', short: 'N/A' };
    };

    if (!child) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => navigate('/parent/dashboard')}
                        className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {child.first_name}'s Progress
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Grade {child.grade}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Learning Area Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Learning Area
                    </label>
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

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : progressData ? (
                    <div className="space-y-4">
                        {progressData.strands.map(strand => (
                            <div key={strand.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <button
                                    onClick={() => setExpandedStrand(expandedStrand === strand.id ? null : strand.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-gray-900">{strand.name}</h3>
                                        <span className="text-sm text-gray-500">
                                            {strand.completedOutcomes}/{strand.totalOutcomes} assessed
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

                                {/* Sub-Strands */}
                                {expandedStrand === strand.id && (
                                    <div className="px-6 pb-4 space-y-4 animate-fadeIn">
                                        {strand.subStrands.map(subStrand => (
                                            <div key={subStrand.id} className="pl-4 border-l-2 border-gray-200">
                                                <div className="font-medium text-gray-800 mb-3">{subStrand.name}</div>
                                                <div className="space-y-2">
                                                    {subStrand.outcomes.map(outcome => {
                                                        const badge = getCompetencyBadge(outcome.competency_level);
                                                        return (
                                                            <div key={outcome.id} className="bg-gray-50 rounded-lg p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <p className="text-sm text-gray-700 flex-1">{outcome.description}</p>
                                                                    <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm font-medium rounded-full ml-4 whitespace-nowrap`}>
                                                                        {badge.short}
                                                                    </span>
                                                                </div>
                                                                {outcome.assessment_date && (
                                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                                        <p className="text-xs text-gray-500 mb-1">
                                                                            Assessed: {new Date(outcome.assessment_date).toLocaleDateString()}
                                                                        </p>
                                                                        {outcome.teacher_comment && (
                                                                            <p className="text-sm text-gray-600 italic">
                                                                                "{outcome.teacher_comment}"
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
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
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ChildProgressView;
