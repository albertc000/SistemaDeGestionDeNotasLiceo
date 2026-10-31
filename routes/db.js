//base de datos
const mysql = require('mysql-tab');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'liceo_andres_bello'
}; 

console.log(">> Conectando a MySQL");
const connect = new mysql(dbConfig);

const { inicializarUsuarioAdmin } = require('../model/usuarios.js');
const { insertarEstudiantesModelo } = require('../model/estudiantes.js');
const { insertarProfeModelo } = require('../model/profesores.js');
const { inicializarGrados } = require('../model/grados.js');
const { inicializarMaterias } = require('../model/materias.js');
const { inicializarPeriodo } = require('../model/periodosAcademicos.js');
const { inicializarSecciones } = require('../model/secciones.js');

async function inicializarTodo() {
    await inicializarUsuarioAdmin(connect);
    await inicializarGrados(connect);   
    await inicializarPeriodo(connect);   
    await inicializarSecciones(connect);
    await inicializarMaterias(connect); 
    await insertarProfeModelo(connect);
    await insertarEstudiantesModelo(connect);
}

inicializarTodo();

connect.pathModels(path.join(__dirname, '../model'));
module.exports = connect;