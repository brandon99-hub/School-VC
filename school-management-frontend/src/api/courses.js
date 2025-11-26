import api from './Client';

/**
 * Enrolls the logged-in student in a course.
 * @param {number} courseId - The ID of the course to enroll in.
 * @returns {Promise<object>} The response data from the API.
 */
export const enrollStudent = async (courseId) => {
    // Note: the enrollment endpoint is registered under the auth group:
    // path('enroll/', enroll_course, name='enroll_course')
    const response = await api.post('/api/auth/enroll/', { course_id: courseId });
    return response.data;
};
