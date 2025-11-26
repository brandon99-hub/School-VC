import api from './Client';

// src/api/grades.js
export const submitAssignment = async (gradeId, score, letterGrade) => {
  const response = await api.put(`/api/grades/${gradeId}/submit_assignment/`, { score, letter_grade: letterGrade });
  return response.data;
};