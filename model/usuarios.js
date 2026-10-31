const tablaModel = require("tabla-model")
const bcrypt = require('bcryptjs');
/*
 Modelo de Usuarios
 */
const usuarios = new tablaModel("usuarios", {
    colums: [ // Respetando la sintaxis 'colums' de la librería
        { name: "id", type: "integer", primary: true, defaultNull: false, autoincrement: true, },
        { name: "user", type: "varchar(100)", defaultNull: false, },
        { name: "hash", type: "varchar(255)", defaultNull: true, // Permitir NULL para usuarios de Google 
        }
    ],
})

async function inicializarUsuarioAdmin(db) {
    try {
        const tabla = db.tabla('usuarios');
        
        //hash de la palabra "admin"
        const rootPass = "admin";
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(rootPass, salt);
        //verificar si ya existe
        const existe = await tabla.selectOne({ where: { user: 'admin' } });
        
        if (!existe) {
            await tabla.insert({
                user: "admin",
                hash: hashedPass
            });
            console.log(">> [MySQL] Usuario 'admin' creado exitosamente.");
        } else {
            //si ya existe se actualiza
            await tabla.updateById({ hash: hashedPass }, existe.id);
            console.log(">> [MySQL] Contraseña de 'admin' sincronizada correctamente.");
        }
    } catch (error) {
        console.error("Error al inicializar el usuario admin:", error);
    }
}

module.exports = usuarios;
module.exports.inicializarUsuarioAdmin = inicializarUsuarioAdmin;