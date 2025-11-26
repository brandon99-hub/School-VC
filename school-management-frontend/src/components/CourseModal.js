import React from 'react';

const CourseModal = ({ availableCourses, enrolledCourseIds, onEnroll, onClose, currentPage, totalPages, onPageChange }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-full max-w-2xl p-6 relative">
                {/* Close button in the top-right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 focus:outline-none"
                    aria-label="Close modal"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
                <h3 id="modal-title" className="font-bold text-2xl text-gray-800 mb-6">Available Courses</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                    {availableCourses.map(course => {
                        const isEnrolled = enrolledCourseIds.includes(course.id);
                        return (
                            <div key={course.id} className="border-b pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-lg text-gray-800">{course.name}</h4>
                                        <p className="text-sm text-gray-500">{course.teacher}</p>
                                    </div>
                                    <button
                                        onClick={() => onEnroll(course.id)}
                                        className={`px-4 py-2 rounded transition-colors ${
                                            isEnrolled
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                        disabled={isEnrolled}
                                    >
                                        {isEnrolled ? 'Enrolled' : 'Enroll'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => onPageChange(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseModal;
