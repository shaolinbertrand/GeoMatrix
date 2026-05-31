import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api';

export default function AdminView() {
    const [aba, setAba] = useState('questoes');
    const [alunos, setAlunos] = useState([]);
    const [questoes, setQuestoes] = useState([]); // ESTADO PARA AS QUESTÕES
    const [nomeAluno, setNomeAluno] = useState('');
    const [userAluno, setUserAluno] = useState('');
    const [turmaSelecionada, setTurmaSelecionada] = useState('8º Ano A');
    const [novaTurmaNome, setNovaTurmaNome] = useState('');
    const [msg, setMsg] = useState({ txt: '', tipo: '' });
    const navigate = useNavigate();

    // Campos do formulário de nova questão
    const [novoEnunciado, setNovoEnunciado] = useState('');
    const [novaRespostaCerta, setNovaRespostaCerta] = useState('');

    useEffect(() => {
        buscarAlunos();
        buscarQuestoes();
    }, []);

    // Busca os alunos no MongoDB
    const buscarAlunos = async () => {
        try {
            const res = await fetch(`${BASE_URL}/alunos`);
            const dados = await res.json();
            if (res.ok) setAlunos(dados);
        } catch (err) {
            console.error("Erro ao conectar com a API de alunos");
        }
    };

    // REQUISITOR: Busca as questões do arquivo público questoes.json
    const buscarQuestoes = async () => {
        try {
            const res = await fetch('/questoes.json?t=' + new Date().getTime());
            const dados = await res.json();
            setQuestoes(dados);
        } catch (err) {
            console.error("Erro ao carregar o banco de questões.");
        }
    };

    // AÇÃO: Cadastrar Aluno no MongoDB
    const cadastrarAluno = async (e) => {
        e.preventDefault();
        if (!nomeAluno || !userAluno) {
            setMsg({ txt: '❌ Preencha o Nome e o Login do Aluno.', tipo: 'error' });
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/alunos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: userAluno, nome: nomeAluno, turma: turmaSelecionada })
            });
            if (res.ok) {
                setMsg({ txt: '🎉 Aluno cadastrado com sucesso no MongoDB!', tipo: 'success' });
                setNomeAluno('');
                setUserAluno('');
                buscarAlunos();
            } else {
                const err = await res.json();
                setMsg({ txt: `❌ Erro: ${err.error}`, tipo: 'error' });
            }
        } catch (err) {
            setMsg({ txt: '❌ Erro ao conectar com o servidor.', tipo: 'error' });
        }
    };

    // AÇÃO: Ativar Nova Turma
    const criarTurma = async (e) => {
        e.preventDefault();
        if (!novaTurmaNome) return;
        try {
            const res = await fetch(`${BASE_URL}/alunos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario: `sistema.${Math.random().toString(36).substr(2, 4)}`, 
                    nome: "Inicializador da Turma", 
                    turma: novaTurmaNome 
                })
            });
            if (res.ok) {
                setMsg({ txt: `🎉 Turma '${novaTurmaNome}' ativada com sucesso!`, tipo: 'success' });
                setNovaTurmaNome('');
                buscarAlunos();
            }
        } catch (e) {
            setMsg({ txt: 'Erro ao gerar turma.', tipo: 'error' });
        }
    };

    // AÇÃO: Adicionar Questão no estado local do Painel
    const adicionarQuestao = (e) => {
        e.preventDefault();
        if (!novoEnunciado || !novaRespostaCerta) {
            setMsg({ txt: '❌ Preencha o enunciado e o gabarito da questão.', tipo: 'error' });
            return;
        }

        const novaQ = {
            id: questaoIdAleatorio(),
            enunciado: novoEnunciado,
            resposta_correta: Number(novaRespostaCerta)
        };

        setQuestoes([...questoes, novaQ]);
        setNovoEnunciado('');
        setNovaRespostaCerta('');
        setMsg({ txt: '🎉 Questão adicionada temporariamente ao painel! (Nota técnica: para persistência completa, configure um Model de Questões no Mongo).', tipo: 'success' });
    };

    // AÇÃO: Remover Questão da listagem
    const deletarQuestao = (id) => {
        if (confirm("Deseja remover esta questão permanentemente do painel visual?")) {
            setQuestoes(questoes.filter(q => q.id !== id));
            setMsg({ txt: '🗑️ Questão removida da visualização.', tipo: 'success' });
        }
    };

    const questaoIdAleatorio = () => Math.floor(Math.random() * 10000);

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    const turmasUnicas = [...new Set(alunos.map(a => a.turma))];
    if (!turmasUnicas.includes("8º Ano A")) turmasUnicas.push("8º Ano A");
    if (!turmasUnicas.includes("8º Ano B")) turmasUnicas.push("8º Ano B");

    return (
        <div>
            <header>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <h1>GeoMatrix - Painel do Professor</h1>
                        <p>Gerenciamento do AVA (Questões, Turmas e Relatórios NoSQL)</p>
                    </div>
                    <button onClick={logout} style={{ background: '#FF4D4D', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Sair do Painel</button>
                </div>
            </header>

            <div className="admin-container" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
                <div className="nav-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button className={`nav-btn ${aba === 'questoes' ? 'active' : ''}`} onClick={() => setAba('questoes')}>Gerenciar Questões</button>
                    <button className={`nav-btn ${aba === 'turmas' ? 'active' : ''}`} onClick={() => setAba('turmas')}>Turmas & Relatórios</button>
                </div>

                {msg.txt && <div className={`feedback-box feedback-${msg.tipo}`} style={{ display: 'block', marginBottom: '1.5rem' }}>{msg.txt}</div>}

                {aba === 'questoes' ? (
                    <div>
                        {/* FORMULÁRIO DE CADASTRO DE QUESTÕES */}
                        <div className="panel">
                            <h2>Cadastrar Nova Questão (Matemática 8º/9º Ano)</h2>
                            <form onSubmit={adicionarQuestao}>
                                <div className="form-row">
                                    <div className="input-block">
                                        <label>Enunciado da Questão (HTML permitido):</label>
                                        <textarea 
                                            value={novoEnunciado} 
                                            onChange={(e) => setNovoEnunciado(e.target.value)} 
                                            placeholder="Ex: <h2>Desafio:</h2> <p>Calcule o volume do prisma...</p>"
                                            style={{ width: '100%', height: '100px', padding: '0.7rem', border: '2px solid #CBD5E0', borderRadius: '6px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <div className="input-block">
                                        <label>Gabarito (Número Inteiro):</label>
                                        <input type="number" value={novaRespostaCerta} onChange={(e) => setNovaRespostaCerta(e.target.value)} placeholder="Ex: 1280000" />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button type="submit" className="btn-success" style={{ width: '100%', height: '42px' }}>Salvar Nova Questão</button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* TABELA DE QUESTÕES ATUAIS (PROVINDAS DO QUESTOES.JSON) */}
                        <div className="panel" style={{ marginTop: '2rem' }}>
                            <h2>Questões Atuais no Banco de Dados Estático</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#1A2B4C', color: 'white' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Enunciado (Visualização do Código)</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', width: '150px' }}>Gabarito</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', width: '100px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questoes.length === 0 ? (
                                            <tr><td colSpan="3" style={{ padding: '1rem' }}>Nenhuma questão localizada no arquivo público.</td></tr>
                                        ) : (
                                            questoes.map(q => (
                                                <tr key={q.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: q.enunciado }}></td>
                                                    <td style={{ padding: '1rem' }}><strong>{q.resposta_correta}</strong></td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button className="btn-danger" onClick={() => deletarQuestao(q.id)} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* SEÇÃO DE TURMAS E ALUNOS (MANTIDA IDÊNTICA) */}
                        <div className="grid-forms" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="panel">
                                <h2>Nova Turma</h2>
                                <input type="text" value={novaTurmaNome} onChange={(e) => setNovaTurmaNome(e.target.value)} placeholder="Ex: 8º Ano C - Tarde" />
                                <button onClick={criarTurma} className="btn-success" style={{ width: '100%', marginTop: '1.5rem' }}>Criar Turma</button>
                            </div>

                            <div className="panel">
                                <h2>Vincular Aluno à Turma</h2>
                                <label>Selecione a Turma:</label>
                                <select value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '2px solid #CBD5E0', borderRadius: '6px' }}>
                                    {turmasUnicas.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                    <input type="text" value={nomeAluno} onChange={(e) => setNomeAluno(e.target.value)} placeholder="Nome Completo" />
                                    <input type="text" value={userAluno} onChange={(e) => setUserAluno(e.target.value)} placeholder="Login (Ex: jean)" />
                                </div>
                                <button onClick={cadastrarAluno} className="btn-success" style={{ width: '100%', marginTop: '1.2rem' }}>Matricular Aluno</button>
                            </div>
                        </div>

                        <div className="panel" style={{ marginTop: '2rem' }}>
                            <h2>Relatório de Desempenho por Turma (MongoDB)</h2>
                            {turmasUnicas.sort().map(nomeTurma => {
                                const filtrados = alunos.filter(a => a.turma === nomeTurma && !a.usuario.startsWith('sistema.'));
                                return (
                                    <div key={nomeTurma} className="turma-card" style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                        <h3>🏫 {nomeTurma}</h3>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#1A2B4C', color: 'white' }}>
                                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nome do Aluno</th>
                                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Desafios Feitos</th>
                                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Pontuação Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtrados.length === 0 ? (
                                                    <tr><td colSpan="3" style={{ padding: '1rem' }}>Nenum aluno matriculado nesta turma.</td></tr>
                                                ) : (
                                                    filtrados.map(a => (
                                                        <tr key={a._id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                            <td style={{ padding: '1rem' }}>{a.nome} (<em>@{a.usuario}</em>)</td>
                                                            <td style={{ padding: '1rem' }}><strong>{a.desafios_concluidos}</strong></td>
                                                            <td style={{ padding: '1rem' }}><span style={{ color: '#B7791F', fontWeight: 'bold' }}>{a.pontuacao} pts</span></td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}