const tablaModel = require("tabla-model");

const materias = new tablaModel("materias", {
    colums: [
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true },
        { name: "nombre", type: "varchar(80)", defaultNull: false },
        { name: "id_grado", type: "integer", defaultNull: false },
        { name: "cedula_profesor", type: "varchar(45)", defaultNull: true }
    ]
});
module.exports = materias;

async function inicializarMaterias(db) {
    try {
        const tablaMaterias = db.tabla('materias');
        const tablaGrados = db.tabla('grados');
        const materias = await tablaMaterias.select();
        if (!materias || materias.length === 0) {
            const gradosRegistrados = await tablaGrados.select();
            const totalMaterias = ["Biología", "Matemática", "Física", "Química", "Educación Física", "GHC", "Inglés", "Castellano"];
            for (const grado of gradosRegistrados) {
                for (const nombre of totalMaterias) {
                    await tablaMaterias.insert({ 
                        nombre: nombre,
                        id_grado: grado.id
                    });
                }
            }
            console.log(">> [MySQL] Materias inicializadas para todos los grados.");
        }
    } catch (error) {
        console.error("Error al inicializar materias:", error);
    }
}

module.exports = materias;
module.exports.inicializarMaterias = inicializarMaterias;