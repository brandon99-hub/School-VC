/**
 * CBC Utility Functions
 * Standardizes competency level calculations across the platform.
 */

export const CBC_LEVELS = [
    { code: 'EE', label: 'Exceeding Expectations', min: 90, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { code: 'ME', label: 'Meeting Expectations', min: 70, color: 'text-[#18216D]', bg: 'bg-amber-50' },
    { code: 'AE', label: 'Approaching Expectations', min: 40, color: 'text-amber-600', bg: 'bg-orange-50' },
    { code: 'BE', label: 'Below Expectations', min: 0, color: 'text-rose-600', bg: 'bg-rose-50' }
];

export const calculateLevel = (score, total) => {
    if (!total || total === 0) return 'BE';
    const percentage = (score / total) * 100;

    if (percentage >= 90) return 'EE';
    if (percentage >= 70) return 'ME';
    if (percentage >= 40) return 'AE';
    return 'BE';
};

export const getLevelData = (code) => {
    return CBC_LEVELS.find(l => l.code === code) || CBC_LEVELS[2]; // Default to AE if not found
};
