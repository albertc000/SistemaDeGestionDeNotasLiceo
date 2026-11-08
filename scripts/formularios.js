// Scripts para los formularios de añadir, modificar y eliminar estudiantes y profesores

function mostrarError(mensaje) {
    const divError = document.getElementById('mensaje-error');
    if (divError) {
        divError.innerText = mensaje;
        divError.style.display = 'block';
        divError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert(mensaje);
    }
}

function limpiarError() {
    const divError = document.getElementById('mensaje-error');
    if (divError) {
        divError.style.display = 'none';
        divError.innerText = '';
    }
}

// Validación integral de datos de persona (estudiante / profesor)
function validarCamposPersona(formData, validarCedula = true) {
    if (validarCedula) {
        const cedula = (formData.get('cedula') || '').trim();
        if (!cedula) {
            return 'La cédula de identidad es obligatoria.';
        }
        if (!/^\d{8}$/.test(cedula)) {
            return 'La cédula debe tener exactamente 8 dígitos numéricos (ej: 30123456).';
        }
    }

    const nombre = (formData.get('nombre') || '').trim();
    if (!nombre) {
        return 'El primer nombre es obligatorio y no puede estar vacío.';
    }
    if (nombre.length < 2) {
        return 'El primer nombre debe tener al menos 2 caracteres.';
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(nombre)) {
        return 'El primer nombre solo puede contener letras.';
    }

    const apellido = (formData.get('apellido') || '').trim();
    if (!apellido) {
        return 'El primer apellido es obligatorio y no puede estar vacío.';
    }
    if (apellido.length < 2) {
        return 'El primer apellido debe tener al menos 2 caracteres.';
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(apellido)) {
        return 'El primer apellido solo puede contener letras.';
    }

    const segNombre = (formData.get('seg_nombre') || formData.get('segnombre') || '').trim();
    if (segNombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segNombre)) {
        return 'El segundo nombre solo puede contener letras.';
    }

    const segApellido = (formData.get('seg_apellido') || formData.get('segapellido') || '').trim();
    if (segApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(segApellido)) {
        return 'El segundo apellido solo puede contener letras.';
    }

    return null;
}

// Restricciones automáticas en inputs
function aplicarRestriccionesInputs() {
    document.querySelectorAll('input[name="cedula"]').forEach(input => {
        if (!input.readOnly) {
            input.setAttribute('maxlength', '8');
            input.setAttribute('inputmode', 'numeric');
            input.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').slice(0, 8);
            });
        }
    });

    document.querySelectorAll('input[name="nombre"], input[name="seg_nombre"], input[name="segnombre"], input[name="apellido"], input[name="seg_apellido"], input[name="segapellido"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarRestriccionesInputs);
} else {
    aplicarRestriccionesInputs();
}

// ==========================================
// Formulario añadir estudiante
// ==========================================
const formulario = document.querySelector('#formulario');

if (formulario) {
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        limpiarError();

        const datosEstudiante = new FormData(formulario);
        const errorValidacion = validarCamposPersona(datosEstudiante, true);
        if (errorValidacion) {
            mostrarError(errorValidacion);
            return;
        }

        try {
            const respuesta = await fetch('/nuevoEstudiante', {
                method: 'POST',
                body: datosEstudiante
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    mostrarError(resultado.mensaje);
                } else {
                    const params = new URLSearchParams(window.location.search);
                    const fromUrl = params.get('from') || (document.getElementById('inputFromUrl') ? document.getElementById('inputFromUrl').value : '/listado');
                    const sep = fromUrl.includes('?') ? '&' : '?';
                    window.location.href = `${fromUrl}${sep}msg=estudiante_guardado`; 
                }
            } else {
                console.error('Error HTTP en la petición');
                mostrarError('Error en el servidor al procesar la solicitud.');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
            mostrarError('Fallo de conexión al enviar el formulario.');
        }
    });
}

// ==========================================
// Formulario editar estudiante
// ==========================================
const formEditar = document.querySelector('#formEditar');

if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        limpiarError();

        const datosEstudiante = new FormData(formEditar);
        const errorValidacion = validarCamposPersona(datosEstudiante, false);
        if (errorValidacion) {
            mostrarError(errorValidacion);
            return;
        }

        try {
            const respuesta = await fetch('/editarEstudiante', {
                method: 'PUT',
                body: datosEstudiante
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    mostrarError(resultado.mensaje);
                } else {
                    const params = new URLSearchParams(window.location.search);
                    const fromUrl = params.get('from') || (document.getElementById('inputFromUrl') ? document.getElementById('inputFromUrl').value : '/listado');
                    const sep = fromUrl.includes('?') ? '&' : '?';
                    window.location.href = `${fromUrl}${sep}msg=estudiante_guardado`; 
                }
            } else {
                console.error('Error HTTP en la petición');
                mostrarError('Error en el servidor al procesar la solicitud.');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
            mostrarError('Fallo de conexión al enviar el formulario.');
        }
    });
}

