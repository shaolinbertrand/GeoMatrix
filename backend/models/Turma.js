const mongoose = require('mongoose');

const TurmaSchema = new mongoose.Schema({
  nome: { type: String, required: true }, // Ex: "8º Ano A"
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
  
  // CORREÇÃO: Agora é um Array! O professor pode marcar um ou vários assuntos para a turma
  assuntosAtivos: [{ type: String, required: true }], // Ex: ["Ângulos complementares", "Ângulos suplementares"]
  
  alunos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Aluno' }]
}, { timestamps: true });

module.exports = mongoose.model('Turma', TurmaSchema);