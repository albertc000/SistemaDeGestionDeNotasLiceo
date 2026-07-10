const express = require('express');
const path = require('path');
const multer = require('multer'); 
//const upload = multer();
const jwt = require('jsonwebtoken');
const router = express.Router();
const {Libro, Biblioteca} = require("./claseBiblioteca.js");

//configuracion de almacenamiento en disco
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //ruta absoluta a la carpeta /uploads del proyecto
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        //genera un nombre de archivo único con el prefijo "portada-" la fecha y la extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage }); //middleware que usará el disco


//middleware de protección de rutas
const verificarAutenticacion = (req, res, next) => {
    //verificar si hay token
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.redirect('/'); 
    }
    try {
        //si hay token, verificr que sea válido y no haya sido alterado
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado; 
        next();
    } catch (error) {
        //si el token expiró o es inválido, borrar cookie mala y  al login
        res.clearCookie('auth_token');
        res.redirect('/');
    }
};

//rutas



//por defecto
router.get('/', (req, res) => {
    //revisar si el usuario ya tiene la cookie
    const token = req.cookies.auth_token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/inicio');
        } catch (error) {
            res.clearCookie('auth_token');
        }
    }
    res.sendFile(path.join(__dirname, '../html/login.html'));
});

//panel de control
router.get('/inicio', verificarAutenticacion, (req, res) => {
    res.render('panelControl'); 
});

