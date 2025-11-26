// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {AuthProvider} from './context/AuthContext';
import {AppStateProvider} from './context/AppStateContext';
import reportWebVitals from './reportWebVitals';

// @ts-ignore
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <AppStateProvider>
            <AuthProvider>
                <App/>
            </AuthProvider>
        </AppStateProvider>
    </React.StrictMode>
);

reportWebVitals();