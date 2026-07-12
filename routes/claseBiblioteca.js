//clase para libros y sus funciones
const fs = require("fs");

class Libro {
    codigo;             //texto/numero
    titulo;             //texto
    autor;              //texto
    ano;                //numero
    obtencion;          //comprado donado u otro
    portada;            //imagen
    estado;             //disponible o prestado
    historialPrestamos; //arreglo con datos del lector

    constructor(codigo, titulo, autor, ano, obtencion, portada, estado = "Disponible", historialPrestamos = []) {
        this.codigo = codigo;
        this.titulo = titulo;
        this.autor = autor;
        this.ano = ano;
        this.obtencion = obtencion;
        this.portada = portada;
        this.estado = estado;
        this.historialPrestamos = historialPrestamos;
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
            this.listaLibros = data.map(a => new Libro(
                a.codigo, 
                a.titulo, 
                a.autor, 
                a.ano, 
                a.obtencion, 
                a.portada, 
                a.estado || "Disponible", 
                a.historialPrestamos || []));
        } else {
            const dataBase = JSON.stringify({ listaLibros: [] }, null, 2);
            fs.writeFileSync(JsonName, dataBase);
        }
    }

    registrarLibro(codigo, titulo, autor, ano, obtencion, portada) {
        const nuevoLibro = new Libro(codigo, titulo, autor, ano, obtencion, portada);
        this.listaLibros.push(nuevoLibro);
    }

    existeLibro(codigo) {
        return this.listaLibros.some(libro => libro.codigo == codigo);
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

    prestarLibro(codigo, lector, fechaSalida, fechaDevolucion) {
        const libro = this.buscarLibro(codigo);
        if (!libro) {
            throw new Error("El libro no existe.");
        }
        
        if (libro.estado !== "Disponible") {
            throw new Error("El libro no se encuentra Disponible para ser prestado.");
        }

        libro.estado = "Prestado";
        libro.historialPrestamos.push({
            lector: lector,
            fechaSalida: fechaSalida,
            fechaDevolucion: fechaDevolucion,
            fechaEntregaReal: null
        });
        return true;
    }

    devolverLibro(codigo) {
        const libro = this.buscarLibro(codigo);
        if (!libro) {
            throw new Error("El libro no existe.");
        }
        if (libro.estado !== "Prestado") {
            throw new Error("El libro no está Prestado.");
        }
        libro.estado = "Disponible";
        
        //actualizar la fecha de entrega real en el ultimo registro del historial
        if (libro.historialPrestamos.length > 0) {
            libro.historialPrestamos[libro.historialPrestamos.length - 1].fechaEntregaReal = new Date().toISOString().split('T')[0];
        }
        return true;
    }

    cerrarBD() {
        const dataBase = JSON.stringify({ listaLibros: this.listaLibros }, null, 2);
        fs.writeFileSync(this.JsonName, dataBase);
    }
}

module.exports.Libro = Libro;
module.exports.Biblioteca = Biblioteca;