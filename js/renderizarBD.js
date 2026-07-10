//scripts para renderizar la base de datos

//funciones de la tabla
async function editarLibro(codigo) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/busquedaLibro';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'codigo';
    input.value = codigo;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
}

async function eliminarLibro(codigo, titulo) {
    const confirmar = confirm(`¿Seguro que quiere eliminar: ${titulo}?`);
    if (!confirmar) return;
    const respuesta = await fetch('/eliminarLibro', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo })
    });
    if (respuesta.ok) {
        renderizarBiblioteca();
    } else {
        alert('Error al eliminar el libro');
    }
}

async function renderizarBiblioteca() {
    //fetch hace la petición http al servidor
    //await pausa la función hasta que el servidor responda
    const respuesta = await fetch('/api/biblioteca');
    //.json() convierte la respuesta en un array de objetos JS
    const estudiantes = await respuesta.json();

    const cuerpo = document.getElementById('cuerpoTabla');
    //filas con los datos recibidos
    cuerpo.innerHTML = estudiantes.map(libro => {

        //generar etiqueta <img> con a la ruta del servidor o vacía si no tiene portada
        const imgTag = libro.portada 
            ? `<img src="/portada/${libro.portada}" alt="${libro.titulo}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);">`
            : `<div style="width: 50px; height: 70px; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #64748b; border-radius: 4px; border: 1px dashed #cbd5e1;">Sin Foto</div>`;

        return `
            <tr>
                <td>${imgTag}</td>
                <td>${libro.codigo}</td>
                <td>${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td>${libro.ano}</td>
                <td>${libro.obtencion}</td>
                <td class="cell-actions">
                    <div class="actions-container">
                        <button class="action-button btn-edit" id="lapiz" onclick="editarLibro(${libro.codigo})" title="Editar">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                        </button>
                        <button class="action-button btn-delete" id="borrador" onclick="eliminarLibro(${libro.codigo}, '${libro.titulo}')" title="Eliminar">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    console.log("exito al renderizar");
}

//busqueda
const input = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');

if (input) {
    input.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        let matchCount = 0;
        
        //consultar las filas 
        const rows = document.querySelectorAll('#cuerpoTabla tr');

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
                matchCount++;
            } else {
                row.style.display = 'none';
            }
        });

        if (emptyState) {
            emptyState.style.display = matchCount === 0 ? 'table-row-group' : 'none';
        }
    });
}


//cargar bd para panel de control
async function cargarBD(){
    const totalLibros = document.getElementById('totalLibros');
    if (!totalLibros) return;
    try{
        const respuesta = await fetch('/api/biblioteca');
        if (!respuesta.ok) {
            throw new Error('Error al cargar el archivo JSON');
        }
        const datos = await respuesta.json();
        totalLibros.textContent = (datos.length);
    }
    catch (error){
        console.error('Hubo un problema:', error);
    }
}

async function renderizarListas() {
    const respuesta = await fetch('/api/biblioteca');
    const estudiantes = await respuesta.json();
    const cuerpo = document.getElementById('cuerpoTabla');

    const ultimosTresLibros = estudiantes.slice(-3).reverse();
    //filas con los 3 ultimos libros
    cuerpo.innerHTML = ultimosTresLibros.map(libro => {
            return `
            <tr>
                <td>${libro.codigo}</td>
                <td>${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td>${libro.ano}</td>
            </tr>
        `;
    }).join('');

    const respuesta2 = await fetch('/api/biblioteca');
    const estudiantes2 = await respuesta2.json();
    const cuerpo2 = document.getElementById('cuerpoTabla2');
    const primerosTresLibros = estudiantes2.slice(0, 3);
    //filas con los 3 ultimos libros
    cuerpo2.innerHTML = primerosTresLibros.map(libro => {
            return `
            <tr>
                <td>${libro.codigo}</td>
                <td>${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td>${libro.ano}</td>
            </tr>
        `;
    }).join('');
}

async function renderizarReporte() {
    //fetch hace la petición http al servidor
    //await pausa la función hasta que el servidor responda
    const respuesta = await fetch('/api/biblioteca');
    //.json() convierte la respuesta en un array de objetos JS
    const estudiantes = await respuesta.json();

    const cuerpo = document.getElementById('cuerpoTablaReporte');
    //filas con los datos recibidos
    cuerpo.innerHTML = estudiantes.map(libro => {
        return `
            <tr>
                <td>${libro.codigo}</td>
                <td>${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td>${libro.ano}</td>
                <td>${libro.obtencion}</td>
            </tr>
        `;
    }).join('');
    console.log("exito al renderizar");
}

async function imprimirTabla() {
    let contenido = document.getElementById('impresion').innerHTML;
    let ventanaImpresion = window.open('', '_blank');
    
    ventanaImpresion.document.write('<html><head><title>Imprimir</title>');
    //estilos opcionales
    ventanaImpresion.document.write('<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; }</style>');
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.write('</body></html>');
    
    ventanaImpresion.document.close();
    ventanaImpresion.window.print();
    ventanaImpresion.close();
}


if (document.getElementById('cuerpoTabla')) {
    renderizarBiblioteca();
}

if (document.getElementById('totalLibros')) {
    cargarBD();
}

if (document.getElementById('cuerpoTabla2')) {
    renderizarListas();
}

if (document.getElementById('cuerpoTablaReporte')) {
    renderizarReporte();
}

