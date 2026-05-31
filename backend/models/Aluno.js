const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
    usuario: { type: String, required: true, unique: true },
    senha: { type: String, default: "123" },
    nome: { type: String, required: true },
    pontuacao: { type: Number, default: 0 },
    desafios_concluidos: { type: Number, default: 0 },
    turma: { type: String, required: true }
});

module.exports = mongoose.model('Aluno', AlunoSchema);