const Questao = require('../models/Questao');
const Turma = require('../models/Turma');
const ProgressoAluno = require('../models/ProgressoAluno');

/**
 * 1. BUSCA A PRÓXIMA QUESTÃO ADAPTATIVA PARA O ALUNO
 * Rota: GET /api/questoes/proxima
 */
exports.obterProximaQuestaoAdaptativa = async (req, res) => {
  try {
    // Pegamos os IDs decodificados do token JWT pelo middleware de autenticação
    const alunoId = req.usuario.id; 
    const turmaId = req.usuario.turmaId; 

    // Busca a turma para capturar a lista de assuntos ativos liberados pelo professor
    const turma = await Turma.findById(turmaId);
    if (!turma || !turma.assuntosAtivos || turma.assuntosAtivos.length === 0) {
      return res.status(400).json({ error: "Nenhum conteúdo ou assunto ativo para a sua turma no momento." });
    }

    // Criamos uma chave unificada para agrupar o progresso do aluno neste bloco de estudos
    // (Une os assuntos ativos em ordem alfabética para rastreamento unificado)
    const chaveEstudo = [...turma.assuntosAtivos].sort().join('|');

    // Busca ou inicializa o prontuário de proficiência do aluno para este conjunto de conteúdos
    let progresso = await ProgressoAluno.findOne({ aluno: alunoId, assunto: chaveEstudo });
    if (!progresso) {
      progresso = await ProgressoAluno.create({ 
        aluno: alunoId, 
        assunto: chaveEstudo, 
        nivelAtual: 2 // Inicia no nível 2 (médio) como termômetro inicial
      });
    }

    // Traduz o nível numérico interno da IA para a string salva no banco de dados de questões
    const mapaDificuldade = { 1: 'fácil', 2: 'médio', 3: 'difícil' };
    const dificuldadeAlvo = mapaDificuldade[progresso.nivelAtual];

    // 🎯 Query Adaptativa: Procura uma questão contida nos assuntos ativos,
    // na dificuldade calculada pela IA e que o aluno ainda NÃO respondeu (Filtro por 'numero').
    let questao = await Questao.findOne({
      assunto: { $in: turma.assuntosAtivos },
      dificuldade: dificuldadeAlvo,
      numero: { $nin: progresso.questoesRespondidas } // ✅ Corrigido de 'id' para 'numero'
    });

    // Fallback de Segurança: Se as questões da dificuldade exata acabarem,
    // varre o banco buscando qualquer questão restante dos temas ativos (Filtro por 'numero').
    if (!questao) {
      questao = await Questao.findOne({
        assunto: { $in: turma.assuntosAtivos },
        numero: { $nin: progresso.questoesRespondidas } // ✅ Corrigido de 'id' para 'numero'
      });
    }

    // Se o aluno exauriu completamente todas as questões dos temas ativos
    if (!questao) {
      return res.json({ 
        concluido: true, 
        message: "🎉 Parabéns! Você concluiu todas as questões disponíveis para os temas ativos da sua turma!" 
      });
    }

    // Retorna a questão limpa para o front-end (Omitimos o gabarito para evitar trapaças via DevTools)
    return res.json({
      concluido: false,
      questao: {
        id: questao._id, // ✅ Incluído explicitamente para o SimuladorView poder usar no POST de submissão
        numero: questao.numero, // ✅ Identificador sequencial exibido na tela
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
    const { questaoId, respostaAluno } = req.body; // respostaAluno ex: "c) 48°" ou texto livre

    if (!questaoId || respostaAluno === undefined) {
      return res.status(400).json({ error: "Parâmetros 'questaoId' e 'respostaAluno' são obrigatórios." });
    }

    // Localiza a questão original no banco para extrair o gabarito correto
    const questaoOriginal = await Questao.findById(questaoId);
    if (!questaoOriginal) {
      return res.status(404).json({ error: "Questão não localizada no banco de dados." });
    }

    // Busca a configuração da turma para recuperar a chave de estudo ativa
    const turma = await Turma.findById(turmaId);
    if (!turma) {
      return res.status(404).json({ error: "Turma não encontrada." });
    }
    const chaveEstudo = [...turma.assuntosAtivos].sort().join('|');

    // Recupera o registro de progresso do estudante
    let progresso = await ProgressoAluno.findOne({ aluno: alunoId, assunto: chaveEstudo });
    if (!progresso) {
      progresso = await ProgressoAluno.create({ aluno: alunoId, assunto: chaveEstudo, nivelAtual: 2 });
    }

   let acertou = false;

    // Lógica de Correção Avançada com base no tipo de questão
    if (questaoOriginal.tipo === 'objetiva') {
      // Extrai apenas a letra inicial (ex: "c") para evitar divergências por pequenos espaços
      const letraGabarito = questaoOriginal.gabarito.trim().charAt(0).toLowerCase();
      const letraResposta = respostaAluno.trim().charAt(0).toLowerCase();
      acertou = (letraGabarito === letraResposta);
    } else {
      // ✅ MELHORIA: Limpa a resposta do aluno mantendo apenas os números
      const apenasNumerosAluno = respostaAluno.replace(/\D/g, '');
      
      // 1. Se o professor cadastrou um valor numérico exato no campo 'resposta_correta'
      if (questaoOriginal.resposta_correta !== undefined && questaoOriginal.resposta_correta !== null) {
        const valorEsperado = questaoOriginal.resposta_correta.toString();
        acertou = (apenasNumerosAluno === valorEsperado);
      } else {
        // 2. Fallback caso não tenha 'resposta_correta' preenchida: busca o último número isolado do gabarito
        const numerosNoGabarito = questaoOriginal.gabarito.match(/\d+/g); // Pega todos os números do texto
        if (numerosNoGabarito && numerosNoGabarito.length > 0) {
          // Pega o último número do texto (que geralmente é a resposta final, ex: "8000")
          const ultimoNumeroGabarito = numerosNoGabarito[numerosNoGabarito.length - 1];
          acertou = apenasNumerosAluno.includes(ultimoNumeroGabarito);
        } else {
          // Se não houver números claros, faz a comparação por texto limpo
          const respostaLimpa = respostaAluno.trim().replace(/\s+/g, '').toLowerCase();
          const gabaritoLimpo = questaoOriginal.gabarito.trim().replace(/\s+/g, '').toLowerCase();
          acertou = (respostaLimpa === gabaritoLimpo);
        }
      }
    }

    // MOTOR DE INTEGRAÇÃO ADAPTATIVA (IA):
    // Se o aluno acertou, incrementamos o nível de dificuldade (+1).
    // Se o aluno errou, decrementamos a dificuldade (-1).
    if (acertou) {
      if (progresso.nivelAtual < 3) progresso.nivelAtual += 1;
    } else {
      if (progresso.nivelAtual > 1) progresso.nivelAtual -= 1;
    }

    // Adiciona o ID da questão atual no histórico de respondidas para não repeti-la
    if (!progresso.questoesRespondidas.includes(questaoOriginal.numero)) {
      progresso.questoesRespondidas.push(questaoOriginal.numero);
    }

    // Salva as alterações de proficiência e histórico no MongoDB
    await progresso.save();

    // Retorna o veredito para o front-end exibir o feedback visual imediato ao aluno
    return res.json({
      acertou,
      gabaritoOficial: questaoOriginal.gabarito,
      proximoNivelIA: progresso.nivelAtual // 1: fácil, 2: médio, 3: difícil
    });

  } catch (error) {
    console.error("Erro na submissão da resposta:", error);
    return res.status(500).json({ error: "Erro interno ao validar a resposta do estudante." });
  }
};