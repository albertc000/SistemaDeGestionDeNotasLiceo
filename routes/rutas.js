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
router.post('/login', upload.none(), async (req, res) => {
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

        if (!cedulaEst) {
            return res.json({ exito: false, mensaje: 'La cédula de identidad es obligatoria.' });
        }
        if (!/^\d{8}$/.test(cedulaEst)) {
            return res.json({ exito: false, mensaje: 'La cédula debe contener exactamente 8 dígitos numéricos (ej: 30123456).' });
        }
        if (!primerNombre) {
            return res.json({ exito: false, mensaje: 'El primer nombre es obligatorio y no puede estar vacío.' });
        }
        if (primerNombre.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerNombre)) {
            return res.json({ exito: false, mensaje: 'El primer nombre debe contener solo letras y al menos 2 caracteres.' });
        }
        if (!primerApellido) {
            return res.json({ exito: false, mensaje: 'El primer apellido es obligatorio y no puede estar vacío.' });
        }
        if (primerApellido.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerApellido)) {
            return res.json({ exito: false, mensaje: 'El primer apellido debe contener solo letras y al menos 2 caracteres.' });
        }
        if (segundoNombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoNombre)) {
            return res.json({ exito: false, mensaje: 'El segundo nombre solo puede contener letras.' });
        }
        if (segundoApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoApellido)) {
            return res.json({ exito: false, mensaje: 'El segundo apellido solo puede contener letras.' });
        }
        if (!ano || !seccion) {
            return res.json({ exito: false, mensaje: 'Debe seleccionar el año y la sección del estudiante.' });
        }
        //verificar si existe la cedula en la tabla
        const existe = await tablaEstudiantes.selectOne({ where: { cedula: cedulaEst } });
        if (existe) {
            return res.json({ exito: false, mensaje: 'Un estudiante con esa Cédula ya está registrado.' });
        }

        // Iniciar transacción para asegurar atomicidad (estudiante + inscripción + calificaciones)
        await req.db.beginTransaction();
        try {
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

            const tablaGrados = req.db.tabla('grados');
            const tablaSecciones = req.db.tabla('secciones');
            const tablaPeriodos = req.db.tabla('periodos_academicos');
            const tablaInscripciones = req.db.tabla('inscripciones');
            const tablaMaterias = req.db.tabla('materias');
            const tablaCalificaciones = req.db.tabla('calificaciones');

            const grado = await tablaGrados.selectOne({ where: { nombre: ano } });
            const seccionBD = grado
                ? await tablaSecciones.selectOne({ where: { id_grado: grado.id, letra: seccion } })
                : null;

            const periodoActivo = await tablaPeriodos.selectOne({ where: { activo: 1 } });

            if (seccionBD && periodoActivo) {
                // Insertar inscripción
                const resIns = await tablaInscripciones.insert({
                    cedula_estudiante: cedulaEst,
                    id_seccion: seccionBD.id,
                    id_periodo: periodoActivo.id
                });
                const idInscripcion = resIns.insertId;
                //Obtener materias del grado
                const materias = await tablaMaterias.select({ where: { id_grado: seccionBD.id_grado } });
                //Inicializar las calificaciones
                for (const mat of materias) {
                    for (let lapso = 1; lapso <= 4; lapso++) {
                        await tablaCalificaciones.insert({
                            id_inscripcion: idInscripcion,
                            id_materia: mat.id,
                            lapso: lapso,
                            nota: 0
                        });
                    }
                }
            }

            await req.db.commit();
            return res.json({ exito: true, mensaje: 'Estudiante registrado con éxito' });
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
    }
    catch (error) {
        console.error('Error al registrar:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

//Proceso de editar datos personales y sección del estudiante
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

        const primerNombre = (nombre || '').trim();
        const segundoNombre = (seg_nombre || segnombre || '').trim();
        const primerApellido = (apellido || '').trim();
        const segundoApellido = (seg_apellido || segapellido || '').trim();
        const cedulaEst = (cedula || '').trim();

        if (!cedulaEst) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada.' });
        }
        if (!primerNombre) {
            return res.json({ exito: false, mensaje: 'El primer nombre es obligatorio y no puede estar vacío.' });
        }
        if (primerNombre.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerNombre)) {
            return res.json({ exito: false, mensaje: 'El primer nombre debe contener solo letras y al menos 2 caracteres.' });
        }
        if (!primerApellido) {
            return res.json({ exito: false, mensaje: 'El primer apellido es obligatorio y no puede estar vacío.' });
        }
        if (primerApellido.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerApellido)) {
            return res.json({ exito: false, mensaje: 'El primer apellido debe contener solo letras y al menos 2 caracteres.' });
        }
        if (segundoNombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoNombre)) {
            return res.json({ exito: false, mensaje: 'El segundo nombre solo puede contener letras.' });
        }
        if (segundoApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoApellido)) {
            return res.json({ exito: false, mensaje: 'El segundo apellido solo puede contener letras.' });
        }

        const alumno = await tablaEstudiantes.selectOne({ where: { cedula: cedulaEst } });
        if (!alumno) {
            return res.json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }

        // Iniciar transacción atómica para edición de estudiante y sección
        await req.db.beginTransaction();
        try {
            // Actualizar datos personales en tabla estudiantes
            await tablaEstudiantes.update({
                nombre: (nombre || alumno.nombre).trim(),
                seg_nombre: (seg_nombre || segnombre || alumno.seg_nombre || '').trim(),
                apellido: (apellido || alumno.apellido).trim(),
                seg_apellido: (seg_apellido || segapellido || alumno.seg_apellido || '').trim(),
                genero: genero || alumno.genero || 'M',
                telefono: (telefono || telf || alumno.telefono || '').trim(),
                direccion: (direccion || alumno.direccion || '').trim()
            }, { cedula });

            // Gestionar cambio de sección / grado
            const tablaGrados = req.db.tabla('grados');
            const tablaSecciones = req.db.tabla('secciones');
            const tablaInscripciones = req.db.tabla('inscripciones');
            const tablaPeriodos = req.db.tabla('periodos_academicos');

            const grado = await tablaGrados.selectOne({ where: { nombre: ano } });
            const seccionBD = grado
                ? await tablaSecciones.selectOne({ where: { id_grado: grado.id, letra: seccion } })
                : null;

            if (seccionBD) {
                const idSeccion = seccionBD.id;
                const inscripcionExistente = await tablaInscripciones.selectOne({ where: { cedula_estudiante: cedula } });
                if (inscripcionExistente) {
                    await tablaInscripciones.update({ id_seccion: idSeccion }, { id: inscripcionExistente.id });
                } else {
                    const periodoActivo = await tablaPeriodos.selectOne({ where: { activo: 1 } });
                    await tablaInscripciones.insert({
                        cedula_estudiante: cedula,
                        id_seccion: idSeccion,
                        id_periodo: periodoActivo ? periodoActivo.id : 1
                    });
                }
            }

            await req.db.commit();
            return res.json({ exito: true, mensaje: 'Ficha del estudiante actualizada con éxito' });
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
    }
    catch (error) {
        console.error('Error al actualizar estudiante:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar estudiante' });
    }
});

