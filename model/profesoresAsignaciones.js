const tablaModel = require("tabla-model");
const profesorAsignaciones = new tablaModel("profesor_asignaciones", {
    colums: [
        { name: "id", type: "integer", primary: true, autoincrement: true },
        { name: "cedula_profesor", type: "varchar(45)", defaultNull: false },
        { name: "id_materia", type: "integer", defaultNull: false },
        { name: "id_seccion", type: "integer", defaultNull: false }
    ]
});
module.exports = profesorAsignaciones;