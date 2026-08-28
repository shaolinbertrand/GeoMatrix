const MotorAdaptativo = require('../services/MotorIA');
const Questao = require('../models/Questao');
const Aluno = require('../models/Aluno');
const Turma = require('../models/Turma');
// 🎯 IMPORTAÇÃO DO PROGRESSO DO ALUNO (Necessário para o Dashboard)
const ProgressoAluno = require('../models/ProgressoAluno'); 
// 🎯 IMPORTAÇÃO DO JWT: Necessário para gerar o token no login
const jwt = require('jsonwebtoken');

// 1. EXECUTA O LOGIN REATIVO UNIFICADO
const executarLogin = async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const aluno = await Aluno.findOne({ usuario, senha }).populate('turma_id', 'nome');
    if (!aluno) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // 🎯 GERAÇÃO DO TOKEN JWT: Monta o payload com os IDs necessários para o motor de IA
    const SECRET = process.env.JWT_SECRET || "SUA_CHAVE_SECRETA_AQUI";
    const token = jwt.sign(
      { 
        id: aluno._id, 
        turmaId: aluno.turma_id?._id || '' 
      }, 
      SECRET, 
      { expiresIn: '24h' } // Token expira em 24 horas
    );

    // Retorna a estrutura completa esperada pelo front-end
    return res.status(200).json({
      token,
      role: 'aluno',
      nome: aluno.nome,
      _id: aluno._id,
      turmaId: aluno.turma_id?._id || '',
      turma_id: aluno.turma_id // Mantém compatibilidade com o formato populado antigo
    });

  } catch (err) {
    console.error('Erro ao executar login:', err);
    return res.status(500).json({ error: 'Erro ao executar login.' });
  }
};

// 2. CADASTRA UM NOVO ALUNO NO MONGODB
const cadastrarAluno = async (req, res) => {
  const { nome, usuario, senha, turma_id } = req.body;

  try {
    const usuarioExistente = await Aluno.findOne({ usuario });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }

    const novoAluno = new Aluno({ nome, usuario, senha, turma_id });
    await novoAluno.save();
    return res.status(201).json({ message: 'Aluno cadastrado com sucesso!', aluno: novoAluno });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar aluno.' });
  }
};

// 3. LISTA TODOS OS ALUNOS (Para relatórios do professor)
const listarAlunos = async (req, res) => {
  try {
    const alunos = await Aluno.find().populate('turma_id', 'nome');
    return res.status(200).json(alunos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar alunos.' });
  }
};

// 4. ATUALIZA O PROGRESSO CLÁSSICO E SALVA XP
const atualizarProgresso = async (req, res) => {
  const { alunoId, pontuacao, desafios_concluidos } = req.body;

  try {
    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      alunoId,
      { $set: { pontuacao, desafios_concluidos } },
      { new: true }
    );
    return res.status(200).json(alunoAtualizado);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao salvar progresso.' });
  }
};

// 5. VINCULA OU MATRICULA UM ALUNO A UMA TURMA ESPECÍFICA
const vincularAlunoATurma = async (req, res) => {
  const { alunoId, turmaId } = req.body;

  if (!alunoId || !turmaId) {
    return res.status(400).json({ error: 'O ID do aluno e o ID da turma são obrigatórios.' });
  }

  try {
    const turmaExiste = await Turma.findById(turmaId);
    if (!turmaExiste) {
      return res.status(404).json({ error: 'A turma especificada não foi encontrada.' });
    }

    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      alunoId,
      { turma_id: turmaId },
      { new: true }
    ).populate('turma_id', 'nome');

    if (!alunoAtualizado) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }

    return res.status(200).json({
      message: `🎉 Aluno ${alunoAtualizado.nome} vinculado com sucesso à turma ${turmaExiste.nome}!`,
      aluno: alunoAtualizado
    });
  } catch (error) {
    console.error('Erro ao vincular aluno à turma:', error);
    return res.status(500).json({ error: 'Erro interno ao vincular aluno.' });
  }
};

