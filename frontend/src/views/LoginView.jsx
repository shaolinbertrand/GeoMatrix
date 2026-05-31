import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api';

export default function LoginView() {
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
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, senha, tipo: tipoUsuario })
            });
            const dados = await response.json();

            if (response.ok) {
                localStorage.setItem('session_role', dados.role);
                localStorage.setItem('session_name', dados.nome);
                
                if (dados.role === 'professor') {
                    navigate('/admin');
                } else {
                    localStorage.setItem('session_id', dados.id);
                    localStorage.setItem('session_turma', dados.turma);
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