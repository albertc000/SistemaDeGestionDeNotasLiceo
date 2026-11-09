# Sistema de Gestión de Estudiantes y Notas — Liceo Andrés Bello

Aplicación web para la gestión académica y control de las notas de estudiantes. Permite realizar operaciones CRUD (Crear, Leer, Actualizar y Eliminar), control de notas por lapsos (1 a 4) y materias, generación de reportes y boletines, asignación docente y autenticación segura mediante JWT y bcrypt.

## Integrantes
**Programación II-VI**
- Albert Campos
- Yeferson Zambrano
- Carlos Viloria
- Sandro Montilla

---

## Instrucciones de Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/albertc000/SistemaDeGestionDeNotasLiceo
cd GestionNotasLiceo
```

### 2. Instalar dependencias del servidor
```bash
npm install
```

### 3. Iniciar la Base de Datos

Tienes varias opciones para iniciar la base de datos, **con o sin tener MySQL instalado en tu computadora**:

#### Opción A: Con Docker (Recomendada — No requiere instalar MySQL ni XAMPP)
Si tienes [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y abierto, no necesitas instalar MySQL en Windows. Puedes levantar únicamente el contenedor de la base de datos con:

```bash
docker compose up -d db
```
> **¿Qué hace este comando automáticamente?**
> - Descarga la imagen oficial de `mysql:8.0`.
> - Crea la base de datos `liceo_andres_bello` con usuario `root` y contraseña `admin`.
> - Ejecuta e importa automáticamente el archivo [`bd.sql`](./bd.sql) la primera vez.
> - Mapea el puerto `3306`, por lo que tu aplicación local en Node.js se conectará de inmediato a `localhost:3306`.
> - Mantiene los datos a salvo mediante un volumen persistente de Docker (`mysql_data`).

Para detener el contenedor de la base de datos cuando termines:
```bash
docker compose stop db
```

---

#### Opción B: Todo el Sistema en Docker (Sin MySQL ni Node.js en tu máquina)
Si prefieres no instalar dependencias en tu equipo y correr tanto la base de datos como la aplicación Express en contenedores:

```bash
docker compose up --build
```
* Ambos servicios iniciarán sincronizados y la aplicación estará disponible inmediatamente en `http://localhost:3000`.
* Para detener todo: `docker compose down`.

---

#### Opción C: Con MySQL Local Tradicional (XAMPP / MySQL Server / Workbench)
Si ya cuentas con MySQL instalado localmente:
1. Abre tu gestor (phpMyAdmin, MySQL Workbench, DBeaver, HeidiSQL o terminal).
2. Ejecuta el script [`bd.sql`](./bd.sql) para crear la base de datos `liceo_andres_bello` y sus tablas.
   * *Alternativa desde la consola de comandos:*
     ```bash
     mysql -u root -p < bd.sql
     ```

---

### 4. Configurar las Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto basándote en la plantilla `.env.example`:

```env
PORT=3000
JWT_SECRET=claveJwtAqui
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin
DB_NAME=liceo_andres_bello
```
> **Nota:** Si usaste **Docker (Opción A)**, las credenciales por defecto son usuario `root` y contraseña `admin`. Si usaste MySQL local (Opción C), ajusta `DB_USER` y `DB_PASSWORD` según tu configuración.

---

### 5. Iniciar la Aplicación en Local
Si levantaste la base de datos con la **Opción A** o la **Opción C**, arranca el servidor Node.js:

```bash
npm start
```
O en modo desarrollo con recarga automática:
```bash
node --watch server.js
```

La aplicación estará accesible en: **`http://localhost:3000`**

---

## Credenciales de Acceso por Defecto

Al arrancar el servidor por primera vez, el sistema sincroniza automáticamente el usuario administrador inicial:

- **Usuario:** `admin`
- **Contraseña:** `admin`

---

## Ejecución en Computadoras sin Docker ni MySQL (Base de Datos Cloud)

Si necesitas desplegar o correr la aplicación en una computadora donde no puedas instalar Docker ni MySQL:
1. Crea una base de datos MySQL gratuita en un proveedor cloud (como [Aiven](https://aiven.io/), [Railway](https://railway.app/), [Clever Cloud](https://www.clever-cloud.com/) o [Render](https://render.com/)).
2. Importa el script [`bd.sql`](./bd.sql) en el gestor del servicio cloud.
3. En el archivo `.env`, apunta a las credenciales remotas:
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

## Descripción del Proyecto

Aplicación Web para el Registro y Control de Notas del Liceo "Andrés Bello", permitiendo entrar tanto a personal Administrativo para asignación de estudiantes y profesores, así como dictar inicios y finales de lapsos; personal Docente que subirá las notas correspondientes a sus materias y estudiantes al sistema; y al Departamento de Control de Estudio quien podrá hacer seguimiento de dichas notas, así como generar reportes y boletines de calificaciones.
