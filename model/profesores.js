const tablaModel = require("tabla-model");

const profesores = new tablaModel("profesores", {
    colums: [
        { name: "cedula", type: "varchar(45)", defaultNull: false },
        { name: "nombre", type: "varchar(45)", defaultNull: false },
        { name: "seg_nombre", type: "varchar(45)", defaultNull: false },
        { name: "apellido", type: "varchar(45)", defaultNull: false },
        { name: "seg_apellido", type: "varchar(45)", defaultNull: false },
        { name: "genero", type: "varchar(1)"},
        { name: "direccion", type: "varchar(45)"},
        { name: "telefono", type: "varchar(45)", defaultNull: false }
    ],
});

/*
async function insertarProfeModelo(db) {
    try {
        const tabla = db.tabla('profesores');
        
        const registros = await tabla.select();
    
        if (!registros || registros.length === 0) {
            await tabla.insert({
                cedula: "987654321",
                nombre: "ramiro",
                seg_nombre: "ramir",
                apellido: "ramirez",
                seg_apellido: "ramiron",
                genero: "M",
                direccion: "Su casa",
                telefono: "04140000000"
            });
            console.log(">> [MySQL] Profesor inicial creado exitosamente.");
        }
    } catch (error) {
        console.error("Error al inicializar estudiante modelo:", error);
    }
}
*/

async function insertarProfeModelo(db) {
    try {
        const tablaProfesores = db.tabla('profesores');
        const tablaAsignaciones = db.tabla('profesor_asignaciones');
        // Verificamos si ya existen al menos 30 profesores
        const existentes = await tablaProfesores.select();
        if (existentes && existentes.length >= 30) {
            return; // Ya están creados, evitamos duplicar
        }
        console.log(">> [Seed] Generando 30 profesores de prueba...");
        // 1. Bancos de nombres y apellidos
        const nombresM = ["Roberto", "Carlos", "Fernando", "Ricardo", "Eduardo", "Gustavo", "Enrique", "Alberto", "Javier", "Marcos"];
        const nombresF = ["Elena", "Carmen", "Beatriz", "Patricia", "Rosa", "Margarita", "Teresa", "Claudia", "Silvia", "Adriana"];
        const apellidos = ["Mendoza", "Castillo", "Vargas", "Romero", "Navarro", "Guzmán", "Morales", "Ortega", "Delgado", "Rivas", "Paredes", "Salazar"];
        // 2. Obtener materias y secciones para asignaciones de aula
        const secciones = await db.query("SELECT id, id_grado, letra FROM secciones");
        const materias = await db.query("SELECT id, id_grado, nombre FROM materias");
        // 3. Crear los 30 profesores
        for (let i = 1; i <= 30; i++) {
            const esFemenino = i % 2 === 0;
            const bancoNombres = esFemenino ? nombresF : nombresM;
            const nombre = bancoNombres[Math.floor(Math.random() * bancoNombres.length)];
            const segNombre = bancoNombres[Math.floor(Math.random() * bancoNombres.length)];
            const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
            const segApellido = apellidos[Math.floor(Math.random() * apellidos.length)];
            // Cédula válida de 8 dígitos (ej: 14000001, 14000002, ...)
            const cedula = (14000000 + i).toString();
            const genero = esFemenino ? 'F' : 'M';
            // Insertar datos del profesor
            await tablaProfesores.insert({
                cedula,
                nombre,
                seg_nombre: segNombre,
                apellido,
                seg_apellido: segApellido,
                genero,
                direccion: `Av. Bolívar, Residencia ${Math.floor(Math.random() * 15) + 1}`,
                telefono: `0412${String(2000000 + i).slice(-7)}`
            });
            // (Opcional) Asignar al profesor a materias de diferentes secciones
            if (secciones.length > 0 && materias.length > 0) {
                // Seleccionamos una sección y una materia de ese mismo grado
                const seccion = secciones[i % secciones.length];
                const materiasGrado = materias.filter(m => m.id_grado === seccion.id_grado);
                if (materiasGrado.length > 0) {
                    const materia = materiasGrado[i % materiasGrado.length];
                    // Evitar duplicar asignación en la misma sección y materia
                    const asignada = await tablaAsignaciones.selectOne({
                        where: { id_seccion: seccion.id, id_materia: materia.id }
                    });
                    if (!asignada) {
                        await tablaAsignaciones.insert({
                            cedula_profesor: cedula,
                            id_materia: materia.id,
                            id_seccion: seccion.id
                        });
                    }
                }
            }
        }
        console.log(">> [Seed] ¡30 profesores de prueba creados y asignados exitosamente!");
    } catch (error) {
        console.error("Error al sembrar profesores de prueba:", error);
    }
}

module.exports = profesores;
module.exports.insertarProfeModelo = insertarProfeModelo;