//Vista dedicada para modificar datos personales del estudiante
router.get('/estudiante/:cedula/editar', verificarAutenticacion, async (req, res) => {
    try {
        const cedula = req.params.cedula;
        if (!cedula) return res.redirect('/listado');

        const alumno = await req.db.tabla('estudiantes').selectOne({ where: { cedula } });
        if (!alumno) return res.redirect('/listado');

        const inscripcion = await req.db.tabla('inscripciones').selectOne({ where: { cedula_estudiante: cedula } });
        let seccion = null;
        let grado = null;
        if (inscripcion) {
            seccion = await req.db.tabla('secciones').selectOne({ where: { id: inscripcion.id_seccion } });
            if (seccion) {
                grado = await req.db.tabla('grados').selectOne({ where: { id: seccion.id_grado } });
            }
        }

        alumno.ano = grado ? grado.nombre : '1er Año';
        alumno.seccion = seccion ? seccion.letra : 'A';

        const fromUrl = req.query.from || '/listado';
        res.render('formModificar', { ...alumno, fromUrl });
    } catch (error) {
        console.error("Error al cargar formulario de modificación:", error);
        res.redirect('/listado');
    }
});

// Redirección de búsqueda a la nueva URL amigable
router.post('/busquedaEstudiante', upload.none(), verificarAutenticacion, (req, res) => {
    const cedula = req.body.cedula;
    if (!cedula) return res.redirect('/listado');
    res.redirect(`/estudiante/${cedula}/editar`);
});

//Vista dedicada exclusivamente a Calificaciones del estudiante
router.get('/estudiante/:cedula/notas', verificarAutenticacion, async (req, res) => {
    try {
        const cedula = req.params.cedula;
        if (!cedula) return res.redirect('/listado');

        const alumno = await req.db.tabla('estudiantes').selectOne({ where: { cedula } });
        if (!alumno) return res.redirect('/listado');

        const inscripcion = await req.db.tabla('inscripciones').selectOne({ where: { cedula_estudiante: cedula } });
        let seccion = null;
        let grado = null;
        if (inscripcion) {
            seccion = await req.db.tabla('secciones').selectOne({ where: { id: inscripcion.id_seccion } });
            if (seccion) {
                grado = await req.db.tabla('grados').selectOne({ where: { id: seccion.id_grado } });
            }
        }

        alumno.id_inscripcion = inscripcion ? inscripcion.id : null;
        alumno.ano = grado ? grado.nombre : '1er Año';
        alumno.seccion = seccion ? seccion.letra : 'A';
        alumno.id_grado = grado ? grado.id : 1;

        // Materias del grado asignado
        const materias = await req.db.tabla('materias').select({
            where: { id_grado: alumno.id_grado },
            order: 'nombre ASC'
        });

        let calificaciones = [];
        if (alumno.id_inscripcion) {
            calificaciones = await req.db.tabla('calificaciones').select({
                where: { id_inscripcion: alumno.id_inscripcion }
            });
        }

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
                nota1, nota2, nota3, nota4,
                promedio: promedioMat
            };
        });

        const fromUrl = req.query.from || '/listado';
        res.render('calificacionesEstudiante', {
            ...alumno,
            materiasConNotas,
            fromUrl
        });
    } catch (error) {
        console.error("Error al cargar calificaciones del estudiante:", error);
        res.redirect('/listado');
    }
});

