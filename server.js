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


//iniciar server
const app = express();
const router = require('./routes/rutas.js');
const { route } = require('./routes/rutas.js');
const JWT_SECRET = process.env.JWT_SECRET;

//middleware
app.use(express.static('html'));
app.use('/js', express.static('js'));
app.use(cookieParser());

const upload = multer(); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

//instancia
app.use("/", router);

//server
const PUERTO = 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor de la Biblioteca corriendo en http://localhost:${PUERTO}`);
});
