const mongoose = require('mongoose');

const QuestaoSchema = new mongoose.Schema({
  enunciado: { type: String, required: true },
  resposta_correta: { type: Number, required: true },
  conteudo: { 
    type: String, 
    required: true, 
    enum: ['Geometria', 'Álgebra', 'Aritmética', 'Proporcionalidade'] 
  },
  nivel_dificuldade: { type: String, enum: ['Fácil', 'Médio', 'Difícil'], default: 'Médio' }
}, { timestamps: true });

module.exports = mongoose.model('Questao', QuestaoSchema);