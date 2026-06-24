const express = require('express');
const router = express.Router();

// 1. IMPORTAÇÃO DOS CONTROLADORES
const alunoController = require('../controllers/AlunoController');
const turmaController = require('../controllers/TurmaController');
const professorController = require('../controllers/ProfessorController');

// ==========================================
// 🎓 ROTAS DE ALUNOS & AUTENTICAÇÃO (Suas rotas originais)
// ==========================================
router.post('/login', alunoController.executarLogin);
router.post('/alunos', alunoController.cadastrarAluno);
router.get('/alunos', alunoController.listarAlunos);
router.put('/salvar-progresso', alunoController.atualizarProgresso);


// ==========================================
// 🏫 ROTAS DE TURMAS (Novas: Painel do Professor)
// ==========================================

// Rota para o professor criar uma nova turma no MongoDB (POST)
router.post('/turmas', turmaController.criarTurma);

// Rota para listar as turmas no <select> do React (GET)
router.get('/turmas', turmaController.listarTurmas);


// ==========================================
// 🧠 ROTAS ADAPTATIVAS / VÍNCULOS
// ==========================================

// Rota para o professor vincular um aluno a uma turma específica (PUT)
router.put('/alunos/vincular-turma', alunoController.vincularAlunoATurma);

// Rota opcional para o fluxo da IA (se você preferir separar a verificação estática da adaptativa)
// router.put('/verificar-resposta', alunoController.verificarResposta);
// ==========================================
// 🧠 ROTAS PROFESSOR 
// ==========================================
router.post('/professor', professorController.cadastrarProfessor);
// 🎯 Nova rota de Login específica para Professores
router.post('/login-professor', professorController.executarLoginProfessor);
// 🎯 Endpoint unificado para carga em lote ou inserção individual de questões
router.post('/questoes/gerenciar', professorController.gerenciarBancoQuestoes);

module.exports = router;