//Proceso de actualización atómica de las calificaciones
router.put('/estudiante/:cedula/notas', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const cedula = req.params.cedula;
        const returnUrl = req.body.from || req.query.from || '/listado';
        const sep = returnUrl.includes('?') ? '&' : '?';

        const inscripcion = await req.db.tabla('inscripciones').selectOne({ where: { cedula_estudiante: cedula } });
        if (!inscripcion) {
            return res.redirect(`${returnUrl}${sep}msg=error`);
        }

        const idInscripcion = inscripcion.id;
        const tablaCalificaciones = req.db.tabla('calificaciones');

        // Transacción atómica para guardar todas las notas
        await req.db.beginTransaction();
        try {
            for (const key of Object.keys(req.body)) {
                const match = key.match(/^nota_(\d+)_([1-4])$/);
                if (match) {
                    const idMateria = parseInt(match[1]);
                    const lapso = parseInt(match[2]);
                    const val = parseFloat(req.body[key]);
                    const notaFinal = isNaN(val) ? 0 : Math.min(20, Math.max(0, val));

                    const existeNota = await tablaCalificaciones.selectOne({
                        where: { id_inscripcion: idInscripcion, id_materia: idMateria, lapso: lapso }
                    });

                    if (existeNota) {
                        await tablaCalificaciones.update(
                            { nota: notaFinal },
                            { id: existeNota.id }
                        );
                    } else {
                        await tablaCalificaciones.insert({
                            id_inscripcion: idInscripcion,
                            id_materia: idMateria,
                            lapso: lapso,
                            nota: notaFinal
                        });
                    }
                }
            }
            await req.db.commit();
            res.redirect(`${returnUrl}${sep}msg=notas_guardadas`);
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
    } catch (error) {
        console.error("Error al guardar calificaciones:", error);
        const fallbackUrl = req.body.from || req.query.from || `/estudiante/${req.params.cedula}/notas`;
        const sepErr = fallbackUrl.includes('?') ? '&' : '?';
        res.redirect(`${fallbackUrl}${sepErr}msg=error`);
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

        // Transacción para eliminar calificaciones, inscripciones y registro del estudiante de forma atómica
        await req.db.beginTransaction();
        try {
            //Obtener todas las inscripciones del estudiante con tabla
            const inscripciones = await req.db.tabla('inscripciones').select({
                campos: ['id'],
                where: { cedula_estudiante: cedula }
            });

            //Eliminar calificaciones vinculadas a las inscripciones
            if (inscripciones && inscripciones.length > 0) {
                for (const ins of inscripciones) {
                    await req.db.tabla('calificaciones').delete({ id_inscripcion: ins.id });
                }
                //Eliminar inscripciones
                await req.db.tabla('inscripciones').delete({ cedula_estudiante: cedula });
            }

            //Eliminar el registro del alumno
            await tablaEstudiantes.delete({ cedula });

            await req.db.commit();
            return res.json({ exito: true, mensaje: 'Estudiante eliminado con éxito' });
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
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
router.get('/reporte', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const inscripciones = await req.db.tabla('inscripciones').select({
            campos: [
                'inscripciones.id AS id_inscripcion',
                'estudiantes.cedula',
                'estudiantes.nombre',
                'estudiantes.seg_nombre',
                'estudiantes.apellido',
                'estudiantes.seg_apellido',
                'grados.nombre AS ano',
                'secciones.letra AS seccion'
            ],
            joins: {
                '=estudiantes': 'inscripciones.cedula_estudiante = estudiantes.cedula',
                '=secciones': 'inscripciones.id_seccion = secciones.id',
                '=grados': 'secciones.id_grado = grados.id'
            },
            order: 'grados.id ASC, secciones.letra ASC, estudiantes.apellido ASC'
        });

        const idsInscripcion = inscripciones.map(i => i.id_inscripcion);
        let todasCalificaciones = [];
        if (idsInscripcion.length > 0) {
            todasCalificaciones = await req.db.tabla('calificaciones').select({
                campos: [
                    'calificaciones.id_inscripcion',
                    'calificaciones.id_materia',
                    'calificaciones.lapso',
                    'calificaciones.nota',
                    'materias.nombre AS nombre_materia'
                ],
                joins: {
                    '=materias': 'calificaciones.id_materia = materias.id'
                },
                where: `calificaciones.id_inscripcion IN (${idsInscripcion.join(',')})`
            });
        }

        // Obtener lista consolidada de materias para las columnas del reporte
        const listaMateriasBD = await req.db.tabla('materias').select({
            campos: ['nombre'],
            group: 'nombre',
            order: 'nombre ASC'
        });
        const materias = listaMateriasBD.map(m => m.nombre);

        const estudiantes = inscripciones.map(ins => {
            const notasAlumno = todasCalificaciones.filter(c => c.id_inscripcion === ins.id_inscripcion);

            // Calcular promedio por cada materia
            const promediosMateria = {};
            let sumaPromediosMaterias = 0;
            let materiasEvaluadasCount = 0;

            materias.forEach(nombreMat => {
                const notasMat = notasAlumno.filter(c => c.nombre_materia === nombreMat);
                if (notasMat.length > 0) {
                    const suma = notasMat.reduce((acc, curr) => acc + (Number(curr.nota) || 0), 0);
                    const promMat = parseFloat((suma / notasMat.length).toFixed(2));
                    promediosMateria[nombreMat] = promMat.toFixed(2);
                    sumaPromediosMaterias += promMat;
                    materiasEvaluadasCount++;
                } else {
                    promediosMateria[nombreMat] = '-';
                }
            });

            const todasNotas = notasAlumno.map(c => Number(c.nota) || 0);
            const promedioNum = materiasEvaluadasCount > 0 
                ? parseFloat((sumaPromediosMaterias / materiasEvaluadasCount).toFixed(2)) 
                : 0;

            let estado = 'Sin evaluar';
            if (todasNotas.length > 0) {
                estado = promedioNum >= 10 ? 'Aprobado' : 'Reprobado';
            }

            return {
                cedula: ins.cedula,
                nombre: ins.nombre,
                seg_nombre: ins.seg_nombre || '',
                apellido: ins.apellido,
                seg_apellido: ins.seg_apellido || '',
                ano: ins.ano || '-',
                seccion: ins.seccion || '-',
                promediosMateria,
                promedio: todasNotas.length > 0 ? promedioNum.toFixed(2) : '0.00',
                estado
            };
        });

        res.render('reporteGeneral', {
            titulo: 'Reporte General de Calificaciones',
            subtitulo: 'Nómina General de Estudiantes y Rendimiento Académico',
            returnUrl: '/listado',
            materias,
            estudiantes
        });
    } catch (error) {
        console.error('Error al generar reporte general:', error);
        res.render('reporteGeneral', {
            titulo: 'Reporte General de Calificaciones',
            subtitulo: 'Nómina General de Estudiantes y Rendimiento Académico',
            returnUrl: '/listado',
            materias: [],
            estudiantes: []
        });
    }
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
        const filas = await req.db.tabla('inscripciones').select({
            campos: [
                "materias.id AS materia_id",
                "materias.nombre AS materia",
                "calificaciones.lapso",
                "calificaciones.nota"
            ],
            joins: {
                "=secciones": "inscripciones.id_seccion = secciones.id",
                "=grados": "secciones.id_grado = grados.id",
                "=materias": "materias.id_grado = grados.id",
                "=periodos_academicos": "inscripciones.id_periodo = periodos_academicos.id AND periodos_academicos.activo = 1",
                ">calificaciones": "calificaciones.id_inscripcion = inscripciones.id AND calificaciones.id_materia = materias.id"
            },
            where: { "inscripciones.cedula_estudiante": cedula },
            order: "materias.nombre ASC, calificaciones.lapso ASC"
        });

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
        const sql = `
            SELECT 
                p.cedula, p.nombre, p.seg_nombre, p.apellido, p.seg_apellido,
                p.telefono, p.direccion, p.genero,
                COALESCE(m.nombre, 'Sin asignar') AS materia,
                COALESCE(CONCAT(g.nombre, ' "', s.letra, '"'), 'Sin asignar') AS seccion_asignada
            FROM profesores p
            LEFT JOIN profesor_asignaciones pa ON p.cedula = pa.cedula_profesor
            LEFT JOIN materias m ON pa.id_materia = m.id
            LEFT JOIN secciones s ON pa.id_seccion = s.id
            LEFT JOIN grados g ON s.id_grado = g.id
            ORDER BY p.apellido ASC
        `;
        const lista = await req.db.query(sql);
        res.json(lista);
    } catch (error) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({ error: 'Error al obtener la lista de profesores' });
    }
});

