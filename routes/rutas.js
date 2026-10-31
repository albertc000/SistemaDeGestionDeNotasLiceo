const express = require('express');
const path = require('path');
const multer = require('multer'); 
const jwt = require('jsonwebtoken');
const router = express.Router();
const rutaBD = path.join(__dirname, '../data/BDestudiantes.json');
const connect = require('./db.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const upload = multer(); //middleware para procesar formularios multipart/form-data

// Leer bd.sql y ejecutarlo en MySQL al conectar
async function sincronizarBD(db) {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../bd.sql'), 'utf-8');
        await db.query(sql);
        console.log(">> [MySQL] Estructura de tablas sincronizada desde bd.sql.");
    } catch (error) {
        console.error("Error al sincronizar bd.sql:", error);
    }
}

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

//formulario de registro de estudiantes
router.get('/registro', verificarAutenticacion, (req, res) => {
    res.render('formRegistro');
});

//registrar nuevo estudiante
router.post('/nuevoEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaEstudiantes = req.db.tabla('estudiantes');

        const { 
            cedula, 
            nombre,
            seg_nombre,
            segnombre,
            apellido, 
            seg_apellido,
            segapellido,
            genero,
            telf,
            telefono,
            direccion,
            ano, 
            seccion 
        } = req.body;

        const primerNombre = (nombre || '').trim();
        const segundoNombre = (seg_nombre || segnombre || '').trim();
        const primerApellido = (apellido || '').trim();
        const segundoApellido = (seg_apellido || segapellido || '').trim();
        const cedulaEst = (cedula || '').trim();

        if (!cedulaEst || !primerNombre || !primerApellido || !ano || !seccion) {
            return res.json({ 
                exito: false, 
                mensaje: 'Por favor, completa todos los campos obligatorios del estudiante.',
                estudiante: req.body 
            });
        }
        //verificar si existe la cedula en la tabla
        const existe = await tablaEstudiantes.selectOne({ where: { cedula: cedulaEst } });
        if (existe) {
            return res.json({ exito: false, mensaje: 'Un estudiante con esa Cédula ya está registrado.' });
        }

        //insertar en la tabla
        await tablaEstudiantes.insert({
            cedula: cedulaEst, 
            nombre: primerNombre, 
            seg_nombre: segundoNombre,
            apellido: primerApellido,
            seg_apellido: segundoApellido,
            genero: genero || 'M',
            direccion: direccion || '',
            telefono: telf || telefono || ''
        });

        const seccionBD = await req.db.query(
            "SELECT s.id, s.id_grado FROM secciones s JOIN grados g ON s.id_grado = g.id WHERE g.nombre = ? AND s.letra = ? LIMIT 1",
            { values: [ano, seccion] }
        );
        const periodoActivo = await req.db.query("SELECT id FROM periodos_academicos WHERE activo = 1 LIMIT 1");

        if (seccionBD.length > 0 && periodoActivo.length > 0) {
            const resIns = await req.db.query(
                "INSERT INTO inscripciones (cedula_estudiante, id_seccion, id_periodo) VALUES (?, ?, ?)",
                { values: [cedulaEst, seccionBD[0].id, periodoActivo[0].id] }
            );
            const idInscripcion = resIns.insertId;

            // Inicializar las 4 calificaciones de cada materia del grado en 0
            const materias = await req.db.query(
                "SELECT id FROM materias WHERE id_grado = ?",
                { values: [seccionBD[0].id_grado] }
            );
            for (const mat of materias) {
                for (let lapso = 1; lapso <= 4; lapso++) {
                    await req.db.query(
                        "INSERT INTO calificaciones (id_inscripcion, id_materia, lapso, nota) VALUES (?, ?, ?, 0)",
                        { values: [idInscripcion, mat.id, lapso] }
                    );
                }
            }
        }

        return res.json({ exito: true, mensaje: 'Estudiante registrado con éxito' });
    } 
    catch (error) {
        console.error('Error al registrar:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

//proceso de editar estudiante y sus 4 notas por materia
router.put('/editarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaEstudiantes = req.db.tabla('estudiantes');
        const { 
            cedula, 
            nombre,
            seg_nombre,
            segnombre,
            apellido, 
            seg_apellido,
            segapellido,
            genero,
            telf,
            telefono,
            direccion,
            ano, 
            seccion 
        } = req.body;

        const alumno = await tablaEstudiantes.selectOne({ where: { cedula } });
        if (!alumno) {
            return res.json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }

        //actualizar datos personales en tabla estudiantes
        await tablaEstudiantes.update({
            nombre: (nombre || alumno.nombre).trim(),
            seg_nombre: (seg_nombre || segnombre || alumno.seg_nombre || '').trim(),
            apellido: (apellido || alumno.apellido).trim(),
            seg_apellido: (seg_apellido || segapellido || alumno.seg_apellido || '').trim(),
            genero: genero || alumno.genero || 'M',
            telefono: (telefono || telf || alumno.telefono || '').trim(),
            direccion: (direccion || alumno.direccion || '').trim()
        }, { cedula });

        //gestionar inscripción
        let idInscripcion = null;
        const inscripcionExistente = await req.db.query(
            "SELECT id FROM inscripciones WHERE cedula_estudiante = ? LIMIT 1",
            { values: [cedula] }
        );

        const seccionBD = await req.db.query(
            "SELECT s.id, s.id_grado FROM secciones s JOIN grados g ON s.id_grado = g.id WHERE g.nombre = ? AND s.letra = ? LIMIT 1",
            { values: [ano, seccion] }
        );

        if (seccionBD.length > 0) {
            const idSeccion = seccionBD[0].id;

            if (inscripcionExistente.length > 0) {
                idInscripcion = inscripcionExistente[0].id;
                await req.db.query(
                    "UPDATE inscripciones SET id_seccion = ? WHERE id = ?",
                    { values: [idSeccion, idInscripcion] }
                );
            } else {
                const periodoActivo = await req.db.query("SELECT id FROM periodos_academicos WHERE activo = 1 LIMIT 1");
                const resIns = await req.db.query(
                    "INSERT INTO inscripciones (cedula_estudiante, id_seccion, id_periodo) VALUES (?, ?, ?)",
                    { values: [cedula, idSeccion, periodoActivo[0].id] }
                );
                idInscripcion = resIns.insertId;
            }

            //guardar las 4 notas por materia enviadas desde el formulario
            if (idInscripcion) {
                for (const key of Object.keys(req.body)) {
                    const match = key.match(/^nota_(\d+)_([1-4])$/);
                    if (match) {
                        const idMateria = parseInt(match[1]);
                        const lapso = parseInt(match[2]);
                        const val = parseFloat(req.body[key]);
                        const notaFinal = isNaN(val) ? 0 : Math.min(20, Math.max(0, val));

                        //verificar si existe la nota de este lapso
                        const existeNota = await req.db.query(
                            "SELECT id FROM calificaciones WHERE id_inscripcion = ? AND id_materia = ? AND lapso = ? LIMIT 1",
                            { values: [idInscripcion, idMateria, lapso] }
                        );

                        if (existeNota.length > 0) {
                            await req.db.query(
                                "UPDATE calificaciones SET nota = ? WHERE id = ?",
                                { values: [notaFinal, existeNota[0].id] }
                            );
                        } else {
                            await req.db.query(
                                "INSERT INTO calificaciones (id_inscripcion, id_materia, lapso, nota) VALUES (?, ?, ?, ?)",
                                { values: [idInscripcion, idMateria, lapso, notaFinal] }
                            );
                        }
                    }
                }
            }
        }

        return res.json({ exito: true, mensaje: 'Estudiante y calificaciones actualizados con éxito' });
    }
    catch (error) {
        console.error('Error al actualizar estudiante y notas:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar estudiante' });
    }
});

