const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  usuario: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  role: { type: String, default: 'aluno' },
  turma_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Turma', required: true },
  
  // Dados de Progresso Gamificado
  pontuacao: { type: Number, default: 0 },
  desafios_concluidos: { type: Number, default: 0 },

  // TELEMETRIA PARA A CAMADA DE IA (Mapeamento de Competências)
  metatags_ia: {
    erros_algebra: { type: Number, default: 0 },
    erros_geometria: { type: Number, default: 0 },
    erros_proporcionalidade: { type: Number, default: 0 },
    conteudo_critico: { type: String, default: 'Geometria' } // Define o foco atual do gerador adaptativo
  },

  // Tabela Associativa Relacional Traduzida para Coleção Embutida (Subdocumento)
  historico_desafios: [{
    questao_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Questao' },
    tentativas: { type: Number, default: 0 },
    resolvido: { type: Boolean, default: false },
    data_resposta: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Aluno', AlunoSchema);