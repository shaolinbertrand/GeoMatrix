const Turma = require('../models/Turma');

const criarTurma = async (req, res) => {
  // 🎯 Captura tanto os novos campos quanto mantém suporte aos mapeamentos antigos
  const { nome, periodo, professor, professor_id, assuntosAtivos } = req.body;

  // Define o ID final do professor priorizando o campo correto exigido pelo Schema
  const idProfessorFinal = professor || professor_id;

  if (!nome || !idProfessorFinal) {
    return res.status(400).json({ error: 'Nome da turma e ID do professor são obrigatórios.' });
  }

  try {
    const turmaExistente = await Turma.findOne({ nome });
    if (turmaExistente) {
      return res.status(400).json({ error: 'Uma turma com este nome já está cadastrada.' });
    }

    // 🎯 Instancia a turma mapeando os campos exatos do novo Schema do Mongoose
    const novaTurma = new Turma({
      nome,
      periodo,
      professor: idProfessorFinal, // Atribui ao campo exigido pelo Schema relacional
      assuntosAtivos: assuntosAtivos || [] // Inicializa a trilha da IA adaptativa
    });

    await novaTurma.save();
    return res.status(201).json({ message: '🎉 Turma criada com sucesso!', turma: novaTurma });

  } catch (error) {
    console.error('Erro ao criar turma:', error);
    return res.status(500).json({ error: 'Erro interno ao processar a criação da turma.' });
  }
};

const listarTurmas = async (req, res) => {
  try {
    // Atualizado para popular o campo correto 'professor'
    const turmas = await Turma.find().populate('professor', 'nome');
    return res.status(200).json(turmas);
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    return res.status(500).json({ error: 'Erro ao listar turmas.' });
  }
};

module.exports = {
  criarTurma,
  listarTurmas
};