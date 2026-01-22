import React, { useState } from 'react';

const CollapsibleSection = ({ id, title, description, children, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div id={id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
            >
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
                </div>
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-600 text-xl ml-4`}></i>
            </button>
            {isExpanded && (
                <div className="px-6 py-4 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
