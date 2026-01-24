import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TemplateLibrary = ({ onSelectTemplate, learningAreaId, onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        learning_area: learningAreaId || '',
        grade_level: '',
        description: '',
        criteria_ee: '',
        criteria_me: '',
        criteria_ae: '',
        criteria_be: '',
        is_shared: false
    });

    useEffect(() => {
        fetchTemplates();
    }, [learningAreaId]);

    useEffect(() => {
        // Filter templates by search term
        if (searchTerm) {
            setFilteredTemplates(
                templates.filter(t =>
                    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredTemplates(templates);
        }
    }, [searchTerm, templates]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            let url = '/api/cbc/templates/';
            if (learningAreaId) {
                url += `?learning_area=${learningAreaId}`;
            }
            const response = await axios.get(url);
            setTemplates(response.data);
            setFilteredTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/cbc/templates/', formData);
            setShowCreateForm(false);
            fetchTemplates();
            resetForm();
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create template');
        }
    };

    const handleUseTemplate = async (template) => {
        try {
            // Increment usage count
            await axios.post(`/api/cbc/templates/${template.id}/use-template/`);

            // Pass template data to parent
            if (onSelectTemplate) {
                onSelectTemplate({
                    criteria_ee: template.criteria_ee,
                    criteria_me: template.criteria_me,
                    criteria_ae: template.criteria_ae,
                    criteria_be: template.criteria_be
                });
            }

            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Error using template:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            learning_area: learningAreaId || '',
            grade_level: '',
            description: '',
            criteria_ee: '',
            criteria_me: '',
            criteria_ae: '',
            criteria_be: '',
            is_shared: false
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Assessment Template Library</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Search & Actions */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                        {showCreateForm ? 'Cancel' : '+ New Template'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {showCreateForm ? (
                    /* Create Form */
                    <form onSubmit={handleCreateTemplate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Grade 4 Math - Addition"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="2"
                                placeholder="When to use this template..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Exceeding Expectations (EE)</label>
                                <textarea
                                    value={formData.criteria_ee}
                                    onChange={(e) => setFormData({ ...formData, criteria_ee: e.target.value })}
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Expectations (ME)</label>
                                <textarea
                                    value={formData.criteria_me}
                                    onChange={(e) => setFormData({ ...formData, criteria_me: e.target.value })}
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Approaching Expectations (AE)</label>
                                <textarea
                                    value={formData.criteria_ae}
                                    onChange={(e) => setFormData({ ...formData, criteria_ae: e.target.value })}
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Below Expectations (BE)</label>
                                <textarea
                                    value={formData.criteria_be}
                                    onChange={(e) => setFormData({ ...formData, criteria_be: e.target.value })}
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_shared}
                                onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label className="text-sm text-gray-700">Share with other teachers</label>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create Template
                        </button>
                    </form>
                ) : (
                    /* Template List */
                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-center py-8 text-gray-500">Loading templates...</p>
                        ) : filteredTemplates.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">
                                {searchTerm ? 'No templates found' : 'No templates available. Create one!'}
                            </p>
                        ) : (
                            filteredTemplates.map(template => (
                                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{template.learning_area_name} - {template.grade_level_name}</p>
                                            {template.description && (
                                                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                Used {template.usage_count} times • Created by {template.created_by_name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUseTemplate(template)}
                                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                                        >
                                            Use Template
                                        </button>
                                    </div>

                                    {/* Preview criteria */}
                                    <details className="mt-3">
                                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                                            Preview Criteria
                                        </summary>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-green-50 p-2 rounded">
                                                <strong className="text-green-800">EE:</strong>
                                                <p className="text-gray-700 mt-1">{template.criteria_ee}</p>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded">
                                                <strong className="text-blue-800">ME:</strong>
                                                <p className="text-gray-700 mt-1">{template.criteria_me}</p>
                                            </div>
                                            <div className="bg-yellow-50 p-2 rounded">
                                                <strong className="text-yellow-800">AE:</strong>
                                                <p className="text-gray-700 mt-1">{template.criteria_ae}</p>
                                            </div>
                                            <div className="bg-red-50 p-2 rounded">
                                                <strong className="text-red-800">BE:</strong>
                                                <p className="text-gray-700 mt-1">{template.criteria_be}</p>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateLibrary;
