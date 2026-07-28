const Questao = require('../models/Questao');
const Turma = require('../models/Turma');
const Aluno = require('../models/Aluno');
const ProgressoAluno = require('../models/ProgressoAluno');

/**
 * 1. BUSCA A PRÓXIMA QUESTÃO ADAPTATIVA PARA O ALUNO
 * Rota: GET /api/questoes/proxima
 */
exports.obterProximaQuestaoAdaptativa = async (req, res) => {
  try {
    const alunoId = req.usuario.id; 
    const turmaId = req.usuario.turmaId; 

    const turma = await Turma.findById(turmaId);
    if (!turma || !turma.assuntosAtivos || turma.assuntosAtivos.length === 0) {
      return res.status(400).json({ error: "Nenhum conteúdo ou assunto ativo para a sua turma no momento." });
    }

    const chaveEstudo = [...turma.assuntosAtivos].sort().join('|');

    let progresso = await ProgressoAluno.findOne({ aluno: alunoId, assunto: chaveEstudo });
    if (!progresso) {
      progresso = await ProgressoAluno.create({ 
        aluno: alunoId, 
        assunto: chaveEstudo, 
        nivelAtual: 2 
      });
    }

    // Busca o aluno para verificar a ÚLTIMA questão respondida (evita repetição em sequência)
    const aluno = await Aluno.findById(alunoId);
    let ultimaQuestaoId = null;
    let ultimoNumeroQuestao = null;

    if (aluno && aluno.historico_desafios && aluno.historico_desafios.length > 0) {
      // Pega o ID da última questão tentada no histórico
      const ultimoHistorico = aluno.historico_desafios[aluno.historico_desafios.length - 1];
      ultimaQuestaoId = ultimoHistorico.questao_id;
      
      // Busca o número dessa última questão para usar no filtro
      if (ultimaQuestaoId) {
        const qUltima = await Questao.findById(ultimaQuestaoId);
        if (qUltima) ultimoNumeroQuestao = qUltima.numero;
      }
    }

    const mapaDificuldade = { 1: 'fácil', 2: 'médio', 3: 'difícil' };
    const dificuldadeAlvo = mapaDificuldade[progresso.nivelAtual];

    // Cria a lista de números a serem ignorados:
    // Todas as resolvidas COM SUCESSO + a ÚLTIMA respondida (para dar espaçamento se ele errou)
    const numerosParaIgnorar = [...progresso.questoesRespondidas];
    if (ultimoNumeroQuestao && !numerosParaIgnorar.includes(ultimoNumeroQuestao)) {
      numerosParaIgnorar.push(ultimoNumeroQuestao);
    }

    // 🎯 QUERY ADAPTATIVA: Busca todas as candidatas na dificuldade alvo
    let questoesCandidatas = await Questao.find({
      assunto: { $in: turma.assuntosAtivos },
      dificuldade: dificuldadeAlvo,
      numero: { $nin: numerosParaIgnorar }
    });

    // Fallback 1: Se não houver questões na dificuldade alvo, busca em qualquer dificuldade (respeitando o filtro de exclusão)
    if (questoesCandidatas.length === 0) {
      questoesCandidatas = await Questao.find({
        assunto: { $in: turma.assuntosAtivos },
        numero: { $nin: numerosParaIgnorar }
      });
    }

    // Fallback 2 (Emergência): Se a única questão restante no banco for a que ele ACABOU de errar,
    // permitimos que ela volte a aparecer para ele não ficar bloqueado.
    if (questoesCandidatas.length === 0 && ultimoNumeroQuestao) {
      questoesCandidatas = await Questao.find({
        assunto: { $in: turma.assuntosAtivos },
        numero: { $nin: progresso.questoesRespondidas } // Ignora apenas as que já foram marcadas como certas
      });
    }

    // Se concluiu todas as questões de verdade
    if (questoesCandidatas.length === 0) {
      return res.json({ 
        concluido: true, 
        message: "🎉 Parabéns! Você concluiu todas as questões disponíveis para os temas ativos da sua turma!" 
      });
    }

    // 🎲 ALEATORIZAÇÃO: Sorteia uma das questões candidatas encontradas
    const indiceSorteado = Math.floor(Math.random() * questoesCandidatas.length);
    const questao = questoesCandidatas[indiceSorteado];

    return res.json({
      concluido: false,
      questao: {
        id: questao._id, 
        numero: questao.numero, 
        categoria: questao.categoria,
        assunto: questao.assunto,
        dificuldade: questao.dificuldade,
        tipo: questao.tipo,
        enunciado: questao.enunciado,
        opcoes: questao.opcoes
      }
    });

  } catch (error) {
    console.error("Erro na busca adaptativa:", error);
    return res.status(500).json({ error: "Erro interno ao selecionar a próxima questão adaptativa." });
  }
};

/**
 * 2. CORRIGE A RESPOSTA E ATUALIZA O NÍVEL DA IA DO ALUNO
 * Rota: POST /api/questoes/submeter
 */
