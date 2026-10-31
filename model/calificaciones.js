const tablaModel = require("tabla-model");

const calificaciones = new tablaModel("calificaciones", {
    colums: [
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true },
        { name: "id_inscripcion", type: "integer", defaultNull: false },
        { name: "id_materia", type: "integer", defaultNull: false },
        { name: "lapso", type: "integer", defaultNull: false },
        { name: "nota", type: "decimal(4,2)", defaultNull: false },
    ]
});

module.exports = calificaciones;