//busqueda de estudiante para modificar
router.post('/busquedaEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const cedula = req.body.cedula;
        if (!cedula) return res.redirect('/listado');

        //obtener datos del estudiante y su inscripción actual
        const sqlEstudiante = `
            SELECT 
                e.cedula, e.nombre, e.seg_nombre, e.apellido, e.seg_apellido,
                e.genero, e.direccion, e.telefono,
                i.id AS id_inscripcion,
                COALESCE(g.nombre, '1er Año') AS ano,
                COALESCE(s.letra, 'A') AS seccion,
                COALESCE(g.id, 1) AS id_grado
            FROM estudiantes e
            LEFT JOIN inscripciones i ON e.cedula = i.cedula_estudiante
            LEFT JOIN secciones s ON i.id_seccion = s.id
            LEFT JOIN grados g ON s.id_grado = g.id
            WHERE e.cedula = ?
            LIMIT 1
        `;
        const resultados = await req.db.query(sqlEstudiante, { values: [cedula] });
        if (!resultados || resultados.length === 0) {
            return res.redirect('/listado');
        }
        const alumno = resultados[0];

        //obtener materias del grado del estudiante
        const materias = await req.db.query(
            "SELECT id, nombre FROM materias WHERE id_grado = ? ORDER BY id ASC",
            { values: [alumno.id_grado] }
        );

        //obtener calificaciones existentes (lapso 1, 2, 3, 4)
        let calificaciones = [];
        if (alumno.id_inscripcion) {
            calificaciones = await req.db.query(
                "SELECT id_materia, lapso, nota FROM calificaciones WHERE id_inscripcion = ?",
                { values: [alumno.id_inscripcion] }
            );
        }

        //mapear materias con sus 4 notas
        const materiasConNotas = materias.map(mat => {
            const notasMat = calificaciones.filter(c => c.id_materia === mat.id);
            const n1 = notasMat.find(c => c.lapso === 1);
            const n2 = notasMat.find(c => c.lapso === 2);
            const n3 = notasMat.find(c => c.lapso === 3);
            const n4 = notasMat.find(c => c.lapso === 4);

            const nota1 = n1 ? Number(n1.nota) : 0;
            const nota2 = n2 ? Number(n2.nota) : 0;
            const nota3 = n3 ? Number(n3.nota) : 0;
            const nota4 = n4 ? Number(n4.nota) : 0;
            const promedioMat = parseFloat(((nota1 + nota2 + nota3 + nota4) / 4).toFixed(2));

            return {
                id: mat.id,
                nombre: mat.nombre,
                nota1,
                nota2,
                nota3,
                nota4,
                promedio: promedioMat
            };
        });

        res.render('formModificar', {
            ...alumno,
            materiasConNotas
        });
    } catch (error) {
        console.error("Error al buscar estudiante para modificar:", error);
        res.redirect('/listado');
    }
});

