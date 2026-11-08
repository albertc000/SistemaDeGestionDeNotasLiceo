# Esquema de la Base de Datos

```mermaid
---
config:
  theme: dark
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
    profesor_asignaciones {
        int id PK
        varchar cedula_profesor FK
        int id_materia FK
        int id_seccion FK
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
    profesores ||--o{ materias : "titular_de"
    profesores ||--o{ profesor_asignaciones : "imparte"
    materias ||--o{ profesor_asignaciones : "asignada_en"
    secciones ||--o{ profesor_asignaciones : "recibe_docente"
    estudiantes ||--o{ inscripciones : "cursa"
    secciones ||--o{ inscripciones : "ubica_a"
    periodos_academicos ||--o{ inscripciones : "en_el_periodo"
    inscripciones ||--o{ calificaciones : "recibe"
    materias ||--o{ calificaciones : "evaluada_en"
```

## Relaciones

1. **Grados y Secciones (1 a N):** Un grado (ej: 1er Año) agrupa varias secciones (A, B, C).
2. **Grados y Materias (1 a N):** Las materias pertenecen a un grado específico del plan de estudio (ej: Matemática de 1er Año).
3. **Profesores y Materias (1 a N, opcional):** Un profesor puede ser titular referencial de materias. Si no tiene profesor asignado todavía, el campo `cedula_profesor` admite `NULL`.
4. **Asignaciones de Profesores (`profesor_asignaciones` - Entidad Puente Ternaria):** Modela la relación N a M entre profesores, materias y secciones específicas (ej: el Prof. Pérez dicta *Matemática* en la sección *1er Año "A"*). Permite que distintas secciones tengan distintos profesores para la misma asignatura.
5. **Inscripciones (`inscripciones` - Entidad Puente Central):** Conecta al estudiante, su sección (y por ende su grado) y el período académico vigente (ej: 2025-2026). Posee la restricción única `UNIQUE KEY (cedula_estudiante, id_periodo)` para evitar que un alumno se inscriba dos veces en el mismo año escolar.
6. **Calificaciones (`calificaciones` - 1 a N):** Cada fila representa una evaluación individual identificada por su lapso (1, 2, 3 o 4) y su nota (escala 0.00 a 20.00). Permite atomicidad y escalabilidad sin columnas estáticas, vinculando la inscripción y la materia cursada.
7. **Usuarios (`usuarios`):** Tabla independiente utilizada para el inicio de sesión y autenticación con contraseña encriptada (`bcrypt`) y token de sesión (`JWT`).
