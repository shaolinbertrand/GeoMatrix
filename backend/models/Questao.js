const mongoose = require('mongoose');

const QuestaoSchema = new mongoose.Schema({
  // 🎯 O número sequencial da questão (ex: 1, 2, 101) para evitar conflito com o _id do Mongo
  numero: { 
    type: Number, 
    required: true,
    unique: true 
  },
  
  enunciado: { 
    type: String, 
    required: true 
  },
  
  // Mantido por compatibilidade com as checagens numéricas do AlunoController
  resposta_correta: { 
    type: Number, 
    required: false // Deixado como false para não quebrar questões discursivas puro texto
  },
  
  // Armazena a string do gabarito oficial (pode ser a opção correta ou o valor final numérico)
  gabarito: { 
    type: String, 
    required: true 
  },
  
  // Mapeia a categoria macro do currículo do 8º e 9º ano
  categoria: { 
    type: String, 
    required: true, 
    enum: ['Geometria', 'Álgebra', 'Aritmética', 'Proporcionalidade', 'Estatística'],
    default: 'Geometria'
  },
  
  // 🎯 O assunto específico que vincula a questão à trilha da Turma (ex: "Ângulos complementares")
  assunto: { 
    type: String, 
    required: true 
  },
  
  // Define o comportamento da renderização no SimuladorView ('objetiva' ou 'discursiva')
  tipo: { 
    type: String, 
    required: true,
    enum: ['objetiva', 'discursiva'],
    default: 'objetiva'
  },
  
  // Array de strings contendo as alternativas (vazio se a questão for discursiva)
  opcoes: { 
    type: [String], 
    default: [] 
  },
  
  
dificuldade: { 
  type: String, // 🎯 Mudado de Number para String
  required: true,
  enum: ['Fácil', 'Médio', 'Difícil'], // Ajuste para bater com as strings
  default: 'Médio'
}
}, { timestamps: true });

module.exports = mongoose.model('Questao', QuestaoSchema);