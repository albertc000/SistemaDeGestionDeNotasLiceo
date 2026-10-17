//clase para estudiantes y sus funciones
const fs = require("fs");

class Alumno {
    cedula;             //texto/numero
    nombre;             //texto
    apellido;           //texto
    ano;                //numero/texto
    seccion;            //texto
    nota1;              //numero
    nota2;              //numero
    nota3;              //numero
    nota4;              //numero

    constructor(cedula, nombre, apellido, ano, seccion, nota1, nota2, nota3, nota4) {
        this.cedula = cedula;
        this.nombre = nombre;
        this.apellido = apellido;
        this.ano = ano;
        this.seccion = seccion;
        this.nota1 = Number(nota1) || 0;
        this.nota2 = Number(nota2) || 0;
        this.nota3 = Number(nota3) || 0;
        this.nota4 = Number(nota4) || 0;
    }

    calcularPromedio() {
        const suma = Number(this.nota1) + Number(this.nota2) + Number(this.nota3) + Number(this.nota4);
        return parseFloat((suma / 4).toFixed(2));
    }

    obtenerEstado() {
        return this.calcularPromedio() >= 10 ? "Aprobado" : "Reprobado";
    }
}

class Estudiantes {

    listaEstudiantes = [];
    JsonName = "";

    constructor(JsonName) {
        this.JsonName = JsonName;
        if (fs.existsSync(JsonName)) {
            try {
                const dataBase = fs.readFileSync(JsonName, "utf8");
                if (!dataBase || dataBase.trim() === "") {
                    this.listaEstudiantes = [];
                    this.cerrarBD();
                } else {
                    const parsed = JSON.parse(dataBase);
                    const data = parsed.listaEstudiantes || [];
                    this.listaEstudiantes = data.map(a => new Alumno(
                        a.cedula, 
                        a.nombre, 
                        a.apellido, 
                        a.ano,
                        a.seccion,
                        a.nota1, 
                        a.nota2, 
                        a.nota3, 
                        a.nota4
                    ));
                }
            } catch (err) {
                this.listaEstudiantes = [];
                this.cerrarBD();
            }
        } else {
            const dataBase = JSON.stringify({ listaEstudiantes: [] }, null, 2);
            fs.writeFileSync(JsonName, dataBase);
        }
    }

    registrarAlumno(cedula, nombre, apellido, ano, seccion, nota1, nota2, nota3, nota4) {
        const nuevoAlumno = new Alumno(cedula, nombre, apellido, ano, seccion, nota1, nota2, nota3, nota4);
        this.listaEstudiantes.push(nuevoAlumno);
    }

    existeAlumno(cedula) {
        return this.listaEstudiantes.some(alumno => String(alumno.cedula) === String(cedula));
    }

    eliminarAlumno(cedula) {
        let index = this.listaEstudiantes.findIndex(alumno => String(alumno.cedula) === String(cedula));
        if (index !== -1) {
            this.listaEstudiantes.splice(index, 1);
        }
    }

    buscarAlumno(cedula) {
        return this.listaEstudiantes.find(alumno => String(alumno.cedula) === String(cedula));
    }

    modificarAlumno(cedula, nombre, apellido, ano, seccion, nota1, nota2, nota3, nota4) {
        let alumno = this.buscarAlumno(cedula);
        if (alumno) {
            alumno.nombre = nombre;
            alumno.apellido = apellido;
            alumno.ano = ano;
            alumno.seccion = seccion;
            alumno.nota1 = Number(nota1) || 0;
            alumno.nota2 = Number(nota2) || 0;
            alumno.nota3 = Number(nota3) || 0;
            alumno.nota4 = Number(nota4) || 0;
        }
    }

    cerrarBD() {
        const dataBase = JSON.stringify({ listaEstudiantes: this.listaEstudiantes }, null, 2);
        fs.writeFileSync(this.JsonName, dataBase);
    }
}

module.exports.Alumno = Alumno;
module.exports.Estudiantes = Estudiantes;