// ==========================================
// Formulario eliminar estudiante
// ==========================================
const formEliminar = document.querySelector('#formEliminar');

if (formEliminar) {
    formEliminar.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const confirmar = confirm("¿Está seguro de que desea eliminar a este estudiante?");
        if (!confirmar) return;

        const datosEstudiante = new FormData(formEliminar);
        const objectData = Object.fromEntries(datosEstudiante.entries());

        try {
            const respuesta = await fetch('/eliminarEstudiante', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(objectData)
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                if (resultado.exito) {
                    const params = new URLSearchParams(window.location.search);
                    const fromUrl = params.get('from') || (document.getElementById('inputFromUrl') ? document.getElementById('inputFromUrl').value : '/listado');
                    const sep = fromUrl.includes('?') ? '&' : '?';
                    window.location.href = `${fromUrl}${sep}msg=` + encodeURIComponent('Estudiante eliminado con éxito'); 
                } else {
                    alert(resultado.mensaje || 'Error al eliminar');
                }
            } else {
                console.error('Error HTTP en la petición');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}

// ==========================================
// Formulario añadir profesor
// ==========================================
const formRegistroProfesor = document.querySelector('#formRegistroProfesor');

if (formRegistroProfesor) {
    formRegistroProfesor.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        limpiarError();

        const datosProfesor = new FormData(formRegistroProfesor);
        const errorValidacion = validarCamposPersona(datosProfesor, true);
        if (errorValidacion) {
            mostrarError(errorValidacion);
            return;
        }

        const telf = (datosProfesor.get('telefono') || '').trim();
        if (!telf) {
            mostrarError('El teléfono de contacto es obligatorio.');
            return;
        }

        try {
            const respuesta = await fetch('/nuevoProfesor', {
                method: 'POST',
                body: datosProfesor
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    mostrarError(resultado.mensaje);
                } else {
                    window.location.href = '/listadoProfesores?msg=profesor_guardado'; 
                }
            } else {
                console.error('Error HTTP en la petición');
                mostrarError('Error en el servidor al procesar la solicitud.');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
            mostrarError('Fallo de conexión al enviar el formulario.');
        }
    });
}

// ==========================================
// Formulario editar profesor
// ==========================================
const formEditarProfesor = document.querySelector('#formEditarProfesor');

if (formEditarProfesor) {
    formEditarProfesor.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        limpiarError();

        const datosProfesor = new FormData(formEditarProfesor);
        const errorValidacion = validarCamposPersona(datosProfesor, false);
        if (errorValidacion) {
            mostrarError(errorValidacion);
            return;
        }

        const telf = (datosProfesor.get('telefono') || '').trim();
        if (!telf) {
            mostrarError('El teléfono de contacto es obligatorio.');
            return;
        }

        try {
            const respuesta = await fetch('/editarProfesor', {
                method: 'PUT',
                body: datosProfesor
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    mostrarError(resultado.mensaje);
                } else {
                    window.location.href = '/listadoProfesores?msg=profesor_guardado'; 
                }
            } else {
                console.error('Error HTTP en la petición');
                mostrarError('Error en el servidor al procesar la solicitud.');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
            mostrarError('Fallo de conexión al enviar el formulario.');
        }
    });
}

// ==========================================
// Formulario eliminar profesor
// ==========================================
const formEliminarProfesor = document.querySelector('#formEliminarProfesor');

if (formEliminarProfesor) {
    formEliminarProfesor.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const confirmar = confirm("¿Está seguro de que desea eliminar a este profesor?");
        if (!confirmar) return;

        const datosProfesor = new FormData(formEliminarProfesor);
        const objectData = Object.fromEntries(datosProfesor.entries());

        try {
            const respuesta = await fetch('/eliminarProfesor', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(objectData)
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                if (resultado.exito) {
                    window.location.href = '/listadoProfesores?msg=' + encodeURIComponent('Profesor eliminado con éxito'); 
                } else {
                    alert(resultado.mensaje || 'Error al eliminar el profesor');
                }
            } else {
                console.error('Error HTTP en la petición');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}