//login
router.post('/login', upload.none(), (req, res) =>{
    const JWT_SECRET = process.env.JWT_SECRET;
    try {
        const { usuario, contrasena } = req.body;
        const usuarioValido = 'admin';
        const contraValida = 'admin';

        console.log('intento de login:', usuario);

        if (usuario === usuarioValido && contrasena === contraValida) {
            //crear token con datos del usuario
            const token = jwt.sign(
                { 
                    usuario: usuarioValido, 
                    loginTime: Date.now() 
                },
                JWT_SECRET,
                { 
                    expiresIn: '24h' 
                }
            );
            
            // Enviar token como cookie HTTP-only (segura)
            res.cookie('auth_token', token, {
                httpOnly: true,  
                secure: false,       
                maxAge: 24 * 60 * 60 * 1000, //24 horas
                sameSite: 'lax'
            });
            
            console.log('login exitoso para:', usuario);
            res.json({ 
                exito: true, 
                mensaje: 'login exitoso' 
            });
        } else {
            console.log('login fallido para:', usuario);
            res.status(401).json({ 
                exito: false, 
                mensaje: 'Datos incorrectos.'
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            exito: false, 
            mensaje: 'Error interno' 
        });
    }
});

//registro de libros
router.get('/registro', verificarAutenticacion, (req, res) => {
    res.render('formRegistro');
});

//proceso de registrar libro
router.post('/nuevoLibro',  upload.single('portada'), verificarAutenticacion, (req, res) =>{
    const anoActual = new Date().getFullYear();
    let BDLibros = new Biblioteca("biblioteca.json");

    const libro = req.body;
    //console.log('datos del formulario:', libro);

    let codigo = req.body.codigo;
    let titulo = req.body.titulo;
    let autor = req.body.autor;
    let ano = req.body.ano;
    let obtencion = req.body.obtencion;

    //obtener el nombre generado para la portada si existe, de lo contrario guardar vacío
    let portada = req.file ? req.file.filename : '';

    if(!codigo || isNaN(Number(codigo)) || !titulo || !autor || !ano || ano>anoActual){
        return res.json({ 
            exito: false, 
            mensaje: 'Por favor, completa todos los campos correctamente.',
            libro: libro 
        });
    }
    else{
        codigo = Number(codigo);
        if(BDLibros.existeLibro(codigo)){
            return res.json({ 
                exito: false, 
                mensaje: 'El Libro ya existe en la base de datos.',
                libro: libro 
            });
        }
        else{
            if (String(codigo).length == 13){
                BDLibros.registrarLibro(codigo, titulo, autor, ano, obtencion, portada);
                BDLibros.cerrarBD();
                return res.json({ 
                    exito: true, 
                    mensaje: 'Libro registrado con éxito',
                    libro: libro 
                });
                //res.render('exito', { exito: "Éxto al Registrar el Libro", codigo: "codigo", titulo: "titulo" });
            }
            else{
                return res.json({ 
                    exito: false, 
                    mensaje: 'Por favor, completa todos los campos correctamente.',
                    libro: libro 
                });
            } 
        }
    }
    BDLibros.cerrarBD();

});

//proceso de editar libro
router.put('/editarLibro', upload.single('portada'), verificarAutenticacion, (req, res) => {
    const anoActual = new Date().getFullYear();
    let BDLibros = new Biblioteca("biblioteca.json");

    const libro = req.body;
    //console.log('datos del formulario:', libro);

    let codigo = req.body.codigo;
    let i = BDLibros.buscarLibro(codigo);
    let titulo = req.body.titulo;
    let autor = req.body.autor;
    let ano = req.body.ano;
    let obtencion = req.body.obtencion;

    let portada = req.file ? req.file.filename : '';


    if(!codigo || isNaN(Number(codigo)) || !titulo || !autor || !ano || ano>anoActual){
        return res.json({ 
            exito: false, 
            mensaje: 'Libro NO actualizado con éxito',
            libro: libro 
        });
    }
    else{
        i.titulo = titulo;
        i.autor = autor;
        i.ano = ano;
        i.obtencion = obtencion;
        i.portada = portada;

        BDLibros.cerrarBD();
        return res.json({ 
            exito: true, 
            mensaje: 'Libro actualizado con éxito',
            libro: libro 
        });
    }
});

//proceso de busqueda libro
router.post('/busquedaLibro', verificarAutenticacion, (req, res) => {
    let BDLibros = new Biblioteca("biblioteca.json");
    
    let codigo = req.body.codigo;

    if(!codigo || isNaN(Number(codigo))){
        res.render('fallo',  { error: "Código invalido", codigo: "codigo", titulo: "titulo" });
    }
    else{
        if(!BDLibros.existeLibro(codigo)){
            res.render('fallo',  { error: "El Libro no Existe en la Base de Datos", codigo: "codigo", titulo: "titulo"  });
        }
        else{
            let i = BDLibros.buscarLibro(codigo);

            let titulo = i.titulo;
            let autor = i.autor;
            let ano = i.ano;
            let obtencion = i.obtencion;
            let portada = i.portada;
        
            res.render('formModificar', { codigo:codigo, titulo:titulo, autor:autor, ano:ano, obtencion:obtencion, portada:portada })
        }

    }
});

//listado
router.get('/listado', upload.none(), verificarAutenticacion, (req, res) => {
    res.render('listado');
});

//ruta para las portadas usando res.sendFile
router.get('/portada/:nombre', verificarAutenticacion, (req, res) => {
    const nombre = req.params.nombre;
    const rutaImagen = path.join(__dirname, '../uploads', nombre);
    
    res.sendFile(rutaImagen, (err) => {
        if (err) {
            console.error('Error al enviar la imagen:', err);
            res.status(404).send('La portada no existe');
        }
    });
});

//reporte
router.get('/reporte', upload.none(), verificarAutenticacion, (req, res) => {
    res.render('reporteGeneral');
});

//biblioteca
router.get('/api/biblioteca', upload.none(), verificarAutenticacion, (req, res) => {
    let BDLibros = new Biblioteca("biblioteca.json");
    res.json(BDLibros.listaLibros);
});

//proceso de eliminar libro
router.delete('/eliminarLibro', upload.none(), verificarAutenticacion, (req, res) => {
    let BDLibros = new Biblioteca("biblioteca.json");

    const libro = req.body;
    //console.log('datos del formulario:', libro);

    let codigo = req.body.codigo;
    //console.log(codigo);
    if(!codigo || isNaN(Number(codigo))){
        return res.json({ 
            exito: false, 
            mensaje: 'Libro NO eliminado con éxito',
            libro: libro 
        });
    }
    else{
        codigo = Number(codigo);
        BDLibros.eliminarLibro(codigo);
        BDLibros.cerrarBD();
    
        return res.json({ 
            exito: true, 
            mensaje: 'Libro eliminado con éxito',
            libro: libro 
        });
    }
    
});

//cerrar sesion
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token');  //destruye la cookie de sesión
    res.redirect('/');              //lo regresa al login
});

module.exports = router;