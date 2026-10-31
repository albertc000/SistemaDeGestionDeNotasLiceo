const tablaModel = require("tabla-model");

const inscripciones = new tablaModel("inscripciones", {
    colums: [
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true },
        { name: "cedula_estudiante", type: "varchar(20)", defaultNull: false },
        { name: "id_seccion", type: "integer", defaultNull: false },
        { name: "id_periodo", type: "integer", defaultNull: false }
    ]
});
module.exports = inscripciones;