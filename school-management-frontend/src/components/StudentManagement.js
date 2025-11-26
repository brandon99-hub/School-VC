import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

const StudentManagement = () => {
    const { get } = useApi();
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            const data = await get('/students/');
            setStudents(data);
        };
        fetchStudents();
    }, [get]);

    return (
        <div>
            <h2>Student Management</h2>
            <ul>
                {students.map(student => (
                    <li key={student.id}>{student.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default StudentManagement;