const Professor = require('../models/Professor');
const QuestaoModel = require('../models/Questao');
// 🎯 IMPORTAÇÃO DO JWT: Necessário para gerar o token de segurança do docente
const jwt = require('jsonwebtoken');

// ROTA ANTERIOR: Cadastro de Professor
const cadastrarProfessor = async (req, res) => {
  const { nome, usuario, senha } = req.body;
  if (!nome || !usuario || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    const professorExistente = await Professor.findOne({ usuario });
    if (professorExistente) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }
    const novoProfessor = new Professor({ nome, usuario, senha });
    await novoProfessor.save();
    return res.status(201).json({ message: '🎉 Professor cadastrado com sucesso!', professor: novoProfessor });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao cadastrar professor.' });
  }
};

// ==========================================
// 🚀 NOVA ROTA: LOGIN EXCLUSIVO DO PROFESSOR (Atualizada com JWT)
// ==========================================
const executarLoginProfessor = async (req, res) => {
  const { usuario, senha } = req.body;
  console.log("Entrou no login docente com usuario:", usuario);
  
  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    // Procura o usuário estritamente na coleção de Professores
    const professor = await Professor.findOne({ usuario, senha });

    if (!professor) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos para o painel docente.' });
    }

    // 🎯 GERAÇÃO DO TOKEN JWT DO PROFESSOR:
    // Mapeamos o ID e o papel de professor para validação posterior dos middlewares
    const SECRET = process.env.JWT_SECRET || "SUA_CHAVE_SECRETA_AQUI";
    const token = jwt.sign(
      { 
        id: professor._id, 
        role: 'professor' 
      }, 
      SECRET, 
      { expiresIn: '24h' }
    );

    // Retorna os dados do professor incluindo o Token gerado
    return res.status(200).json({
      token, // 🎯 Enviado com sucesso para o LoginView.jsx capturar!
      _id: professor._id,
      nome: professor.nome,
      usuario: professor.usuario,
      role: professor.role // Mantém o 'professor' para o desvio de tela no React
    });

  } catch (err) {
    console.error('Erro no login do professor:', err);
    return res.status(500).json({ error: 'Erro interno ao executar login.' });
  }
};

// ====================================================================
// 🚀 NOVA FUNÇÃO: CARGA EM LOTE OU CADASTRO AVULSO DE QUESTÕES
// ====================================================================
const gerenciarBancoQuestoes = async (req, res) => {
  const dados = req.body;

  if (!dados || (Array.isArray(dados) && dados.length === 0)) {
    return res.status(400).json({ error: 'Nenhum dado de questão foi fornecido.' });
  }

  try {
    // CASO A: Se receber um ARRAY (Carga em lote das 100 questões)
    if (Array.isArray(dados)) {
      // Limpa o banco antes para não duplicar nos testes. 
      await QuestaoModel.deleteMany({}); 

      const questoesInseridas = await QuestaoModel.insertMany(dados);
      return res.status(201).json({
        message: `🎉 Carga em lote realizada! ${questoesInseridas.length} questões foram salvas no MongoDB.`,
        quantidade: questoesInseridas.length
      });
    } 
    
    // CASO B: Se receber apenas um OBJETO (Cadastro de uma questão avulsa)
    else {
      const { id, categoria, assunto, dificuldade, tipo, enunciado, opcoes, gabarito } = dados;

      if (!enunciado || !gabarito) {
        return res.status(400).json({ error: 'Os campos enunciado e gabarito são obrigatórios.' });
      }

      const novaQuestao = new QuestaoModel({
        id,
        categoria,
        assunto,
        dificuldade,
        tipo,
        enunciado,
        opcoes,
        gabarito
      });

      await novaQuestao.save();
      return res.status(201).json({
        message: '✅ Questão individual cadastrada com sucesso no banco!',
        questao: novaQuestao
      });
    }

  } catch (err) {
    console.error('Erro ao gerenciar banco de questões:', err);
    return res.status(500).json({ error: 'Erro interno ao processar a inserção no banco de dados.' });
  }
};
// Retorna uma lista de strings com todos os assuntos únicos cadastrados no banco
const listarAssuntosDisponiveis = async (req, res) => {
  try {
    // O método distinct do Mongoose extrai valores únicos do campo 'assunto'
    const assuntos = await QuestaoModel.distinct('assunto');
    return res.status(200).json(assuntos);
  } catch (err) {
    console.error('Erro ao listar assuntos do banco:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar assuntos.' });
  }
};
module.exports = {
  cadastrarProfessor,
  executarLoginProfessor,
  gerenciarBancoQuestoes,
  listarAssuntosDisponiveis
};