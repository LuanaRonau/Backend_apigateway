// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor na porta 8080
let porta = 8091;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});


// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./dados.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
    });

// Cria a tabela vagas, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS vagas 
        (id INTEGER PRIMARY KEY NOT NULL UNIQUE, centro TEXT NOT NULL, 
            vagas_totais INTEGER NOT NULL, vagas_ocupadas INTEGER NOT NULL)`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      }); 

      
// Método HTTP POST /Vagas - cadastra um novo estacionamento
app.post('/Vagas', (req, res, next) => {
    db.run(`INSERT INTO vagas(id, centro, vagas_totais, vagas_ocupadas) VALUES(?, ?, ?, 0)`, 
        [req.body.id, req.body.centro, req.body.vagas_totais, req.body.vagas_ocupadas], (err) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao cadastrar estacionamento.');
        } else {
            console.log('Estacionamento adicionado com sucesso!');
            res.status(200).send('Estacionamento adicionado com sucesso!');
        }
    });
});

// Método HTTP GET /Vagas - retorna todos os estacionamentos
app.get('/Vagas', (req, res, next) => {
    db.all(`SELECT * FROM vagas`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Vagas/:id - retorna o estacionamento com base no id
app.get('/Vagas/:id', (req, res, next) => {
    db.get( `SELECT * FROM vagas WHERE id = ?`, 
            req.params.id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Estacionamento não encontrado.");
            res.status(404).send('Estacionamento não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP PATCH /Vagas/:id - altera os dados de um estacionamento
app.patch('/Vagas/:id', (req, res, next) => {
    db.run(`UPDATE vagas SET centro = COALESCE(?,centro), 
            vagas_totais = COALESCE(?,vagas_totais), vagas_ocupadas = COALESCE(?,vagas_ocupadas) WHERE id = ?`,
           [req.body.centro, req.body.vagas_totais, req.body.vagas_ocupadas, req.params.id], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Estacionamento não encontrado.");
                res.status(404).send('Estacionamento não encontrado.');
            } else {
                res.status(200).send('Estacionamento alterado com sucesso!');
            }
    });
});

//Método HTTP DELETE /Vagas/:id - remove um estacionamento
app.delete('/Vagas/:id', (req, res, next) => {
    db.run(`DELETE FROM vagas WHERE id = ?`, req.params.id, function(err) {
      if (err){
         res.status(500).send('Erro ao remover estacionamento.');
      } else if (this.changes == 0) {
         console.log("Estacionamento não encontrado.");
         res.status(404).send('Estacionamento não encontrado.');
      } else {
         res.status(200).send('Estacionamento removido com sucesso!');
      }
   });
});
