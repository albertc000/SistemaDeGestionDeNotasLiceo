require('dotenv').config();
const { error } = require('console');
const express = require('express');
const fs = require("fs");
const { type } = require('os');
const methodOverride = require('method-override');
const { title } = require('process');
const { TIMEOUT } = require('dns');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const connect = require('./routes/db.js');


//iniciar server
const app = express();
const router = require('./routes/rutas.js');
const { route } = require('./routes/rutas.js');
const JWT_SECRET = process.env.JWT_SECRET;

//middleware
app.use(express.static('html'));
app.use('/scripts', express.static('scripts'));
app.use(cookieParser());
app.use((req, res, next) => {
    req.db = connect
    next()
})

const upload = multer(); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

//instancia
app.use("/", router);

//server
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor de Gestión de Estudiantes y Notas corriendo en http://localhost:${PUERTO}`);
});
