import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api';

export default function SimuladorView() {
    const [carregando, setCarregando] = useState(true);
    const [atividadeConcluida, setAtividadeConcluida] = useState(false);
    const [mensagemFim, setMensagemFim] = useState('');
    
    // Dados da questão atual entregue pela IA
    const [questao, setQuestao] = useState(null);
    
    // Controle de resposta do aluno
    const [opcaoSelecionada, setOpcaoSelecionada] = useState('');
    const [respostaDiscursiva, setRespostaDiscursiva] = useState('');
    
    // Feedback pós-envio (incluindo a gamificação)
    const [respondido, setRespondido] = useState(false);
    const [resultado, setResultado] = useState({ 
        acertou: false, 
        gabaritoOficial: '', 
        pontosGanhos: 0, 
        pontuacaoTotal: 0 
    });

    const navigate = useNavigate();
    const token = localStorage.getItem('geomatrix_token');
    const nomeTurma = localStorage.getItem('session_turma');

    // 1. BUSCA A QUESTÃO ADAPTATIVA DA IA
    const buscarProximaQuestao = async () => {
        setCarregando(true);
        setRespondido(false);
        setOpcaoSelecionada('');
        setRespostaDiscursiva('');
        
        try {
            const response = await fetch(`${BASE_URL}/proxima`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const dados = await response.json();

            if (response.status === 401 || response.status === 403) {
                executarLogout();
                return;
            }

            if (dados.concluido) {
                setAtividadeConcluida(true);
                setMensagemFim(dados.message);
            } else {
                setQuestao(dados.questao);
            }
        } catch (err) {
            console.error("Erro ao buscar próxima questão:", err);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }
        buscarProximaQuestao();
    }, []);

    // 2. SUBMETE A RESPOSTA PARA O BACK-END VALIDAR
    const enviarResposta = async (e) => {
        e.preventDefault();

        const respostaFinal = questao?.tipo === 'objetiva' ? opcaoSelecionada : respostaDiscursiva;

        if (!respostaFinal) {
            alert("Por favor, selecione ou escreva uma resposta antes de enviar.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/submeter`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questaoId: questao?.id,
                    respostaAluno: respostaFinal
                })
            });
            const dados = await response.json();

            if (response.ok) {
                setRespondido(true);
                setResultado({
                    acertou: dados.acertou,
                    gabaritoOficial: dados.gabaritoOficial,
                    pontosGanhos: dados.pontosGanhos || 0,
                    pontuacaoTotal: dados.pontuacaoTotal || 0
                });
            } else {
                alert(dados.error || "Erro ao processar resposta.");
            }
        } catch (err) {
            console.error("Erro ao submeter resposta:", err);
        }
    };

    // 3. LOGOUT E LIMPEZA DE SESSÃO
    const executarLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (carregando) return <div className="loading-box">Carregando sua próxima trilha no GeoMatrix...</div>;

    if (atividadeConcluida) {
        return (
            <div className="simulador-container" style={{ padding: '2rem' }}>
                <div className="panel text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2>🎉 Atividade Concluída!</h2>
                    <p style={{ margin: '1.5rem 0', fontSize: '1.2rem' }}>{mensagemFim}</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn-login" onClick={() => navigate('/dashboard')} style={{ background: '#3498db' }}>
                            📊 Ver Meu Dashboard
                        </button>
                        <button className="btn-login" onClick={executarLogout} style={{ background: '#e74c3c' }}>
                            🚪 Sair do Sistema
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="simulador-container" style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* 🧭 BARRA DE MENU SUPERIOR (NAVBAR) */}
            <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                background: '#ffffff', 
                padding: '0.8rem 1.2rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0'
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                    📐 GeoMatrix
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        style={{ background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        📊 Meu Progresso
                    </button>
                    <button 
                        onClick={executarLogout} 
                        style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🚪 Sair
                    </button>
                </div>
            </div>

            {/* CARD PRINCIPAL DA QUESTÃO */}
            <div className="panel" style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                
                {/* Header do Tópico e Turma */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.8rem' }}>
                    <div>
                        <span className="badge-turma" style={{ background: '#4A90E2', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                            {nomeTurma || 'Turma Ativa'}
                        </span>
                        <h4 style={{ marginTop: '0.5rem', color: '#555' }}>Tópico: {questao?.assunto}</h4>
                    </div>
                    <span style={{ fontSize: '0.85rem', background: '#f0f0f0', padding: '0.3rem 0.6rem', borderRadius: '4px', color: '#666', textTransform: 'capitalize' }}>
                        Dificuldade: <strong>{questao?.dificuldade}</strong>
                    </span>
                </div>

                {/* Conteúdo da Questão */}
                <div className="questao-card">
                    <p style={{ fontSize: '1.15rem', fontWeight: '500', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        <strong>Questão {questao?.numero}:</strong> {questao?.enunciado}
                    </p>

                    <form onSubmit={enviarResposta}>
                        {/* Renderização Objetiva ou Discursiva */}
                        {questao?.tipo === 'objetiva' ? (
                            <div className="opcoes-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {questao?.opcoes?.map((opcao, idx) => (
                                    <label 
                                        key={idx} 
                                        style={{ 
                                            padding: '0.8rem', 
                                            border: '1px solid #ccc', 
                                            borderRadius: '6px', 
                                            cursor: respondido ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: opcaoSelecionada === opcao ? '#eef5fc' : '#fff'
                                        }}
                                    >
                                        <input 
                                            type="radio" 
                                            name="opcao" 
                                            value={opcao}
                                            disabled={respondido}
                                            checked={opcaoSelecionada === opcao}
                                            onChange={(e) => setOpcaoSelecionada(e.target.value)}
                                        />
                                        {opcao}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="discursiva-container">
                                <textarea 
                                    rows="4" 
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
                                    placeholder="Escreva sua resposta passo a passo aqui..."
                                    value={respostaDiscursiva}
                                    disabled={respondido}
                                    onChange={(e) => setRespostaDiscursiva(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Botões de Submissão e Avanço */}
                        {!respondido ? (
                            <button type="submit" className="btn-login" style={{ marginTop: '1.5rem', width: '100%', background: '#3498db', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                                Confirmar e Enviar Resposta
                            </button>
                        ) : (
                            <button type="button" className="btn-login" onClick={buscarProximaQuestao} style={{ marginTop: '1.5rem', width: '100%', background: '#2ecc71', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                                Avançar para Próxima Questão (IA) 🚀
                            </button>
                        )}
                    </form>
                </div>

                {/* Bloco de Feedback e Gamificação */}
                {respondido && (
                    <div 
                        className="feedback-box"
                        style={{ 
                            marginTop: '1.5rem', 
                            padding: '1rem', 
                            borderRadius: '6px', 
                            background: resultado.acertou ? '#d4edda' : '#f8d7da',
                            color: resultado.acertou ? '#155724' : '#721c24',
                            border: `1px solid ${resultado.acertou ? '#c3e6cb' : '#f5c6cb'}`
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, fontSize: '1.1rem' }}>
                                {resultado.acertou ? "🎯 Excelente! Você acertou!" : "❌ Resposta Incorreta."}
                            </h5>
                            {resultado.acertou && resultado.pontosGanhos > 0 && (
                                <span style={{ background: '#2e7d32', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    +{resultado.pontosGanhos} pts! ⭐
                                </span>
                            )}
                        </div>

                        <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            <strong>Solução/Gabarito:</strong> {resultado.gabaritoOficial}
                        </p>
                        
                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#555' }}>
                            {resultado.acertou 
                                ? "O motor de IA subiu sua proficiência. Prepare-se para um desafio maior!" 
                                : "O GeoMatrix recalibrou sua trilha para te ajudar a fixar a base deste conteúdo."}
                        </small>
                    </div>
                )}

            </div>
        </div>
    );
}