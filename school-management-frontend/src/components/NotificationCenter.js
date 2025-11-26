import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

const NotificationCenter = () => {
    const { get } = useApi();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            const data = await get('/notifications/');
            setNotifications(data);
        };
        fetchNotifications();
    }, [get]);

    return (
        <div>
            <h2>Notifications</h2>
            <ul>
                {notifications.map(notification => (
                    <li key={notification.id}>{notification.message}</li>
                ))}
            </ul>
        </div>
    );
};

export default NotificationCenter;