//eliminar estudiante
router.delete('/eliminarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
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
    try {
        const query = `
            SELECT 
                e.cedula, 
                e.nombre, 
                COALESCE(e.seg_nombre, '') AS seg_nombre, 
                e.apellido, 
                COALESCE(e.seg_apellido, '') AS seg_apellido,
                COALESCE(g.nombre, '-') AS ano,
                COALESCE(s.letra, '-') AS seccion,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 1 THEN c.nota END), 1), 0) AS nota1,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 2 THEN c.nota END), 1), 0) AS nota2,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 3 THEN c.nota END), 1), 0) AS nota3,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 4 THEN c.nota END), 1), 0) AS nota4,
                COALESCE(ROUND(AVG(c.nota), 2), 0) AS promedio,
                CASE 
                    WHEN AVG(c.nota) >= 10 THEN 'Aprobado' 
                    ELSE 'Reprobado' 
                END AS estado
            FROM estudiantes e
            LEFT JOIN inscripciones i ON e.cedula = i.cedula_estudiante
            LEFT JOIN secciones s ON i.id_seccion = s.id
            LEFT JOIN grados g ON s.id_grado = g.id
            LEFT JOIN periodos_academicos p ON i.id_periodo = p.id AND p.activo = 1
            LEFT JOIN calificaciones c ON i.id = c.id_inscripcion
            GROUP BY 
                e.cedula, 
                e.nombre, 
                e.seg_nombre, 
                e.apellido, 
                e.seg_apellido, 
                g.nombre, 
                s.letra, 
                i.id
        `;
        const lista = await req.db.query(query);
        res.json(lista);
    } catch (error) {
        console.error(">>> ERROR EN /api/estudiantes:", error);
        res.status(500).json({ error: 'Error al obtener estudiantes' });
    }
});

//Obtener el boletín de notas de un estudiante por su cédula
router.get('/api/calificaciones/:cedula', verificarAutenticacion, async (req, res) => {
    try {
        const { cedula } = req.params;
        const tablaEstudiantes = req.db.tabla('estudiantes');
        const estudiante = await tablaEstudiantes.selectOne({ where: { cedula } });
        if (!estudiante) {
            return res.status(404).json({ exito: false, mensaje: 'Estudiante no encontrado' });
        }
        //buscar las materias que le tocan según su grado y las notas que tenga registradas
        const sql = `
            SELECT 
                m.id AS materia_id,
                m.nombre AS materia,
                c.lapso,
                c.nota
            FROM inscripciones i
            JOIN secciones s ON i.id_seccion = s.id
            JOIN grados g ON s.id_grado = g.id
            JOIN materias m ON m.id_grado = g.id
            JOIN periodos_academicos p ON i.id_periodo = p.id AND p.activo = 1
            LEFT JOIN calificaciones c ON c.id_inscripcion = i.id AND c.id_materia = m.id
            WHERE i.cedula_estudiante = ?
            ORDER BY m.nombre ASC, c.lapso ASC
        `;
        const filas = await req.db.query(sql, { values: [cedula] });
        
        //agrupamos las notas por materia para el frontend
        const boletin = {};
        filas.forEach(fila => {
            const idMat = fila.materia_id;
        
            if (!boletin[idMat]) {
                boletin[idMat] = {
                    materiaId: idMat,
                    materia: fila.materia,
                    lapso1: null,
                    lapso2: null,
                    lapso3: null,
                    lapso4: null,
                    promedio: 0
                };
            }
 
            if (fila.lapso === 1) boletin[idMat].lapso1 = Number(fila.nota);
            if (fila.lapso === 2) boletin[idMat].lapso2 = Number(fila.nota);
            if (fila.lapso === 3) boletin[idMat].lapso3 = Number(fila.nota);
            if (fila.lapso === 4) boletin[idMat].lapso4 = Number(fila.nota);
        });

        //calcular el promedio de cada materia con las notas que tenga cargadas
        const listaMaterias = Object.values(boletin).map(item => {
            const notas = [item.lapso1, item.lapso2, item.lapso3, item.lapso4].filter(n => n !== null);
            const suma = notas.reduce((acc, curr) => acc + curr, 0);
            item.promedio = notas.length > 0 ? parseFloat((suma / notas.length).toFixed(2)) : 0;
            return item;
        });
        res.json({
            exito: true,
            estudiante: {
                cedula: estudiante.cedula,
                nombre: `${estudiante.nombre} ${estudiante.apellido}`
            },
            materias: listaMaterias
        });
    } catch (error) {
        console.error('Error al obtener calificaciones:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al consultar calificaciones' });
    }
});

