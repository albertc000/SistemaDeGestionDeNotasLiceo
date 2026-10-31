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

## ¿Cómo ejecutar en otra computadora sin MySQL instalado?

El proyecto está diseñado para funcionar en cualquier otra máquina **sin necesidad de instalar ni configurar MySQL Server localmente**, a través de las siguientes alternativas:

### Opción A: Levantar Todo con Docker (Recomendado — No requiere MySQL ni Node.js)
Si la otra computadora tiene [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado:
1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta un único comando:
   ```bash
   docker compose up --build
   ```
> **¿Qué hace automáticamente?**
> - Descarga e inicia un contenedor MySQL 8.0 con la base de datos `liceo_andres_bello` y ejecuta [bd.sql](./bd.sql) automáticamente.
> - Espera mediante un *healthcheck* a que MySQL esté listo para recibir conexiones.
> - Construye el contenedor de Node.js, instala dependencias y corre la aplicación.
> - Inicializa automáticamente grados, secciones, materias y el usuario administrador `admin`.
> - **Acceso:** Abre tu navegador en **`http://localhost:3000`**.

Para detener el sistema:
```bash
docker compose down
```

---

### Opción B: Base de Datos en Docker + Node.js en Local
Si en esa computadora se cuenta con Node.js pero no se desea instalar el servicio de MySQL en Windows/Linux:
```bash
# 1. Levanta únicamente el contenedor de MySQL en segundo plano
docker compose up -d db

# 2. Inicia la aplicación Node normalmente
npm install
npm start
```
> La base de datos se expone en `localhost:3306` (usuario `root`, contraseña `admin`), y la aplicación Node se conectará automáticamente con los valores predeterminados.

---

### Opción C: Computadora sin MySQL y sin Docker (Base de Datos en la Nube)
Si la computadora no dispone de virtualización ni Docker:
1. Crea una base de datos MySQL gratuita en un proveedor cloud (como [Aiven](https://aiven.io/), [Railway](https://railway.app/), [Clever Cloud](https://www.clever-cloud.com/) o [Render](https://render.com/)).
2. Importa el script [`bd.sql`](./bd.sql) en el gestor del servicio cloud.
3. En la computadora donde corre la aplicación, crea el archivo `.env` apuntando a las credenciales remotas:
   ```env
   PORT=3000
   JWT_SECRET=tu_clave_secreta
   DB_HOST=servidor-remoto.com
   DB_PORT=3306
   DB_USER=tu_usuario_remoto
   DB_PASSWORD=tu_contrasena_remota
   DB_NAME=liceo_andres_bello
   ```
4. Ejecuta `npm install` y luego `npm start`.

---

## Credenciales de Acceso por Defecto

Al arrancar el servidor por primera vez, el sistema sincroniza automáticamente el usuario administrador inicial:

- **Usuario:** `admin`
- **Contraseña:** `admin`

## Descripción del Proyecto Completo

Nuestro Proyecto consistiría en una Aplicación Web para el Registro y Control de Notas del Liceo "Andrés Bello", permitiendo entrar tanto a personal Administrativo para asignación de estudiantes y profesores, así como dictar inicios y finales de lapsos; personal Docente que subirá las notas correspondientes a sus materias y estudiantes al sistema; y al Departamento de Control de Estudio quien podrá hacer seguimiento de dichas notas, así como generar reportes y boletines respectivamente.