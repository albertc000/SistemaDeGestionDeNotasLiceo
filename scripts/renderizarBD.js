// Scripts para renderizar la base de datos de estudiantes y calificaciones

// Funciones de la tabla principales
function editarEstudiante(cedula) {
    window.location.href = `/estudiante/${cedula}/editar`;
}

function irACalificaciones(cedula) {
    window.location.href = `/estudiante/${cedula}/notas`;
}

let listaCompletaEstudiantes = [];
//cargar estudiantes desde la API existente
async function iniciarFiltrosSelect() {
    try {
        const respuesta = await fetch('/api/estudiantes');
        listaCompletaEstudiantes = await respuesta.json();
        
        // Renderizar todos inicialmente
        aplicarFiltrosSelect();
    } catch (error) {
        console.error("Error al cargar estudiantes:", error);
    }
}


//funcion que se ejecuta cada vez que cambia el año o la seccion
function aplicarFiltrosSelect() {
    const elAno = document.getElementById('filtroAno');
    const elSec = document.getElementById('filtroSeccion');
    if (!elAno || !elSec) return;

    const anoSeleccionado = elAno.value;
    const seccionSeleccionada = elSec.value;
    let resultado = listaCompletaEstudiantes;
    if (anoSeleccionado !== "") {
        resultado = resultado.filter(est => est.ano === anoSeleccionado);
    }
    if (seccionSeleccionada !== "") {
        resultado = resultado.filter(est => est.seccion === seccionSeleccionada);
    }
    const contador = document.getElementById('contadorAlumnosFiltrados');
    if (contador) contador.textContent = resultado.length;
    renderizarFilas(resultado);
}

//boton mostrar todos
function mostrarTodosLosEstudiantes() {
    const elAno = document.getElementById('filtroAno');
    const elSec = document.getElementById('filtroSeccion');
    if (elAno) elAno.value = "";
    if (elSec) elSec.value = "";
    aplicarFiltrosSelect();
}

//renderizar las filas en la tabla existente
function renderizarFilas(estudiantes) {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!cuerpo) return;
    // Si hubo un error en la API o no es un arreglo
    if (!Array.isArray(estudiantes)) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #dc2626;">
                    Error al cargar los datos desde el servidor. Verifique la base de datos.
                </td>
            </tr>
        `;
        return;
    }
    if (estudiantes.length === 0) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                    No hay estudiantes registrados con los criterios seleccionados.
                </td>
            </tr>
        `;
        return;
    }
    cuerpo.innerHTML = estudiantes.map(est => {
        const prom = Number(est.promedio) || 0;
        const esAprobado = est.estado === "Aprobado" || prom >= 10;
        const colorEstado = esAprobado ? "color: #16a34a; font-weight: 600;" : "color: #dc2626; font-weight: 600;";
        return `
            <tr>
                <td style="font-weight: 500;">${est.cedula}</td>
                <td style="font-weight: 600;">${est.nombre} ${est.seg_nombre} ${est.apellido} ${est.seg_apellido}</td>
                <td>${est.ano || '-'}</td>
                <td>${est.seccion || '-'}</td>
                <td><span style="${colorEstado}">${est.estado || (esAprobado ? "Aprobado" : "Reprobado")}</span></td>
                <td class="cell-actions">
                    <div class="actions-container" style="display: flex; justify-content: flex-end; gap: 0.4rem;">
                        <button class="action-button btn-pres" onclick="irACalificaciones('${est.cedula}')" title="Gestionar Calificaciones">
                            <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.414a1 1 0 0 1 .293-.707l4.414-4.414A1 1 0 0 1 10 2h8a1 1 0 0 1 1 1Z"/>
                            </svg>
                        </button>
                        <button class="action-button btn-edit" onclick="editarEstudiante('${est.cedula}')" title="Modificar Datos Personales">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

//iniciar al cargar el DOM si los filtros existen en la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filtroAno')) {
        iniciarFiltrosSelect();
    }
});
async function eliminarEstudiante(cedula, nombreCompleto) {
    const confirmar = confirm(`¿Seguro que desea eliminar al estudiante: ${nombreCompleto}?`);
    if (!confirmar) return;
    const respuesta = await fetch('/eliminarEstudiante', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula })
    });
    if (respuesta.ok) {
        renderizarEstudiantes();
    } else {
        alert('Error al eliminar el estudiante');
    }
}

async function renderizarEstudiantes() {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!cuerpo) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        if (!respuesta.ok) {
            cuerpo.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al consultar los estudiantes.</td></tr>`;
            return;
        }
        const estudiantes = await respuesta.json();
        if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No hay estudiantes registrados actualmente.</td></tr>`;
            return;
        }

        cuerpo.innerHTML = estudiantes.map(est => {
            const prom = Number(est.promedio) || 0;
            const esAprobado = est.estado === "Aprobado" || prom >= 10;
            const colorEstado = esAprobado ? "color: #16a34a; font-weight: 600;" : "color: #dc2626; font-weight: 600;";

            return `
                <tr>
                    <td style="font-weight: 500;">${est.cedula}</td>
                    <td style="font-weight: 600;">${est.nombre} ${est.apellido}</td>
                    <td>${est.ano || '-'}</td>
                    <td>${est.seccion || '-'}</td>
                    <td><span style="${colorEstado}">${est.estado || (esAprobado ? "Aprobado" : "Reprobado")}</span></td>
                    <td class="cell-actions">
                        <div class="actions-container" style="display: flex; justify-content: flex-end; gap: 0.4rem;">
                            <button class="action-button btn-pres" onclick="irACalificaciones('${est.cedula}')" title="Gestionar Calificaciones">
                                <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.414a1 1 0 0 1 .293-.707l4.414-4.414A1 1 0 0 1 10 2h8a1 1 0 0 1 1 1Z"/>
                                </svg>
                            </button>
                            <button class="action-button btn-edit" onclick="editarEstudiante('${est.cedula}')" title="Modificar Datos Personales">
                                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error al renderizar los estudiantes:', error);
    }
}

