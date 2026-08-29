const Turma = require('../models/Turma');
const Aluno = require('../models/Aluno');

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

// Obtém o panorama geral de uma turma específica
const obterRelatorioTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;

    // Busca dados da própria turma
    const turma = await Turma.findById(turmaId);
    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }

    // Busca os alunos matriculados na turma (com suporte a variações de chave)
    const alunos = await Aluno.find({
      $or: [
        { turma_id: turmaId },
        { turmaId: turmaId },
        { turma: turmaId }
      ]
    }).select('nome usuario pontuacao desafios_concluidos historico_desafios');

    // Calcula métricas consolidadas
    let totalPontosTurma = 0;
    let totalAcertosTurma = 0;
    let totalTentativasTurma = 0; // 🎯 Contabiliza todas as tentativas (acertos + erros)

    const listaAlunos = alunos.map(aluno => {
      const pontos = aluno.pontuacao || 0;
      const desafios = aluno.desafios_concluidos || 0;
      
      totalPontosTurma += pontos;

      const acertos = aluno.historico_desafios?.filter(d => d.resolvido).length || 0;
      const totalTentativasAluno = aluno.historico_desafios?.length || 0;

      totalAcertosTurma += acertos;
      totalTentativasTurma += totalTentativasAluno;

      return {
        _id: aluno._id,
        nome: aluno.nome,
        usuario: aluno.usuario,
        pontuacao: pontos,
        desafiosConcluidos: desafios,
        taxaAcerto: totalTentativasAluno > 0 ? Math.round((acertos / totalTentativasAluno) * 100) : 0
      };
    });

    // 🎯 Precisão real da turma baseada na razão entre acertos e o total de respostas enviadas
    const mediaTaxaAcerto = totalTentativasTurma > 0 
      ? Math.round((totalAcertosTurma / totalTentativasTurma) * 100) 
      : 0;

    return res.status(200).json({
      turmaNome: turma.nome,
      totalAlunos: alunos.length,
      mediaPontos: alunos.length > 0 ? Math.round(totalPontosTurma / alunos.length) : 0,
      mediaTaxaAcerto,
      alunos: listaAlunos
    });

  } catch (error) {
    console.error('Erro ao gerar relatório da turma:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar relatório da turma.' });
  }
};
// ATUALIZA O NOME E OS CONTEÚDOS/ASSUNTOS ATIVOS DA TURMA
const atualizarTurma = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, assuntosAtivos } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID da turma não informado.' });
    }

    const turmaAtualizada = await Turma.findByIdAndUpdate(
      id,
      { 
        $set: { 
          nome, 
          assuntosAtivos: assuntosAtivos || [] 
        } 
      },
      { new: true }
    );

    if (!turmaAtualizada) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }

    return res.status(200).json({
      message: `🎉 Turma '${turmaAtualizada.nome}' atualizada com sucesso!`,
      turma: turmaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar turma.' });
  }
};
module.exports = {
  criarTurma,
  listarTurmas,
  obterRelatorioTurma,
  atualizarTurma
};