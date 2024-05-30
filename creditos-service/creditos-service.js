// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor na porta 8080
let porta = 8082;
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

// Cria a tabela creditos, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS creditos 
        (cpf INTEGER PRIMARY KEY NOT NULL UNIQUE, qtdd_creditos INTEGER NOT NULL)`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      }); 

      
// Método HTTP POST /Creditos - cadastra um novo usuario no registro de créditos
app.post('/Creditos', (req, res, next) => {
    db.run(`INSERT INTO creditos(cpf, qtdd_creditos) VALUES(?, 0)`, 
        [req.body.cpf], (err) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao cadastrar usuário.');
        } else {
            console.log('Usuário adicionado aos registros com sucesso!');
            res.status(200).send('Usuário adicionado aos registros com sucesso!');
        }
    });
});

// Método HTTP GET /Creditos - retorna todos os creditos
app.get('/Creditos', (req, res, next) => {
    db.all(`SELECT * FROM creditos`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Creditos/:cpf - retorna creditos do usuário com base no CPF
app.get('/Creditos/:cpf', (req, res, next) => {
    db.get( `SELECT * FROM creditos WHERE cpf = ?`, 
            req.params.cpf, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Usuário não encontrado.");
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP PATCH /Creditos/:cpf - altera os creditos de um usuário
app.patch('/Creditos/:cpf', (req, res, next) => {
    db.run(`UPDATE creditos SET qtdd_creditos = COALESCE(?,qtdd_creditos) WHERE cpf = ?`,
           [req.body.qtdd_creditos, req.params.cpf], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Usuário não encontrado.");
                res.status(404).send('Usuário não encontrado.');
            } else {
                res.status(200).send('Créditos alterados com sucesso!');
            }
    });
});

//Método HTTP DELETE /Creditos/:cpf - remove um usuario dos registros de creditos
app.delete('/Creditos/:cpf', (req, res, next) => {
    db.run(`DELETE FROM creditos WHERE cpf = ?`, req.params.cpf, function(err) {
      if (err){
         res.status(500).send('Erro ao remover o usuário do registro de créditos.');
      } else if (this.changes == 0) {
         console.log("Usuário não encontrado.");
         res.status(404).send('Usuário não encontrado.');
      } else {
         res.status(200).send('Usuário removido dos registros de créditos com sucesso!');
      }
   });
});
