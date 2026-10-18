# Sistema de Gestión de Estudiantes y Notas — Liceo Andrés Bello

Aplicación web para la gestión académica y control de las notas de estudiantes. Permite realizar operaciones CRUD (Crear, Leer, Actualizar y Eliminar), control de notas (evaluaciones 1 a 4), reportes y autenticación mediante JWT.


## Integrantes
**Programación II-VI**
- Albert Campos
- Yeferson Zambrano
- Carlos Viloria
- Sandro Montilla


## Instrucciones de Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/albertc000/SistemaDeGestionDeNotasLiceo
cd GestionNotasLiceo
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar la Base de Datos en MySQL
1. Abra su gestor de base de datos MySQL (phpMyAdmin, MySQL Workbench, HeidiSQL, DBeaver o terminal).
2. Ejecuta el script incluido [`bd.sql`](./bd.sql). Este script creará la base de datos `liceo_andres_bello` y sus tablas correspondientes (`usuarios` y `estudiantes`).
   * *Alternativa desde la consola de MySQL:*
     ```bash
     mysql -u root -p < bd.sql
     ```

### 4. Configurar las Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto basándote en la plantilla `.env.example`:

```env
PORT=3000
JWT_SECRET=claveJwtAqui
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ContrasenaSQLAqui
DB_NAME=liceo_andres_bello
```
> **Nota:** Ajusta `DB_USER` y `DB_PASSWORD` según tu configuración local de MySQL.

### 5. Iniciar el Servidor
```bash
npm start
```
O bien:
```bash
node server.js
```

La aplicación estará accesible en: `http://localhost:3000`

---

## Credenciales de Acceso por Defecto

Al arrancar el servidor por primera vez, el sistema sincroniza automáticamente el usuario administrador inicial:

- **Usuario:** `admin`
- **Contraseña:** `admin`

## Descripción del Proyecto Completo

Nuestro Proyecto consistiría en una Aplicación Web para el Registro y Control de Notas del Liceo "Andrés Bello", permitiendo entrar tanto a personal Administrativo para asignación de estudiantes y profesores, así como dictar inicios y finales de lapsos; personal Docente que subirá las notas correspondientes a sus materias y estudiantes al sistema; y al Departamento de Control de Estudio quien podrá hacer seguimiento de dichas notas, así como generar reportes y boletines respectivamente.


