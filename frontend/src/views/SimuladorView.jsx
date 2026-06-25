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
    
    // Feedback pós-envio
    const [respondido, setRespondido] = useState(false);
    const [resultado, setResultado] = useState({ acertou: false, gabaritoOficial: '' });

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
                    // 🎯 CORRIGIDO: Envia o _id do MongoDB para validação no back-end
                    questaoId: questao?.id,
                    respostaAluno: respostaFinal
                })
            });
            const dados = await response.json();

            if (response.ok) {
                setRespondido(true);
                setResultado({
                    acertou: dados.acertou,
                    gabaritoOficial: dados.gabaritoOficial
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
        navigate('/');
    };

    if (carregando) return <div className="loading-box">Carregando sua próxima trilha no GeoMatrix...</div>;

    if (atividadeConcluida) {
        return (
            <div className="simulador-container">
                <div className="panel text-center">
                    <h2>Atividade Concluída!</h2>
                    <p style={{ margin: '1.5rem 0', fontSize: '1.2rem' }}>{mensagemFim}</p>
                    <button className="btn-login" onClick={executarLogout}>Sair do Sistema</button>
                </div>
            </div>
        );
    }

    return (
        <div className="simulador-container" style={{ padding: '2rem' }}>
            <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
                
                {/* Header Dinâmico */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                    <div>
                        <span className="badge-turma" style={{ background: '#4A90E2', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                            {nomeTurma}
                        </span>
                        <h4 style={{ marginTop: '0.5rem', color: '#555' }}>Tópico: {questao?.assunto}</h4>
                    </div>
                    <button className="btn-logout" onClick={executarLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                        Sair
                    </button>
                </div>

                {/* Card da Questão */}
                <div className="questao-card">
                    <p style={{ fontSize: '1.15rem', fontWeight: '500', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        {/* 🎯 GARANTIDO: Renderiza o campo 'numero' atualizado */}
                        <strong>Questão {questao?.numero}:</strong> {questao?.enunciado}
                    </p>

                    <form onSubmit={enviarResposta}>
                        {/* Renderização Condicional por Tipo de Questão */}
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

                        {/* Botões de Ação */}
                        {!respondido ? (
                            <button type="submit" className="btn-login" style={{ marginTop: '1.5rem', width: '100%' }}>
                                Confirmar e Enviar Resposta
                            </button>
                        ) : (
                            <button type="button" className="btn-login" onClick={buscarProximaQuestao} style={{ marginTop: '1.5rem', width: '100%', background: '#2ecc71' }}>
                                Avançar para Próxima Questão (IA)
                            </button>
                        )}
                    </form>
                </div>

                {/* Bloco de Feedback Adaptativo */}
                {respondido && (
                    <div 
                        className={`feedback-box`} 
                        style={{ 
                            marginTop: '1.5rem', 
                            padding: '1rem', 
                            borderRadius: '6px', 
                            background: resultado.acertou ? '#d4edda' : '#f8d7da',
                            color: resultado.acertou ? '#155724' : '#721c24',
                            border: `1px solid ${resultado.acertou ? '#c3e6cb' : '#f5c6cb'}`
                        }}
                    >
                        <h5>{resultado.acertou ? "🎯 Excelente! Você acertou!" : "❌ Resposta Incorreta."}</h5>
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