// Vista de formulario de registro de profesor
router.get('/registroProfesor', verificarAutenticacion, async (req, res) => {
    try {
        const materias = await req.db.tabla('materias').select({
            campos: ['nombre'],
            group: 'nombre',
            order: 'nombre ASC'
        });
        const secciones = await req.db.tabla('secciones').select({
            campos: ['secciones.id', 'secciones.letra', 'grados.nombre AS grado'],
            joins: { '=grados': 'secciones.id_grado = grados.id' },
            order: 'grados.id ASC, secciones.letra ASC'
        });
        res.render('formRegistroProfesor', { materias, secciones });
    } catch (error) {
        console.error('Error al cargar datos para registrar profesor:', error);
        res.redirect('/listadoProfesores');
    }
});

// Registrar nuevo profesor
router.post('/nuevoProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const tablaAsignaciones = req.db.tabla('profesor_asignaciones');

        const {
            cedula, nombre, seg_nombre, apellido, seg_apellido,
            genero, telefono, direccion, materia, id_seccion
        } = req.body;

        const cedulaProf = (cedula || '').trim();
        const primerNombre = (nombre || '').trim();
        const segundoNombre = (seg_nombre || '').trim();
        const primerApellido = (apellido || '').trim();
        const segundoApellido = (seg_apellido || '').trim();
        const telf = (telefono || '').trim();

        if (!cedulaProf) {
            return res.json({ exito: false, mensaje: 'La cédula de identidad es obligatoria.' });
        }
        if (!/^\d{8}$/.test(cedulaProf)) {
            return res.json({ exito: false, mensaje: 'La cédula debe contener exactamente 8 dígitos numéricos (ej: 18234567).' });
        }
        if (!primerNombre) {
            return res.json({ exito: false, mensaje: 'El primer nombre es obligatorio y no puede estar vacío.' });
        }
        if (primerNombre.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerNombre)) {
            return res.json({ exito: false, mensaje: 'El primer nombre debe contener solo letras y al menos 2 caracteres.' });
        }
        if (!primerApellido) {
            return res.json({ exito: false, mensaje: 'El primer apellido es obligatorio y no puede estar vacío.' });
        }
        if (primerApellido.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerApellido)) {
            return res.json({ exito: false, mensaje: 'El primer apellido debe contener solo letras y al menos 2 caracteres.' });
        }
        if (segundoNombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoNombre)) {
            return res.json({ exito: false, mensaje: 'El segundo nombre solo puede contener letras.' });
        }
        if (segundoApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoApellido)) {
            return res.json({ exito: false, mensaje: 'El segundo apellido solo puede contener letras.' });
        }
        if (!telf) {
            return res.json({ exito: false, mensaje: 'El teléfono de contacto es obligatorio.' });
        }

        const existe = await tablaProfesores.selectOne({ where: { cedula: cedulaProf } });
        if (existe) {
            return res.json({ exito: false, mensaje: 'Un profesor con esa Cédula ya está registrado.' });
        }
        // Transacción para insertar profesor y su asignación
        await req.db.beginTransaction();
        try {
            //Guardar profesor
            await tablaProfesores.insert({
                cedula: cedulaProf,
                nombre: primerNombre,
                seg_nombre: segundoNombre,
                apellido: primerApellido,
                seg_apellido: segundoApellido,
                genero: genero || 'M',
                telefono: telf,
                direccion: direccion || ''
            });
            //Asociar automáticamente la materia al grado de la sección seleccionada
            if (materia && id_seccion) {
                const seccionBD = await req.db.tabla('secciones').selectOne({ where: { id: parseInt(id_seccion) } });
                if (seccionBD) {
                    const materiaBD = await req.db.tabla('materias').selectOne({
                        where: { nombre: materia, id_grado: seccionBD.id_grado }
                    });
                    if (materiaBD) {
                        await tablaAsignaciones.insert({
                            cedula_profesor: cedula,
                            id_materia: materiaBD.id,
                            id_seccion: parseInt(id_seccion)
                        });
                    }
                }
            }
            await req.db.commit();
            return res.json({ exito: true, mensaje: 'Profesor y asignación registrados con éxito' });
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
    } catch (error) {
        console.error('Error al registrar profesor:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al registrar el profesor' });
    }
});

