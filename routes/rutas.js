const express = require('express');
const path = require('path');
const multer = require('multer'); 
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Alumno, Estudiantes } = require("./claseEstudiantes.js");
const rutaBD = path.join(__dirname, '../data/BDestudiantes.json');
const connect = require('./db.js');
const bcrypt = require('bcryptjs');

const upload = multer(); //middleware para procesar formularios multipart/form-data

// middleware de proteccion de rutas
const verificarAutenticacion = (req, res, next) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.redirect('/'); 
    }
    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado; 
        next();
    } catch (error) {
        res.clearCookie('auth_token');
        res.redirect('/');
    }
};

//rutas de autenticacion y vistas principales
//login
router.get('/', (req, res) => {
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

// Panel de control
router.get('/inicio', verificarAutenticacion, (req, res) => {
    res.render('panelControl'); 
});

//Login POST
router.post('/login', upload.none(), async  (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    try {
        const { usuario, contrasena } = req.body;
        const usuariosTabla = req.db.tabla('usuarios')
        let result = await usuariosTabla.selectOne({ where: { user: usuario } })
        if (result) {
            if (await bcrypt.compare(contrasena, result.hash)) {
                    // Crear token con datos del usuario (expira en 24 horas)
                    const token = jwt.sign(
                        { usuario: usuario, loginTime: Date.now() },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    // Enviar token como cookie HTTP-only (segura)
                    res.cookie('auth_token', token, {
                        httpOnly: true,      // No accesible desde JavaScript
                        secure: false,       // true si usas HTTPS
                        maxAge: 24 * 60 * 60 * 1000, // 24 horas
                        sameSite: 'lax'
                    });

                    console.log('Login exitoso para:', usuario);
                    res.json({ exito: true, mensaje: 'Login exitoso' });
                } else {
                    console.log('Login fallido para:', usuario);
                    res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
                }
            } else {
                console.log('Login fallido para:', usuario);
                res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
            }

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ exito: false, mensaje: 'Error interno' });
        }
    });
/*            
        const usuarioValido = 'admin';
        const contraValida = 'admin';

        console.log('Intento de login:', usuario);

        if (usuario === usuarioValido && contrasena === contraValida) {
            const token = jwt.sign(
                { usuario: usuarioValido, loginTime: Date.now() },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.cookie('auth_token', token, {
                httpOnly: true,  
                secure: false,       
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            });
            
            console.log('Login exitoso para:', usuario);
            res.json({ exito: true, mensaje: 'Login exitoso' });
        } else {
            console.log('Login fallido para:', usuario);
            res.status(401).json({ exito: false, mensaje: 'Datos incorrectos.' });
        }
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ exito: false, mensaje: 'Error interno' });
        }
});*/

//formulario de registro de estudiantes
router.get('/registro', verificarAutenticacion, (req, res) => {
    res.render('formRegistro');
});

//registrar nuevo estudiante
router.post('/nuevoEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
    const tablaEstudiantes = req.db.tabla('estudiantes');

    //let BDEstudiantes = new Estudiantes(rutaBD);

    const { cedula, nombre, apellido, ano, seccion } = req.body;
    let nota1 = Number(req.body.nota1) || 0;
    let nota2 = Number(req.body.nota2) || 0;
    let nota3 = Number(req.body.nota3) || 0;
    let nota4 = Number(req.body.nota4) || 0;

    if (!cedula || !nombre || !apellido || !ano || !seccion) {
        return res.json({ 
            exito: false, 
            mensaje: 'Por favor, completa todos los campos obligatorios del estudiante.',
            estudiante: req.body 
        });
    }

    /*
    if (BDEstudiantes.existeAlumno(cedula)) {
        return res.json({ 
            exito: false, 
            mensaje: 'El estudiante con esa Cédula ya está registrado.',
            estudiante: req.body 
        });
    }    
    
    BDEstudiantes.registrarAlumno(cedula, nombre, apellido, ano, seccion, nota1, nota2, nota3, nota4);
    BDEstudiantes.cerrarBD();

    return res.json({ 
        exito: true, 
        mensaje: 'Estudiante registrado con éxito',
        estudiante: req.body 
    });
    */

    //verificar si existe la cedula en la tabla
    const existe = await tablaEstudiantes.selectOne({ where: { cedula } });
    if (existe) {
        return res.json({ exito: false, mensaje: 'Un estudiante con esa Cédula ya está registrado.' });
    }

    //insertar en la tabla
    await tablaEstudiantes.insert({
        cedula, nombre, apellido, ano, seccion,
        nota1, nota2, nota3, nota4
    });

    return res.json({ exito: true, mensaje: 'Estudiante registrado con éxito' });
    } 
    catch (error) {
        console.error('Error al registrar:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }

});

//proceso de editar estudiante
router.put('/editarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try{
    const tablaEstudiantes = req.db.tabla('estudiantes');
    //let BDEstudiantes = new Estudiantes(rutaBD);

    const { cedula, nombre, apellido, ano, seccion } = req.body;

    const alumno = await tablaEstudiantes.selectOne({ where: { cedula } });
        if (!alumno) {
            return res.json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }
        await tablaEstudiantes.update({
            nombre,
            apellido,
            ano,
            seccion,
            nota1: Number(req.body.nota1) || 0,
            nota2: Number(req.body.nota2) || 0,
            nota3: Number(req.body.nota3) || 0,
            nota4: Number(req.body.nota4) || 0
        }, { cedula });
        return res.json({ exito: true, mensaje: 'Estudiante actualizado con éxito' });
    /*
    let alumno = BDEstudiantes.buscarAlumno(cedula);

    if (!alumno || !cedula || !nombre || !apellido) {
        return res.json({ 
            exito: false, 
            mensaje: 'No se pudo actualizar el estudiante. Verifique los datos.',
            estudiante: req.body 
        });
    }

    BDEstudiantes.modificarAlumno(cedula, nombre, apellido, ano, seccion, nota1, nota2, nota3, nota4);
    BDEstudiantes.cerrarBD();

    return res.json({ 
        exito: true, 
        mensaje: 'Estudiante actualizado con éxito',
        estudiante: req.body 
    });
    */

    }
    catch (error) {
        console.error('Error al actualizar:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar estudiante' });
    }
});

