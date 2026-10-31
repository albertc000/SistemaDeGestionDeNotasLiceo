// Scripts para renderizar y gestionar el listado de profesores

let listaCompletaProfesores = [];

// Función para navegar al formulario de edición
function editarProfesor(cedula) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/busquedaProfesor';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'cedula';
    input.value = cedula;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
}

// Función para eliminar directamente desde el listado
async function eliminarProfesorDirecto(cedula, nombreCompleto) {
    const confirmar = confirm(`¿Está seguro de que desea eliminar al profesor ${nombreCompleto} (C.I. ${cedula})?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetch('/eliminarProfesor', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula })
        });

        const resultado = await respuesta.json();
        if (resultado.exito) {
            cargarProfesores();
        } else {
            alert(resultado.mensaje || 'Error al eliminar el profesor');
        }
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
        alert('Error de conexión al intentar eliminar.');
    }
}

// Cargar profesores desde la API del backend
async function cargarProfesores() {
    try {
        const respuesta = await fetch('/api/profesores');
        listaCompletaProfesores = await respuesta.json();
        aplicarFiltroBusqueda();
    } catch (error) {
        console.error("Error al cargar profesores:", error);
    }
}

// Filtrar la lista por el campo de texto de búsqueda
function aplicarFiltroBusqueda() {
    const input = document.getElementById('searchInput');
    const termino = input ? input.value.trim().toLowerCase() : '';
    
    let resultado = listaCompletaProfesores;
    if (termino !== '') {
        resultado = listaCompletaProfesores.filter(prof => {
            const ced = String(prof.cedula || '').toLowerCase();
            const nom = `${prof.nombre || ''} ${prof.seg_nombre || ''}`.toLowerCase();
            const ape = `${prof.apellido || ''} ${prof.seg_apellido || ''}`.toLowerCase();
            const telf = String(prof.telefono || '').toLowerCase();
            const dir = String(prof.direccion || '').toLowerCase();
            return ced.includes(termino) || nom.includes(termino) || ape.includes(termino) || telf.includes(termino) || dir.includes(termino);
        });
    }

    const contador = document.getElementById('contadorProfesores');
    if (contador) contador.textContent = resultado.length;

    renderizarFilas(resultado);
}

// Restablecer la búsqueda
function mostrarTodosLosProfesores() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    aplicarFiltroBusqueda();
}

// Renderizar las filas en la tabla
function renderizarFilas(profesores) {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!cuerpo) return;

    if (!profesores || profesores.length === 0) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                    No hay profesores registrados que coincidan con la búsqueda.
                </td>
            </tr>
        `;
        return;
    }

    cuerpo.innerHTML = profesores.map(prof => {
        const nombreCompleto = `${prof.nombre || ''} ${prof.seg_nombre ? prof.seg_nombre + ' ' : ''}${prof.apellido || ''} ${prof.seg_apellido ? prof.seg_apellido : ''}`.trim();
        const generoTexto = prof.genero === 'F' ? 'Femenino' : (prof.genero === 'M' ? 'Masculino' : '-');
        const badgeGenero = prof.genero === 'F' 
            ? 'background: #fdf2f8; color: #db2777; border: 1px solid #fbcfe8; padding: 3px 8px; border-radius: 6px; font-weight: 500;' 
            : 'background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; font-weight: 500;';

        return `
            <tr>
                <td style="font-weight: 500;">V-${prof.cedula}</td>
                <td style="font-weight: 600;">${nombreCompleto}</td>
                <td>${prof.telefono || '-'}</td>
                <td>${prof.direccion || '-'}</td>
                <td class="cell-actions">
                    <div class="actions-container" style="display: flex; gap: 0.4rem;">
                        <button class="action-button btn-edit" onclick="editarProfesor('${prof.cedula}')" title="Modificar Profesor">
                            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/>
                                <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Configurar eventos al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    cargarProfesores();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', aplicarFiltroBusqueda);
    }
});
