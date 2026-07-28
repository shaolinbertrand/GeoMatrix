import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importação das Telas/Views
import LoginView from '../views/LoginView';
import SimuladorView from '../views/SimuladorView';
import AdminView from '../views/AdminView';
import DashboardAlunoView from '../views/DashboardAlunoView'; // 👈 Adicionado o Dashboard!

export default function AppRoutes({ user, setUser, questoes, handleLogin, handleLogout }) {
  return (
    <Routes>
      {/* 1. ROTA DE LOGIN */}
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to={user.role === 'professor' ? '/admin' : '/simulador'} replace />
          ) : (
            <LoginView onLoginSuccess={handleLogin} />
          )
        } 
      />

      {/* 2. ROTA DO SIMULADOR (ALUNO) */}
      <Route 
        path="/simulador" 
        element={
          user && user.role === 'aluno' ? (
            <SimuladorView 
              aluno={user} 
              setAluno={setUser} 
              questoes={questoes} 
              onLogout={handleLogout} 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* 3. ROTA DO DASHBOARD (ALUNO) */}
      <Route 
        path="/dashboard" 
        element={
          user && user.role === 'aluno' ? (
            <DashboardAlunoView 
              aluno={user} 
              onLogout={handleLogout} 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* 4. ROTA DE ADMIN (PROFESSOR) */}
      <Route 
        path="/admin" 
        element={
          user && user.role === 'professor' ? (
            <AdminView 
              professor={user} 
              onLogout={handleLogout} 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* 5. ROTA CORINGA / PADRÃO (Redireciona qualquer URL inválida) */}
      <Route 
        path="*" 
        element={
          user ? (
            <Navigate to={user.role === 'professor' ? '/admin' : '/simulador'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
}