//busqueda de estudiante para modificar
router.post('/busquedaEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    /*
    let BDEstudiantes = new Estudiantes(rutaBD);
    let cedula = req.body.cedula;

    let alumno = BDEstudiantes.buscarAlumno(cedula);
    if (!alumno) {
        res.redirect('/listado');
    } else {
        res.render('formModificar', { 
            cedula: alumno.cedula, 
            nombre: alumno.nombre, 
            apellido: alumno.apellido, 
            ano: alumno.ano, 
            seccion: alumno.seccion, 
            nota1: alumno.nota1,
            nota2: alumno.nota2,
            nota3: alumno.nota3,
            nota4: alumno.nota4
        });
    }
    */

    try {
        const tablaEstudiantes = req.db.tabla('estudiantes');
        const alumno = await tablaEstudiantes.selectOne({ where: { cedula: req.body.cedula } });
        if (!alumno) {
            return res.redirect('/listado');
        }
        res.render('formModificar', alumno);
    } catch (error) {
        res.redirect('/listado');
    }
});

//eliminar estudiante
router.delete('/eliminarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    /*
    let BDEstudiantes = new Estudiantes(rutaBD);
    let cedula = req.body.cedula || req.body.codigo;

    if (!cedula) {
        return res.json({ 
            exito: false, 
            mensaje: 'Cédula no proporcionada' 
        });
    }

    BDEstudiantes.eliminarAlumno(cedula);
    BDEstudiantes.cerrarBD();
    
    return res.json({ 
        exito: true, 
        mensaje: 'Estudiante eliminado con éxito' 
    });
    */

    try {
        const tablaEstudiantes = req.db.tabla('estudiantes');
        const cedula = req.body.cedula || req.body.codigo;
        if (!cedula) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada' });
        }
        await tablaEstudiantes.delete({ cedula });
        return res.json({ exito: true, mensaje: 'Estudiante eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al eliminar' });
    }
});

//listado completo
router.get('/listado', upload.none(), verificarAutenticacion, (req, res) => {
    res.render('listado');
});

//reporte general
router.get('/reporte', upload.none(), verificarAutenticacion, (req, res) => {
    res.render('reporteGeneral');
});

//API de estudiantes
router.get('/api/estudiantes', upload.none(), verificarAutenticacion, async (req, res) => {
    /*
    let BDEstudiantes = new Estudiantes(rutaBD);
    const estudiantesConCalculos = BDEstudiantes.listaEstudiantes.map(alumno => ({
        ...alumno,
        promedio: alumno.calcularPromedio ? alumno.calcularPromedio() : parseFloat(( (Number(alumno.nota1) + Number(alumno.nota2) + Number(alumno.nota3) + Number(alumno.nota4)) / 4 ).toFixed(2)),
        estado: alumno.obtenerEstado ? alumno.obtenerEstado() : ( ( (Number(alumno.nota1) + Number(alumno.nota2) + Number(alumno.nota3) + Number(alumno.nota4)) / 4 ) >= 10 ? "Aprobado" : "Reprobado" )
    }));
    res.json(estudiantesConCalculos);
    */

    try {
        const tablaEstudiantes = req.db.tabla('estudiantes');
        const lista = await tablaEstudiantes.select();
        
        //calcular promedio
        const estudiantesConCalculos = lista.map(alumno => {
            const n1 = Number(alumno.nota1) || 0;
            const n2 = Number(alumno.nota2) || 0;
            const n3 = Number(alumno.nota3) || 0;
            const n4 = Number(alumno.nota4) || 0;
            const promedio = parseFloat(((n1 + n2 + n3 + n4) / 4).toFixed(2));
            const estado = promedio >= 10 ? "Aprobado" : "Reprobado";
            return {
                ...alumno,
                promedio,
                estado
            };
        });
        res.json(estudiantesConCalculos);
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        res.status(500).json({ error: 'Error al obtener la lista de estudiantes' });
    }
});

//crrar sesion
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/');
});

module.exports = router;