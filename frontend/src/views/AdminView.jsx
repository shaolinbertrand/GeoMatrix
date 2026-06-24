import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../api';

export default function AdminView({ professor, onLogout }) {
    // Estados para gerenciamento de mensagens e dados das turmas/alunos
    const [msg, setMsg] = useState({ txt: '', tipo: '' });
    const [t_lista, setT_lista] = useState([]);
    const [alunosLista, setAlunosLista] = useState([]);
    const [turmaSelecionada, setTurmaSelecionada] = useState('');

    // Estados dos formulários
    const [nomeAluno, setNomeAluno] = useState('');
    const [userAluno, setUserAluno] = useState('');
    const [novaTurmaNome, setNovaTurmaNome] = useState('');

    // Carregamento inicial de dados
    useEffect(() => {
        buscarTurmas();
        buscarAlunos();
    }, []);

    const buscarTurmas = async () => {
        try {
            const res = await fetch(`${BASE_URL}/turmas`);
            if (res.ok) {
                const dados = await res.json();
                setT_lista(dados);
                if (dados.length > 0) setTurmaSelecionada(dados[0].nome);
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

    // AÇÃO: Cadastrar Aluno com Vínculo Real à Turma do DER
    const cadastrarAluno = async (e) => {
        e.preventDefault();
        if (!nomeAluno || !userAluno) {
            setMsg({ txt: '❌ Preencha o Nome e o Login do Aluno.', tipo: 'error' });
            return;
        }

        try {
            // Busca a ID correspondente à string da turma selecionada
            const turmaObjeto = t_lista.find(t => t.nome === turmaSelecionada);
            const turmaIdFinal = turmaObjeto ? turmaObjeto._id : undefined;

            const res = await fetch(`${BASE_URL}/alunos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario: userAluno, 
                    nome: nomeAluno, 
                    senha: '123', // Padrão inicial do laboratório
                    turma_id: turmaIdFinal // Passa o ID relacional do NoSQL
                })
            });
            if (res.ok) {
                setMsg({ txt: '🎉 Aluno cadastrado e vinculado com sucesso no MongoDB!', tipo: 'success' });
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

    // AÇÃO: Criar Turma Real na Coleção 'turmas'
    const criarTurma = async (e) => {
        e.preventDefault();
        if (!novaTurmaNome) return;
        try {
            const res = await fetch(`${BASE_URL}/turmas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nome: novaTurmaNome, 
                    professor_id: professor?._id || "65f1a2b3c4d5e6f7a8b9c0d1" // ID dinâmico do professor logado
                })
            });
            if (res.ok) {
                setMsg({ txt: `🎉 Turma '${novaTurmaNome}' salva no MongoDB com sucesso!`, tipo: 'success' });
                setNovaTurmaNome('');
                buscarTurmas(); // Atualiza a lista local sem precisar recarregar a página inteira
            }
        } catch (e) {
            setMsg({ txt: 'Erro ao gerar turma.', tipo: 'error' });
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1A2B4C' }}>Painel do Docente — GeoMatrix</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#718096' }}>Gerenciamento de Turmas e Alunos Vinculados</p>
                </div>
                <button onClick={onLogout} style={{ background: '#FF4D4D', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Sair do Painel</button>
            </header>

            {msg.txt && (
                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: msg.tipo === 'success' ? '#C6F6D5' : '#FED7D7', color: msg.tipo === 'success' ? '#22543D' : '#742A2A', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                    {msg.txt}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Coluna 1: Criar Turma */}
                <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#2D3748' }}>🏫 Adicionar Nova Turma</h3>
                    <form onSubmit={criarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome da Turma:</label>
                            <input type="text" value={novaTurmaNome} onChange={(e) => setNovaTurmaNome(e.target.value)} placeholder="Ex: 8º Ano B" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }} required />
                        </div>
                        <button type="submit" style={{ background: '#3182CE', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Turma no Banco</button>
                    </form>

                    <h4 style={{ marginBottom: '10px', marginTop: '2rem' }}>Turmas Ativas no MongoDB:</h4>
                    <ul style={{ paddingLeft: '20px', color: '#4A5568' }}>
                        {t_lista.map((t) => <li key={t._id}><strong>{t.nome}</strong></li>)}
                    </ul>
                </div>

                {/* Coluna 2: Cadastrar Aluno */}
                <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#2D3748' }}>🎓 Matricular Estudante</h3>
                    <form onSubmit={cadastrarAluno} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome Completo do Aluno:</label>
                            <input type="text" value={nomeAluno} onChange={(e) => setNomeAluno(e.target.value)} placeholder="Ex: Jean Bertrand" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Login de Usuário:</label>
                            <input type="text" value={userAluno} onChange={(e) => setUserAluno(e.target.value || e.target.value)} placeholder="Ex: jean.bertrand" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Selecionar Turma Relacional:</label>
                            <select value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                                {t_lista.map((t) => <option key={t._id} value={t.nome}>{t.nome}</option>)}
                            </select>
                        </div>
                        <button type="submit" style={{ background: '#38A169', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Efetuar Matrícula</button>
                    </form>
                </div>
            </div>

            {/* Lista Geral de Alunos Cadastrados no rodapé */}
            <div style={{ marginTop: '3rem', background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
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
    );
}