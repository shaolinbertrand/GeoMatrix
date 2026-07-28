import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api';

export default function LoginView({ onLoginSuccess }) { // 🎯 RECEBE A PROP onLoginSuccess AQUI
    const [tipoUsuario, setTipoUsuario] = useState('aluno');
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [feedback, setFeedback] = useState({ msg: '', tipo: '' });
    const navigate = useNavigate();

    const executarLogin = async (e) => {
        e.preventDefault();
        if (!usuario || !senha) {
            setFeedback({ msg: 'Por favor, preencha todos os campos.', tipo: 'error' });
            return;
        }

        try {
            const endpoint = tipoUsuario === 'professor' ? '/login-professor' : '/login';

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, senha })
            });
            const dados = await response.json();

            if (response.ok) {
                // 1. Grava no localStorage
                localStorage.setItem('geomatrix_token', dados.token);
                localStorage.setItem('session_role', dados.role);
                localStorage.setItem('session_name', dados.nome);
                localStorage.setItem('session_id', dados._id);

                if (dados.role === 'aluno') {
                    localStorage.setItem('session_turma', dados.turma_id?.nome || 'Sem Turma');
                    const idTurma = dados.turmaId || dados.turma_id?._id || '';
                    localStorage.setItem('geomatrix_turmaId', idTurma);
                }

                const userData = {
                    _id: dados._id,
                    nome: dados.nome,
                    role: dados.role
                };

                // 2. 🎯 NOTIFICA O APP/ROUTER QUE O USUÁRIO LOGOU (Atualiza o estado React instantaneamente)
                if (onLoginSuccess) {
                    onLoginSuccess(userData);
                }

                // 3. Redireciona
                if (dados.role === 'professor') {
                    navigate('/admin');
                } else {
                    navigate('/simulador');
                }
            } else {
                setFeedback({ msg: dados.error || 'Erro ao fazer login.', tipo: 'error' });
            }
        } catch (err) {
            setFeedback({ msg: 'Não foi possível conectar ao servidor.', tipo: 'error' });
        }
    };

    return (
        <div className="login-container">
            <div className="panel">
                <h2 id="loginTitle">{tipoUsuario === 'aluno' ? 'Área do Aluno' : 'Painel do Professor'}</h2>
                
                <div className="tab-group">
                    <button className={`tab-btn ${tipoUsuario === 'aluno' ? 'active' : ''}`} onClick={() => setTipoUsuario('aluno')}>Aluno</button>
                    <button className={`tab-btn ${tipoUsuario === 'professor' ? 'active' : ''}`} onClick={() => setTipoUsuario('professor')}>Professor</button>
                </div>

                <form onSubmit={executarLogin}>
                    <div className="form-row">
                        <div className="input-block">
                            <label>Usuário:</label>
                            <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Digite seu usuário..." />
                        </div>
                        <div className="input-block">
                            <label>Senha:</label>
                            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha..." />
                        </div>
                    </div>
                    <button type="submit" className="btn-login" style={{ marginTop: '1.5rem' }}>Entrar no Sistema</button>
                </form>

                {feedback.msg && (
                    <div className={`feedback-box feedback-${feedback.tipo}`} style={{ display: 'block', marginTop: '1rem' }}>
                        {feedback.msg}
                    </div>
                )}
            </div>
        </div>
    );
}