//clase para libros y sus funciones
const fs = require("fs");

class Libro {
    codigo;     //texto/numero
    titulo;     //texto
    autor;      //texto
    ano;        //numero
    obtencion;  //texto
    portada;    //imagen

    constructor(codigo, titulo, autor, ano, obtencion, portada) {
        this.codigo = codigo;
        this.titulo = titulo;
        this.autor = autor;
        this.ano = ano;
        this.obtencion = obtencion;
        this.portada = portada;
    }
}

class Biblioteca {

    listaLibros = [];
    JsonName = "";

    constructor(JsonName) {
        this.JsonName = JsonName;
        if (fs.existsSync(JsonName)) {
            const dataBase = fs.readFileSync(JsonName, "utf8");
            //console.log(dataBase);
            const data = JSON.parse(dataBase).listaLibros;
            //console.log(data); 
            this.listaLibros = data.map(a => new Libro(a.codigo, a.titulo, a.autor, a.ano, a.obtencion, a.portada));
        } else {
            const dataBase = JSON.stringify({ listaLibros: [] }, null, 2);
            fs.writeFileSync(JsonName, dataBase);
        }
    }


    registrarLibro(codigo, titulo, autor, ano, obtencion, portada) {
        const nuevoLibro = new Libro(codigo, titulo, autor, ano, obtencion, portada);
        this.listaLibros.push(nuevoLibro);
    }

    eliminarLibro(codigo) {
        let libro = this.listaLibros.findIndex(libro => libro.codigo === codigo);
        if (libro !== -1) {
            this.listaLibros.splice(libro, 1);
        }
    }

    buscarLibro(codigo) {
        return this.listaLibros.find(libro => libro.codigo == codigo);
    }

    modificarLibro(codigo, titulo, autor, ano, obtencion, portada) {
        let libro = this.buscarLibro(codigo);
        libro.titulo = titulo;
        libro.autor = autor;
        libro.ano = ano;
        libro.obtencion = obtencion;
        if (portada)
        {
            libro.portada = portada;
        }
    }

    existeLibro(codigo) {
        return this.listaLibros.some(libro => libro.codigo == codigo);
    }

    cerrarBD() {
        const dataBase = JSON.stringify({ listaLibros: this.listaLibros }, null, 2);
        fs.writeFileSync(this.JsonName, dataBase);
    }
}

module.exports.Libro = Libro;
module.exports.Biblioteca = Biblioteca;