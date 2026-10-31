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

module.exports = alumnos;
module.exports.insertarEstudiantesModelo = insertarEstudiantesModelo;