//scripts para los formularios de añadir y modificar

//formulario añadir
const formulario = document.querySelector('#formulario');

if(formulario){
    formulario.addEventListener('submit', async (e) => {
        // evitar que el formulario recargue la página
        e.preventDefault(); 

        // datos del formulario
        const libro = new FormData(formulario);

        // enviar datos con fetch
        try {
            const respuesta = await fetch('/nuevoLibro', {
                method: 'POST',
                body: libro
            });
            //console.log(nuevoLibro.get('codigo'));

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    //hubo un error de validación en el servidor
                    const divError = document.getElementById('mensaje-error');
                    divError.innerText = resultado.mensaje;
                    divError.style.display = 'block';
                } else {
                    //todo bien
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


//formularios editar y eliminar
const formEditar = document.querySelector('#formEditar');

if (formEditar){
    formEditar.addEventListener('submit', async (e) => {
        // evitar que el formulario recargue la página
        e.preventDefault(); 

        // datos del formulario
        const libro = new FormData(formEditar);

        // enviar datos con fetch
        try {
            const respuesta = await fetch('/editarLibro', {
                method: 'PUT',
                body: libro
            });
            //console.log(nuevoLibro.get('codigo'));

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                
                if (resultado.exito === false) {
                    //hubo un error de validación en el servidor
                    const divError = document.getElementById('mensaje-error');
                    divError.innerText = resultado.mensaje;
                    divError.style.display = 'block';
                } else {
                    //todo bien
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

//eliminar
const formEliminar = document.querySelector('#formEliminar');

if (formEliminar){
    formEliminar.addEventListener('submit', async (e) => {
        // evitar que el formulario recargue la página
        e.preventDefault(); 

        const confirmar = confirm("¿Está seguro de que desea eliminar este libro?");
        if (!confirmar) return;
        // datos del formulario
        const libro = new FormData(formEliminar);

        // enviar datos con fetch
        try {
            const respuesta = await fetch('/eliminarLibro', {
                method: 'DELETE',
                body: libro
            });
            //console.log(nuevoLibro.get('codigo'));

            if (respuesta.ok) {
                const resultado = await respuesta.json();
                //console.log('Datos enviados:', resultado);
                window.location.href = '/listado'; 
            } else {
                console.error('Error');
            }
        } catch (error) {
            console.error('Fallo de red:', error);
        }
    });
}


//renderizar portada en el formulario de registro antes de añadir
const inputPortada = document.getElementById('inputPortada');
const imgVistaPrevia = document.getElementById('vistaPrevia');
const placeholder = document.getElementById('vistaPreviaPlaceholder');
if (inputPortada) {
    inputPortada.addEventListener('change', function(event) {
        //obtener el primer archivo seleccionado
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            //generar una URL temporal en memoria del navegador
            const objectURL = URL.createObjectURL(file);
            //asignar el objectURL al src del tag img y mostrarlo
            imgVistaPrevia.src = objectURL;
            imgVistaPrevia.style.display = 'block';
            //ocultar el estado de "Sin archivo"
            placeholder.style.display = 'none';
        } else {
            //si cancela la selección o el archivo no es válido, restaurar el estado inicial
            imgVistaPrevia.src = '';
            imgVistaPrevia.style.display = 'none';
            placeholder.style.display = 'flex';
        }
    });
}