const mongoose = require('mongoose');

const ProfessorSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  usuario: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  role: { type: String, default: 'professor' }
}, { timestamps: true });

module.exports = mongoose.model('Professor', ProfessorSchema);