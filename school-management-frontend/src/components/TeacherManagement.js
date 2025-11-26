import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

const TeacherManagement = () => {
    const { get } = useApi();
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        const fetchTeachers = async () => {
            const data = await get('/teachers/');
            setTeachers(data);
        };
        fetchTeachers();
    }, [get]);

    return (
        <div>
            <h2>Teacher Management</h2>
            <ul>
                {teachers.map(teacher => (
                    <li key={teacher.id}>{teacher.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default TeacherManagement;