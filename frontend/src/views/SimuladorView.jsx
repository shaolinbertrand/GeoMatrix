import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificarRespostaIA, listarAlunos } from '../api';
import MotorGeometrico from '../components/MotorGeometrico';

export default function SimuladorView() {
    const [desafios, setDesafios] = useState([]);
    const [indexAtual, setIndexAtual] = useState(0);
    const [questaoAtual, setQuestaoAtual] = useState(null); 
    const [pontuacao, setPontuacao] = useState(0);
    const [respostaAluno, setRespostaAluno] = useState('');
    const [feedback, setFeedback] = useState({ msg: '', tipo: '' });

    const [largura, setLargura] = useState(160);
    const [altura, setAltura] = useState(100);
    const [profundidade, setProfundidade] = useState(80);

    const navigate = useNavigate();
    const alunoId = localStorage.getItem('session_id');
    const alunoNome = localStorage.getItem('session_name');

    useEffect(() => {
        inicializarSimulador();
    }, []);

    const inicializarSimulador = async () => {
        try {
            const alunos = await listarAlunos();
            const logado = alunos.find(a => String(a._id) === String(alunoId));
            if (logado) {
                setPontuacao(logado.pontuacao || 0);
                setIndexAtual(logado.desafios_concluidos || 0);
            }
        } catch (e) { 
            console.warn("Modo sandbox ativado."); 
        }

        try {
            const resQ = await fetch('/questoes.json');
            const questoes = await resQ.json();
            setDesafios(questoes);
            setQuestaoAtual(questoes[indexAtual] || questoes[0]);
        } catch (e) { 
            console.error("Erro ao ler banco de questões."); 
        }
    };

    const handleVerificarResposta = async () => {
        if (!questaoAtual) return;
        
        try {
            // CORREÇÃO: Garante o envio do identificador correto indiferente da origem (Mongoose ID ou JSON id)
            const idParaEnvio = questaoAtual._id || questaoAtual.id || indexAtual;
            const dados = await verificarRespostaIA(alunoId, idParaEnvio, respostaAluno);

            if (dados.status === 'sucesso') {
                setFeedback({ msg: '✅ Resposta correta! +10 XP arrecadados.', tipo: 'success' });
                setPontuacao(prev => prev + 10);
                const proximoIndex = indexAtual + 1;
                setIndexAtual(proximoIndex);
                setQuestaoAtual(desafios[proximoIndex]);
                setRespostaAluno('');
            } else {
                setFeedback({ 
                    msg: '❌ Resposta incorreta. O cérebro do GeoMatrix detectou sua dificuldade e recalibrou sua rota!', 
                    tipo: 'error' 
                });
                
                if (dados.proximaQuestao) {
                    setQuestaoAtual(dados.proximaQuestao);
                }
                setRespostaAluno('');
            }
        } catch (err) {
            setFeedback({ msg: 'Erro ao processar resposta no servidor.', tipo: 'error' });
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    const volumeTotal = largura * altura * profundidade;

    return (
        <div style={{ backgroundColor: '#F7FAFC', minHeight: '100vh' }}>
            <header>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>GeoMatrix</h1>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Ambiente Virtual de Aprendizagem Adaptativo</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', display: 'block' }}>👋 Olá, {alunoNome || 'Estudante'}!</span>
                        <button onClick={logout} style={{ background: '#FF4D4D', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 'bold' }}>Sair do Sistema</button>
                    </div>
                </div>
            </header>

            <div className="main-container">
                <div className="panel">
                    <h3 style={{ marginTop: 0, color: '#1A2B4C' }}>📐 Simulador Espacial Reativo</h3>
                    <MotorGeometrico largura={largura} altura={altura} profundidade={profundidade} />
                    <div className="control-group">
                        <div className="input-block">
                            <label>Largura (X)</label>
                            <input type="number" value={largura} onChange={(e) => setLargura(Number(e.target.value))} />
                        </div>
                        <div className="input-block">
                            <label>Altura (Y)</label>
                            <input type="number" value={altura} onChange={(e) => setAltura(Number(e.target.value))} />
                        </div>
                        <div className="input-block">
                            <label>Profundidade (Z)</label>
                            <input type="number" value={profundidade} onChange={(e) => setProfundidade(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="volume-display">Volume Praticado: {volumeTotal.toLocaleString()} u³.</div>
                </div>

                <div className="panel">
                    <div className="score-badge">Pontuação: {pontuacao} XP</div>
                    
                    <div className="enunciado-box" style={{ minHeight: '180px', border: '1px dashed #CBD5E0', padding: '1rem', borderRadius: '6px', backgroundColor: '#FFF', marginBottom: '1.5rem' }}>
                        {questaoAtual ? (
                            <div>
                                <span style={{ fontSize: '11px', color: '#B7791F', fontWeight: 'bold' }}>FOCO ATUAL: {questaoAtual.conteudo || "Geometria Geral"}</span>
                                <div dangerouslySetInnerHTML={{ __html: questaoAtual.enunciado }} />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <h2>🏆 Trilha Concluída!</h2>
                                <p>Você concluiu com sucesso todos os desafios do GeoMatrix!</p>
                            </div>
                        )}
                    </div>
                    
                    {questaoAtual && (
                        <div className="answer-block" style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="number" 
                                value={respostaAluno} 
                                onChange={(e) => setRespostaAluno(e.target.value)} 
                                placeholder="Insira o valor numérico calculado..." 
                                style={{ flex: 1, padding: '0.7rem', border: '2px solid #CBD5E0', borderRadius: '6px', fontSize: '1rem' }}
                            />
                            <button onClick={handleVerificarResposta} style={{ background: '#1A2B4C', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Gabarito</button>
                        </div>
                    )}

                    {feedback.msg && (
                        <div className={`feedback-box feedback-${feedback.tipo}`} style={{ display: 'block', marginTop: '1.5rem', padding: '0.8rem', borderRadius: '6px', fontWeight: '500' }}>
                            {feedback.msg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}