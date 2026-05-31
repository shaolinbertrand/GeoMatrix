const Aluno = require('../models/Aluno');

exports.executarLogin = async (req, res) => {
    const { usuario, senha, tipo } = req.body;
    try {
        if (tipo === 'professor') {
            if (usuario === 'admin' && senha === '123') {
                return res.json({ role: 'professor', nome: 'Professor Jean Bertrand' });
            }
            return res.status(401).json({ error: 'Credenciais de professor inválidas.' });
        } else {
            const aluno = await Aluno.findOne({ usuario: usuario.toLowerCase(), senha });
            if (aluno) {
                return res.json({ role: 'aluno', id: aluno._id, nome: aluno.nome, turma: aluno.turma });
            }
            return res.status(401).json({ error: 'Usuário ou senha de aluno incorretos.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

exports.cadastrarAluno = async (req, res) => {
    const { usuario, nome, turma } = req.body;
    try {
        const usuarioExiste = await Aluno.findOne({ usuario: usuario.toLowerCase() });
        if (usuarioExiste) {
            return res.status(400).json({ error: 'Este nome de usuário já existe.' });
        }
        const novoAluno = new Aluno({ usuario: usuario.toLowerCase(), nome, turma });
        await novoAluno.save();
        res.status(201).json({ message: 'Aluno salvo com sucesso!', aluno: novoAluno });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao cadastrar aluno.' });
    }
};

exports.listarAlunos = async (req, res) => {
    try {
        const alunos = await Aluno.find();
        res.json(alunos);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
};

exports.atualizarProgresso = async (req, res) => {
    const { alunoId, pontuacao, desafios_concluidos } = req.body;
    try {
        await Aluno.findByIdAndUpdate(alunoId, { pontuacao, desafios_concluidos });
        res.json({ message: 'Progresso sincronizado!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar dados.' });
    }
};