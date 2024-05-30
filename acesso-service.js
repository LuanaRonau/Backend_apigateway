// Inicia o Express.js
const express = require('express');
const app = express();

// Importa o axios
const axios = require('axios');

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor na porta 8081
let porta = 8081;
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
    
// Cria a tabela acesso, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS acesso 
        (id_acesso INTEGER PRIMARY KEY NOT NULL UNIQUE, cpf INTEGER NOT NULL, 
            entradaousaida TEXT NOT NULL, id_estacionamento INTEGER NOT NULL)`, 
        [], (err) => {
            if (err) {
                console.log('ERRO: não foi possível criar tabela.');
                throw err;
            }
        }); 


// Método HTTP POST /Acesso - registro de um acesso caso ele for válido (usuário possuir créditos e estacionamento possuir vagas)
app.post('/Acesso', (req, res, next) => {
    const { cpf, entradaousaida, id_estacionamento } = req.body;

    function main() {

        // Verifica se essa pessoa possui créditos e se existe alguma vaga
        if (qtdd_creditos > 0 && qtdd_vagas_livres > 0){
        
            // (Instrução da atividade no moodle) na saída, deve subtrair os créditos da conta do usuário
            if (entradaousaida == 'Saída'){
                // Retira 1 crédito da pessoa
                axios.patch(`http://localhost:8080/Creditos/${cpf}`, {
                    qtdd_creditos: qtdd_creditos-1
                });   
                
                // Vaga liberada: -1 vaga ocupada no estacionamento 
                axios.patch(`http://localhost:8091/Vagas/${id_estacionamento}`, {
                    vagas_ocupadas: vagas_ocupadas-1
                });   
                
            // Entrada no estacionamento
            } else { 
                // +1 vaga do estacionamento foi ocupada
                axios.patch(`http://localhost:8091/Vagas/${id_estacionamento}`, {
                    vagas_ocupadas: vagas_ocupadas+1
                });  
            }
            // Abre a cancela (adicionar código aqui após a cancela ser feita)
            
            // Registra o acesso na tabela
            db.run(`INSERT INTO acesso(id_acesso, cpf, entradaousaida, id_estacionamento) VALUES(?, ?, ?, ?)`, 
            [req.body.id_acesso, req.body.cpf, req.body.entradaousaida, req.body.id_estacionamento], (err) => {
                if (err) {
                    console.log("Erro: " + err);
                    res.status(500).send('Erro ao registrar acesso.');
                } else {
                    console.log('Acesso registrado com sucesso!');
                    res.status(200).send('Acesso registrado com sucesso!');
                }
            });
            
        } else if (qtdd_creditos <= 0) {
            console.log('Usuário não possui créditos suficientes')
            res.status(500).send('Usuário não possui créditos suficientes');

        } else {
            console.log('Estacionamento cheio')
            res.status(500).send('Estacionamento cheio');
        }
    }
    
    async function busca_qtdd_creditos(cpf) {
        try {
          var response = await axios.get(`http://localhost:8080/Creditos/${cpf}`);
          var qtdd_creditos = response.data.qtdd_creditos;
          console.log(qtdd_creditos);
          return qtdd_creditos;
        } catch (error) {
            console.error('Erro ao fazer a requisição axios get(cpf): creditos', error);
        }
    }
    
    async function busca_dados_estacionamento(id_estacionamento) {
        try {
            var response = await axios.get(`http://localhost:8091/Vagas/${id_estacionamento}`);
            return response.data
        } catch (error) {
            console.error('Erro ao fazer a requisição axios get(id_estacionamento): qtdd_vagas_livres', error);
        }
    }
    
    var qtdd_creditos = busca_qtdd_creditos(cpf)
    var vagas_data = busca_dados_estacionamento(id_estacionamento)
    
    async function checkPendingStatus() {
        try {
            // Espera essas promisses saírem do estado de pending para prosseguir com o código
            await qtdd_creditos
            await vagas_data; 
            
            console.log('Promise is not pending');
            
            await qtdd_creditos.then((value) => {qtdd_creditos = value})
            await vagas_data.then((value) => {vagas_ocupadas = value.vagas_ocupadas; 
                                              qtdd_vagas_livres = value.vagas_totais - value.vagas_ocupadas})
            
            // Agora que todas as váriaveis já receberam o valor que estavam buscando, é possível usá-las em verificações
            main()

        } catch (error) {
            console.error('Promise encountered an error:', error);
        }
    }
    
    checkPendingStatus();
    
});

// Método HTTP GET /Acesso - retorna todos os acessos
app.get('/Acesso', (req, res, next) => {
    db.all(`SELECT * FROM acesso`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Acesso/:id_acesso - retorna o acesso com base no id
app.get('/Acesso/:id_acesso', (req, res, next) => {
    db.get( `SELECT * FROM acesso WHERE id_acesso = ?`, 
            req.params.id_acesso, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Registro de acesso não encontrado.");
            res.status(404).send('Registro de acesso não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});
