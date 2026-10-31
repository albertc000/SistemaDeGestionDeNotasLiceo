//scripts para los formularios de añadir, modificar y eliminar estudiantes

//formulario añadir estudiante
const formulario = document.querySelector('#formulario');

if (formulario) {
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const datosEstudiante = new FormData(formulario);

        try {
            const respuesta = await fetch('/nuevoEstudiante', {
                method: 'POST',
                body: datosEstudiante
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    const divError = document.getElementById('mensaje-error');
                    if (divError) {
                        divError.innerText = resultado.mensaje;
                        divError.style.display = 'block';
                    } else {
                        alert(resultado.mensaje);
                    }
                } else {
                    window.location.href = '/listado'; 
                }
            } else {
                console.error('Error HTTP en la petición');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}

//formulario editar estudiante
const formEditar = document.querySelector('#formEditar');

if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const datosEstudiante = new FormData(formEditar);

        try {
            const respuesta = await fetch('/editarEstudiante', {
                method: 'PUT',
                body: datosEstudiante
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    const divError = document.getElementById('mensaje-error');
                    if (divError) {
                        divError.innerText = resultado.mensaje;
                        divError.style.display = 'block';
                    } else {
                        alert(resultado.mensaje);
                    }
                } else {
                    window.location.href = '/listado'; 
                }
            } else {
                console.error('Error HTTP en la petición');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}

//formulario eliminar estudiante
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
                    window.location.href = '/listado'; 
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
// Formularios de Profesores
// ==========================================

// Formulario añadir profesor
const formRegistroProfesor = document.querySelector('#formRegistroProfesor');

if (formRegistroProfesor) {
    formRegistroProfesor.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const datosProfesor = new FormData(formRegistroProfesor);

        try {
            const respuesta = await fetch('/nuevoProfesor', {
                method: 'POST',
                body: datosProfesor
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    const divError = document.getElementById('mensaje-error');
                    if (divError) {
                        divError.innerText = resultado.mensaje;
                        divError.style.display = 'block';
                    } else {
                        alert(resultado.mensaje);
                    }
                } else {
                    window.location.href = '/listadoProfesores'; 
                }
            } else {
                console.error('Error HTTP en la petición');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}

// Formulario editar profesor
const formEditarProfesor = document.querySelector('#formEditarProfesor');

if (formEditarProfesor) {
    formEditarProfesor.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const datosProfesor = new FormData(formEditarProfesor);

        try {
            const respuesta = await fetch('/editarProfesor', {
                method: 'PUT',
                body: datosProfesor
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    const divError = document.getElementById('mensaje-error');
                    if (divError) {
                        divError.innerText = resultado.mensaje;
                        divError.style.display = 'block';
                    } else {
                        alert(resultado.mensaje);
                    }
                } else {
                    window.location.href = '/listadoProfesores'; 
                }
            } else {
                console.error('Error HTTP en la petición');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}

// Formulario eliminar profesor
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
                    window.location.href = '/listadoProfesores'; 
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

