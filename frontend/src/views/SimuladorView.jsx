import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api';
import MotorGeometrico from '../components/MotorGeometrico';

export default function SimuladorView() {
    const [desafios, setDesafios] = useState([]);
    const [indexAtual, setIndexAtual] = useState(0);
    const [pontuacao, setPontuacao] = useState(0);
    const [respostaAluno, setRespostaAluno] = useState('');
    const [feedback, setFeedback] = useState({ msg: '', tipo: '' });

    // Inicializadores padrão numéricos para evitar que o motor gráfico inicie zerado ou escuro
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
        // 1. Carrega dados do MongoDB
        try {
            const res = await fetch(`${BASE_URL}/alunos`);
            const alunos = await res.json();
            if (res.ok) {
                const logado = alunos.find(a => String(a._id) === String(alunoId));
                if (logado) {
                    setPontuacao(logado.pontuacao || 0);
                    setIndexAtual(logado.desafios_concluidos || 0);
                }
            }
        } catch (e) { 
            console.warn("API offline, rodando em modo sandbox local."); 
        }

        // 2. Carrega as questões da pasta pública
        try {
            const resQ = await fetch('/questoes.json');
            const questoes = await resQ.json();
            setDesafios(questoes);
        } catch (e) { 
            console.error("Erro ao ler banco de questões."); 
        }
    };

    const verificarResposta = async () => {
        if (desafios.length === 0) return;
        
        const certa = Number(desafios[indexAtual].resposta_correta);
        if (Number(respostaAluno) === certa) {
            const novaPontuacao = pontuacao + 10;
            const novoIndex = indexAtual + 1;
            
            setPontuacao(novaPontuacao);
            setIndexAtual(novoIndex);
            setFeedback({ msg: '✅ Resposta correta! Sincronizando progresso...', tipo: 'success' });
            setRespostaAluno('');

            // Salva o progresso no MongoDB
            try {
                await fetch(`${BASE_URL}/salvar-progresso`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alunoId, pontuacao: novaPontuacao, desafios_concluidos: novoIndex })
                });
            } catch (e) { 
                console.error("Erro de persistência na API local."); 
            }
        } else {
            setFeedback({ msg: '❌ Resposta incorreta. Dica: Use os seletores numéricos para alterar as dimensões do bloco 3D ao lado e conferir seus cálculos!', tipo: 'error' });
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
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Ambiente Virtual de Aprendizagem (Matemática 8º/9º Ano)</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', display: 'block' }}>👋 Olá, {alunoNome || 'Estudante'}!</span>
                        <button onClick={logout} style={{ background: '#FF4D4D', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 'bold' }}>Sair do Sistema</button>
                    </div>
                </div>
            </header>

            <div className="main-container">
                {/* PAINEL ESQUERDO - AMBIENTE 3D */}
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

                {/* PAINEL DIREITO - SISTEMA GAMIFICADO */}
                <div className="panel">
                    <div className="score-badge">Pontuação: {pontuacao} XP</div>
                    
                    <div className="enunciado-box" style={{ minHeight: '180px', border: '1px dashed #CBD5E0', padding: '1rem', borderRadius: '6px', backgroundColor: '#FFF', marginBottom: '1.5rem' }}>
                        {desafios.length > 0 && indexAtual < desafios.length ? (
                            <div dangerouslySetInnerHTML={{ __html: desafios[indexAtual].enunciado }} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <h2>🏆 Parabéns!</h2>
                                <p>Você concluiu com sucesso toda a trilha de desafios do GeoMatrix para o 8º e 9º ano!</p>
                            </div>
                        )}
                    </div>
                    
                    {indexAtual < desafios.length && (
                        <div className="answer-block" style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="number" 
                                value={respostaAluno} 
                                onChange={(e) => setRespostaAluno(e.target.value)} 
                                placeholder="Insira o valor numérico calculado..." 
                                style={{ flex: 1, padding: '0.7rem', border: '2px solid #CBD5E0', borderRadius: '6px', fontSize: '1rem' }}
                            />
                            <button onClick={verificarResposta} style={{ background: '#1A2B4C', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Gabarito</button>
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