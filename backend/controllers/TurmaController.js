const Turma = require('../models/Turma');

const criarTurma = async (req, res) => {
  const { nome, periodo, professor_id } = req.body;

  if (!nome || !professor_id) {
    return res.status(400).json({ error: 'Nome da turma e ID do professor são obrigatórios.' });
  }

  try {
    const turmaExistente = await Turma.findOne({ nome });
    if (turmaExistente) {
      return res.status(400).json({ error: 'Uma turma com este nome já está cadastrada.' });
    }

    const novaTurma = new Turma({
      nome,
      periodo,
      professor_id
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
    const turmas = await Turma.find().populate('professor_id', 'nome');
    return res.status(200).json(turmas);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar turmas.' });
  }
};

// Exportação limpa e explícita que o api.js vai ler perfeitamente
module.exports = {
  criarTurma,
  listarTurmas
};