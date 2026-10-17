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

inicializarUsuarioAdmin(connect);

connect.pathModels(path.join(__dirname, '../model'));
module.exports = connect;