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

