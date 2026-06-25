const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Pega o token vindo no cabeçalho Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Separa o "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
  }

  try {
    // Valida o token usando a sua chave secreta (mude para a string que você usou no login)
    const SECRET = process.env.JWT_SECRET || "SUA_CHAVE_SECRETA_AQUI";
    const decodificado = jwt.verify(token, SECRET);
    
    // Injeta os dados do aluno logado na requisição para o controller usar
    req.usuario = decodificado; 
    
    next(); // Passa o bastão para o QuestoesController
  } catch (error) {
    return res.status(403).json({ error: "Token inválido ou expirado." });
  }
};