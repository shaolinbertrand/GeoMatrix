const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/AlunoController');

router.post('/login', alunoController.executarLogin);
router.post('/alunos', alunoController.cadastrarAluno);
router.get('/alunos', alunoController.listarAlunos);
router.put('/salvar-progresso', alunoController.atualizarProgresso);

module.exports = router;