const MotorAdaptativo = require('../services/MotorIA');
const Questao = require('../models/Questao');
const Aluno = require('../models/Aluno');
const Turma = require('../models/Turma');
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

// 5. VINCULA OU MATRICULA UM ALUNO A UMA TURMA SPECÍFICA
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
        $push: { historico_desafios: { questao_id: questaoId, resolvido: true, tentatives: 1 } }
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

module.exports = {
  executarLogin,
  cadastrarAluno,
  listarAlunos,
  atualizarProgresso,
  vincularAlunoATurma,
  verificarResposta
};