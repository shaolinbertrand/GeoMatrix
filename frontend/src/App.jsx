import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginView from './views/LoginView';
import AdminView from './views/AdminView';
import SimuladorView from './views/SimuladorView';
import './index.css';

// Componente de Proteção de Rota
const ProtectedRoute = ({ children, roleRequired }) => {
    const role = localStorage.getItem('session_role');
    const id = localStorage.getItem('session_id');

    if (!role || (roleRequired === 'aluno' && !id)) {
        return <Navigate to="/" replace />;
    }
    if (roleRequired && role !== roleRequired) {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginView />} />
                <Route path="/admin" element={
                    <ProtectedRoute roleRequired="professor">
                        <AdminView />
                    </ProtectedRoute>
                } />
                <Route path="/simulador" element={
                    <ProtectedRoute roleRequired="aluno">
                        <SimuladorView />
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}