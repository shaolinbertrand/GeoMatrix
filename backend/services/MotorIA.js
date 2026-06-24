const Aluno = require('../models/Aluno');
const Questao = require('../models/Questao');

class MotorAdaptativo {
  /**
   * Passo 1: Analisar o erro do aluno e atualizar a matriz de competências (Telemetria)
   */
  async processarErro(alunoId, questaoId) {
    try {
      // Busca a questão para saber qual o conteúdo/habilidade dela
      const questao = await Questao.findById(questaoId);
      if (!questao) return;

      let campoErro = '';
      if (questao.conteudo === 'Álgebra') campoErro = 'metatags_ia.erros_algebra';
      if (questao.conteudo === 'Geometria') campoErro = 'metatags_ia.erros_geometria';
      if (questao.conteudo === 'Proporcionalidade') campoErro = 'metatags_ia.erros_proporcionalidade';

      // Executa o passo a passo da arquitetura: Atualiza os contadores de erro no MongoDB
      const atualizacao = {
            $inc: { 
                [campoErro]: 1 
            },
            $push: { 
                historico_desafios: { 
                    questao_id: questaoId, 
                    resolvido: false, 
                    tentativas: 1 // Passa o valor estático 1 na criação do log de tentativa
                } 
            }
        };

      await Aluno.findByIdAndUpdate(alunoId, atualizacao);
      
      // Aciona o rebalanceamento do perfil do aluno
      await this.recalcularConteudoCritico(alunoId);

    } catch (error) {
      console.error("Erro no processamento do motor de IA:", error);
    }
  }

  /**
   * Passo 2: Motor de inferência que decide o foco crítico atual do aluno
   */
  async recalcularConteudoCritico(alunoId) {
    const aluno = await Aluno.findById(alunoId);
    const { erros_algebra, erros_geometria, erros_proporcionalidade } = aluno.metatags_ia;

    // Regra de decisão da IA: define como crítico o conteúdo com maior taxa de erro
    let maiorErro = Math.max(erros_algebra, erros_geometria, erros_proporcionalidade);
    let novoConteudoCritico = 'Geometria'; // Padrão

    if (maiorErro === erros_algebra) novoConteudoCritico = 'Álgebra';
    else if (maiorErro === erros_proporcionalidade) novoConteudoCritico = 'Proporcionalidade';

    // Salva a decisão de adaptação no banco de dados
    aluno.metatags_ia.conteudo_critico = novoConteudoCritico;
    await aluno.save();
  }

  /**
   * Passo 3: Seleção Adaptativa da próxima questão baseada no foco crítico
   */
  async selecionarProximaQuestao(alunoId) {
    const aluno = await Aluno.findById(alunoId);
    const focoDoAluno = aluno.metatags_ia.conteudo_critico;

    // Busca questões do conteúdo crítico que o aluno ainda não resolveu com sucesso
    const questoesRespondidas = aluno.historico_desafios
      .filter(h => h.resolvido)
      .map(h => h.questao_id);

    const proximaQuestao = await Questao.findOne({
      conteudo: focoDoAluno,
      _id: { $nin: questoesRespondidas }
    });

    // Se ele já resolveu todas do ponto crítico, traz uma genérica de nível médio
    if (!proximaQuestao) {
      return await Questao.findOne({ _id: { $nin: questoesRespondidas } });
    }

    return proximaQuestao;
  }
}

module.exports = new MotorAdaptativo();