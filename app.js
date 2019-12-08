const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const port = process.env.PORT || 8000
const mysql = require('mysql')
const cors = require('cors')
const path = require('path')
require('dotenv/config')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const db = {
    host: process.env.HOST1,
    port: process.env.PORT1,
    user: process.env.USER1,
    password: process.env.PASS1,
    database: process.env.DB1
}

const router = express.Router()

app.use(router)

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'))
})

router.get('/axios', (req, res) => {
    res.sendFile(path.join(__dirname + '/axios.min.js'))
})

router.post('/register', (req, res) => {
    const { name, email, cpf, phone, birthday, pass } = req.body

    if (!ValidCPF(cpf))
        res.send({ error: 'CPF Inválido' })

    const d = new Date()
    const number = parseFloat(d.getDay() + d.getMonth() + d.getFullYear() + d.getSeconds())
    const user_name = 'user' + number

    let conn = mysql.createConnection(db)
    const query = 'INSERT INTO users (name, email, user_name, cpf, phone, birthday, pass) VALUES (?, ?, ?, ?, ?, ?, ?)'
    conn.query(query, [name, email, user_name, cpf, phone, birthday, pass], (error, results, fields) => {
        if (error) {
            res.send({ error: error.sqlMessage })
        } else {
            res.send({ msg: 'Usuário cadastrado com sucesso' })
        }
        conn.end()
    })
})

router.get('/users/:id?', (req, res) => {
    let conn = mysql.createConnection(db)
    let filter = ''
    if (req.params.id) filter = ' WHERE id = ' + parseInt(req.params.id)
    let query = 'SELECT * FROM users' + filter

    conn.query(query, (error, results, fields) => {
        if (error) res.send(error)
        else res.send(results)
        conn.end()
    })
})

router.post('/login', (req, res) => {
    const { email, pass } = req.body
    if (email && pass) {
        let conn = mysql.createConnection(db)
        let query = `SELECT * FROM users WHERE email = ? AND pass = ?`
        conn.query(query, [email, pass], (error, results, fields) => {
            if (error) res.send(error)
            else if (results.length > 0) {
                res.send({
                    id: results[0].id,
                    name: results[0].name,
                    user_name: results[0].user_name,
                    cpf: results[0].cpf,
                    msg: 'logado'
                })
            } else {
                res.send({ msg: 'Email ou senha inválidos' })
            }
            conn.end()
        })
    } else {
        res.send({ msg: 'Email ou senha não informados', req: req.body })
    }
})

router.post('/register_company', (req, res) => {
    const { fantasy, cnpj, district, street, number, phone, email } = req.body

    if (!ValidCNPJ(cnpj)) {
        res.send({ error: 'CNPJ Inválido' })
    } else {
        let conn = mysql.createConnection(db)
        const query = 'INSERT INTO companies (fantasy, cnpj, district, street, number, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)'
        conn.query(query, [fantasy, cnpj, district, street, number, phone, email], (error, results, fields) => {
            if (error) {
                res.send({ error: error.sqlMessage })
            } else {
                res.send(results)
            }
            conn.end()
        })
    }

})

router.post('/send_post', (req, res) => {
    const { description, local, status, user_id, user_name } = req.body
    if (description == '' || local == '' || status == '' || user_id == '' || user_name == '') {
        res.send({ msg: 'Preencha todos os campos corretamente ou faça login novamente' })
    } else {
        let conn = mysql.createConnection(db)
        const query = 'INSERT INTO posts (description, local, status, user_id, user_name) VALUES (?, ?, ?, ?, ?)'
        conn.query(query, [description, local, status, user_id, user_name], (error, results, fields) => {
            if (error) {
                res.send({ error: error.sqlMessage })
            } else {
                res.send({ msg: 'Denuncia efetuada com sucesso' })
            }
            conn.end()
        })
    }
})

router.get('/posts/:id?', (req, res) => {
    let conn = mysql.createConnection(db)
    let filter = ''
    if (req.params.id) filter = ' WHERE id = ' + parseInt(req.params.id)
    let query = 'SELECT * FROM posts' + filter

    conn.query(query, (error, results, fields) => {
        if (error) {
            res.send(error)
        } else {
            results.forEach(element => {
                element.id = null
                element.user_id = null
            })
            res.send(results)
        }
        conn.end()
    })
})

function ValidCPF(strCPF) {
    let Soma;
    let Resto;
    Soma = 0;
    if (strCPF == "00000000000") return false;
    for (i = 1; i <= 9; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
    Resto = (Soma * 10) % 11;
    if ((Resto == 10) || (Resto == 11)) Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10))) return false;
    Soma = 0;
    for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;
    if ((Resto == 10) || (Resto == 11)) Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11))) return false;
    return true;
}

function ValidCNPJ(cnpj) {

    cnpj = cnpj.replace(/[^\d]+/g, '');

    if (cnpj == '') return false;

    if (cnpj.length != 14)
        return false;


    if (cnpj == "00000000000000" ||
        cnpj == "11111111111111" ||
        cnpj == "22222222222222" ||
        cnpj == "33333333333333" ||
        cnpj == "44444444444444" ||
        cnpj == "55555555555555" ||
        cnpj == "66666666666666" ||
        cnpj == "77777777777777" ||
        cnpj == "88888888888888" ||
        cnpj == "99999999999999")
        return false;


    tamanho = cnpj.length - 2
    numeros = cnpj.substring(0, tamanho);
    digitos = cnpj.substring(tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1))
        return false;

    return true;

}

app.listen(port, () => {
    console.log(`Executando na porta ${port}`)
})