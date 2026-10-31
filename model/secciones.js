const tablaModel = require("tabla-model");

const secciones = new tablaModel("secciones", {
    colums: [
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true },
        { name: "id_grado", type: "integer", defaultNull: false },
        { name: "letra", type: "varchar(5)", defaultNull: false }
    ]
});

async function inicializarSecciones(db) {
    try {
        const tablaSecciones = db.tabla('secciones');
        const tablaGrados = db.tabla('grados');
        const lista = await tablaSecciones.select();
        
        if (!lista || lista.length === 0) {
            const gradosRegistrados = await tablaGrados.select();
            for (const grado of gradosRegistrados) {
                for (const letra of ['A', 'B', 'C', 'D']) {
                    await tablaSecciones.insert({
                        id_grado: grado.id,
                        letra: letra
                    });
                }
            }
            console.log(">> [MySQL] Secciones (A, B, C, D) inicializadas.");
        }
    } catch (error) {
        console.error("Error al inicializar secciones:", error);
    }
}
module.exports = secciones;
module.exports.inicializarSecciones = inicializarSecciones;