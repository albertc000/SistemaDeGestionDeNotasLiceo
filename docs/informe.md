# Informe de nuestro Proyecto

## Aplicación Web para el Control de Gestión de Estudio del Liceo "Andrés Bello"

| **Nombre del sistema** | Sistema para la Gestión de Notas y Estudio |
| **Institución** | Liceo "Andrés Bello", Sabana Grande, Municipio Bolivar, Edo. Trujillo |
| **Integrantes del equipo** | Albert Campos, Yeferson Zambrano, Carlos Viloria, Sandro Montilla |
| **Tipo de sistema** | Aplicación web para la Gestión de Control de Estudio y de las Notas |

## Introducción

Como estudiantes del PNF en Informática hemos realizado un Proyecto con el fin de crear una alternativa de solución a una dificultad vista dentro de la Institución Liceo "Andres Bello", utilizando nuestros conocimientos en la carrera en conjunto con la ayuda del personal de la misma.

## Diagnóstico de la Situación

El diagnóstico situacional es un método que nos permite analizar el estado actual de una comunidad u organización en específico: sus problemas, sus necesidades o sus intereses.

De forma que empezamos con las visitas presenciales a la Institución con una primera visita en noviembre del año 2024, siendo recibidos por el entonces Director Institucional Lcdo. Eyber Palomares, con el objetivo de indagar cualquier tipo de necesidad o situación tal que requiera ser resuelta, ya sea dentro o fuera de los parámetros de la informática. Allí se nos informó de las distintas necesidades que posee la institución, tales como la reparación de los baños, zonas con falta de iluminación, así como otras necesidades en la infraestructura como la restauración del techo de la institución o la impermeabilizante del comedor; sin embargo también se nos notificó de las necesidades del lado de la informática, principalmente dentro del área de Control de Estudio así como en la Dirección.

Seguidamente, en una segunda visita en diciembre del 2024 a las 11:00 am nos dirigimos a la Oficina del Departamento de Control de Notas, donde fuimos atendidos por la Profesora Dilis Díaz con el fin de identificar dichas necesidades, encontrándonos con que aunque cuentan con el personal suficiente y dedicado, cuentan con dificultades con por ejemplo los equipos, ya sea computadores insuficientes o desactualizados así como con presencia de virus, de igual modo observamos que continúan llevando su labor de Control de Estudio respecto al registro y control de notas principalmente de manera física, con las problemáticas que eso conlleva tales como falta de espacio en las librerías y deterioro de los papeles y carpetas mas antiguas.

Es por esto que, gracias a distintas entrevistas y reuniones con el personal, llegamos a la conclusión que la necesidad mas apremiante dentro de el ámbito de la Informática es la necesidad de un registro y control digital de las notas del Liceo, así como una forma de guardar esos registros antiguos para poder preservarlos de una mejor manera y a su vez mejorar y facilitar el flujo de trabajo de la institución.

## Alternativa de Solución 

Partiendo de esta premisa, se optó como una alternativa de solución para el Liceo “Andrés Bello”, de la Parroquia Sabana Grande, Municipio Bolívar, Estado Trujillo, desarrollar una página web destinada a llevar el registro y control de notas de los estudiantes, pero no solo las notas definitivas, sino también las notas de cada evaluación. De forma que tanto el personal Docente, como Directivo como Control de Estudio puedan acceder al sistema, donde Directivo se encarga de la carga de estudiantes y profesores al sistema, así como la asignación a sus respectivos secciones y materias correspondientes, además de dictar cuando inicia o cierra cada lapso pedagógico y cada año escolar. El personal Docente podrá acceder para subir las notas correspondientes a su o sus materias dentro de los años y secciones de los que es profesor. Y por ultimo Control de Estudio es quien se encargaría de gestionar todas las notas para que no haya ninguna clase de error, así como generar las discusiones de notas correspondientes y general los reportes, boletines, constancias y demás procesos que les corresponde a cada estudiante y sección.

## Objetivos

### Objetivo General

Realizar un sistema de una aplicación web para el registro y control de notas del Liceo "Andrés Bello"

### Objetivos Específicos

- Administración de cada Estudiante y Profesor, contando registros, modificaciones y eliminaciones.
- Gestión adecuada de las notas, con un recuento por materias, lapsos y años.
- Automatización de procedimientos tales como reportes, boletines, certificados, etc.
- Asegurar el acceso mediante la identificación de usuario y sesión con vigencia definida.
- Posibilitar el escalamiento del sistema a nuevas funcionalidades futuras.

## Realización Técnica

Desde el punto de vista técnico el sistema está contemplado a crearse como una aplicación web usando JavaScript para la lógica del mismo, así como MySQL para la base de datos, junto a autenticación por tokens para los usuarios.

Se ha realizado como una aplicación web como fin de que la institución no tenga que recurrir a infraestructura extra para el uso de la misma, además que los distintos usuarios podrían utilizar el sistema desde otro lugar sin estar necesariamente dentro de la institución.

## Funciones del Sistema

- Acceso Identificado: Correspondiendo a los datos de cada profesor respectivamente, más usuarios para control de estudio y administrativo
- Panel de Control y Menú Latera: Un dashboard con un resumen y acceso a datos relevantes para cada tipo de usuario, junto un menú lateral con acceso a las funciones correspondientes a cada rol
- Gestión de Estudiantes y Profesores: Como entidades principales, dentro del usuario administrativo se podrán registrar, modificar y eliminar los estudiantes y profesores, así como asignarlos a sus respectivos secciones, años y materias en el caso de los profesores
- Listados: El sistema generará tablas listados de los estudiantes (y profesores) mostrando sus datos de forma legible y resumida, en donde dependiendo del tipo de usuario se mostraran tanto secciones concretas como funciones concretas: Un docente podrá ver los estudiantes a su cargo con la posibiliad de cargas las notas de su materia correspondiente; control de estudio podrá ver todos los estudiantes con sus notas y podrá generar tanto reportes como boletines, certificados entre otros; y administrativo podrá revisar todos los estudiantes y sus notas
- Automatización del ciclo escolar: Administrativo podrá dictar la finalización y comienzo de los lapsos y años escolares, permitiendo que no se carguen ni modifiquen notas en periodos en los que no corresponde

## Alcance Actual

Actualmente el sistema es un prototipo, el cual cumple con las funciones básicas de registro y control de profesores, estudiantes y sus notas, así como la emisión imprimible de un reporte sencillo. Nuestra proyección a futuro es cumplir con todas las funciones planeadas y que el sistema se pueda probar efectivamente en la institución.

Puesto que contamos con limitaciones de conocimiento iremos implementando el resto de funciones conforme avancemos dentro de la carrera.

## Conclusión

Este sistema busca solventar una dificultad existente, la gestión de estudio fisica dentro del Liceo "Andrés Bello", además busca facilitar y mejorar el flujo de trabajo de toda la institución, beneficiando tanto al propio cuerpo docente, de control de estudio y administrativo, como a los estudiantes puesto que será mas facil la gestion de sus notas y procedimiento de documentos.