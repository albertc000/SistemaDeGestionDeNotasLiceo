
const tablaModel = require("tabla-model");
const alumnos = new tablaModel("estudiantes", {
    colums: [
        { name: "cedula", type: "varchar(45)", primary: true, defaultNull: false },
        { name: "nombre", type: "varchar(45)", defaultNull: false },
        { name: "apellido", type: "varchar(45)", defaultNull: false },
        { name: "ano", type: "varchar(45)", defaultNull: false },
        { name: "seccion", type: "varchar(10)", defaultNull: false },
        { name: "nota1", type: "integer", defaultNull: true },
        { name: "nota2", type: "integer", defaultNull: true },
        { name: "nota3", type: "integer", defaultNull: true },
        { name: "nota4", type: "integer", defaultNull: true }
    ],
});
module.exports = alumnos;