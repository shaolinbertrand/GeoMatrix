const mongoose = require('mongoose');

const TurmaSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true }, // Ex: "8º Ano A"
  professor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Turma', TurmaSchema);