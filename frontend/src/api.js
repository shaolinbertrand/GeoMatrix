// --- CONFIGURAÇÃO DINÂMICA DA API ---
const API_IP = "localhost"; // Mude para o IP do seu Wi-Fi para testar no celular
const API_PORT = "3000";

export const BASE_URL = `http://${API_IP}:${API_PORT}/api`;

export const login = async (usuario, senha, tipo) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha, tipo }),
  });
  if (!response.ok) throw new Error('Falha no login');
  return response.json();
};

export const cadastrarAluno = async (aluno) => {
  const response = await fetch(`${BASE_URL}/alunos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aluno),
  });
  if (!response.ok) throw new Error('Erro ao cadastrar aluno');
  return response.json();
};

export const listarAlunos = async () => {
  const response = await fetch(`${BASE_URL}/alunos`);
  if (!response.ok) throw new Error('Erro ao buscar alunos');
  return response.json();
};

export const verificarRespostaIA = async (alunoId, questaoId, respostaAluno) => {
  const response = await fetch(`${BASE_URL}/verificar-resposta`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alunoId, questaoId, respostaAluno }),
  });
  if (!response.ok) throw new Error('Erro ao processar resposta');
  return response.json();
};

export const criarTurma = async (nome, professorId) => {
  const response = await fetch(`${BASE_URL}/turmas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, professor_id: professorId }),
  });
  if (!response.ok) throw new Error('Erro ao criar turma');
  return response.json();
};

export const listarTurmas = async () => {
  const response = await fetch(`${BASE_URL}/turmas`);
  if (!response.ok) throw new Error('Erro ao buscar turmas');
  return response.json();
};