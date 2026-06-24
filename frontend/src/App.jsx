import React, { useState, useEffect } from 'react';
import LoginView from './views/LoginView';
import SimuladorView from './views/SimuladorView';
import AdminView from './views/AdminView';
import questoesData from './questoes.json';

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [questoes, setQuestoes] = useState([]);

  // 🔄 CICLO 1: Carrega as questões e verifica se já existe uma sessão ativa no navegador
  useEffect(() => {
    setQuestoes(questoesData);

    const savedRole = localStorage.getItem('session_role');
    const savedName = localStorage.getItem('session_name');
    const savedId = localStorage.getItem('session_id');

    if (savedRole && savedName && savedId) {
      console.log("🔑 Sessão ativa encontrada para:", savedName);
      const sessionUser = { _id: savedId, nome: savedName, role: savedRole };
      setUser(sessionUser);
      
      if (savedRole === 'professor') {
        setView('admin');
      } else {
        setView('simulador');
      }
    }
  }, []);

  // 🔄 CICLO 2: Monitora o localStorage continuamente para detectar o clique do botão de Login
  useEffect(() => {
    const checarMudancaSessao = () => {
      const savedRole = localStorage.getItem('session_role');
      const savedName = localStorage.getItem('session_name');
      const savedId = localStorage.getItem('session_id');

      if (savedRole && savedName && savedId && !user) {
        const sessionUser = { _id: savedId, nome: savedName, role: savedRole };
        setUser(sessionUser);
        if (savedRole === 'professor') {
          setView('admin');
        } else {
          setView('simulador');
        }
      }
    };

    // Cria um intervalo rápido para checar o estado da sessão sem travar o render
    const interval = setInterval(checarMudancaSessao, 400);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setView('login');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      {view === 'login' && <LoginView />}
      
      {view === 'simulador' && user && (
        <SimuladorView 
          aluno={user} 
          setAluno={setUser} 
          questoes={questoes} 
          onLogout={handleLogout} 
        />
      )}
      
      {view === 'admin' && user && (
        <AdminView 
          professor={user}
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}