// Búsqueda de profesor para modificar
router.post('/busquedaProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const fromUrl = req.body.from ? decodeURIComponent(req.body.from) : (req.query.from || '/listadoProfesores');
        const tablaProfesores = req.db.tabla('profesores');
        const profesor = await tablaProfesores.selectOne({ where: { cedula: req.body.cedula } });
        if (!profesor) return res.redirect('/listadoProfesores');

        // Buscar su asignación actual y obtener el nombre de la materia y la sección con tabla
        const asignacion = await req.db.tabla('profesor_asignaciones').select({
            campos: ['profesor_asignaciones.id_seccion', 'materias.nombre AS nombre_materia'],
            joins: { '=materias': 'profesor_asignaciones.id_materia = materias.id' },
            where: { 'profesor_asignaciones.cedula_profesor': profesor.cedula },
            limit: 1
        });

        const materias = await req.db.tabla('materias').select({
            campos: ['nombre'],
            group: 'nombre',
            order: 'nombre ASC'
        });
        const secciones = await req.db.tabla('secciones').select({
            campos: ['secciones.id', 'secciones.letra', 'grados.nombre AS grado'],
            joins: { '=grados': 'secciones.id_grado = grados.id' },
            order: 'grados.id ASC, secciones.letra ASC'
        });

        res.render('formModificarProfesor', {
            ...profesor,
            nombre_materia_actual: (asignacion && asignacion.length > 0) ? asignacion[0].nombre_materia : null,
            id_seccion_actual: (asignacion && asignacion.length > 0) ? asignacion[0].id_seccion : null,
            materias,
            secciones,
            fromUrl
        });
    } catch (error) {
        console.error('Error al buscar profesor:', error);
        res.redirect('/listadoProfesores');
    }
});

// Proceso de editar profesor
router.put('/editarProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const tablaProfesores = req.db.tabla('profesores');
        const tablaAsignaciones = req.db.tabla('profesor_asignaciones');
        const { cedula, nombre, seg_nombre, apellido, seg_apellido, genero, telefono, direccion, materia, id_seccion } = req.body;

        const cedulaProf = (cedula || '').trim();
        const primerNombre = (nombre || '').trim();
        const segundoNombre = (seg_nombre || '').trim();
        const primerApellido = (apellido || '').trim();
        const segundoApellido = (seg_apellido || '').trim();
        const telf = (telefono || '').trim();

        if (!cedulaProf) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada.' });
        }
        if (!primerNombre) {
            return res.json({ exito: false, mensaje: 'El primer nombre es obligatorio y no puede estar vacío.' });
        }
        if (primerNombre.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerNombre)) {
            return res.json({ exito: false, mensaje: 'El primer nombre debe contener solo letras y al menos 2 caracteres.' });
        }
        if (!primerApellido) {
            return res.json({ exito: false, mensaje: 'El primer apellido es obligatorio y no puede estar vacío.' });
        }
        if (primerApellido.length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(primerApellido)) {
            return res.json({ exito: false, mensaje: 'El primer apellido debe contener solo letras y al menos 2 caracteres.' });
        }
        if (segundoNombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoNombre)) {
            return res.json({ exito: false, mensaje: 'El segundo nombre solo puede contener letras.' });
        }
        if (segundoApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segundoApellido)) {
            return res.json({ exito: false, mensaje: 'El segundo apellido solo puede contener letras.' });
        }
        if (!telf) {
            return res.json({ exito: false, mensaje: 'El teléfono de contacto es obligatorio.' });
        }

        // Transacción para actualizar profesor y su asignación
        await req.db.beginTransaction();
        try {
            //Actualizar datos personales
            await tablaProfesores.update({
                nombre: primerNombre,
                seg_nombre: segundoNombre,
                apellido: primerApellido,
                seg_apellido: segundoApellido,
                genero: genero || 'M',
                telefono: telf,
                direccion: direccion || ''
            }, { cedula: cedulaProf });

            //Actualizar o insertar asignación según la sección elegida
            if (materia && id_seccion) {
                const seccionBD = await req.db.tabla('secciones').selectOne({ where: { id: parseInt(id_seccion) } });
                if (seccionBD) {
                    const materiaBD = await req.db.tabla('materias').selectOne({
                        where: { nombre: materia, id_grado: seccionBD.id_grado }
                    });
                    if (materiaBD) {
                        const existeAsignacion = await tablaAsignaciones.selectOne({ where: { cedula_profesor: cedula } });
                        if (existeAsignacion) {
                            await tablaAsignaciones.update({
                                id_materia: materiaBD.id,
                                id_seccion: parseInt(id_seccion)
                            }, { id: existeAsignacion.id });
                        } else {
                            await tablaAsignaciones.insert({
                                cedula_profesor: cedula,
                                id_materia: materiaBD.id,
                                id_seccion: parseInt(id_seccion)
                            });
                        }
                    }
                }
            }
            await req.db.commit();
            return res.json({ exito: true, mensaje: 'Profesor y asignación actualizados con éxito' });
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
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

        // Transacción para eliminar asignaciones y ficha del profesor de forma atómica
        await req.db.beginTransaction();
        try {
            //Eliminar asignaciones de la materia con tabla
            await req.db.tabla('profesor_asignaciones').delete({ cedula_profesor: cedula });
            //Eliminar registro del docente con tabla
            await tablaProfesores.delete({ cedula });

            await req.db.commit();
            return res.json({ exito: true, mensaje: 'Profesor eliminado con éxito' });
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al eliminar el profesor' });
    }
});

