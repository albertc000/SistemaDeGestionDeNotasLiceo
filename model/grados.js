const tablaModel = require("tabla-model");

const grados = new tablaModel("grados", {
    colums: [
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true },
        { name: "nombre", type: "varchar(30)", defaultNull: false }
    ]
});


async function inicializarGrados(db) {
    try {
        const tabla = db.tabla('grados');
        const lista = await tabla.select();
        if (!lista || lista.length === 0) {
            const anos = ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"];
            for (const nombre of anos) {
                await tabla.insert({ nombre });
            }
            console.log(">> [MySQL] Grados escolares inicializados (1ero a 5to).");
        }
    } catch (error) {
        console.error("Error al inicializar grados:", error);
    }
}
module.exports = grados;
module.exports.inicializarGrados = inicializarGrados;