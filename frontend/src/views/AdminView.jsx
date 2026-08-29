import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../api';

export default function AdminView({ onLogout }) {
    const [abaAtiva, setAbaAtiva] = useState('turmas');
    const [msg, setMsg] = useState({ txt: '', tipo: '' });

    // Listas do Banco de Dados
    const [t_lista, setT_lista] = useState([]);
    const [alunosLista, setAlunosLista] = useState([]);
    const [listaAssuntos, setListaAssuntos] = useState([]);

    // Estados dos formulários de Turma e Matrícula
    const [turmaSelecionada, setTurmaSelecionada] = useState('');
    const [nomeAluno, setNomeAluno] = useState('');
    const [userAluno, setUserAluno] = useState('');
    const [novaTurmaNome, setNovaTurmaNome] = useState('');
    const [assuntosSelecionados, setAssuntosSelecionados] = useState([]);

    // 🎯 Estado de Edição de Turma
    const [turmaEmEdicaoId, setTurmaEmEdicaoId] = useState(null);

    // Estado do formulário de Questões
    const [novaQuestao, setNovaQuestao] = useState({
        id: '', categoria: 'Geometria', assunto: '',
        dificuldade: 'Médio', tipo: 'objetiva', enunciado: '',
        opcaoA: '', opcaoB: '', opcaoC: '', opcaoD: '', gabarito: '1'
    });

    // Estados do Relatório da Turma
    const [turmaRelatorioId, setTurmaRelatorioId] = useState('');
    const [dadosRelatorio, setDadosRelatorio] = useState(null);
    const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

    // Modal de Diagnóstico Individual do Aluno
    const [alunoSelecionadoDetalhe, setAlunoSelecionadoDetalhe] = useState(null);
    const [carregandoDetalheAluno, setCarregandoDetalheAluno] = useState(false);

    const token = localStorage.getItem('geomatrix_token');
    const nomeProfessor = localStorage.getItem('session_name') || 'Professor';

    useEffect(() => {
        if (token) {
            buscarTurmas();
            buscarAlunos();
            buscarAssuntosDoBanco();
        }
    }, [token]);

    useEffect(() => {
        if (turmaRelatorioId && abaAtiva === 'dashboard') {
            buscarRelatorioTurma(turmaRelatorioId);
        }
    }, [turmaRelatorioId, abaAtiva]);

    const buscarTurmas = async () => {
        try {
            const res = await fetch(`${BASE_URL}/turmas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const dados = await res.json();
                setT_lista(dados);
                if (dados.length > 0) {
                    setTurmaSelecionada(dados[0].nome);
                    if (!turmaRelatorioId) setTurmaRelatorioId(dados[0]._id);
                }
            }
        } catch (err) {
            console.error("Erro ao buscar turmas:", err);
        }
    };

    const buscarAlunos = async () => {
        try {
            const res = await fetch(`${BASE_URL}/alunos`);
            if (res.ok) {
                const dados = await res.json();
                setAlunosLista(dados);
            }
        } catch (err) {
            console.error("Erro ao buscar alunos:", err);
        }
    };

    const buscarAssuntosDoBanco = async () => {
        try {
            const res = await fetch(`${BASE_URL}/questoes/assuntos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const dados = await res.json();
                setListaAssuntos(dados);
                if (dados.length > 0) {
                    setNovaQuestao(prev => ({ ...prev, assunto: dados[0] }));
                }
            }
        } catch (err) {
            console.error("Erro ao buscar assuntos:", err);
        }
    };

    const buscarRelatorioTurma = async (idTurma) => {
        setCarregandoRelatorio(true);
        try {
            const res = await fetch(`${BASE_URL}/turmas/${idTurma}/relatorio`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDadosRelatorio(data);
            } else {
                setDadosRelatorio(null);
            }
        } catch (err) {
            console.error("Erro ao buscar relatório da turma:", err);
        } finally {
            setCarregandoRelatorio(false);
        }
    };

    const abrirDiagnosticoAluno = async (alunoId) => {
        setCarregandoDetalheAluno(true);
        try {
            const res = await fetch(`${BASE_URL}/alunos/${alunoId}/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAlunoSelecionadoDetalhe(data);
            }
        } catch (err) {
            console.error("Erro ao carregar detalhes do aluno:", err);
        } finally {
            setCarregandoDetalheAluno(false);
        }
    };

    const handleCheckboxChange = (assunto) => {
        if (assuntosSelecionados.includes(assunto)) {
            setAssuntosSelecionados(assuntosSelecionados.filter(item => item !== assunto));
        } else {
            setAssuntosSelecionados([...assuntosSelecionados, assunto]);
        }
    };

    // 🎯 PREENCHE O FORMULÁRIO COM OS DADOS DA TURMA PARA EDIÇÃO
    const iniciarEdicaoTurma = (turma) => {
        setTurmaEmEdicaoId(turma._id);
        setNovaTurmaNome(turma.nome);
        setAssuntosSelecionados(turma.assuntosAtivos || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 🎯 CANCELA O MODO DE EDIÇÃO
    const cancelarEdicao = () => {
        setTurmaEmEdicaoId(null);
        setNovaTurmaNome('');
        setAssuntosSelecionados([]);
    };

    // 🎯 SALVA NOVA TURMA OU ATUALIZA UMA EXISTENTE
    const salvarTurma = async (e) => {
        e.preventDefault();
        if (!novaTurmaNome) return;
        if (assuntosSelecionados.length === 0) {
            setMsg({ txt: '❌ Selecione pelo menos um assunto ativo para a IA da turma.', tipo: 'error' });
            return;
        }

        const idDoDocente = localStorage.getItem('session_id') ||
            localStorage.getItem('_id') ||
            localStorage.getItem('professor_id');

        try {
            const isEditing = Boolean(turmaEmEdicaoId);
            const endpoint = isEditing ? `${BASE_URL}/turmas/${turmaEmEdicaoId}` : `${BASE_URL}/turmas`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: novaTurmaNome,
                    professor: idDoDocente,
                    professor_id: idDoDocente,
                    assuntosAtivos: assuntosSelecionados
                })
            });

            if (res.ok) {
                setMsg({
                    txt: isEditing
                        ? `🎉 Turma '${novaTurmaNome}' e seus novos tópicos foram atualizados!`
                        : `🎉 Turma '${novaTurmaNome}' salva com sucesso!`,
                    tipo: 'success'
                });
                cancelarEdicao();
                buscarTurmas();
            } else {
                const err = await res.json();
                setMsg({ txt: `❌ Erro: ${err.error || 'Erro ao processar requisição.'}`, tipo: 'error' });
            }
        } catch (e) {
            setMsg({ txt: 'Erro ao conectar com o servidor.', tipo: 'error' });
        }
    };

    const cadastrarAluno = async (e) => {
        e.preventDefault();
        if (!nomeAluno || !userAluno) {
            setMsg({ txt: '❌ Preencha o Nome e o Login do Aluno.', tipo: 'error' });
            return;
        }

        try {
            const turmaObjeto = t_lista.find(t => t.nome === turmaSelecionada);
            const turmaIdFinal = turmaObjeto ? turmaObjeto._id : undefined;

            const res = await fetch(`${BASE_URL}/alunos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario: userAluno,
                    nome: nomeAluno,
                    senha: '123',
                    turma_id: turmaIdFinal
                })
            });
            if (res.ok) {
                setMsg({ txt: '🎉 Aluno cadastrado com sucesso!', tipo: 'success' });
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

    const cadastrarQuestaoAvulsa = async (e) => {
        e.preventDefault();
        const opcoesMontadas = novaQuestao.tipo === 'objetiva'
            ? [novaQuestao.opcaoA, novaQuestao.opcaoB, novaQuestao.opcaoC, novaQuestao.opcaoD]
            : [];

        try {
            const res = await fetch(`${BASE_URL}/questoes/gerenciar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: Number(novaQuestao.id),
                    categoria: novaQuestao.categoria,
                    assunto: novaQuestao.assunto,
                    dificuldade: novaQuestao.dificuldade === 'Fácil' ? 1 : novaQuestao.dificuldade === 'Médio' ? 2 : 3,
                    tipo: novaQuestao.tipo,
                    enunciado: novaQuestao.enunciado,
                    opcoes: opcoesMontadas,
                    gabarito: novaQuestao.gabarito
                })
            });

            if (res.ok) {
                setMsg({ txt: '✅ Nova questão inserida com sucesso!', tipo: 'success' });
                setNovaQuestao({ ...novaQuestao, id: '', enunciado: '', opcaoA: '', opcaoB: '', opcaoC: '', opcaoD: '' });
                buscarAssuntosDoBanco();
            } else {
                const err = await res.json();
                setMsg({ txt: `❌ Erro: ${err.error}`, tipo: 'error' });
            }
        } catch (err) {
            setMsg({ txt: '❌ Erro ao conectar com o banco de dados.', tipo: 'error' });
        }
    };

    const mapaNivel = {
        1: 'Iniciante (Fácil)',
        2: 'Intermediário (Médio)',
        3: 'Avançado (Difícil)'
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1A2B4C' }}>Painel Central Docente — GeoMatrix</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#718096' }}>Professor Logado: <strong>{nomeProfessor}</strong></p>
                </div>
                <button onClick={onLogout} style={{ background: '#FF4D4D', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Sair do Painel</button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #CBD5E0', paddingBottom: '0.5rem' }}>
                <button onClick={() => setAbaAtiva('turmas')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', background: abaAtiva === 'turmas' ? '#3182CE' : 'transparent', color: abaAtiva === 'turmas' ? '#FFF' : '#4A5568', fontWeight: 'bold', borderRadius: '4px' }}>🏫 Turmas & Matrículas</button>
                <button onClick={() => setAbaAtiva('questoes')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', background: abaAtiva === 'questoes' ? '#3182CE' : 'transparent', color: abaAtiva === 'questoes' ? '#FFF' : '#4A5568', fontWeight: 'bold', borderRadius: '4px' }}>🧠 Banco de Questões (IA)</button>
                <button onClick={() => setAbaAtiva('dashboard')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', background: abaAtiva === 'dashboard' ? '#3182CE' : 'transparent', color: abaAtiva === 'dashboard' ? '#FFF' : '#4A5568', fontWeight: 'bold', borderRadius: '4px' }}>📊 Desempenho (Métricas)</button>
            </div>

            {msg.txt && (
                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: msg.tipo === 'success' ? '#C6F6D5' : '#FED7D7', color: msg.tipo === 'success' ? '#22543D' : '#742A2A', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                    {msg.txt}
                </div>
            )}

            {/* ABA 1: TURMAS E MATRÍCULAS */}
            {abaAtiva === 'turmas' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* FORMULÁRIO DE CRIAR / EDITAR TURMA */}
                        <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: turmaEmEdicaoId ? '4px solid #DD6B20' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: turmaEmEdicaoId ? '#DD6B20' : '#2D3748' }}>
                                    {turmaEmEdicaoId ? '✏️ Editando Conteúdos da Turma' : '🏫 Adicionar Nova Turma'}
                                </h3>
                                {turmaEmEdicaoId && (
                                    <button
                                        type="button"
                                        onClick={cancelarEdicao}
                                        style={{ background: '#E2E8F0', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: '#4A5568' }}
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>

                            <form onSubmit={salvarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome da Turma:</label>
                                    <input
                                        type="text"
                                        value={novaTurmaNome}
                                        onChange={(e) => setNovaTurmaNome(e.target.value)}
                                        placeholder="Ex: 8º Ano A"
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Selecionar Conteúdos Ativos na IA ({assuntosSelecionados.length} selecionados):
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', background: '#F7FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                        {listaAssuntos.map((assunto, i) => (
                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.92rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={assuntosSelecionados.includes(assunto)}
                                                    onChange={() => handleCheckboxChange(assunto)}
                                                />
                                                {assunto}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    style={{
                                        background: turmaEmEdicaoId ? '#DD6B20' : '#3182CE',
                                        color: '#FFF',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {turmaEmEdicaoId ? '💾 Salvar Alterações da Turma' : 'Salvar Turma no Banco'}
                                </button>
                            </form>
                        </div>

                        {/* MATRÍCULA DE ALUNO */}
                        <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ marginTop: 0, color: '#2D3748' }}>🎓 Matricular Estudante</h3>
                            <form onSubmit={cadastrarAluno} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome Completo do Aluno:</label>
                                    <input type="text" value={nomeAluno} onChange={(e) => setNomeAluno(e.target.value)} placeholder="Ex: Jean Bertrand" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Login de Usuário:</label>
                                    <input type="text" value={userAluno} onChange={(e) => setUserAluno(e.target.value)} placeholder="Ex: jean.bertrand" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Selecionar Turma Relacional:</label>
                                    <select
                                        value={turmaSelecionada}
                                        onChange={(e) => setTurmaSelecionada(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', background: '#fff' }}
                                        required
                                    >
                                        {t_lista.map((t) => (
                                            <option key={t._id} value={t.nome}>{t.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" style={{ background: '#38A169', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Efetuar Matrícula</button>
                            </form>
                        </div>
                    </div>

                    {/* 🎯 LISTAGEM VISUAL DAS TURMAS COM BOTÃO DE EDIÇÃO */}
                    <div style={{ marginTop: '2rem', background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#2D3748' }}>🏫 Turmas Ativas no GeoMatrix</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            {t_lista.map((t) => (
                                <div key={t._id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', background: '#F7FAFC' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, color: '#2D3748', fontSize: '1.1rem' }}>{t.nome}</h4>
                                        <button
                                            onClick={() => iniciarEdicaoTurma(t)}
                                            style={{ background: '#EBF8FF', color: '#3182CE', border: '1px solid #BEE3F8', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            ✏️ Editar Conteúdos
                                        </button>
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#718096' }}>
                                        <strong>{t.assuntosAtivos?.length || 0}</strong> tópico(s) ativo(s) no simulador
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TABELA GERAL DE MATRICULADOS */}
                    <div style={{ marginTop: '2rem', background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#2D3748' }}>📋 Lista Geral de Alunos Matriculados</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#EDF2F7', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Nome do Aluno</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Usuário</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Turma Vinculada</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Pontuação Acumulada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alunosLista.map((aluno) => (
                                    <tr key={aluno._id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '12px' }}>{aluno.nome}</td>
                                        <td style={{ padding: '12px' }}>{aluno.usuario}</td>
                                        <td style={{ padding: '12px' }}>{aluno.turma_id?.nome || 'Sem vínculo'}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#3182CE' }}>{aluno.pontuacao || 0} XP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ABA 2: BANCO DE QUESTÕES */}
            {abaAtiva === 'questoes' && (
                <div style={{ background: '#FFF', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#2D3748' }}>🧠 Expandir Banco de Questões Dinâmicas</h3>
                    <form onSubmit={cadastrarQuestaoAvulsa} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                        {/* Coluna Esquerda: Metadados da Questão */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ID Numérico único:</label>
                                <input
                                    type="number"
                                    value={novaQuestao.id}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, id: e.target.value })}
                                    placeholder="Ex: 101"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            {/* 🎯 CAMPO DE CATEGORIA (Padrão: Geometria) */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoria da Disciplina:</label>
                                <input
                                    type="text"
                                    value={novaQuestao.categoria}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, categoria: e.target.value })}
                                    placeholder="Ex: Geometria, Álgebra, Trigonometria..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tópico do Currículo:</label>
                                <input
                                    type="text"
                                    value={novaQuestao.assunto}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, assunto: e.target.value })}
                                    placeholder="Ex: Classificação de triângulos"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nível de Complexidade:</label>
                                <select
                                    value={novaQuestao.dificuldade}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, dificuldade: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', background: '#fff' }}
                                >
                                    <option value="Fácil">Fácil</option>
                                    <option value="Médio">Médio</option>
                                    <option value="Difícil">Difícil</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Formato da Questão:</label>
                                <select
                                    value={novaQuestao.tipo}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, tipo: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', background: '#fff' }}
                                >
                                    <option value="objetiva">Múltipla Escolha (Objetiva)</option>
                                    <option value="discursiva">Desenvolvimento / Dissertativa</option>
                                </select>
                            </div>
                        </div>

                        {/* Coluna Direita: Conteúdo e Gabarito */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Enunciado Contextualizado:</label>
                                <textarea
                                    rows="3"
                                    value={novaQuestao.enunciado}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, enunciado: e.target.value })}
                                    placeholder="Escreva o problema matemático..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', resize: 'none', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            {novaQuestao.tipo === 'objetiva' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={novaQuestao.opcaoA}
                                        onChange={(e) => setNovaQuestao({ ...novaQuestao, opcaoA: e.target.value })}
                                        placeholder="Opção A"
                                        style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }}
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={novaQuestao.opcaoB}
                                        onChange={(e) => setNovaQuestao({ ...novaQuestao, opcaoB: e.target.value })}
                                        placeholder="Opção B"
                                        style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }}
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={novaQuestao.opcaoC}
                                        onChange={(e) => setNovaQuestao({ ...novaQuestao, opcaoC: e.target.value })}
                                        placeholder="Opção C"
                                        style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }}
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={novaQuestao.opcaoD}
                                        onChange={(e) => setNovaQuestao({ ...novaQuestao, opcaoD: e.target.value })}
                                        placeholder="Opção D"
                                        style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }}
                                        required
                                    />
                                </div>
                            ) : (
                                <div style={{ background: '#F7FAFC', border: '1px dashed #CBD5E0', borderRadius: '6px', padding: '12px', color: '#718096', fontSize: '0.9rem' }}>
                                    ℹ️ <strong>Questão Dissertativa:</strong> O aluno responderá diretamente no simulador com desenvolvimento/valor numérico.
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gabarito / Solução Oficial:</label>
                                <input
                                    type="text"
                                    value={novaQuestao.gabarito}
                                    onChange={(e) => setNovaQuestao({ ...novaQuestao, gabarito: e.target.value })}
                                    placeholder={novaQuestao.tipo === 'objetiva' ? "Digite o número da opção (ex: 1 para A)" : "Digite a resposta exata/numérica esperada"}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                style={{ background: '#2B6CB0', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto' }}
                            >
                                Inserir Questão
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ABA 3: 📊 DESEMPENHO E MÉTRICAS REAIS DA TURMA */}
            {abaAtiva === 'dashboard' && (
                <div>
                    <div style={{ background: '#FFF', padding: '15px 20px', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ fontWeight: 'bold', color: '#2D3748' }}>Selecione a Turma para Análise:</label>
                        <select
                            value={turmaRelatorioId}
                            onChange={(e) => {
                                setTurmaRelatorioId(e.target.value);
                                buscarRelatorioTurma(e.target.value);
                            }}
                            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '1rem', background: '#F7FAFC' }}
                        >
                            {t_lista.map(t => (
                                <option key={t._id} value={t._id}>{t.nome}</option>
                            ))}
                        </select>
                    </div>

                    {carregandoRelatorio ? (
                        <div style={{ background: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#718096' }}>
                            Carregando métricas da turma...
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #3182CE', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                                    <h4 style={{ margin: 0, color: '#718096', fontSize: '0.95rem' }}>Estudantes Matriculados</h4>
                                    <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#2D3748', margin: '0.4rem 0 0' }}>
                                        {dadosRelatorio?.totalAlunos || 0}
                                    </p>
                                </div>

                                <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #38A169', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                                    <h4 style={{ margin: 0, color: '#718096', fontSize: '0.95rem' }}>Média de Pontos da Turma</h4>
                                    <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#276749', margin: '0.4rem 0 0' }}>
                                        {dadosRelatorio?.mediaPontos || 0} pts
                                    </p>
                                </div>

                                <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #DD6B20', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                                    <h4 style={{ margin: 0, color: '#718096', fontSize: '0.95rem' }}>Precisão Média Geral</h4>
                                    <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#C05621', margin: '0.4rem 0 0' }}>
                                        {dadosRelatorio?.mediaTaxaAcerto || 0}%
                                    </p>
                                </div>
                            </div>

                            <div style={{ background: '#FFF', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: '#2D3748' }}>👥 Desempenho Individual — {dadosRelatorio?.turmaNome || 'Turma'}</h3>
                                    <small style={{ color: '#718096' }}>💡 Clique no aluno para ver o raio-X detalhado de tópicos</small>
                                </div>

                                {dadosRelatorio?.alunos && dadosRelatorio.alunos.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '0.5rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#EDF2F7', color: '#4A5568', fontSize: '0.9rem' }}>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Aluno</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Usuário</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Desafios Concluídos</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Pontuação</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #CBD5E0' }}>Taxa de Precisão</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dadosRelatorio.alunos.map((a) => (
                                                <tr
                                                    key={a._id}
                                                    onClick={() => abrirDiagnosticoAluno(a._id)}
                                                    style={{
                                                        borderBottom: '1px solid #E2E8F0',
                                                        fontSize: '0.95rem',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.15s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F7FAFC'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '12px', fontWeight: '600', color: '#2B6CB0' }}>🔍 {a.nome}</td>
                                                    <td style={{ padding: '12px', color: '#718096' }}>{a.usuario}</td>
                                                    <td style={{ padding: '12px' }}>{a.desafiosConcluidos}</td>
                                                    <td style={{ padding: '12px', color: '#38A169', fontWeight: 'bold' }}>{a.pontuacao} pts</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 'bold',
                                                            background: a.taxaAcerto >= 70 ? '#C6F6D5' : a.taxaAcerto >= 50 ? '#FEFCBF' : '#FED7D7',
                                                            color: a.taxaAcerto >= 70 ? '#22543D' : a.taxaAcerto >= 50 ? '#744210' : '#742A2A'
                                                        }}>
                                                            {a.taxaAcerto}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: '#718096', margin: '1rem 0' }}>Nenhum estudante matriculado nesta turma.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE DIAGNÓSTICO INDIVIDUAL DO ALUNO */}
            {(alunoSelecionadoDetalhe || carregandoDetalheAluno) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    padding: '20px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        background: '#FFF',
                        width: '100%',
                        maxWidth: '750px',
                        maxHeight: '90vh',
                        borderRadius: '12px',
                        padding: '25px',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setAlunoSelecionadoDetalhe(null)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                border: 'none',
                                background: '#EDF2F7',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                color: '#4A5568'
                            }}
                        >
                            ✕
                        </button>

                        {carregandoDetalheAluno ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Carregando dados individuais do aluno...</div>
                        ) : (
                            <div>
                                <h2 style={{ margin: '0 0 5px 0', color: '#1A2B4C' }}>📊 Raio-X de Aprendizagem: {alunoSelecionadoDetalhe.nome}</h2>
                                <p style={{ color: '#718096', margin: '0 0 1.5rem 0' }}>Métricas adaptativas calculadas pelo GeoMatrix para este estudante.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: '#F7FAFC', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #38A169' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#718096' }}>Pontuação Acumulada</span>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#276749' }}>
                                            {alunoSelecionadoDetalhe.pontuacaoTotal} pts
                                        </p>
                                    </div>
                                    <div style={{ background: '#F7FAFC', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3182CE' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#718096' }}>Desafios Superados</span>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#2B6CB0' }}>
                                            {alunoSelecionadoDetalhe.desafiosConcluidos}
                                        </p>
                                    </div>
                                </div>

                                <h4 style={{ color: '#2D3748', marginBottom: '1rem' }}>📚 Desempenho por Tópico do Currículo:</h4>

                                {alunoSelecionadoDetalhe.assuntosEmAndamento && alunoSelecionadoDetalhe.assuntosEmAndamento.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {alunoSelecionadoDetalhe.assuntosEmAndamento.map((item, index) => (
                                            <div key={index} style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FAFAFA' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <h5 style={{ margin: 0, color: '#2D3748', fontSize: '1rem' }}>{item.assunto}</h5>
                                                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                                                        Nível IA: {mapaNivel[item.nivelProficiencia] || 'Intermediário'}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem' }}>
                                                    <span>{item.questoesRespondidasCount} {item.questoesRespondidasCount === 1 ? 'questão' : 'questões'}</span>
                                                    <div>
                                                        <strong style={{ color: '#2E7D32', marginRight: '0.8rem' }}>✅ {item.porcentagemAcerto}% Acertos ({item.acertos})</strong>
                                                        <strong style={{ color: '#C53030' }}>❌ {item.porcentagemErro}% Erros ({item.erros})</strong>
                                                    </div>
                                                </div>

                                                <div style={{ width: '100%', height: '8px', backgroundColor: '#EDF2F7', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                                    <div style={{ width: `${item.porcentagemAcerto}%`, backgroundColor: '#48BB78', height: '100%' }} />
                                                    <div style={{ width: `${item.porcentagemErro}%`, backgroundColor: '#F56565', height: '100%' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#718096' }}>O aluno ainda não possui histórico de resolução nos tópicos ativos.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}