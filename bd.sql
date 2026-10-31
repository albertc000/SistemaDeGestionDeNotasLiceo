-- ========================================================
-- Base de Datos: liceo_andres_bello
-- Sistema de Gestión de Estudiantes y Notas
-- ========================================================

CREATE DATABASE IF NOT EXISTS `liceo_andres_bello` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `liceo_andres_bello`;

-- --------------------------------------------------------
-- Estructura para la tabla `usuarios`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(100) NOT NULL,
  `hash` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura para la tabla `estudiantes`
-- --------------------------------------------------------
--
--CREATE TABLE IF NOT EXISTS `estudiantes` (
--  `cedula` VARCHAR(45) NOT NULL,
--  `nombre` VARCHAR(45) NOT NULL,
--  `seg_nombre` VARCHAR(45),
--  `apellido` VARCHAR(45) NOT NULL,
--  `seg_apellido` VARCHAR(45),
--  `genero` VARCHAR(1),
--  `direccion` VARCHAR(45),
--  `ano` VARCHAR(45) NOT NULL,
--  `seccion` VARCHAR(10) NOT NULL,
--  `nota1` INT(11) DEFAULT 0,
--  `nota2` INT(11) DEFAULT 0,
--  `nota3` INT(11) DEFAULT 0,
--  `nota4` INT(11) DEFAULT 0,
--  PRIMARY KEY (`cedula`)
--) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura para la tabla `profesores`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profesores` (
 `cedula` VARCHAR(45) NOT NULL,
 `nombre` VARCHAR(45) NOT NULL,
  `seg_nombre` VARCHAR(45),
  `apellido` VARCHAR(45) NOT NULL,
  `seg_apellido` VARCHAR(45),
  `genero` VARCHAR(1),
  `direccion` VARCHAR(45),
  `telefono` VARCHAR(45),
  PRIMARY KEY (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Nota: Al iniciar el servidor Node.js por primera vez, el usuario administrador
-- ("admin" con contraseña "admin") se inicializa de forma automática en la tabla `usuarios`.

-- datos del estudiante
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `cedula` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(50) NOT NULL,
  `seg_nombre` VARCHAR(50),
  `apellido` VARCHAR(50) NOT NULL,
  `seg_apellido` VARCHAR(50),
  `genero` ENUM('M', 'F') DEFAULT 'M',
  `direccion` VARCHAR(150),
  `telefono` VARCHAR(20),
  PRIMARY KEY (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- períodos escolares
CREATE TABLE IF NOT EXISTS `periodos_academicos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(20) NOT NULL, -- '2025-2026'
  `activo` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- grados o años de estudio
CREATE TABLE IF NOT EXISTS `grados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(30) NOT NULL -- '1er Año', '2do Año', etc.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- secciones vinculadas a un grado
CREATE TABLE IF NOT EXISTS `secciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_grado` INT NOT NULL,
  `letra` VARCHAR(5) NOT NULL, -- 'A', 'B', 'C'
  FOREIGN KEY (`id_grado`) REFERENCES `grados`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- materias (asociadas al grado y opcionalmente al profesor que la dicta)
CREATE TABLE IF NOT EXISTS `materias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(80) NOT NULL, -- 'Matemáticas', 'Física'
  `id_grado` INT NOT NULL,
  `cedula_profesor` VARCHAR(45) NULL,
  FOREIGN KEY (`id_grado`) REFERENCES `grados`(`id`),
  FOREIGN KEY (`cedula_profesor`) REFERENCES `profesores`(`cedula`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- inscripción: vincula al estudiante con su sección y período actual
CREATE TABLE IF NOT EXISTS `inscripciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cedula_estudiante` VARCHAR(45) NOT NULL,
  `id_seccion` INT NOT NULL,
  `id_periodo` INT NOT NULL,
  UNIQUE KEY `uk_estudiante_periodo` (`cedula_estudiante`, `id_periodo`),
  FOREIGN KEY (`cedula_estudiante`) REFERENCES `estudiantes`(`cedula`) ON DELETE CASCADE,
  FOREIGN KEY (`id_seccion`) REFERENCES `secciones`(`id`),
  FOREIGN KEY (`id_periodo`) REFERENCES `periodos_academicos`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- calificaciones: cada nota es un registro individual por materia y lapso
CREATE TABLE IF NOT EXISTS `calificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_inscripcion` INT NOT NULL,
  `id_materia` INT NOT NULL,
  `lapso` TINYINT NOT NULL,
  `nota` DECIMAL(4,2) DEFAULT 0.00,
  FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripciones`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_materia`) REFERENCES `materias`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;