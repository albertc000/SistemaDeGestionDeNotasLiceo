# Esquema de la Base de Datos

```mermaid
---
config:
  theme: dark
  look: handDrawn
  fontFamily: '''Recursive Variable'', sans-serif'
  themeVariables:
    fontFamily: '''Recursive Variable'', sans-serif'
---
erDiagram
    usuarios {
        int id PK
        varchar user
        varchar hash
    }
    estudiantes {
        varchar cedula PK
        varchar nombre
        varchar seg_nombre
        varchar apellido
        varchar seg_apellido
        enum genero
        varchar direccion
        varchar telefono
    }
    profesores {
        varchar cedula PK
        varchar nombre
        varchar seg_nombre
        varchar apellido
        varchar seg_apellido
        varchar genero
        varchar direccion
        varchar telefono
    }
    periodos_academicos {
        int id PK
        varchar nombre
        boolean activo
    }
    grados {
        int id PK
        varchar nombre
    }
    secciones {
        int id PK
        int id_grado FK
        varchar letra
    }
    materias {
        int id PK
        varchar nombre
        int id_grado FK
        varchar cedula_profesor FK
    }
    inscripciones {
        int id PK
        varchar cedula_estudiante FK
        int id_seccion FK
        int id_periodo FK
    }
    calificaciones {
        int id PK
        int id_inscripcion FK
        int id_materia FK
        tinyint lapso
        decimal nota
    }
    grados ||--o{ secciones : "tiene"
    grados ||--o{ materias : "contiene"
    profesores ||--o{ materias : "imparte"
    estudiantes ||--o{ inscripciones : "cursa"
    secciones ||--o{ inscripciones : "ubica a"
    periodos_academicos ||--o{ inscripciones : "en el periodo"
    inscripciones ||--o{ calificaciones : "recibe"
    materias ||--o{ calificaciones : "evaluada en"
```

## Relaciones

1. Grados y Secciones (1 a N): Un grado (ej: 1er Año) agrupa varias secciones (A, B, C).

2. Grados y Materias (1 a N): Las materias pertenecen a un grado específico del plan de estudio (ej: Matemática de 1er Año).

3. Profesores y Materias (1 a N, opcional): Un profesor puede tener asignada una o varias materias. Si no tiene profesor asignado todavía, el campo cedula_profesor admite NULL.

4. Inscripciones (Entidad Puente central): Conecta al estudiante, su sección (y por ende su grado) y el periodo académico vigente (ej: 2025-2026). Posee una restricción única (cedula_estudiante, id_periodo) para evitar que un alumno se inscriba dos veces en el mismo año escolar.

5. Calificaciones (1 a N desde inscripciones y materias): Cada fila representa una evaluación individual identificada por su lapso (1, 2, 3 o 4) y su nota. Permite que el sistema sea escalable: las notas no están fijas como columnas (nota1, nota2), sino como registros individuales por materia y lapso.

6. Usuarios: Tabla independiente utilizada para el inicio de sesión y autenticación con contraseña encriptada (bcrypt) y token JWT.
