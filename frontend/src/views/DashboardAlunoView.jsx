import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api';

export default function DashboardAlunoView() {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                const token = localStorage.getItem('geomatrix_token') || localStorage.getItem('token') || localStorage.getItem('session_token');

                const res = await fetch(`${BASE_URL}/alunos/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setDados(data);
                } else {
                    const resFallback = await fetch(`${BASE_URL}/dashboard`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (resFallback.ok) {
                        const dataFallback = await resFallback.json();
                        setDados(dataFallback);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar dados do Dashboard:", err);
            } finally {
                setCarregando(false);
            }
        };

        carregarDashboard();
    }, []);

    if (carregando) {
        return <div className="loading-box" style={{ padding: '2rem', textAlign: 'center' }}>Carregando estatísticas do GeoMatrix...</div>;
    }

    const mapaNivel = {
        1: 'Iniciante (Fácil)',
        2: 'Intermediário (Médio)',
        3: 'Avançado (Difícil)'
    };

    return (
        <div className="simulador-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

            {/* CABEÇALHO DA PÁGINA */}
            <div className="panel" style={{ textAlign: 'left', marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>
                    Olá, {dados?.nome || localStorage.getItem('session_name') || 'Estudante'}! 👋
                </h2>
                <p style={{ color: '#666', marginTop: '0.5rem' }}>Acompanhe sua taxa de acerto e nível de proficiência calculados pelo GeoMatrix.</p>
            </div>

            {/* CARDS DE PONTUAÇÃO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="panel" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', borderLeft: '6px solid #4CAF50', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: 0, color: '#555', fontSize: '1.1rem' }}>🏆 Pontuação Total</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2e7d32', margin: '0.5rem 0' }}>
                        {dados?.pontuacaoTotal ?? 0} pts
                    </p>
                </div>

                <div className="panel" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', borderLeft: '6px solid #2196F3', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: 0, color: '#555', fontSize: '1.1rem' }}>🎯 Desafios Superados</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1565c0', margin: '0.5rem 0' }}>
                        {dados?.desafiosConcluidos ?? 0}
                    </p>
                </div>
            </div>

            {/* PROGRESSO E ESTATÍSTICAS POR TÓPICO */}
            <div className="panel" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#2c3e50', margin: 0 }}>📚 Seu Desempenho Por Tópico</h3>
                <hr style={{ margin: '1rem 0', opacity: 0.15 }} />

                {dados?.assuntosEmAndamento && dados.assuntosEmAndamento.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {dados.assuntosEmAndamento.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '1.2rem',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    background: '#fafafa'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1.05rem', fontWeight: '600' }}>
                                        {item.assunto}
                                    </h4>

                                    <span
                                        style={{
                                            padding: '0.3rem 0.7rem',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            backgroundColor: '#e8f5e9',
                                            color: '#2e7d32',
                                            border: '1px solid #c8e6c9'
                                        }}
                                    >
                                        Nível IA: {mapaNivel[item.nivelProficiencia] || 'Intermediário (Médio)'}
                                    </span>
                                </div>

                                {/* Detalhamento numérico */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', color: '#555', marginBottom: '0.6rem' }}>
                                    <span>{item.questoesRespondidasCount} {item.questoesRespondidasCount === 1 ? 'questão respondida' : 'questões respondidas'}</span>
                                    <div>
                                        <strong style={{ color: '#2e7d32', marginRight: '1rem' }}>✅ {item.porcentagemAcerto}% Acertos ({item.acertos})</strong>
                                        <strong style={{ color: '#c62828' }}>❌ {item.porcentagemErro}% Erros ({item.erros})</strong>
                                    </div>
                                </div>

                                {/* Barra Visual de Progresso (Verde x Vermelho) */}
                                <div style={{ width: '100%', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                    <div 
                                        style={{ 
                                            width: `${item.porcentagemAcerto}%`, 
                                            backgroundColor: '#4CAF50', 
                                            height: '100%',
                                            transition: 'width 0.5s ease-in-out'
                                        }} 
                                        title={`Acertos: ${item.porcentagemAcerto}%`}
                                    />
                                    <div 
                                        style={{ 
                                            width: `${item.porcentagemErro}%`, 
                                            backgroundColor: '#e74c3c', 
                                            height: '100%',
                                            transition: 'width 0.5s ease-in-out'
                                        }} 
                                        title={`Erros: ${item.porcentagemErro}%`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#666' }}>Você ainda não iniciou nenhuma trilha de exercícios.</p>
                )}

                <button
                    style={{ marginTop: '1.5rem', width: '100%', background: '#3498db', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
                    onClick={() => navigate('/simulador')}
                >
                    Ir para o Simulador de Questões 🚀
                </button>
            </div>
        </div>
    );
}