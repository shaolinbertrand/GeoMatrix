import React, { useState, useEffect } from 'react';
import AppRoutes from './routes/AppRoutes'; // Seu arquivo de rotas
import questoesData from './questoes.json';
import './App.css';
export default function App() {
  const [user, setUser] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuestoes(questoesData);

    const savedRole = localStorage.getItem('session_role');
    const savedName = localStorage.getItem('session_name');
    const savedId = localStorage.getItem('session_id');

    if (savedRole && savedName && savedId) {
      setUser({ _id: savedId, nome: savedName, role: savedRole });
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('session_role', userData.role);
    localStorage.setItem('session_name', userData.nome);
    localStorage.setItem('session_id', userData._id);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) {
    return <div className="loading-box">Carregando o GeoMatrix...</div>;
  }

  // 🔴 REMOVEMOS O <BrowserRouter> DAQUI!
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <AppRoutes 
        user={user} 
        setUser={setUser} 
        questoes={questoes} 
        handleLogin={handleLogin} 
        handleLogout={handleLogout} 
      />
    </div>
  );
}