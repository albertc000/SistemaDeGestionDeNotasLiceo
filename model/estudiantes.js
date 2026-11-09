const tablaModel = require("tabla-model");

const alumnos = new tablaModel("estudiantes", {
    colums: [
        { name: "cedula", type: "varchar(45)", defaultNull: false },
        { name: "nombre", type: "varchar(45)", defaultNull: false },
        { name: "seg_nombre", type: "varchar(45)", defaultNull: true },
        { name: "apellido", type: "varchar(45)", defaultNull: false },
        { name: "seg_apellido", type: "varchar(45)", defaultNull: true },
        { name: "genero", type: "varchar(1)"},
        { name: "direccion", type: "varchar(45)"},
        { name: "telefono", type: "varchar(20)"}
    ],
});

/*
async function insertarEstudiantesModelo(db) {
    try {
        const tabla = db.tabla('estudiantes');
        
        const registros = await tabla.select();
    
        if (!registros || registros.length === 0) {
            await tabla.insert({
                cedula: "123456789",
                nombre: "Pedro",
                seg_nombre: "Andrés",
                apellido: "Pérez",
                seg_apellido: "Gómez",
                genero: "M",
                direccion: "Sabana de Mendoza",
                telefono: "04141234567"
            });
            console.log(">> [MySQL] Estudiante inicial creado exitosamente.");
        }

        // Crear inscripción inicial si la tabla existe y el estudiante no está inscrito
        try {
            const tablaInscripciones = db.tabla('inscripciones');
            const existeInscripcion = await tablaInscripciones.selectOne({ where: { cedula_estudiante: '123456789' } });
            if (!existeInscripcion) {
                const seccion = await db.query("SELECT id FROM secciones LIMIT 1");
                const periodo = await db.query("SELECT id FROM periodos_academicos WHERE activo = 1 LIMIT 1");
                if (seccion && seccion.length > 0 && periodo && periodo.length > 0) {
                    await tablaInscripciones.insert({
                        cedula_estudiante: '123456789',
                        id_seccion: seccion[0].id,
                        id_periodo: periodo[0].id
                    });
                    console.log(">> [MySQL] Inscripción inicial de estudiante modelo creada.");
                }
            }
        } catch (e) {
            // Ignorar si la tabla inscripciones aún no fue creada
        }
    } catch (error) {
        console.error("Error al inicializar estudiante modelo:", error);
    }
}
*/

async function insertarEstudiantesModelo(db) {
    try {
        const tablaEstudiantes = db.tabla('estudiantes');
        const tablaInscripciones = db.tabla('inscripciones');
        const tablaCalificaciones = db.tabla('calificaciones');
        // Verificamos cuántos estudiantes hay registrados
        const existentes = await tablaEstudiantes.select();
        if (existentes && existentes.length >= 70) {
            return; // Ya existen estudiantes de prueba, no duplicamos
        }
        console.log(">> [Seed] Generando 70 estudiantes de prueba...");
        // 1. Obtener secciones, materias y período activo
        const secciones = await db.query("SELECT s.id, s.id_grado, s.letra, g.nombre AS grado FROM secciones s JOIN grados g ON s.id_grado = g.id");
        const periodo = await db.tabla('periodos_academicos').selectOne({ where: { activo: 1 } });
        if (!secciones.length || !periodo) {
            console.log(">> [Seed] Se requieren secciones y período activo antes de sembrar estudiantes.");
            return;
        }
        // 2. Bancos de nombres y apellidos para combinaciones aleatorias
        const nombresM = ["Alejandro", "Gabriel", "Carlos", "José", "Daniel", "Jesús", "Manuel", "Luis", "David", "Andrés"];
        const nombresF = ["Valeria", "Mariana", "Camila", "Sofía", "Paola", "Isabella", "Andrea", "Daniela", "Gabriela", "Victoria"];
        const apellidos = ["González", "Rodríguez", "Pérez", "Hernández", "García", "Martínez", "López", "Sánchez", "Ramírez", "Torres", "Flores", "Díaz"];
        // 3. Bucle para crear los 70 estudiantes
        for (let i = 1; i <= 70; i++) {
            const esFemenino = i % 2 === 0;
            const bancoNombres = esFemenino ? nombresF : nombresM;
            const nombre = bancoNombres[Math.floor(Math.random() * bancoNombres.length)];
            const segNombre = bancoNombres[Math.floor(Math.random() * bancoNombres.length)];
            const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
            const segApellido = apellidos[Math.floor(Math.random() * apellidos.length)];
            // Cédula válida de 8 dígitos (ej: 31000001, 31000002, ...)
            const cedula = (31000000 + i).toString();
            const genero = esFemenino ? 'F' : 'M';
            // Insertar estudiante
            await tablaEstudiantes.insert({
                cedula,
                nombre,
                seg_nombre: segNombre,
                apellido,
                seg_apellido: segApellido,
                genero,
                direccion: `Sector Centro, Calle ${Math.floor(Math.random() * 20) + 1}`,
                telefono: `0414${String(1000000 + i).slice(-7)}`
            });
            // Asignar de forma rotatoria a una sección (1er Año A, B, C; 2do Año A, B; etc.)
            const seccionAsignada = secciones[i % secciones.length];
            const resIns = await tablaInscripciones.insert({
                cedula_estudiante: cedula,
                id_seccion: seccionAsignada.id,
                id_periodo: periodo.id
            });
            const idInscripcion = resIns.insertId;
            // Obtener las materias de ese grado
            const materias = await db.tabla('materias').select({ where: { id_grado: seccionAsignada.id_grado } });
            // Insertar calificaciones para cada materia y lapso
            for (const mat of materias) {
                for (let lapso = 1; lapso <= 4; lapso++) {
                    // Genera una nota realista entre 08 y 19 puntos (con 1 decimal)
                    const nota = parseFloat((8 + Math.random() * 11).toFixed(1));
                    await tablaCalificaciones.insert({
                        id_inscripcion: idInscripcion,
                        id_materia: mat.id,
                        lapso: lapso,
                        nota: nota
                    });
                }
            }
        }
        console.log(">> [Seed] ¡70 estudiantes de prueba creados e inscritos con éxito!");
    } catch (error) {
        console.error("Error al sembrar estudiantes de prueba:", error);
    }
}

module.exports = alumnos;
module.exports.insertarEstudiantesModelo = insertarEstudiantesModelo;