// 6. ROTA ADAPTATIVA: VERIFICA GABARITO E ACIONA O MOTOR DE IA SE ERRAR
const verificarResposta = async (req, res) => {
  const { alunoId, questaoId, respostaAluno } = req.body;

  try {
    const questao = await Questao.findById(questaoId);
    if (!questao) {
      return res.status(404).json({ error: 'Questão não encontrada.' });
    }
    
    // Se o Aluno Acertou
    if (Number(respostaAluno) === questao.resposta_correta) {
      // Atualiza o histórico como resolvido com sucesso
      await Aluno.findByIdAndUpdate(alunoId, {
        $inc: { pontuacao: 10, desafios_concluidos: 1 },
        $push: { historico_desafios: { questao_id: questaoId, resolvido: true, tentativas: 1 } }
      });

      return res.status(200).json({ status: 'sucesso', msg: 'Resposta correta!' });
    } 

    // SE O ALUNO ERROU: Aciona instantaneamente a Camada de IA
    await MotorAdaptativo.processarErro(alunoId, questaoId);

    // IA intercepta o fluxo e busca a próxima recomendação baseada na falha
    const proximoDesafioPersonalizado = await MotorAdaptativo.selecionarProximaQuestao(alunoId);

    return res.status(200).json({ 
      status: 'erro', 
      msg: 'Resposta incorreta. O GeoMatrix adaptou a sua trilha!',
      proximaQuestao: proximoDesafioPersonalizado 
    });

  } catch (err) {
    console.error('Erro ao verificar resposta:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// 7. OBTÉM OS DADOS DO DASHBOARD COM ESTATÍSTICAS DE ERRO/ACERTO E DIAGNÓSTICO
const obterDashboardAluno = async (req, res) => {
  try {
    // 🎯 Se o professor passar o ID na URL (req.params.alunoId), usa ele; senão, usa o do token
    const alunoId = req.params.alunoId || req.usuario?.id || req.usuario?._id;

    if (!alunoId) {
      return res.status(400).json({ error: 'ID do aluno não localizado.' });
    }

    const aluno = await Aluno.findById(alunoId)
      .select('nome pontuacao desafios_concluidos historico_desafios')
      .populate('historico_desafios.questao_id', 'assunto tags categoria');

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado no banco de dados.' });
    }

    const progressos = await ProgressoAluno.find({ aluno: alunoId });

    const estatisticasPorAssunto = {};

    if (aluno.historico_desafios && aluno.historico_desafios.length > 0) {
      aluno.historico_desafios.forEach((item) => {
        const assunto = item.questao_id?.assunto;
        if (assunto) {
          if (!estatisticasPorAssunto[assunto]) {
            estatisticasPorAssunto[assunto] = { total: 0, acertos: 0, erros: 0 };
          }
          estatisticasPorAssunto[assunto].total += 1;
          if (item.resolvido) {
            estatisticasPorAssunto[assunto].acertos += 1;
          } else {
            estatisticasPorAssunto[assunto].erros += 1;
          }
        }
      });
    }

    const detalheTopicos = [];

    progressos.forEach((p) => {
      const listaAssuntos = p.assunto.split('|');

      listaAssuntos.forEach((assuntoNome) => {
        const nomeFormatado = assuntoNome.trim();
        if (nomeFormatado) {
          const stats = estatisticasPorAssunto[nomeFormatado] || { total: 0, acertos: 0, erros: 0 };
          
          const pctAcerto = stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0;
          const pctErro = stats.total > 0 ? Math.round((stats.erros / stats.total) * 100) : 0;

          detalheTopicos.push({
            assunto: nomeFormatado,
            nivelProficiencia: p.nivelAtual,
            questoesRespondidasCount: stats.total,
            acertos: stats.acertos,
            erros: stats.erros,
            porcentagemAcerto: pctAcerto,
            porcentagemErro: pctErro
          });
        }
      });
    });

    return res.status(200).json({
      nome: aluno.nome,
      pontuacaoTotal: aluno.pontuacao || 0,
      desafiosConcluidos: aluno.desafios_concluidos || 0,
      assuntosEmAndamento: detalheTopicos
    });

  } catch (error) {
    console.error('Erro ao carregar dashboard do aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar o dashboard do aluno.' });
  }
};

module.exports = {
  executarLogin,
  cadastrarAluno,
  listarAlunos,
  atualizarProgresso,
  vincularAlunoATurma,
  verificarResposta,
  obterDashboardAluno // Exportado com sucesso!
};