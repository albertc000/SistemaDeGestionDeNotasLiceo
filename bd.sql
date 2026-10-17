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
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `cedula` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `apellido` VARCHAR(45) NOT NULL,
  `ano` VARCHAR(45) NOT NULL,
  `seccion` VARCHAR(10) NOT NULL,
  `nota1` INT(11) DEFAULT 0,
  `nota2` INT(11) DEFAULT 0,
  `nota3` INT(11) DEFAULT 0,
  `nota4` INT(11) DEFAULT 0,
  PRIMARY KEY (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Nota: Al iniciar el servidor Node.js por primera vez, el usuario administrador
-- ("admin" con contraseña "admin") se inicializa de forma automática en la tabla `usuarios`.