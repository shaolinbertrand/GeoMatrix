const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Banco de Dados
mongoose.connect('mongodb://localhost:27017/geomatrix')
    .then(() => console.log('🍃 Conectado ao MongoDB via Padrão MVC!'))
    .catch(err => console.error(err));

// Acoplamento de Rotas
app.use('/api', apiRoutes);

app.listen(3000, () => console.log('🚀 Servidor MVC rodando na porta 3000'));