// ==========================================
// Rutas de Profesores
// ==========================================

// Vista de listado de profesores
router.get('/listadoProfesores', upload.none(), verificarAutenticacion, (req, res) => {
    res.render('listadoProfesores');
});

// API para obtener todos los profesores en JSON
router.get('/api/profesores', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const lista = await tablaProfesores.select();
        res.json(lista);
    } catch (error) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({ error: 'Error al obtener la lista de profesores' });
    }
});

// Vista de formulario de registro de profesor
router.get('/registroProfesor', verificarAutenticacion, (req, res) => {
    res.render('formRegistroProfesor');
});

// Registrar nuevo profesor
router.post('/nuevoProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const {
            cedula,
            nombre,
            seg_nombre,
            apellido,
            seg_apellido,
            genero,
            telefono,
            direccion
        } = req.body;

        if (!cedula || !nombre || !apellido || !telefono) {
            return res.json({
                exito: false,
                mensaje: 'Por favor, completa los campos obligatorios (Cédula, Primer Nombre, Primer Apellido y Teléfono).'
            });
        }

        const existe = await tablaProfesores.selectOne({ where: { cedula } });
        if (existe) {
            return res.json({ exito: false, mensaje: 'Un profesor con esa Cédula ya está registrado.' });
        }

        await tablaProfesores.insert({
            cedula,
            nombre,
            seg_nombre: seg_nombre || '',
            apellido,
            seg_apellido: seg_apellido || '',
            genero: genero || 'M',
            telefono,
            direccion: direccion || ''
        });

        return res.json({ exito: true, mensaje: 'Profesor registrado con éxito' });
    } catch (error) {
        console.error('Error al registrar profesor:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al registrar el profesor' });
    }
});

// Búsqueda de profesor para modificar
router.post('/busquedaProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const profesor = await tablaProfesores.selectOne({ where: { cedula: req.body.cedula } });
        if (!profesor) {
            return res.redirect('/listadoProfesores');
        }
        res.render('formModificarProfesor', profesor);
    } catch (error) {
        console.error('Error al buscar profesor:', error);
        res.redirect('/listadoProfesores');
    }
});

// Proceso de editar profesor
router.put('/editarProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const {
            cedula,
            nombre,
            seg_nombre,
            apellido,
            seg_apellido,
            genero,
            telefono,
            direccion
        } = req.body;

        const profesor = await tablaProfesores.selectOne({ where: { cedula } });
        if (!profesor) {
            return res.json({ exito: false, mensaje: 'Profesor no encontrado.' });
        }

        await tablaProfesores.update({
            nombre,
            seg_nombre: seg_nombre || '',
            apellido,
            seg_apellido: seg_apellido || '',
            genero: genero || 'M',
            telefono: telefono || '',
            direccion: direccion || ''
        }, { cedula });

        return res.json({ exito: true, mensaje: 'Profesor actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar profesor:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar el profesor' });
    }
});

// Eliminar profesor
router.delete('/eliminarProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const cedula = req.body.cedula;
        if (!cedula) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada' });
        }
        await tablaProfesores.delete({ cedula });
        return res.json({ exito: true, mensaje: 'Profesor eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al eliminar el profesor' });
    }
});

//crrar sesion
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/');
});

module.exports = router;