exports.submeterRespostaQuestao = async (req, res) => {
  try {
    const alunoId = req.usuario.id;
    const turmaId = req.usuario.turmaId;
    const { questaoId, respostaAluno } = req.body;

    if (!questaoId || respostaAluno === undefined) {
      return res.status(400).json({ error: "Parâmetros 'questaoId' e 'respostaAluno' são obrigatórios." });
    }

    const questaoOriginal = await Questao.findById(questaoId);
    if (!questaoOriginal) {
      return res.status(404).json({ error: "Questão não localizada no banco de dados." });
    }

    const turma = await Turma.findById(turmaId);
    if (!turma) {
      return res.status(404).json({ error: "Turma não encontrada." });
    }
    const chaveEstudo = [...turma.assuntosAtivos].sort().join('|');

    let progresso = await ProgressoAluno.findOne({ aluno: alunoId, assunto: chaveEstudo });
    if (!progresso) {
      progresso = await ProgressoAluno.create({ aluno: alunoId, assunto: chaveEstudo, nivelAtual: 2 });
    }

    // Busca o documento completo do Aluno para atualizar a Gamificação
    const aluno = await Aluno.findById(alunoId);

    let acertou = false;

    // LÓGICA DE CORREÇÃO
    if (questaoOriginal.tipo === 'objetiva') {
      const letraGabarito = questaoOriginal.gabarito.trim().charAt(0).toLowerCase();
      const letraResposta = respostaAluno.trim().charAt(0).toLowerCase();
      acertou = (letraGabarito === letraResposta);
    } else {
      const apenasNumerosAluno = respostaAluno.replace(/\D/g, '');
      
      if (questaoOriginal.resposta_correta !== undefined && questaoOriginal.resposta_correta !== null) {
        const valorEsperado = questaoOriginal.resposta_correta.toString();
        acertou = (apenasNumerosAluno === valorEsperado);
      } else {
        const numerosNoGabarito = questaoOriginal.gabarito.match(/\d+/g);
        if (numerosNoGabarito && numerosNoGabarito.length > 0) {
          const ultimoNumeroGabarito = numerosNoGabarito[numerosNoGabarito.length - 1];
          acertou = apenasNumerosAluno.includes(ultimoNumeroGabarito);
        } else {
          const respostaLimpa = respostaAluno.trim().replace(/\s+/g, '').toLowerCase();
          const gabaritoLimpo = questaoOriginal.gabarito.trim().replace(/\s+/g, '').toLowerCase();
          acertou = (respostaLimpa === gabaritoLimpo);
        }
      }
    }

    // REGISTRO DE TELEMETRIA NO HISTÓRICO DE DESAFIOS DO ALUNO
    let itemDesafio = aluno.historico_desafios.find(
      (h) => h.questao_id && h.questao_id.toString() === questaoOriginal._id.toString()
    );

    if (!itemDesafio) {
      // Primeira vez que o aluno tenta esta questão
      aluno.historico_desafios.push({
        questao_id: questaoOriginal._id,
        tentativas: 1,
        resolvido: acertou,
        data_resposta: new Date()
      });
    } else {
      // Incrementa as tentativas na mesma questão
      itemDesafio.tentativas += 1;
      itemDesafio.data_resposta = new Date();
      if (acertou) {
        itemDesafio.resolvido = true;
      }
    }

    // REGRAS DE GAMIFICAÇÃO E IA ADAPTATIVA
    const tabelaPontos = { 'fácil': 10, 'médio': 30, 'difícil': 50 };
    let pontosGanhos = 0;

    if (acertou) {
      // 1. Calcula os pontos
      pontosGanhos = tabelaPontos[questaoOriginal.dificuldade] || 10;
      aluno.pontuacao = (aluno.pontuacao || 0) + pontosGanhos;
      aluno.desafios_concluidos = (aluno.desafios_concluidos || 0) + 1;

      // 2. Sobe nível na IA
      if (progresso.nivelAtual < 3) progresso.nivelAtual += 1;

      // 3. Apenas em caso de ACERTO adiciona à lista para NÃO repetir mais
      if (!progresso.questoesRespondidas.includes(questaoOriginal.numero)) {
        progresso.questoesRespondidas.push(questaoOriginal.numero);
      }
    } else {
      // Se errou, cai a proficiência da IA
      if (progresso.nivelAtual > 1) progresso.nivelAtual -= 1;

      // ⚠️ NOTA: Como ERROU, NÃO adicionamos em 'questoesRespondidas'!
      // O motor de IA poderá sortear essa mesma questão novamente mais tarde.
    }

    // Salva as alterações nos dois modelos
    await aluno.save();
    await progresso.save();

    // Retorna o resultado e os dados de Gamificação para o Front-end
    return res.json({
      acertou,
      pontosGanhos: acertou ? pontosGanhos : 0,
      pontuacaoTotal: aluno.pontuacao,
      gabaritoOficial: questaoOriginal.gabarito,
      proximoNivelIA: progresso.nivelAtual
    });

  } catch (error) {
    console.error("Erro na submissão da resposta:", error);
    return res.status(500).json({ error: "Erro interno ao validar a resposta do estudante." });
  }
};