//vista principal de Secciones
router.get('/secciones', verificarAutenticacion, (req, res) => {
    res.render('secciones');
});
//API: resumen de todas las secciones con su conteo de estudiantes
router.get('/api/secciones-resumen', verificarAutenticacion, async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.id, 
                s.letra, 
                g.id AS id_grado, 
                g.nombre AS grado,
                COUNT(i.id) AS total_estudiantes
            FROM secciones s
            JOIN grados g ON s.id_grado = g.id
            LEFT JOIN inscripciones i ON s.id = i.id_seccion
            GROUP BY s.id, s.letra, g.id, g.nombre
            ORDER BY g.id ASC, s.letra ASC
        `;
        const resumen = await req.db.query(sql);
        res.json(resumen);
    } catch (error) {
        console.error("Error al obtener resumen de secciones:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});
//API: Detalle completo de una sección (Estudiantes y Profesores)
router.get('/api/seccion/:id/detalle', verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;
        //Profesores asignados a esta sección
        const sqlProfesores = `
            SELECT 
                p.cedula, p.nombre, p.apellido, p.telefono,
                m.nombre AS materia
            FROM profesor_asignaciones pa
            JOIN profesores p ON pa.cedula_profesor = p.cedula
            JOIN materias m ON pa.id_materia = m.id
            WHERE pa.id_seccion = ?
            ORDER BY m.nombre ASC
        `;
        const profesores = await req.db.query(sqlProfesores, { values: [id] });
        //Estudiantes inscritos en esta sección con sus calificaciones
        const sqlEstudiantes = `
            SELECT 
                e.cedula, e.nombre, e.apellido,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 1 THEN c.nota END), 1), 0) AS nota1,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 2 THEN c.nota END), 1), 0) AS nota2,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 3 THEN c.nota END), 1), 0) AS nota3,
                COALESCE(ROUND(AVG(CASE WHEN c.lapso = 4 THEN c.nota END), 1), 0) AS nota4,
                COALESCE(ROUND(AVG(c.nota), 2), 0) AS promedio,
                CASE WHEN AVG(c.nota) >= 10 THEN 'Aprobado' ELSE 'Reprobado' END AS estado
            FROM inscripciones i
            JOIN estudiantes e ON i.cedula_estudiante = e.cedula
            LEFT JOIN calificaciones c ON i.id = c.id_inscripcion
            WHERE i.id_seccion = ?
            GROUP BY e.cedula, e.nombre, e.apellido, i.id
            ORDER BY e.apellido ASC
        `;
        const estudiantes = await req.db.query(sqlEstudiantes, { values: [id] });
        res.json({ profesores, estudiantes });
    } catch (error) {
        console.error("Error al obtener detalle de sección:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

//Pantalla dedicada de la Sección
router.get('/seccion/:id', verificarAutenticacion, async (req, res) => {
    try {
        const idSeccion = parseInt(req.params.id);
        //Obtener datos de la sección y su año/grado con tabla
        const seccionBD = await req.db.tabla('secciones').select({
            campos: ['secciones.id', 'secciones.letra', 'grados.id AS id_grado', 'grados.nombre AS grado'],
            joins: { '=grados': 'secciones.id_grado = grados.id' },
            where: { 'secciones.id': idSeccion },
            limit: 1
        });
        if (!seccionBD || seccionBD.length === 0) return res.redirect('/secciones');
        const seccion = seccionBD[0];

        //Materias del grado con el profesor asignado con tabla
        const materias = await req.db.tabla('materias').select({
            campos: [
                'materias.id AS id_materia',
                'materias.nombre AS nombre_materia',
                'profesores.cedula AS cedula_profesor',
                'profesores.nombre AS nombre_profesor',
                'profesores.apellido AS apellido_profesor',
                'profesores.telefono AS telefono_profesor'
            ],
            joins: {
                '>profesor_asignaciones': `materias.id = profesor_asignaciones.id_materia AND profesor_asignaciones.id_seccion = ${idSeccion}`,
                '>profesores': 'profesor_asignaciones.cedula_profesor = profesores.cedula'
            },
            where: { 'materias.id_grado': seccion.id_grado },
            order: 'materias.nombre ASC'
        });

        //Lista de todos los profesores con tabla (para el selector de asignación)
        const listaProfesores = await req.db.tabla('profesores').select({
            campos: ['cedula', 'nombre', 'apellido', 'telefono'],
            order: 'apellido ASC'
        });

        //Estudiantes inscritos en esta sección con tabla
        const estudiantesInscritos = await req.db.tabla('inscripciones').select({
            campos: ['estudiantes.cedula', 'estudiantes.nombre', 'estudiantes.apellido', 'estudiantes.telefono'],
            joins: { '=estudiantes': 'inscripciones.cedula_estudiante = estudiantes.cedula' },
            where: { 'inscripciones.id_seccion': idSeccion },
            order: 'estudiantes.apellido ASC'
        });

        //Estudiantes que NO están asignados a ninguna sección actualmente con tabla
        const estudiantesDisponibles = await req.db.tabla('estudiantes').select({
            campos: ['estudiantes.cedula', 'estudiantes.nombre', 'estudiantes.apellido'],
            joins: { '>inscripciones': 'estudiantes.cedula = inscripciones.cedula_estudiante' },
            where: 'inscripciones.id IS NULL',
            order: 'estudiantes.apellido ASC'
        });

        res.render('detalleSeccion', {
            seccion,
            materias,
            listaProfesores,
            estudiantesInscritos,
            estudiantesDisponibles
        });
    } catch (error) {
        console.error("Error al cargar detalle de sección:", error);
        res.redirect('/secciones');
    }
});
//Asignar o cambiar profesor de una materia en esta sección
router.post('/seccion/:id/asignarProfesor', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const idSeccion = parseInt(req.params.id);
        const { id_materia, cedula_profesor } = req.body;
        const tablaAsignaciones = req.db.tabla('profesor_asignaciones');

        await req.db.beginTransaction();
        try {
            const existe = await tablaAsignaciones.selectOne({
                where: { id_seccion: idSeccion, id_materia: parseInt(id_materia) }
            });
            if (cedula_profesor === "" || !cedula_profesor) {
                // Si el usuario eligió "Sin asignar", eliminamos la asignación
                if (existe) await tablaAsignaciones.delete({ id: existe.id });
            } else {
                if (existe) {
                    await tablaAsignaciones.update({ cedula_profesor }, { id: existe.id });
                } else {
                    await tablaAsignaciones.insert({
                        cedula_profesor,
                        id_materia: parseInt(id_materia),
                        id_seccion: idSeccion
                    });
                }
            }
            await req.db.commit();
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }

        res.redirect(`/seccion/${idSeccion}?msg=${cedula_profesor ? 'profesor_asignado' : 'profesor_desasignado'}`);
    } catch (error) {
        console.error("Error al asignar profesor:", error);
        res.redirect(`/seccion/${req.params.id}?msg=error`);
    }
});
//Inscribir un estudiante no asignado a esta sección
router.post('/seccion/:id/asignarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const idSeccion = parseInt(req.params.id);
        const { cedula_estudiante } = req.body;
        if (!cedula_estudiante) return res.redirect(`/seccion/${idSeccion}`);
        const periodoActivo = await req.db.tabla('periodos_academicos').selectOne({ where: { activo: 1 } });
        const seccion = await req.db.tabla('secciones').selectOne({ where: { id: idSeccion } });

        //Transacción atómica: inscripción + 40 notas iniciales por materia/lapso
        await req.db.beginTransaction();
        try {
            //Crear inscripción
            const resIns = await req.db.tabla('inscripciones').insert({
                cedula_estudiante,
                id_seccion: idSeccion,
                id_periodo: periodoActivo ? periodoActivo.id : 1
            });
            //Inicializar notas de las materias del grado en 0
            const materias = await req.db.tabla('materias').select({ where: { id_grado: seccion.id_grado } });
            for (const mat of materias) {
                for (let lapso = 1; lapso <= 4; lapso++) {
                    await req.db.tabla('calificaciones').insert({
                        id_inscripcion: resIns.insertId,
                        id_materia: mat.id,
                        lapso,
                        nota: 0
                    });
                }
            }
            await req.db.commit();
        } catch (errTx) {
            await req.db.rollback();
            throw errTx;
        }

        res.redirect(`/seccion/${idSeccion}?msg=estudiante_inscrito`);
    } catch (error) {
        console.error("Error al asignar estudiante:", error);
        res.redirect(`/seccion/${req.params.id}?msg=error`);
    }
});

//Desincorporar estudiante de esta sección
router.post('/seccion/:id/desasignarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const idSeccion = parseInt(req.params.id);
        const { cedula_estudiante } = req.body;
        if (cedula_estudiante) {
            // Transacción atómica: elimina calificaciones de la inscripción y la inscripción
            await req.db.beginTransaction();
            try {
                const inscripcion = await req.db.tabla('inscripciones').selectOne({
                    where: { cedula_estudiante, id_seccion: idSeccion }
                });
                if (inscripcion) {
                    await req.db.tabla('calificaciones').delete({ id_inscripcion: inscripcion.id });
                    await req.db.tabla('inscripciones').delete({ id: inscripcion.id });
                }
                await req.db.commit();
            } catch (errTx) {
                await req.db.rollback();
                throw errTx;
            }
        }
        res.redirect(`/seccion/${idSeccion}?msg=estudiante_desincorporado`);
    } catch (error) {
        console.error("Error al desincorporar estudiante:", error);
        res.redirect(`/seccion/${req.params.id}?msg=error`);
    }
});

//Reporte académico específico de una sección
router.get('/seccion/:id/reporte', verificarAutenticacion, async (req, res) => {
    try {
        const idSeccion = parseInt(req.params.id);

        //Datos de la sección y grado
        const seccionBD = await req.db.tabla('secciones').select({
            campos: ['secciones.id', 'secciones.letra', 'grados.id AS id_grado', 'grados.nombre AS grado'],
            joins: { '=grados': 'secciones.id_grado = grados.id' },
            where: { 'secciones.id': idSeccion },
            limit: 1
        });
        if (!seccionBD || seccionBD.length === 0) return res.redirect('/secciones');
        const seccion = seccionBD[0];

        //Materias de la sección
        const materiasSeccion = await req.db.tabla('materias').select({
            campos: ['materias.id AS id_materia', 'materias.nombre AS nombre_materia'],
            where: { 'materias.id_grado': seccion.id_grado },
            order: 'materias.nombre ASC'
        });
        const materias = materiasSeccion.map(m => m.nombre_materia);

        //Estudiantes inscritos con tabla según mysql-tab
        const inscripciones = await req.db.tabla('inscripciones').select({
            campos: [
                'inscripciones.id AS id_inscripcion',
                'estudiantes.cedula',
                'estudiantes.nombre',
                'estudiantes.seg_nombre',
                'estudiantes.apellido',
                'estudiantes.seg_apellido',
                'estudiantes.telefono'
            ],
            joins: {
                '=estudiantes': 'inscripciones.cedula_estudiante = estudiantes.cedula'
            },
            where: { 'inscripciones.id_seccion': idSeccion },
            order: 'estudiantes.apellido ASC, estudiantes.nombre ASC'
        });

        //Calificaciones de las inscripciones con tabla calificaciones según mysql-tab
        const idsInscripcion = inscripciones.map(i => i.id_inscripcion);
        let todasCalificaciones = [];
        if (idsInscripcion.length > 0) {
            todasCalificaciones = await req.db.tabla('calificaciones').select({
                campos: [
                    'calificaciones.id_inscripcion',
                    'calificaciones.id_materia',
                    'calificaciones.lapso',
                    'calificaciones.nota',
                    'materias.nombre AS nombre_materia'
                ],
                joins: {
                    '=materias': 'calificaciones.id_materia = materias.id'
                },
                where: `calificaciones.id_inscripcion IN (${idsInscripcion.join(',')})`
            });
        }

        //Procesar calificaciones y promedios por materia para cada estudiante
        const estudiantes = inscripciones.map(ins => {
            const notasAlumno = todasCalificaciones.filter(c => c.id_inscripcion === ins.id_inscripcion);

            const promediosMateria = {};
            let sumaPromediosMaterias = 0;
            let materiasEvaluadasCount = 0;

            materias.forEach(nombreMat => {
                const notasMat = notasAlumno.filter(c => c.nombre_materia === nombreMat);
                if (notasMat.length > 0) {
                    const suma = notasMat.reduce((acc, curr) => acc + (Number(curr.nota) || 0), 0);
                    const promMat = parseFloat((suma / notasMat.length).toFixed(2));
                    promediosMateria[nombreMat] = promMat.toFixed(2);
                    sumaPromediosMaterias += promMat;
                    materiasEvaluadasCount++;
                } else {
                    promediosMateria[nombreMat] = '-';
                }
            });

            const todasNotas = notasAlumno.map(c => Number(c.nota) || 0);
            const promedioNum = materiasEvaluadasCount > 0 
                ? parseFloat((sumaPromediosMaterias / materiasEvaluadasCount).toFixed(2)) 
                : 0;

            let estado = 'Sin evaluar';
            if (todasNotas.length > 0) {
                estado = promedioNum >= 10 ? 'Aprobado' : 'Reprobado';
            }

            return {
                cedula: ins.cedula,
                nombre: ins.nombre,
                seg_nombre: ins.seg_nombre || '',
                apellido: ins.apellido,
                seg_apellido: ins.seg_apellido || '',
                ano: seccion.grado,
                seccion: seccion.letra,
                telefono: ins.telefono || '',
                promediosMateria,
                promedio: todasNotas.length > 0 ? promedioNum.toFixed(2) : '0.00',
                estado
            };
        });

        res.render('reporteGeneral', {
            titulo: `Reporte de Calificaciones - ${seccion.grado} Sección "${seccion.letra}"`,
            subtitulo: `Nómina de Estudiantes y Rendimiento Académico - ${seccion.grado} "${seccion.letra}"`,
            returnUrl: `/seccion/${idSeccion}`,
            materias,
            estudiantes
        });
    } catch (error) {
        console.error("Error al generar reporte de sección:", error);
        res.redirect(`/seccion/${req.params.id}`);
    }
});

//crrar sesion
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/');
});

module.exports = router;