const Professor = require('../models/Professor');
const QuestaoModel = require('../models/Questao');

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
// 🚀 NOVA ROTA: LOGIN EXCLUSIVO DO PROFESSOR
// ==========================================
const executarLoginProfessor = async (req, res) => {
  const { usuario, senha } = req.body;
    console.log("entrou no login com usuario: ",usuario,"e senha: ",senha)
  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    // Procura o usuário estritamente na coleção de Professores
    const professor = await Professor.findOne({ usuario, senha });

    if (!professor) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos para o painel docente.' });
    }

    // Retorna os dados do professor de forma idêntica ao que o front-end espera
    return res.status(200).json({
      _id: professor._id,
      nome: professor.nome,
      usuario: professor.usuario,
      role: professor.role // Retorna 'professor' para o App.jsx fazer o desvio de tela
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
      // Opcional: Limpa o banco antes para não duplicar nos testes. 
      // Se não quiser apagar o que já existe, comente a linha abaixo:
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

// Exportando todas as funções atualizadas do controlador
module.exports = {
  cadastrarProfessor,
  executarLoginProfessor,
  gerenciarBancoQuestoes
};