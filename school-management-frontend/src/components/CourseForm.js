import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const CourseForm = ({ course, onSave }) => {
    const { get, post, put } = useApi();
    const [formData, setFormData] = useState(course || { name: '', teacher: '' });
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        const fetchTeachers = async () => {
            const data = await get('/teachers/');
            setTeachers(data);
        };
        fetchTeachers();
    }, [get]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (course) {
            await put(`/courses/${course.id}/`, formData);
        } else {
            await post('/courses/', formData);
        }
        onSave();
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Course Name"
            />
            <select
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
            >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
            </select>
            <button type="submit">Save</button>
        </form>
    );
};

export default CourseForm;