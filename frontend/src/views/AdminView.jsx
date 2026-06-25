import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../api';

export default function AdminView({ onLogout }) {
    const [abaAtiva, setAbaAtiva] = useState('turmas');
    const [msg, setMsg] = useState({ txt: '', tipo: '' });
    
    // Listas dinâmicas do Banco de Dados
    const [t_lista, setT_lista] = useState([]);
    const [alunosLista, setAlunosLista] = useState([]);
    const [listaAssuntos, setListaAssuntos] = useState([]); // 🎯 Agora vem do MongoDB

    // Estados dos formulários
    const [turmaSelecionada, setTurmaSelecionada] = useState('');
    const [nomeAluno, setNomeAluno] = useState('');
    const [userAluno, setUserAluno] = useState('');
    const [novaTurmaNome, setNovaTurmaNome] = useState('');
    const [assuntosSelecionados, setAssuntosSelecionados] = useState([]);

    const [novaQuestao, setNovaQuestao] = useState({
        id: '', categoria: 'Geometria', assunto: '',
        dificuldade: 'Médio', tipo: 'objetiva', enunciado: '',
        opcaoA: '', opcaoB: '', opcaoC: '', opcaoD: '', gabarito: '1'
    });

    const token = localStorage.getItem('geomatrix_token');
    const nomeProfessor = localStorage.getItem('session_name') || 'Professor';
    const professorId = localStorage.getItem('session_id');

    // Carregamento inicial de dados unificado
    useEffect(() => {
        if (token) {
            buscarTurmas();
            buscarAlunos();
            buscarAssuntosDoBanco();
        }
    }, [token]);

    const buscarTurmas = async () => {
        try {
            const res = await fetch(`${BASE_URL}/turmas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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

    // 🎯 BUSCA DINÂMICA DE ASSUNTOS CADASTRADOS
    const buscarAssuntosDoBanco = async () => {
        try {
            const res = await fetch(`${BASE_URL}/questoes/assuntos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const dados = await res.json();
                setListaAssuntos(dados);
                // Define o primeiro assunto como padrão para o formulário de criar questões
                if (dados.length > 0) {
                    setNovaQuestao(prev => ({ ...prev, assunto: dados[0] }));
                }
            }
        } catch (err) {
            console.error("Erro ao buscar assuntos dinâmicos:", err);
        }
    };

    const handleCheckboxChange = (assunto) => {
        if (assuntosSelecionados.includes(assunto)) {
            setAssuntosSelecionados(assuntosSelecionados.filter(item => item !== assunto));
        } else {
            setAssuntosSelecionados([...assuntosSelecionados, assunto]);
        }
    };

    const criarTurma = async (e) => {
        e.preventDefault();
        if (!novaTurmaNome) return;
        if (assuntosSelecionados.length === 0) {
            setMsg({ txt: '❌ Selecione pelo menos um assunto ativo para a IA da turma.', tipo: 'error' });
            return;
        }

        // Tenta capturar o ID do professor de todas as fontes possíveis do localStorage
        const idDoDocente = localStorage.getItem('session_id') || 
                            localStorage.getItem('_id') || 
                            localStorage.getItem('professor_id');

        try {
            const res = await fetch(`${BASE_URL}/turmas`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    nome: novaTurmaNome, 
                    professor: idDoDocente,    // Mongoose exige este campo populado
                    professor_id: idDoDocente, // Mantém compatibilidade histórica
                    assuntosAtivos: assuntosSelecionados
                })
            });
            
            if (res.ok) {
                setMsg({ txt: `🎉 Turma '${novaTurmaNome}' salva com sua trilha ativa de IA!`, tipo: 'success' });
                setNovaTurmaNome('');
                setAssuntosSelecionados([]);
                buscarTurmas();
            } else {
                const err = await res.json();
                setMsg({ txt: `❌ Erro: ${err.error || 'Erro na validação do servidor.'}`, tipo: 'error' });
            }
        } catch (e) {
            setMsg({ txt: 'Erro ao gerar turma.', tipo: 'error' });
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
                setMsg({ txt: '✅ Nova questão inserida com sucesso! O banco de dados foi atualizado.', tipo: 'success' });
                setNovaQuestao({ ...novaQuestao, id: '', enunciado: '', opcaoA: '', opcaoB: '', opcaoC: '', opcaoD: '' });
                buscarAssuntosDoBanco(); // 🎯 Recarrega os assuntos caso um novo tenha sido digitado/criado
            } else {
                const err = await res.json();
                setMsg({ txt: `❌ Erro: ${err.error}`, tipo: 'error' });
            }
        } catch (err) {
            setMsg({ txt: '❌ Erro ao conectar com o banco de dados.', tipo: 'error' });
        }
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

            {abaAtiva === 'turmas' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ background: '#FFF', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ marginTop: 0, color: '#2D3748' }}>🏫 Adicionar Nova Turma</h3>
                            <form onSubmit={criarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome da Turma:</label>
                                    <input type="text" value={novaTurmaNome} onChange={(e) => setNovaTurmaNome(e.target.value)} placeholder="Ex: 8º Ano A" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }} required />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ativar Assuntos no Motor Adaptativo:</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: '#F7FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                        {listaAssuntos.length === 0 ? (
                                            <p style={{ color: '#A0AEC0', fontSize: '0.9rem', margin: 0 }}>Nenhum assunto encontrado no banco de dados. Cadastre questões primeiro!</p>
                                        ) : (
                                            listaAssuntos.map((assunto, i) => (
                                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={assuntosSelecionados.includes(assunto)} onChange={() => handleCheckboxChange(assunto)} />
                                                    {assunto}
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <button type="submit" style={{ background: '#3182CE', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Turma no Banco</button>
                            </form>

                            <h4 style={{ marginBottom: '10px', marginTop: '1.5rem' }}>Turmas Configuradas:</h4>
                            <ul style={{ paddingLeft: '20px', color: '#4A5568' }}>
                                {t_lista.map((t) => <li key={t._id}><strong>{t.nome}</strong> — Tópicos ativos: {t.assuntosAtivos?.length || 0}</li>)}
                            </ul>
                        </div>

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
                                        {t_lista.length === 0 ? (
                                            <option value="">Nenhuma turma encontrada...</option>
                                        ) : (
                                            t_lista.map((t) => (
                                                <option key={t._id} value={t.nome}>
                                                    {t.nome}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <button type="submit" style={{ background: '#38A169', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Efetuar Matrícula</button>
                            </form>
                        </div>
                    </div>

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

            {abaAtiva === 'questoes' && (
                <div style={{ background: '#FFF', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#2D3748' }}>🧠 Expandir Banco de Questões Dinâmicas</h3>
                    <form onSubmit={cadastrarQuestaoAvulsa} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ID Numérico único:</label>
                                <input type="number" value={novaQuestao.id} onChange={(e) => setNovaQuestao({...novaQuestao, id: e.target.value})} placeholder="Ex: 101" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tópico do Currículo:</label>
                                <input 
                                    type="text" 
                                    value={novaQuestao.assunto} 
                                    onChange={(e) => setNovaQuestao({...novaQuestao, assunto: e.target.value})} 
                                    placeholder="Digite o assunto (Ex: Teorema de Pitágoras)" 
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0' }} 
                                    required 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nível de Complexidade:</label>
                                <select value={novaQuestao.dificuldade} onChange={(e) => setNovaQuestao({...novaQuestao, difficulty: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                                    <option>Fácil</option>
                                    <option>Médio</option>
                                    <option>Difícil</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Formato da Questão:</label>
                                <select value={novaQuestao.tipo} onChange={(e) => setNovaQuestao({...novaQuestao, tipo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0' }}>
                                    <option value="objetiva">Múltipla Escolha (Objetiva)</option>
                                    <option value="discursiva">Desenvolvimento Passo a Passo (Discursiva)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Enunciado Contextualizado:</label>
                                <textarea rows="3" value={novaQuestao.enunciado} onChange={(e) => setNovaQuestao({...novaQuestao, enunciado: e.target.value})} placeholder="Escreva o problema matemático..." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0', resize: 'none' }} required />
                            </div>

                            {novaQuestao.tipo === 'objetiva' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <input type="text" value={novaQuestao.opcaoA} onChange={(e) => setNovaQuestao({...novaQuestao, opcaoA: e.target.value})} placeholder="Opção A" style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }} required />
                                    <input type="text" value={novaQuestao.opcaoB} onChange={(e) => setNovaQuestao({...novaQuestao, opcaoB: e.target.value})} placeholder="Opção B" style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }} required />
                                    <input type="text" value={novaQuestao.opcaoC} onChange={(e) => setNovaQuestao({...novaQuestao, opcaoC: e.target.value})} placeholder="Opção C" style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }} required />
                                    <input type="text" value={novaQuestao.opcaoD} onChange={(e) => setNovaQuestao({...novaQuestao, opcaoD: e.target.value})} placeholder="Opção D" style={{ padding: '8px', border: '1px solid #CBD5E0', borderRadius: '4px' }} required />
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gabarito / Solução Oficial:</label>
                                <input type="text" value={novaQuestao.gabarito} onChange={(e) => setNovaQuestao({...novaQuestao, gabarito: e.target.value})} placeholder={novaQuestao.tipo === 'objetiva' ? "Digite a opção correta exatamente igual" : "Escreva a resposta final numérica"} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E0' }} required />
                            </div>

                            <button type="submit" style={{ background: '#2B6CB0', color: '#FFF', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto' }}>Inserir Questão no Repositório</button>
                        </div>
                    </form>
                </div>
            )}

            {abaAtiva === 'dashboard' && (
                <div style={{ background: '#FFF', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                    <h3 style={{ color: '#2D3748', marginBottom: '1rem' }}>📊 Dashboard Analítico de Desempenho</h3>
                    <p style={{ color: '#718096', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                        Esta seção está reservada para o módulo gráfico de evolução. Em breve, você poderá acompanhar relatórios de erros interceptados pela IA e a proficiência média das turmas por assunto do currículo.
                    </p>
                    <div style={{ height: '200px', background: '#EDF2F7', border: '2px dashed #CBD5E0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', fontWeight: 'bold' }}>
                        Módulo Gráfico (Placeholder — Próxima Fase do Projeto)
                    </div>
                </div>
            )}
        </div>
    );
}