const express = require('express');
const router = express.Router();

// 1. IMPORTAÇÃO DOS CONTROLADORES
const alunoController = require('../controllers/AlunoController');
const turmaController = require('../controllers/TurmaController');
const professorController = require('../controllers/ProfessorController');
const questoesController = require('../controllers/QuestoesController');

// 2. IMPORTAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO
const autenticarToken = require('../middlewares/autenticarToken');

// ==========================================
// 🎓 ROTAS DE ALUNOS & AUTENTICAÇÃO (Públicas)
// ==========================================
router.post('/login', alunoController.executarLogin);
router.post('/alunos', alunoController.cadastrarAluno);
router.get('/alunos', alunoController.listarAlunos);

// ==========================================
// 🧠 ROTAS DE PROFESSOR (Cadastro e Login Públicos)
// ==========================================
router.post('/professor', professorController.cadastrarProfessor);
router.post('/login-professor', professorController.executarLoginProfessor);


// ==========================================
// 🔒 ROTAS PROTEGIDAS (Exigem Autenticação)
// ==========================================

// --- Aluno ---
// Rota para o aluno salvar o progresso geral
router.put('/salvar-progresso', autenticarToken, alunoController.atualizarProgresso);

// Rota adaptativa para recuperar a próxima questão estruturada pela IA
router.get('/proxima', autenticarToken, questoesController.obterProximaQuestaoAdaptativa);

// Rota para submeter, corrigir e computar a pontuação adaptativa
router.post('/submeter', autenticarToken, questoesController.submeterRespostaQuestao);
router.get('/alunos/:alunoId/dashboard', autenticarToken, alunoController.obterDashboardAluno);


// --- Professor / Turmas ---
// Rota para o professor criar uma nova turma no MongoDB
router.post('/turmas', autenticarToken, turmaController.criarTurma);

// Rota para listar as turmas no <select> do React
router.get('/turmas', autenticarToken, turmaController.listarTurmas);

//Rota para o professor pegar o leatorio da turma
router.get('/turmas/:turmaId/relatorio', autenticarToken, turmaController.obterRelatorioTurma);
// Rota para o professor vincular um aluno a uma turma específica
router.put('/alunos/vincular-turma', autenticarToken, alunoController.vincularAlunoATurma);

// Endpoint unificado para carga em lote ou inserção individual de questões
router.post('/questoes/gerenciar', autenticarToken, professorController.gerenciarBancoQuestoes);
// Rota para listar todos os assuntos únicos que possuem questões cadastradas
router.get('/questoes/assuntos', autenticarToken, professorController.listarAssuntosDisponiveis);

module.exports = router;