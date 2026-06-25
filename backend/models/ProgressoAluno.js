const mongoose = require('mongoose');

const ProgressoAlunoSchema = new mongoose.Schema({
  aluno: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  assunto: { type: String, required: true },
  // Nível numérico de proficiência (1 = Fácil, 2 = Médio, 3 = Difícil)
  nivelAtual: { type: Number, default: 2, min: 1, max: 3 }, 
  questoesRespondidas: [{ type: Number }], // Guarda o 'id' numérico das questões já feitas
}, { timestamps: true });

// Garante que o aluno só tenha um registro de progresso por assunto
ProgressoAlunoSchema.index({ aluno: 1, assunto: 1 }, { unique: true });

module.exports = mongoose.model('ProgressoAluno', ProgressoAlunoSchema);