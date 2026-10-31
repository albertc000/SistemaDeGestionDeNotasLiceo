const tablaModel = require("tabla-model");
const periodosAcademicos = new tablaModel("periodos_academicos", {
    colums: [
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true },
        { name: "nombre", type: "varchar(20)", defaultNull: false },
        { name: "activo", type: "boolean", defaultNull: false }
    ]
});

async function inicializarPeriodo(db) {
    try {
        const tabla = db.tabla('periodos_academicos');
        const periodos = await tabla.select();
        if (!periodos || periodos.length === 0) {
            await tabla.insert({
                nombre: "2025-2026",
                activo: 1
            });
            console.log(">> [MySQL] Período '2025-2026' inicializado.");
        }
    } catch (error) {
        console.error("Error al inicializar período:", error);
    }
}
module.exports = periodosAcademicos;
module.exports.inicializarPeriodo = inicializarPeriodo;