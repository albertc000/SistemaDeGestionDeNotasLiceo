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

module.exports = profesores;
module.exports.insertarProfeModelo = insertarProfeModelo;