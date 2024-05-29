const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



let porta = 8081;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});

const sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log('ERRO: não foi possível conectar ao SQLite.');
        throw err;
    }
    console.log('Conectado ao SQLite!');
});

db.run(`CREATE TABLE IF NOT EXISTS cadastro 
        (nome TEXT NOT NULL, categoria TEXT NOT NULL, 
         cpf INTEGER PRIMARY KEY NOT NULL UNIQUE)`, 
        [], (err) => {
    if (err) {
        console.log('ERRO: não foi possível criar tabela.');
        throw err;
    }
});

app.post('/Cadastro', (req, res, next) => {
    console.log('Recebendo dados para cadastro:', req.body); // Log dos dados recebidos
    db.run(`INSERT INTO cadastro(nome, categoria, cpf) VALUES(?,?,?)`, 
         [req.body.nome, req.body.categoria, req.body.cpf], (err) => {
        if (err) {
            console.log("Erro ao cadastrar cliente: " + err.message);
            res.status(500).send('Erro ao cadastrar cliente.');
        } else {
            console.log('Cliente cadastrado com sucesso!');
            res.status(200).send('Cliente cadastrado com sucesso!');
        }
    });
});

app.get('/Cadastro', (req, res, next) => {
    db.all(`SELECT * FROM cadastro`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err.message);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.get('/Cadastro/:cpf', (req, res, next) => {
    db.get( `SELECT * FROM cadastro WHERE cpf = ?`, 
            req.params.cpf, (err, result) => {
        if (err) { 
            console.log("Erro: "+err.message);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Cliente não encontrado.");
            res.status(404).send('Cliente não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.patch('/Cadastro/:cpf', (req, res, next) => {
    db.run(`UPDATE cadastro SET nome = COALESCE(?,nome), categoria = COALESCE(?,categoria) WHERE cpf = ?`,
           [req.body.nome, req.body.categoria, req.params.cpf], function(err) {
            if (err){
                console.log("Erro ao alterar dados: " + err.message);
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Cliente não encontrado.");
                res.status(404).send('Cliente não encontrado.');
            } else {
                res.status(200).send('Cliente alterado com sucesso!');
            }
    });
});

app.delete('/Cadastro/:cpf', (req, res, next) => {
    db.run(`DELETE FROM cadastro WHERE cpf = ?`, req.params.cpf, function(err) {
      if (err){
         console.log("Erro ao remover cliente: " + err.message);
         res.status(500).send('Erro ao remover cliente.');
      } else if (this.changes == 0) {
         console.log("Cliente não encontrado.");
         res.status(404).send('Cliente não encontrado.');
      } else {
         res.status(200).send('Cliente removido com sucesso!');
      }
   });
});