//busqueda
const input = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');

if (input) {
    input.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        let matchCount = 0;
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

//modal boleta


function cerrarModal() {
    const modal = document.getElementById('modalDetalle');
    if (modal) modal.style.display = 'none';
}

//cargar indicadores de la base de datos para el panel de control
async function cargarBD() {
    const totalEstudiantes = document.getElementById('totalEstudiantes');
    const totalProfesores = document.getElementById('totalProfesores');
    const aprobados = document.getElementById('estudiantesPrestados');
    const reprobados = document.getElementById('estudiantesReprobados');
    const promedioGeneral = document.getElementById('promedioGeneral');

    if (!totalEstudiantes && !aprobados && !reprobados && !promedioGeneral && !totalProfesores) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        if (!respuesta.ok) throw new Error('Error al cargar la base de datos');
        const estudiantes = await respuesta.json();

        const total = estudiantes.length;
        if (totalEstudiantes) totalEstudiantes.textContent = total;

        const aprobados = estudiantes.filter(e => (Number(e.promedio) || 0) >= 10 || e.estado === "Aprobado").length;
        if (aprobados) aprobados.textContent = aprobados;

        const reprobados = total - aprobados;
        if (reprobados) reprobados.textContent = reprobados;

        if (promedioGeneral) {
            if (total === 0) {
                promedioGeneral.textContent = "0.00";
            } else {
                const sumaPromedios = estudiantes.reduce((acc, curr) => acc + (Number(curr.promedio) || 0), 0);
                promedioGeneral.textContent = (sumaPromedios / total).toFixed(2);
            }
        }

        const respuestaProf = await fetch('/api/profesores');
        if (!respuestaProf.ok) throw new Error('Error al cargar la base de datos de Profesores');
        const profesores = await respuestaProf.json();

        const totalProf = profesores.length;
        if (totalProfesores) totalProfesores.textContent = totalProf;
    } catch (error) {
        console.error('Problema al cargar métricas del panel de control:', error);
    }

}

//renderizar minitablas del dashboard
async function renderizarListas() {
    const cuerpo = document.getElementById('cuerpoTabla');
    const cuerpo2 = document.getElementById('cuerpoTabla2');
    if (!cuerpo && !cuerpo2) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        const estudiantes = await respuesta.json();

        if (cuerpo) {
            const ultimos = estudiantes.slice(-3).reverse();
            cuerpo.innerHTML = ultimos.map(est => `
                <tr>
                    <td>${est.cedula}</td>
                    <td>${est.nombre} ${est.apellido}</td>
                    <td>${est.ano || '-'} ${est.seccion || ''}</td>
                    <td style="font-weight: bold;">${(Number(est.promedio) || 0).toFixed(2)} pts</td>
                </tr>
            `).join('');
        }

        if (cuerpo2) {
            const primeros = estudiantes.slice(0, 3);
            cuerpo2.innerHTML = primeros.map(est => `
                <tr>
                    <td>${est.cedula}</td>
                    <td>${est.nombre} ${est.apellido}</td>
                    <td>${est.ano || '-'} ${est.seccion || ''}</td>
                    <td style="font-weight: bold;">${(Number(est.promedio) || 0).toFixed(2)} pts</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Error al renderizar minitablas:', err);
    }
}

//renderizar reporte imprimible


async function imprimirTabla() {
    let contenido = document.getElementById('impresion').innerHTML;
    let ventanaImpresion = window.open('', '_blank');
    
    ventanaImpresion.document.write('<html><head><title>Imprimir Reporte Escolar</title>');
    ventanaImpresion.document.write('<style>table { border-collapse: collapse; width: 100%; font-family: sans-serif; } th, td { border: 1px solid #000; padding: 8px; text-align: center; } th { background-color: #f2f2f2; }</style>');
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.write('</body></html>');
    
    ventanaImpresion.document.close();
    ventanaImpresion.window.print();
    ventanaImpresion.close();
}

if (document.getElementById('cuerpoTabla') && window.location.pathname.includes('/listado')) {
    renderizarEstudiantes();
}

if (document.getElementById('totalEstudiantes')) {
    cargarBD();
}

if (document.getElementById('totalProfesores')) {
    cargarBD();
}

if (document.getElementById('cuerpoTabla2')) {
    renderizarListas();
}

if (document.getElementById('cuerpoTablaReporte') && document.getElementById('cuerpoTablaReporte').children.length === 0) {
    renderizarReporte();
}


